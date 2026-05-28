# Facebook Complete Automation Skill

## Overview
This skill provides complete Facebook page automation capabilities including posting, scheduling, comment management, analytics, and lead generation.

## Capabilities

### 1. **Create Facebook Posts**
- Create professional posts with Claude AI enhancement
- Add images, videos, and links
- Include relevant hashtags
- Schedule posts for later publishing

### 2. **Schedule Posts**
- Schedule posts for specific dates/times
- Recurring post scheduling (daily, weekly)
- Content calendar management
- Automatic approval workflow

### 3. **Comment Management**
- Monitor comments on posts
- Auto-detect high-intent comments (leads)
- Generate AI responses to comments
- Hide/delete spam comments
- Reply to customer inquiries

### 4. **Lead Generation**
- Extract leads from comments
- Score leads based on engagement
- Create Odoo CRM leads automatically
- Send follow-up emails
- WhatsApp notifications for HOT leads

### 5. **Analytics & Insights**
- Page impressions and reach
- Post engagement metrics
- Follower growth tracking
- Best posting time analysis
- Content performance reports

### 6. **Page Management**
- Update page information
- Manage page settings
- View page insights
- Monitor page health

## Workflow

### Post Creation Workflow
```
User Request → Claude generates professional content → 
Create approval file → Human approves → 
execute_approved.py posts to Facebook
```

### Comment Response Workflow
```
New Comment → Detect sentiment/intent → 
Generate AI response → Create approvals:
  - Odoo Lead (if high intent)
  - Email notification
  - WhatsApp alert (HOT leads only)
  - Facebook reply
→ Human approves → Execute all actions
```

### Scheduling Workflow
```
User schedules post → Save to database → 
Scheduler runs at scheduled time → 
Claude enhances content → Create approval file → 
Human approves → Post to Facebook
```

## API Endpoints Used

```
POST   /api/facebook/post          - Create post
POST   /api/facebook/schedule      - Schedule post
GET    /api/facebook/posts         - Get recent posts
GET    /api/facebook/comments      - Get comments
GET    /api/facebook/analytics     - Get analytics
GET    /api/facebook/page-info     - Get page info
DELETE /api/facebook/post/:id      - Delete post (via approval)
```

## File Structure

```
AI_Employee_Vault/
├── engine/
│   └── facebook_manager.py       # Facebook API integration
├── scheduler/
│   └── facebook_scheduler.py     # Scheduled post processing
├── execute_approved.py            # Executes approved actions
├── dashboard/
│   ├── app.py                     # API endpoints
│   └── templates/index.html       # UI for Facebook management
└── .claude/skills/
    └── facebook_automation.md     # This skill file
```

## Configuration

Required in `.env`:
```
FACEBOOK_PAGE_ID=your_page_id
FACEBOOK_PAGE_ACCESS_TOKEN=your_access_token
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

## Usage Examples

### Create a Post
```
Create a Facebook post about our new AI automation service
```

### Schedule a Post
```
Schedule a post for tomorrow at 9 AM about our latest product launch
```

### Respond to Comments
```
Reply to all comments on our latest post thanking users for their engagement
```

### Get Analytics
```
Show me Facebook analytics for the last 7 days
```

### Lead Generation
```
Find all potential leads from Facebook comments this week and create Odoo entries
```

## Approval Workflow

All Facebook actions require human approval:

1. **Posts**: Created in `Pending Approval/` folder
2. **Replies**: Created in `Pending Approval/` folder
3. **Leads**: Created in `Pending Approval/` folder (Odoo format)
4. **Deletes**: Created in `Pending Approval/` folder

Human moves file to `Approved/` → `execute_approved.py` executes the action.

## Error Handling

- Token expiration → Auto-refresh or notify
- Rate limits → Queue and retry
- API errors → Log and notify
- Content policy violations → Warn user

## Best Practices

1. Always review AI-generated content before approval
2. Check analytics to optimize posting times
3. Respond to comments within 1 hour for best engagement
4. Use high-quality images with posts
5. Include call-to-action in posts
6. Monitor lead score for follow-up priority
