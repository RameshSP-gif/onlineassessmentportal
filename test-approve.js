const axios = require('axios');

async function test() {
  try {
    // Admin login
    const adminLoginRes = await axios.post('http://localhost:5005/api/auth/login', {
      username: 'admin1',
      password: 'admin123'
    });
    const adminToken = adminLoginRes.data.token;
    console.log('✅ Admin login successful');
    
    // Get requests
    const getReqs = await axios.get('http://localhost:5005/api/interview-requests?status=pending', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    console.log('✅ Found pending requests:', getReqs.data.length);
    const req = getReqs.data[0];
    if (req) {
      console.log('📌 First request ID:', req.id);
      
      // Try to approve it
      const approveRes = await axios.patch(`http://localhost:5005/api/interview-requests/${req.id}/approve`, {
        status: 'approved',
        scheduledDate: '2026-01-30',
        scheduledTime: '14:30'
      }, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      console.log('✅ Approved successfully!', approveRes.data.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.error || error.message);
  }
}

test();
