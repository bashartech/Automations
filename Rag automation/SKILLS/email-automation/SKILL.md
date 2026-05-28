---
name: "email-automation"
description: "Automate Gmail monitoring and email response workflow. Monitors inbox, drafts responses with AI, requires human approval, then sends via execute_approved.py"
---

# Email Automation - Simple Steps

## Quick Start

### Step 1: First-Time Setup
```bash
# Install dependencies
pip install google-auth google-auth-oauthlib google-api-python-client

# Start watcher (authenticates Gmail)
python gmail_watcher.py
```
- Browser opens → Login to Google → Authorize
- Token saved automatically
- Watcher now monitors your Gmail

### Step 2: Email Detected (Automatic)
- Gmail watcher checks every 2 minutes
- New email → Creates task in `Needs Action/`
- Format: `EMAIL_[id].md`

### Step 3: Process Email (You tell Claude Code)
```
Process email messages
```
**Claude Code will:**
- Read email from `Needs Action/`
- Draft professional response
- Create approval file in `Pending Approval/`

### Step 4: Review & Approve (You)
1. Open `Pending Approval/APPROVAL_send_email_*.md`
2. Read drafted response
3. Edit if needed
4. **Move file to `Approved/` folder**

### Step 5: Send Email (Automatic!)
```bash
# Run once to start executor (keeps running)
python execute_approved.py

# OR use batch file
run_executor.bat
```
**The executor automatically:**
- Checks `Approved/` folder
- Extracts: to, subject, body
- Runs: `node send_email.js "to" "subject" "body"`
- Email sent! ✅
- Moves files to `Done/`

---

## Commands Summary

| Action | Command |
|--------|---------|
| Start monitoring | `python gmail_watcher.py` |
| Process emails | `Process email messages` |
| Send approved | **Automatic!** (via `execute_approved.py`) |

**Keep executor running:**
```bash
python execute_approved.py
# or
run_executor.bat
```

---

## Folder Flow
```
Inbox → Needs Action → Pending Approval → [You Approve] → Approved
    → [execute_approved.py] → Done
```

---

## Example

**Email received:** "Hi, I need pricing info"

1. **Auto:** Task created in `Needs Action/`
2. **You:** "Process email messages"
3. **Claude:** Drafted response in `Pending Approval/`
4. **You:** Move to `Approved/`
5. **Auto:** `execute_approved.py` detects & sends email! ✅
6. **Auto:** File moved to `Done/`

---

## ⚠️ CRITICAL: Approval File Format

When creating approval files, **MUST** include these required fields:

### YAML Frontmatter (Required Fields)
```yaml
---
type: email_approval
action: send_email
to: recipient@example.com        # REQUIRED: Recipient email
subject: Re: Original Subject     # REQUIRED: Email subject
---
```

### Email Body Section (Required)
```markdown
## Email Body

Your email message content goes here...

This is the actual body that will be sent.
```

### Complete Template (Copy This!)
```markdown
---
type: email_approval
action: send_email
to: recipient@example.com
subject: Re: Original Subject
---

# Email Response Approval

## Original Email
- **From:** sender@example.com
- **Subject:** Original Subject
- **Content:** Original message...

## Email Body

Dear Recipient,

Your response message here...

Best regards,
Sender

---

## Instructions
1. **Review** the drafted response above
2. **Edit** if needed
3. **Approve:** Move to `Approved/` folder
4. **Reject:** Move to `Rejected/` folder
```

### ❌ Common Mistakes (Avoid These!)
| Mistake | Why It Fails | Fix |
|---------|--------------|-----|
| `to:` missing in YAML | Executor can't find recipient | Add `to: email@example.com` in frontmatter |
| `subject:` missing in YAML | Executor can't send without subject | Add `subject: Re: Topic` in frontmatter |
| `## Drafted Response` section | Executor looks for `## Email Body` | Use `## Email Body` header exactly |
| Body inside `**To:**` format | Executor can't parse | Put body under `## Email Body` section |

---

## Keep Running

```bash
# Start this and keep it running (Terminal 1)
python gmail_watcher.py

# Start this and keep it running (Terminal 2)
python execute_approved.py
```

Or use batch files:
```bash
# Email watcher
python gmail_watcher.py

# Executor (handles email, WhatsApp, LinkedIn)
run_executor.bat
```

---

## Troubleshooting

**No emails detected?**
- Check watcher is running: `python gmail_watcher.py`
- Verify Gmail has unread emails

**Send failed with "Missing required fields"?**
- Check YAML frontmatter has `to:`, `subject:`
- Check content has `## Email Body` section (not `## Drafted Response`)

**Email not sent?**
- Check file is in `Approved/` folder
- Check executor console for "Sending email to..."
- Verify `send_email.js` works: `node send_email.js "test@test.com" "Test" "Body"`
