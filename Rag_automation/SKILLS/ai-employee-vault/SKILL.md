---
name: "ai-employee-vault"
description: "Complete guide to building and running the AI Employee Vault automation system. Covers Gmail, WhatsApp, LinkedIn automation with orchestrator, watchers, and approval workflow."
---

# AI Employee Vault - Complete Project Guide

## 🎯 What is AI Employee Vault?

An intelligent automation system that monitors multiple channels (Gmail, WhatsApp, LinkedIn), processes tasks with AI, requires human approval, and executes actions automatically.

**Key Features:**
- 📧 Email automation (Gmail monitoring + auto-response)
- 💬 WhatsApp automation (message monitoring + auto-reply)
- 🔗 LinkedIn automation (post creation + publishing)
- 🤖 AI-powered task processing with Claude Code
- ✅ Human-in-the-loop approval workflow
- 📁 Organized folder-based task management

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI EMPLOYEE VAULT                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   WATCHERS   │  │ ORCHESTRATOR │  │   EXECUTOR   │      │
│  │              │  │              │  │              │      │
│  │ Gmail        │  │ Monitors:    │  │ Executes:    │      │
│  │ WhatsApp     │──▶│ Needs Action │──▶│ Approved     │      │
│  │ LinkedIn     │  │              │  │              │      │
│  │ Inbox        │  │ Creates:     │  │ Sends:       │      │
│  └──────────────┘  │ Approvals    │  │ Emails       │      │
│                    │              │  │ WhatsApp     │      │
│                    └──────────────┘  │ LinkedIn     │      │
│                                      └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              FOLDER STRUCTURE                        │   │
│  │                                                       │   │
│  │  Inbox/ ──▶ Needs Action/ ──▶ Pending Approval/    │   │
│  │                                      │                │   │
│  │                                      ▼                │   │
│  │                    [Human Reviews & Approves]        │   │
│  │                                      │                │   │
│  │                                      ▼                │   │
│  │                                 Approved/            │   │
│  │                                      │                │   │
│  │                                      ▼                │   │
│  │                                   Done/               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Folder Structure

```
AI_Employee_Vault/
├── Inbox/                      # Drop files here for processing
├── Needs Action/               # Tasks waiting to be processed
├── Pending Approval/           # Drafted responses awaiting review
├── Approved/                   # Approved tasks ready for execution
├── Done/                       # Completed tasks
├── Rejected/                   # Rejected tasks
├── Send_Queue/                 # WhatsApp messages queued for sending
│
├── engine/                     # Core automation engine
│   ├── orchestrator.py         # Main task processor
│   ├── watcher_gmail.py        # Gmail monitoring
│   ├── watcher_whatsapp.py     # WhatsApp monitoring
│   ├── watcher_linkedin.py     # LinkedIn monitoring
│   ├── watcher_file.py         # Inbox file monitoring
│   ├── approval_manager.py     # Approval workflow handler
│   └── processor.py            # Task processing logic
│
├── execute_approved.py         # Executes approved tasks
├── run_automation.py           # Starts orchestrator
├── gmail_watcher.py            # Gmail watcher entry point
├── whatsapp_watcher_node.js    # WhatsApp watcher (Node.js)
├── send_email.js               # Email sender (Node.js)
│
└── .claude/
    └── skills/                 # Skill documentation
        ├── email-automation/
        ├── whatsapp-automation/
        ├── linkedin-automation/
        └── ai-employee-vault/  # This guide
```

---

## 🚀 Complete Setup Guide

### Prerequisites

**Required Software:**
- Python 3.8+
- Node.js 16+
- npm
- Git

**Required Accounts:**
- Gmail account
- WhatsApp account
- LinkedIn account (optional)

---

### Step 1: Install Dependencies

#### Python Dependencies
```bash
# Core dependencies
pip install watchdog google-auth google-auth-oauthlib google-api-python-client
pip install playwright python-dotenv

# Install Playwright browsers
playwright install chromium
```

#### Node.js Dependencies
```bash
# WhatsApp automation
npm install whatsapp-web.js qrcode-terminal

# Email sending
npm install nodemailer
```

---

### Step 2: Configure Gmail API

#### 2.1 Enable Gmail API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "AI Employee Vault"
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Download `credentials.json`
6. Place in project root

#### 2.2 Authenticate Gmail
```bash
python gmail_watcher.py
```
- Browser opens → Login to Google
- Authorize access
- Token saved as `token.pickle`

---

### Step 3: Configure WhatsApp

#### 3.1 First-Time Setup
```bash
node whatsapp_watcher_node.js
```
- QR code appears in terminal
- Open WhatsApp on phone
- Go to: Settings → Linked Devices → Link a Device
- Scan QR code
- Session saved in `whatsapp_session_js/`

#### 3.2 Keep Running
WhatsApp watcher must stay running to:
- Receive messages
- Send auto-replies
- Send queued messages

---

### Step 4: Configure LinkedIn (Optional)

#### 4.1 Setup Login Session
```bash
python setup_linkedin_login.py
```
- Browser opens → LinkedIn login
- Login with credentials
- Session saved in `linkedin_session/`

---

### Step 5: Configure Email Sending

#### 5.1 Create App Password (Gmail)
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Create App Password
4. Copy password

#### 5.2 Configure send_email.js
Edit `send_email.js`:
```javascript
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'  // App password from step 5.1
  }
});
```

---

## 🎮 Running the System

### Start All Components

**Terminal 1: Orchestrator**
```bash
python run_automation.py
```
- Monitors `Needs Action/` folder
- Processes tasks with AI
- Creates approval files

**Terminal 2: Execute Approved**
```bash
python execute_approved.py
```
- Monitors `Approved/` folder
- Executes approved tasks
- Sends emails, WhatsApp, LinkedIn posts

**Terminal 3: Gmail Watcher**
```bash
python gmail_watcher.py
```
- Monitors Gmail inbox
- Creates tasks for new emails

**Terminal 4: WhatsApp Watcher**
```bash
node whatsapp_watcher_node.js
```
- Monitors WhatsApp messages
- Sends auto-replies
- Sends queued messages

**Terminal 5: Inbox Watcher**
```bash
python watch_inbox.py
```
- Monitors `Inbox/` folder
- Creates tasks for dropped files

---

## 📋 How It Works

### 1. Task Creation (Watchers)

**Gmail Watcher:**
- Checks inbox every 2 minutes
- New email detected
- Creates: `EMAIL_[gmail_id].md` in `Needs Action/`

**WhatsApp Watcher:**
- Monitors WhatsApp Web
- New message received
- Sends auto-reply (if first message or 3+ hours gap)
- Creates: `WHATSAPP_[name]_[timestamp].md` in `Needs Action/`

**Inbox Watcher:**
- Monitors `Inbox/` folder
- File dropped
- Creates: `INBOX_[filename]_[timestamp].md` in `Needs Action/`

---

### 2. Task Processing (Orchestrator)

**Orchestrator watches:** `Needs Action/` folder

**When file detected:**
1. Reads file content
2. Detects task type:
   - Email reply (has YAML frontmatter with `from:`)
   - Email composition (has email address in content)
   - WhatsApp (has phone number)
   - LinkedIn (has social media keywords)
   - Generic (manual review needed)

3. Processes task:
   - Extracts relevant information
   - Drafts appropriate response
   - Creates approval file in `Pending Approval/`

4. Moves original task to `Done/`

**File Naming:**
- `APPROVAL_send_email_[timestamp].md`
- `APPROVAL_send_whatsapp_[timestamp].md`
- `APPROVAL_linkedin_post_[timestamp].md`
- `NOTE_manual_review_[timestamp].md`

---

### 3. Human Review (You!)

**Review approval files:**
1. Open `Pending Approval/` folder
2. Read drafted response
3. Edit if needed
4. **Move to `Approved/` folder** (approve)
5. **Move to `Rejected/` folder** (reject)

---

### 4. Task Execution (Execute Approved)

**Execute Approved watches:** `Approved/` folder

**When file detected:**

**Email:**
- Extracts: `to:`, `subject:`, `## Email Body`
- Runs: `node send_email.js "to" "subject" "body"`
- Email sent via Gmail SMTP
- Moves to `Done/` as `EXECUTED_[filename].md`

**WhatsApp:**
- Extracts: `phone:`, `## Message`
- Creates file in `Send_Queue/`
- WhatsApp watcher detects and sends
- Moves to `Done/` as `EXECUTED_[filename].md`

**LinkedIn:**
- Extracts: `## Post Content`
- Runs: `python engine/linkedin_poster.py`
- Browser opens, posts to LinkedIn
- Moves to `Done/` as `EXECUTED_[filename].md`

---

## 📝 File Format Specifications

### Email Approval File

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
AI Employee

---

## Instructions
1. **Review** the drafted response above
2. **Edit** if needed
3. **Approve:** Move to `Approved/` folder
4. **Reject:** Move to `Rejected/` folder
```

**Required Fields:**
- YAML: `to:`, `subject:`
- Section: `## Email Body`

---

### WhatsApp Approval File

```markdown
---
type: whatsapp_approval
action: send_whatsapp
phone: +923001234567
---

# WhatsApp Message Approval

## Original Message
- **From:** +923001234567
- **Content:** Original message...

## Message

Your WhatsApp response here...

Best regards

---

## Instructions
1. **Review** the drafted response above
2. **Edit** if needed
3. **Approve:** Move to `Approved/` folder
4. **Reject:** Move to `Rejected/` folder
```

**Required Fields:**
- YAML: `phone:` (with country code)
- Section: `## Message`

---

### LinkedIn Approval File

```markdown
---
type: linkedin_approval
action: linkedin_post
---

# LinkedIn Post Approval

## Post Content

Your LinkedIn post content here...

#Hashtag1 #Hashtag2 #Hashtag3

---

## Instructions
1. **Review** the drafted post above
2. **Edit** if needed
3. **Approve:** Move to `Approved/` folder
4. **Reject:** Move to `Rejected/` folder
```

**Required Fields:**
- YAML: `action: linkedin_post`
- Section: `## Post Content`

---

## 🔍 Task Type Detection

The orchestrator intelligently detects task types:

### Email Tasks
**Detected when:**
- Filename contains `EMAIL_`
- Content has YAML with `type: email`
- Content has `INBOX_` + email address found

**Processing:**
- Reply tasks: Extract sender, subject, content
- Composition tasks: Extract recipient, topic
- Draft professional response
- Create approval file

### WhatsApp Tasks
**Detected when:**
- Filename contains `WHATSAPP_` or `WATSAPP_`
- Content has phone number pattern
- Content has `type: whatsapp`

**Processing:**
- Extract phone number
- Extract message content
- Draft response
- Create approval file

### LinkedIn Tasks
**Detected when:**
- Filename contains `LINKEDIN_`
- Content has keywords: post, linkedin, social media
- Content has `type: linkedin`

**Processing:**
- Extract post request
- Generate professional post
- Add hashtags
- Create approval file

### Generic Tasks
**Detected when:**
- No specific pattern matched
- Empty or invalid content

**Processing:**
- Create manual review note
- Move to `Pending Approval/`
- Requires human action

---

## 🛠️ Key Scripts & Commands

### Start Orchestrator
```bash
# Start main automation engine
python run_automation.py

# Or directly
python engine/orchestrator.py
```

### Start Watchers
```bash
# Gmail watcher
python gmail_watcher.py

# WhatsApp watcher (Node.js)
node whatsapp_watcher_node.js

# Inbox file watcher
python watch_inbox.py
```

### Start Executor
```bash
# Execute approved tasks
python execute_approved.py

# Or use batch file
run_executor.bat
```

### Manual Testing
```bash
# Test email sending
node send_email.js "test@example.com" "Test Subject" "Test body"

# Test WhatsApp (requires watcher running)
# Drop file in Send_Queue/

# Test LinkedIn posting
python engine/linkedin_poster.py "Approved/APPROVAL_linkedin_post_*.md"
```

---

## 🎯 Usage Examples

### Example 1: Process Incoming Email

**Scenario:** New email received from client

1. **Gmail Watcher:** Creates `EMAIL_abc123.md` in `Needs Action/`
2. **Orchestrator:** Detects file, drafts response, creates `APPROVAL_send_email_20260227120000.md`
3. **You:** Review in `Pending Approval/`, edit if needed, move to `Approved/`
4. **Executor:** Sends email, moves to `Done/` as `EXECUTED_APPROVAL_send_email_20260227120000.md`

### Example 2: Compose New Email

**Scenario:** You want to send email about C programming

1. **You:** Create `email.md` in `Inbox/` with content:
   ```
   write a formal email for c language explanation to bashartech56@gmail.com
   ```
2. **Inbox Watcher:** Creates `INBOX_email_20260227120000.md` in `Needs Action/`
3. **Orchestrator:** Detects email address, drafts C language explanation, creates approval file
4. **You:** Review, approve
5. **Executor:** Sends email

### Example 3: WhatsApp Auto-Reply

**Scenario:** Customer sends WhatsApp message

1. **WhatsApp Watcher:** Receives message, sends auto-reply, creates task
2. **Orchestrator:** Drafts personalized response
3. **You:** Review, approve
4. **Executor:** Adds to `Send_Queue/`
5. **WhatsApp Watcher:** Sends message from queue

### Example 4: LinkedIn Post

**Scenario:** You want to post about Python

1. **You:** Drop file in `Inbox/` with content:
   ```
   Create LinkedIn post about Python programming benefits
   ```
2. **Orchestrator:** Generates professional post with hashtags
3. **You:** Review, approve
4. **Executor:** Opens browser, posts to LinkedIn

---

## 🔧 Configuration Files

### config.py
```python
# Folder paths
NEEDS_ACTION_FOLDER = Path("Needs Action")
PENDING_APPROVAL_FOLDER = Path("Pending Approval")
APPROVED_FOLDER = Path("Approved")
DONE_FOLDER = Path("Done")
REJECTED_FOLDER = Path("Rejected")
SEND_QUEUE_FOLDER = Path("Send_Queue")
INBOX_FOLDER = Path("Inbox")

# Watcher intervals
GMAIL_CHECK_INTERVAL = 120  # seconds
WHATSAPP_CHECK_INTERVAL = 5  # seconds
INBOX_CHECK_INTERVAL = 10  # seconds
```

### .env (Create this file)
```bash
# Gmail credentials
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# WhatsApp (optional)
WHATSAPP_AUTO_REPLY=True

# LinkedIn (optional)
LINKEDIN_AUTO_POST=False
```

---

## 🐛 Troubleshooting

### Orchestrator Issues

**Problem:** Tasks not being processed
**Solution:**
- Check orchestrator is running: `python run_automation.py`
- Check files are in `Needs Action/` folder
- Check file format (`.md` or `.txt`)
- Check logs in console

**Problem:** Approval files have wrong format
**Solution:**
- Check `engine/orchestrator.py` processing methods
- Verify YAML frontmatter is correct
- Check section headers match expected format

### Gmail Issues

**Problem:** No emails detected
**Solution:**
- Check `gmail_watcher.py` is running
- Verify `token.pickle` exists
- Re-authenticate: Delete `token.pickle`, run watcher again
- Check Gmail has unread emails

**Problem:** Email not sending
**Solution:**
- Check `send_email.js` has correct credentials
- Verify app password is correct
- Test manually: `node send_email.js "test@test.com" "Test" "Body"`

### WhatsApp Issues

**Problem:** QR code not showing
**Solution:**
- Close WhatsApp Web in browser
- Delete `whatsapp_session_js/` folder
- Run: `node whatsapp_watcher_node.js`
- Scan QR again

**Problem:** Messages not sending
**Solution:**
- Check `whatsapp_watcher_node.js` is running
- Check file is in `Send_Queue/`
- Watch console for "Sending queued message..."
- Verify phone number format: `+923001234567`

**Problem:** Session expired
**Solution:**
- Delete `whatsapp_session_js/` folder
- Re-scan QR code

### LinkedIn Issues

**Problem:** Not logged in
**Solution:**
- Run: `python setup_linkedin_login.py`
- Login again
- Session saved in `linkedin_session/`

**Problem:** Post not publishing
**Solution:**
- Check `execute_approved.py` is running
- Check file is in `Approved/` folder
- Filename starts with `APPROVAL_linkedin_post_`
- Watch executor console for "Executing LinkedIn post..."

### Executor Issues

**Problem:** Approved tasks not executing
**Solution:**
- Check `execute_approved.py` is running
- Check files are in `Approved/` folder
- Check file format matches expected structure
- Check logs in console

**Problem:** "Missing required fields" error
**Solution:**
- Email: Check YAML has `to:`, `subject:`, and `## Email Body` section
- WhatsApp: Check YAML has `phone:` and `## Message` section
- LinkedIn: Check has `## Post Content` section

---

## 📊 Monitoring & Logs

### Check System Status
```bash
# Count files in each folder
echo "Needs Action:" && ls "Needs Action" | wc -l
echo "Pending Approval:" && ls "Pending Approval" | wc -l
echo "Approved:" && ls "Approved" | wc -l
echo "Done:" && ls "Done" | wc -l
```

### View Recent Activity
```bash
# Recent tasks in Done folder
ls -lt "Done" | head -10

# Recent approvals
ls -lt "Pending Approval" | head -10
```

### Check Logs
- Orchestrator logs: Console output from `run_automation.py`
- Executor logs: Console output from `execute_approved.py`
- Watcher logs: Console output from watcher scripts

---

## 🚀 Advanced Features

### Custom Task Types

Add new task types by editing `engine/orchestrator.py`:

1. Add detection logic in `_detect_task_type()`
2. Add processing method `_process_[type]_task()`
3. Add to `_process_task_directly()` switch

### Custom Auto-Replies

Edit auto-reply messages in:
- WhatsApp: `whatsapp_watcher_node.js`
- Email: `engine/watcher_gmail.py`

### Scheduling

Use cron (Linux/Mac) or Task Scheduler (Windows) to:
- Start watchers on boot
- Restart if crashed
- Run cleanup scripts

---

## 📚 Best Practices

### Security
- ✅ Never commit `credentials.json`, `token.pickle`, `.env`
- ✅ Use app passwords, not main passwords
- ✅ Review all approvals before moving to `Approved/`
- ✅ Keep sessions secure (WhatsApp, LinkedIn)

### Organization
- ✅ Archive old tasks from `Done/` monthly
- ✅ Clear `Rejected/` folder regularly
- ✅ Keep `Inbox/` clean
- ✅ Use descriptive filenames

### Performance
- ✅ Keep watchers running continuously
- ✅ Process approvals promptly
- ✅ Monitor disk space (logs, sessions)
- ✅ Restart services weekly

### Quality
- ✅ Always review AI-drafted responses
- ✅ Edit for tone and accuracy
- ✅ Test with small batches first
- ✅ Monitor sent messages for quality

---

## 🎓 Learning Resources

### Understanding the Code
- `engine/orchestrator.py` - Main task processing logic
- `engine/approval_manager.py` - Approval workflow
- `execute_approved.py` - Task execution
- `engine/watcher_*.py` - Channel monitoring

### Extending the System
- Add new channels (Telegram, Slack, etc.)
- Add new task types (SMS, voice, etc.)
- Integrate with CRM (Odoo, Salesforce)
- Add analytics and reporting

---

## 📞 Support

### Common Questions

**Q: Can I run this on a server?**
A: Yes! Use `screen` or `tmux` to keep processes running.

**Q: Can I add more channels?**
A: Yes! Create new watcher scripts following existing patterns.

**Q: Is this production-ready?**
A: It's a prototype. Add error handling, logging, and monitoring for production.

**Q: Can I use different AI models?**
A: Yes! Modify orchestrator to use different APIs (OpenAI, etc.)

---

## 🎉 Quick Start Checklist

- [ ] Install Python 3.8+
- [ ] Install Node.js 16+
- [ ] Install dependencies (pip, npm)
- [ ] Configure Gmail API
- [ ] Authenticate Gmail
- [ ] Configure WhatsApp
- [ ] Configure email sending
- [ ] Test email sending
- [ ] Test WhatsApp sending
- [ ] Start orchestrator
- [ ] Start executor
- [ ] Start watchers
- [ ] Drop test file in Inbox
- [ ] Review approval
- [ ] Approve and verify execution
- [ ] ✅ System running!

---

## 📝 Summary

**AI Employee Vault** is a complete automation system that:
1. **Monitors** multiple channels (Gmail, WhatsApp, LinkedIn, Inbox)
2. **Processes** tasks with AI (drafts responses)
3. **Requires** human approval (review before sending)
4. **Executes** approved tasks (sends emails, messages, posts)
5. **Organizes** everything in folders (clear workflow)

**Key Components:**
- **Watchers:** Monitor channels, create tasks
- **Orchestrator:** Process tasks, create approvals
- **Executor:** Execute approved tasks
- **Folders:** Organize workflow (Needs Action → Pending → Approved → Done)

**Start using:**
```bash
# Terminal 1
python run_automation.py

# Terminal 2
python execute_approved.py

# Terminal 3
python gmail_watcher.py

# Terminal 4
node whatsapp_watcher_node.js
```

Drop files in `Inbox/`, review in `Pending Approval/`, approve, and watch automation happen! 🚀
