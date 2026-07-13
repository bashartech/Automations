Overall Architecture

Your application becomes:

                Your Website
         (Next.js + FastAPI)

                    │
                    │
          User clicks Buy Plan
                    │
                    ▼
              Stripe Checkout
                    │
      (Stripe handles payment securely)
                    │
                    ▼
           Payment Successful
                    │
                    ▼
        Stripe sends Webhook
                    │
                    ▼
             FastAPI Backend
                    │
                    ▼
         Update Database
                    │
                    ▼
      Add Credits to User Account
                    │
                    ▼
          User can process resumes

Notice something important:

Your website never stores credit card information.

Stripe does everything related to cards.

Phase 1 — Before Writing Any Code
Step 1

Finish your application.

Meaning:

Authentication ✅
Dashboard ✅
Candidate page ✅
Resume Upload ✅
AI Processing ✅
Credit deduction logic (later)

Don't integrate Stripe until your product is basically complete.

Step 2

Create Pricing Plans

Do NOT go to Stripe yet.

First decide your business model.

Example:

Plan	Price	Credits
Free	$0	20
Starter	$39	500
Professional	$79	2000
Enterprise	Contact Sales	Unlimited

These numbers become your business rules.

Phase 2 — Database

Before Stripe...

Create database tables.

Plans
plans

id

name

price

credits

description

active

Example

id	name	price	credits
1	Starter	19	500
2	Professional	79	5000
User Subscription
subscriptions

id

user_id

plan_id

status

renewal_date

stripe_customer_id

stripe_subscription_id
Credits
credit_balance

user_id

remaining_credits
Credit History
credit_transactions

user_id

amount

reason

created_at
Phase 3 — UI

Now build the UI.

Pricing Page
/

Pricing

Example

Starter

$19

500 resumes

Buy Now
Professional

$79

5000 resumes

Buy Now

Don't connect Stripe yet.

Just design it.

Billing Page

Inside Dashboard

Dashboard

↓

Billing

Show

Current Plan

Starter

Remaining Credits

485

Renewal Date

August 15

Upgrade

Manage Billing

Invoices

Still no Stripe.

Phase 4 — Create Stripe Account

Now go to Stripe.

The process is generally:

Create a Stripe account.
Complete business verification if required.
Switch to Test Mode while developing.

In Test Mode you can simulate payments without charging real money.

Phase 5 — Create Products in Stripe

In the Stripe Dashboard you'll create products that mirror your database plans.

Example:

Product:

Starter Plan

Price:

$19/month

Stripe creates an internal Price ID.

Example:

price_xxxxxxxxx

Save this.

Do the same for:

Professional

and

Enterprise
Phase 6 — Store Stripe IDs

Update your Plans table.

plans

id

name

credits

price

stripe_price_id

Example

Starter

price_xxxxx

Now your application knows which Stripe product corresponds to each plan.

Phase 7 — User Clicks Buy

User visits

Pricing

Clicks

Buy Starter

Your frontend sends:

plan_id = Starter

to FastAPI.

Phase 8 — Backend Creates Checkout

FastAPI:

Finds Starter.
Reads Stripe Price ID.
Creates a Checkout Session.
Returns a Checkout URL.

Your frontend redirects the browser to that URL.

At this point the user is no longer on your website.

They are on Stripe's secure checkout page.

Phase 9 — Payment

Stripe asks for:

Card Number
Expiration
CVC
Billing information

You never see this information.

Stripe stores it securely.

Phase 10 — Payment Success

User clicks:

Pay

Stripe processes payment.

If successful:

Payment Successful
Phase 11 — Redirect

Stripe redirects user back.

Example

yourwebsite.com/payment-success

The frontend can display:

Payment Received

Updating Account...

But do not trust this redirect alone.

The real source of truth is the webhook.

Phase 12 — Webhook

This is the most important step.

Stripe sends a server-to-server notification to your backend.

Stripe

↓

Webhook

↓

FastAPI

Example events include:

Checkout completed
Subscription created
Subscription renewed
Payment failed
Subscription cancelled

Your backend verifies the webhook signature and updates your database.

Phase 13 — Update Database

When payment succeeds:

subscription.status = active

plan = Starter

credits = 500

renewal_date = ...

Now the user can process resumes.

Phase 14 — Credit Deduction

User uploads:

200 resumes

System checks:

Credits = 500

Enough?

Yes.

Reserve or deduct credits according to your business rules, then process the resumes.

After processing:

Credits

500

↓

300
Phase 15 — Renewal

One month later:

Stripe attempts to charge the saved card.

If successful:

Webhook

↓

Subscription Renewed

↓

Reset/Add Monthly Credits

↓

Renewal Date Updated
Phase 16 — Failed Payment

If the card fails:

Webhook

↓

Subscription Past Due

↓

Notify User

↓

Pause New Processing

Don't immediately delete their data. Give them time to update their payment method.

Where Does the User Manage Their Card?

Inside your dashboard:

Settings

↓

Billing

↓

Manage Subscription

This button opens the payment provider's customer portal.

There the user can:

Update card
Download invoices
Cancel subscription
Change plans

Again, you don't build those interfaces yourself.

Complete User Journey
Sign Up

↓

Receive 20 Free Credits

↓

Dashboard

↓

Upload Resumes

↓

Credits Decrease

↓

Credits Reach 0

↓

Pricing Page

↓

Select Starter

↓

Checkout

↓

Payment

↓

Webhook

↓

500 Credits Added

↓

Continue Uploading

↓

Monthly Renewal

↓

Credits Refilled
Development Timeline

I would build billing in this order:

Week 1
Finish all resume-processing features.
Finalize the database schema for plans, subscriptions, and credits.
Week 2
Build the Pricing page.
Build the Billing page.
Build the Credit History page.
Build the Upgrade dialog.
Week 3
Create your Stripe account (or another provider you choose).
Create products and recurring prices.
Add checkout integration.
Implement webhook handling.
Update subscriptions and credits in your database.
Week 4
Test with the provider's test mode.
Simulate successful payments, failed payments, renewals, cancellations, and refunds.
Only after everything works end-to-end should you deploy to production and switch from test mode to live mode.



----------------------------

Phase A — Database & Core Logic (No Payments Needed)
Step 1 — Add credit columns & tables
- User.credits_remaining (int, default 0)
- CreditPack table (id, name, price_cents, credits, active)
- CreditTransaction table (id, user_id, amount, reason, created_at)
Step 2 — Seed default credit packs on startup
- Free Trial: 20 credits, $0
- Starter: 500 credits, $39
- Pro: 2000 credits, $79
Step 3 — Grant 20 free credits on registration
- In register(), set user.credits_remaining = 20
Step 4 — Credit check & deduction in backend
- Celery task (process_resume_file): check and deduct 1 credit before processing
- Bulk upload (bulk.py): check total credits before dispatching tasks
- Re-analyze (batches.py): check before re-scoring
- Retry failed: same check
Phase B — Frontend (Works With Mock Data)
Step 5 — Pricing page (/pricing)
- Fetch /api/credits/packs, display 3 cards with Buy buttons
- Buy button calls a checkout endpoint (mock or real, frontend doesn't care)
Step 6 — Billing page (/billing)
- Show credits_remaining + transaction history
- "Buy More" links to /pricing
Step 7 — Credits badge in sidebar
- Show remaining credits with link to /billing
Phase C — Mock Checkout (Replaceable Drop-In)
Step 8 — Create POST /api/credits/create-checkout (mock)
- No Stripe yet. Just immediately:
1. Find the CreditPack by ID
2. Add credits to user
3. Create CreditTransaction(reason="purchase_mock")
4. Return {"success": true, "credits_added": X}
The frontend calls this endpoint and refreshes the balance — same endpoint name and schema as the real Stripe version. No frontend changes needed later.
Step 9 — Add Pydantic schemas for credits
- CreditPackResponse, CreditBalanceResponse, CreditHistoryResponse, CreateCheckoutRequest, CreateCheckoutResponse
Step 10 — Create credits.py router
- Wire up all above endpoints, register in main.py
Phase D — YOU CONFIRM Swap Mock → Live Stripe
Step 11 — Install Stripe SDK + add config
Step 12 — Create products in Stripe Dashboard, copy price IDs
Step 13 — Update create-checkout to create real Stripe checkout.Session
Step 14 — Add POST /api/credits/webhook with signature verification
Step 15 — Update CreditPack table with stripe_price_id column
Step 16 — Test in Stripe Test Mode
At this point only Steps 11–16 change — everything above stays exactly as-is. The frontend still calls the same API endpoints; the create-checkout endpoint just now redirects to Stripe instead of granting credits directly. The webhook becomes the source of truth instead of the mock response.