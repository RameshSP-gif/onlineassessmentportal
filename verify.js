const http = require('http');

console.log('\n🚀 QUICK VERIFICATION TEST\n');

// Test Backend
const backendTest = new Promise((resolve) => {
  const req = http.get('http://localhost:3002/api/health', (res) => {
    resolve(res.statusCode === 200 ? '✅ Backend (3002)' : '❌ Backend');
  });
  req.on('error', () => resolve('❌ Backend'));
  setTimeout(() => resolve('⏱️ Backend timeout'), 3000);
});

// Test Frontend  
const frontendTest = new Promise((resolve) => {
  const req = http.get('http://localhost:3003', (res) => {
    resolve(res.statusCode === 200 ? '✅ Frontend (3003)' : '❌ Frontend');
  });
  req.on('error', () => resolve('❌ Frontend'));
  setTimeout(() => resolve('⏱️ Frontend timeout'), 3000);
});

Promise.all([backendTest, frontendTest]).then(results => {
  console.log(results.join('\n'));
  console.log('\n📊 Access Dashboard: http://localhost:3003/hr/dashboard');
  console.log('\n🔐 Login: hr / hr123\n');
  process.exit(0);
});
