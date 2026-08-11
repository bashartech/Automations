---
name: "emailjs-integration"
description: "Complete EmailJS integration setup for sending emails from client-side applications without backend. Use when user needs to set up email notifications, contact forms, or appointment confirmations using EmailJS service."
---

# EmailJS Integration Skill

## When to Use This Skill

- User wants to send emails from a React/JavaScript application without a backend
- User needs to set up appointment notifications or contact form submissions
- User asks about EmailJS setup, configuration, or integration
- User wants to avoid using Firebase Cloud Functions or other backend email services
- User needs a cost-effective email solution (EmailJS free tier: 200 emails/month)

## Procedure

### 1. EmailJS Account Setup

**Step 1.1: Create Account**
- Go to https://www.emailjs.com/
- Sign up for a free account
- Verify your email address
- Log in to the EmailJS dashboard

**Step 1.2: Add Email Service**
- Click "Email Services" in the left sidebar
- Click "Add New Service"
- Choose your email provider (Gmail, Outlook, Yahoo, etc.)
- For Gmail:
  - Click "Connect Account"
  - Authorize EmailJS to send emails on your behalf
  - Or use SMTP settings with App Password (recommended for production)
- Note down your **Service ID** (e.g., `service_ddt1qqw`)

**Step 1.3: Create Email Template**
- Click "Email Templates" in the left sidebar
- Click "Create New Template"
- Design your email template with variables:
  ```
  Subject: New Appointment Request - {{patient_name}}

  Hello Admin,

  A new appointment request has been received:

  Patient Name: {{patient_name}}
  Contact: {{phone_or_email}}
  Department: {{department}}
  Preferred Time: {{preferred_time}}
  Reason: {{reason}}
  Hospital: {{hospital_name}}

  Please review and confirm the appointment.

  Best regards,
  MediDesk AI Assistant
  ```
- Note down your **Template ID** (e.g., `template_0qnaavm`)

**Step 1.4: Get Public Key**
- Click "Account" in the left sidebar
- Find your **Public Key** (e.g., `781YtMVmRv_RJx7qd`)
- This key is safe to use in client-side code

### 2. Project Integration

**Step 2.1: Install EmailJS Package**
```bash
npm install emailjs-com
# or
yarn add emailjs-com
```

**Step 2.2: Configure Environment Variables**
Create or update `.env` file:
```env
VITE_EMAILJS_SERVICE_ID=service_ddt1qqw
VITE_EMAILJS_TEMPLATE_ID=template_0qnaavm
VITE_EMAILJS_PUBLIC_KEY=781YtMVmRv_RJx7qd
```

**Step 2.3: Create EmailJS Service File**
Create `src/services/emailjs.ts`:
```typescript
import emailjs from 'emailjs-com';

// Initialize EmailJS (optional, can be done in send function)
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

export interface AppointmentEmailData {
  patient_name: string;
  phone_or_email: string;
  department: string;
  preferred_time: string;
  reason: string;
  hospital_name: string;
}

export const sendAppointmentEmail = async (
  appointmentData: AppointmentEmailData
): Promise<boolean> => {
  try {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Validate environment variables
    if (!serviceId || !templateId || !publicKey) {
      console.error('EmailJS configuration missing');
      return false;
    }

    // Prepare template parameters
    const templateParams = {
      patient_name: appointmentData.patient_name,
      phone_or_email: appointmentData.phone_or_email,
      department: appointmentData.department,
      preferred_time: appointmentData.preferred_time,
      reason: appointmentData.reason || 'Not specified',
      hospital_name: appointmentData.hospital_name
    };

    // Send email
    const response = await emailjs.send(
      serviceId,
      templateId,
      templateParams,
      publicKey
    );

    console.log('✅ Email sent successfully:', response.status, response.text);
    return true;

  } catch (error) {
    console.error('❌ EmailJS error:', error);
    return false;
  }
};
```

**Step 2.4: Integrate in Component**
Example usage in appointment form:
```typescript
import { sendAppointmentEmail } from '../../services/emailjs';

const handleSubmit = async (formData) => {
  // Save to database first
  const appointmentId = await saveAppointment(formData);

  // Send email notification
  const emailSent = await sendAppointmentEmail({
    patient_name: formData.name,
    phone_or_email: formData.phoneOrEmail,
    department: formData.department,
    preferred_time: formData.preferredTime,
    reason: formData.reason,
    hospital_name: hospitalConfig.hospitalName
  });

  if (emailSent) {
    console.log('Email notification sent to admin');
  } else {
    console.warn('Email failed, but appointment was saved');
  }
};
```

### 3. Testing & Verification

**Step 3.1: Test Email Sending**
- Submit a test appointment
- Check EmailJS dashboard for email logs
- Verify email received in admin inbox
- Check spam folder if not received

**Step 3.2: Monitor Usage**
- EmailJS dashboard shows email count
- Free tier: 200 emails/month
- Upgrade if needed for higher volume

**Step 3.3: Error Handling**
- Always handle email failures gracefully
- Don't block user flow if email fails
- Log errors for debugging
- Consider retry logic for critical emails

### 4. Production Best Practices

**Security:**
- ✅ Public key is safe for client-side use
- ✅ Never expose Service ID or Template ID in public repos (use .env)
- ✅ Add rate limiting to prevent abuse
- ✅ Validate form data before sending

**Performance:**
- ✅ Send emails asynchronously (don't block UI)
- ✅ Show success message even if email fails
- ✅ Use try-catch for error handling

**Reliability:**
- ✅ Save data to database BEFORE sending email
- ✅ Email is notification, not primary data storage
- ✅ Implement retry logic for failed emails
- ✅ Monitor EmailJS dashboard for delivery issues

## Output Format

When helping users set up EmailJS, provide:

**Configuration Summary:**
```
EmailJS Configuration:
- Service ID: service_xxxxx
- Template ID: template_xxxxx
- Public Key: xxxxxxxxxxxxx
- Monthly Limit: 200 emails (free tier)
```

**Integration Checklist:**
- [ ] EmailJS account created
- [ ] Email service connected (Gmail/Outlook)
- [ ] Email template created with variables
- [ ] Environment variables configured
- [ ] EmailJS package installed
- [ ] Service file created (src/services/emailjs.ts)
- [ ] Integration tested with sample data
- [ ] Error handling implemented
- [ ] Production deployment verified

**Code Files to Create:**
1. `.env` - Environment variables
2. `src/services/emailjs.ts` - EmailJS service
3. Integration in form component

## Quality Criteria

- **Complete Setup**: All steps from account creation to integration covered
- **Security First**: Environment variables used, no hardcoded credentials
- **Error Handling**: Graceful failures, user flow not blocked
- **Clear Documentation**: Step-by-step with code examples
- **Production Ready**: Best practices for reliability and performance
- **Testing Guidance**: How to verify email delivery

## Common Issues & Solutions

**Issue 1: Emails not received**
- Check spam folder
- Verify Service ID, Template ID, and Public Key
- Check EmailJS dashboard for error logs
- Ensure email service is properly connected

**Issue 2: "Invalid public key" error**
- Verify Public Key in .env matches EmailJS dashboard
- Check for typos or extra spaces
- Ensure environment variables are loaded (restart dev server)

**Issue 3: Template variables not replaced**
- Ensure variable names in template match code (case-sensitive)
- Use double curly braces in template: {{variable_name}}
- Check templateParams object has all required fields

**Issue 4: Rate limit exceeded**
- Free tier: 200 emails/month
- Upgrade to paid plan if needed
- Implement client-side rate limiting
- Cache email sends to avoid duplicates

## Example

**Input**: "I need to set up email notifications for appointment bookings in my React app without using a backend"

**Output**:

I'll help you set up EmailJS for client-side email notifications. Here's the complete setup:

### 1. EmailJS Account Setup

**Create Account:**
1. Go to https://www.emailjs.com/
2. Sign up and verify your email
3. Log in to dashboard

**Add Email Service:**
1. Click "Email Services" → "Add New Service"
2. Choose Gmail (or your provider)
3. Connect your account
4. Save your Service ID: `service_ddt1qqw`

**Create Email Template:**
1. Click "Email Templates" → "Create New Template"
2. Use this template:
```
Subject: New Appointment - {{patient_name}}

Hello Admin,

New appointment request:
- Patient: {{patient_name}}
- Contact: {{phone_or_email}}
- Department: {{department}}
- Time: {{preferred_time}}
- Reason: {{reason}}

Hospital: {{hospital_name}}
```
3. Save your Template ID: `template_0qnaavm`

**Get Public Key:**
1. Click "Account"
2. Copy your Public Key: `781YtMVmRv_RJx7qd`

### 2. Install & Configure

```bash
npm install emailjs-com
```

Create `.env`:
```env
VITE_EMAILJS_SERVICE_ID=service_ddt1qqw
VITE_EMAILJS_TEMPLATE_ID=template_0qnaavm
VITE_EMAILJS_PUBLIC_KEY=781YtMVmRv_RJx7qd
```

### 3. Create Service File

[Provide complete emailjs.ts code as shown in procedure]

### 4. Test

Submit a test appointment and verify email delivery in your inbox.

**Free tier includes 200 emails/month** - perfect for getting started!
