require('dotenv').config();
const Groq = require('groq-sdk');
const { buildItineraryPrompt } = require('../services/ai/prompts/itinerary');

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = buildItineraryPrompt({
    destination: 'Goa', budget: 30000, travelers: 2, duration: 3,
    interests: ['Beach', 'Food'], transportationMode: 'flight', currency: 'INR',
  });

  const result = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 8192,
  });

  const text = result.choices[0]?.message?.content || '';
  console.log('=== RAW RESPONSE (first 500 chars) ===');
  console.log(text.substring(0, 500));
  console.log('\n=== LAST 100 chars ===');
  console.log(text.substring(text.length - 100));
})();
