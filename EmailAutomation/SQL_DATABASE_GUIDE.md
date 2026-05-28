# 📚 Complete SQL Database Guide for Your Email Automation Project

## Table of Contents
1. Current Database Structure
2. SQL Basics & Commands
3. Adding User Management
4. Advanced Database Features
5. Best Practices

---

## 1. CURRENT DATABASE STRUCTURE

### Table 1: `email_history`
Stores all sent emails with their status.

```sql
CREATE TABLE email_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,  -- Unique ID for each email
    to_email TEXT NOT NULL,                -- Recipient email address
    subject TEXT NOT NULL,                 -- Email subject
    body TEXT NOT NULL,                    -- Email content
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When it was sent
    status TEXT DEFAULT 'sent'             -- Status: sent/failed
);
```

**Example Data:**
| id | to_email | subject | body | sent_at | status |
|----|----------|---------|------|---------|--------|
| 1 | john@example.com | Hello | Hi John! | 2024-03-15 10:30:00 | sent |
| 2 | jane@example.com | Meeting | See you tomorrow | 2024-03-15 11:00:00 | sent |

### Table 2: `scheduled_emails`
Stores emails that are scheduled to be sent in the future.

```sql
CREATE TABLE scheduled_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    scheduled_time TIMESTAMP NOT NULL,     -- When to send
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When scheduled
    status TEXT DEFAULT 'pending',         -- pending/sent/failed
    job_id TEXT                            -- Scheduler job reference
);
```

---

## 2. SQL BASICS & COMMANDS

### A. CREATE - Creating Tables
```sql
-- Create a new table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### B. INSERT - Adding Data
```sql
-- Insert a single record
INSERT INTO users (username, email, password_hash) 
VALUES ('john_doe', 'john@example.com', 'hashed_password_here');

-- Insert multiple records
INSERT INTO users (username, email, password_hash) VALUES
    ('alice', 'alice@example.com', 'hash1'),
    ('bob', 'bob@example.com', 'hash2'),
    ('charlie', 'charlie@example.com', 'hash3');
```

### C. SELECT - Reading Data
```sql
-- Get all records
SELECT * FROM users;

-- Get specific columns
SELECT username, email FROM users;

-- Filter with WHERE
SELECT * FROM users WHERE username = 'john_doe';

-- Sort results
SELECT * FROM users ORDER BY created_at DESC;

-- Limit results
SELECT * FROM users LIMIT 10;

-- Count records
SELECT COUNT(*) FROM users;

-- Search with LIKE
SELECT * FROM users WHERE email LIKE '%@gmail.com';
```

### D. UPDATE - Modifying Data
```sql
-- Update a single record
UPDATE users 
SET email = 'newemail@example.com' 
WHERE username = 'john_doe';

-- Update multiple fields
UPDATE users 
SET username = 'john_updated', email = 'john_new@example.com'
WHERE id = 1;
```

### E. DELETE - Removing Data
```sql
-- Delete specific record
DELETE FROM users WHERE id = 5;

-- Delete with condition
DELETE FROM users WHERE created_at < '2023-01-01';

-- Delete all records (careful!)
DELETE FROM users;
```

### F. JOIN - Combining Tables
```sql
-- If you have related tables
SELECT 
    users.username,
    email_history.subject,
    email_history.sent_at
FROM users
INNER JOIN email_history ON users.email = email_history.to_email;
```

---

## 3. ADDING USER MANAGEMENT TO YOUR PROJECT

### Step 1: Create User Table Schema

```python
# Add to database.py

def create_users_table(self):
    """Create users table for authentication"""
    conn = sqlite3.connect(self.db_path)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            is_active INTEGER DEFAULT 1,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    """)
    
    conn.commit()
    conn.close()
```

### Step 2: User Management Functions

```python
import hashlib

class UserDatabase:
    def __init__(self, db_path: str = "emails.db"):
        self.db_path = db_path
    
    def hash_password(self, password: str) -> str:
        """Hash password using SHA256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, username: str, email: str, password: str, 
                   full_name: str = None, is_admin: bool = False):
        """Create a new user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        password_hash = self.hash_password(password)
        
        try:
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, full_name, is_admin)
                VALUES (?, ?, ?, ?, ?)
            """, (username, email, password_hash, full_name, 1 if is_admin else 0))
            
            conn.commit()
            user_id = cursor.lastrowid
            conn.close()
            return {"success": True, "user_id": user_id}
        except sqlite3.IntegrityError:
            conn.close()
            return {"success": False, "error": "Username or email already exists"}
    
    def authenticate_user(self, username: str, password: str):
        """Verify user credentials"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        password_hash = self.hash_password(password)
        
        cursor.execute("""
            SELECT * FROM users 
            WHERE username = ? AND password_hash = ? AND is_active = 1
        """, (username, password_hash))
        
        user = cursor.fetchone()
        
        if user:
            # Update last login
            cursor.execute("""
                UPDATE users SET last_login = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (user['id'],))
            conn.commit()
        
        conn.close()
        return dict(user) if user else None
    
    def get_user_by_id(self, user_id: int):
        """Get user by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        conn.close()
        
        return dict(user) if user else None
    
    def get_all_users(self):
        """Get all users"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, username, email, full_name, is_active, created_at FROM users")
        users = cursor.fetchall()
        conn.close()
        
        return [dict(user) for user in users]
    
    def update_user(self, user_id: int, **kwargs):
        """Update user fields"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Build dynamic UPDATE query
        fields = []
        values = []
        
        for key, value in kwargs.items():
            if key in ['email', 'full_name', 'is_active', 'is_admin']:
                fields.append(f"{key} = ?")
                values.append(value)
        
        if not fields:
            return {"success": False, "error": "No valid fields to update"}
        
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        
        cursor.execute(query, values)
        conn.commit()
        conn.close()
        
        return {"success": True}
    
    def delete_user(self, user_id: int):
        """Delete a user (soft delete - set is_active to 0)"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
        conn.commit()
        conn.close()
        
        return {"success": True}
```

---

## 4. ADVANCED DATABASE FEATURES

### A. Foreign Keys (Relationships)
Link emails to users who sent them:

```python
# Modified email_history table with user relationship
cursor.execute("""
    CREATE TABLE IF NOT EXISTS email_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,              -- Who sent it
        to_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'sent',
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
""")
```

### B. Indexes (Speed up queries)
```python
# Create index for faster searches
cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_email_history_user 
    ON email_history(user_id)
""")

cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_email_history_sent_at 
    ON email_history(sent_at)
""")
```

### C. Transactions (All or nothing)
```python
def send_bulk_emails(self, emails_list):
    """Send multiple emails - all succeed or all fail"""
    conn = sqlite3.connect(self.db_path)
    cursor = conn.cursor()
    
    try:
        conn.execute("BEGIN TRANSACTION")
        
        for email in emails_list:
            cursor.execute("""
                INSERT INTO email_history (to_email, subject, body)
                VALUES (?, ?, ?)
            """, (email['to'], email['subject'], email['body']))
        
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        return {"success": False, "error": str(e)}
    finally:
        conn.close()
```

---

## 5. BEST PRACTICES

### ✅ DO:
1. **Use parameterized queries** (prevents SQL injection)
   ```python
   # GOOD
   cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
   
   # BAD - vulnerable to SQL injection!
   cursor.execute(f"SELECT * FROM users WHERE username = '{username}'")
   ```

2. **Always close connections**
   ```python
   conn = sqlite3.connect(db_path)
   try:
       # do work
   finally:
       conn.close()
   ```

3. **Use transactions for multiple operations**

4. **Create indexes on frequently queried columns**

5. **Hash passwords - NEVER store plain text**

### ❌ DON'T:
1. Don't store sensitive data without encryption
2. Don't use `SELECT *` in production (specify columns)
3. Don't forget to handle exceptions
4. Don't leave connections open

---

## 6. SQLITE vs OTHER DATABASES

| Feature | SQLite | MySQL/PostgreSQL |
|---------|--------|------------------|
| Setup | No setup needed | Requires server installation |
| File | Single .db file | Multiple files + server |
| Concurrent writes | Limited | Excellent |
| Size limit | ~140 TB | Unlimited |
| Best for | Small-medium apps | Large enterprise apps |
| Network access | No | Yes |

**When to upgrade from SQLite:**
- Multiple users accessing simultaneously
- Need remote database access
- Handling millions of records
- Need advanced features (stored procedures, etc.)

---

## 7. PRACTICAL EXAMPLE: Complete User System

See the attached `user_management.py` file for a complete working example!
