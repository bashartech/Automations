const express = require('express');
const path = require('path');
const database = require('./database');

const app = express();
const PORT = 3001;

// Serve static files
app.use(express.static('public'));

// Initialize database
database.initialize().then(() => {
  console.log('✅ Dashboard database connected');
}).catch(err => {
  console.error('❌ Dashboard database error:', err);
});

// API Routes

// Get all conversations with pagination
app.get('/api/conversations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const query = `
      SELECT * FROM conversations
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;
    const conversations = await database.all(query, [limit, offset]);

    const countQuery = 'SELECT COUNT(*) as total FROM conversations';
    const countResult = await database.get(countQuery);

    res.json({
      conversations,
      total: countResult.total,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get today's analytics
app.get('/api/analytics/today', async (req, res) => {
  try {
    const stats = await database.getTodayAnalytics();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics by date range
app.get('/api/analytics/range', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const query = `
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as total_messages,
        SUM(CASE WHEN handled = 1 THEN 1 ELSE 0 END) as auto_handled,
        SUM(CASE WHEN handled = 0 THEN 1 ELSE 0 END) as manual_needed
      FROM conversations
      WHERE timestamp >= datetime('now', '-${days} days')
      GROUP BY DATE(timestamp)
      ORDER BY date DESC
    `;

    const analytics = await database.all(query);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unhandled messages
app.get('/api/conversations/unhandled', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const messages = await database.getUnhandledMessages(limit);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get most asked questions
app.get('/api/analytics/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const questions = await database.getMostAskedQuestions(limit);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get FAQ statistics
app.get('/api/faq/stats', async (req, res) => {
  try {
    const query = `
      SELECT
        id,
        keywords,
        category,
        usage_count,
        response
      FROM faq
      ORDER BY usage_count DESC
    `;
    const faqs = await database.all(query);
    res.json(faqs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get conversation by phone number
app.get('/api/conversations/phone/:number', async (req, res) => {
  try {
    const phoneNumber = req.params.number;
    const query = `
      SELECT * FROM conversations
      WHERE phone_number = ?
      ORDER BY timestamp DESC
    `;
    const conversations = await database.all(query, [phoneNumber]);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unique contacts
app.get('/api/contacts', async (req, res) => {
  try {
    const query = `
      SELECT
        phone_number,
        contact_name,
        COUNT(*) as message_count,
        MAX(timestamp) as last_message
      FROM conversations
      GROUP BY phone_number
      ORDER BY last_message DESC
    `;
    const contacts = await database.all(query);
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search conversations
app.get('/api/conversations/search', async (req, res) => {
  try {
    const searchTerm = req.query.q || '';
    const query = `
      SELECT * FROM conversations
      WHERE message LIKE ? OR reply LIKE ? OR contact_name LIKE ?
      ORDER BY timestamp DESC
      LIMIT 50
    `;
    const searchPattern = `%${searchTerm}%`;
    const results = await database.all(query, [searchPattern, searchPattern, searchPattern]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 WhatsApp Bot Dashboard');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🌐 Dashboard running at: http://localhost:${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down dashboard...');
  await database.close();
  process.exit(0);
});
