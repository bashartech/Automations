# Twitter Complete Automation Skill

## Overview
This skill provides complete Twitter/X automation capabilities including tweeting, threading, scheduling, engagement tracking, and analytics.

## Capabilities

### 1. **Create Tweets**
- Create professional tweets with Claude AI enhancement
- Auto-format for Twitter's 280 character limit
- Include relevant hashtags (2-3 recommended)
- Add emojis appropriately (max 2)
- Thread creation for longer content

### 2. **Schedule Tweets**
- Schedule tweets for specific dates/times
- Recurring tweet scheduling (daily, weekly)
- Content calendar management
- Automatic approval workflow
- Timezone-aware scheduling

### 3. **Thread Management**
- Create multi-tweet threads
- Auto-split long content into threads
- Maintain thread continuity
- Schedule entire threads

### 4. **Engagement Tracking**
- Monitor tweet performance
- Track likes, retweets, replies
- Follower growth tracking
- Engagement rate analysis
- Top performing tweets

### 5. **Analytics & Insights**
- Tweet impressions
- Profile visits
- Mention tracking
- Hashtag performance
- Best posting time analysis
- Audience demographics

### 6. **Profile Management**
- View profile information
- Track follower/following counts
- Monitor bio updates
- Profile engagement metrics

## Workflow

### Tweet Creation Workflow
```
User Request → Claude generates professional tweet → 
Create approval file → Human approves → 
execute_approved.py posts to Twitter (via twitter.com/intent/tweet)
```

### Thread Creation Workflow
```
User Request → Claude splits into thread → 
Create approval file → Human approves → 
execute_approved.py opens Twitter for each tweet in thread
```

### Scheduling Workflow
```
User schedules tweet → Save to database → 
Scheduler runs at scheduled time → 
Claude enhances content → Create approval file → 
Human approves → Post to Twitter
```

## API Endpoints Used

```
POST   /api/twitter/post           - Create tweet
POST   /api/twitter/schedule       - Schedule tweet
GET    /api/twitter/tweets         - Get recent tweets
GET    /api/twitter/profile        - Get profile info
DELETE /api/twitter/tweet/:id      - Delete tweet (manual via Twitter)
```

## File Structure

```
AI_Employee_Vault/
├── engine/
│   └── twitter_manager.py        # Twitter API integration
├── scheduler/
│   └── twitter_scheduler.py      # Scheduled tweet processing
├── execute_approved.py            # Executes approved actions
├── dashboard/
│   ├── app.py                     # API endpoints
│   └── templates/index.html       # UI for Twitter management
└── .claude/skills/
    └── twitter_automation.md      # This skill file
```

## Configuration

Required in `.env`:
```
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
TWITTER_BEARER_TOKEN=your_bearer_token  # Optional, for reading
```

## Usage Examples

### Create a Tweet
```
Create a tweet about our new AI automation service launch
```

### Create a Thread
```
Create a Twitter thread explaining the benefits of AI automation for businesses
```

### Schedule a Tweet
```
Schedule a tweet for tomorrow at 10 AM about our upcoming webinar
```

### Get Analytics
```
Show me Twitter analytics for the last 7 days
```

### View Recent Tweets
```
Show my last 5 tweets and their engagement metrics
```

### Profile Info
```
Get my Twitter profile information and follower count
```

## Approval Workflow

All Twitter actions require human approval:

1. **Tweets**: Created in `Pending Approval/` folder
2. **Threads**: Created in `Pending Approval/` folder
3. **Scheduled**: Created in `Pending Approval/` folder at scheduled time

Human moves file to `Approved/` → `execute_approved.py` opens Twitter for posting.

### Approval File Format

```markdown
---
type: twitter_approval
action: twitter_post
scheduled: false
---

# Twitter Post Approval

## Original Request

{user_request}

## AI-Generated Content

{claude_enhanced_tweet}

---

## Instructions
1. Review the post above
2. Edit if needed
3. Approve: Move to `Approved/` folder (opens Twitter for posting)
4. Reject: Move to `Rejected/` folder
```

## Claude Enhancement

All tweets are enhanced by Claude AI before approval:

### Tweet Enhancement Prompt
```
You are a professional social media manager for an AI automation company.

Generate a Twitter post based on this request:
"{user_prompt}"

Requirements:
- Maximum 280 characters (Twitter limit)
- Include 2-3 relevant hashtags
- Make it engaging and shareable
- Include emojis if appropriate (max 2)
- Focus on value for the audience
- Professional but friendly tone

Output ONLY the tweet text, nothing else.
```

### Thread Enhancement Prompt
```
You are a professional social media manager for an AI automation company.

Create a Twitter thread based on this request:
"{user_prompt}"

Requirements:
- Each tweet max 280 characters
- Number each tweet (1/5, 2/5, etc.)
- Maintain continuity between tweets
- Include relevant hashtags (2-3 per tweet)
- Make it engaging and educational
- Professional but friendly tone

Output the full thread with each tweet separated by "---THREAD_BREAK---"
```

## Error Handling

- Character limit exceeded → Auto-truncate or split into thread
- API rate limits → Queue and retry (1,500 tweets/month limit)
- Authentication errors → Notify user to re-authenticate
- Network errors → Retry with exponential backoff
- Content policy violations → Warn user before posting

## Best Practices

1. **Content Quality**
   - Always review AI-generated tweets before approval
   - Keep tweets under 260 characters (leave room for retweets)
   - Use 2-3 relevant hashtags maximum
   - Include engaging visuals when possible

2. **Timing**
   - Post during peak engagement hours (9 AM - 1 PM, 5 PM - 7 PM)
   - Schedule tweets for your audience's timezone
   - Maintain consistent posting schedule

3. **Engagement**
   - Respond to replies within 2 hours
   - Retweet relevant content from followers
   - Use threads for educational content
   - Include call-to-action in tweets

4. **Analytics**
   - Review tweet performance weekly
   - Track which hashtags perform best
   - Monitor follower growth trends
   - Adjust posting times based on engagement

5. **Thread Best Practices**
   - Hook readers in tweet 1
   - Number each tweet (1/5, 2/5...)
   - End with summary or call-to-action
   - Don't make threads too long (5-10 tweets max)

## Twitter API Limits

| Action | Free Tier Limit |
|--------|-----------------|
| Tweets | 1,500/month |
| Thread length | No limit (but 280 chars per tweet) |
| API calls | 300/15 min (write) |
| Profile updates | 15/15 min |

## Manual Posting (twitter.com/intent/tweet)

For 100% free posting without API limits:

1. Approval file created with tweet content
2. Human approves (moves to Approved/)
3. execute_approved.py opens: `https://twitter.com/intent/tweet?text={encoded_tweet}`
4. Human reviews and clicks "Tweet" button
5. Posted successfully!

This method:
- ✅ 100% FREE (no API limits)
- ✅ Human review before posting
- ✅ No Twitter API payment required
- ❌ Requires manual click (intentional for approval)
