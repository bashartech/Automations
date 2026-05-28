const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection and create tables
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database('./whatsapp_logs.db', (err) => {
        if (err) {
          console.error('❌ Database connection error:', err.message);
          reject(err);
        } else {
          console.log('✅ Connected to SQLite database');
          this.createTables()
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  }

  // Create all necessary tables
  async createTables() {
    const tables = [
      // Conversations table
      `CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        contact_name TEXT,
        message TEXT NOT NULL,
        reply TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        reply_timestamp DATETIME,
        message_type TEXT DEFAULT 'text',
        handled BOOLEAN DEFAULT 1
      )`,

      // FAQ table
      `CREATE TABLE IF NOT EXISTS faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keywords TEXT NOT NULL,
        response TEXT NOT NULL,
        category TEXT,
        usage_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Analytics table
      `CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE DEFAULT CURRENT_DATE,
        total_messages INTEGER DEFAULT 0,
        auto_handled INTEGER DEFAULT 0,
        manual_needed INTEGER DEFAULT 0
      )`,

      // Users table (for access control)
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT UNIQUE NOT NULL,
        contact_name TEXT,
        role TEXT DEFAULT 'public',
        permissions TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active DATETIME
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_phone TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME
      )`,

      // Action logs table (audit trail)
      `CREATE TABLE IF NOT EXISTS action_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_phone TEXT NOT NULL,
        action_type TEXT NOT NULL,
        action_details TEXT,
        success BOOLEAN DEFAULT 1,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const query of tables) {
      await this.run(query);
    }

    console.log('✅ Database tables created/verified');
  }

  // Helper method to run queries
  run(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function(err) {
        if (err) {
          console.error('❌ Query error:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // Helper method to get single row
  get(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          console.error('❌ Query error:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Helper method to get all rows
  all(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          console.error('❌ Query error:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Log incoming message
  async logMessage(phoneNumber, contactName, message, messageType = 'text') {
    const query = `
      INSERT INTO conversations (phone_number, contact_name, message, message_type)
      VALUES (?, ?, ?, ?)
    `;
    return await this.run(query, [phoneNumber, contactName, message, messageType]);
  }

  // Update conversation with reply
  async logReply(conversationId, reply, handled = true) {
    const query = `
      UPDATE conversations
      SET reply = ?, reply_timestamp = CURRENT_TIMESTAMP, handled = ?
      WHERE id = ?
    `;
    return await this.run(query, [reply, handled ? 1 : 0, conversationId]);
  }

  // Get all FAQs
  async getAllFAQs() {
    return await this.all('SELECT * FROM faq');
  }

  // Search FAQ by keywords
  async searchFAQ(message) {
    const faqs = await this.getAllFAQs();
    const messageLower = message.toLowerCase();

    for (const faq of faqs) {
      const keywords = faq.keywords.toLowerCase().split(',');
      for (const keyword of keywords) {
        if (messageLower.includes(keyword.trim())) {
          // Increment usage count
          await this.run('UPDATE faq SET usage_count = usage_count + 1 WHERE id = ?', [faq.id]);
          return faq.response;
        }
      }
    }

    return null;
  }

  // Add new FAQ
  async addFAQ(keywords, response, category = 'general') {
    const query = `
      INSERT INTO faq (keywords, response, category)
      VALUES (?, ?, ?)
    `;
    return await this.run(query, [keywords, response, category]);
  }

  // Get today's analytics
  async getTodayAnalytics() {
    const query = `
      SELECT
        COUNT(*) as total_messages,
        SUM(CASE WHEN handled = 1 THEN 1 ELSE 0 END) as auto_handled,
        SUM(CASE WHEN handled = 0 THEN 1 ELSE 0 END) as manual_needed
      FROM conversations
      WHERE DATE(timestamp) = DATE('now')
    `;
    return await this.get(query);
  }

  // Get unhandled messages
  async getUnhandledMessages(limit = 10) {
    const query = `
      SELECT * FROM conversations
      WHERE handled = 0
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    return await this.all(query, [limit]);
  }

  // Get most asked questions
  async getMostAskedQuestions(limit = 10) {
    const query = `
      SELECT message, COUNT(*) as count
      FROM conversations
      WHERE message_type = 'text'
      GROUP BY message
      ORDER BY count DESC
      LIMIT ?
    `;
    return await this.all(query, [limit]);
  }

  // ============================================
  // USER MANAGEMENT METHODS
  // ============================================

  // Get user by phone number
  async getUserByPhone(phoneNumber) {
    const query = 'SELECT * FROM users WHERE phone_number = ?';
    return await this.get(query, [phoneNumber]);
  }

  // Create or update user
  async upsertUser(phoneNumber, contactName, role = 'public', permissions = []) {
    const existing = await this.getUserByPhone(phoneNumber);

    if (existing) {
      const query = `
        UPDATE users
        SET contact_name = ?, role = ?, permissions = ?, last_active = CURRENT_TIMESTAMP
        WHERE phone_number = ?
      `;
      return await this.run(query, [contactName, role, JSON.stringify(permissions), phoneNumber]);
    } else {
      const query = `
        INSERT INTO users (phone_number, contact_name, role, permissions)
        VALUES (?, ?, ?, ?)
      `;
      return await this.run(query, [phoneNumber, contactName, role, JSON.stringify(permissions)]);
    }
  }

  // Get user permissions
  async getUserPermissions(phoneNumber) {
    const user = await this.getUserByPhone(phoneNumber);
    if (!user) return [];

    try {
      return JSON.parse(user.permissions);
    } catch {
      return [];
    }
  }

  // Check if user has permission
  async hasPermission(phoneNumber, permission) {
    const user = await this.getUserByPhone(phoneNumber);
    if (!user) return false;
    if (user.role === 'owner') return true; // Owner has all permissions

    const permissions = await this.getUserPermissions(phoneNumber);
    return permissions.includes(permission) || permissions.includes('all');
  }

  // ============================================
  // TASK MANAGEMENT METHODS
  // ============================================

  // Create task
  async createTask(userPhone, title, description = '', priority = 'medium', dueDate = null) {
    const query = `
      INSERT INTO tasks (user_phone, title, description, priority, due_date)
      VALUES (?, ?, ?, ?, ?)
    `;
    return await this.run(query, [userPhone, title, description, priority, dueDate]);
  }

  // Get user tasks
  async getUserTasks(userPhone, status = null) {
    let query = 'SELECT * FROM tasks WHERE user_phone = ?';
    const params = [userPhone];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';
    return await this.all(query, params);
  }

  // Update task status
  async updateTaskStatus(taskId, status) {
    const completedAt = status === 'completed' ? 'CURRENT_TIMESTAMP' : 'NULL';
    const query = `
      UPDATE tasks
      SET status = ?, completed_at = ${completedAt}
      WHERE id = ?
    `;
    return await this.run(query, [status, taskId]);
  }

  // Delete task
  async deleteTask(taskId) {
    const query = 'DELETE FROM tasks WHERE id = ?';
    return await this.run(query, [taskId]);
  }

  // ============================================
  // ACTION LOGGING METHODS
  // ============================================

  // Log action
  async logAction(userPhone, actionType, actionDetails, success = true) {
    const query = `
      INSERT INTO action_logs (user_phone, action_type, action_details, success)
      VALUES (?, ?, ?, ?)
    `;
    return await this.run(query, [userPhone, actionType, JSON.stringify(actionDetails), success ? 1 : 0]);
  }

  // Get user action logs
  async getUserActionLogs(userPhone, limit = 50) {
    const query = `
      SELECT * FROM action_logs
      WHERE user_phone = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    return await this.all(query, [userPhone, limit]);
  }

  // Get all users
  async getAllUsers() {
    return await this.all('SELECT * FROM users ORDER BY last_active DESC');
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database connection closed');
          resolve();
        }
      });
    });
  }
}

module.exports = new Database();
