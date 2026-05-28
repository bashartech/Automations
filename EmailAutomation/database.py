import sqlite3
from datetime import datetime
from typing import List, Dict, Optional

class EmailDatabase:
    def __init__(self, db_path: str = "emails.db"):
        self.db_path = db_path
        self.init_db()

    def init_db(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Email history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                to_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'sent'
            )
        """)

        # Scheduled emails table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scheduled_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                to_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                scheduled_time TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending',
                job_id TEXT
            )
        """)

        conn.commit()
        conn.close()

    def log_sent_email(self, to_email: str, subject: str, body: str, status: str = "sent"):
        """Log a sent email to history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO email_history (to_email, subject, body, status) VALUES (?, ?, ?, ?)",
            (to_email, subject, body, status)
        )
        conn.commit()
        email_id = cursor.lastrowid
        conn.close()
        return email_id

    def get_email_history(self, limit: int = 50) -> List[Dict]:
        """Get email history"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM email_history ORDER BY sent_at DESC LIMIT ?",
            (limit,)
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def add_scheduled_email(self, to_email: str, subject: str, body: str,
                           scheduled_time: str, job_id: str) -> int:
        """Add a scheduled email"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO scheduled_emails
               (to_email, subject, body, scheduled_time, job_id)
               VALUES (?, ?, ?, ?, ?)""",
            (to_email, subject, body, scheduled_time, job_id)
        )
        conn.commit()
        schedule_id = cursor.lastrowid
        conn.close()
        return schedule_id

    def get_scheduled_emails(self) -> List[Dict]:
        """Get all pending scheduled emails"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM scheduled_emails WHERE status = 'pending' ORDER BY scheduled_time ASC"
        )
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    def update_scheduled_email_status(self, schedule_id: int, status: str):
        """Update status of scheduled email"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE scheduled_emails SET status = ? WHERE id = ?",
            (status, schedule_id)
        )
        conn.commit()
        conn.close()

    def delete_scheduled_email(self, schedule_id: int):
        """Delete a scheduled email"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM scheduled_emails WHERE id = ?", (schedule_id,))
        conn.commit()
        conn.close()
