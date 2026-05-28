const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const database = require('./database');
const config = require('./config');
const fs = require('fs');
require('dotenv').config();

// Import services
const aiService = require('./services/ai.service');
const searchService = require('./services/search.service');
const taskService = require('./services/task.service');
const calendarService = require('./services/calendar.service');
const emailService = require('./services/email.service');

class AdvancedWhatsAppBot {
  constructor() {
    this.client = null;
    this.rateLimitMap = new Map();
    this.isReady = false;
    this.ownerPhone = process.env.OWNER_PHONE_NUMBER;

    if (!this.ownerPhone) {
      console.warn('⚠️  OWNER_PHONE_NUMBER not set in .env file!');
    }
  }

  async initialize() {
    console.log('🚀 Starting Advanced WhatsApp Bot...\n');

    // Initialize database
    await database.initialize();

    // Load FAQ data
    await this.loadFAQData();

    // Initialize owner account
    if (this.ownerPhone) {
      await database.upsertUser(this.ownerPhone, 'Bashar (Owner)', 'owner', ['all']);
      console.log(`✅ Owner account configured: ${this.ownerPhone}\n`);
    }

    // Initialize services
    await this.initializeServices();

    // Initialize WhatsApp client
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: this.getPuppeteerConfig()
    });

    this.setupEventHandlers();
    await this.client.initialize();
  }

  getPuppeteerConfig() {
    const puppeteerOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };

    // Try to find system Chrome
    const possibleChromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];

    for (const chromePath of possibleChromePaths) {
      if (fs.existsSync(chromePath)) {
        puppeteerOptions.executablePath = chromePath;
        console.log('✅ Using system Chrome at:', chromePath);
        break;
      }
    }

    return puppeteerOptions;
  }

  async initializeServices() {
    console.log('🔧 Initializing services...\n');

    if (aiService.enabled) {
      console.log('✅ AI Service (Gemini) - Ready');
    } else {
      console.log('⚠️  AI Service - Disabled (add GEMINI_API_KEY)');
    }

    if (searchService.enabled) {
      console.log('✅ Web Search Service - Ready');
    } else {
      console.log('⚠️  Web Search - Disabled (add TAVILY_API_KEY or SERPER_API_KEY)');
    }

    console.log('✅ Task Management - Ready');

    await calendarService.initialize();
    await emailService.initialize();

    console.log('');
  }

  async loadFAQData() {
    try {
      const existingFAQs = await database.getAllFAQs();

      if (existingFAQs.length === 0) {
        console.log('📚 Loading FAQ data...');
        const faqData = JSON.parse(fs.readFileSync('./faq.json', 'utf8'));

        for (const faq of faqData) {
          await database.addFAQ(faq.keywords, faq.response, faq.category);
        }

        console.log(`✅ Loaded ${faqData.length} FAQ entries\n`);
      } else {
        console.log(`✅ FAQ database contains ${existingFAQs.length} entries\n`);
      }
    } catch (error) {
      console.error('❌ Error loading FAQ data:', error.message);
    }
  }

  setupEventHandlers() {
    this.client.on('qr', (qr) => {
      console.log('📱 Scan this QR code with WhatsApp:\n');
      qrcode.generate(qr, { small: true });
      console.log('\n⏳ Waiting for QR code scan...\n');
    });

    this.client.on('authenticated', () => {
      console.log('✅ Authentication successful!\n');
    });

    this.client.on('ready', () => {
      this.isReady = true;
      console.log('✅ WhatsApp Bot is Ready!\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🤖 Advanced AI Assistant Active');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 Owner: ${this.ownerPhone || 'Not configured'}`);
      console.log(`🧠 AI: ${aiService.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`🔍 Search: ${searchService.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`✅ Tasks: Enabled`);
      console.log(`📅 Calendar: ${calendarService.enabled ? 'Enabled' : 'Placeholder'}`);
      console.log(`📧 Email: ${emailService.enabled ? 'Enabled' : 'Placeholder'}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      this.displayStats();
    });

    this.client.on('message', async (message) => {
      console.log('\n🔔 RAW MESSAGE EVENT FIRED!');
      console.log('   From:', message.from);
      console.log('   Body:', message.body);
      console.log('   Type:', message.type);
      await this.handleMessage(message);
    });

    this.client.on('message_create', async (message) => {
      console.log('\n🔔 MESSAGE_CREATE EVENT FIRED!');
      console.log('   From:', message.from);
      console.log('   Body:', message.body);
    });

    this.client.on('disconnected', (reason) => {
      console.log('❌ Client disconnected:', reason);
      this.isReady = false;
    });

    this.client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failure:', msg);
    });
  }

  async handleMessage(message) {
    try {
      // Skip messages from the bot itself
      if (message.fromMe) {
        console.log('   ⏭️  Skipping bot\'s own message');
        return;
      }

      const chat = await message.getChat();
      if (chat.isGroup) {
        console.log('   ⏭️  Skipping group message');
        return;
      }

      const contact = await message.getContact();

      // Extract phone number - prioritize contact.id.user for linked devices
      let phoneNumber;

      // Priority 1: contact.id.user (works for linked devices)
      if (contact.id && contact.id.user) {
        phoneNumber = contact.id.user;
      }
      // Priority 2: contact.number (works for regular messages)
      else if (contact.number) {
        phoneNumber = contact.number;
      }
      // Priority 3: Fallback to message.from
      else {
        phoneNumber = message.from.split('@')[0];
      }

      // Normalize: remove any non-digit characters except +
      phoneNumber = phoneNumber.replace(/[^\d+]/g, '');

      const contactName = contact.pushname || contact.name || 'Unknown';
      const messageBody = message.body.trim();

      console.log(`\n📨 Message from ${contactName} (${phoneNumber}):`);
      console.log(`   "${messageBody}"`);
      console.log(`   🔍 Raw ID: ${message.from}`);
      console.log(`   🔍 Contact number: ${contact.number || 'N/A'}`);
      console.log(`   🔍 Contact ID user: ${contact.id?.user || 'N/A'}`);
      console.log(`   🔍 Owner number: ${this.ownerPhone}`);
      console.log(`   🔍 Comparing: "${phoneNumber}" vs "${this.ownerPhone}"`);

      // Normalize owner phone for comparison
      const normalizedOwner = this.ownerPhone ? this.ownerPhone.replace(/[^\d]/g, '') : '';
      const normalizedIncoming = phoneNumber.replace(/[^\d]/g, '');

      console.log(`   🔍 Normalized: "${normalizedIncoming}" vs "${normalizedOwner}"`);

      // Check rate limiting
      if (this.isRateLimited(phoneNumber)) {
        console.log('   ⚠️  Rate limited - skipping');
        return;
      }

      // Get or create user
      let user = await database.getUserByPhone(phoneNumber);
      if (!user) {
        console.log(`   📝 Creating new user: ${phoneNumber}`);

        // Check if this is the owner
        const isOwner = normalizedIncoming === normalizedOwner;
        const role = isOwner ? 'owner' : 'public';
        const permissions = isOwner ? ['all'] : [];

        await database.upsertUser(phoneNumber, contactName, role, permissions);
        user = await database.getUserByPhone(phoneNumber);

        console.log(`   ✨ Created as: ${role}`);
      }

      console.log(`   👤 User role: ${user.role}`);

      // Log message
      const logResult = await database.logMessage(phoneNumber, contactName, messageBody, message.type);
      const conversationId = logResult.id;

      // Route based on user role
      let response;
      if (user.role === 'owner') {
        console.log('   ✅ Owner detected - Full AI Assistant mode');
        response = await this.handleOwnerMessage(phoneNumber, messageBody);
      } else {
        console.log('   👥 Public user - FAQ mode');
        response = await this.handlePublicMessage(phoneNumber, messageBody);
      }

      // Send reply
      if (response) {
        await message.reply(response);
        console.log(`   ✅ Reply sent`);
        await database.logReply(conversationId, response, true);
      } else {
        console.log('   ⚠️  No response generated');
      }

    } catch (error) {
      console.error('❌ Error handling message:', error.message);
      console.error(error.stack);
    }
  }

  async handleOwnerMessage(phoneNumber, message) {
    const lowerMessage = message.toLowerCase();

    console.log('   🔍 Processing owner message...');

    // Special commands (exact match)
    if (lowerMessage === 'help' || lowerMessage === '!help') {
      console.log('   📖 Help command');
      return this.getOwnerHelpMessage();
    }

    if (lowerMessage === 'stats' || lowerMessage === '!stats') {
      console.log('   📊 Stats command');
      return await this.getStatsMessage();
    }

    // Use AI to classify intent first (for natural language understanding)
    console.log('   🧠 Classifying intent with AI...');
    const intent = await aiService.classifyIntent(message);
    console.log(`   🎯 Detected intent: ${intent}`);

    // Route based on AI-detected intent
    switch (intent) {
      case 'manage_task':
        console.log('   ✅ Routing to task service');
        const taskResult = await taskService.handleTaskCommand(phoneNumber, message);
        if (taskResult && taskResult.message) {
          return taskResult.message;
        }
        // If task service returns null, fall through to AI conversation
        break;

      case 'web_search':
        console.log('   🔍 Routing to search service');
        // Extract search query using AI
        const searchQuery = message.replace(/^(please |can you |could you )?(search|find|google|look up|tell me about)\s+(on |the )?(web|internet|google)?\s*(for |about )?/i, '');
        const searchResult = await searchService.search(searchQuery);
        return searchResult.message;

      case 'schedule_meeting':
        console.log('   📅 Routing to calendar service');
        const meetingInfo = await aiService.extractInfo(message, 'meeting');
        if (meetingInfo) {
          const calResult = await calendarService.scheduleMeeting(phoneNumber, meetingInfo);
          return calResult.message;
        }
        break;

      case 'send_email':
        console.log('   📧 Routing to email service');
        const emailInfo = await aiService.extractInfo(message, 'email');
        if (emailInfo) {
          const emailResult = await emailService.sendEmail(phoneNumber, emailInfo);
          return emailResult.message;
        }
        break;
    }

    // Fallback: Check for explicit command patterns
    // Task management
    if (lowerMessage.match(/(task|todo)/i)) {
      console.log('   ✅ Task keyword detected, using task service');
      const result = await taskService.handleTaskCommand(phoneNumber, message);
      return result.message;
    }

    // Web search - flexible detection
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.match(/look up|google|web/i)) {
      let query = message;

      if (lowerMessage.startsWith('search ')) {
        query = message.replace(/^search\s+/i, '');
      } else if (lowerMessage.startsWith('find ')) {
        query = message.replace(/^find\s+/i, '');
      } else if (lowerMessage.match(/search (on |the )?(web|internet|google)/i)) {
        query = message.replace(/.*search (on |the )?(web|internet|google) (for |about )?/i, '');
      } else if (lowerMessage.match(/google/i)) {
        query = message.replace(/.*google\s+/i, '');
      }

      if (query && query.length > 3 && query !== message) {
        console.log(`   🔍 Search command detected, query: "${query}"`);
        const result = await searchService.search(query);
        return result.message;
      }
    }

    // Show calendar
    if (lowerMessage.match(/(show|view|list|check).*(calendar|meetings|schedule)/i) || lowerMessage === 'calendar' || lowerMessage === 'schedule') {
      console.log('   📅 Show calendar command');
      const result = await calendarService.getTodaysMeetings(phoneNumber);
      return result.message;
    }

    // Check emails
    if (lowerMessage.match(/(check|show|view|list).*(email|inbox|mail)/i) || lowerMessage === 'emails' || lowerMessage === 'inbox') {
      console.log('   📧 Check email command');
      const result = await emailService.checkUnreadEmails(phoneNumber);
      return result.message;
    }

    // AI conversation (default for owner) - with enhanced context
    console.log('   🤖 Using AI for owner (general conversation)');
    if (aiService.enabled) {
      return await aiService.chat(phoneNumber, message, { role: 'owner' });
    }

    // Fallback to FAQ if AI disabled
    console.log('   📋 AI disabled, trying FAQ');
    const faqResponse = await database.searchFAQ(message);
    return faqResponse || config.responses.fallback;
  }

  async handlePublicMessage(phoneNumber, message) {
    // Check for commands first
    if (config.commands.enabled && message.startsWith(config.commands.prefix)) {
      return await this.handleCommand(message);
    }

    // Search FAQ database first
    const faqResponse = await database.searchFAQ(message);

    if (faqResponse) {
      console.log('   📋 FAQ match found');
      return faqResponse;
    }

    // If no FAQ match and AI is enabled, use AI for public users
    if (aiService.enabled) {
      console.log('   🤖 Using AI for public user');
      return await aiService.chat(phoneNumber, message, { role: 'public' });
    }

    // Fallback response
    console.log('   💬 Using fallback response');
    return config.responses.fallback;
  }

  async handleCommand(message) {
    const command = message.substring(config.commands.prefix.length).toLowerCase();

    switch (command) {
      case 'help':
      case 'menu':
        return await database.searchFAQ('help');

      case 'stats':
        const stats = await database.getTodayAnalytics();
        return `📊 *Today's Statistics*\n\nTotal Messages: ${stats.total_messages}\nAuto-handled: ${stats.auto_handled}\nNeeds Review: ${stats.manual_needed}`;

      case 'ping':
        return '🏓 Pong! Bot is active.';

      default:
        return `Unknown command: ${command}\n\nType !help for available commands.`;
    }
  }

  getOwnerHelpMessage() {
    return `🤖 *AI Assistant Commands*

*Task Management:*
• "add task [description]"
• "show tasks"
• "complete task [ID]"
• "delete task [ID]"

*Web Search:*
• "search [query]"
• "find [query]"

*Calendar:* (Coming soon)
• "schedule meeting [details]"
• "show calendar"

*Email:* (Coming soon)
• "send email to [address]"
• "check emails"

*General:*
• "help" - Show this message
• "stats" - Today's statistics

💡 You can also just chat naturally - I'll understand!`;
  }

  async getStatsMessage() {
    const stats = await database.getTodayAnalytics();
    const tasks = await database.getUserTasks(this.ownerPhone, 'pending');

    return `📊 *Your Dashboard*

*Today's Activity:*
📨 Messages: ${stats.total_messages || 0}
✅ Auto-handled: ${stats.auto_handled || 0}
⚠️ Needs review: ${stats.manual_needed || 0}

*Tasks:*
📝 Pending: ${tasks.length}

*Services Status:*
🧠 AI: ${aiService.enabled ? '✅' : '❌'}
🔍 Search: ${searchService.enabled ? '✅' : '❌'}
📅 Calendar: ${calendarService.enabled ? '✅' : '⏳'}
📧 Email: ${emailService.enabled ? '✅' : '⏳'}`;
  }

  isRateLimited(phoneNumber) {
    if (!config.rateLimit.enabled) return false;

    const now = Date.now();
    const userMessages = this.rateLimitMap.get(phoneNumber) || [];
    const recentMessages = userMessages.filter(time => now - time < 60000);

    if (recentMessages.length >= config.rateLimit.maxMessagesPerMinute) {
      return true;
    }

    recentMessages.push(now);
    this.rateLimitMap.set(phoneNumber, recentMessages);
    return false;
  }

  async displayStats() {
    try {
      const stats = await database.getTodayAnalytics();
      console.log('📊 Today\'s Statistics:');
      console.log(`   Total Messages: ${stats.total_messages || 0}`);
      console.log(`   Auto-handled: ${stats.auto_handled || 0}`);
      console.log(`   Needs Review: ${stats.manual_needed || 0}\n`);
    } catch (error) {
      console.error('Error displaying stats:', error.message);
    }
  }

  async shutdown() {
    console.log('\n🛑 Shutting down bot...');

    if (this.client) {
      await this.client.destroy();
    }

    await database.close();
    console.log('✅ Bot stopped successfully');
    process.exit(0);
  }
}

// Create bot instance
const bot = new AdvancedWhatsAppBot();

// Handle shutdown signals
process.on('SIGINT', () => bot.shutdown());
process.on('SIGTERM', () => bot.shutdown());

// Start the bot
bot.initialize().catch((error) => {
  console.error('❌ Failed to initialize bot:', error);
  process.exit(1);
});
