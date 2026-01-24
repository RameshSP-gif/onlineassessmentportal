const http = require('http');

function apiRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const isFullUrl = path.startsWith('http');
    const url = isFullUrl ? new URL(path) : new URL('http://localhost:3002' + path);
    
    console.log(`Request: ${method} ${url.href}`);
    console.log(`Path: ${url.pathname}`);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`Options:`, options);

    const req = http.request(options, (res) => {
      let body = '';
      console.log(`Status: ${res.statusCode}`);
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body: body, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  try {
    console.log('\nTesting health endpoint...\n');
    const response = await apiRequest('GET', '/health');
    console.log(`Response Status: ${response.status}`);
    console.log(`Response Body:`, response.body);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
