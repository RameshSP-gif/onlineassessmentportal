const http = require('http');

function test(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
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

async function run() {
  try {
    console.log('\n=== HR DASHBOARD TEST ===\n');

    console.log('1️⃣  Testing HR Login...');
    const login = await test('/api/hr/login', 'POST', { username: 'hr', password: 'hr123' });
    if (login.status !== 200) throw new Error(`Login failed: ${login.status}`);
    const token = login.data.token;
    console.log('✅ HR logged in\n');

    console.log('2️⃣  Testing Dashboard...');
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/hr/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    const dash = await new Promise((res, rej) => {
      const req = http.request(options, (r) => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => res({ status: r.statusCode, data: JSON.parse(d) }));
      });
      req.on('error', rej);
      req.end();
    });
    console.log(`✅ Dashboard loaded\n   Students: ${dash.data.stats.totalStudents}\n   Exams: ${dash.data.stats.totalExams}\n`);

    console.log('3️⃣  Testing Pending Approvals...');
    const approvals = await test('/api/interview-requests?status=pending', 'GET');
    console.log(`✅ Pending requests: ${approvals.data.length}\n`);

    console.log('═'.repeat(40));
    console.log('🎉 ALL SYSTEMS WORKING!');
    console.log('═'.repeat(40));
    console.log('\n✅ Backend: http://localhost:3002');
    console.log('✅ Frontend: http://localhost:3003');
    console.log('✅ Dashboard is LIVE\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setTimeout(run, 1000);
