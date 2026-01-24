const axios = require('axios');

async function test() {
  try {
    // Test 1: Get available interview courses
    const courses = await axios.get('http://localhost:3002/api/interview-courses');
    console.log('✅ Interview Courses Endpoint:', courses.data.length, 'courses found');
    
    // Test 2: Login as student
    const loginRes = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'student1',
      password: 'student123'
    });
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log('✅ Student Login Successful');
    
    // Test 3: Create interview request
    if (courses.data.length > 0) {
      const reqRes = await axios.post('http://localhost:3002/api/interview-requests', {
        courseId: courses.data[0].id,
        proposedDate: '2026-02-15',
        proposedTime: '14:00',
        notes: 'Test interview request'
      }, { 
        headers: { 'Authorization': `Bearer ${token}` } 
      });
      console.log('✅ Interview Request Created:', reqRes.data.message);
    }
    
    // Test 4: Admin login and get requests
    const adminLogin = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'admin1',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin Login Successful');
    
    const getReqs = await axios.get('http://localhost:3002/api/interview-requests?status=pending', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('✅ Get Interview Requests:', getReqs.data.length, 'pending requests');
    
    console.log('\n📋 All Interview Requests:');
    getReqs.data.forEach(req => {
      console.log(`  - ${req.studentEmail}: ${req.courseName} on ${req.proposedDate} at ${req.proposedTime}`);
    });
    
  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
  }
}

test();
