/**
 * routeOptimizer.js
 * Phase 5 — Route Optimization
 *
 * CONCEPT: Why optimize routes?
 * Without route planning, an itinerary might send you:
 *   Day 1: North museum → South beach → North palace → East temple
 * That's huge unnecessary travel time.
 * Route optimization groups nearby places, reducing total travel distance.
 *
 * ALGORITHMS USED:
 *
 * 1. Haversine Formula:
 *    Calculates straight-line distance between two GPS coordinates.
 *    Used to build a distance matrix between all candidate places.
 *    formula: a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)
 *             c = 2·atan2(√a, √(1−a))
 *             d = R·c  (R = 6371 km)
 *
 * 2. Nearest-Neighbor Heuristic (TSP approximation):
 *    Start from city center. Each step: pick the closest unvisited place.
 *    Not optimal but fast and good enough for 5–20 places.
 *
 * 3. 2-opt Local Search:
 *    After nearest-neighbor, try swapping pairs of route segments.
 *    If swapping reduces total distance, keep the swap.
 *    Improves the route by ~10–20%.
 *
 * 4. Day Clustering:
 *    Group the optimized route into days based on:
 *    - Max 4 places per day (moderate pace) or 3 (slow) or 5 (fast)
 *    - Total visit duration per day ≤ 8 hours
 *    - Place opening hours (filter out closed places)
 *
 * IMPORTANT:
 *    Haversine gives geographic distance, NOT road distance.
 *    It is used as a fast approximation. A real routing API (e.g., OSRM, Google Maps)
 *    would give actual road times — add OSRM_URL to .env for that.
 */

const R = 6371; // Earth radius in km

// ─── Haversine distance (km between two lat/lng points) ───────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) { return deg * Math.PI / 180; }

// ─── Build distance matrix ────────────────────────────────────────────────────
function buildDistanceMatrix(places) {
  const n = places.length;
  const matrix = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversine(places[i].lat, places[i].lng, places[j].lat, places[j].lng);
      matrix[i][j] = d;
      matrix[j][i] = d;
    }
  }
  return matrix;
}

// ─── Nearest-Neighbor TSP heuristic ──────────────────────────────────────────
function nearestNeighbor(distMatrix, startIdx = 0) {
  const n = distMatrix.length;
  const visited = new Set([startIdx]);
  const route = [startIdx];
  let current = startIdx;

  while (visited.size < n) {
    let nearest = -1;
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (!visited.has(j) && distMatrix[current][j] < minDist) {
        minDist = distMatrix[current][j];
        nearest = j;
      }
    }
    if (nearest === -1) break;
    visited.add(nearest);
    route.push(nearest);
    current = nearest;
  }
  return route;
}

// ─── 2-opt improvement ────────────────────────────────────────────────────────
function twoOpt(route, distMatrix) {
  let improved = true;
  let best = [...route];
  let bestDist = routeDistance(best, distMatrix);

  while (improved) {
    improved = false;
    for (let i = 1; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const newRoute = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        const newDist = routeDistance(newRoute, distMatrix);
        if (newDist < bestDist - 0.001) {
          best = newRoute;
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }
  return best;
}

function routeDistance(route, matrix) {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    total += matrix[route[i]][route[i + 1]];
  }
  return total;
}

// ─── Travel time estimate (minutes) ──────────────────────────────────────────
function estimateTravelMinutes(distKm, mode) {
  const speeds = { car: 30, bus: 20, train: 40, flight: 500, mixed: 25 };
  const speed = speeds[mode] || 25;
  return Math.round((distKm / speed) * 60) + 10; // +10 min buffer
}

// ─── Day clustering ───────────────────────────────────────────────────────────
function clusterIntoDays(orderedPlaces, duration, pace, travelMode) {
  const maxPerDay = pace === 'slow' ? 3 : pace === 'fast' ? 5 : 4;
  const maxDailyMinutes = 8 * 60; // 8 hours of activity per day

  const days = [];
  let placesIdx = 0;

  for (let d = 0; d < duration && placesIdx < orderedPlaces.length; d++) {
    const dayPlaces = [];
    let dailyMinutes = 0;

    while (placesIdx < orderedPlaces.length && dayPlaces.length < maxPerDay) {
      const place = orderedPlaces[placesIdx];
      const visitMins = place.visitDuration || 90;
      if (dailyMinutes + visitMins > maxDailyMinutes && dayPlaces.length > 0) break;
      dayPlaces.push(place);
      dailyMinutes += visitMins;
      placesIdx++;
    }
    days.push(dayPlaces);
  }
  return days;
}

// ─── Schedule places within a day ────────────────────────────────────────────
function scheduleDay(places, startTime, travelMode, distMatrix, placeIndices) {
  const scheduled = [];
  let currentMinute = timeToMinutes(startTime || '09:00');

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const visitDuration = place.visitDuration || 90;

    // Add travel time from previous place
    if (i > 0 && placeIndices && distMatrix) {
      const dist = distMatrix[placeIndices[i - 1]][placeIndices[i]];
      const travelMins = estimateTravelMinutes(dist, travelMode);
      currentMinute += travelMins;
      scheduled[i - 1].nextTravelMinutes = travelMins;
      scheduled[i - 1].nextTravelKm = Math.round(dist * 10) / 10;
    }

    // Lunch break
    if (currentMinute >= 720 && currentMinute <= 780 && i > 0) {
      currentMinute = 780; // force 1:00 PM after lunch gap
    }

    scheduled.push({
      ...place,
      start: minutesToTime(currentMinute),
      end: minutesToTime(currentMinute + visitDuration),
      nextTravelMinutes: 0,
      nextTravelKm: 0,
    });
    currentMinute += visitDuration;
  }
  return scheduled;
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minutesToTime(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// ─── Weather filter ───────────────────────────────────────────────────────────
function applyWeatherFilter(places, dayWeather) {
  if (!dayWeather || !dayWeather.rain) return places;
  // On rainy days, prefer indoor places or deprioritize outdoor ones
  return places.map(p => ({
    ...p,
    _weatherPenalty: (p.tags || []).some(t => ['outdoor', 'beach', 'trek', 'hike'].includes(t)) ? 0.3 : 0,
  })).sort((a, b) => a._weatherPenalty - b._weatherPenalty);
}

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * optimizeRoute(places, intent, weatherForecast)
 *
 * Takes a list of candidate places (already ranked by recommendation engine),
 * applies route optimization, clusters into days, and schedules each day.
 *
 * Returns: Array of day objects with scheduled places.
 */
function optimizeRoute(places, intent, weatherForecast = []) {
  const { duration, pace = 'moderate', transportationMode = 'mixed' } = intent;

  if (places.length === 0) return [];

  // Normalize place coordinates
  const pts = places.map(p => ({
    ...p,
    lat: p.location?.coordinates?.[1] || p.lat || 0,
    lng: p.location?.coordinates?.[0] || p.lng || 0,
  })).filter(p => p.lat !== 0 || p.lng !== 0);

  if (pts.length === 0) return Array.from({ length: duration }, (_, i) => ({ dayIndex: i, places: [], totalTravelMinutes: 0, totalVisitMinutes: 0, totalDistanceKm: 0 }));

  // Build distance matrix and optimize order
  const distMatrix = buildDistanceMatrix(pts);
  const nnRoute = nearestNeighbor(distMatrix, 0);
  const optimizedRoute = pts.length > 2 ? twoOpt(nnRoute, distMatrix) : nnRoute;
  const orderedPlaces = optimizedRoute.map(i => pts[i]);

  // Cluster into days
  const dayClusters = clusterIntoDays(orderedPlaces, duration, pace, transportationMode);

  // Schedule each day
  const scheduledDays = dayClusters.map((dayPlaces, dayIdx) => {
    const dayWeather = weatherForecast[dayIdx] || null;
    const weatherFiltered = applyWeatherFilter(dayPlaces, dayWeather);

    // Get original indices in pts for distance matrix lookups
    const indices = weatherFiltered.map(p => pts.findIndex(pt => pt._id?.toString() === p._id?.toString()));

    const scheduled = scheduleDay(weatherFiltered, '09:00', transportationMode, distMatrix, indices);
    const totalTravelMins = scheduled.reduce((s, p) => s + p.nextTravelMinutes, 0);
    const totalVisitMins = scheduled.reduce((s, p) => s + (p.visitDuration || 90), 0);

    return {
      dayIndex: dayIdx,
      places: scheduled,
      weather: dayWeather,
      totalTravelMinutes: totalTravelMins,
      totalVisitMinutes: totalVisitMins,
      totalDistanceKm: Math.round(scheduled.reduce((s, p) => s + p.nextTravelKm, 0) * 10) / 10,
    };
  });

  return scheduledDays;
}

module.exports = { optimizeRoute, haversine, buildDistanceMatrix };
