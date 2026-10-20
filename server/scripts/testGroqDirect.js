require('dotenv').config();
const Groq = require('groq-sdk');

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const prompt = 'Return ONLY this JSON, no other text: {"title":"Test Trip","status":"working"}';

  for (const model of ['groq/compound', 'groq/compound-mini']) {
    try {
      process.stdout.write(`Testing ${model}... `);
      const r = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 32768,
        temperature: 0.7,
      });
      const text = r.choices[0]?.message?.content || '';
      console.log(`✅ WORKS | finish:${r.choices[0]?.finish_reason} | "${text.substring(0, 60)}"`);
    } catch (e) {
      console.log(`❌ ERROR: ${e.message?.substring(0, 150)}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }
})();
