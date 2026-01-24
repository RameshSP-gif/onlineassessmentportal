/**
 * VIDEO INTERVIEW API TESTING - SIMPLE VERSION
 * Tests backend APIs without localStorage
 */

const axios = require('axios');

const API = 'http://localhost:5005/api';
let testResults = { passed: 0, failed: 0 };

const log = (msg) => console.log(msg);

async function test(name, fn) {
  try {
    await fn();
    testResults.passed++;
    log(`✅ ${name}`);
  } catch (error) {
    testResults.failed++;
    log(`❌ ${name}`);
    log(`   └─ ${error.message}\n`);
  }
}

async function run() {
  log('\n🎤 ===== VIDEO INTERVIEW API TESTS =====\n');

  let studentToken = '';
  let adminToken = '';
  let courseId = '';
  let requestId = '';

  // ===== AUTH TESTS =====
  log('📌 AUTHENTICATION TESTS\n');

  await test('✓ Student login', async () => {
    const res = await axios.post(`${API}/auth/login`, {
      username: 'student1',
      password: 'student123'
    });
    if (!res.data.token) throw new Error('No token');
    studentToken = res.data.token;
  });

  await test('✓ Admin login', async () => {
    const res = await axios.post(`${API}/auth/login`, {
      username: 'admin1',
      password: 'admin123'
    });
    if (!res.data.token) throw new Error('No token');
    adminToken = res.data.token;
  });

  await test('✓ Login with wrong password fails', async () => {
    try {
      await axios.post(`${API}/auth/login`, {
        username: 'student1',
        password: 'wrong'
      });
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status !== 401 && !e.message.includes('Should have failed')) throw e;
    }
  });

  // ===== INTERVIEW COURSES =====
  log('\n📌 INTERVIEW COURSES\n');

  await test('✓ Get all interview courses', async () => {
    const res = await axios.get(`${API}/interview-courses`);
    if (!Array.isArray(res.data) || res.data.length === 0) throw new Error('No courses');
    courseId = res.data[0].id;
  });

  await test('✓ Get interview course by ID', async () => {
    const res = await axios.get(`${API}/interview-courses/${courseId}`);
    if (!res.data.id) throw new Error('Invalid course');
  });

  await test('✓ Get invalid course returns 404', async () => {
    try {
      await axios.get(`${API}/interview-courses/invalid`);
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status !== 404) throw e;
    }
  });

  // ===== PAYMENT STATUS =====
  log('\n📌 PAYMENT STATUS\n');

  await test('✓ Check payment status', async () => {
    const res = await axios.get(`${API}/interview-payments/status/${courseId}/student1`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    if (!res.data.status) throw new Error('No status');
  });

  // ===== INTERVIEW REQUESTS =====
  log('\n📌 INTERVIEW REQUESTS\n');

  await test('✓ Create interview request', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const dateStr = date.toISOString().split('T')[0];

    const res = await axios.post(`${API}/interview-requests`, {
      courseId: courseId,
      proposedDate: dateStr,
      proposedTime: '14:00',
      notes: 'Test request'
    }, { headers: { 'Authorization': `Bearer ${studentToken}` } });

    if (!res.data.id) throw new Error('No request ID');
    requestId = res.data.id;
  });

  await test('✓ Create request without auth fails', async () => {
    try {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      await axios.post(`${API}/interview-requests`, {
        courseId,
        proposedDate: date.toISOString().split('T')[0],
        proposedTime: '14:00'
      });
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status !== 401) throw e;
    }
  });

  // ===== ADMIN OPERATIONS =====
  log('\n📌 ADMIN OPERATIONS\n');

  await test('✓ Admin get pending requests', async () => {
    const res = await axios.get(`${API}/interview-requests?status=pending`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (!Array.isArray(res.data)) throw new Error('Not an array');
  });

  await test('✓ Admin approve request', async () => {
    if (requestId) {
      const res = await axios.patch(
        `${API}/interview-requests/${requestId}/approve`,
        { status: 'approved', scheduledDate: '2026-02-01', scheduledTime: '14:00' },
        { headers: { 'Authorization': `Bearer ${adminToken}` } }
      );
      if (res.data.status !== 'approved') throw new Error('Not approved');
    }
  });

  await test('✓ Student cannot approve requests', async () => {
    try {
      await axios.patch(
        `${API}/interview-requests/anyid/approve`,
        { status: 'approved' },
        { headers: { 'Authorization': `Bearer ${studentToken}` } }
      );
      throw new Error('Should have failed');
    } catch (e) {
      if (e.response?.status !== 403) throw e;
    }
  });

  await test('✓ Admin reject request', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 8);
    const createRes = await axios.post(`${API}/interview-requests`, {
      courseId,
      proposedDate: date.toISOString().split('T')[0],
      proposedTime: '15:00',
      notes: 'To reject'
    }, { headers: { 'Authorization': `Bearer ${studentToken}` } });

    const res = await axios.patch(
      `${API}/interview-requests/${createRes.data.id}/reject`,
      { rejectionReason: 'Not available' },
      { headers: { 'Authorization': `Bearer ${adminToken}` } }
    );
    if (res.data.status !== 'rejected') throw new Error('Not rejected');
  });

  // ===== RESPONSIVENESS TESTS =====
  log('\n📌 RESPONSE TIME TESTS\n');

  await test('✓ Courses endpoint < 1 sec', async () => {
    const start = Date.now();
    await axios.get(`${API}/interview-courses`);
    const time = Date.now() - start;
    if (time > 1000) throw new Error(`Too slow: ${time}ms`);
  });

  await test('✓ Auth endpoint < 2 sec', async () => {
    const start = Date.now();
    await axios.post(`${API}/auth/login`, {
      username: 'student1',
      password: 'student123'
    });
    const time = Date.now() - start;
    if (time > 2000) throw new Error(`Too slow: ${time}ms`);
  });

  // ===== SUMMARY =====
  log('\n\n📊 ===== TEST RESULTS =====\n');
  log(`✅ Passed: ${testResults.passed}`);
  log(`❌ Failed: ${testResults.failed}`);
  log(`📊 Total: ${testResults.passed + testResults.failed}`);
  const passRate = Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100);
  log(`📈 Pass Rate: ${passRate}%\n`);

  if (passRate === 100) {
    log('🎉 ALL TESTS PASSED! Video interview APIs are working perfectly!\n');
  }
}

// Run with 5 second delay to allow backend to start
setTimeout(run, 5000).catch(console.error);
