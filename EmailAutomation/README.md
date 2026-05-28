# Email Automation System

A complete email automation system with Gmail API integration, scheduling capabilities, and a web-based UI.

## Features

✅ **Send Emails Immediately** - Send emails instantly via Gmail API  
✅ **Schedule Emails** - Schedule emails to be sent at a specific date/time  
✅ **Email History** - View all sent emails with timestamps and status  
✅ **Scheduled Emails Management** - View and cancel pending scheduled emails  
✅ **SQLite Database** - Persistent storage for email logs and schedules  
✅ **Modern Web UI** - Clean, responsive interface for all operations  
✅ **FastAPI Backend** - Fast, modern API with automatic documentation  

## Prerequisites

- Python 3.8 or higher
- Gmail account with API access
- `credentials.json` file from Google Cloud Console

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Gmail API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Gmail API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Choose **Desktop App** as application type
6. Download the credentials and save as `credentials.json` in this directory

### 3. First-Time Authentication

When you run the app for the first time, it will open a browser window for Gmail authentication:

```bash
python app.py
```

- A browser will open asking you to authorize the app
- Sign in with your Gmail account
- Grant the requested permissions
- A `token.json` file will be created automatically

### 4. Run the Application

```bash
python app.py
```

Or with uvicorn:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The application will start on: **http://localhost:8000**

## Usage

### Web Interface

Open your browser and navigate to `http://localhost:8000`

**Send Email Tab:**
- Fill in recipient email, subject, and message
- Click "Send Email" to send immediately

**Schedule Email Tab:**
- Fill in email details
- Select date and time for sending
- Click "Schedule Email"

**Email History Tab:**
- View all sent emails with status
- Shows timestamp and recipient info

**Scheduled Emails Tab:**
- View all pending scheduled emails
- Cancel scheduled emails before they're sent

### API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### API Endpoints

**POST** `/api/send-email`
```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "body": "This is a test message"
}
```

**POST** `/api/schedule-email`
```json
{
  "to": "recipient@example.com",
  "subject": "Scheduled Email",
  "body": "This will be sent later",
  "scheduled_time": "2024-03-15T10:30:00"
}
```

**GET** `/api/email-history?limit=50`

**GET** `/api/scheduled-emails`

**DELETE** `/api/scheduled-emails/{schedule_id}`

## Project Structure

```
EmailAutomation/
├── app.py                 # FastAPI application
├── gmail_service.py       # Gmail API wrapper
├── database.py            # SQLite database operations
├── scheduler.py           # Email scheduling logic
├── requirements.txt       # Python dependencies
├── credentials.json       # Gmail API credentials (you provide)
├── token.json            # Auto-generated auth token
├── emails.db             # SQLite database (auto-created)
├── static/
│   └── index.html        # Web UI
└── README.md             # This file
```

## Database Schema

**email_history** table:
- `id` - Auto-increment primary key
- `to_email` - Recipient email address
- `subject` - Email subject
- `body` - Email content
- `sent_at` - Timestamp when sent
- `status` - sent/failed

**scheduled_emails** table:
- `id` - Auto-increment primary key
- `to_email` - Recipient email address
- `subject` - Email subject
- `body` - Email content
- `scheduled_time` - When to send
- `created_at` - When scheduled
- `status` - pending/sent/failed
- `job_id` - Scheduler job identifier

## Security Notes

⚠️ **Important:**
- Never commit `credentials.json` or `token.json` to version control
- Keep your Gmail API credentials secure
- The backend handles all Gmail API authentication (not exposed to browser)
- Emails are sent server-side for security

## Troubleshooting

**Authentication Issues:**
- Delete `token.json` and re-authenticate
- Ensure Gmail API is enabled in Google Cloud Console
- Check that `credentials.json` is valid

**Scheduled Emails Not Sending:**
- Ensure the application is running at the scheduled time
- Check the scheduler logs in the console
- Verify scheduled time is in the future

**Database Errors:**
- Delete `emails.db` to reset the database
- It will be recreated automatically on next run

## License

MIT License - Feel free to use and modify as needed.
