---
name: "linkedin-automation"
description: "Automate LinkedIn post creation and publishing. Generates posts with AI, requires human approval, then publishes via execute_approved.py"
---

# LinkedIn Automation - Simple Steps

## Quick Start

### Step 1: First-Time Setup
```bash
# Install dependencies
pip install playwright
playwright install chromium

# Login to LinkedIn (one-time)
python setup_linkedin.py
```
- Browser opens → LinkedIn login
- Login with your credentials
- Session saved in `linkedin_session/`
- Stay logged in!

### Step 2: Create Post (You tell Claude Code)
```
Create LinkedIn post about [topic]
```
**Claude Code will:**
- Generate professional post content
- Add hashtags and formatting
- Create approval file in `Pending Approval/`
- Format: `APPROVAL_linkedin_post_*.md`

### Step 3: Review & Approve (You)
1. Open `Pending Approval/APPROVAL_linkedin_post_*.md`
2. Read post content
3. Edit if needed (add image path, modify text)
4. **Move file to `Approved/` folder**

### Step 4: Publish Post (Automatic!)
```bash
# Run once to start executor (keeps running)
python execute_approved.py

# OR use batch file
run_executor.bat
```
**The executor automatically:**
- Checks `Approved/` folder
- Finds LinkedIn posts
- Runs: `python engine/linkedin_poster.py`
- Browser opens, posts to LinkedIn! ✅
- Moves files to `Done/`

---

## Commands Summary

| Action | Command |
|--------|---------|
| Setup login | `python setup_linkedin.py` |
| Create post | `Create LinkedIn post about [topic]` |
| Publish posts | **Automatic!** (via `execute_approved.py`) |

**Keep executor running:**
```bash
python execute_approved.py
# or
run_executor.bat
```

---

## Folder Flow
```
Create → Pending Approval → [You Approve] → Approved 
    → [execute_approved.py] → Done
```

---

## Example

**Task:** Create post about C programming

1. **You:** "Create LinkedIn post about C programming"
2. **Claude:** Post created in `Pending Approval/`
3. **You:** Review and move to `Approved/`
4. **Auto:** `execute_approved.py` detects & publishes! ✅
5. **Auto:** Browser opens, posts content
6. **Auto:** File moved to `Done/`

---

## Adding Images

Edit approval file before approving:
```markdown
## Metadata
- **Image:** D:\Images\my_image.png
```

Supported: JPG, PNG (under 10MB)

---

## Post Quality Tips

**Good post structure:**
1. Hook (attention-grabbing first line)
2. Context/problem
3. Solution/insight
4. Benefits/results
5. Call-to-action

**Use:**
- ✅ 150-300 words
- ✅ 3-5 relevant hashtags
- ✅ Line breaks for readability
- ✅ 1-3 emojis max

**Avoid:**
- ❌ Wall of text
- ❌ Too many hashtags (>7)
- ❌ Overly promotional

---

## Keep Running

```bash
# Start executor (handles Email, WhatsApp, LinkedIn)
python execute_approved.py
# or
run_executor.bat
```

---

## Troubleshooting

**"Not logged in"?**
- Run: `python setup_linkedin.py`
- Login again

**Post not publishing?**
- Check `execute_approved.py` is running
- Check file is in `Approved/`
- Filename starts with `APPROVAL_linkedin_post_` or `LINKEDIN_POST_`
- Watch executor console for "Executing LinkedIn post..."

**Session expired?**
- Re-run: `python setup_linkedin.py`
- Login again

**Browser closes too fast?**
- Check executor logs
- LinkedIn may have UI changes
- Try manual post to verify account works

---

## Important Notes

- **Review every post** - AI may make mistakes
- **Publish during business hours** - Better engagement
- **Respond to comments** - Engage with your network
- **Max 3 posts/day** - Avoid rate limiting
