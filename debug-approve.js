const axios = require('axios');

async function test() {
  try {
    // Admin login
    const adminLoginRes = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'admin1',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.token;
    
    // Get requests
    const getReqs = await axios.get('http://localhost:3002/api/interview-requests?status=pending', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    const req = getReqs.data[0];
    console.log('Request ID:', req.id);
    console.log('Request ID type:', typeof req.id);
    console.log('Request _id:', req._id);
    
    // Try to approve it
    console.log('\nAttempting to approve request...');
    const approveRes = await axios.patch(`http://localhost:3002/api/interview-requests/${req.id}/approve`, {
      status: 'approved',
      scheduledDate: '2026-01-30',
      scheduledTime: '14:30'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Approve response:', approveRes.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

test();
