const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

const testUsers = [
  { username: 'admin1', password: 'admin123', role: 'Admin' },
  { username: 'admin2', password: 'admin123', role: 'Admin' },
  { username: 'hr1', password: 'hr123', role: 'HR' },
  { username: 'hr2', password: 'hr123', role: 'HR' },
  { username: 'interviewer1', password: 'int123', role: 'Interviewer' },
  { username: 'interviewer2', password: 'int123', role: 'Interviewer' },
  { username: 'student1', password: 'student123', role: 'Student' },
  { username: 'student2', password: 'student123', role: 'Student' }
];

async function testLogin() {
  console.log('\n🧪 TESTING LOGIN FOR ALL USERS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let successCount = 0;
  let failCount = 0;

  for (const user of testUsers) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: user.username,
        password: user.password
      });

      if (response.data.token) {
        console.log(`✅ ${user.role.padEnd(12)} | ${user.username.padEnd(18)} | Login SUCCESS`);
        successCount++;
      } else {
        console.log(`❌ ${user.role.padEnd(12)} | ${user.username.padEnd(18)} | No token returned`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${user.role.padEnd(12)} | ${user.username.padEnd(18)} | ${error.response?.data?.error || error.message}`);
      failCount++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`📊 TEST RESULTS: ${successCount} Success, ${failCount} Failed`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (successCount === testUsers.length) {
    console.log('🎉 ALL USERS CAN LOGIN SUCCESSFULLY!\n');
  } else {
    console.log('⚠️  Some users failed to login. Check credentials.\n');
  }
}

testLogin();
