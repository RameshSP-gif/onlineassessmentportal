const axios = require('axios');

async function main() {
  const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3002';
  const log = (...args) => console.log('•', ...args);

  try {
    // Health: courses
    const coursesRes = await axios.get(`${BASE_URL}/api/interview-courses`);
    log('Courses:', coursesRes.data.length);

    // Login student
    const studentLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'student1',
      password: 'student123'
    });
    const studentToken = studentLogin.data.token;
    const studentHeaders = { headers: { Authorization: `Bearer ${studentToken}` } };
    log('Student login ok');

    // Create request (if courses exist)
    let createdId = null;
    if (coursesRes.data.length) {
      const c = coursesRes.data[0];
      const reqRes = await axios.post(`${BASE_URL}/api/interview-requests`, {
        courseId: c.id,
        proposedDate: '2026-02-20',
        proposedTime: '11:00',
        notes: 'API test request'
      }, studentHeaders);
      createdId = reqRes.data.id;
      log('Created request:', createdId);
    }

    // Login admin
    const adminLogin = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin1',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };
    log('Admin login ok');

    // List pending
    const pend = await axios.get(`${BASE_URL}/api/interview-requests?status=pending`, adminHeaders);
    log('Pending count:', pend.data.length);

    const target = createdId || (pend.data[0] && pend.data[0].id);
    if (!target) {
      console.log('No pending requests to approve.');
      return;
    }

    // Approve
    const approve = await axios.patch(`${BASE_URL}/api/interview-requests/${target}/approve`, {
      scheduledDate: '2026-01-30',
      scheduledTime: '14:30'
    }, adminHeaders);
    log('Approved:', approve.data.id, approve.data.status || 'approved');

    // Verify student sees approved
    const studentReqs = await axios.get(`${BASE_URL}/api/interview-requests/student/${studentLogin.data.user.id}`, studentHeaders);
    const approvedOne = studentReqs.data.find(r => (r.id === target) || (r._id && r._id === target));
    log('Student requests total:', studentReqs.data.length);
    if (approvedOne) {
      log('Status after approve:', approvedOne.status);
    } else {
      log('Approved request not in student view (may belong to another student).');
    }

    // Reject again (to test both paths) – only if belongs to admin list
    const reject = await axios.patch(`${BASE_URL}/api/interview-requests/${target}/reject`, {
      rejectionReason: 'Scheduling conflict'
    }, adminHeaders);
    log('Rejected:', reject.data.id, reject.data.status || 'rejected');

    console.log('\nOK: Backend video interview APIs passed basic flow.');
  } catch (err) {
    const data = err.response?.data;
    console.error('ERROR:', data || err.message);
    process.exitCode = 1;
  }
}

main();
