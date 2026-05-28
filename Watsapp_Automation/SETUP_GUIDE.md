# Advanced WhatsApp AI Assistant - Setup Guide

## 🎯 What You're Building

A powerful WhatsApp bot with:
- ✅ **Dual Mode**: FAQ bot for public, AI assistant for you
- ✅ **Gemini AI Integration**: Natural language understanding
- ✅ **Task Management**: Create, view, complete tasks
- ✅ **Web Search**: Real-time information retrieval
- ✅ **Calendar Integration**: (Ready for Google auth)
- ✅ **Email Integration**: (Ready for Google auth)
- ✅ **Access Control**: Owner vs public permissions
- ✅ **Web Dashboard**: Monitor all activity

---

## 📦 Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `@google/generative-ai` - Gemini AI
- `dotenv` - Environment variables
- `axios` - HTTP requests
- `chrono-node` - Natural date parsing
- `node-cron` - Task scheduling
- All previous dependencies

---

## 🔑 Step 2: Configure Environment Variables

### Create `.env` file:

```bash
cp .env.example .env
```

### Edit `.env` with your details:

```env
# Your WhatsApp number (IMPORTANT!)
OWNER_PHONE_NUMBER=+923001234567

# Get Gemini API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Web Search (choose one)
TAVILY_API_KEY=your_tavily_key  # Get from tavily.com
# OR
SERPER_API_KEY=your_serper_key  # Get from serper.dev

# Feature toggles
ENABLE_AI=true
ENABLE_WEB_SEARCH=true
ENABLE_TASKS=true
ENABLE_CALENDAR=false  # Set true when Google auth ready
ENABLE_EMAIL=false     # Set true when Google auth ready

# Dashboard
DASHBOARD_PORT=3001
```

---

## 🔐 Step 3: Get Your Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste it in `.env` as `GEMINI_API_KEY`

**Free tier includes:**
- 60 requests per minute
- Perfect for personal use

---

## 🚀 Step 4: Start the Bot

### Terminal 1 - WhatsApp Bot:
```bash
npm start
```

**What happens:**
1. Database initialized with new tables (users, tasks, action_logs)
2. Services initialized (AI, Search, Tasks)
3. QR code displayed
4. **Scan QR code with WhatsApp**
5. Bot shows "Ready" with your owner number

### Terminal 2 - Dashboard (Optional):
```bash
npm run dashboard
```

Then open: http://localhost:3001

---

## 🧪 Step 5: Test Your Bot

### Test as Owner (You)

Send these messages to your bot number:

**1. AI Conversation:**
```
You: "Hi, what can you do?"
Bot: [AI-powered response about capabilities]
```

**2. Task Management:**
```
You: "add task Review project proposal"
Bot: ✅ Task Created
     📝 Review project proposal
     ✨ Task ID: 1

You: "show tasks"
Bot: 📋 Your Tasks
     Pending (1):
     1. Review project proposal
        ID: 1
```

**3. Web Search:**
```
You: "search latest AI news"
Bot: 🔍 Search Results
     📌 Quick Answer: [AI summary]
     Top Results:
     1. [Article title]
        [Snippet]
        🔗 [URL]
```

**4. Natural Conversation:**
```
You: "What are my skills?"
Bot: [AI explains your tech stack from system prompt]

You: "Tell me about my projects"
Bot: [AI describes your featured projects]
```

**5. Help Command:**
```
You: "help"
Bot: 🤖 AI Assistant Commands
     [Full command list]
```

---

### Test as Public User

Have someone else message your bot:

**1. FAQ Query:**
```
User: "What are your skills?"
Bot: ⚡ Tech Stack & Skills
     💻 Frontend: Next.js, React...
     [FAQ response]
```

**2. General Question:**
```
User: "Can you help with AI projects?"
Bot: [AI-powered response about your services]
```

**3. Restricted Actions:**
```
User: "add task something"
Bot: [FAQ response - no task created]
```

**Key Difference:**
- **You (owner)**: Full AI assistant, all features
- **Others (public)**: FAQ + limited AI chat, no actions

---

## 🎯 How Access Control Works

### Architecture:

```
Message Received
    ↓
Check Phone Number
    ↓
┌─────────────────┬─────────────────┐
│   YOUR NUMBER   │  OTHER NUMBERS  │
│   (Owner)       │   (Public)      │
└────────┬────────┴────────┬────────┘
         ↓                 ↓
    FULL ACCESS      LIMITED ACCESS
    • AI Chat         • FAQ Only
    • Tasks           • Basic AI Chat
    • Search          • No Actions
    • Calendar*       • No Tasks
    • Email*          • No Search
    
    * Coming soon
```

### Database Roles:

```sql
-- Your number (auto-created on first run)
phone_number: +923001234567
role: owner
permissions: ["all"]

-- Everyone else (auto-created on first message)
phone_number: +923009999999
role: public
permissions: []
```

---

## 📊 Dashboard Features

Open http://localhost:3001 to see:

### 1. Statistics Cards
- Total messages today
- Auto-handled count
- Messages needing review
- Unique contacts

### 2. Conversations Tab
- All messages and replies
- Search functionality
- Pagination

### 3. Unhandled Tab
- Messages that need human review

### 4. Contacts Tab
- All unique contacts
- Message count per contact

### 5. FAQ Stats Tab
- Most used FAQs
- Usage counts

### 6. Analytics Tab
- 7-day message trends
- Charts and graphs

---

## 🔧 Advanced Features

### Task Management

**Create tasks:**
```
"add task Review proposal by Friday"
"create task Call client - high priority"
"new task Buy groceries tomorrow"
```

**View tasks:**
```
"show tasks"
"list tasks"
"my tasks"
```

**Complete tasks:**
```
"complete task 1"
```

**Delete tasks:**
```
"delete task 2"
```

### Web Search

**Search anything:**
```
"search weather in Karachi"
"find latest Claude API updates"
"search best restaurants near me"
```

### AI Conversation

**Just chat naturally:**
```
"What's the best way to implement RAG?"
"Explain my AI Employee Vault project"
"How should I price my services?"
```

The AI knows:
- Your background (AI Engineer, 2-3 years)
- Your tech stack
- Your projects
- Your contact info

---

## 🔮 Coming Soon (When You Add Google Auth)

### Calendar Integration
```
"schedule meeting with client tomorrow 3pm"
"show my calendar"
"cancel meeting at 2pm"
```

### Email Integration
```
"send email to client@example.com about project"
"check my unread emails"
"summarize today's emails"
```

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY not found"
- Create `.env` file
- Add your Gemini API key
- Restart bot

### "Owner not configured"
- Add `OWNER_PHONE_NUMBER` to `.env`
- Use format: `+[country code][number]`
- Example: `+923001234567`
- Restart bot

### "AI Service - Disabled"
- Check `.env` has `GEMINI_API_KEY`
- Verify key is valid
- Check internet connection

### "Web Search - Disabled"
- Optional feature
- Add `TAVILY_API_KEY` or `SERPER_API_KEY` to enable
- Works without it (just no search feature)

### Bot not recognizing you as owner
- Check phone number format in `.env`
- Must include country code with `+`
- Check database: `sqlite3 whatsapp_logs.db "SELECT * FROM users;"`

---

## 📁 Project Structure

```
Watsapp_Automation/
├── index.js                 # Main bot (updated with access control)
├── database.js             # Database (updated with new tables)
├── config.js               # Configuration
├── faq.json               # FAQ data
├── .env                   # Your secrets (create this!)
├── .env.example          # Template
├── services/             # New services folder
│   ├── ai.service.js     # Gemini AI integration
│   ├── search.service.js # Web search
│   ├── task.service.js   # Task management
│   ├── calendar.service.js # Calendar (placeholder)
│   └── email.service.js  # Email (placeholder)
├── public/               # Dashboard files
│   ├── index.html
│   ├── app.js
│   └── style.css
├── dashboard.js          # Dashboard server
└── whatsapp_logs.db     # SQLite database
```

---

## 🎓 Usage Examples

### Scenario 1: You're Working

```
You: "add task Finish WhatsApp bot documentation"
Bot: ✅ Task Created

You: "search best practices for WhatsApp bots"
Bot: 🔍 [Search results]

You: "What should I include in the docs?"
Bot: [AI suggestions based on your project]
```

### Scenario 2: Client Messages You

```
Client: "What services do you offer?"
Bot: 💼 What I Can Help You With
     🤖 Build AI Employees...
     [FAQ response]

Client: "Can you build a chatbot?"
Bot: [AI response about your chatbot expertise]

Client: "What's your email?"
Bot: 📫 Contact Information
     📧 Email: bashartc13@gmail.com
```

### Scenario 3: Managing Your Day

```
You: "show tasks"
Bot: 📋 Your Tasks
     Pending (3):
     1. Finish documentation
     2. Call client
     3. Review proposal

You: "complete task 1"
Bot: ✅ Task #1 marked as completed!

You: "stats"
Bot: 📊 Your Dashboard
     [Full statistics]
```

---

## 🚀 Next Steps

1. ✅ **Test basic functionality** - Send messages as owner
2. ✅ **Test public access** - Have someone else message
3. ✅ **Try all features** - Tasks, search, AI chat
4. ✅ **Monitor dashboard** - Check logs and analytics
5. ⏳ **Add Google auth** - Enable calendar and email (later)

---

## 📞 Support

Created by **M. Bashar Sheikh**
📧 bashartc13@gmail.com

---

**Your advanced WhatsApp AI assistant is ready! 🎉**
