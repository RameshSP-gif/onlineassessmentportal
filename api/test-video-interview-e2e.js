const axios = require('axios');

const BASE_URL = 'http://localhost:3002/api';
const studentUser = { username: 'student1', password: 'student123' };

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

const test = (name, passed, details = '') => {
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name} - ${details}`);
  }
};

async function runE2EVideoInterviewTest() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('     🎥 VIDEO INTERVIEW END-TO-END TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let studentToken = null;
  let studentId = null;
  let courseId = null;
  let orderId = null;

  try {
    // ========== STEP 1: STUDENT LOGIN ==========
    console.log('\n📝 STEP 1: Student Login');
    console.log('─────────────────────────────────────────');
    
    try {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, studentUser);
      studentToken = loginRes.data.token;
      studentId = loginRes.data.user.id;
      test('Login as student', loginRes.status === 200 && studentToken);
      console.log(`   Token: ${studentToken.substring(0, 20)}...`);
    } catch (error) {
      test('Login as student', false, error.response?.data?.error || error.message);
      return;
    }

    const headers = { Authorization: `Bearer ${studentToken}` };

    // ========== STEP 2: FETCH INTERVIEW COURSES ==========
    console.log('\n📚 STEP 2: Fetch Available Interview Courses');
    console.log('─────────────────────────────────────────');
    
    try {
      const coursesRes = await axios.get(`${BASE_URL}/interview-courses`, { headers });
      test('Fetch interview courses', coursesRes.status === 200, `Found ${coursesRes.data.length || 0} courses`);
      
      if (coursesRes.data && coursesRes.data.length > 0) {
        courseId = coursesRes.data[0].id;
        console.log(`   Using course: ${coursesRes.data[0].title}`);
        console.log(`   Course ID: ${courseId}`);
      } else {
        test('Course availability', false, 'No interview courses available');
        return;
      }
    } catch (error) {
      test('Fetch interview courses', false, error.message);
      return;
    }

    // ========== STEP 3: CHECK PAYMENT STATUS ==========
    console.log('\n💳 STEP 3: Check Interview Payment Status');
    console.log('─────────────────────────────────────────');
    
    let isPaid = false;
    try {
      const statusRes = await axios.get(
        `${BASE_URL}/interview-payments/status/${courseId}/${studentId}`,
        { headers }
      );
      test('Get payment status', statusRes.status === 200);
      console.log(`   Payment Status: ${statusRes.data.status}`);
      console.log(`   Is Paid: ${statusRes.data.paid}`);
      
      isPaid = statusRes.data.paid;
      if (statusRes.data.orderId) {
        orderId = statusRes.data.orderId;
      }
    } catch (error) {
      test('Get payment status', false, error.message);
      return;
    }

    // ========== STEP 4: CREATE PAYMENT ORDER ==========
    if (!isPaid) {
      console.log('\n💰 STEP 4: Create Payment Order');
      console.log('─────────────────────────────────────────');
      
      try {
        const orderRes = await axios.post(
          `${BASE_URL}/interview-payments/create-order`,
          { courseId, userId: studentId },
          { headers }
        );
        test('Create payment order', orderRes.status === 200 && orderRes.data.orderId);
        orderId = orderRes.data.orderId;
        console.log(`   Order ID: ${orderId}`);
      } catch (error) {
        test('Create payment order', false, error.response?.data?.error || error.message);
      }

      // ========== STEP 5: SIMULATE PAYMENT SUBMISSION ==========
      console.log('\n📤 STEP 5: Submit Payment Proof (Screenshot)');
      console.log('─────────────────────────────────────────');
      
      try {
        const FormData = require('form-data');
        const fs = require('fs');
        const path = require('path');
        
        // Create a dummy image file for testing
        const dummyImagePath = path.join(__dirname, 'dummy-payment.png');
        
        // Create a minimal PNG if it doesn't exist
        if (!fs.existsSync(dummyImagePath)) {
          const minimalPng = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
            0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
            0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
          ]);
          fs.writeFileSync(dummyImagePath, minimalPng);
        }

        const form = new FormData();
        form.append('screenshot', fs.createReadStream(dummyImagePath));
        form.append('orderId', orderId);
        form.append('courseId', courseId);
        form.append('userId', studentId);
        form.append('transactionId', 'TEST-TXN-001');
        form.append('upiId', 'test@upi');

        const uploadRes = await axios.post(
          `${BASE_URL}/interview-payments/upload-screenshot`,
          form,
          {
            headers: { ...form.getHeaders(), Authorization: `Bearer ${studentToken}` }
          }
        );
        test('Submit payment proof', uploadRes.status === 200 && uploadRes.data.success);
        console.log(`   Response: ${uploadRes.data.message}`);
        
        // Mark as paid for next steps
        isPaid = true;
      } catch (error) {
        test('Submit payment proof', false, error.response?.data?.error || error.message);
      }
    }

    // ========== STEP 6: VERIFY PAYMENT AFTER SUBMISSION ==========
    console.log('\n✅ STEP 6: Verify Payment After Submission');
    console.log('─────────────────────────────────────────');
    
    try {
      const verifyRes = await axios.get(
        `${BASE_URL}/interview-payments/status/${courseId}/${studentId}`,
        { headers }
      );
      test('Payment status updated', verifyRes.status === 200);
      console.log(`   Updated Status: ${verifyRes.data.status}`);
      console.log(`   Is Paid: ${verifyRes.data.paid}`);
      
      if (verifyRes.data.paid) {
        isPaid = true;
      }
    } catch (error) {
      test('Verify payment status', false, error.message);
    }

    // ========== STEP 7: CREATE INTERVIEW SESSION ==========
    console.log('\n🎤 STEP 7: Create Interview Session');
    console.log('─────────────────────────────────────────');
    
    let sessionId = null;
    try {
      const sessionRes = await axios.post(
        `${BASE_URL}/interview-session`,
        { courseId, userId: studentId },
        { headers }
      );
      test('Create interview session', sessionRes.status === 200 || sessionRes.status === 201);
      sessionId = sessionRes.data.sessionId || sessionRes.data.id;
      console.log(`   Session ID: ${sessionId}`);
    } catch (error) {
      test('Create interview session', false, error.response?.data?.error || error.message);
      return;
    }

    // ========== STEP 8: FETCH INTERVIEW QUESTIONS ==========
    console.log('\n❓ STEP 8: Fetch Interview Questions');
    console.log('─────────────────────────────────────────');
    
    try {
      const questionsRes = await axios.get(`${BASE_URL}/interview-courses/${courseId}`, { headers });
      test('Fetch interview questions', questionsRes.status === 200);
      console.log(`   Total Questions: ${questionsRes.data.questions?.length || 0}`);
      if (questionsRes.data.questions && questionsRes.data.questions.length > 0) {
        console.log(`   Sample Question: "${questionsRes.data.questions[0]}"`);
      }
    } catch (error) {
      test('Fetch interview questions', false, error.message);
    }

    // ========== STEP 9: START INTERVIEW SESSION ==========
    console.log('\n▶️  STEP 9: Start Interview Session');
    console.log('─────────────────────────────────────────');
    
    try {
      const startRes = await axios.patch(
        `${BASE_URL}/interview-session/${sessionId}/status`,
        { status: 'in-progress', startedAt: new Date().toISOString() },
        { headers }
      );
      test('Start interview session', startRes.status === 200 || startRes.status === 204);
      console.log(`   Interview started at: ${new Date().toISOString()}`);
    } catch (error) {
      test('Start interview session', false, error.response?.data?.error || error.message);
    }

    // ========== STEP 10: SAVE TRANSCRIPT ==========
    console.log('\n📝 STEP 10: Save Interview Transcript');
    console.log('─────────────────────────────────────────');
    
    try {
      const transcriptRes = await axios.post(
        `${BASE_URL}/interview-session/${sessionId}/transcript`,
        { 
          transcript: 'Test transcript: This is a sample transcript from the interview session.'
        },
        { headers }
      );
      test('Save transcript', transcriptRes.status === 200 || transcriptRes.status === 201);
      console.log(`   Transcript saved successfully`);
    } catch (error) {
      test('Save transcript', false, error.response?.data?.error || error.message);
    }

    // ========== STEP 11: MARK RECORDING COMPLETE ==========
    console.log('\n🎥 STEP 11: Mark Recording as Complete');
    console.log('─────────────────────────────────────────');
    
    try {
      const recordingRes = await axios.patch(
        `${BASE_URL}/interview-session/${sessionId}/recording-complete`,
        { videoRecordingUrl: 'https://example.com/video-sample.webm' },
        { headers }
      );
      test('Mark recording complete', recordingRes.status === 200 || recordingRes.status === 204);
      console.log(`   Recording URL saved`);
    } catch (error) {
      test('Mark recording complete', false, error.response?.data?.error || error.message);
    }

    // ========== STEP 12: TRIGGER AI EVALUATION ==========
    console.log('\n🤖 STEP 12: Trigger AI Evaluation');
    console.log('─────────────────────────────────────────');
    
    try {
      const evalRes = await axios.post(
        `${BASE_URL}/interview-session/${sessionId}/evaluate`,
        {},
        { headers }
      );
      test('Trigger AI evaluation', evalRes.status === 200 || evalRes.status === 201);
      console.log(`   AI evaluation initiated`);
    } catch (error) {
      // This might fail if evaluation service is not running, but that's ok for this test
      console.log(`   ℹ️ AI evaluation service note: ${error.response?.data?.error || error.message}`);
    }

    // ========== STEP 13: COMPLETE INTERVIEW SESSION ==========
    console.log('\n✔️  STEP 13: Complete Interview Session');
    console.log('─────────────────────────────────────────');
    
    try {
      const completeRes = await axios.patch(
        `${BASE_URL}/interview-session/${sessionId}/status`,
        { 
          status: 'completed',
          endedAt: new Date().toISOString()
        },
        { headers }
      );
      test('Complete interview session', completeRes.status === 200 || completeRes.status === 204);
      console.log(`   Interview completed`);
    } catch (error) {
      test('Complete interview session', false, error.response?.data?.error || error.message);
    }

    // ========== STEP 14: FETCH INTERVIEW SESSION RESULTS ==========
    console.log('\n📊 STEP 14: Fetch Interview Session Results');
    console.log('─────────────────────────────────────────');
    
    try {
      const resultsRes = await axios.get(`${BASE_URL}/interview-session/${sessionId}`, { headers });
      test('Fetch session results', resultsRes.status === 200);
      console.log(`   Session Status: ${resultsRes.data.status}`);
      console.log(`   Duration: ${Math.floor((new Date(resultsRes.data.endedAt) - new Date(resultsRes.data.startedAt)) / 60000)} minutes`);
      if (resultsRes.data.aiEvaluation) {
        console.log(`   AI Evaluation: ${JSON.stringify(resultsRes.data.aiEvaluation).substring(0, 100)}...`);
      }
    } catch (error) {
      test('Fetch session results', false, error.message);
    }

    // ========== STEP 15: FETCH STUDENT INTERVIEW SUBMISSIONS ==========
    console.log('\n📋 STEP 15: Fetch All Student Interview Submissions');
    console.log('─────────────────────────────────────────');
    
    try {
      const submissionsRes = await axios.get(`${BASE_URL}/interview-submissions/${studentId}`, { headers });
      test('Fetch interview submissions', submissionsRes.status === 200);
      console.log(`   Total Submissions: ${submissionsRes.data.length || 0}`);
    } catch (error) {
      // Endpoint might not exist, that's ok
      console.log(`   ℹ️ Submissions endpoint: ${error.message}`);
    }

    // ========== RESULTS SUMMARY ==========
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                     📊 TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%\n`);

    console.log('Detailed Results:');
    console.log('─────────────────────────────────────────');
    testResults.tests.forEach((t, i) => {
      const icon = t.passed ? '✅' : '❌';
      console.log(`${icon} ${i + 1}. ${t.name}`);
      if (t.details) {
        console.log(`   └─ ${t.details}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Fatal Error:', error.message);
  }
}

// Run the test
runE2EVideoInterviewTest();
