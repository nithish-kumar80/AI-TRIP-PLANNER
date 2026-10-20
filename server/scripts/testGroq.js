require('dotenv').config();
const Groq = require('groq-sdk');

(async () => {
  const key = process.env.GROQ_API_KEY;
  console.log('Groq key:', key ? key.substring(0, 10) + '...' : 'NOT SET');

  if (!key || key === 'your_groq_api_key_here') {
    console.log('❌ GROQ_API_KEY not set in .env'); process.exit(1);
  }

  try {
    console.log('Testing Groq llama-3.3-70b...');
    const groq = new Groq({ apiKey: key });
    const result = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Say exactly: "VoyageAI is working with Groq!"' }],
      max_tokens: 50,
    });
    const text = result.choices[0]?.message?.content;
    console.log('✅ GROQ WORKS! Response:', text);
    console.log('\n🚀 AI is fully operational! Go generate a trip at http://localhost:3000/plan');
  } catch (e) {
    console.log('❌ Groq error:', e.message);
  }
})();
