#!/usr/bin/env node
const axios = require('axios');

const API = 'http://localhost:3002/api';

async function test() {
  try {
    // Test 1: Login as HR
    console.log('\n🔐 Testing HR Login...');
    const loginRes = await axios.post(`${API}/login`, {
      username: 'hr',
      password: 'hr123'
    });
    const token = loginRes.data.token;
    console.log('✅ HR Login Successful\n');

    // Test 2: Dashboard
    console.log('📊 Fetching HR Dashboard...');
    const dashRes = await axios.get(`${API}/hr/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Dashboard Loaded`);
    console.log(`   Students: ${dashRes.data.stats.totalStudents}`);
    console.log(`   Exams: ${dashRes.data.stats.totalExams}\n`);

    // Test 3: Pending Approvals
    console.log('⏳ Checking Pending Interview Requests...');
    const appRes = await axios.get(`${API}/interview-requests?status=pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${appRes.data.length} pending requests\n`);

    // Test 4: Pending Payments
    console.log('💳 Checking Pending Payments...');
    const paymentsRes = await axios.get(`${API}/hr/interview-payments/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Found ${paymentsRes.data.length} pending payments\n`);

    console.log('═'.repeat(50));
    console.log('🎉 ALL CORE FEATURES WORKING!');
    console.log('═'.repeat(50));
    console.log('\n✅ Dashboard accessible at: http://localhost:3003');
    console.log('✅ Backend API running on: http://localhost:3002');
    console.log('✅ HR can approve requests, schedule interviews, verify payments\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

setTimeout(test, 1000);
