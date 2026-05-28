from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import uuid
import os

from gmail_service import GmailService
from database import EmailDatabase
from scheduler import EmailScheduler

app = Flask(__name__, static_folder='static')
CORS(app)

gmail_service = GmailService()
db = EmailDatabase()
email_scheduler = EmailScheduler()

def send_scheduled_email_callback(schedule_id, to, subject, body):
    """Callback function for scheduled emails"""
    result = gmail_service.send_email(to, subject, body)

    if result["success"]:
        db.log_sent_email(to, subject, body, "sent")
        db.update_scheduled_email_status(schedule_id, "sent")
    else:
        db.log_sent_email(to, subject, body, "failed")
        db.update_scheduled_email_status(schedule_id, "failed")

@app.route('/')
def index():
    """Serve the main UI"""
    return send_from_directory('static', 'index.html')

@app.route('/api/send-email', methods=['POST'])
def send_email():
    """Send an email immediately"""
    try:
        data = request.get_json()

        if not data or not all(k in data for k in ['to', 'subject', 'body']):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        result = gmail_service.send_email(data['to'], data['subject'], data['body'])

        if result["success"]:
            db.log_sent_email(data['to'], data['subject'], data['body'], "sent")
            return jsonify({
                "success": True,
                "message": "Email sent successfully",
                "message_id": result["message_id"]
            })
        else:
            db.log_sent_email(data['to'], data['subject'], data['body'], "failed")
            return jsonify({"success": False, "message": result["message"]}), 500

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/schedule-email', methods=['POST'])
def schedule_email():
    """Schedule an email to be sent later"""
    try:
        data = request.get_json()

        if not data or not all(k in data for k in ['to', 'subject', 'body', 'scheduled_time']):
            return jsonify({"success": False, "message": "Missing required fields"}), 400

        # Parse datetime string from datetime-local input (format: 2026-05-01T18:00)
        scheduled_time = datetime.fromisoformat(data['scheduled_time'])

        if scheduled_time <= datetime.now():
            return jsonify({
                "success": False,
                "message": f"Scheduled time must be in the future. Selected: {scheduled_time.strftime('%Y-%m-%d %H:%M')}, Current: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
            }), 400

        job_id = f"email_{uuid.uuid4().hex}"

        schedule_id = db.add_scheduled_email(
            data['to'],
            data['subject'],
            data['body'],
            data['scheduled_time'],
            job_id
        )

        email_scheduler.schedule_email(
            job_id,
            scheduled_time,
            send_scheduled_email_callback,
            schedule_id,
            data['to'],
            data['subject'],
            data['body']
        )

        return jsonify({
            "success": True,
            "message": "Email scheduled successfully",
            "schedule_id": schedule_id,
            "scheduled_time": data['scheduled_time']
        })

    except ValueError as e:
        return jsonify({"success": False, "message": f"Invalid datetime format: {str(e)}"}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/email-history', methods=['GET'])
def get_email_history():
    """Get email history"""
    try:
        limit = request.args.get('limit', 50, type=int)
        history = db.get_email_history(limit)
        return jsonify({"success": True, "data": history})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/scheduled-emails', methods=['GET'])
def get_scheduled_emails():
    """Get all pending scheduled emails"""
    try:
        scheduled = db.get_scheduled_emails()
        return jsonify({"success": True, "data": scheduled})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/scheduled-emails/<int:schedule_id>', methods=['DELETE'])
def cancel_scheduled_email(schedule_id):
    """Cancel a scheduled email"""
    try:
        scheduled_emails = db.get_scheduled_emails()
        email_to_cancel = next((e for e in scheduled_emails if e['id'] == schedule_id), None)

        if not email_to_cancel:
            return jsonify({"success": False, "message": "Scheduled email not found"}), 404

        email_scheduler.cancel_job(email_to_cancel['job_id'])
        db.delete_scheduled_email(schedule_id)

        return jsonify({"success": True, "message": "Scheduled email cancelled"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

if __name__ == "__main__":
    print("=" * 60)
    print("📧 Email Automation System Starting...")
    print("=" * 60)
    print("🌐 Server running at: http://localhost:8000")
    print("📚 Open your browser and visit the URL above")
    print("=" * 60)
    app.run(host="0.0.0.0", port=8001, debug=True, use_reloader=False)
