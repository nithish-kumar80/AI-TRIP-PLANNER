/**
 * intentExtractor.js
 * Phase 4 — Gemini Intent Extraction
 *
 * CONCEPT: Structured Output from LLMs
 * When a user types: "Plan me a peaceful 5-day trip to Paris with good food"
 * we need structured data the backend can validate and use:
 * {
 *   destination: "Paris",
 *   duration: 5,
 *   budget: 100000,
 *   preferences: ["peaceful", "food"]
 * }
 *
 * The LLM reads the text and outputs JSON.
 * We validate that JSON with a strict schema before using it.
 * The LLM is NOT allowed to invent itinerary facts here — only extract intent.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { jsonrepair } = require('jsonrepair');

// ─── Intent schema validation ─────────────────────────────────────────────────
const VALID_INTERESTS = [
  'nature', 'adventure', 'culture', 'food', 'relaxation',
  'nightlife', 'photography', 'historic', 'beaches', 'shopping',
  'peaceful', 'spiritual', 'wildlife', 'architecture',
];
const VALID_PACE = ['slow', 'moderate', 'fast'];
const VALID_TRANSPORT = ['flight', 'train', 'bus', 'car', 'mixed'];

function validateIntent(obj) {
  const errors = [];
  if (!obj.destination || typeof obj.destination !== 'string') errors.push('destination required');
  if (!obj.duration || obj.duration < 1 || obj.duration > 30) errors.push('duration must be 1–30 days');
  if (!obj.budget || obj.budget < 100) errors.push('budget required (in INR or USD)');
  if (!Array.isArray(obj.preferences) || obj.preferences.length === 0) errors.push('at least one preference required');
  return errors;
}

function normalizeIntent(raw) {
  return {
    destination: (raw.destination || '').trim(),
    city: (raw.city || raw.destination || '').trim(),
    country: (raw.country || '').trim(),
    duration: Math.min(Math.max(parseInt(raw.duration) || 5, 1), 30),
    budget: parseFloat(raw.budget) || 50000,
    currency: raw.currency || 'INR',
    travelers: parseInt(raw.travelers) || 1,
    preferences: (raw.preferences || []).filter(p => typeof p === 'string').map(p => p.toLowerCase()),
    travelStyle: raw.travelStyle || 'moderate',
    transportationMode: VALID_TRANSPORT.includes(raw.transportationMode) ? raw.transportationMode : 'mixed',
    pace: VALID_PACE.includes(raw.pace) ? raw.pace : 'moderate',
    startDate: raw.startDate || null,
    specialRequests: raw.specialRequests || '',
  };
}

// ─── Extraction prompt ────────────────────────────────────────────────────────
function buildExtractionPrompt(userInput) {
  return `You are a travel planning assistant. Extract structured travel intent from the user's request.
Return ONLY a valid JSON object with NO markdown, NO explanation.

User request: "${userInput}"

Extract and return this JSON structure:
{
  "destination": "<city or country name>",
  "city": "<specific city if mentioned>",
  "country": "<country>",
  "duration": <number of days, integer>,
  "budget": <total budget as number, in INR if currency unclear>,
  "currency": "<INR or USD or EUR>",
  "travelers": <number of travelers, default 1>,
  "preferences": ["<interest1>", "<interest2>"],
  "travelStyle": "<budget|comfort|luxury>",
  "transportationMode": "<flight|train|bus|car|mixed>",
  "pace": "<slow|moderate|fast>",
  "startDate": "<YYYY-MM-DD or null>",
  "specialRequests": "<any specific requests or empty string>"
}

Rules:
- preferences must come from: nature, adventure, culture, food, relaxation, nightlife, photography, historic, beaches, shopping, peaceful, spiritual, wildlife, architecture
- If budget is in lakhs (e.g., "1 lakh"), convert to number (100000)
- If no start date mentioned, set startDate to null
- If duration not mentioned, default to 5
- If budget not mentioned, default to 50000`;
}

// ─── LLM call with Gemini → Groq fallback ────────────────────────────────────
async function callLLM(prompt) {
  // Try Gemini first (only if key looks valid — real keys start with AIza)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.startsWith('AIza')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.warn('[Intent] Gemini failed:', e.message);
    }
  }
  // Fallback: Groq — use qwen/qwen3.8-27b (currently available model)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'your_groq_api_key_here') {
    try {
      const groq = new Groq({ apiKey: groqKey });
      // /no_think suppresses qwen's <think>...</think> reasoning blocks
      const resp = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt + '\n/no_think' }],
        temperature: 0.1,
        max_tokens: 512,
      });
      // Strip any residual <think>...</think> blocks just in case
      let content = resp.choices[0].message.content || '';
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      return content;
    } catch (e) {
      console.warn('[Intent] Groq failed:', e.message);
    }
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * extractIntent(userInput, formData)
 *
 * If userInput (natural language) provided → parse via LLM
 * If formData provided → validate and normalize directly
 * Returns normalized intent object.
 */
async function extractIntent(userInput, formData) {
  // Option B: Form data — normalize directly, no LLM needed
  if (formData && !userInput) {
    const normalized = normalizeIntent(formData);
    const errors = validateIntent(normalized);
    if (errors.length > 0) throw new Error(`Invalid trip data: ${errors.join(', ')}`);
    return normalized;
  }

  // Option A: Natural language → LLM extraction
  if (!userInput) throw new Error('No input provided');

  const prompt = buildExtractionPrompt(userInput);
  const raw = await callLLM(prompt);

  if (!raw) {
    // No LLM available — try basic regex parsing
    console.warn('[Intent] No LLM available — using regex fallback.');
    return parseWithRegex(userInput);
  }

  try {
    let text = raw.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(jsonrepair(text));
    const normalized = normalizeIntent(parsed);
    const errors = validateIntent(normalized);
    if (errors.length > 0) throw new Error(`LLM returned invalid intent: ${errors.join(', ')}`);
    return normalized;
  } catch (e) {
    throw new Error(`Intent extraction failed: ${e.message}`);
  }
}

// ─── Basic regex fallback (no LLM) ────────────────────────────────────────────
function parseWithRegex(text) {
  const lower = text.toLowerCase();
  const daysMatch = text.match(/(\d+)\s*(?:-|\s)?days?/i);
  const budgetMatch = text.match(/(?:budget|₹|rs\.?|inr)\s*([\d,]+)(?:\s*(?:lakh|k))?/i);
  let budget = 50000;
  if (budgetMatch) {
    budget = parseFloat(budgetMatch[1].replace(/,/g, ''));
    if (text.toLowerCase().includes('lakh')) budget *= 100000;
    else if (text.toLowerCase().includes('k')) budget *= 1000;
  }
  const prefs = VALID_INTERESTS.filter(p => lower.includes(p));
  // Try to extract destination (capitalized word not in stopwords)
  const stopWords = new Set(['plan','me','a','trip','to','from','days','budget','with','and','the','in']);
  const destMatch = text.match(/(?:to|in)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/i);
  const destination = destMatch ? destMatch[1].trim() : 'Unknown';
  return normalizeIntent({
    destination,
    city: destination,
    duration: daysMatch ? parseInt(daysMatch[1]) : 5,
    budget,
    preferences: prefs.length > 0 ? prefs : ['culture', 'food'],
  });
}

module.exports = { extractIntent };
