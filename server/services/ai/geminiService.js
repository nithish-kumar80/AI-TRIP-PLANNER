const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { jsonrepair } = require('jsonrepair');
const { buildItineraryPrompt } = require('./prompts/itinerary');
const { buildHotelRecommendPrompt } = require('./prompts/hotelRecommend');
const { buildBudgetPrompt } = require('./prompts/budget');
const { buildPackingPrompt } = require('./prompts/packing');
const { buildChatPrompt } = require('./prompts/chat');

// ─── Provider priority ────────────────────────────────────────────────────────
// 1. Gemini 2.0 Flash Lite  (fast, free)
// 2. Gemini 2.0 Flash       (more capable, free)
// 3. Groq groq/compound     (free, no credit card — get key at console.groq.com)
// 4. Groq groq/compound-mini (lighter fallback)
// ─────────────────────────────────────────────────────────────────────────────

let genAI = null;
let groqClient = null;

const getGenAI = () => {
  const key = process.env.GEMINI_API_KEY;
  // Real Gemini API keys always start with 'AIza'
  if (!key || key === 'your_gemini_api_key_here' || !key.startsWith('AIza')) return null;
  if (!genAI) genAI = new GoogleGenerativeAI(key);
  return genAI;
};

const getGroq = () => {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === 'your_groq_api_key_here') return null;
  if (!groqClient) groqClient = new Groq({ apiKey: key });
  return groqClient;
};

// ─── Detect error types ───────────────────────────────────────────────────────
const isQuotaError  = (msg) => msg?.includes('429') || msg?.includes('quota') || msg?.includes('RESOURCE_EXHAUSTED');
const isDailyQuota  = (msg) => msg?.includes('PerDay') || msg?.includes('per_day');
const is404         = (msg) => msg?.includes('404') || msg?.includes('not found');

// ─── JSON parser (bulletproof — uses jsonrepair for all edge cases) ───────────
const parseJSONResponse = (text) => {
  if (!text) throw new Error('AI returned an empty response. Please try again.');

  let cleaned = text.trim();

  // 1. Strip markdown code fences
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();

  // 2. Direct parse (fast path for well-formed responses)
  try { return JSON.parse(cleaned); } catch {}

  // 3. Find JSON start (skip any preamble text)
  const firstBrace    = cleaned.indexOf('{');
  const firstBracket  = cleaned.indexOf('[');
  const startPos = (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket))
    ? firstBrace : firstBracket;

  if (startPos !== -1) {
    const jsonText = cleaned.slice(startPos);

    // 3a. Try parsing what we extracted directly
    try { return JSON.parse(jsonText); } catch {}

    // 3b. Use jsonrepair — handles truncation, trailing commas, smart quotes, etc.
    try {
      const repaired = jsonrepair(jsonText);
      const parsed = JSON.parse(repaired);
      console.warn('[AI] ⚠️ JSON repaired by jsonrepair (model output was malformed/truncated)');
      return parsed;
    } catch {}
  }

  console.error('[AI] Could not parse response (first 300):\n', text.substring(0, 300));
  throw new Error('AI returned an unexpected format. Please try again.');
};


// ─── Repair truncated JSON by closing open structures ─────────────────────────
const repairTruncatedJSON = (partial) => {
  try {
    // Find the last valid JSON position by truncating at last complete value
    // Walk back from end to find last complete key-value pair
    let s = partial;

    // Remove trailing incomplete property/value (everything after the last comma or closing bracket)
    s = s.replace(/,\s*$/, '');           // trailing comma
    s = s.replace(/,\s*"[^"]*"\s*:\s*$/, '');  // trailing key without value
    s = s.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '');  // trailing unclosed string value

    // Count open braces and brackets
    let braces = 0, brackets = 0;
    let inString = false, escape = false;
    for (const ch of s) {
      if (escape) { escape = false; continue; }
      if (ch === '\\' && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') braces++;
      else if (ch === '}') braces--;
      else if (ch === '[') brackets++;
      else if (ch === ']') brackets--;
    }

    // Close any open structures
    let closing = '';
    // Close unclosed array items
    while (brackets > 0) { closing += ']'; brackets--; }
    while (braces > 0) { closing += '}'; braces--; }

    return s + closing;
  } catch {
    return null;
  }
};

// ─── Groq text generation ─────────────────────────────────────────────────────
const generateWithGroq = async (prompt, systemPrompt) => {
  const groq = getGroq();
  if (!groq) throw new Error('GROQ_NOT_CONFIGURED');

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  // /no_think suppresses qwen's <think>...</think> chain-of-thought in output
  messages.push({ role: 'user', content: prompt + '\n/no_think' });

  // qwen/qwen3.8-27b is currently the best available text-generation model on this Groq account
  const groqModels = ['qwen/qwen3.8-27b'];
  for (const model of groqModels) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 8192,
      });
      const finishReason = completion.choices[0]?.finish_reason;
      let content = completion.choices[0]?.message?.content || '';
      // Strip any residual <think>...</think> blocks from qwen output
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      console.log(`[AI] ✅ Groq model: ${model} | finish: ${finishReason} | chars: ${content.length}`);
      if (finishReason === 'length') {
        console.warn('[AI] ⚠️ Response hit token limit — attempting JSON repair');
      }
      return content;
    } catch (e) {
      console.warn(`[AI] Groq ${model} failed: ${e.message?.substring(0, 80)}`);
    }
  }
  throw new Error('All Groq models failed');
};

// ─── Gemini text generation ───────────────────────────────────────────────────
const generateWithGemini = async (prompt, modelName) => {
  const ai = getGenAI();
  if (!ai) throw new Error('GEMINI_NOT_CONFIGURED');
  const model = ai.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text();
};

// ─── Master generate: tries all providers, fast-fails daily quota ─────────────
const generate = async (prompt, systemPrompt = null) => {
  const errors = [];

  // --- Try Gemini models first ---
  if (getGenAI()) {
    for (const modelName of ['gemini-1.5-flash', 'gemini-1.5-flash-latest']) {
      try {
        const text = await generateWithGemini(prompt, modelName);
        console.log(`[AI] ✅ Gemini model: ${modelName}`);
        return text;
      } catch (err) {
        const msg = err.message || '';
        if (is404(msg)) { console.warn(`[AI] ${modelName}: 404, skipping`); continue; }
        if (isQuotaError(msg)) {
          console.warn(`[AI] ${modelName}: ${isDailyQuota(msg) ? 'daily' : 'rate'} quota, trying next`);
          errors.push(`Gemini ${modelName}: quota`);
          continue;
        }
        console.error(`[AI] ${modelName} error:`, msg.substring(0, 100));
        errors.push(`Gemini ${modelName}: ${msg.substring(0, 60)}`);
      }
    }
  }

  // --- Try Groq as fallback ---
  if (getGroq()) {
    try {
      const text = await generateWithGroq(prompt, systemPrompt);
      return text;
    } catch (err) {
      const msg = err.message || '';
      console.error('[AI] Groq error:', msg.substring(0, 100));
      errors.push(`Groq: ${msg.substring(0, 60)}`);
    }
  }

  // --- All failed ---
  if (!getGroq()) {
    throw new Error(
      'Gemini quota exceeded. Add a free Groq API key:\n' +
      '1. Go to https://console.groq.com → sign up free\n' +
      '2. Create an API key → add GROQ_API_KEY=gsk_... to server/.env'
    );
  }
  throw new Error(`All AI providers failed. Try again in a moment.\nDetails: ${errors.join(' | ')}`);
};

// ─── Groq chat (multi-turn) ───────────────────────────────────────────────────
const chatWithGroq = async (message, history, systemPrompt) => {
  const groq = getGroq();
  if (!groq) throw new Error('GROQ_NOT_CONFIGURED');

  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  history.forEach((h) => messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content }));
  messages.push({ role: 'user', content: message + '\n/no_think' });

  for (const model of ['qwen/qwen3.8-27b']) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 4096,
      });
      let content = completion.choices[0]?.message?.content || '';
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      return content;
    } catch (e) {
      console.warn(`[AI] Groq chat ${model} failed: ${e.message?.substring(0, 60)}`);
    }
  }
  throw new Error('All Groq chat models failed');
};

// ─── Gemini chat ──────────────────────────────────────────────────────────────
const chatWithGemini = async (message, history, systemPrompt, modelName) => {
  const ai = getGenAI();
  if (!ai) throw new Error('GEMINI_NOT_CONFIGURED');
  const cfg = { model: modelName };
  if (systemPrompt) cfg.systemInstruction = systemPrompt;
  const model = ai.getGenerativeModel(cfg);
  const formattedHistory = history.map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));
  const chat = model.startChat({ history: formattedHistory });
  const result = await chat.sendMessage(message);
  return result.response.text();
};

// ─── Master chat ──────────────────────────────────────────────────────────────
const chat = async (message, history, systemPrompt) => {
  if (getGenAI()) {
    for (const modelName of ['gemini-1.5-flash', 'gemini-1.5-flash-latest']) {
      try {
        return await chatWithGemini(message, history, systemPrompt, modelName);
      } catch (err) {
        if (isQuotaError(err.message) || is404(err.message)) continue;
        throw err;
      }
    }
  }
  if (getGroq()) return chatWithGroq(message, history, systemPrompt);
  throw new Error('No AI provider available. Please configure GROQ_API_KEY in server/.env');
};

// ─── Public exports ───────────────────────────────────────────────────────────

exports.generateItinerary = async (tripDetails) => {
  const text = await generate(buildItineraryPrompt(tripDetails));
  return parseJSONResponse(text);
};

exports.recommendHotels = async (travelDetails) => {
  const text = await generate(buildHotelRecommendPrompt(travelDetails));
  return parseJSONResponse(text);
};

exports.generateBudget = async (budgetDetails) => {
  const text = await generate(buildBudgetPrompt(budgetDetails));
  return parseJSONResponse(text);
};

exports.generatePackingList = async (packingDetails) => {
  const text = await generate(buildPackingPrompt(packingDetails));
  return parseJSONResponse(text);
};

exports.chat = async (message, history = []) => {
  const { systemPrompt, message: userMessage } = buildChatPrompt(message, history);
  return chat(userMessage, history, systemPrompt);
};
