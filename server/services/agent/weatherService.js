/**
 * weatherService.js
 * Phase 2 — Weather API Integration
 *
 * CONCEPT: What is a Weather API?
 * A weather API is an external service that returns real atmospheric data
 * (temperature, rain probability, wind, conditions) for a given location and time.
 *
 * We use OpenWeatherMap (https://openweathermap.org/api)
 * - Free tier: 1,000 calls/day
 * - Endpoint: GET /forecast?q={city}&appid={key}&units=metric
 * - Returns: 5-day forecast in 3-hour intervals (40 data points)
 *
 * When no API key is set, the service returns realistic MOCK data so
 * development can continue immediately. Real key → real weather.
 *
 * How weather affects itinerary:
 *   rain/storm → prefer indoor activities (museums, cafes, galleries)
 *   clear/sunny → outdoor activities are fine
 *   extreme heat → limit midday outdoor time
 */

const axios = require('axios');

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';

// ─── Mock weather generator (used when no API key is set) ─────────────────────
// Returns realistic looking weather data so the pipeline works without a key.
function mockWeather(city, startDate, days) {
  const conditions = [
    { condition: 'Clear', description: 'Clear sky', rain: false, icon: '01d', tempC: 28 },
    { condition: 'Clouds', description: 'Partly cloudy', rain: false, icon: '02d', tempC: 25 },
    { condition: 'Clouds', description: 'Overcast clouds', rain: false, icon: '04d', tempC: 22 },
    { condition: 'Rain', description: 'Light rain', rain: true, icon: '10d', tempC: 19 },
    { condition: 'Drizzle', description: 'Light drizzle', rain: true, icon: '09d', tempC: 20 },
  ];
  const result = [];
  for (let i = 0; i < days; i++) {
    const date = startDate ? new Date(startDate) : new Date();
    date.setDate(date.getDate() + i);
    const pick = conditions[i % conditions.length];
    result.push({
      date: date.toISOString().split('T')[0],
      condition: pick.condition,
      description: pick.description,
      tempC: pick.tempC + Math.round(Math.random() * 4 - 2),
      tempMinC: pick.tempC - 4,
      tempMaxC: pick.tempC + 4,
      humidity: 60 + Math.round(Math.random() * 20),
      rain: pick.rain,
      rainMm: pick.rain ? Math.round(Math.random() * 15) : 0,
      icon: pick.icon,
      windKph: 10 + Math.round(Math.random() * 15),
      isMock: true,
    });
  }
  return result;
}

// ─── Real OpenWeatherMap forecast ─────────────────────────────────────────────
async function fetchRealWeather(city, days) {
  const key = process.env.OPENWEATHERMAP_KEY;
  const url = `${OWM_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${key}&units=metric&cnt=${days * 8}`;
  const resp = await axios.get(url, { timeout: 8000 });
  const list = resp.data.list;

  // Group 3-hour intervals into daily summaries
  const byDay = {};
  for (const item of list) {
    const day = item.dt_txt.split(' ')[0];
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(item);
  }

  return Object.entries(byDay).slice(0, days).map(([date, items]) => {
    const temps = items.map(i => i.main.temp);
    const rainItems = items.filter(i => i.rain && i.rain['3h'] > 0);
    const dominant = items[Math.floor(items.length / 2)]; // midday slot
    return {
      date,
      condition: dominant.weather[0].main,
      description: dominant.weather[0].description,
      tempC: Math.round(dominant.main.temp),
      tempMinC: Math.round(Math.min(...temps)),
      tempMaxC: Math.round(Math.max(...temps)),
      humidity: dominant.main.humidity,
      rain: rainItems.length > 0,
      rainMm: rainItems.reduce((s, i) => s + (i.rain?.['3h'] || 0), 0),
      icon: dominant.weather[0].icon,
      windKph: Math.round(dominant.wind.speed * 3.6),
      isMock: false,
    };
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * getWeatherForecast(city, startDate, days)
 * Returns an array of daily weather objects.
 * Falls back to mock data if no API key or API fails.
 */
async function getWeatherForecast(city, startDate, days = 7) {
  const key = process.env.OPENWEATHERMAP_KEY;
  if (!key || key === 'your_openweathermap_key') {
    console.log('[Weather] No API key — using mock weather data.');
    return mockWeather(city, startDate, days);
  }
  try {
    return await fetchRealWeather(city, days);
  } catch (err) {
    console.warn(`[Weather] API error for ${city}: ${err.message} — falling back to mock.`);
    return mockWeather(city, startDate, days);
  }
}

/**
 * shouldPreferIndoor(dayWeather)
 * Returns true if weather conditions suggest preferring indoor activities.
 * Used by the route optimizer to filter candidates.
 */
function shouldPreferIndoor(dayWeather) {
  if (!dayWeather) return false;
  return dayWeather.rain || dayWeather.rainMm > 5 ||
    ['Thunderstorm', 'Snow', 'Squall', 'Tornado'].includes(dayWeather.condition);
}

/**
 * getWeatherSummary(forecast)
 * Returns a short text summary of the overall weather for LLM context.
 */
function getWeatherSummary(forecast) {
  if (!forecast || forecast.length === 0) return 'Weather information unavailable.';
  const rainy = forecast.filter(d => d.rain).length;
  const avgTemp = Math.round(forecast.reduce((s, d) => s + d.tempC, 0) / forecast.length);
  const parts = [`Average temperature: ${avgTemp}°C`];
  if (rainy > 0) parts.push(`${rainy} day(s) with rain expected`);
  else parts.push('Mostly dry weather expected');
  const source = forecast[0]?.isMock ? ' (simulated data — add OPENWEATHERMAP_KEY for real forecast)' : ' (OpenWeatherMap)';
  return parts.join(', ') + '.' + source;
}

module.exports = { getWeatherForecast, shouldPreferIndoor, getWeatherSummary };
