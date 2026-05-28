const { google } = require('googleapis');
const database = require('../database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class CalendarService {
  constructor() {
    this.enabled = process.env.ENABLE_CALENDAR === 'true';
    this.calendar = null;
    this.auth = null;

    if (!this.enabled) {
      console.log('📅 Calendar service disabled. Set ENABLE_CALENDAR=true to enable.');
    }
  }

  // Initialize Google Calendar with credentials.json and token.json
  async initialize() {
    if (!this.enabled) {
      console.log('📅 Calendar service disabled');
      return;
    }

    try {
      const credentialsPath = path.join(__dirname, '..', 'credentials.json');
      const tokenPath = path.join(__dirname, '..', 'token.json');

      if (!fs.existsSync(credentialsPath)) {
        console.warn('⚠️  credentials.json not found. Calendar features disabled.');
        this.enabled = false;
        return;
      }

      if (!fs.existsSync(tokenPath)) {
        console.warn('⚠️  token.json not found. Calendar features disabled.');
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

      // Initialize Calendar API
      this.calendar = google.calendar({ version: 'v3', auth: this.auth });

      // Test the connection
      await this.calendar.calendarList.list({ maxResults: 1 });

      console.log('✅ Calendar service initialized successfully');
    } catch (error) {
      console.error('❌ Calendar initialization error:', error.message);
      this.enabled = false;
    }
  }

  // Schedule a meeting
  async scheduleMeeting(userPhone, meetingDetails) {
    if (!this.enabled || !this.calendar) {
      return {
        success: false,
        message: "📅 Calendar service is not available. Please check token.json configuration."
      };
    }

    try {
      // Parse date and time
      const startDateTime = this.parseDateTime(meetingDetails.date, meetingDetails.time);
      const endDateTime = new Date(startDateTime.getTime() + (meetingDetails.duration || 60) * 60000);

      // Create event
      const event = {
        summary: meetingDetails.title || 'Meeting',
        description: meetingDetails.description || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'Asia/Karachi',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'Asia/Karachi',
        },
        attendees: meetingDetails.attendees ?
          meetingDetails.attendees.map(email => ({ email })) : [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all',
      });

      // Log action
      await database.logAction(userPhone, 'schedule_meeting', {
        eventId: response.data.id,
        ...meetingDetails
      }, true);

      return {
        success: true,
        message: `✅ *Meeting Scheduled*\n\n` +
                 `📝 ${event.summary}\n` +
                 `📅 ${startDateTime.toLocaleDateString()}\n` +
                 `🕐 ${startDateTime.toLocaleTimeString()}\n` +
                 `⏱️ Duration: ${meetingDetails.duration || 60} minutes\n\n` +
                 `🔗 ${response.data.htmlLink}`,
        eventId: response.data.id,
        eventLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Schedule meeting error:', error.message);
      await database.logAction(userPhone, 'schedule_meeting', { error: error.message }, false);

      return {
        success: false,
        message: `❌ Failed to schedule meeting: ${error.message}`
      };
    }
  }

  // Get today's meetings
  async getTodaysMeetings(userPhone) {
    if (!this.enabled || !this.calendar) {
      return {
        success: false,
        message: "📅 Calendar service is not available."
      };
    }

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      if (events.length === 0) {
        return {
          success: true,
          message: "📅 *Today's Schedule*\n\nNo meetings scheduled for today."
        };
      }

      let message = `📅 *Today's Schedule* (${events.length} meeting${events.length > 1 ? 's' : ''})\n\n`;

      events.forEach((event, index) => {
        const start = new Date(event.start.dateTime || event.start.date);
        message += `${index + 1}. *${event.summary || 'Untitled'}*\n`;
        message += `   🕐 ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
        if (event.attendees && event.attendees.length > 0) {
          message += `   👥 ${event.attendees.length} attendee${event.attendees.length > 1 ? 's' : ''}\n`;
        }
        message += '\n';
      });

      return {
        success: true,
        message,
        events
      };
    } catch (error) {
      console.error('Get meetings error:', error.message);
      return {
        success: false,
        message: `❌ Failed to retrieve meetings: ${error.message}`
      };
    }
  }

  // Cancel/delete meeting
  async cancelMeeting(userPhone, eventId) {
    if (!this.enabled || !this.calendar) {
      return {
        success: false,
        message: "📅 Calendar service is not available."
      };
    }

    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      await database.logAction(userPhone, 'cancel_meeting', { eventId }, true);

      return {
        success: true,
        message: `✅ Meeting cancelled successfully.`
      };
    } catch (error) {
      console.error('Cancel meeting error:', error.message);
      return {
        success: false,
        message: `❌ Failed to cancel meeting: ${error.message}`
      };
    }
  }

  // Helper: Parse date and time
  parseDateTime(dateStr, timeStr) {
    const now = new Date();

    // If no date provided, use today
    if (!dateStr) {
      dateStr = now.toISOString().split('T')[0];
    }

    // If no time provided, use next hour
    if (!timeStr) {
      const nextHour = new Date(now.getTime() + 3600000);
      timeStr = `${nextHour.getHours()}:00`;
    }

    // Combine date and time
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    return new Date(dateTimeStr);
  }
}

module.exports = new CalendarService();
