import os
import base64
from email.mime.text import MIMEText
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

class GmailService:
    def __init__(self, credentials_path: str = "credentials.json", token_path: str = "token.json"):
        self.credentials_path = credentials_path
        self.token_path = token_path
        self.service = None
        self.authenticate()

    def authenticate(self):
        """Authenticate with Gmail API"""
        creds = None

        if os.path.exists(self.token_path):
            creds = Credentials.from_authorized_user_file(self.token_path, SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.credentials_path, SCOPES
                )
                creds = flow.run_local_server(port=0)

            with open(self.token_path, 'w') as token:
                token.write(creds.to_json())

        self.service = build('gmail', 'v1', credentials=creds)

    def create_message(self, to: str, subject: str, body: str) -> dict:
        """Create email message"""
        message = MIMEText(body)
        message['to'] = to
        message['subject'] = subject

        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
        return {'raw': raw_message}

    def send_email(self, to: str, subject: str, body: str) -> dict:
        """Send email via Gmail API"""
        try:
            message = self.create_message(to, subject, body)
            sent_message = self.service.users().messages().send(
                userId='me',
                body=message
            ).execute()

            return {
                "success": True,
                "message_id": sent_message['id'],
                "message": "Email sent successfully"
            }
        except HttpError as error:
            return {
                "success": False,
                "error": str(error),
                "message": "Failed to send email"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "An error occurred"
            }
