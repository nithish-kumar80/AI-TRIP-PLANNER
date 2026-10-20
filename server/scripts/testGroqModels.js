require('dotenv').config();
const Groq = require('groq-sdk');

const CANDIDATES = [
  'groq/compound',
  'groq/compound-mini',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'llama-3.1-8b-instant',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
  'gemma-7b-it',
];

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  console.log('Testing chat-capable models for JSON output...\n');

  for (const model of CANDIDATES) {
    try {
      process.stdout.write(`  ${model.padEnd(35)} → `);
      const r = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Return JSON: {"status":"ok"}' }],
        max_tokens: 20,
      });
      const text = r.choices[0]?.message?.content || '';
      console.log(`✅ WORKS → "${text.trim().substring(0, 40)}"`);
    } catch (e) {
      const short = e.message?.substring(0, 70) || '';
      if (short.includes('404')) console.log('❌ 404 not found');
      else if (short.includes('429')) console.log('⚠️  quota');
      else console.log(`❌ ${short}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }
})();
