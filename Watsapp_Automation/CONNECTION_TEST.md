# 🔧 Connection Test Script

## Issue: Bot Not Detecting Messages

Let's verify the WhatsApp connection step by step.

---

## Step 1: Clean Start

Delete the old session and start fresh:

```bash
# Stop the bot (Ctrl+C)

# Delete WhatsApp session
rm -rf .wwebjs_auth
rm -rf .wwebjs_cache

# Delete database (to start fresh)
rm whatsapp_logs.db

# Start bot
npm start
```

---

## Step 2: Watch for These Messages

When bot starts, you should see:

```
✅ WhatsApp Bot is Ready!
```

---

## Step 3: Send Test Message

**IMPORTANT:** Send message from a DIFFERENT phone/WhatsApp account to your bot number.

Don't send from the same phone that scanned the QR code!

Send: `test`

---

## Step 4: Check Console

You should see ONE of these:

### Option A: Event Fires (Good!)
```
🔔 RAW MESSAGE EVENT FIRED!
   From: 923001234567@c.us
   Body: test
   Type: chat
```

If you see this, the bot IS receiving messages!

### Option B: No Event (Problem!)
```
[Nothing appears in console]
```

If nothing appears, the message event isn't firing.

---

## Common Issues & Fixes

### Issue 1: Sending from Same Phone
**Problem:** Can't send messages to yourself
**Fix:** Use a different phone/WhatsApp account to test

### Issue 2: Old Session Corrupted
**Problem:** .wwebjs_auth folder has old/broken session
**Fix:** Delete .wwebjs_auth and re-scan QR code

### Issue 3: WhatsApp Web.js Version Issue
**Problem:** Library version incompatible
**Fix:** 
```bash
npm uninstall whatsapp-web.js
npm install whatsapp-web.js@latest
```

### Issue 4: Chrome/Puppeteer Issue
**Problem:** Chrome version incompatible
**Fix:** Update Chrome browser

---

## Test Checklist

- [ ] Bot shows "Ready" status
- [ ] QR code was scanned successfully
- [ ] Sending from DIFFERENT phone (not same as QR scan)
- [ ] Message is text (not voice/image)
- [ ] Not sending to a group
- [ ] Console shows "RAW MESSAGE EVENT FIRED"

---

## If Still Not Working

Try this minimal test:

1. Stop bot
2. Delete .wwebjs_auth folder
3. Start bot
4. Scan QR code with Phone A
5. Send message from Phone B to the bot number
6. Check console

If you still see nothing, share:
1. Full console output from start to after sending message
2. WhatsApp version on your phone
3. Are you using WhatsApp Business or regular WhatsApp?

---

**Let's do a clean start now!**
