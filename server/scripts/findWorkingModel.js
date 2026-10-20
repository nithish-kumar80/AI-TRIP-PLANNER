require('dotenv').config();
const Groq = require('groq-sdk');
const { buildItineraryPrompt } = require('../services/ai/prompts/itinerary');

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = buildItineraryPrompt({
    destination: 'Paris', budget: 50000, travelers: 2, duration: 3,
    interests: ['Culture', 'Food'], transportationMode: 'flight', currency: 'INR',
  });

  console.log('Prompt length (chars):', prompt.length, '\n');

  const models = [
    'groq/compound',
    'groq/compound-mini',
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b',
    'qwen/qwen3.6-27b',
  ];

  for (const model of models) {
    try {
      process.stdout.write(`${model.padEnd(25)} → `);
      const r = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 8192,
        temperature: 0.7,
      });
      const text = r.choices[0]?.message?.content || '';
      const hasBrace = text.includes('{');
      // Quick JSON test
      let valid = false;
      try {
        const s = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
        JSON.parse(s); valid = true;
      } catch {}
      console.log(`✅ chars:${text.length} | json:${valid ? 'valid' : 'invalid'} | preview:"${text.substring(0, 60).replace(/\n/g, ' ')}"`);
    } catch (e) {
      const msg = e.message?.substring(0, 100) || '';
      if (msg.includes('413')) console.log('❌ 413 prompt too large');
      else if (msg.includes('404')) console.log('❌ 404 not found');
      else if (msg.includes('400')) console.log('❌ 400: ' + msg.substring(0, 60));
      else console.log('❌ ' + msg.substring(0, 80));
    }
    await new Promise(r => setTimeout(r, 800));
  }
})();
