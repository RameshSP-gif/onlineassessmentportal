#!/usr/bin/env node

/**
 * HR Dashboard API Tests
 * Tests all endpoints and functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';
const results = [];

let token = '';

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    results.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🚀 HR DASHBOARD COMPREHENSIVE TEST SUITE');
  console.log('═'.repeat(70) + '\n');

  // Test 1: HR Login
  await test('HR Login', async () => {
    const res = await axios.post(`${BASE_URL}/login`, {
      username: 'hr',
      password: 'hr123'
    });
    if (!res.data.token) throw new Error('No token received');
    token = res.data.token;
    console.log(`   → Token: ${token.substring(0, 20)}...`);
  });

  // Test 2: Dashboard API
  await test('Dashboard API - Get Statistics', async () => {
    const res = await axios.get(`${BASE_URL}/hr/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.data.stats) throw new Error('No stats in response');
    console.log(`   → Students: ${res.data.stats.totalStudents || 0}`);
    console.log(`   → Exams: ${res.data.stats.totalExams || 0}`);
    console.log(`   → Submissions: ${res.data.stats.totalSubmissions || 0}`);
  });

  // Test 3: Pending Exam Payments
  await test('Pending Exam Payments', async () => {
    const res = await axios.get(`${BASE_URL}/hr/payments/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Pending Count: ${res.data.length}`);
  });

  // Test 4: Pending Interview Payments
  await test('Pending Interview Payments', async () => {
    const res = await axios.get(`${BASE_URL}/hr/interview-payments/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Pending Count: ${res.data.length}`);
  });

  // Test 5: Interview Requests - Pending
  let pendingRequests = [];
  await test('Interview Requests - Pending', async () => {
    const res = await axios.get(`${BASE_URL}/interview-requests?status=pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    pendingRequests = res.data;
    console.log(`   → Pending Requests: ${res.data.length}`);
  });

  // Test 6: Interview Requests - Approved
  await test('Interview Requests - Approved', async () => {
    const res = await axios.get(`${BASE_URL}/interview-requests?status=approved`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Approved Requests: ${res.data.length}`);
  });

  // Test 7: Interview Courses
  await test('Interview Courses', async () => {
    const res = await axios.get(`${BASE_URL}/interview-courses`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Courses: ${res.data.length}`);
  });

  // Test 8: User Management - List All Users
  await test('User Management - List All Users', async () => {
    const res = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Total Users: ${res.data.length}`);
  });

  // Test 9: Role Management
  await test('Role Management - List Roles', async () => {
    const res = await axios.get(`${BASE_URL}/admin/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Total Roles: ${res.data.length}`);
  });

  // Test 10: Exam Management
  await test('Exam Management - List Exams', async () => {
    const res = await axios.get(`${BASE_URL}/exams`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Total Exams: ${res.data.length}`);
  });

  // Test 11: Approval Workflow (if pending requests exist)
  if (pendingRequests.length > 0) {
    const requestId = pendingRequests[0]._id;
    await test(`Approve Interview Request (${requestId})`, async () => {
      const res = await axios.patch(
        `${BASE_URL}/interview-requests/${requestId}/approve`,
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`   → Status: ${res.data.status || res.data.message}`);
    });
  } else {
    console.log('⏭️  Skipped approval test (no pending requests)');
  }

  // Test 12: Reports
  await test('Reports API', async () => {
    const res = await axios.get(`${BASE_URL}/reports`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Data available: ${Object.keys(res.data).length} fields`);
  });

  // Test 13: Submissions
  await test('Submissions API', async () => {
    const res = await axios.get(`${BASE_URL}/submissions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   → Total Submissions: ${res.data.length || 0}`);
  });

  // Print Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(70));

  const passed = results.filter(r => r.status.includes('✅')).length;
  const failed = results.filter(r => r.status.includes('❌')).length;
  const total = results.length;

  results.forEach(r => {
    console.log(`${r.status} ${r.name}${r.error ? ' - ' + r.error : ''}`);
  });

  console.log('\n' + '─'.repeat(70));
  console.log(`Total: ${total} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('═'.repeat(70));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! HR DASHBOARD IS FULLY FUNCTIONAL!\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed.\n`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests with delay
setTimeout(runTests, 1000);
