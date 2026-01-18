require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

app.post('/api/auth/send-otp', async (req, res) => {
  console.log('OTP endpoint hit!');
  res.json({ message: 'Test', otp: '123456' });
});

app.listen(PORT, () => {
  console.log(`✅ Simple server on ${PORT}`);
  console.log('Server is RUNNING and WAITING for requests...');
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  process.exit(0);
});

console.log('Server script loaded');
