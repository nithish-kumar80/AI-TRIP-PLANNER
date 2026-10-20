/**
 * modificationParser.js
 * Phase 8 — Natural-Language Itinerary Modification
 *
 * CONCEPT: Structured LLM Output for Safe Modifications
 *
 * User says: "Remove museums and add more nature"
 * LLM extracts: { action: "filter_out_category", category: "museum" }
 * Backend validates the schema before applying.
 *
 * WHY validate before applying?
 * Raw LLM output must NEVER directly modify the database.
 * We validate that the action is one of the supported actions,
 * and that all required fields are present.
 * Only then do we apply the change.
 *
 * Supported actions:
 *   filter_out_category  — remove all places of a category
 *   add_preference       — increase weight of a preference
 *   remove_preference    — decrease weight of a preference
 *   reduce_cost          — switch to cheaper alternatives
 *   change_pace          — slow/moderate/fast (places per day)
 *   add_event_type       — search for specific event type
 *   change_transport     — change transportation mode
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { jsonrepair } = require('jsonrepair');

const VALID_ACTIONS = [
  'filter_out_category',
  'add_preference',
  'remove_preference',
  'reduce_cost',
  'change_pace',
  'add_event_type',
  'change_transport',
];

const VALID_CATEGORIES = [
  'museum', 'park', 'historic', 'beach', 'temple', 'fort',
  'gallery', 'market', 'nature', 'adventure', 'nightlife', 'shopping',
];

const VALID_PREFERENCES = [
  'nature', 'adventure', 'culture', 'food', 'relaxation',
  'nightlife', 'photography', 'historic', 'beaches', 'shopping', 'peaceful',
];

const VALID_PACES = ['slow', 'moderate', 'fast'];
const VALID_TRANSPORTS = ['flight', 'train', 'bus', 'car', 'mixed'];

function buildModificationPrompt(userText) {
  return `You are a travel planning assistant. Extract a structured modification command from the user's request.
Return ONLY a valid JSON object with NO markdown, NO explanation.

User says: "${userText}"

Return one of these JSON structures:

// Remove a category of places:
{ "action": "filter_out_category", "category": "<museum|park|historic|beach|temple|fort|gallery|market|nature|adventure|nightlife|shopping>" }

// Increase a preference:
{ "action": "add_preference", "preference": "<nature|adventure|culture|food|relaxation|nightlife|photography|historic|peaceful>" }

// Decrease a preference:
{ "action": "remove_preference", "preference": "<preference>" }

// Reduce trip cost:
{ "action": "reduce_cost" }

// Change pace:
{ "action": "change_pace", "pace": "<slow|moderate|fast>" }

// Find events:
{ "action": "add_event_type", "eventType": "<concert|festival|sports|exhibition|food>" }

// Change transport:
{ "action": "change_transport", "mode": "<flight|train|bus|car|mixed>" }

If none match, return: { "action": "unknown", "rawText": "${userText.replace(/"/g, "'")}"}`;}

async function callLLM(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.startsWith('AIza')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) { console.warn('[ModParser] Gemini failed:', e.message); }
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'your_groq_api_key_here') {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const resp = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt + '\n/no_think' }],
        temperature: 0.1, max_tokens: 256,
      });
      let content = resp.choices[0].message.content || '';
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      return content;
    } catch (e) { console.warn('[ModParser] Groq failed:', e.message); }
  }
  return null;
}

function validateModification(mod) {
  if (!VALID_ACTIONS.includes(mod.action)) return `Unknown action: ${mod.action}`;
  if (mod.action === 'filter_out_category' && !VALID_CATEGORIES.includes(mod.category)) return `Unknown category: ${mod.category}`;
  if (mod.action === 'add_preference' && !VALID_PREFERENCES.includes(mod.preference)) return `Unknown preference: ${mod.preference}`;
  if (mod.action === 'remove_preference' && !VALID_PREFERENCES.includes(mod.preference)) return `Unknown preference: ${mod.preference}`;
  if (mod.action === 'change_pace' && !VALID_PACES.includes(mod.pace)) return `Invalid pace: ${mod.pace}`;
  if (mod.action === 'change_transport' && !VALID_TRANSPORTS.includes(mod.mode)) return `Invalid transport: ${mod.mode}`;
  return null;
}

/**
 * parseModification(userText)
 * Returns a validated, structured modification command.
 */
async function parseModification(userText) {
  const prompt = buildModificationPrompt(userText);
  const raw = await callLLM(prompt);

  if (!raw) {
    // Keyword fallback
    const lower = userText.toLowerCase();
    if (lower.includes('museum')) return { action: 'filter_out_category', category: 'museum' };
    if (lower.includes('cheaper') || lower.includes('budget') || lower.includes('cost')) return { action: 'reduce_cost' };
    if (lower.includes('nature')) return { action: 'add_preference', preference: 'nature' };
    if (lower.includes('slow') || lower.includes('relaxed')) return { action: 'change_pace', pace: 'slow' };
    if (lower.includes('fast') || lower.includes('more places')) return { action: 'change_pace', pace: 'fast' };
    return { action: 'unknown', rawText: userText };
  }

  try {
    let text = raw.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(jsonrepair(text));
    const error = validateModification(parsed);
    if (error) throw new Error(error);
    return parsed;
  } catch (e) {
    throw new Error(`Could not parse modification: ${e.message}`);
  }
}

/**
 * applyModification(currentIntent, modification)
 * Applies the validated modification to the intent object.
 * Returns updated intent for re-running the agent.
 */
function applyModification(currentIntent, modification) {
  const intent = { ...currentIntent };
  switch (modification.action) {
    case 'filter_out_category':
      intent.excludeCategories = [...(intent.excludeCategories || []), modification.category];
      break;
    case 'add_preference':
      if (!intent.preferences.includes(modification.preference)) {
        intent.preferences = [...intent.preferences, modification.preference];
      }
      // Boost the preference weight
      intent.preferenceBoosts = { ...(intent.preferenceBoosts || {}), [modification.preference]: 0.3 };
      break;
    case 'remove_preference':
      intent.preferences = intent.preferences.filter(p => p !== modification.preference);
      break;
    case 'reduce_cost':
      intent.travelStyle = 'budget';
      intent.forceReduceCost = true;
      break;
    case 'change_pace':
      intent.pace = modification.pace;
      break;
    case 'add_event_type':
      intent.eventTypes = [...(intent.eventTypes || []), modification.eventType];
      break;
    case 'change_transport':
      intent.transportationMode = modification.mode;
      break;
  }
  return intent;
}

module.exports = { parseModification, applyModification };
