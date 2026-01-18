const axios = require('axios');

async function sendOTPTest() {
  try {
    console.log('Sending OTP to rsrtech.ec@gmail.com...\n');
    
    const response = await axios.post('http://localhost:3002/api/auth/send-otp', {
      email: 'rsrtech.ec@gmail.com'
    }, {
      timeout: 10000
    });
    
    console.log('✅ SUCCESS! OTP API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n📧 Check rsrtech.ec@gmail.com inbox for the OTP email!');
    console.log('🔐 OTP Code:', response.data.otp);
    
  } catch (error) {
    console.error('❌ FAILED:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
      console.error('Code:', error.code);
    }
  }
}

sendOTPTest();
