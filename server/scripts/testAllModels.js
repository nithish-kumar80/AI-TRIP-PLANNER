require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-pro'];
const body = JSON.stringify({ contents: [{ parts: [{ text: 'Reply with exactly: VoyageAI works!' }] }] });

function test(model) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/' + model + ':generateContent?key=' + apiKey,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (res.statusCode === 200) {
            const txt = j.candidates?.[0]?.content?.parts?.[0]?.text || '(no text)';
            resolve('✅ WORKS → "' + txt.trim().substring(0, 50) + '"');
          } else if (res.statusCode === 429) {
            const match = d.match(/"retryDelay":"(\d+)s"/);
            const retry = match ? match[1] : '?';
            resolve('⚠️  QUOTA HIT (retry in ' + retry + 's)');
          } else if (res.statusCode === 404) {
            resolve('❌ 404 - model not found');
          } else {
            resolve('❓ HTTP ' + res.statusCode);
          }
        } catch (e) {
          resolve('❌ parse error: ' + e.message);
        }
      });
    });
    req.on('error', (e) => resolve('❌ network: ' + e.message));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log('🔍 Testing all available models with your new key...\n');
  console.log('Key:', apiKey.substring(0, 12) + '...');
  console.log('');

  let anyWorking = false;
  for (const m of models) {
    process.stdout.write('  ' + m.padEnd(28) + ' → ');
    const result = await test(m);
    console.log(result);
    if (result.startsWith('✅')) anyWorking = true;
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log('');
  if (anyWorking) {
    console.log('🚀 AI is READY! Go try generating a trip at http://localhost:3000/plan');
  } else {
    console.log('⚠️  All models on quota. Free tier limit: 10-30 req/min shared per account.');
    console.log('   Try using a DIFFERENT Google account at https://aistudio.google.com/apikey');
  }
})();
