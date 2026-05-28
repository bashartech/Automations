# WhatsApp Automation Bot

A powerful WhatsApp automation system with auto-reply, FAQ-based responses, and conversation logging using SQLite.

## 🌟 Features

- ✅ **Auto-Reply System** - Instant automated responses
- ✅ **FAQ-Based Bot** - Intelligent keyword matching
- ✅ **Conversation Logging** - SQLite database for all interactions
- ✅ **Rate Limiting** - Prevent spam and abuse
- ✅ **Command System** - Special commands for advanced features
- ✅ **Analytics** - Track message statistics
- ✅ **Business Hours** - Optional time-based responses

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- WhatsApp account
- Smartphone with WhatsApp installed

## 🚀 Installation

### Step 1: Clone/Download the project

```bash
cd Watsapp_Automation
```

### Step 2: Install dependencies

```bash
npm install
```

This will install:
- `whatsapp-web.js` - WhatsApp Web API
- `qrcode-terminal` - QR code display
- `sqlite3` - Database

### Step 3: Start the bot

```bash
npm start
```

### Step 4: Scan QR Code

1. A QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code displayed in terminal
5. Wait for "WhatsApp Bot is Ready!" message

## 📱 How It Works

### User Workflow

1. **User sends message** → "What are your business hours?"
2. **Bot receives & logs** → Saves to database
3. **FAQ matching** → Searches keywords in database
4. **Auto-reply sent** → User receives instant response
5. **Reply logged** → Complete conversation saved

### Example Conversations

**Example 1: FAQ Match**
```
User: What are your business hours?
Bot: 🕐 Business Hours
     Monday - Friday: 9:00 AM - 6:00 PM
     Saturday: 10:00 AM - 4:00 PM
     Sunday: Closed
```

**Example 2: No Match**
```
User: Can you customize products?
Bot: Thank you for your message! 🙏
     Our team will respond shortly.
     For immediate help, type 'help'
```

**Example 3: Command**
```
User: !help
Bot: 📋 Available Commands
     • hours - Business hours
     • pricing - Price information
     • location - Our address
     ...
```

## 🎯 Available Keywords

The bot recognizes these keywords (case-insensitive):

| Keyword | Response |
|---------|----------|
| hours, timing, open | Business hours |
| price, cost, pricing | Pricing information |
| location, address | Office location |
| contact, phone, email | Contact details |
| shipping, delivery | Shipping info |
| return, refund | Return policy |
| payment, pay | Payment methods |
| help, menu | Command list |
| hi, hello | Greeting |

## 🛠️ Configuration

Edit `config.js` to customize:

```javascript
module.exports = {
  bot: {
    autoReply: true,  // Enable/disable auto-replies
    logAllMessages: true  // Log all conversations
  },
  
  responses: {
    fallback: "Your custom fallback message",
    error: "Your error message"
  },
  
  rateLimit: {
    enabled: true,
    maxMessagesPerMinute: 10
  }
};
```

## 📊 Database Structure

### Tables

**conversations**
- Stores all incoming messages and replies
- Fields: id, phone_number, contact_name, message, reply, timestamp, etc.

**faq**
- Stores FAQ keywords and responses
- Fields: id, keywords, response, category, usage_count

**analytics**
- Daily statistics
- Fields: date, total_messages, auto_handled, manual_needed

## 🔧 Commands

Send these commands in WhatsApp:

- `!help` - Show available commands
- `!stats` - Today's statistics
- `!ping` - Check if bot is active

## 📈 Monitoring & Analytics

### View Logs (SQLite)

```bash
sqlite3 whatsapp_logs.db
```

```sql
-- See all conversations today
SELECT * FROM conversations 
WHERE DATE(timestamp) = DATE('now');

-- Most asked questions
SELECT message, COUNT(*) as count 
FROM conversations 
GROUP BY message 
ORDER BY count DESC 
LIMIT 10;

-- Unhandled messages
SELECT * FROM conversations 
WHERE handled = 0;
```

### Add New FAQ

```sql
INSERT INTO faq (keywords, response, category) 
VALUES ('warranty,guarantee', 'We offer 1-year warranty on all products!', 'policy');
```

## 🎨 Customization

### Add Custom FAQ

Edit `faq.json`:

```json
{
  "keywords": "custom,keyword,here",
  "response": "Your custom response here",
  "category": "custom"
}
```

Then restart the bot or add directly to database.

### Modify Responses

Edit `config.js` → `responses` section

### Change Business Hours

Edit `config.js` → `businessHours` section

## 🐛 Troubleshooting

### QR Code not appearing
- Check internet connection
- Ensure port 443 is not blocked
- Try restarting the bot

### Bot not responding
- Check if bot shows "Ready" status
- Verify FAQ database has entries
- Check console for errors

### Database errors
- Delete `whatsapp_logs.db` and restart
- Check file permissions

### Session expired
- Delete `.wwebjs_auth` folder
- Restart and scan QR code again

## 📁 Project Structure

```
Watsapp_Automation/
├── index.js           # Main bot logic
├── database.js        # Database operations
├── config.js          # Configuration
├── faq.json          # FAQ data
├── package.json      # Dependencies
├── README.md         # Documentation
├── .gitignore        # Git ignore rules
├── whatsapp_logs.db  # SQLite database (auto-created)
└── .wwebjs_auth/     # WhatsApp session (auto-created)
```

## 🔒 Security Notes

- Never commit `.wwebjs_auth/` folder
- Keep `whatsapp_logs.db` secure (contains user data)
- Use environment variables for sensitive data
- Implement proper access controls in production

## 🚀 Future Enhancements

- [ ] Multi-turn conversations
- [ ] Media message handling
- [ ] Admin dashboard
- [ ] Webhook integration
- [ ] AI-powered responses
- [ ] Multi-language support
- [ ] Scheduled messages
- [ ] Group message support

## 📝 License

MIT License - Feel free to use and modify

## 🤝 Support

For issues or questions:
1. Check troubleshooting section
2. Review console logs
3. Check database entries
4. Verify configuration

## 📞 Contact

Created with ❤️ for WhatsApp automation

---

**Note**: This bot uses WhatsApp Web protocol. Keep your phone connected to internet for the bot to work.
