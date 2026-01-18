# Email OTP Setup Guide

## Current Status
✅ Email OTP system implemented
❌ Gmail credentials not configured (emails won't send)
✅ **Fallback:** OTP displayed in API response + backend console

## Enable Real Email Sending

### Step 1: Generate Gmail App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to your Gmail account
3. Click **"Select app"** → Choose **"Mail"**
4. Click **"Select device"** → Choose **"Other"** → Type: "Assessment Portal"
5. Click **"Generate"**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 2: Configure Backend
Create/update `.env` file in `api/` folder:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
PORT=5005
```

### Step 3: Restart Backend
```powershell
# Kill existing backend
Get-Process node | Stop-Process -Force

# Start with environment variables
cd C:\Per\OnlineAssessmentPortal
$env:PORT=5005
node api/index.js
```

### Step 4: Test
- Register with real email address
- Check inbox for OTP email
- OTP valid for 5 minutes

## Alternative: Use Different Email Provider

### Outlook/Hotmail
```javascript
host: 'smtp-mail.outlook.com',
port: 587,
auth: {
  user: 'your-email@outlook.com',
  pass: 'your-password'
}
```

### Gmail (Less Secure Apps - Not Recommended)
Enable "Less secure app access" at:
https://myaccount.google.com/lesssecureapps

## Current Dev Mode Behavior
- OTP returned in API response: `{"otp": "123456"}`
- OTP logged to console: `📧 [DEV MODE] OTP for email@example.com: 123456`
- Works without email setup for testing
