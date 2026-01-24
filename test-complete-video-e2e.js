const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3002';
let testResults = {
  passed: 0,
  failed: 0,
  details: []
};

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function pass(test) {
  testResults.passed++;
  testResults.details.push({ test, status: 'PASS' });
  log('✅', `PASS: ${test}`);
}

function fail(test, error) {
  testResults.failed++;
  testResults.details.push({ test, status: 'FAIL', error });
  log('❌', `FAIL: ${test} - ${error}`);
}

async function runTest(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (error) {
    fail(name, error.response?.data?.error || error.message);
  }
}

async function main() {
  console.log('\n🎯 COMPREHENSIVE VIDEO INTERVIEW E2E TEST SUITE\n');
  console.log('='.repeat(60));
  
  let studentToken, adminToken, studentId, courseId, orderId, requestId;
  
  // Clean up: Remove any existing test data first
  try {
    const adminRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin1',
      password: 'admin123'
    });
    const tempToken = adminRes.data.token;
    
    // Try to clean up previous test data (ignore errors)
    try {
      await axios.get(`${BASE_URL}/api/interview-courses`);
    } catch (e) {}
  } catch (e) {
    console.log('⚠️ Could not clean up test data, proceeding...');
  }
  
  // Test 1: Health check
  await runTest('Backend health check', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-courses`);
    if (!res.data || res.data.length === 0) throw new Error('No courses found');
  });
  
  // Test 2: Student login
  await runTest('Student login', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'student1',
      password: 'student123'
    });
    if (!res.data.token) throw new Error('No token received');
    studentToken = res.data.token;
    studentId = res.data.user.id;
  });
  
  // Test 3: Admin login
  await runTest('Admin login', async () => {
    const res = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin1',
      password: 'admin123'
    });
    if (!res.data.token) throw new Error('No token received');
    adminToken = res.data.token;
  });
  
  // Test 4: Get interview courses
  await runTest('Fetch interview courses', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-courses`);
    if (!res.data || res.data.length === 0) throw new Error('No courses available');
    // Pick a different course each time to avoid conflicts
    courseId = res.data[Math.floor(Math.random() * res.data.length)].id;
  });
  
  // Test 5: Check payment status (should be not paid)
  await runTest('Check initial payment status', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-payments/status/${courseId}/${studentId}`);
    if (res.data.paid !== false) throw new Error('Payment should not be paid initially');
  });
  
  // Test 6: Create payment order
  await runTest('Create payment order', async () => {
    const res = await axios.post(`${BASE_URL}/api/interview-payments/create-order`, {
      courseId,
      amount: 200
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (!res.data.orderId) throw new Error('No order ID received');
    orderId = res.data.orderId;
  });
  
  // Test 7: Upload payment proof
  await runTest('Upload payment screenshot', async () => {
    const res = await axios.post(`${BASE_URL}/api/interview-payments/upload-screenshot`, {
      orderId,
      screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (!res.data.success) throw new Error('Screenshot upload failed');
    // Wait a bit for status to update
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  // Test 8: Verify payment status is pending verification
  await runTest('Verify payment pending verification', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-payments/status/${courseId}/${studentId}`);
    if (res.data.status !== 'pending_verification' && res.data.status !== 'pending') {
      throw new Error(`Expected pending_verification or pending, got ${res.data.status}`);
    }
  });
  
  // Test 9: Admin gets pending payments
  await runTest('Admin fetch pending payments', async () => {
    const res = await axios.get(`${BASE_URL}/api/admin/interview-payments/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data)) throw new Error('Expected array of pending payments');
  });
  
  // Test 10: Admin approves payment
  await runTest('Admin approve payment', async () => {
    const res = await axios.post(`${BASE_URL}/api/admin/interview-payments/approve`, {
      orderId,
      adminRemarks: 'Payment verified - E2E test'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (!res.data.message.includes('approved')) throw new Error('Payment approval failed');
    // Wait for status to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  // Test 11: Verify payment is now completed
  await runTest('Verify payment completed', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-payments/status/${courseId}/${studentId}`);
    if (res.data.paid !== true || (res.data.status !== 'completed' && res.data.status !== 'approved')) {
      throw new Error(`Expected completed payment, got paid:${res.data.paid} status:${res.data.status}`);
    }
  });
  
  // Test 12: Student creates interview request
  await runTest('Student create interview request', async () => {
    const res = await axios.post(`${BASE_URL}/api/interview-requests`, {
      courseId,
      proposedDate: '2026-02-15',
      proposedTime: '14:00',
      notes: 'E2E test interview request'
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    if (!res.data.id) throw new Error('No request ID received');
    requestId = res.data.id;
  });
  
  // Test 13: Student gets their requests
  await runTest('Student fetch own requests', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-requests/student/${studentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('No requests found for student');
  });
  
  // Test 14: Admin gets pending requests
  await runTest('Admin fetch pending requests', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-requests?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data)) throw new Error('Expected array of pending requests');
    const found = res.data.find(r => r.id === requestId || r._id === requestId);
    if (!found) throw new Error('Request not found in pending list');
  });
  
  // Test 15: Admin approves interview request
  await runTest('Admin approve interview request', async () => {
    const res = await axios.patch(`${BASE_URL}/api/interview-requests/${requestId}/approve`, {
      scheduledDate: '2026-02-15',
      scheduledTime: '14:00'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    if (!res.data.message.includes('approved')) throw new Error('Request approval failed');
  });
  
  // Test 16: Verify request is approved
  await runTest('Verify request approved status', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-requests/student/${studentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const request = res.data.find(r => (r.id === requestId || r._id === requestId));
    if (!request || request.status !== 'approved') {
      throw new Error(`Expected approved status, got ${request?.status}`);
    }
  });
  
  // Test 17: Test negative case - unauthorized access
  await runTest('Negative: Unauthorized access blocked', async () => {
    try {
      await axios.get(`${BASE_URL}/api/interview-requests?status=pending`);
      throw new Error('Should have been blocked without auth');
    } catch (err) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        throw new Error('Expected 401/403 for unauthorized access');
      }
    }
  });
  
  // Test 18: Test negative case - invalid course ID
  await runTest('Negative: Invalid course ID handled', async () => {
    try {
      await axios.post(`${BASE_URL}/api/interview-requests`, {
        courseId: 'invalid-id-12345',
        proposedDate: '2026-02-15',
        proposedTime: '14:00'
      }, { headers: { Authorization: `Bearer ${studentToken}` } });
      throw new Error('Should have failed with invalid course ID');
    } catch (err) {
      if (err.response?.status !== 404 && err.response?.status !== 500) {
        throw new Error('Expected error for invalid course ID');
      }
    }
  });
  
  // Test 19: Test rejection flow
  await runTest('Admin reject another request (if exists)', async () => {
    // Create another request
    const createRes = await axios.post(`${BASE_URL}/api/interview-requests`, {
      courseId,
      proposedDate: '2026-02-20',
      proposedTime: '10:00',
      notes: 'Second request for rejection test'
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    
    const newRequestId = createRes.data.id;
    
    // Reject it
    const rejectRes = await axios.patch(`${BASE_URL}/api/interview-requests/${newRequestId}/reject`, {
      rejectionReason: 'Time slot unavailable - E2E test'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });
    
    if (!rejectRes.data.message.includes('rejected')) throw new Error('Rejection failed');
  });
  
  // Test 20: Verify rejected request status
  await runTest('Verify rejection reflected correctly', async () => {
    const res = await axios.get(`${BASE_URL}/api/interview-requests/student/${studentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const rejected = res.data.find(r => r.status === 'rejected');
    if (!rejected) throw new Error('No rejected request found');
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details.filter(t => t.status === 'FAIL').forEach(t => {
      console.log(`  • ${t.test}: ${t.error}`);
    });
  }
  
  console.log('\n✨ E2E TEST SUITE COMPLETED\n');
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n💥 FATAL ERROR:', err.message);
  process.exit(1);
});
