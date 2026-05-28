const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiAI {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not found in .env file');
      this.enabled = false;
      return;
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.enabled = true;
    this.conversationHistory = new Map(); // Store conversation context per user
  }

  // System prompt for Bashar's assistant
  getSystemPrompt() {
    return `You are Bashar's advanced AI Assistant with access to multiple tools and capabilities.

ABOUT BASHAR:
- AI Engineer with 2-3 years experience
- Specializes in: AI Agents, Automation Systems, Full Stack Development
- Tech Stack: Next.js, React, Python, FastAPI, Node.js, OpenAI, Claude, RAG
- Location: Karachi, Pakistan
- Email: bashartc13@gmail.com

KEY PROJECTS:
1. AI Employee Vault - 24/7 cloud automation system (Facebook, Twitter, Gmail, WhatsApp, LinkedIn + Odoo ERP)
2. AI Learning Platform - RAG chatbot with personalization and translation
3. AI Todo Chatbot - Event-driven microservices with Kafka + Dapr
4. Multi-Industry AI Chatbot Widget - Embeddable for businesses

YOUR CAPABILITIES (OWNER MODE):
✅ Task Management - Create, view, complete, delete tasks
✅ Web Search - Real-time information from the internet
✅ Email Integration - Send emails, check inbox (Gmail)
✅ Calendar Integration - Schedule meetings, view calendar (Google Calendar)
✅ Natural Language Understanding - Understand intent and take action automatically

HOW YOU WORK:
- You understand natural language - users don't need exact commands
- When user wants to search something, you automatically trigger search
- When user mentions tasks, you handle task operations
- When user wants to schedule, you access their calendar
- When user wants to email, you can send emails
- You are PROACTIVE and INTELLIGENT - you take actions, not just suggest them

EXAMPLES OF NATURAL LANGUAGE YOU UNDERSTAND:
- "I want to add some tasks" → Understand they want task management
- "Can you search about PSL 11?" → Automatically search
- "Schedule a meeting tomorrow" → Access calendar and schedule
- "Send email to client" → Compose and send email
- "What's on my calendar?" → Check and show calendar

YOUR RESPONSE STYLE:
- Be conversational and natural
- Take actions automatically when possible
- Confirm actions after completing them
- Be concise but helpful
- Use emojis sparingly
- Focus on being helpful and proactive

IMPORTANT:
- You have REAL access to tools - use them!
- Don't just tell users how to use commands - take action for them
- Be intelligent about understanding intent
- You are an AI AGENT, not just a chatbot`;
  }

  // Classify user intent
  async classifyIntent(message) {
    if (!this.enabled) return 'general';

    try {
      const prompt = `Classify the intent of this message into ONE category:
- schedule_meeting: User wants to schedule/book a meeting
- manage_task: User wants to create, view, or manage tasks
- web_search: User wants to search for information online
- send_email: User wants to send an email
- general: General conversation or question

Message: "${message}"

Respond with ONLY the category name, nothing else.`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim().toLowerCase();

      return response;
    } catch (error) {
      console.error('Intent classification error:', error.message);
      return 'general';
    }
  }

  // Chat with context
  async chat(userPhone, message, context = {}) {
    if (!this.enabled) {
      return "AI is currently disabled. Please add GEMINI_API_KEY to .env file.";
    }

    try {
      // Get conversation history
      let history = this.conversationHistory.get(userPhone) || [];

      // Build prompt with context
      let prompt = this.getSystemPrompt() + '\n\n';

      if (context.role === 'owner') {
        prompt += 'NOTE: This is Bashar (the owner) asking. Provide full assistance.\n\n';
      } else {
        prompt += 'NOTE: This is a potential client/visitor. Be professional and informative.\n\n';
      }

      // Add recent history (last 5 messages)
      if (history.length > 0) {
        prompt += 'RECENT CONVERSATION:\n';
        history.slice(-5).forEach(msg => {
          prompt += `${msg.role}: ${msg.content}\n`;
        });
        prompt += '\n';
      }

      prompt += `User: ${message}\nAssistant:`;

      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      // Update conversation history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: response });

      // Keep only last 10 exchanges (20 messages)
      if (history.length > 20) {
        history = history.slice(-20);
      }

      this.conversationHistory.set(userPhone, history);

      return response;
    } catch (error) {
      console.error('Gemini AI error:', error.message);
      return "Sorry, I'm having trouble processing that right now. Please try again.";
    }
  }

  // Extract information from natural language
  async extractInfo(message, type) {
    if (!this.enabled) return null;

    try {
      let prompt = '';

      switch (type) {
        case 'meeting':
          prompt = `Extract meeting details from this message:
"${message}"

Return JSON with: title, date, time, duration, attendees
If information is missing, use null.
Return ONLY valid JSON, no other text.`;
          break;

        case 'task':
          prompt = `Extract task details from this message:
"${message}"

Return JSON with: title, description, priority (low/medium/high), dueDate
If information is missing, use null.
Return ONLY valid JSON, no other text.`;
          break;

        case 'email':
          prompt = `Extract email details from this message:
"${message}"

Return JSON with: to, subject, body
If information is missing, use null.
Return ONLY valid JSON, no other text.`;
          break;

        default:
          return null;
      }

      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim();

      // Try to parse JSON
      try {
        // Remove markdown code blocks if present
        const jsonStr = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        return JSON.parse(jsonStr);
      } catch {
        return null;
      }
    } catch (error) {
      console.error('Info extraction error:', error.message);
      return null;
    }
  }

  // Clear conversation history for a user
  clearHistory(userPhone) {
    this.conversationHistory.delete(userPhone);
  }

  // Get conversation summary
  async summarizeConversation(userPhone) {
    const history = this.conversationHistory.get(userPhone);
    if (!history || history.length === 0) {
      return "No conversation history.";
    }

    try {
      const conversationText = history.map(msg =>
        `${msg.role}: ${msg.content}`
      ).join('\n');

      const prompt = `Summarize this conversation in 2-3 sentences:\n\n${conversationText}`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Summarization error:', error.message);
      return "Unable to summarize conversation.";
    }
  }
}

module.exports = new GeminiAI();
