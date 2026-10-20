require('dotenv').config();
const Groq = require('groq-sdk');
const { buildItineraryPrompt } = require('../services/ai/prompts/itinerary');

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = buildItineraryPrompt({
    destination: 'Paris', budget: 50000, travelers: 2, duration: 3,
    interests: ['Culture'], transportationMode: 'flight', currency: 'INR',
  });

  const r = await groq.chat.completions.create({
    model: 'groq/compound-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 8192,
    temperature: 0.7,
  });

  const text = r.choices[0]?.message?.content || '';
  const finishReason = r.choices[0]?.finish_reason;
  console.log('Finish reason:', finishReason);
  console.log('Total chars:', text.length);

  // Find JSON block
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  console.log('First { at:', firstBrace, '| Last } at:', lastBrace);

  if (firstBrace === -1) {
    console.log('\n❌ NO JSON FOUND. Full response:');
    console.log(text);
    return;
  }

  const extracted = text.slice(firstBrace, lastBrace > firstBrace ? lastBrace + 1 : text.length);
  console.log('Extracted JSON chars:', extracted.length);

  try {
    JSON.parse(extracted);
    console.log('✅ JSON VALID!');
  } catch (e) {
    console.log('❌ JSON INVALID:', e.message);
    // Find error position
    const posMatch = e.message.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      console.log('\nContext around error (pos', pos, '):');
      console.log('...', JSON.stringify(extracted.substring(Math.max(0, pos - 50), pos + 50)), '...');
    }
    console.log('\nLast 200 chars of extracted:');
    console.log(extracted.slice(-200));
  }

  // Show if there's text before/after JSON
  if (firstBrace > 0) {
    console.log('\nText BEFORE JSON:', JSON.stringify(text.substring(0, firstBrace)));
  }
  if (lastBrace < text.length - 5) {
    console.log('\nText AFTER JSON:', JSON.stringify(text.substring(lastBrace + 1)));
  }
})();
