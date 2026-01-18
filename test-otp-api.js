const axios = require('axios');

async function testOTPEndpoint() {
  try {
    console.log('Testing /api/auth/send-otp endpoint...\n');
    
    const response = await axios.post('http://localhost:3002/api/auth/send-otp', {
      email: 'test@example.com'
    });
    
    console.log('✅ OTP API Response:', response.data);
    console.log('\n✅ SUCCESS! OTP endpoint is working!');
    console.log('OTP Generated:', response.data.otp);
    
  } catch (error) {
    console.error('❌ OTP API Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    console.error('Full error:', error.code);
  }
}

testOTPEndpoint();
