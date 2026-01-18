# OTP Email Testing Guide

## Current Setup
✅ **Development Mode**: Uses Ethereal Email (free test email service)
✅ **Email Logging**: OTP is logged to server console
✅ **Preview URL**: API returns URL to preview the email

## How to Test OTP Registration

### Step 1: Start Development Server
```bash
npm run dev
```
Server starts on: **http://localhost:3003**
API on: **http://localhost:3002**

### Step 2: Go to Registration
Visit: **http://localhost:3003/register**

### Step 3: Fill Registration Form
- Username: `testuser`
- Email: `test@example.com` (any email)
- Phone: `9876543210` (10 digits)
- Password: `password123`
- Confirm: `password123`

### Step 4: Click "Send OTP"
The server console will show:
```
🔐 OTP Generated for test@example.com: 123456
✅ Email sent successfully to test@example.com
📧 Preview URL: https://ethereal.email/message/...
```

### Step 5: Get the OTP
**Two ways to get the OTP:**

**Option A - Server Console:**
- Look at the terminal where `npm run dev` is running
- Find the line: `🔐 OTP Generated for [email]: [OTP]`
- Copy the 6-digit OTP

**Option B - Preview Email:**
- Click the Preview URL in the response
- OR Check the browser console (F12 → Console)
- The API response shows the preview URL

### Step 6: Enter OTP
- Paste the OTP in the "Enter OTP" field
- Click "Verify & Register"
- You're registered! ✅

## Server Console Output Example
```
🔐 OTP Generated for student@test.com: 456789
✅ Email sent successfully to student@test.com
📧 Preview URL: https://ethereal.email/message/P7F5BhEf0WiSIaOEP7F5BhEf0WiSIaOEP7...
```

## API Response (in Browser)
```json
{
  "message": "OTP sent successfully to your email",
  "otp": "456789",
  "previewUrl": "https://ethereal.email/message/...",
  "note": "Development mode: Click preview URL to see the email"
}
```

## Production Setup
For production deployment (Vercel), configure these environment variables:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Or use any other SMTP service (SendGrid, AWS SES, etc.)

## Troubleshooting

**Q: Where do I find the OTP?**
A: Check the server console (where `npm run dev` is running) for: `🔐 OTP Generated for [email]: [OTP]`

**Q: Can I see the actual email content?**
A: Yes! Click the Preview URL shown in:
   - Server console (`📧 Preview URL: ...`)
   - OR Browser console (F12 → Network → Look for `/auth/send-otp` response)

**Q: The OTP isn't working?**
A: Make sure:
   - OTP matches exactly (case-sensitive)
   - OTP hasn't expired (5-minute timeout)
   - You copied the correct OTP from the console

**Q: For production, how do I set up Gmail?**
A: 
1. Enable 2FA on Gmail account
2. Create an App Password at https://myaccount.google.com/apppasswords
3. Use that password as EMAIL_PASS in .env
