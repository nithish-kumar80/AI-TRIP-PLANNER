/**
 * itineraryBuilder.js
 * Phase 7 — Structured Itinerary Assembly
 *
 * CONCEPT: Structured-first, LLM-second
 * The itinerary is built as structured data FIRST.
 * Gemini only receives this structured data and writes natural-language descriptions.
 * It does NOT invent places, prices, or weather — it only explains what the data says.
 *
 * This dramatically reduces hallucination:
 * - Hallucination happens when LLMs must invent facts
 * - When facts are provided as structured input, LLMs only write prose
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');
const { jsonrepair } = require('jsonrepair');

// ─── Meal suggestions based on time of day ────────────────────────────────────────
function buildMealSuggestions(dayPlaces, restaurants, mealTier) {
  const meals = [];
  const priceFilter = mealTier === 'budget' ? ['$', '$$'] : mealTier === 'luxury' ? ['$$$', '$$$$'] : ['$$', '$$$'];
  const nearby = restaurants.filter(r => priceFilter.includes(r.priceRange));

  const byType = {
    breakfast: nearby.filter(r => r.mealTypes?.includes('breakfast') || r.mealTypes?.includes('all')).slice(0, 1),
    lunch:     nearby.filter(r => r.mealTypes?.includes('lunch')     || r.mealTypes?.includes('all')).slice(0, 1),
    dinner:    nearby.filter(r => r.mealTypes?.includes('dinner')    || r.mealTypes?.includes('all')).slice(0, 1),
  };

  // Helper: build a clean meal object — cuisine must be String, not Array
  const toMeal = (type, time, r) => {
    const doc = r.toObject ? r.toObject() : { ...r };
    return {
      mealType: type,
      time,
      name: doc.name || '',
      // Restaurant.cuisine is [String]; Trip.meals.cuisine is String — join if array
      cuisine: Array.isArray(doc.cuisine) ? doc.cuisine.join(', ') : (doc.cuisine || 'Local'),
      priceRange: doc.priceRange || '$$',
    };
  };

  if (byType.breakfast.length > 0) meals.push(toMeal('breakfast', '08:00', byType.breakfast[0]));
  if (byType.lunch.length > 0)     meals.push(toMeal('lunch',     '13:00', byType.lunch[0]));
  if (byType.dinner.length > 0)    meals.push(toMeal('dinner',    '19:30', byType.dinner[0]));

  // Fallback if no restaurants in DB
  if (meals.length === 0) {
    meals.push({ mealType: 'breakfast', time: '08:00', name: 'Local breakfast spot', cuisine: 'Local', priceRange: '$$' });
    meals.push({ mealType: 'lunch',     time: '13:00', name: 'Local restaurant',     cuisine: 'Local', priceRange: '$$' });
    meals.push({ mealType: 'dinner',    time: '19:30', name: 'Local dinner spot',    cuisine: 'Local', priceRange: '$$' });
  }
  return meals;
}

// ─── Build structured day object ───────────────────────────────────────────────────
function buildStructuredDay(dayIndex, scheduledPlaces, weather, events, restaurants, costs, intent) {
  const date = new Date(intent.startDate || Date.now());
  date.setDate(date.getDate() + dayIndex);
  const dateStr = date.toISOString().split('T')[0];

  // Activities from places
  const activities = scheduledPlaces.map(place => ({
    time: place.start,
    endTime: place.end,
    activity: place.name,
    location: place.address || place.city || intent.destination,
    description: place.description || '',
    estimatedCost: Math.round((place.estimatedCost || place.averageCost || 0) * intent.travelers),
    visitDuration: place.visitDuration || 90,
    travelToNext: place.nextTravelMinutes || 0,
    distanceToNext: place.nextTravelKm || 0,
    coordinates: {
      lat: place.location?.coordinates?.[1] || place.lat || null,
      lng: place.location?.coordinates?.[0] || place.lng || null,
    },
    tags: place.tags || [],
    category: place.category || place.placeType || 'attraction',
  }));

  // Meals
  const meals = buildMealSuggestions(scheduledPlaces, restaurants, costs.mealTier);

  // Events for this day (distribute events across days)
  const dayEvents = events.filter((_, i) => i % (intent.duration || 1) === dayIndex % (events.length || 1));

  const dailyCost = scheduledPlaces.reduce((s, p) =>
    s + (p.estimatedCost || p.averageCost || 0) * intent.travelers, 0
  ) + meals.length * (costs.foodCost / intent.duration / intent.travelers || 600);

  return {
    day: dayIndex + 1,
    date: dateStr,
    title: `Day ${dayIndex + 1} in ${intent.destination}`,
    weather: weather ? {
      condition: weather.condition,
      description: weather.description,
      tempC: weather.tempC,
      rain: weather.rain,
      icon: weather.icon,
      isMock: weather.isMock,
    } : null,
    activities,
    meals,
    events: dayEvents,
    travelTimeMinutes: scheduledPlaces.reduce((s, p) => s + (p.nextTravelMinutes || 0), 0),
    totalDistanceKm: scheduledPlaces.reduce((s, p) => s + (p.nextTravelKm || 0), 0),
    estimatedDailyCost: Math.round(dailyCost),
  };
}

// ─── LLM explanation (Gemini → Groq fallback) ────────────────────────────────────
function buildExplanationPrompt(structuredItinerary, intent, weatherSummary, events) {
  // Give LLM the structured data — ask it to write descriptions only
  const daysSummary = structuredItinerary.itinerary.slice(0, 3).map(d =>
    `Day ${d.day} (${d.date}): ${d.activities.map(a => a.activity).join(', ')}`
  ).join('\n');

  return `You are a travel writer. Write a natural, engaging travel plan description.
You are given structured data — do NOT invent new places, prices, events, or weather.
Only write engaging prose that explains the given data.

Trip: ${intent.duration}-day trip to ${intent.destination}
Budget: ${intent.currency} ${intent.budget.toLocaleString()}
Travelers: ${intent.travelers}
Preferences: ${intent.preferences.join(', ')}

Itinerary summary:
${daysSummary}

Weather: ${weatherSummary}
${events.length > 0 ? `Local events: ${events.map(e => e.name).join(', ')}` : ''}

Write a JSON response with this structure (no markdown, no explanation outside JSON):
{
  "overview": "<2-3 sentence trip overview>",
  "highlights": ["<highlight 1>", "<highlight 2>", "<highlight 3>"],
  "travelTips": ["<practical tip 1>", "<practical tip 2>", "<practical tip 3>"],
  "dayDescriptions": {
    "1": "<1-2 sentence description of day 1 activities>",
    "2": "<1-2 sentence description of day 2 activities>"
  }
}`;
}

async function callLLMForExplanation(prompt) {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.startsWith('AIza')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.warn('[Itinerary] Gemini explanation failed:', e.message);
    }
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey && groqKey !== 'your_groq_api_key_here') {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const resp = await groq.chat.completions.create({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt + '\n/no_think' }],
        temperature: 0.7,
        max_tokens: 1024,
      });
      let content = resp.choices[0].message.content || '';
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      return content;
    } catch (e) {
      console.warn('[Itinerary] Groq explanation failed:', e.message);
    }
  }
  return null;
}

function defaultExplanation(intent, itinerary) {
  return {
    overview: `A ${intent.duration}-day trip to ${intent.destination} tailored to your ${intent.preferences.join(', ')} interests.`,
    highlights: itinerary.slice(0, 3).map(d => d.activities[0]?.activity).filter(Boolean),
    travelTips: [
      'Carry local currency for small vendors',
      'Book popular attractions in advance',
      'Keep a buffer of 10-15% of your budget for unexpected expenses',
    ],
    dayDescriptions: {},
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * buildItinerary(scheduledDays, intent, weather, events, restaurants, costs)
 *
 * Assembles the full structured itinerary, then asks LLM to explain it.
 * Returns the complete trip object ready for saving to MongoDB.
 */
async function buildItinerary(scheduledDays, intent, weather, events, restaurants, costs) {
  const { getWeatherSummary } = require('./weatherService');

  // Build structured days
  const structuredDays = scheduledDays.map((day, idx) => {
    const places = Array.isArray(day.places) ? day.places : (Array.isArray(day) ? day : []);
    return buildStructuredDay(idx, places, weather[idx], events, restaurants, costs, intent);
  });

  const partial = { itinerary: structuredDays };
  const weatherSummary = getWeatherSummary(weather);

  // Ask LLM to explain (not invent)
  let explanation = defaultExplanation(intent, structuredDays);
  const prompt = buildExplanationPrompt(partial, intent, weatherSummary, events);
  const raw = await callLLMForExplanation(prompt);

  if (raw) {
    try {
      let text = raw.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
      const parsed = JSON.parse(jsonrepair(text));
      explanation = { ...explanation, ...parsed };
    } catch (e) {
      console.warn('[Itinerary] Could not parse LLM explanation:', e.message);
    }
  }

  // Apply day descriptions from LLM
  const itinerary = structuredDays.map(day => ({
    ...day,
    title: explanation.dayDescriptions?.[String(day.day)]
      ? `Day ${day.day}: ${explanation.dayDescriptions[String(day.day)].slice(0, 60)}`
      : day.title,
  }));

  return {
    title: `${intent.duration}-Day Trip to ${intent.destination}`,
    destination: intent.destination,
    duration: intent.duration,
    travelers: intent.travelers,
    budget: intent.budget,
    currency: intent.currency || 'INR',
    interests: intent.preferences,
    transportationMode: intent.transportationMode || 'mixed',
    startDate: intent.startDate ? new Date(intent.startDate) : null,
    endDate: intent.startDate ? (() => { const d = new Date(intent.startDate); d.setDate(d.getDate() + intent.duration); return d; })() : null,
    overview: explanation.overview,
    highlights: explanation.highlights || [],
    travelTips: explanation.travelTips || [],
    itinerary,
    budgetBreakdown: {
      hotel: costs.hotelCost,
      transport: costs.transportCost,
      food: costs.foodCost,
      entertainment: costs.attractionCost,
      emergency: costs.miscCost,
      shopping: 0,
    },
    weatherInfo: {
      season: weather[0]?.condition || 'Unknown',
      avgTemp: weather.length > 0 ? `${Math.round(weather.reduce((s,d)=>s+d.tempC,0)/weather.length)}°C` : 'Unknown',
      climate: weather.some(d => d.rain) ? 'Some rain expected' : 'Generally dry',
    },
    aiGenerated: true,
    status: 'planned',
    tags: intent.preferences,
    _meta: {
      weatherSource: weather[0]?.isMock ? 'mock' : 'OpenWeatherMap',
      eventsSource: events[0]?.isMock ? 'mock' : 'Tavily',
      routeAlgorithm: 'nearest-neighbor + 2-opt',
      costMethod: 'deterministic',
      budgetAdjustments: costs.adjustments || [],
      engineVersion: 'agent-v1',
    },
  };
}

module.exports = { buildItinerary };
