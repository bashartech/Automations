// Global state
let currentPage = 1;
let currentTab = 'conversations';
const itemsPerPage = 20;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  setInterval(loadStats, 30000); // Refresh stats every 30 seconds
});

// Load all data
async function loadAllData() {
  await loadStats();
  await loadConversations();
  await loadUnhandled();
  await loadContacts();
  await loadFAQStats();
  await loadAnalytics();
  updateLastUpdated();
}

// Refresh all data
function refreshAll() {
  loadAllData();
}

// Update last updated timestamp
function updateLastUpdated() {
  const now = new Date();
  document.getElementById('lastUpdated').textContent = now.toLocaleTimeString();
}

// Load statistics
async function loadStats() {
  try {
    const response = await fetch('/api/analytics/today');
    const stats = await response.json();

    document.getElementById('totalMessages').textContent = stats.total_messages || 0;
    document.getElementById('autoHandled').textContent = stats.auto_handled || 0;
    document.getElementById('manualNeeded').textContent = stats.manual_needed || 0;

    // Load unique contacts count
    const contactsResponse = await fetch('/api/contacts');
    const contacts = await contactsResponse.json();
    document.getElementById('uniqueContacts').textContent = contacts.length;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load conversations
async function loadConversations(page = 1) {
  try {
    const offset = (page - 1) * itemsPerPage;
    const response = await fetch(`/api/conversations?limit=${itemsPerPage}&offset=${offset}`);
    const data = await response.json();

    const container = document.getElementById('conversationsList');

    if (data.conversations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>No conversations yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = data.conversations.map(conv => `
      <div class="conversation-card">
        <div class="conversation-header">
          <div class="contact-info">
            <span class="contact-name">${conv.contact_name || 'Unknown'}</span>
            <span class="phone-number">${conv.phone_number}</span>
          </div>
          <div>
            <span class="status-badge ${conv.handled ? 'status-handled' : 'status-unhandled'}">
              ${conv.handled ? '✅ Handled' : '⚠️ Unhandled'}
            </span>
            <span class="timestamp">${formatTimestamp(conv.timestamp)}</span>
          </div>
        </div>
        <div class="message-content">
          <div class="message-label">📨 Message:</div>
          <div class="message-text">${escapeHtml(conv.message)}</div>
        </div>
        ${conv.reply ? `
          <div class="message-content">
            <div class="message-label">🤖 Reply:</div>
            <div class="reply-text">${escapeHtml(conv.reply)}</div>
          </div>
        ` : ''}
      </div>
    `).join('');

    // Update pagination
    const totalPages = Math.ceil(data.total / itemsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${page} of ${totalPages}`;
    currentPage = page;
  } catch (error) {
    console.error('Error loading conversations:', error);
    document.getElementById('conversationsList').innerHTML = '<div class="loading">Error loading conversations</div>';
  }
}

// Load unhandled messages
async function loadUnhandled() {
  try {
    const response = await fetch('/api/conversations/unhandled?limit=50');
    const messages = await response.json();

    const container = document.getElementById('unhandledList');

    if (messages.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p>All messages handled!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = messages.map(msg => `
      <div class="conversation-card">
        <div class="conversation-header">
          <div class="contact-info">
            <span class="contact-name">${msg.contact_name || 'Unknown'}</span>
            <span class="phone-number">${msg.phone_number}</span>
          </div>
          <span class="timestamp">${formatTimestamp(msg.timestamp)}</span>
        </div>
        <div class="message-content">
          <div class="message-label">📨 Message:</div>
          <div class="message-text">${escapeHtml(msg.message)}</div>
        </div>
        ${msg.reply ? `
          <div class="message-content">
            <div class="message-label">🤖 Reply:</div>
            <div class="reply-text">${escapeHtml(msg.reply)}</div>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading unhandled messages:', error);
  }
}

// Load contacts
async function loadContacts() {
  try {
    const response = await fetch('/api/contacts');
    const contacts = await response.json();

    const container = document.getElementById('contactsList');

    if (contacts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">👥</div>
          <p>No contacts yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = contacts.map(contact => `
      <div class="contact-card">
        <h3>${contact.contact_name || 'Unknown'}</h3>
        <div class="contact-detail">
          <span>📱 Phone:</span>
          <span>${contact.phone_number}</span>
        </div>
        <div class="contact-detail">
          <span>💬 Messages:</span>
          <span>${contact.message_count}</span>
        </div>
        <div class="contact-detail">
          <span>🕐 Last Message:</span>
          <span>${formatTimestamp(contact.last_message)}</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading contacts:', error);
  }
}

// Load FAQ statistics
async function loadFAQStats() {
  try {
    const response = await fetch('/api/faq/stats');
    const faqs = await response.json();

    const container = document.getElementById('faqStats');

    if (faqs.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>No FAQ data yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = faqs.map(faq => `
      <div class="faq-item">
        <div class="faq-header">
          <div>
            <span class="faq-category">${faq.category}</span>
            <div class="faq-keywords">${faq.keywords}</div>
          </div>
          <span class="faq-usage">Used ${faq.usage_count} times</span>
        </div>
        <div class="faq-response">${escapeHtml(faq.response)}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading FAQ stats:', error);
  }
}

// Load analytics
async function loadAnalytics() {
  try {
    const response = await fetch('/api/analytics/range?days=7');
    const analytics = await response.json();

    const container = document.getElementById('analyticsChart');

    if (analytics.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📈</div>
          <p>No analytics data yet</p>
        </div>
      `;
      return;
    }

    const maxMessages = Math.max(...analytics.map(a => a.total_messages));

    container.innerHTML = analytics.map(day => `
      <div class="chart-item">
        <div class="chart-date">📅 ${formatDate(day.date)}</div>
        <div class="chart-bars">
          <div class="chart-bar">
            <span class="chart-label">Total Messages</span>
            <div class="chart-progress">
              <div class="chart-fill" style="width: ${(day.total_messages / maxMessages) * 100}%">
                ${day.total_messages}
              </div>
            </div>
          </div>
          <div class="chart-bar">
            <span class="chart-label">Auto-Handled</span>
            <div class="chart-progress">
              <div class="chart-fill" style="width: ${(day.auto_handled / maxMessages) * 100}%; background: #28a745;">
                ${day.auto_handled}
              </div>
            </div>
          </div>
          <div class="chart-bar">
            <span class="chart-label">Needs Review</span>
            <div class="chart-progress">
              <div class="chart-fill" style="width: ${(day.manual_needed / maxMessages) * 100}%; background: #ffc107;">
                ${day.manual_needed}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

// Search conversations
async function handleSearch(event) {
  if (event.key === 'Enter') {
    const searchTerm = event.target.value.trim();

    if (!searchTerm) {
      loadConversations();
      return;
    }

    try {
      const response = await fetch(`/api/conversations/search?q=${encodeURIComponent(searchTerm)}`);
      const results = await response.json();

      const container = document.getElementById('conversationsList');

      if (results.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <p>No results found for "${searchTerm}"</p>
          </div>
        `;
        return;
      }

      container.innerHTML = results.map(conv => `
        <div class="conversation-card">
          <div class="conversation-header">
            <div class="contact-info">
              <span class="contact-name">${conv.contact_name || 'Unknown'}</span>
              <span class="phone-number">${conv.phone_number}</span>
            </div>
            <span class="timestamp">${formatTimestamp(conv.timestamp)}</span>
          </div>
          <div class="message-content">
            <div class="message-label">📨 Message:</div>
            <div class="message-text">${escapeHtml(conv.message)}</div>
          </div>
          ${conv.reply ? `
            <div class="message-content">
              <div class="message-label">🤖 Reply:</div>
              <div class="reply-text">${escapeHtml(conv.reply)}</div>
            </div>
          ` : ''}
        </div>
      `).join('');
    } catch (error) {
      console.error('Error searching:', error);
    }
  }
}

// Tab switching
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');

  currentTab = tabName;
}

// Pagination
function nextPage() {
  loadConversations(currentPage + 1);
}

function previousPage() {
  if (currentPage > 1) {
    loadConversations(currentPage - 1);
  }
}

// Utility functions
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // More than 24 hours
  return date.toLocaleString();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
