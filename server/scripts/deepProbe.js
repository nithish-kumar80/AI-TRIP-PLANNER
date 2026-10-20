require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

// Try both v1 and v1beta with both models
const combos = [
  { version: 'v1', model: 'gemini-2.0-flash' },
  { version: 'v1', model: 'gemini-2.0-flash-lite' },
  { version: 'v1', model: 'gemini-1.5-flash' },
  { version: 'v1', model: 'gemini-1.5-flash-latest' },
  { version: 'v1beta', model: 'gemini-2.0-flash' },
  { version: 'v1beta', model: 'gemini-2.0-flash-lite' },
  { version: 'v1beta', model: 'gemini-2.0-flash-exp' },
  { version: 'v1beta', model: 'gemini-exp-1206' },
  { version: 'v1beta', model: 'gemini-2.0-flash-thinking-exp-01-21' },
];

function testCombo({ version, model }) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] });
    const path = `/${version}/models/${model}:generateContent?key=${apiKey}`;
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com', path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        let status;
        if (res.statusCode === 200) status = '✅ WORKS';
        else if (res.statusCode === 429) {
          try {
            const j = JSON.parse(d);
            const retryIn = j.error?.details?.find(x => x.retryDelay)?.retryDelay || '?';
            status = `⚠️  QUOTA (retry in ${retryIn})`;
          } catch { status = '⚠️  QUOTA'; }
        }
        else if (res.statusCode === 404) status = '❌ 404';
        else if (res.statusCode === 403) status = '🔒 403 FORBIDDEN';
        else status = `❓ ${res.statusCode}`;
        resolve({ label: `${version}/${model}`, status });
      });
    });
    req.on('error', () => resolve({ label: `${version}/${model}`, status: '❌ ERR' }));
    req.write(body); req.end();
  });
}

(async () => {
  console.log('🔍 Scanning all model/version combos...\n');
  for (const combo of combos) {
    const r = await testCombo(combo);
    console.log(`  ${r.status.padEnd(35)} ${r.label}`);
    await new Promise(res => setTimeout(res, 300));
  }
  console.log('\nDone. Models showing ✅ WORKS or ⚠️ QUOTA are valid for your key.');
})();
