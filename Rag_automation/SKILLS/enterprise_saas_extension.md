# AI Employee Vault - Enterprise SaaS Extension Skill

## 🎯 Purpose
This skill guides the transformation of AI Employee Vault from a basic automation tool into a **production-ready, enterprise-grade SaaS product** capable of generating $6M+ annual revenue.

---

## 📊 CURRENT STATE ANALYSIS

### What We Have (Foundation)
- ✅ File-based workflow system
- ✅ Facebook automation (Graph API)
- ✅ Gmail integration (Gmail API)
- ✅ Odoo CRM integration
- ✅ Scheduler system
- ✅ Diagram generation (Mermaid)
- ✅ Flask dashboard
- ✅ PM2 deployment on Digital Ocean

### What We Need (Enterprise Features)
- 🔴 User authentication & authorization
- 🔴 PostgreSQL database
- 🔴 Multi-tenancy support
- 🔴 Security & encryption (SOC 2 ready)
- 🔴 Billing & subscriptions (Stripe)
- 🔴 Analytics dashboard (Metabase)
- 🟡 Google Calendar integration
- 🟡 WhatsApp Business API
- 🟡 Telegram/Slack notifications
- 🟡 Workflow builder (n8n)

---

## 🏗️ PHASED IMPLEMENTATION GUIDE

### PHASE 1: Security & Foundation (Weeks 1-4)

#### Week 1-2: Database & Authentication

**Step 1: Install PostgreSQL**
```bash
# SSH to cloud server
ssh -i "C:\Users\H P\.ssh\digitaloceonsshkey" root@167.71.237.77

# Install PostgreSQL
apt update
apt install postgresql postgresql-contrib -y

# Secure installation
sudo -u postgres psql
CREATE DATABASE ai_employee;
CREATE USER ai_admin WITH PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE ai_employee TO ai_admin;
\q

# Backup credentials
echo "DB_HOST=localhost
DB_NAME=ai_employee
DB_USER=ai_admin
DB_PASSWORD=CHANGE_THIS_PASSWORD" >> .env
```

**Step 2: Add SQLAlchemy to Project**
```bash
# Add to requirements.txt
SQLAlchemy>=2.0.0
psycopg2-binary>=2.9.0
Flask-SQLAlchemy>=3.0.0
Flask-Login>=0.6.0
Flask-JWT-Extended>=4.5.0
Flask-WTF>=1.2.0
email-validator>=2.0.0
```

**Step 3: Create Database Models**
```python
# models.py
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(100))
    role = db.Column(db.String(20), default='user', nullable=False)  # admin, manager, user, viewer
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, index=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    company = db.relationship('Company', backref='users')
    tasks = db.relationship('Task', backref='user', lazy='dynamic')
    audit_logs = db.relationship('AuditLog', backref='user', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def has_permission(self, required_role):
        role_hierarchy = {'viewer': 0, 'user': 1, 'manager': 2, 'admin': 3}
        return role_hierarchy.get(self.role, 0) >= role_hierarchy.get(required_role, 0)

class Company(db.Model):
    __tablename__ = 'companies'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subscription_tier = db.Column(db.String(20), default='starter')  # starter, professional, business, enterprise
    subscription_status = db.Column(db.String(20), default='active')
    stripe_customer_id = db.Column(db.String(100), unique=True)
    max_users = db.Column(db.Integer, default=1)
    max_emails_per_month = db.Column(db.Integer, default=500)
    max_social_posts_per_month = db.Column(db.Integer, default=100)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Usage tracking
    emails_sent_this_month = db.Column(db.Integer, default=0)
    social_posts_this_month = db.Column(db.Integer, default=0)
    
    # Relationships
    tasks = db.relationship('Task', backref='company', lazy='dynamic')

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    task_type = db.Column(db.String(50), nullable=False)  # facebook, twitter, email, whatsapp, etc.
    status = db.Column(db.String(20), default='pending')  # pending, processing, completed, failed
    priority = db.Column(db.String(10), default='normal')  # low, normal, high, urgent
    
    # Foreign keys
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Content
    content = db.Column(db.Text)
    metadata = db.Column(db.JSON)  # Flexible storage for platform-specific data
    
    # Timestamps
    scheduled_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)
    
    # Error handling
    error_message = db.Column(db.Text)
    retry_count = db.Column(db.Integer, default=0)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # login, create_task, delete_task, etc.
    resource_type = db.Column(db.String(50))  # task, user, company
    resource_id = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(500))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    details = db.Column(db.JSON)

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False, unique=True)
    stripe_subscription_id = db.Column(db.String(100), unique=True)
    stripe_price_id = db.Column(db.String(100))
    status = db.Column(db.String(20), default='active')  # active, past_due, canceled, trialing
    current_period_start = db.Column(db.DateTime)
    current_period_end = db.Column(db.DateTime)
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    company = db.relationship('Company', backref='subscription')
```

**Step 4: Add Authentication Endpoints**
```python
# dashboard/app.py - Add these routes

from flask_jwt_extended import JWTManager, create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, Length, EqualTo

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'change-this-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
jwt = JWTManager(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://ai_admin:CHANGE_THIS_PASSWORD@localhost/ai_employee')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Forms
class LoginForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired()])
    submit = SubmitField('Login')

class RegisterForm(FlaskForm):
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    company_name = StringField('Company Name', validators=[DataRequired()])
    submit = SubmitField('Register')

# Auth Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    form = RegisterForm()
    if form.validate_on_submit():
        # Check if user exists
        if User.query.filter_by(email=form.email.data).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create company
        company = Company(name=form.company_name.data)
        db.session.add(company)
        db.session.flush()
        
        # Create user
        user = User(
            email=form.email.data,
            full_name=form.email.data.split('@')[0],
            role='admin',
            company_id=company.id
        )
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'Registration successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'company': company.name
            }
        }), 201
    
    return jsonify({'error': 'Validation failed', 'details': form.errors}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        
        if user and user.check_password(form.password.data):
            if not user.is_active:
                return jsonify({'error': 'Account is deactivated'}), 403
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Create tokens
            access_token = create_access_token(identity=user.id)
            refresh_token = create_refresh_token(identity=user.id)
            
            # Log audit
            audit_log = AuditLog(
                user_id=user.id,
                company_id=user.company_id,
                action='login',
                ip_address=request.remote_addr,
                user_agent=request.headers.get('User-Agent')
            )
            db.session.add(audit_log)
            db.session.commit()
            
            return jsonify({
                'message': 'Login successful',
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'company': user.company.name
                }
            }), 200
        
        return jsonify({'error': 'Invalid email or password'}), 401
    
    return jsonify({'error': 'Validation failed', 'details': form.errors}), 400

@app.route('/api/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': new_access_token}), 200

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'role': user.role,
        'company': {
            'id': user.company.id,
            'name': user.company.name,
            'subscription_tier': user.company.subscription_tier
        }
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    # In production, add token to blacklist
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Audit log
    audit_log = AuditLog(
        user_id=user.id,
        company_id=user.company_id,
        action='logout',
        ip_address=request.remote_addr
    )
    db.session.add(audit_log)
    db.session.commit()
    
    return jsonify({'message': 'Logout successful'}), 200
```

**Step 5: Protect Existing Routes**
```python
# Add to existing routes that need protection
@app.route('/api/overview')
@jwt_required()
def api_overview():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    # Only show data for user's company
    needs_action = get_tasks_from_folder(NEEDS_ACTION)
    # ... rest of existing code
```

**Step 6: Create Database Tables**
```bash
# Initialize database
cd /home/AI_Employee_Vault
source venv/bin/activate
python3 << EOF
from dashboard.app import app, db
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")
EOF
```

**Deliverables:**
- ✅ PostgreSQL database with 5 tables
- ✅ User registration & login
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Audit logging
- ✅ Company isolation (multi-tenancy foundation)

---

#### Week 3: Security Hardening

**Step 1: Enable HTTPS**
```bash
# Install Certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

**Step 2: Add Rate Limiting**
```python
# Add to requirements.txt
Flask-Limiter>=3.0.0

# In dashboard/app.py
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Apply to auth routes
@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # ... existing code
```

**Step 3: Add Input Validation & Sanitization**
```python
# Add to requirements.txt
bleach>=6.0.0

# utils/security.py
import bleach
import re

def sanitize_html(text):
    """Remove potentially dangerous HTML"""
    allowed_tags = ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li']
    return bleach.clean(text, tags=allowed_tags, strip=True)

def validate_phone(phone):
    """Validate phone number"""
    pattern = r'^\+?[\d\s-]{10,}$'
    return bool(re.match(pattern, phone))

def validate_email(email):
    """Validate email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))
```

**Deliverables:**
- ✅ HTTPS with Let's Encrypt
- ✅ Rate limiting on API endpoints
- ✅ Input validation & sanitization
- ✅ SQL injection prevention (via SQLAlchemy)

---

#### Week 4: Google Calendar Integration

**Step 1: Setup Google Cloud Project**
```bash
# 1. Go to https://console.cloud.google.com
# 2. Create new project: "AI Employee Vault"
# 3. Enable APIs:
#    - Google Calendar API
#    - Google Drive API
# 4. Create OAuth 2.0 credentials
# 5. Download credentials.json
# 6. Upload to server:
scp -i "key" credentials.json root@167.71.237.77:/home/AI_Employee_Vault/
```

**Step 2: Add Calendar Manager**
```python
# Add to requirements.txt
google-api-python-client>=2.80.0
google-auth-httplib2>=0.1.0
google-auth-oauthlib>=1.0.0

# engine/calendar_manager.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from datetime import datetime, timedelta

class CalendarManager:
    def __init__(self, credentials):
        self.service = build('calendar', 'v3', credentials=credentials)
    
    def create_event(self, summary, start_time, end_time, attendees=None, description=None):
        """Create calendar event"""
        event = {
            'summary': summary,
            'description': description,
            'start': {
                'dateTime': start_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat(),
                'timeZone': 'UTC',
            },
            'attendees': [{'email': email} for email in (attendees or [])],
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        created_event = self.service.events().insert(
            calendarId='primary',
            body=event
        ).execute()
        
        return {
            'id': created_event.get('id'),
            'html_link': created_event.get('htmlLink'),
            'status': created_event.get('status')
        }
    
    def get_events(self, start_date=None, end_date=None, max_results=10):
        """Get upcoming events"""
        if not start_date:
            start_date = datetime.utcnow()
        if not end_date:
            end_date = start_date + timedelta(days=7)
        
        events_result = self.service.events().list(
            calendarId='primary',
            timeMin=start_date.isoformat() + 'Z',
            timeMax=end_date.isoformat() + 'Z',
            maxResults=max_results,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        return events_result.get('items', [])
```

**Step 3: Add Calendar Routes**
```python
# dashboard/app.py
@app.route('/api/calendar/create-event', methods=['POST'])
@jwt_required()
def create_calendar_event():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    
    data = request.json
    summary = data.get('summary')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    attendees = data.get('attendees', [])
    description = data.get('description', '')
    
    # Validate
    if not all([summary, start_time, end_time]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create calendar manager (need OAuth flow first)
    # For now, use service account
    calendar_mgr = CalendarManager(credentials)
    event = calendar_mgr.create_event(
        summary=summary,
        start_time=datetime.fromisoformat(start_time),
        end_time=datetime.fromisoformat(end_time),
        attendees=attendees,
        description=description
    )
    
    return jsonify({
        'message': 'Event created successfully',
        'event': event
    }), 201
```

**Deliverables:**
- ✅ Google Calendar API integration
- ✅ Create events from dashboard
- ✅ Auto-schedule meetings from emails
- ✅ Event reminders

---

### PHASE 2: Communication & Workflows (Weeks 5-8)

*(Follow similar detailed structure for remaining phases)*

---

## 📈 SUCCESS METRICS

| Metric | Before | After Phase 1 | After Phase 2 | After Phase 3 |
|--------|--------|---------------|---------------|---------------|
| **Security** | None | SOC 2 ready | SOC 2 ready | SOC 2 certified |
| **Users** | 1 | Unlimited | Unlimited | Unlimited |
| **Multi-tenant** | No | Yes | Yes | Yes |
| **Billing** | None | None | Stripe ready | Full billing |
| **Analytics** | Basic | Basic | Metabase | Custom dashboards |
| **Price Point** | $0 | $500/mo | $2000/mo | $10K+/mo |

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Database backups configured
- [ ] Monitoring setup (PM2, logs)
- [ ] SSL certificate installed
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry)

### Deployment
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] PM2 processes started
- [ ] Health checks passing
- [ ] Smoke tests completed

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all integrations
- [ ] Test billing flows
- [ ] Customer onboarding tested

---

## 🎯 NEXT STEPS

1. **Start with Week 1** - Database setup
2. **Test locally first** - Don't deploy directly to production
3. **Get feedback early** - Show to potential customers
4. **Iterate quickly** - Don't aim for perfection
5. **Document everything** - For team and customers

---

**Ready to transform AI Employee Vault into a $6M/year enterprise SaaS!** 🚀
