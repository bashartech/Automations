import stripe
import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.database import get_db, async_session
from app.models.orm import CreditPack, User, CreditTransaction
from app.models.candidate_schemas import (
    CreditPackResponse, CreditBalanceResponse, CreditTransactionResponse,
    CreateCheckoutRequest, CreateCheckoutResponse,
)
from app.dependencies import get_current_user
from app.services.credit_service import add_credits
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/credits", tags=["credits"])

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


@router.get("/packs", response_model=list[CreditPackResponse])
async def list_packs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CreditPack).where(CreditPack.active.is_(True)))
    return result.scalars().all()


@router.get("/balance", response_model=CreditBalanceResponse)
async def get_balance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(User.credits_remaining).where(User.id == current_user.id)
    )
    return CreditBalanceResponse(credits_remaining=result.scalar() or 0)


@router.get("/history", response_model=list[CreditTransactionResponse])
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CreditTransaction)
        .where(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.post("/create-checkout", response_model=CreateCheckoutResponse)
async def create_checkout(
    request: CreateCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(CreditPack).where(
            CreditPack.id == request.pack_id,
            CreditPack.active.is_(True),
            CreditPack.stripe_price_id.isnot(None),
        )
    )
    pack = result.scalar_one_or_none()
    if not pack:
        raise HTTPException(status_code=404, detail="Credit pack not found")

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{
                "price": pack.stripe_price_id,
                "quantity": 1,
            }],
            client_reference_id=current_user.id,
            metadata={"pack_id": pack.id, "user_id": current_user.id},
            success_url="http://localhost:3000/billing?success=1",
            cancel_url="http://localhost:3000/pricing?cancelled=1",
        )
    except Exception as e:
        logger.error("Stripe checkout creation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

    return CreateCheckoutResponse(
        url=session.url,
        credits_added=0,
        success=True,
        mock=False,
    )


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        if event["type"] == "checkout.session.completed":
            s = event["data"]["object"].to_dict()
            meta = s.get("metadata", {}) or {}
            user_id = s.get("client_reference_id") or meta.get("user_id")
            pack_id = meta.get("pack_id")
            sess_id = s.get("id")

            if not user_id or not pack_id:
                logger.error("Webhook: missing user_id or pack_id in session %s", sess_id)
                return {"status": "ignored", "reason": "missing_meta"}

            async with async_session() as db:
                result = await db.execute(
                    select(CreditPack).where(CreditPack.id == pack_id)
                )
                pack = result.scalar_one_or_none()
                if not pack:
                    logger.error("Webhook: no pack for id %s", pack_id)
                    return {"status": "ignored", "reason": "unknown_pack"}

                try:
                    await add_credits(db, user_id, pack.credits, f"purchase_{pack.name.lower().replace(' ', '_')}", stripe_session_id=sess_id)
                except IntegrityError:
                    await db.rollback()
                    logger.info("Webhook: session %s already processed (unique constraint), skipping", sess_id)
                    return {"status": "ignored", "reason": "duplicate_session"}
                logger.info("Webhook: added %d credits to user %s (session %s)", pack.credits, user_id, sess_id)
    except Exception as e:
        logger.error("Webhook error: %s", e, exc_info=True)
        return {"status": "error", "detail": str(e)}

    return {"status": "ok"}
