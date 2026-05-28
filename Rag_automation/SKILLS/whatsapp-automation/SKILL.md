---
name: "whatsapp-automation"
description: "Automate WhatsApp message monitoring and response. Monitors WhatsApp Web, sends auto-replies, drafts responses with AI, requires human approval, then sends via persistent connection."
---

# WhatsApp Automation - Simple Steps

## ⚠️ Important: Two Scripts Needed

| Script | Purpose | When to Run |
|--------|---------|-------------|
| `whatsapp_watcher_node.js` | Receives messages + Sends queued messages | **Keep running always** |
| `execute_approved.py` | Moves approved messages to queue | Run when you have approvals |

---

## Quick Start

### Step 1: First-Time Setup
```bash
# Install dependencies
npm install whatsapp-web.js qrcode-terminal

# Start watcher & scan QR code
node whatsapp_watcher_node.js
```
- Browser opens with QR code
- Scan with your phone (WhatsApp → Linked Devices)
- Session saved in `whatsapp_session_js/`
- Watcher now monitors WhatsApp

### Step 2: Message Received (Automatic)
- New message detected
- **Auto-reply sent** (first time or 3+ hours gap)
- Task created in `Needs Action/`
- Format: `WHATSAPP_[name]_[timestamp].md`

### Step 3: Process Message (You tell Claude Code)
```
Process WhatsApp messages
```
**Claude Code will:**
- Read message from `Needs Action/`
- Draft response
- Create approval file in `Pending Approval/`

### Step 4: Review & Approve (You)
1. Open `Pending Approval/APPROVAL_send_whatsapp_*.md`
2. Read drafted message
3. Edit if needed
4. **Move file to `Approved/` folder**

### Step 5: Send Message (Automatic!)
**The `whatsapp_watcher_node.js` script automatically:**
- Checks `Send_Queue/` every 5 seconds
- Finds approved messages
- Sends via WhatsApp
- Moves to `Done/`

**You don't need to run anything!** Just keep `whatsapp_watcher_node.js` running.

---

## Commands Summary

| Action | Command |
|--------|---------|
| Start monitoring | `node whatsapp_watcher_node.js` |
| Process messages | `Process WhatsApp messages` |
| Move to queue | `python execute_approved.py` (runs automatically) |
| Send message | **Automatic** (watcher sends from queue) |

---

## Folder Flow
```
WhatsApp → Needs Action → Pending Approval → [You Approve] → Approved
    → [execute_approved.py] → Send_Queue → [watcher sends] → Done
```

---

## Example

**Message received:** "Hi, how are you?" from 923001234567

1. **Auto:** Auto-reply sent, task in `Needs Action/`
2. **You:** "Process WhatsApp messages"
3. **Claude:** Drafted message in `Pending Approval/`
4. **You:** Move to `Approved/`
5. **Auto:** `execute_approved.py` adds to `Send_Queue/`
6. **Auto:** `whatsapp_watcher_node.js` sends message! ✅

---

## ⚠️ CRITICAL: Approval File Format

When creating approval files, **MUST** include these required fields:

### YAML Frontmatter (Required Fields)
```yaml
---
type: whatsapp_approval
action: send_whatsapp
phone: +923001234567      # REQUIRED: Phone number with country code
---
```

### Message Section (Required)
```markdown
## Message

Your WhatsApp message content goes here...

This is the actual message that will be sent.
```

### Complete Template (Copy This!)
```markdown
---
type: whatsapp_approval
action: send_whatsapp
phone: +923001234567
---

# WhatsApp Message Approval

## Original Message
- **From:** +923001234567
- **Received:** 2026-02-21 15:00:00
- **Content:** Original message...

## Message

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
| `phone:` missing in YAML | Executor can't find recipient | Add `phone: +923001234567` in frontmatter |
| `## Message` section missing | Executor can't find message content | Use `## Message` or `## WhatsApp Message` header |
| Phone without `+` | May fail international formatting | Include country code: `+92...` |

---

## Why This Way?

**Old way (didn't work):**
- Create new WhatsApp client each time
- Takes 60 seconds to connect
- Often times out
- Message not sent

**New way (works!):**
- `whatsapp_watcher_node.js` stays connected
- Messages added to `Send_Queue/`
- Watcher sends instantly (already connected)
- Reliable! ✅

---

## Keep Running

```bash
# Start this and keep it running (Terminal 1)
node whatsapp_watcher_node.js

# Start this and keep it running (Terminal 2)
python execute_approved.py
```

Or use batch files:
```bash
start_whatsapp.bat    # Starts watcher
run_executor.bat      # Starts executor
```

---

## Troubleshooting

**QR code not showing?**
- Close WhatsApp Web in browser
- Delete `whatsapp_session_js/` folder
- Run: `node whatsapp_watcher_node.js`
- Scan QR again

**Message not sent?**
- Check `whatsapp_watcher_node.js` is running
- Check file is in `Send_Queue/`
- Watch console for "Sending queued message..."

**Session expired?**
- Delete `whatsapp_session_js/`
- Re-scan QR code
