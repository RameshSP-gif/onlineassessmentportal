// Test Profile API
const axios = require('axios');

async function testProfileAPI() {
  try {
    console.log('🧪 Testing Profile API...\n');
    
    // First, login as a test user (assuming a user exists)
    const testUsername = 'admin'; // Change this to a real username
    const testPassword = 'admin123';
    
    console.log(`1️⃣ Logging in as ${testUsername}...`);
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      username: testUsername,
      password: testPassword
    });
    
    if (!loginResponse.data.token) {
      console.error('❌ Login failed - no token received');
      return;
    }
    
    console.log(`✅ Login successful`);
    console.log(`👤 User: ${loginResponse.data.user.username}`);
    console.log(`🎫 Token: ${loginResponse.data.token.substring(0, 20)}...`);
    
    const token = loginResponse.data.token;
    
    // Test GET profile
    console.log('\n2️⃣ Getting user profile...');
    const profileResponse = await axios.get('http://localhost:3002/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile retrieved successfully:');
    console.log(JSON.stringify(profileResponse.data, null, 2));
    
    // Test PUT profile
    console.log('\n3️⃣ Updating profile...');
    const updateResponse = await axios.put('http://localhost:3002/api/auth/profile', {
      email: profileResponse.data.email,
      phone: profileResponse.data.phone || '1234567890'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Profile updated successfully:');
    console.log(JSON.stringify(updateResponse.data, null, 2));
    
    console.log('\n✅ All profile API tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message);
    }
  }
}

// Wait a bit for server to be ready
setTimeout(() => {
  testProfileAPI();
}, 2000);
