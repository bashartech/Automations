# Gmail Automation Deployment Skill for DigitalOcean

## Skill Overview

This skill teaches how to:

1. Deploy a Python-based Gmail watcher on a headless DigitalOcean server.
2. Authenticate Gmail using OAuth2 with proper token management.
3. Handle common issues: port conflicts, redirect URIs, and service initialization.
4. Run the Gmail watcher 24/7 to detect and act on emails.
5. Avoid pitfalls like missing credentials, invalid redirect URIs, and NoneType errors.

---

## Prerequisites

- DigitalOcean account with Ubuntu server.
- Python 3.12 or >=3.8 installed.
- Basic command-line knowledge.
- Gmail account for automation.
- Google Cloud Project with OAuth credentials.

---

## Step 1: Server Setup

```bash
# Connect to DigitalOcean server
ssh root@<your_server_ip>

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# Create project folder
mkdir -p /home/AI_Employee
cd /home/AI_Employee

# Setup virtual environment
python3 -m venv /home/venv
source /home/venv/bin/activate

# Install dependencies
pip install google-api-python-client google-auth google-auth-oauthlib
Step 2: Google Cloud Project & OAuth Setup

Go to Google Cloud Console
.

Create a new project.

Enable Gmail API.

Create OAuth 2.0 Client Credentials:

Application type: Desktop

Download credentials.json

Place credentials.json in /home/AI_Employee/.

⚠️ Notes:

Web type credentials cause redirect_uri errors.

urn:ietf:wg:oauth:2.0:oob is deprecated.

Desktop type with http://localhost:8080/ works on headless servers.

Step 3: Generate token.json

Create generate_token.py:

from google_auth_oauthlib.flow import InstalledAppFlow
import json

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send']
CREDENTIALS_FILE = 'credentials.json'

flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)

# Headless server: print URL
auth_url, _ = flow.authorization_url(prompt='consent')
print("Open this URL in your browser:")
print(auth_url)

code = input("Paste the authorization code here: ")
flow.fetch_token(code=code)

creds = flow.credentials

with open("token.json", "w") as f:
    json.dump({
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes
    }, f)

print("✅ token.json created successfully")

Delete old token.json if exists.

Run the script.

Open the printed URL in your browser, allow Gmail, copy the code, and paste back.

token.json will be generated.

Step 4: Gmail Watcher Script

Authenticate function to handle all issues:

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import json

TOKEN_FILE = "token.json"

def authenticate(self):
    try:
        with open(TOKEN_FILE) as f:
            token_data = json.load(f)

        creds = Credentials(
            token=token_data["token"],
            refresh_token=token_data["refresh_token"],
            token_uri=token_data["token_uri"],
            client_id=token_data["client_id"],
            client_secret=token_data["client_secret"],
            scopes=token_data["scopes"]
        )

        if creds.expired and creds.refresh_token:
            creds.refresh(Request())

        self.creds = creds
        self.service = build('gmail', 'v1', credentials=self.creds)

        print("✅ Gmail authentication successful")
        return True

    except Exception as e:
        print(f"❌ Gmail authentication error: {e}")
        return False
Step 5: Run Gmail Watcher
# Activate virtual environment
source /home/venv/bin/activate

# Run script
python gmail_watcher.py

Output should be:

✅ Gmail authentication successful
Watching Gmail inbox...

⚠️ Notes:

Free ports must be available.

Use open_browser=False on headless servers.

Step 6: Running 24/7
Option 1: tmux
sudo apt install tmux -y
tmux new -s gmail_watcher
python gmail_watcher.py
# Ctrl+B then D to detach
tmux attach -t gmail_watcher
Option 2: systemd

Create /etc/systemd/system/gmail_watcher.service:

[Unit]
Description=Gmail Watcher Service
After=network.target

[Service]
User=root
WorkingDirectory=/home/AI_Employee
Environment="PATH=/home/venv/bin"
ExecStart=/home/venv/bin/python /home/AI_Employee/gmail_watcher.py
Restart=always

[Install]
WantedBy=multi-user.target

Enable and start:

sudo systemctl daemon-reload
sudo systemctl enable gmail_watcher
sudo systemctl start gmail_watcher
sudo systemctl status gmail_watcher
Step 7: Testing

Send a test email.

Script should detect it.

If "No new important emails" appears, check labels/query.

Step 8: Common Issues
Issue	Cause	Fix
Error 400: invalid_request	Wrong credentials type / redirect_uri	Use Desktop type; redirect_uris must be http://localhost:8080/
NoneType has no attribute 'users'	Gmail service not initialized	Add self.service = build('gmail', 'v1', credentials=self.creds)
Port already in use	Previous watcher	Kill process: sudo lsof -i :8080 && sudo kill -9 <PID>
localhost refused to connect	Headless server	Use Desktop type and code copy-paste flow
token.json not created	Already exists / wrong flow	Delete old token and rerun generate_token.py
✅ End Result

Gmail OAuth works on headless servers.

Gmail watcher runs continuously.

Avoids redirect URI and NoneType issues.

Ready to extend automation to other services like Odoo or LinkedIn.