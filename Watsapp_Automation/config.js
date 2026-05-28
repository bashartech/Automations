module.exports = {
  // Bot settings
  bot: {
    name: 'WhatsApp Bot',
    version: '1.0.0',
    autoReply: true,
    logAllMessages: true
  },

  // Response settings
  responses: {
    fallback: "Thank you for your message! 🙏\n\nOur team will respond shortly.\n\nFor immediate help, type 'help' to see available commands.",
    error: "Sorry, something went wrong. Please try again or contact us directly.",
    offline: "We're currently offline. Business hours: Mon-Fri 9AM-6PM.\n\nWe'll respond when we're back!",
  },

  // Business hours (24-hour format)
  businessHours: {
    enabled: false, // Set to true to enable business hours check
    timezone: 'America/New_York',
    schedule: {
      monday: { start: '09:00', end: '18:00' },
      tuesday: { start: '09:00', end: '18:00' },
      wednesday: { start: '09:00', end: '18:00' },
      thursday: { start: '09:00', end: '18:00' },
      friday: { start: '09:00', end: '18:00' },
      saturday: { start: '10:00', end: '16:00' },
      sunday: null // Closed
    }
  },

  // Rate limiting (prevent spam)
  rateLimit: {
    enabled: true,
    maxMessagesPerMinute: 10,
    cooldownMessage: "Please wait a moment before sending another message."
  },

  // Commands
  commands: {
    prefix: '!', // Command prefix (e.g., !help)
    enabled: true
  },

  // Logging
  logging: {
    console: true,
    file: false,
    verbose: true
  },

  // Database
  database: {
    path: './whatsapp_logs.db'
  }
};
