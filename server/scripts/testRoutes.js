require('dotenv').config();
const http = require('http');

function post(path, body, token) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 5000, path, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: (() => { try { return JSON.parse(d); } catch { return d; } })() }));
    });
    req.on('error', e => resolve({ status: 0, body: e.message }));
    req.write(data); req.end();
  });
}

(async () => {
  // Step 1: Login to get a token
  console.log('Step 1: Login...');
  const login = await post('/api/auth/login', { email: 'test@voyage.com', password: 'Test@1234' });
  if (!login.body?.data?.accessToken) {
    console.log('❌ Login failed:', login.body?.message || JSON.stringify(login.body));
    // Try any existing user
    const login2 = await post('/api/auth/register', {
      name: 'Route Tester', email: `rt_${Date.now()}@test.com`, password: 'Test@1234'
    });
    if (!login2.body?.data?.accessToken) {
      console.log('❌ Could not get a token. Is the server running?');
      process.exit(1);
    }
    var token = login2.body.data.accessToken;
  } else {
    var token = login.body.data.accessToken;
  }
  console.log('✅ Got token:', token.substring(0, 20) + '...');

  // Step 2: Hit /api/ai/plan — check if route EXISTS (200 or 500=quota, NOT 404)
  console.log('\nStep 2: POST /api/ai/plan...');
  const plan = await post('/api/ai/plan', {
    destination: 'Paris', budget: 50000, travelers: 2, duration: 3, currency: 'INR'
  }, token);
  
  console.log('Status:', plan.status);
  if (plan.status === 404) {
    console.log('❌ ROUTE NOT FOUND — route wiring is broken');
  } else if (plan.status === 500 && plan.body?.message?.includes('quota')) {
    console.log('✅ Route found! AI quota exhausted (expected — resets overnight)');
    console.log('   Message:', plan.body.message);
  } else if (plan.status === 200) {
    console.log('✅ Route works AND AI responded!');
    console.log('   Title:', plan.body.data?.itinerary?.title);
  } else {
    console.log('Response:', JSON.stringify(plan.body, null, 2).substring(0, 300));
  }
})();
