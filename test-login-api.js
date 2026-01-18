const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      username: 'student1',
      password: 'student123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('\n✅ Token received:', response.data.token.substring(0, 50) + '...');
      console.log('✅ User:', response.data.user);
    }
    
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Error:', error.response?.data || error.message);
  }
  
  process.exit(0);
}

testLogin();
