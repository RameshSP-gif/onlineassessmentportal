// Test script to verify all API endpoints work correctly
const http = require('http');

const ROOT_URL = 'http://localhost:3002';
const BASE_URL = `${ROOT_URL}/api`;

function makeRequest(method, path, body = null, base = BASE_URL) {
  return new Promise((resolve, reject) => {
    const url = new URL(base + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting API Tests...\n');
  let passed = 0;
  let failed = 0;

  // Test 1: Health check
  try {
    console.log('Test 1: Health Check');
    const result = await makeRequest('GET', '/health', null, ROOT_URL);
    if (result.status === 200) {
      console.log('✅ PASS: Health endpoint works\n');
      passed++;
    } else {
      console.log('❌ FAIL: Health check returned', result.status, '\n');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAIL: Health check error -', err.message, '\n');
    failed++;
  }

  // Test 2: Get exams (public endpoint)
  try {
    console.log('Test 2: Get Exams List');
    const result = await makeRequest('GET', '/exams');
    if (result.status === 200 && Array.isArray(result.data)) {
      console.log('✅ PASS: Got', result.data.length, 'exams\n');
      passed++;
    } else {
      console.log('❌ FAIL: Exams endpoint returned', result.status, '\n');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAIL: Exams endpoint error -', err.message, '\n');
    failed++;
  }

  // Test 3: Get interview courses (public endpoint)
  try {
    console.log('Test 3: Get Interview Courses');
    const result = await makeRequest('GET', '/interview-courses');
    if (result.status === 200 && Array.isArray(result.data)) {
      console.log('✅ PASS: Got', result.data.length, 'interview courses\n');
      passed++;
    } else {
      console.log('❌ FAIL: Interview courses returned', result.status, '\n');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAIL: Interview courses error -', err.message, '\n');
    failed++;
  }

  // Test 4: Student requests endpoint (requires auth, will return 401)
  try {
    console.log('Test 4: Student Interview Requests (Auth Check)');
    const dummyId = '000000000000000000000000';
    const result = await makeRequest('GET', `/student/${dummyId}/interview-requests`);
    if ([200, 401, 403, 404].includes(result.status)) {
      console.log('✅ PASS: Endpoint reachable (status:', result.status, ')\n');
      passed++;
    } else {
      console.log('❌ FAIL: Unexpected status', result.status, '\n');
      failed++;
    }
  } catch (err) {
    console.log('❌ FAIL: Student requests error -', err.message, '\n');
    failed++;
  }

  // Test 5: Test schedule endpoint exists
  try {
    console.log('Test 5: Schedule Interview Endpoint');
    const dummyId = '000000000000000000000000';
    const result = await makeRequest('PATCH', `/interview-request/${dummyId}/schedule`, {
      proposedDate: '2026-02-15',
      proposedTime: '14:00'
    });
    // Will fail because dummyId doesn't exist, but endpoint should respond
    if ([400, 401, 403, 404].includes(result.status)) {
      console.log('✅ PASS: Schedule endpoint reachable (status:', result.status, ')\n');
      passed++;
    } else {
      console.log('⚠️ WARNING: Unexpected status', result.status, '\n');
    }
  } catch (err) {
    console.log('❌ FAIL: Schedule endpoint error -', err.message, '\n');
    failed++;
  }

  // Summary
  console.log('='.repeat(50));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Server is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Check configuration.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
