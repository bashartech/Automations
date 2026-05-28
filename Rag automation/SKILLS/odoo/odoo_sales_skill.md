---
name: "odoo-sales"
description: "Create and manage sales quotations in Odoo. Requires human approval before creating quotations."
---

# Odoo Sales Skill

## Overview

This skill integrates with Odoo Sales to create quotations and manage sales orders. All quotation creation requires human approval before execution.

## Commands

### Create Quotation
```
Create quotation in Odoo for [Customer] - Amount: [X] - Products: [List]
```

**Workflow:**
1. Find or create customer partner in Odoo
2. Create approval file in `Pending Approval/`
3. After approval, move to `Approved/`
4. Executor calls `mcp_servers/odoo_server.py → create_quotation()`
5. Save quotation details to `Odoo_Data/Quotations/`
6. Log action to audit log

---

### Confirm Quotation
```
Confirm quotation [QUO-001] in Odoo
```

Converts quotation to confirmed sales order.

---

### Get Recent Quotations
```
Show recent quotations from Odoo
```

Returns last 10 quotations from Odoo Sales.

---

## ⚠️ CRITICAL: Approval File Format

When creating approval files for Odoo quotation creation, **MUST** include:

### YAML Frontmatter (Required)
```yaml
---
type: odoo_quotation_approval
action: create_quotation
customer_name: ABC Corporation
customer_email: info@abccorp.com
amount: 50000
products: Web Development Services
---
```

### Quotation Details Section (Required)
```markdown
## Quotation Details

**Customer:** ABC Corporation
**Email:** info@abccorp.com
**Phone:** +923001234567
**Amount:** PKR 50,000
**Products/Services:** Web Development Services

**Notes:** Quotation for complete website redesign project.
```

### Complete Template
```markdown
---
type: odoo_quotation_approval
action: create_quotation
customer_name: ABC Corporation
customer_email: info@abccorp.com
amount: 50000
products: Web Development Services
---

# Odoo Quotation Creation Approval

## Customer Details

**Name:** ABC Corporation
**Email:** info@abccorp.com
**Phone:** +923001234567

## Quotation Details

**Amount:** PKR 50,000
**Products/Services:** Web Development Services
**Valid Until:** 2026-03-21

## Notes

Quotation for complete website redesign project including:
- Homepage design
- 5 inner pages
- Contact form
- SEO optimization

## Instructions
1. **Review** the quotation details above
2. **Edit** if needed (amount, products, terms)
3. **Approve:** Move this file to `Approved/` folder
4. **Reject:** Move to `Rejected/` folder
```

---

## Example Usage

**User:** "Create quotation in Odoo for Tech Solutions - tech@solutions.com - Amount: 75000 - Logo Design and Branding"

**Claude Code will:**
1. Extract details
2. Check if customer exists (by email)
3. Create customer if new
4. Create approval file in `Pending Approval/ODOO_QUO_tech_*.md`
5. Wait for approval

**You:** Move file to `Approved/`

**Executor will:**
1. Call `odoo.create_quotation(partner_id, amount=75000)`
2. Save result to `Odoo_Data/Quotations/`
3. Log action

---

## Odoo Model Reference

| Entity | Odoo Model | Key Fields |
|--------|------------|------------|
| Quotation | `sale.order` | partner_id, amount_total, state |
| Sales Order | `sale.order` (state='sale') | confirmation_date |
| Partner | `res.partner` | name, email, phone |

---

## Sales Pipeline Flow

```
Lead (crm.lead) 
  ↓ Convert
Partner (res.partner)
  ↓ Create Quotation
Quotation (sale.order, state='draft')
  ↓ Confirm
Sales Order (sale.order, state='sale')
  ↓ Create Invoice
Invoice (account.move)
```

---

## Troubleshooting

**"Partner not found"?**
- Create partner first using Odoo CRM skill
- Or provide complete customer details

**"Quotation creation failed"?**
- Check Sales app is installed in Odoo
- Verify user has Sales access rights
- Check audit log for details
