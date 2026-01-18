require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'NOT SET');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function testEmail() {
  try {
    console.log('\nVerifying transporter...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: `"Online Assessment Portal" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test OTP Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email</h2>
          <p>Your test OTP is: <strong>123456</strong></p>
        </div>
      `
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n✅ Email configuration is working correctly!');
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
  }
}

testEmail();
