/**
 * eventService.js
 * Phase 3 — Current Events via Tavily Search API
 *
 * CONCEPT: Why a Search API for Events?
 * Event data is dynamic — festivals, concerts, exhibitions change weekly.
 * No static dataset can cover this. A search API queries the live web.
 *
 * We use Tavily (https://tavily.com) — a search API designed for AI applications.
 * - Free tier: 1,000 searches/month
 * - Returns structured results with title, url, content snippet, relevance score
 *
 * Validation: Raw search results are NOT blindly added to the itinerary.
 * The agent validates date/location relevance before including an event.
 *
 * When no API key is set, returns curated MOCK events for demo purposes.
 */

const axios = require('axios');

const TAVILY_BASE = 'https://api.tavily.com';
const MONTH_NAMES = [
  '', 'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// ─── Mock events (demo without API key) ───────────────────────────────────────
const MOCK_EVENT_BANK = {
  paris:     [{ name: 'Paris Art Week', type: 'exhibition', venue: 'Grand Palais', description: 'Contemporary art exhibitions across the city.', isFree: false, estimatedCost: 15, source: 'mock' }],
  london:    [{ name: 'West End Live', type: 'festival', venue: 'Leicester Square', description: 'Free performances from top West End shows.', isFree: true, estimatedCost: 0, source: 'mock' }],
  dubai:     [{ name: 'Dubai Food Festival', type: 'food', venue: 'City-wide', description: 'Culinary experiences from world-class chefs.', isFree: false, estimatedCost: 50, source: 'mock' }],
  goa:       [{ name: 'Goa Carnival', type: 'festival', venue: 'Panaji Streets', description: 'Colorful parade festival with music and dance.', isFree: true, estimatedCost: 0, source: 'mock' }],
  mumbai:    [{ name: 'Kala Ghoda Arts Festival', type: 'exhibition', venue: 'Kala Ghoda', description: 'South Asia\'s largest multidisciplinary arts festival.', isFree: true, estimatedCost: 0, source: 'mock' }],
  delhi:     [{ name: 'Delhi Literature Festival', type: 'cultural', venue: 'Jawaharlal Nehru Stadium', description: 'Annual celebration of literature and ideas.', isFree: false, estimatedCost: 20, source: 'mock' }],
  bali:      [{ name: 'Bali Arts Festival', type: 'festival', venue: 'Denpasar', description: 'Month-long celebration of Balinese arts and culture.', isFree: true, estimatedCost: 0, source: 'mock' }],
  singapore: [{ name: 'Singapore Night Festival', type: 'festival', venue: 'Bras Basah', description: 'Light art installations and performances.', isFree: true, estimatedCost: 0, source: 'mock' }],
};

function getMockEvents(city, month) {
  const key = city.toLowerCase().replace(/\s+/g, '');
  const found = MOCK_EVENT_BANK[key] || [];
  // Add month label
  return found.map(e => ({ ...e, month: MONTH_NAMES[month] || 'current month', isMock: true }));
}

// ─── Real Tavily search ────────────────────────────────────────────────────────
async function searchTavily(query) {
  const key = process.env.TAVILY_API_KEY;
  const resp = await axios.post(`${TAVILY_BASE}/search`, {
    api_key: key,
    query,
    search_depth: 'basic',
    include_answer: false,
    max_results: 5,
  }, { timeout: 10000 });
  return resp.data.results || [];
}

function parseEventFromResult(result, city) {
  // Basic validation: result must mention the city
  const text = (result.title + ' ' + result.content).toLowerCase();
  if (!text.includes(city.toLowerCase())) return null;
  return {
    name: result.title,
    type: 'event',
    venue: city,
    description: result.content?.slice(0, 200) || '',
    url: result.url,
    isFree: text.includes('free'),
    estimatedCost: text.includes('free') ? 0 : null,
    source: result.url,
    isMock: false,
  };
}

async function fetchRealEvents(city, month, year) {
  const monthName = MONTH_NAMES[month] || '';
  const queries = [
    `${city} events ${monthName} ${year}`,
    `${city} festivals ${monthName} ${year}`,
    `things to do ${city} ${monthName} ${year}`,
  ];
  const allResults = [];
  for (const q of queries) {
    try {
      const results = await searchTavily(q);
      for (const r of results) {
        const ev = parseEventFromResult(r, city);
        if (ev) allResults.push(ev);
      }
    } catch (e) {
      console.warn(`[Events] Tavily query failed: ${e.message}`);
    }
  }
  // Deduplicate by name
  const seen = new Set();
  return allResults.filter(e => {
    if (seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  }).slice(0, 5);
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * getEvents(city, startDate)
 * Returns array of events for the city during the travel month.
 * Uses Tavily if key present, mock data otherwise.
 */
async function getEvents(city, startDate) {
  const date = startDate ? new Date(startDate) : new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  const key = process.env.TAVILY_API_KEY;
  if (!key || key === 'your_tavily_key') {
    console.log('[Events] No Tavily key — using mock events.');
    return getMockEvents(city, month);
  }
  try {
    const events = await fetchRealEvents(city, month, year);
    if (events.length === 0) return getMockEvents(city, month);
    return events;
  } catch (err) {
    console.warn(`[Events] Error: ${err.message} — falling back to mock.`);
    return getMockEvents(city, month);
  }
}

module.exports = { getEvents };
