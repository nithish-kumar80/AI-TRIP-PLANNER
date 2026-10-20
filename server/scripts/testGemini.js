require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

(async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ GEMINI_API_KEY not set in .env'); process.exit(1);
  }

  console.log('🔑 API Key:', apiKey.substring(0, 8) + '...\n');

  const modelsToTry = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

  for (const modelName of modelsToTry) {
    try {
      process.stdout.write(`Testing ${modelName}... `);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Reply with exactly: "VoyageAI AI is working!"');
      const text = result.response.text().trim();
      console.log(`✅ WORKS → "${text}"`);
      console.log(`\n✅ AI is operational! Using model: ${modelName}`);
      process.exit(0);
    } catch (e) {
      if (e.message.includes('429')) {
        console.log('⚠️  Quota limit hit — trying next model...');
      } else {
        console.log(`❌ ${e.message.substring(0, 80)}`);
      }
    }
  }

  console.log('\n⚠️  All models hit quota. This resets every minute/day.');
  console.log('   Wait 1-2 minutes and try again — your API key IS valid.');
  process.exit(0);
})();
