const { google } = require('googleapis');
const database = require('../database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class EmailService {
  constructor() {
    this.enabled = process.env.ENABLE_EMAIL === 'true';
    this.gmail = null;
    this.auth = null;

    if (!this.enabled) {
      console.log('📧 Email service disabled. Set ENABLE_EMAIL=true to enable.');
    }
  }

  // Initialize Gmail API with credentials.json and token.json
  async initialize() {
    if (!this.enabled) {
      console.log('📧 Email service disabled');
      return;
    }

    try {
      const credentialsPath = path.join(__dirname, '..', 'credentials.json');
      const tokenPath = path.join(__dirname, '..', 'token.json');

      if (!fs.existsSync(credentialsPath)) {
        console.warn('⚠️  credentials.json not found. Email features disabled.');
        this.enabled = false;
        return;
      }

      if (!fs.existsSync(tokenPath)) {
        console.warn('⚠️  token.json not found. Email features disabled.');
        this.enabled = false;
        return;
      }

      // Load OAuth client credentials
      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      const { client_id, client_secret, redirect_uris } = credentials.installed;

      // Load tokens
      const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));

      // Create OAuth2 client
      this.auth = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      // Set credentials with automatic refresh
      this.auth.setCredentials({
        access_token: tokens.token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scopes ? tokens.scopes.join(' ') : undefined,
        token_type: 'Bearer',
        expiry_date: Date.now() - 1000 // Force refresh on first use
      });

      // Handle token refresh automatically
      this.auth.on('tokens', (newTokens) => {
        if (newTokens.refresh_token) {
          tokens.refresh_token = newTokens.refresh_token;
        }
        tokens.token = newTokens.access_token;
        // Save updated tokens back to file
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
      });

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth: this.auth });

      // Test the connection
      await this.gmail.users.getProfile({ userId: 'me' });

      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email initialization error:', error.message);
      this.enabled = false;
    }
  }

  // Send email
  async sendEmail(userPhone, emailDetails) {
    if (!this.enabled || !this.gmail) {
      return {
        success: false,
        message: "📧 Email service is not available. Please check token.json configuration."
      };
    }

    try {
      // Create email message
      const message = this.createMessage(
        emailDetails.to,
        emailDetails.subject || 'No Subject',
        emailDetails.body || ''
      );

      // Send email
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      // Log action
      await database.logAction(userPhone, 'send_email', {
        messageId: response.data.id,
        to: emailDetails.to,
        subject: emailDetails.subject
      }, true);

      return {
        success: true,
        message: `✅ *Email Sent*\n\n` +
                 `📧 To: ${emailDetails.to}\n` +
                 `📝 Subject: ${emailDetails.subject}\n\n` +
                 `Message ID: ${response.data.id}`,
        messageId: response.data.id
      };
    } catch (error) {
      console.error('Send email error:', error.message);
      await database.logAction(userPhone, 'send_email', { error: error.message }, false);

      return {
        success: false,
        message: `❌ Failed to send email: ${error.message}`
      };
    }
  }

  // Check unread emails
  async checkUnreadEmails(userPhone, maxResults = 5) {
    if (!this.enabled || !this.gmail) {
      return {
        success: false,
        message: "📧 Email service is not available."
      };
    }

    try {
      // Get unread messages
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: maxResults,
      });

      const messages = response.data.messages || [];

      if (messages.length === 0) {
        return {
          success: true,
          message: "📧 *Inbox*\n\nNo unread emails. You're all caught up! ✅"
        };
      }

      // Get details for each message
      const emailDetails = await Promise.all(
        messages.map(async (msg) => {
          const detail = await this.gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });

          const headers = detail.data.payload.headers;
          return {
            from: headers.find(h => h.name === 'From')?.value || 'Unknown',
            subject: headers.find(h => h.name === 'Subject')?.value || 'No Subject',
            date: headers.find(h => h.name === 'Date')?.value || '',
          };
        })
      );

      let message = `📧 *Unread Emails* (${messages.length})\n\n`;

      emailDetails.forEach((email, index) => {
        message += `${index + 1}. *${email.subject}*\n`;
        message += `   From: ${email.from.split('<')[0].trim()}\n`;
        message += `   ${new Date(email.date).toLocaleString()}\n\n`;
      });

      return {
        success: true,
        message,
        emails: emailDetails
      };
    } catch (error) {
      console.error('Check emails error:', error.message);
      return {
        success: false,
        message: `❌ Failed to check emails: ${error.message}`
      };
    }
  }

  // Helper: Create email message in base64 format
  createMessage(to, subject, body) {
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\n');

    // Encode to base64url
    const encodedMessage = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return encodedMessage;
  }

  // Get email summary
  async getEmailSummary(userPhone) {
    if (!this.enabled || !this.gmail) {
      return {
        success: false,
        message: "📧 Email service is not available."
      };
    }

    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });

      return {
        success: true,
        message: `📧 *Email Account*\n\n` +
                 `📬 Email: ${profile.data.emailAddress}\n` +
                 `📊 Total Messages: ${profile.data.messagesTotal}\n` +
                 `📨 Total Threads: ${profile.data.threadsTotal}`,
        profile: profile.data
      };
    } catch (error) {
      console.error('Get email summary error:', error.message);
      return {
        success: false,
        message: `❌ Failed to get email summary: ${error.message}`
      };
    }
  }
}

module.exports = new EmailService();
