require('dotenv').config();
const Groq = require('groq-sdk');

(async () => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  console.log('Fetching available Groq models...\n');
  try {
    const list = await groq.models.list();
    const models = list.data
      .filter(m => m.active !== false)
      .sort((a, b) => (b.context_window || 0) - (a.context_window || 0));

    console.log('Available models:');
    models.forEach(m => {
      console.log(`  ${m.id.padEnd(45)} ctx:${(m.context_window||'?')}`);
    });

    // Test the top candidates
    const candidates = models
      .filter(m => m.id.includes('llama') || m.id.includes('mixtral') || m.id.includes('gemma'))
      .slice(0, 5)
      .map(m => m.id);

    console.log('\nTesting top candidates...\n');
    for (const modelId of candidates) {
      try {
        process.stdout.write(`  ${modelId.padEnd(45)} → `);
        const r = await groq.chat.completions.create({
          model: modelId,
          messages: [{ role: 'user', content: 'Say OK' }],
          max_tokens: 5,
        });
        console.log('✅ WORKS');
      } catch (e) {
        console.log(`❌ ${e.message?.substring(0, 60)}`);
      }
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (e) {
    console.log('Error listing models:', e.message);
  }
})();
