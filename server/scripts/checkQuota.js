require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Quick quota checker ──────────────────────────────────────────────────────
// Run this any time to check if AI is ready: node scripts/checkQuota.js
(async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ No API key in .env');
    process.exit(1);
  }

  const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const name of models) {
    try {
      process.stdout.write(`  ${name.padEnd(28)} → `);
      const m = genAI.getGenerativeModel({ model: name });
      await m.generateContent('Say OK');
      console.log('✅ READY');
    } catch (e) {
      if (e.message.includes('429')) console.log('⚠️  QUOTA HIT (try again later)');
      else if (e.message.includes('404')) console.log('❌ Model not available for this key');
      else console.log('❌ ' + e.message.substring(0, 60));
    }
  }
})();
