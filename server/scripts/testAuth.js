require('dotenv').config();
const http = require('http');

function post(path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(d) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  const email = `authtest_${Date.now()}@voyage.com`;
  const password = 'Test@1234';

  console.log('--- Testing REGISTER ---');
  const reg = await post('/api/auth/register', { name: 'Auth Tester', email, password });
  console.log('Status:', reg.status);
  console.log('Success:', reg.body.success);
  console.log('Has accessToken:', !!reg.body.data?.accessToken);
  console.log('User name:', reg.body.data?.user?.name);
  console.log('isVerified:', reg.body.data?.user?.isVerified);

  console.log('\n--- Testing LOGIN ---');
  const login = await post('/api/auth/login', { email, password });
  console.log('Status:', login.status);
  console.log('Success:', login.body.success);
  console.log('Has accessToken:', !!login.body.data?.accessToken);
  console.log('User name:', login.body.data?.user?.name);
  if (!login.body.success) console.log('Error:', login.body.message);
})();
