require('dotenv').config();
const Groq = require('groq-sdk');
const { buildItineraryPrompt } = require('../services/ai/prompts/itinerary');

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = buildItineraryPrompt({
    destination: 'Paris', budget: 50000, travelers: 2, duration: 3,
    interests: ['Culture', 'Food'], transportationMode: 'flight', currency: 'INR',
  });

  console.log('=== PROMPT LAST 200 chars ===');
  console.log(prompt.slice(-200));
  console.log('\n=== CALLING groq/compound ===');

  try {
    const r = await groq.chat.completions.create({
      model: 'groq/compound',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8192,
      temperature: 0.7,
    });

    const text = r.choices[0]?.message?.content || '';
    console.log('Finish reason:', r.choices[0]?.finish_reason);
    console.log('Total chars:', text.length);
    console.log('\n=== FIRST 600 chars ===');
    console.log(text.substring(0, 600));
    console.log('\n=== LAST 300 chars ===');
    console.log(text.substring(text.length - 300));

    // Try parsing
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extracted = text.slice(firstBrace, lastBrace + 1);
      try {
        JSON.parse(extracted);
        console.log('\n✅ JSON parsed successfully!');
      } catch (e) {
        console.log('\n❌ JSON parse failed:', e.message.substring(0, 100));
        // Find where it fails
        console.log('JSON length:', extracted.length);
        console.log('Chars around error position...');
      }
    } else {
      console.log('\n❌ No JSON braces found at all!');
      console.log('Full response:');
      console.log(text);
    }
  } catch (e) {
    console.log('Groq API error:', e.message?.substring(0, 300));
  }
})();
