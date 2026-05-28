---
name: "odoo-invoice"
description: "Create and manage invoices in Odoo. Requires human approval before creating invoices."
---

# Odoo Invoicing Skill

## Overview

This skill integrates with Odoo Invoicing to create customer invoices and track payments. All invoice creation requires human approval before execution.

## Commands

### Create Invoice
```
Create invoice in Odoo for [Customer] - Amount: [X] - Description: [Service/Product]
```

**Workflow:**
1. Find or create customer partner in Odoo
2. Create approval file in `Pending Approval/`
3. After approval, move to `Approved/`
4. Executor calls `mcp_servers/odoo_server.py → create_invoice()`
5. Save invoice details to `Odoo_Data/Invoices/`
6. Log action to audit log

---

### Get Unpaid Invoices
```
Show unpaid invoices from Odoo
```

Returns all unpaid customer invoices for follow-up.

---

### Get Revenue Report
```
Show revenue report from Odoo
```

Returns revenue summary for current week/month.

---

## ⚠️ CRITICAL: Approval File Format

When creating approval files for Odoo invoice creation, **MUST** include:

### YAML Frontmatter (Required)
```yaml
---
type: odoo_invoice_approval
action: create_invoice
customer_name: XYZ Limited
customer_email: accounts@xyzlimited.com
amount: 150000
description: Monthly Retainer - February 2026
invoice_date: 2026-02-21
---
```

### Invoice Details Section (Required)
```markdown
## Invoice Details

**Customer:** XYZ Limited
**Email:** accounts@xyzlimited.com
**Amount:** PKR 150,000
**Description:** Monthly Retainer - February 2026
**Invoice Date:** 2026-02-21

**Payment Terms:** Due in 15 days
**Notes:** Thank you for your business!
```

### Complete Template
```markdown
---
type: odoo_invoice_approval
action: create_invoice
customer_name: XYZ Limited
customer_email: accounts@xyzlimited.com
amount: 150000
description: Monthly Retainer - February 2026
invoice_date: 2026-02-21
---

# Odoo Invoice Creation Approval

## Customer Details

**Name:** XYZ Limited
**Email:** accounts@xyzlimited.com
**Phone:** +923001234567

## Invoice Details

**Amount:** PKR 150,000
**Description:** Monthly Retainer - February 2026
**Invoice Date:** 2026-02-21
**Payment Terms:** Due in 15 days

## Line Items

| Description | Quantity | Unit Price | Total |
|-------------|----------|------------|-------|
| Monthly Retainer | 1 | 150,000 | 150,000 |

## Instructions
1. **Review** the invoice details above
2. **Edit** if needed (amount, description, terms)
3. **Approve:** Move this file to `Approved/` folder
4. **Reject:** Move to `Rejected/` folder
```

---

## Example Usage

**User:** "Create invoice in Odoo for Ahmed Enterprises - ahmed@enterprises.pk - Amount: 85000 - E-commerce Website Development"

**Claude Code will:**
1. Extract details
2. Check if customer exists (by email)
3. Create customer if new
4. Create approval file in `Pending Approval/ODOO_INV_ahmed_*.md`
5. Wait for approval

**You:** Move file to `Approved/`

**Executor will:**
1. Call `odoo.create_invoice(partner_id, amount=85000, description="E-commerce Website Development")`
2. Save result to `Odoo_Data/Invoices/`
3. Log action

---

## Generate CEO Briefing

**User:** "Generate CEO weekly briefing"

**Claude Code will:**
1. Call `engine/ceo_briefing.py → generate_ceo_briefing()`
2. Create briefing file in `Odoo_Data/CEO_Briefings/`
3. Display summary

---

## Odoo Model Reference

| Entity | Odoo Model | Key Fields |
|--------|------------|------------|
| Invoice | `account.move` | partner_id, amount_total, state, payment_state |
| Payment | `account.payment` | amount, payment_date, partner_id |
| Partner | `res.partner` | name, email, phone |

---

## Invoice States

| State | Description | Action |
|-------|-------------|--------|
| Draft | Invoice created, not sent | Send to customer |
| Posted | Invoice sent | Wait for payment |
| Paid | Payment received | ✅ Complete |
| Cancelled | Invoice cancelled | Void |

---

## Payment States

| Payment State | Meaning |
|---------------|---------|
| `not_paid` | No payment received |
| `partial` | Partially paid |
| `paid` | Fully paid |

---

## Troubleshooting

**"Invoice creation failed"?**
- Check Invoicing app is installed in Odoo
- Verify user has Accounting/Invoicing access rights
- Check audit log for details

**"Partner not found"?**
- Create partner first using Odoo CRM skill
- Or provide complete customer details

**"Can't get revenue data"?**
- Check Odoo connection: `python mcp_servers/odoo_server.py`
- Verify there are paid invoices in the system
