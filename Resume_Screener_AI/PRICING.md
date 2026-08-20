# Pricing & Cost Model

Long-term cost model and pricing plan for the Resume Screener AI platform.
Region: ap-southeast-1 · Account: 134604497809

---

## 1. Infrastructure Investment (fixed floor, every month)

One shared deployment serves ALL customers. This is the baseline cost and stays
flat regardless of how many companies use the platform (up to ~100k resumes/month
before you need to add capacity).

| Item | Config | Monthly |
|---|---|---|
| ECS Fargate `rsn-api` | 1 vCPU / 2 GB, on-demand | ~$41 |
| ECS Fargate `rsn-worker` | 2 vCPU / 4 GB, Fargate Spot (~70% off) | ~$25 |
| ECS Fargate `rsn-beat` | 0.25 vCPU / 0.5 GB, Fargate Spot | ~$3 |
| ALB `rsn-alb` | internet-facing, HTTP:80 | ~$20 |
| CloudWatch + egress + IPv4 + ECR | | ~$10 |
| **AWS subtotal** | | **~$100** |
| Neon (Postgres, autoscale) | | ~$30 |
| Vercel (frontend, Pro) | | $20 |
| **Total fixed floor** | | **~$150/month** |

> Note: the worker and beat are already on Fargate Spot. Only `rsn-api` is on-demand.

### Auto-scaling design (when enabled)

Cost increases ONLY when load increases:

| Service | Min | Max | Scale trigger |
|---|---|---|---|
| `rsn-api` | 1 | 3 | CPU > 60% (sustained) |
| `rsn-worker` | 1 | 5 | CPU > 60% (sustained) |
| `rsn-beat` | 1 | 1 | never (scheduler) |

Extra tasks are billed per hour only while running: api ~$0.057/task-hr
(on-demand), worker ~$0.034/task-hr (Spot). When the surge ends, tasks scale
back down and the bill drops with them.

---

## 2. Variable Cost (the only cost that grows with usage)

**~$0.002 per resume** — LLM inference (`gpt-4o-mini` or Groq `gpt-oss-120b`, both
$0.15/M input / $0.60/M output) + one Gemini embedding.

Per-resume token profile: ~3,000 input + ~1,900 output + 1 embedding ≈ $0.0018–0.002.

| Resumes/month | LLM cost |
|---|---|
| 1,000 | ~$2 |
| 5,000 | ~$10 |
| 10,000 | ~$20 |
| 25,000 | ~$50 |
| 50,000 | ~$100 |

> Do NOT use gpt-4.1-mini or gpt-5.x — 2–5× the price for no quality gain here.

---

## 3. Customer Plans (what users pay)

All plans are priced under the $300/month "human employee" anchor so the ROI
pitch writes itself.

| Plan | Price/month | Resumes included | Price/resume (to them) |
|---|---|---|---|
| Starter | $99 | up to 2,500 | $0.040 |
| Professional | $199 | up to 10,000 | $0.020 |
| Business | $349 | up to 25,000 | $0.014 |
| Enterprise | $499 | up to 50,000 | $0.010 |

> The old credit-pack model ($79/2,000 credits = $0.039/resume) would bill a
> customer $592–1,580/month at these volumes. Subscriptions only for B2B.

---

## 4. Your Cost vs Their Price (1,000 → 50,000 resumes)

### Scenario A — only 1 customer (you pay the full ~$150 floor)

| Resumes/mo | LLM | Total cost | They pay | Your profit |
|---|---|---|---|---|
| 1,000 | $2 | $152 | $99 | **−$53 (loss)** |
| 2,500 | $5 | $155 | $99 | **−$56 (loss)** |
| 5,000 | $10 | $160 | $199 | +$39 |
| 10,000 | $20 | $170 | $199 | +$29 |
| 15,000 | $30 | $180 | $349 | +$169 |
| 25,000 | $50 | $200 | $349 | +$149 |
| 40,000 | $80 | $230 | $499 | +$269 |
| 50,000 | $100 | $250 | $499 | +$249 |

### Scenario B — 5 customers share the fixed floor ($30 each)

| Resumes/mo | LLM | Total cost | They pay | Your profit |
|---|---|---|---|---|
| 1,000 | $2 | $32 | $99 | +$67 |
| 2,500 | $5 | $35 | $99 | +$64 |
| 10,000 | $20 | $50 | $199 | +$149 |
| 25,000 | $50 | $80 | $349 | +$269 |
| 50,000 | $100 | $130 | $499 | +$369 |

---

## 5. Profit Scenarios (will you benefit? yes)

| Customers | Monthly revenue | Monthly cost | Monthly profit |
|---|---|---|---|
| 1 (Professional, 10k) | $199 | ~$170 | +$29 |
| 3 (mixed) | ~$647 | ~$225 | **+$422** |
| 5 (mixed) | ~$1,195 | ~$300 | **+$895** |
| 10 (mixed) | ~$2,500 | ~$450 | **+$2,050** |

Margins climb toward 80%+ as customers grow because the ~$150 floor is a
one-time-per-deployment cost, not a per-customer cost.

---

## 6. Where the Cost Goes (10 customers, ~100k resumes/month)

| Item | Monthly | Share |
|---|---|---|
| LLM API (the only real variable) | ~$200 | ~55% |
| AWS (~$100 baseline + brief surge) | ~$110 | ~30% |
| Neon + Vercel | ~$50 | ~14% |
| Misc | ~$5 | ~1% |

---

## 7. Rules That Keep It Profitable Long-Term

1. Never sell the Starter plan as your first 1–2 customers — it's a loss until
   the fixed floor is shared (~3+ customers).
2. Push Professional+ first; use Business/Enterprise for heavy-volume companies.
3. Multi-tenant on ONE deployment (schema already uses `company_id`) — do not
   spin up dedicated instances per customer.
4. Keep the cheapest quality model (gpt-4o-mini / gpt-oss-120b).
5. Enable auto-scaling so cost only rises with load (see section 1).
6. Cancel unused Qdrant Cloud and Upstash (dead code) if on paid plans.
7. If bulk throughput becomes a cost driver, route screening through the OpenAI
   Batch API (50% off).
