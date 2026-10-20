require('dotenv').config();
const Groq = require('groq-sdk');
const { buildItineraryPrompt } = require('../services/ai/prompts/itinerary');

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = buildItineraryPrompt({
    destination: 'italy,switzerland,rome',
    budget: 500000, travelers: 1, duration: 30,
    interests: ['Culture', 'Food'], transportationMode: 'mixed', currency: 'INR',
  });

  console.log('Prompt length (chars):', prompt.length);

  // Test 1: WITH response_format
  console.log('\n--- Test 1: WITH json_object response_format ---');
  try {
    const r1 = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
      response_format: { type: 'json_object' },
    });
    const t1 = r1.choices[0]?.message?.content || '';
    console.log('Finish reason:', r1.choices[0]?.finish_reason);
    console.log('Response length:', t1.length);
    console.log('First 300 chars:', t1.substring(0, 300));
    console.log('Last 100 chars:', t1.substring(t1.length - 100));
    try { JSON.parse(t1); console.log('✅ Valid JSON'); } catch { console.log('❌ Invalid JSON'); }
  } catch (e) {
    console.log('ERROR:', e.message?.substring(0, 200));
  }

  // Test 2: WITHOUT response_format
  console.log('\n--- Test 2: WITHOUT response_format ---');
  try {
    const r2 = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
    });
    const t2 = r2.choices[0]?.message?.content || '';
    console.log('Finish reason:', r2.choices[0]?.finish_reason);
    console.log('Response length:', t2.length);
    console.log('First 300 chars:', t2.substring(0, 300));
    console.log('Last 100 chars:', t2.substring(t2.length - 100));
    try { 
      const firstBrace = t2.indexOf('{');
      const lastBrace = t2.lastIndexOf('}');
      const extracted = t2.slice(firstBrace, lastBrace + 1);
      JSON.parse(extracted); 
      console.log('✅ Valid JSON (extracted)'); 
    } catch { console.log('❌ Invalid JSON'); }
  } catch (e) {
    console.log('ERROR:', e.message?.substring(0, 200));
  }
})();
