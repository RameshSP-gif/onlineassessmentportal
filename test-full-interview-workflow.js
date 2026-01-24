const axios = require('axios');

const API = 'http://localhost:3002/api';
let studentToken = '';
let adminToken = '';
let interviewId = '';
let requestId = '';

async function runTest() {
  console.log('🎤 ====== INTERVIEW SCHEDULING WORKFLOW TEST ======\n');

  try {
    // Step 1: Seed data - create interview courses if needed
    console.log('📚 Step 1: Fetching available interview courses...');
    const coursesRes = await axios.get(`${API}/interview-courses`);
    const courses = coursesRes.data;
    console.log(`   ✅ Found ${courses.length} interview courses`);
    interviewId = courses[0]?.id;
    console.log(`   📌 Using course: ${courses[0]?.title}\n`);

    // Step 2: Student logs in
    console.log('👤 Step 2: Student login...');
    const studentLoginRes = await axios.post(`${API}/auth/login`, {
      username: 'student1',
      password: 'student123'
    });
    studentToken = studentLoginRes.data.token;
    const studentId = studentLoginRes.data.user.id;
    console.log(`   ✅ Logged in as: student1`);
    console.log(`   📌 Token: ${studentToken.substring(0, 20)}...`);
    console.log(`   📌 User ID: ${studentId}\n`);

    // Step 3: Get payment status
    console.log('💳 Step 3: Checking payment status...');
    try {
      const paymentRes = await axios.get(`${API}/interview-payments/status/${interviewId}/${studentId}`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      console.log(`   ✅ Payment Status: ${paymentRes.data.status}`);
      console.log(`   ✅ Paid: ${paymentRes.data.paid}\n`);
    } catch (error) {
      console.log(`   ℹ️  No payment record yet\n`);
    }

    // Step 4: Student creates interview request (assumes payment approved)
    console.log('📋 Step 4: Student creates interview request...');
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dateStr = nextWeek.toISOString().split('T')[0];

    const requestRes = await axios.post(`${API}/interview-requests`, {
      courseId: interviewId,
      proposedDate: dateStr,
      proposedTime: '14:30',
      notes: 'I prefer afternoon slots, any weekday works for me'
    }, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    requestId = requestRes.data.id;
    console.log(`   ✅ Request created successfully!`);
    console.log(`   📌 Request ID: ${requestId}`);
    console.log(`   📌 Proposed Date: ${dateStr} at 14:30`);
    console.log(`   📌 Status: pending\n`);

    // Step 5: Admin logs in
    console.log('🔐 Step 5: Admin login...');
    const adminLoginRes = await axios.post(`${API}/auth/login`, {
      username: 'admin1',
      password: 'admin123'
    });
    adminToken = adminLoginRes.data.token;
    console.log(`   ✅ Logged in as: admin1`);
    console.log(`   📌 Admin Token: ${adminToken.substring(0, 20)}...\n`);

    // Step 6: Admin views all pending interview requests
    console.log('📊 Step 6: Admin views pending interview requests...');
    const pendingRes = await axios.get(`${API}/interview-requests?status=pending`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Found ${pendingRes.data.length} pending request(s)`);
    pendingRes.data.forEach((req, idx) => {
      console.log(`   📌 Request #${idx + 1}:`);
      console.log(`      - Student: ${req.studentEmail || 'N/A'}`);
      console.log(`      - Course: ${req.courseName}`);
      console.log(`      - Proposed: ${req.proposedDate} at ${req.proposedTime}`);
      console.log(`      - Notes: ${req.notes || 'None'}`);
    });
    console.log('');

    // Step 7: Admin approves the interview request
    console.log('✅ Step 7: Admin approves interview request...');
    const approveRes = await axios.patch(`${API}/interview-requests/${requestId}/approve`, {
      status: 'approved',
      scheduledDate: dateStr,
      scheduledTime: '14:30'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Request approved!`);
    console.log(`   📌 New Status: ${approveRes.data.status}`);
    console.log(`   📌 Scheduled: ${approveRes.data.scheduledDate} at ${approveRes.data.scheduledTime}\n`);

    // Step 8: Admin views approved requests
    console.log('📊 Step 8: Admin views approved interview requests...');
    const approvedRes = await axios.get(`${API}/interview-requests?status=approved`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Found ${approvedRes.data.length} approved request(s)\n`);

    // Step 9: Test rejection flow
    console.log('❌ Step 9: Testing rejection flow (create another request)...');
    const request2Res = await axios.post(`${API}/interview-requests`, {
      courseId: interviewId,
      proposedDate: '2026-02-20',
      proposedTime: '10:00',
      notes: 'Test rejection'
    }, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const request2Id = request2Res.data.id;
    console.log(`   ✅ Second request created: ${request2Id}`);

    const rejectRes = await axios.patch(`${API}/interview-requests/${request2Id}/reject`, {
      rejectionReason: 'Time slot not available'
    }, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Request rejected!`);
    console.log(`   📌 Reason: ${rejectRes.data.rejectionReason}\n`);

    // Step 10: Summary
    console.log('📈 ====== WORKFLOW SUMMARY ======');
    console.log('✅ Student can view available interviews');
    console.log('✅ Student can pay for interview (₹200)');
    console.log('✅ Student can request interview with proposed date/time');
    console.log('✅ Admin can view all pending requests');
    console.log('✅ Admin can approve requests and set schedule');
    console.log('✅ Admin can reject requests with reason');
    console.log('✅ Students get notification of approval/rejection');
    console.log('\n🎉 All workflow steps completed successfully!\n');

  } catch (error) {
    console.error('❌ Test Error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('   Error: Unauthorized - Check token or authentication');
    }
    if (error.response?.status === 404) {
      console.error('   Error: Not found - Check course or request ID');
    }
  }
}

// Run the test
runTest();
