require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === 'your_gemini_api_key_here') {
  console.log('❌ GEMINI_API_KEY not set'); process.exit(1);
}

// Try multiple model names to find what works
const modelsToTest = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash-002',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-pro',
];

function testModel(modelName) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: 'Hi' }] }],
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode === 200) resolve({ model: modelName, status: '✅ WORKS' });
        else if (res.statusCode === 429) resolve({ model: modelName, status: '⚠️  QUOTA LIMIT (model exists!)' });
        else if (res.statusCode === 403) resolve({ model: modelName, status: '🔒 FORBIDDEN (check billing)' });
        else {
          try {
            const j = JSON.parse(d);
            resolve({ model: modelName, status: `❌ ${res.statusCode} - ${j.error?.message?.substring(0,60)}` });
          } catch {
            resolve({ model: modelName, status: `❌ ${res.statusCode}` });
          }
        }
      });
    });
    req.on('error', () => resolve({ model: modelName, status: '❌ Network error' }));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('🔍 Probing available Gemini models for your API key...\n');
  for (const m of modelsToTest) {
    const r = await testModel(m);
    console.log(`  ${r.status.padEnd(40)} → ${r.model}`);
    await new Promise(r => setTimeout(r, 500)); // small delay between requests
  }
  console.log('\n✅ Use any model marked WORKS or QUOTA LIMIT (quota limit = valid model)');
  process.exit(0);
})();
