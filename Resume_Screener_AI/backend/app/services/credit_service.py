from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update as sa_update
from app.models.orm import User, CreditTransaction


async def get_credit_balance(db: AsyncSession, user_id: str) -> int:
    result = await db.execute(select(User.credits_remaining).where(User.id == user_id))
    return result.scalar() or 0


async def has_sufficient_credits(db: AsyncSession, user_id: str, amount: int) -> bool:
    balance = await get_credit_balance(db, user_id)
    return balance >= amount


async def deduct_credits(db: AsyncSession, user_id: str, amount: int, reason: str = "resume_processed"):
    await db.execute(
        sa_update(User)
        .where(User.id == user_id)
        .values(credits_remaining=User.credits_remaining - amount)
    )
    db.add(CreditTransaction(
        user_id=user_id,
        amount=-amount,
        reason=reason,
    ))
    await db.commit()


async def add_credits(db: AsyncSession, user_id: str, amount: int, reason: str, stripe_session_id: str | None = None):
    await db.execute(
        sa_update(User)
        .where(User.id == user_id)
        .values(credits_remaining=User.credits_remaining + amount)
    )
    db.add(CreditTransaction(
        user_id=user_id,
        amount=amount,
        reason=reason,
        stripe_session_id=stripe_session_id,
    ))
    await db.commit()
