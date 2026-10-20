/**
 * travelAgent.js
 * Phase 4 — AI Travel Agent Orchestrator
 *
 * CONCEPT: What is an Orchestrator?
 * An orchestrator is a function that coordinates multiple services
 * in a defined sequence to complete a complex task.
 *
 * Instead of one giant LLM prompt that invents everything, the agent:
 * 1. Extracts structured intent from user input (Gemini call 1)
 * 2. Retrieves real place candidates from MongoDB
 * 3. Scores them with cosine similarity (recommendation engine)
 * 4. Fetches real/mock weather
 * 5. Searches real/mock events
 * 6. Optimizes the route (Haversine + TSP)
 * 7. Estimates costs deterministically
 * 8. Builds structured itinerary
 * 9. Asks Gemini to explain it in natural language (Gemini call 2)
 *
 * The LLM never invents facts. It only receives structured data and writes prose.
 *
 * Interview answer:
 * "The system uses an orchestrator pattern where each step (recommendation,
 * routing, cost estimation) is handled by a specialized service. The LLM
 * only handles intent extraction and natural language generation —
 * not factual decisions."
 */

const Place = require('../../models/Place');
const Restaurant = require('../../models/Restaurant');
const UserPreference = require('../../models/UserPreference');

const { extractIntent } = require('./intentExtractor');
const { getWeatherForecast, getWeatherSummary } = require('./weatherService');
const { getEvents } = require('./eventService');
const { optimizeRoute } = require('./routeOptimizer');
const { estimateCosts, adjustForBudget } = require('./costEstimator');
const { buildItinerary } = require('./itineraryBuilder');

// ─── Cosine similarity (same implementation as recommendationController) ─────
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] ** 2;
    magB += vecB[i] ** 2;
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// Convert preferences array to 7-dim vector
function preferencesToVector(preferences, boosts = {}) {
  const dims = ['nature', 'adventure', 'culture', 'food', 'relaxation', 'nightlife', 'photography'];
  return dims.map(d => {
    const base = preferences.includes(d) ? 0.8 : 0.2;
    const extra = boosts[d] || 0;
    return Math.min(1, base + extra);
  });
}

function placeToVector(place) {
  return [
    place.natureScore || 0,
    place.adventureScore || 0,
    place.cultureScore || 0,
    place.foodScore || 0,
    place.relaxationScore || 0,
    place.nightlifeScore || 0,
    place.photographyScore || 0,
  ];
}

// ─── Fetch and score candidate places ───────────────────────────────────────────
async function getCandidatePlaces(intent, userId) {
  const { destination, preferences, budget, duration, travelers = 1, excludeCategories = [], preferenceBoosts = {} } = intent;
  const dailyBudgetPerPerson = budget / travelers / duration;

  // Query MongoDB for places in destination
  const filter = { isActive: true };
  const destRegex = { $regex: destination, $options: 'i' };
  filter.$or = [{ city: destRegex }, { country: destRegex }, { 'address': destRegex }];

  // Exclude filtered categories
  if (excludeCategories.length > 0) {
    filter.category = { $nin: excludeCategories };
    filter.placeType = { $nin: excludeCategories };
  }

  let places = await Place.find(filter).limit(300);

  // If fewer than 5 places in DB (not seeded yet), use fallback
  if (places.length < 5) {
    console.log(`[Agent] Only ${places.length} places found for ${destination} — using LLM fallback.`);
    return { places: [], usedFallback: true };
  }

  // Get user preference vector (from DB or convert from intent)
  let userVec;
  if (userId) {
    const userPref = await UserPreference.findOne({ user: userId });
    userVec = userPref ? userPref.toVector() : preferencesToVector(preferences, preferenceBoosts);
  } else {
    userVec = preferencesToVector(preferences, preferenceBoosts);
  }

  // Score and rank
  const scored = places.map(place => {
    const placeVec = placeToVector(place);
    const prefScore = cosineSimilarity(userVec, placeVec);
    const budgetScore = (place.averageCost || 0) <= dailyBudgetPerPerson ? 1.0 :
      Math.max(0, 1 - ((place.averageCost / dailyBudgetPerPerson) - 1));
    const ratingScore = (place.rating || 4) / 5;
    const hybrid = prefScore * 0.50 + budgetScore * 0.25 + ratingScore * 0.25;
    return { place, score: hybrid };
  });

  scored.sort((a, b) => b.score - a.score);

  // Take enough for the trip (4 places/day × duration, min 10)
  const needed = Math.max(10, duration * 4);
  return { places: scored.slice(0, needed).map(s => s.place), usedFallback: false };
}

// ─── LLM fallback itinerary (when no places in DB) ────────────────────────
async function buildFallbackItinerary(intent) {
  // Use existing geminiService as fallback when DB has no places
  const geminiService = require('../ai/geminiService');
  const result = await geminiService.generateItinerary(intent);
  return { ...result, _meta: { ...result._meta, usedFallback: true, engineVersion: 'llm-fallback' } };
}

// ─── Main orchestrator ──────────────────────────────────────────────────────────────
/**
 * generateTrip(input, userId)
 *
 * input: { userText } OR { formData: { destination, duration, budget, ... } }
 * userId: MongoDB ObjectId of authenticated user
 *
 * Returns: structured trip object ready to save to MongoDB
 */
async function generateTrip(input, userId) {
  console.log('[Agent] Starting trip generation...');
  const stages = [];

  // Stage 1: Extract intent
  stages.push({ stage: 'intent', status: 'running' });
  const intent = await extractIntent(input.userText, input.formData);
  console.log(`[Agent] Intent: ${intent.destination}, ${intent.duration} days, ${intent.currency} ${intent.budget}`);
  stages[0].status = 'done';

  // Stage 2: Get candidate places
  stages.push({ stage: 'places', status: 'running' });
  const { places, usedFallback } = await getCandidatePlaces(intent, userId);
  stages[1].status = 'done';
  stages[1].count = places.length;

  // Fallback: if no places in DB, use LLM directly
  if (usedFallback) {
    stages.push({ stage: 'llm_fallback', status: 'running' });
    try {
      const result = await buildFallbackItinerary(intent);
      stages[2].status = 'done';
      return { trip: result, intent, stages };
    } catch (e) {
      throw new Error(`Both agent and LLM fallback failed: ${e.message}`);
    }
  }

  // Stage 3: Weather
  stages.push({ stage: 'weather', status: 'running' });
  const weather = await getWeatherForecast(intent.destination, intent.startDate, intent.duration);
  stages[2].status = 'done';
  stages[2].isMock = weather[0]?.isMock || false;

  // Stage 4: Events
  stages.push({ stage: 'events', status: 'running' });
  const events = await getEvents(intent.destination, intent.startDate);
  stages[3].status = 'done';
  stages[3].count = events.length;

  // Stage 5: Route optimization
  stages.push({ stage: 'route', status: 'running' });
  const scheduledDays = optimizeRoute(places, intent, weather);
  stages[4].status = 'done';

  // Stage 6: Cost estimation
  stages.push({ stage: 'cost', status: 'running' });
  const rawCosts = estimateCosts(scheduledDays, intent);
  const { adjustedDays, adjustedCosts, adjustments } = adjustForBudget(scheduledDays, rawCosts, intent);
  const costs = { ...adjustedCosts, adjustments };
  stages[5].status = 'done';
  stages[5].total = costs.total;
  stages[5].overBudget = costs.isOverBudget;

  // Stage 7: Restaurants
  stages.push({ stage: 'restaurants', status: 'running' });
  const destRegex = { $regex: intent.destination, $options: 'i' };
  const restaurants = await Restaurant.find({
    $or: [{ city: destRegex }, { country: destRegex }]
  }).limit(20);
  stages[6].status = 'done';

  // Stage 8: Build itinerary + LLM explanation
  stages.push({ stage: 'itinerary', status: 'running' });
  const trip = await buildItinerary(adjustedDays, intent, weather, events, restaurants, costs);
  stages[7].status = 'done';

  console.log('[Agent] Trip generation complete.');
  return { trip, intent, stages, costs, weather, events };
}

/**
 * modifyTrip(currentIntent, userModificationText, userId)
 * Parses a natural-language modification and re-runs the agent.
 */
async function modifyTrip(currentIntent, userModificationText, userId) {
  const { parseModification, applyModification } = require('./modificationParser');
  const modification = await parseModification(userModificationText);
  if (modification.action === 'unknown') {
    throw new Error(`Could not understand modification: "${userModificationText}". Try: "remove museums", "add more nature", "reduce cost", "change pace to slow"`);
  }
  const updatedIntent = applyModification(currentIntent, modification);
  const result = await generateTrip({ formData: updatedIntent }, userId);
  return { ...result, modification };
}

module.exports = { generateTrip, modifyTrip };
