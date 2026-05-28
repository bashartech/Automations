---
name: "odoo-crm"
description: "Create and manage CRM leads in Odoo. Requires human approval before creating leads."
---

# Odoo CRM Skill - Claude Code Automation

## Overview

This skill integrates with Odoo CRM to create and manage leads. All lead creation requires human approval before execution.

## Commands

### Create Lead
```
Create lead in Odoo for [Name] - [Email] - [Phone] - Source: [LinkedIn/Website/Referral]
```

**Workflow:**
1. Extract lead details (name, email, phone, source)
2. Create approval file in `Pending Approval/`
3. After approval, move to `Approved/`
4. Executor calls `mcp_servers/odoo_server.py → create_lead()`
5. Save lead details to `Odoo_Data/Leads/`
6. Log action to audit log

---

## ⚠️ CRITICAL: Approval File Format

When creating approval files for Odoo lead creation, **MUST** include:

### YAML Frontmatter (Required Fields)
```yaml
---
type: odoo_lead_approval
action: create_lead
lead_name: John Doe
email: john@example.com
phone: +923001234567
source: LinkedIn
---
```

### Lead Details Section (Required)
```markdown
## Lead Details

**Name:** John Doe
**Email:** john@example.com
**Phone:** +923001234567
**Source:** LinkedIn

**Notes:** Interested in our services, requested a follow-up call.
```

### Complete Template (Copy This!)
```markdown
---
type: odoo_lead_approval
action: create_lead
lead_name: John Doe
email: john@example.com
phone: +923001234567
source: LinkedIn
---

# Odoo Lead Creation Approval

## Lead Details

**Name:** John Doe
**Email:** john@example.com
**Phone:** +923001234567
**Source:** LinkedIn

## Notes

Interested in our services, requested a follow-up call.

## Instructions
1. **Review** the lead details above
2. **Edit** if needed (correct email, phone, etc.)
3. **Approve:** Move this file to `Approved/` folder
4. **Reject:** Move to `Rejected/` folder
```

---

## Example Usage

**User:** "Create lead in Odoo for Sarah Khan - sarah@techcorp.com - +923009876543 - Source: Website"

**Claude Code will:**
1. Extract details
2. Create approval file in `Pending Approval/ODOO_LEAD_sarah_*.md`
3. Wait for approval

**You:** Move file to `Approved/`

**Executor will:**
1. Call `odoo.create_lead("Sarah Khan", "sarah@techcorp.com", "+923009876543", "Website")`
2. Save result to `Odoo_Data/Leads/`
3. Log action

---

## Odoo Model Reference

| Entity | Odoo Model | Key Fields |
|--------|------------|------------|
| Lead | `crm.lead` | name, email_from, phone |
| Partner | `res.partner` | name, email, phone |
| Opportunity | `crm.lead` (stage_id changed) | stage_id |

---

## Troubleshooting

**"Odoo connection failed"?**
- Check Odoo is running at http://localhost:8069
- Verify credentials in `.env`
- Run: `python mcp_servers/odoo_server.py` to test connection

**"Lead creation failed"?**
- Check CRM app is installed in Odoo
- Verify user has CRM access rights
- Check audit log for details: `Logs/audit_*.log`
