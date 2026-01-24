/**
 * Comprehensive HR Dashboard Testing
 * Tests all features: Approvals, Scheduling, Payments, Management
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5005/api';
let authToken = '';
let hrUserId = '';

// Test Results Logger
const results = {
  passed: [],
  failed: [],
  errors: []
};

function log(title, message) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`✓ ${title}`);
  console.log('='.repeat(70));
  console.log(message);
}

function logError(title, error) {
  console.log(`\n${'❌'.repeat(35)}`);
  console.log(`✗ ${title}`);
  console.log('❌'.repeat(35));
  console.log(`Error: ${error.message}`);
  if (error.response?.data) {
    console.log('Response:', JSON.stringify(error.response.data, null, 2));
  }
}

async function loginAsHR() {
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      username: 'hr',
      password: 'hr123'
    });
    authToken = response.data.token;
    hrUserId = response.data.userId;
    results.passed.push('HR Login');
    log('✅ HR LOGIN SUCCESSFUL', `Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    results.failed.push('HR Login');
    logError('❌ HR LOGIN FAILED', error);
    return false;
  }
}

async function testDashboardAPI() {
  try {
    const response = await axios.get(`${BASE_URL}/hr/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    results.passed.push('Dashboard API');
    log('✅ DASHBOARD API', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    results.failed.push('Dashboard API');
    logError('❌ DASHBOARD API', error);
    return null;
  }
}

async function testPendingPayments() {
  try {
    const examPayments = await axios.get(`${BASE_URL}/hr/payments/pending`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const interviewPayments = await axios.get(`${BASE_URL}/hr/interview-payments/pending`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    results.passed.push('Pending Payments Retrieval');
    log('✅ PENDING PAYMENTS', 
      `Exam Payments: ${examPayments.data.length}\nInterview Payments: ${interviewPayments.data.length}\n\nExam Payments: ${JSON.stringify(examPayments.data, null, 2)}\n\nInterview Payments: ${JSON.stringify(interviewPayments.data, null, 2)}`
    );
    return { exam: examPayments.data, interview: interviewPayments.data };
  } catch (error) {
    results.failed.push('Pending Payments Retrieval');
    logError('❌ PENDING PAYMENTS RETRIEVAL', error);
    return { exam: [], interview: [] };
  }
}

async function testInterviewRequests() {
  try {
    const pendingResponse = await axios.get(`${BASE_URL}/interview-requests?status=pending`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const approvedResponse = await axios.get(`${BASE_URL}/interview-requests?status=approved`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    results.passed.push('Interview Requests Retrieval');
    log('✅ INTERVIEW REQUESTS', 
      `Pending: ${pendingResponse.data.length}\nApproved: ${approvedResponse.data.length}\n\nPending Requests: ${JSON.stringify(pendingResponse.data, null, 2)}\n\nApproved Requests: ${JSON.stringify(approvedResponse.data, null, 2)}`
    );
    return { pending: pendingResponse.data, approved: approvedResponse.data };
  } catch (error) {
    results.failed.push('Interview Requests Retrieval');
    logError('❌ INTERVIEW REQUESTS RETRIEVAL', error);
    return { pending: [], approved: [] };
  }
}

async function testApprovalWorkflow() {
  try {
    const requests = await axios.get(`${BASE_URL}/interview-requests?status=pending`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (requests.data.length === 0) {
      console.log('\n⚠️  No pending interview requests to test approval workflow');
      return;
    }

    const firstRequest = requests.data[0];
    console.log(`\n📋 Testing Approval on Request: ${firstRequest._id}`);

    const approveResponse = await axios.patch(
      `${BASE_URL}/interview-requests/${firstRequest._id}/approve`,
      { status: 'approved' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    results.passed.push('Approve Interview Request');
    log('✅ APPROVE INTERVIEW REQUEST', JSON.stringify(approveResponse.data, null, 2));
  } catch (error) {
    results.failed.push('Approve Interview Request');
    logError('❌ APPROVE INTERVIEW REQUEST', error);
  }
}

async function testPaymentApprovalWorkflow() {
  try {
    const payments = await axios.get(`${BASE_URL}/hr/interview-payments/pending`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (payments.data.length === 0) {
      console.log('\n⚠️  No pending interview payments to test approval workflow');
      return;
    }

    const firstPayment = payments.data[0];
    console.log(`\n💳 Testing Payment Approval on: ${firstPayment._id}`);

    const approveResponse = await axios.post(
      `${BASE_URL}/hr/interview-payments/approve`,
      { paymentId: firstPayment._id },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    results.passed.push('Approve Interview Payment');
    log('✅ APPROVE INTERVIEW PAYMENT', JSON.stringify(approveResponse.data, null, 2));
  } catch (error) {
    results.failed.push('Approve Interview Payment');
    logError('❌ APPROVE INTERVIEW PAYMENT', error);
  }
}

async function testUserManagement() {
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    results.passed.push('User Management - List Users');
    log('✅ USER MANAGEMENT - LIST USERS', `Total Users: ${response.data.length}\n\n${JSON.stringify(response.data.slice(0, 3), null, 2)}`);
  } catch (error) {
    results.failed.push('User Management - List Users');
    logError('❌ USER MANAGEMENT - LIST USERS', error);
  }
}

async function testRoleManagement() {
  try {
    const response = await axios.get(`${BASE_URL}/admin/roles`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    results.passed.push('Role Management');
    log('✅ ROLE MANAGEMENT', JSON.stringify(response.data, null, 2));
  } catch (error) {
    results.failed.push('Role Management');
    logError('❌ ROLE MANAGEMENT', error);
  }
}

async function testExamManagement() {
  try {
    const response = await axios.get(`${BASE_URL}/exams`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    results.passed.push('Exam Management');
    log('✅ EXAM MANAGEMENT', `Total Exams: ${response.data.length}\n\n${JSON.stringify(response.data.slice(0, 2), null, 2)}`);
  } catch (error) {
    results.failed.push('Exam Management');
    logError('❌ EXAM MANAGEMENT', error);
  }
}

async function testInterviewCourses() {
  try {
    const response = await axios.get(`${BASE_URL}/interview-courses`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    results.passed.push('Interview Courses');
    log('✅ INTERVIEW COURSES', `Total Courses: ${response.data.length}\n\n${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    results.failed.push('Interview Courses');
    logError('❌ INTERVIEW COURSES', error);
  }
}

async function generateTestReport() {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(68) + '╗');
  console.log('║' + ' '.repeat(15) + '📊 HR DASHBOARD TEST REPORT 📊' + ' '.repeat(22) + '║');
  console.log('╚' + '═'.repeat(68) + '╝');

  console.log('\n✅ PASSED TESTS:');
  console.log('─'.repeat(70));
  results.passed.forEach((test, idx) => {
    console.log(`  ${idx + 1}. ${test}`);
  });

  console.log('\n❌ FAILED TESTS:');
  console.log('─'.repeat(70));
  if (results.failed.length === 0) {
    console.log('  None - All tests passed! 🎉');
  } else {
    results.failed.forEach((test, idx) => {
      console.log(`  ${idx + 1}. ${test}`);
    });
  }

  console.log('\n📈 SUMMARY:');
  console.log('─'.repeat(70));
  const total = results.passed.length + results.failed.length;
  const percentage = ((results.passed.length / total) * 100).toFixed(1);
  console.log(`  Total Tests: ${total}`);
  console.log(`  Passed: ${results.passed.length}`);
  console.log(`  Failed: ${results.failed.length}`);
  console.log(`  Success Rate: ${percentage}%`);
  console.log('\n' + '═'.repeat(70) + '\n');

  if (results.failed.length === 0) {
    console.log('🎉 ALL TESTS PASSED! HR DASHBOARD IS FULLY FUNCTIONAL! 🎉\n');
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
  }
}

async function runAllTests() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 STARTING COMPREHENSIVE HR DASHBOARD TEST SUITE');
    console.log('='.repeat(70));

    // Step 1: Login
    if (!await loginAsHR()) {
      console.error('\n❌ Cannot proceed without HR login');
      return;
    }

    // Step 2: Test Dashboard
    await testDashboardAPI();

    // Step 3: Test Pending Payments
    await testPendingPayments();

    // Step 4: Test Interview Requests
    const interviewData = await testInterviewRequests();

    // Step 5: Test Approval Workflow
    if (interviewData.pending.length > 0) {
      await testApprovalWorkflow();
    }

    // Step 6: Test Payment Approval
    await testPaymentApprovalWorkflow();

    // Step 7: Test User Management
    await testUserManagement();

    // Step 8: Test Role Management
    await testRoleManagement();

    // Step 9: Test Exam Management
    await testExamManagement();

    // Step 10: Test Interview Courses
    await testInterviewCourses();

    // Generate Final Report
    await generateTestReport();

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    process.exit(1);
  }
}

// Run tests with 2 second delay to allow server startup
setTimeout(runAllTests, 2000);
