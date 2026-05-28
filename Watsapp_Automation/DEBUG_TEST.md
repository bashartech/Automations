# 🔍 Debug Test - Follow These Steps

## Step 1: Restart the Bot

```bash
npm start
```

Wait for:
```
✅ WhatsApp Bot is Ready!
```

---

## Step 2: Send a Test Message

From your WhatsApp, send this to your bot number:
```
test
```

---

## Step 3: Check Console Output

Look for these debug lines in the console:

```
📨 Message from [Your Name] ([Your Number]):
   "test"
   🔍 Owner number: +923042985456
   🔍 Comparing: "[incoming]" vs "+923042985456"
   👤 User role: [owner or public]
```

---

## Step 4: Identify the Issue

### Scenario A: Numbers Match, Role is Owner ✅
```
🔍 Comparing: "+923042985456" vs "+923042985456"
👤 User role: owner
✅ Owner detected - Full AI Assistant mode
```

**Status:** Working! You should get a response.

---

### Scenario B: Numbers Don't Match (Format Issue) ❌
```
🔍 Comparing: "923042985456" vs "+923042985456"
👤 User role: public
```

**Problem:** Incoming number has no `+` sign

**Fix:** Edit `.env`:
```env
OWNER_PHONE_NUMBER=923042985456
```

Then restart bot.

---

### Scenario C: Numbers Match, But Role is Public ❌
```
🔍 Comparing: "+923042985456" vs "+923042985456"
👤 User role: public
```

**Problem:** User was created before owner was configured

**Fix:** Update database:
```bash
sqlite3 whatsapp_logs.db "UPDATE users SET role='owner', permissions='[\"all\"]' WHERE phone_number='+923042985456';"
```

Or delete database and restart:
```bash
rm whatsapp_logs.db
npm start
```

---

### Scenario D: No Message Detected at All ❌

**Problem:** Bot not receiving messages

**Check:**
1. Is bot showing "Ready" status?
2. Is WhatsApp Web session active?
3. Try sending from a different number to test

---

## Step 5: Share Output

Copy and paste the debug output here so I can help identify the exact issue.

Look for these specific lines:
```
🔍 Comparing: "..." vs "..."
👤 User role: ...
```

---

## Quick Fixes

### If you see "No response generated":
- Check Gemini API key in .env
- Check console for AI service errors
- Try a simple FAQ keyword like "skills"

### If bot crashes:
- Share the full error stack trace
- Check all dependencies are installed
- Verify .env file format (no extra spaces)

---

**Ready to test? Restart the bot and send "test"!**
