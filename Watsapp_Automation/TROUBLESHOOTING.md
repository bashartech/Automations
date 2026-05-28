# 🔧 Troubleshooting Guide

## Issue 1: Messages Not Being Detected

### Debug Steps:

1. **Check the console output when you send a message**
   
   You should see:
   ```
   📨 Message from [Name] ([Number]):
      "[Your message]"
      🔍 Owner number: +923042985456
      🔍 Comparing: "[incoming number]" vs "+923042985456"
      👤 User role: owner (or public)
   ```

2. **Phone Number Format Issues**

   WhatsApp might format numbers differently. Check the console output:
   
   **If you see:**
   ```
   🔍 Comparing: "923042985456" vs "+923042985456"
   ```
   
   The incoming number is missing the `+` sign!
   
   **Fix:** Update your `.env`:
   ```env
   OWNER_PHONE_NUMBER=923042985456  # Remove the + sign
   ```

3. **Check Database**
   
   ```bash
   sqlite3 whatsapp_logs.db "SELECT phone_number, role FROM users;"
   ```
   
   This shows all registered users and their roles.

4. **Manual Role Update (if needed)**
   
   If your number is in database but with wrong role:
   ```bash
   sqlite3 whatsapp_logs.db "UPDATE users SET role='owner' WHERE phone_number='923042985456';"
   ```

---

## Issue 2: Google OAuth Token Expired (invalid_grant)

Your `token.json` has an expired refresh token. You need to regenerate it.

### Option A: Disable for Now (Already Done)

Calendar and Email are now disabled. Bot works without them.

### Option B: Regenerate Token (When Ready)

You'll need to:
1. Go to Google Cloud Console
2. Create new OAuth credentials
3. Run OAuth flow to get new token.json
4. Replace the old token.json

**For now, focus on getting the bot working without Calendar/Email.**

---

## Quick Test

1. **Restart the bot:**
   ```bash
   npm start
   ```

2. **Send a test message to your bot:**
   ```
   "test"
   ```

3. **Check console output** - Look for the debug lines showing phone number comparison

4. **If numbers don't match:**
   - Note the format of incoming number (with or without +)
   - Update OWNER_PHONE_NUMBER in .env to match
   - Restart bot

---

## Expected Console Output (Working)

```
📨 Message from Bashar (+923042985456):
   "test"
   🔍 Owner number: +923042985456
   🔍 Comparing: "+923042985456" vs "+923042985456"
   👤 User role: owner
   ✅ Owner detected - Full AI Assistant mode
   ✅ Reply sent
```

---

## Common Issues

### Issue: Numbers don't match
**Cause:** WhatsApp formats numbers differently
**Fix:** Match the format in .env to what you see in console

### Issue: Role is 'public' instead of 'owner'
**Cause:** Number was registered before owner was configured
**Fix:** Update database manually or delete whatsapp_logs.db and restart

### Issue: No response generated
**Cause:** AI service error or FAQ not found
**Fix:** Check Gemini API key, check console for errors

---

## Need More Help?

Send me the console output when you send a message, especially these lines:
```
🔍 Comparing: "..." vs "..."
👤 User role: ...
```

This will help identify the exact issue.
