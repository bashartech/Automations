# AI Employee Vault - Complete System Documentation

## 🎯 Purpose
This skill provides comprehensive documentation of the entire AI Employee Vault system, including architecture, all watchers, automation flows, Claude integration, and operational procedures. Use this for onboarding, troubleshooting, and system maintenance.

---

## 📁 PROJECT STRUCTURE

```
AI_Employee_Vault/
├── .claude/
│   └── skills/
│       ├── enterprise_saas_extension.md    # Phase 1-3 implementation guide
│       ├── facebook_automation.md          # Facebook API integration
│       └── twitter_automation.md           # Twitter API integration
│
├── dashboard/
│   ├── app.py                              # Flask web application
│   ├── templates/
│   │   └── index.html                      # Main dashboard UI
│   └── static/
│       ├── css/
│       │   └── style.css                   # Dashboard styles
│       └── js/
│           └── dashboard.js                # Dashboard JavaScript
│
├── engine/
│   ├── orchestrator.py                     # Main automation orchestrator
│   ├── approval_manager.py                 # Approval workflow management
│   ├── logger.py                           # Centralized logging
│   ├── diagram_generator.py                # Mermaid → PNG converter
│   ├── facebook_manager.py                 # Facebook Graph API
│   ├── twitter_manager.py                  # Twitter API
│   └── calendar_manager.py                 # Google Calendar API
│
├── scheduler/
│   ├── __init__.py
│   ├── scheduler_db.py                     # SQLite database for schedules
│   ├── twitter_scheduler.py                # Scheduled Twitter posts
│   ├── facebook_scheduler.py               # Scheduled Facebook posts
│   └── main_scheduler.py                   # Main scheduler runner
│
├── watchers/
│   ├── gmail_watcher.py                    # Gmail inbox monitoring
│   ├── whatsapp_watcher_node.js            # WhatsApp Web automation
│   ├── linkedin_watcher.py                 # LinkedIn monitoring
│   └── inbox_watcher.py                    # General inbox monitoring
│
├── config.py                               # Centralized configuration
├── execute_approved.py                     # Execute approved actions
├── ecosystem.config.js                     # PM2 process management
├── requirements.txt                        # Python dependencies
├── package.json                            # Node.js dependencies
└── .env.example                            # Environment variables template
```

---

## 🏗️ SYSTEM ARCHITECTURE

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    DIGITAL OCEAN CLOUD (24/7)                   │
│                     IP: 167.71.237.77                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Facebook   │  │    Gmail     │  │   WhatsApp   │          │
│  │   Manager    │  │   Manager    │  │   Manager    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                  ┌────────▼────────┐                            │
│                  │  Orchestrator   │                            │
│                  │   (AI Engine)   │                            │
│                  └────────┬────────┘                            │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐          │
│  │   Twitter    │  │    Odoo      │  │  Dashboard   │          │
│  │   Manager    │  │   Manager    │  │   (Web UI)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │           Scheduler Service                     │           │
│  │  - Checks every 60 seconds for scheduled posts  │           │
│  │  - Creates approval files at scheduled time     │           │
│  │  - Uses Claude for content enhancement          │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
│  PM2 Processes:                                                 │
│  - orchestrator (AI task processing)                            │
│  - execute-approved (Execute approved actions)                  │
│  - dashboard (Web UI - Port 5000)                               │
│  - post-scheduler (Scheduled posts)                             │
│  - gmail-watcher (Gmail monitoring)                             │
│  - inbox-watcher (General inbox)                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    LOCAL MACHINE (On-Demand)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   WhatsApp   │  │   Browser    │  │   Claude     │          │
│  │   Session    │  │   Access     │  │   Code CLI   │          │
│  │  (Required)  │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 CORE WORKFLOW

### 1. Task Creation Flow

```
User creates task via:
  1. Dashboard UI (http://167.71.237.77:5000)
  2. Email to monitored inbox
  3. WhatsApp message
  4. File drop in Inbox/ folder
        ↓
Task file created in Needs Action/ folder
Format: markdown with YAML frontmatter
        ↓
Orchestrator detects new file (watchdog)
        ↓
Orchestrator analyzes task type:
  - twitter → _process_twitter_task()
  - facebook → _process_facebook_task()
  - email → _process_email_task()
  - odoo → _process_odoo_task()
        ↓
Claude AI generates professional content:
  - Reads task content
  - Calls Claude CLI (claude -p)
  - Gets AI-generated response
  - If diagram needed → generates Mermaid code
        ↓
Creates approval file in Pending Approval/
        ↓
Human reviews and approves:
  - Move to Approved/ → execute_approved.py processes
  - Move to Rejected/ → task discarded
  - Move to Done/ → task completed manually
```

### 2. Approval Execution Flow

```
execute_approved.py watches Approved/ folder
        ↓
New file detected
        ↓
Reads YAML frontmatter:
  - type: facebook_approval
  - action: facebook_post
  - image_path: /path/to/image.png (optional)
        ↓
Extracts content from "## AI-Generated Content" section
        ↓
Executes based on action:
  - facebook_post → FacebookPageManager.create_post()
  - facebook_post + image → create_post_with_local_image()
  - twitter_post → Opens twitter.com/intent/tweet
  - email → Gmail API send
  - odoo_lead → Odoo XML-RPC create
        ↓
Logs execution result
        ↓
Moves file to Done/ folder
```

---

## 🤖 CLAUDE AI INTEGRATION

### How Claude Works in This System

**Location:** `engine/orchestrator.py`

**Process:**
```python
def _process_twitter_task(self, file_path: Path, task_content: str) -> bool:
    # 1. Extract user prompt from task file
    user_prompt = extract_content(task_content)
    
    # 2. Detect if diagram needed
    diagram_keywords = ['diagram', 'flowchart', 'workflow', 'architecture']
    needs_diagram = any(keyword in user_prompt.lower() for keyword in diagram_keywords)
    
    # 3. Build Claude prompt
    if needs_diagram:
        claude_prompt = f"""
You are a professional social media manager.

Generate a Twitter post based on this request:
"{user_prompt}"

Requirements:
- Maximum 280 characters
- Include 2-3 relevant hashtags
- Professional but friendly tone

Also generate a Mermaid diagram code if technical.

Output format:
TEXT:
[your tweet here]

MERMAID:
[mermaid code or "NONE"]
"""
    else:
        claude_prompt = f"""
Generate a Twitter post based on:
"{user_prompt}"

Output ONLY the tweet text.
"""
    
    # 4. Call Claude CLI
    result = subprocess.run(
        [claude_path, '-p'],
        input=claude_prompt,
        capture_output=True,
        text=True,
        timeout=120,
        shell=True,
        encoding='utf-8'
    )
    
    # 5. Parse Claude's response
    output = result.stdout.strip()
    if 'TEXT:' in output and 'MERMAID:' in output:
        tweet_text = extract_text_section(output)
        mermaid_code = extract_mermaid_section(output)
    
    # 6. Generate diagram if Mermaid code provided
    if mermaid_code:
        diagram_path = DiagramGenerator.generate_png(mermaid_code)
    
    # 7. Create approval file with AI content
    create_approval_file(tweet_text, diagram_path)
```

**Claude Configuration:**
- **Model:** Claude 3.5 Sonnet (via Claude Code CLI)
- **Location:** `C:\Users\H P\AppData\Roaming\npm\claude.cmd`
- **Timeout:** 120 seconds
- **Encoding:** UTF-8 (critical for emojis)

**Prompt Engineering Best Practices:**
1. Be specific about role ("professional social media manager")
2. Include clear constraints (280 chars, 2-3 hashtags)
3. Specify output format (TEXT:/MERMAID: sections)
4. Include examples when possible
5. Use "Output ONLY" for strict formatting

---

## 📧 WATCHERS - DETAILED DOCUMENTATION

### 1. Gmail Watcher (`gmail_watcher.py`)

**Purpose:** Monitor Gmail inbox for new emails and create tasks automatically.

**How It Works:**
```python
# 1. Authenticate with Gmail API
credentials = Credentials.from_authorized_user_file('token.json', SCOPES)
service = build('gmail', 'v1', credentials=credentials)

# 2. Poll inbox every 60 seconds
while True:
    # Get unread messages
    results = service.users().messages().list(
        userId='me',
        labelIds=['UNREAD'],
        maxResults=10
    ).execute()
    
    # Process each message
    for message in results.get('messages', []):
        msg = service.users().messages().get(
            userId='me',
            id=message['id'],
            format='full'
        ).execute()
        
        # Extract email data
        subject = get_header(msg['payload']['headers'], 'Subject')
        from_email = get_header(msg['payload']['headers'], 'From')
        body = extract_body(msg['payload'])
        
        # Create task file
        task_content = f"""---
type: email
action: reply
from: {from_email}
subject: {subject}
---

# Email Response Required

## Original Email
**From:** {from_email}
**Subject:** {subject}

## Content
{body}

## Action Required
Draft and send reply
"""
        
        # Save to Needs Action folder
        save_task(task_content)
        
        # Mark as read
        service.users().messages().modify(
            userId='me',
            id=message['id'],
            body={'removeLabelIds': ['UNREAD']}
        ).execute()
    
    # Wait 60 seconds
    time.sleep(60)
```

**Configuration:**
```bash
# .env
GMAIL_CREDENTIALS_PATH=/home/AI_Employee_Vault/credentials.json
GMAIL_TOKEN_PATH=/home/AI_Employee_Vault/gmail_token.json
GMAIL_POLL_INTERVAL=60  # seconds
```

**Setup Steps:**
1. Go to Google Cloud Console
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Download credentials.json
5. Run `python generate_token.py` to authenticate
6. Start watcher: `python gmail_watcher.py`

---

### 2. WhatsApp Watcher (`whatsapp_watcher_node.js`)

**Purpose:** Monitor WhatsApp Web for new messages and create tasks.

**How It Works:**
```javascript
const { Client, LocalAuth } = require('whatsapp-web.js');

// Initialize client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox']
    }
});

// On QR code (first time setup)
client.on('qr', qr => {
    console.log('Scan this QR code:', qr);
    // QR code displayed in terminal or saved as image
});

// On ready
client.on('ready', () => {
    console.log('WhatsApp is ready!');
});

// On message
client.on('message', async message => {
    // Only process unread messages
    if (message._data.isUnread) {
        // Extract message data
        const from = message.from;
        const body = message.body;
        const timestamp = message.timestamp;
        
        // Create task file
        const taskContent = `---
type: whatsapp
action: reply
from: ${from}
timestamp: ${timestamp}
---

# WhatsApp Message Response

## Original Message
**From:** ${from}
**Time:** ${new Date(timestamp * 1000).toISOString()}

## Content
${body}

## Action Required
Draft and send reply
`;
        
        // Save to Needs Action folder
        fs.writeFileSync(
            `Needs Action/whatsapp_${from}_${timestamp}.md`,
            taskContent
        );
        
        // Mark as read
        await message.markRead();
    }
});

// Initialize
client.initialize();
```

**Configuration:**
```bash
# .env
WHATSAPP_SESSION_PATH=/home/AI_Employee_Vault/.wwebjs_auth
WHATSAPP_POLL_INTERVAL=30  # seconds
```

**Setup Steps:**
1. Install Node.js dependencies: `npm install`
2. Run watcher: `node whatsapp_watcher_node.js`
3. Scan QR code with WhatsApp mobile app
4. Session saved for future runs

**Important Notes:**
- Requires active WhatsApp session
- QR code scan needed only once (session persisted)
- Runs locally (not on cloud) due to WhatsApp Web restrictions

---

### 3. LinkedIn Watcher (`linkedin_watcher.py`)

**Purpose:** Monitor LinkedIn for connection requests, messages, and comments.

**How It Works:**
```python
from playwright.sync_api import sync_playwright

def monitor_linkedin():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Login to LinkedIn
        page.goto('https://www.linkedin.com/login')
        page.fill('#username', LINKEDIN_EMAIL)
        page.fill('#password', LINKEDIN_PASSWORD)
        page.click('button[type="submit"]')
        
        # Navigate to notifications
        page.goto('https://www.linkedin.com/notifications/')
        
        # Extract notifications
        notifications = page.query_selector_all('.notification-item')
        
        for notification in notifications:
            # Extract data
            type = notification.get_attribute('data-type')
            actor = notification.query_selector('.actor-name').text_content()
            content = notification.query_selector('.notification-content').text_content()
            
            # Create task based on type
            if type == 'connection_request':
                create_connection_task(actor)
            elif type == 'message':
                create_message_task(actor, content)
            elif type == 'comment':
                create_comment_task(actor, content)
        
        browser.close()
```

**Configuration:**
```bash
# .env
LINKEDIN_EMAIL=your@email.com
LINKEDIN_PASSWORD=your_password
LINKEDIN_POLL_INTERVAL=300  # 5 minutes
```

**Important Notes:**
- Uses Playwright for browser automation
- LinkedIn doesn't have official API for this
- May require CAPTCHA solving
- Consider using LinkedIn API for production

---

### 4. Inbox Watcher (`inbox_watcher.py`)

**Purpose:** Monitor Inbox/ folder for file drops and create tasks.

**How It Works:**
```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class InboxHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        
        file_path = Path(event.src_path)
        
        # Only process supported files
        if file_path.suffix.lower() not in ['.txt', '.md', '.pdf', '.doc', '.docx']:
            return
        
        # Create task
        task_content = f"""---
type: general
source: inbox
file: {file_path.name}
---

# File Processing Required

## File Details
**Name:** {file_path.name}
**Path:** {file_path}
**Uploaded:** {datetime.now().isoformat()}

## Action Required
Review file and take appropriate action
"""
        
        # Save to Needs Action
        save_task(task_content)

# Start watcher
observer = Observer()
observer.schedule(InboxHandler(), 'Inbox/', recursive=False)
observer.start()
```

---

## 📊 DATABASE SCHEMAS

### Scheduler Database (`scheduled_posts.db`)

```sql
-- Scheduled posts table
CREATE TABLE scheduled_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    platform TEXT NOT NULL,          -- 'twitter' or 'facebook'
    content TEXT NOT NULL,
    scheduled_time DATETIME NOT NULL,
    status TEXT DEFAULT 'pending',   -- pending, processed, failed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    posted_at DATETIME,
    error_message TEXT,
    approval_file TEXT,              -- Path to created approval file
    hashtags TEXT,
    is_thread INTEGER DEFAULT 0      -- For Twitter threads
);

-- Index for performance
CREATE INDEX idx_scheduled_time ON scheduled_posts(scheduled_time);
CREATE INDEX idx_status ON scheduled_posts(status);
```

### Enterprise Database (Phase 1)

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    company_id INTEGER REFERENCES companies(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Companies table
CREATE TABLE companies (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subscription_tier VARCHAR(20) DEFAULT 'starter',
    subscription_status VARCHAR(20) DEFAULT 'active',
    stripe_customer_id VARCHAR(100) UNIQUE,
    max_users INTEGER DEFAULT 1,
    max_emails_per_month INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(10) DEFAULT 'normal',
    user_id INTEGER REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    content TEXT,
    metadata JSONB,
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- Audit logs table
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    company_id INTEGER REFERENCES companies(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    timestamp TIMESTAMP DEFAULT NOW(),
    details JSONB
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id INTEGER PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) UNIQUE,
    stripe_subscription_id VARCHAR(100) UNIQUE,
    stripe_price_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 PM2 PROCESS MANAGEMENT

### Configuration (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'orchestrator',
      script: 'python3',
      args: 'engine/orchestrator.py',
      cwd: '/home/AI_Employee_Vault',
      interpreter: 'none',
      env: {
        PYTHONUNBUFFERED: '1',
        PATH: '/home/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
      },
      error_file: '/home/AI_Employee_Vault/Logs/orchestrator.err',
      out_file: '/home/AI_Employee_Vault/Logs/orchestrator.out',
      log_file: '/home/AI_Employee_Vault/Logs/orchestrator.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'execute-approved',
      script: 'python3',
      args: 'execute_approved.py',
      cwd: '/home/AI_Employee_Vault',
      interpreter: 'none',
      env: {
        PYTHONUNBUFFERED: '1'
      },
      error_file: '/home/AI_Employee_Vault/Logs/execute_approved.err',
      out_file: '/home/AI_Employee_Vault/Logs/execute_approved.out',
      log_file: '/home/AI_Employee_Vault/Logs/execute_approved.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'dashboard',
      script: 'python3',
      args: 'dashboard/app.py',
      cwd: '/home/AI_Employee_Vault',
      interpreter: 'none',
      env: {
        PYTHONUNBUFFERED: '1',
        PORT: '5000'
      },
      error_file: '/home/AI_Employee_Vault/Logs/dashboard.err',
      out_file: '/home/AI_Employee_Vault/Logs/dashboard.out',
      log_file: '/home/AI_Employee_Vault/Logs/dashboard.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'post-scheduler',
      script: 'python3',
      args: 'scheduler/main_scheduler.py',
      cwd: '/home/AI_Employee_Vault',
      interpreter: 'none',
      env: {
        PYTHONUNBUFFERED: '1'
      },
      error_file: '/home/AI_Employee_Vault/Logs/scheduler.err',
      out_file: '/home/AI_Employee_Vault/Logs/scheduler.out',
      log_file: '/home/AI_Employee_Vault/Logs/scheduler.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### Common PM2 Commands

```bash
# Start all processes
pm2 start ecosystem.config.js

# Start specific process
pm2 start orchestrator

# Stop all
pm2 stop all

# Restart all
pm2 restart all

# View status
pm2 status

# View logs
pm2 logs

# View specific logs
pm2 logs orchestrator --lines 50

# Monitor resources
pm2 monit

# Save process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## 🔍 TROUBLESHOOTING GUIDE

### Issue: Orchestrator Not Processing Tasks

**Symptoms:**
- Tasks in Needs Action/ not being processed
- No logs from orchestrator

**Solution:**
```bash
# Check if orchestrator is running
pm2 status orchestrator

# If stopped, start it
pm2 start orchestrator

# Check logs for errors
pm2 logs orchestrator --lines 100

# If Claude CLI not found, check path
which claude

# If Python error, check syntax
python3 -m py_compile engine/orchestrator.py
```

### Issue: Images Not Posting to Facebook

**Symptoms:**
- Logs show "Posting text only"
- Image exists in Post_Images/

**Solution:**
```bash
# Check if image_path in approval file
cat Approved/APPROVAL_facebook_post_*.md | grep image_path

# Check if execute_approved.py has create_post_with_local_image
grep -n "create_post_with_local_image" execute_approved.py

# Check facebook_manager.py for method
grep -n "def create_post_with_local_image" engine/facebook_manager.py

# Restart execute-approved
pm2 restart execute-approved
```

### Issue: Scheduler Not Running

**Symptoms:**
- Scheduled posts not being processed
- No logs from post-scheduler

**Solution:**
```bash
# Check if scheduler is running
pm2 status post-scheduler

# Check server time (timezone issue)
date
timedatectl

# Fix timezone if needed
timedatectl set-timezone Asia/Karachi

# Check database for pending posts
cd /home/AI_Employee_Vault
source venv/bin/activate
python3 << EOF
from scheduler.scheduler_db import get_pending_posts
posts = get_pending_posts()
print(f"Pending posts: {len(posts)}")
for post in posts:
    print(f"ID: {post[0]}, Time: {post[3]}")
EOF

# Restart scheduler
pm2 restart post-scheduler
```

### Issue: Emoji Encoding Broken

**Symptoms:**
- Emojis showing as `ðŸš€` instead of `🚀`
- Approval files have garbled text

**Solution:**
```python
# In orchestrator.py, ensure UTF-8 encoding
result = subprocess.run(
    [claude_path, '-p'],
    input=claude_prompt,
    capture_output=True,
    text=True,
    timeout=120,
    shell=True,
    encoding='utf-8',  # ← Add this
    errors='replace'   # ← Add this
)

# When writing files
approval_path.write_text(approval_content, encoding='utf-8')
```

---

## 📈 MONITORING & ALERTS

### Health Check Script

```python
# utils/health_check.py
import psutil
import requests
from datetime import datetime

def check_system_health():
    alerts = []
    
    # Check CPU
    cpu_percent = psutil.cpu_percent(interval=1)
    if cpu_percent > 80:
        alerts.append(f"High CPU usage: {cpu_percent}%")
    
    # Check memory
    memory = psutil.virtual_memory()
    if memory.percent > 80:
        alerts.append(f"High memory usage: {memory.percent}%")
    
    # Check disk
    disk = psutil.disk_usage('/')
    if disk.percent > 80:
        alerts.append(f"High disk usage: {disk.percent}%")
    
    # Check dashboard
    try:
        response = requests.get('http://localhost:5000', timeout=5)
        if response.status_code != 200:
            alerts.append(f"Dashboard returning {response.status_code}")
    except Exception as e:
        alerts.append(f"Dashboard not accessible: {e}")
    
    # Check PM2 processes
    # (Parse pm2 status output)
    
    # Send alerts if any
    if alerts:
        send_alert(alerts)
    
    return len(alerts) == 0

def send_alert(alerts):
    # Send via Telegram/Email/SMS
    pass

# Run every 5 minutes
while True:
    check_system_health()
    time.sleep(300)
```

---

## 🎯 ONBOARDING CHECKLIST

### For New Team Members

- [ ] Read this documentation
- [ ] Setup local development environment
- [ ] Get access to cloud server
- [ ] Understand folder structure
- [ ] Review PM2 processes
- [ ] Test creating a task via dashboard
- [ ] Test approval workflow
- [ ] Review Claude prompts
- [ ] Understand database schemas
- [ ] Review security practices

### For New Customers

- [ ] Create company account
- [ ] Add users
- [ ] Configure integrations (Gmail, Facebook, etc.)
- [ ] Set up billing
- [ ] Review user guide
- [ ] Schedule onboarding call
- [ ] Configure custom workflows
- [ ] Setup analytics dashboard

---

**This documentation covers the complete AI Employee Vault system!** 🚀

Use this skill for:
- Onboarding new team members
- Troubleshooting issues
- Understanding system architecture
- Planning enhancements
- Customer support
- System maintenance
