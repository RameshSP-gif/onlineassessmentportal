const axios = require('axios');

(async () => {
  try {
    const login = await axios.post('http://localhost:3002/api/auth/login', { username: 'hr1', password: 'hr123' });
    const token = login.data.token;
    console.log('login ok as hr1');
    const headers = { Authorization: 'Bearer ' + token };

    const approved = await axios.get('http://localhost:3002/api/hr/interview-requests?status=approved', { headers });
    console.log('approved count:', approved.data.length);

    const pending = await axios.get('http://localhost:3002/api/hr/interview-requests?status=pending', { headers });
    console.log('pending count:', pending.data.length);

    const scheduled = await axios.get('http://localhost:3002/api/hr/interview-requests?status=scheduled', { headers });
    console.log('scheduled count:', scheduled.data.length);

    const payments = await axios.get('http://localhost:3002/api/hr/interview-payments/pending', { headers });
    console.log('interview payments pending:', payments.data.length);
  } catch (e) {
    console.error('error', e.response?.status, e.response?.data || e.message);
    process.exit(1);
  }
})();
