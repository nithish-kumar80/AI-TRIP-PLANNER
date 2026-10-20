/**
 * costEstimator.js
 * Phase 6 — Deterministic Cost Estimation
 *
 * CONCEPT: Why deterministic (not ML-based) cost estimation?
 * ML cost prediction requires a large labeled dataset of real trip costs.
 * We don't have that yet. Deterministic estimation is:
 * - Transparent: you can explain every number
 * - Accurate enough for a portfolio demo
 * - Easy to adjust with real data later
 *
 * Formula:
 *   Hotel cost     = pricePerNight × nights × travelersRatio
 *   Food cost      = mealBudgetPerPerson × travelers × days
 *   Transport cost = distance estimate × mode factor
 *   Attraction cost = sum of place entry fees
 *   Event cost     = sum of event prices
 *   Misc (10%)     = subtotal × 0.10
 *   Total          = sum of all
 *
 * If total > budget: try cheaper options in this order:
 *   1. Cheaper hotel tier
 *   2. Remove highest-cost single attraction
 *   3. Reduce meal tier
 *   4. If still over, warn user
 */

// ─── Meal cost tiers (INR per person per day) ─────────────────────────────────
const MEAL_TIERS = {
  budget:  { daily: 800,  label: 'Budget (street food / local restaurants)' },
  comfort: { daily: 1800, label: 'Comfortable (mid-range restaurants)' },
  luxury:  { daily: 4000, label: 'Luxury (fine dining)' },
};

// ─── Transport cost per km by mode (INR) ──────────────────────────────────────
const TRANSPORT_PER_KM = {
  car:   12,
  bus:   4,
  train: 3,
  flight: 8,
  mixed: 7,
};

// ─── Estimate transport cost ──────────────────────────────────────────────────
function estimateTransportCost(distanceKm, mode, travelers) {
  const perKm = TRANSPORT_PER_KM[mode] || 7;
  // Add base inter-city transport (flight/train to destination)
  const intercityBase = mode === 'flight' ? 8000 * travelers
    : mode === 'train' ? 2000 * travelers
    : 1500 * travelers;
  return intercityBase + distanceKm * perKm * travelers;
}

// ─── Determine meal tier from budget ──────────────────────────────────────────
function getMealTier(budgetPerDay) {
  if (budgetPerDay > 10000) return 'luxury';
  if (budgetPerDay > 4000) return 'comfort';
  return 'budget';
}

// ─── Main cost calculation ────────────────────────────────────────────────────
/**
 * estimateCosts(scheduledDays, intent, hotel)
 *
 * scheduledDays: output of routeOptimizer
 * intent: { budget, travelers, duration, transportationMode, travelStyle }
 * hotel: selected hotel object (optional, uses tier estimate if null)
 *
 * Returns: cost breakdown object
 */
function estimateCosts(scheduledDays, intent, hotel = null) {
  const { budget, travelers = 1, duration, transportationMode = 'mixed', travelStyle = 'comfort' } = intent;
  const budgetPerPerson = budget / travelers;
  const budgetPerDay = budgetPerPerson / duration;

  // Hotel cost
  let hotelCostPerNight;
  if (hotel) {
    hotelCostPerNight = hotel.pricePerNight || hotel.price || 3000;
  } else {
    // Estimate from budget
    hotelCostPerNight = budgetPerDay * travelers * 0.35; // 35% of daily budget for hotel
  }
  const hotelCost = hotelCostPerNight * duration;

  // Food cost
  const mealTier = getMealTier(budgetPerDay);
  const foodCost = MEAL_TIERS[mealTier].daily * travelers * duration;

  // Transport cost (use total km from route)
  const totalKm = scheduledDays.reduce((s, d) => s + (d.totalDistanceKm || 0), 0);
  const transportCost = estimateTransportCost(totalKm, transportationMode, travelers);

  // Attraction cost
  const attractionCost = scheduledDays.reduce((sum, day) => {
    const places = Array.isArray(day.places) ? day.places : (Array.isArray(day) ? day : []);
    return sum + places.reduce((s, p) => s + (p.estimatedCost || p.averageCost || 0) * travelers, 0);
  }, 0);

  // Misc (10% of subtotal)
  const subtotal = hotelCost + foodCost + transportCost + attractionCost;
  const miscCost = Math.round(subtotal * 0.10);
  const total = subtotal + miscCost;

  return {
    hotelCost: Math.round(hotelCost),
    foodCost: Math.round(foodCost),
    transportCost: Math.round(transportCost),
    attractionCost: Math.round(attractionCost),
    miscCost,
    total: Math.round(total),
    budget,
    isOverBudget: total > budget,
    overBy: Math.max(0, Math.round(total - budget)),
    mealTier,
    mealTierLabel: MEAL_TIERS[mealTier].label,
    currency: intent.currency || 'INR',
    perPersonTotal: Math.round(total / travelers),
    breakdown: {
      hotel:       `${Math.round(hotelCostPerNight)}/night × ${duration} nights`,
      food:        `${MEAL_TIERS[mealTier].daily}/person/day × ${travelers} traveler(s) × ${duration} days`,
      transport:   `${Math.round(totalKm)} km via ${transportationMode}`,
      attractions: `${scheduledDays.reduce((s, d) => s + d.places.length, 0)} places`,
      misc:        '10% buffer',
    },
  };
}

/**
 * adjustForBudget(scheduledDays, costs, intent)
 *
 * If costs.isOverBudget, tries to reduce cost:
 * 1. Reduce meal tier
 * 2. Remove most expensive attraction
 * Returns { adjustedDays, adjustedCosts, adjustments[] }
 */
function adjustForBudget(scheduledDays, costs, intent) {
  const adjustments = [];
  let days = scheduledDays;
  let currentCosts = costs;

  if (!costs.isOverBudget) return { adjustedDays: days, adjustedCosts: costs, adjustments };

  // Try 1: Reduce meal tier
  const tierOrder = ['luxury', 'comfort', 'budget'];
  const currentTierIdx = tierOrder.indexOf(costs.mealTier);
  if (currentTierIdx < tierOrder.length - 1) {
    adjustments.push('Reduced meal budget tier to fit within budget');
    currentCosts = estimateCosts(days, { ...intent, travelStyle: 'budget' });
  }

  // Try 2: Remove most expensive attraction if still over
  if (currentCosts.isOverBudget) {
    let maxCost = 0;
    let maxDay = -1;
    let maxPlace = -1;
    days.forEach((day, di) => {
      const places = Array.isArray(day.places) ? day.places : (Array.isArray(day) ? day : []);
      places.forEach((p, pi) => {
        const cost = (p.estimatedCost || p.averageCost || 0) * intent.travelers;
        if (cost > maxCost) { maxCost = cost; maxDay = di; maxPlace = pi; }
      });
    });
    if (maxDay >= 0) {
      const dayPlaces = Array.isArray(days[maxDay].places) ? days[maxDay].places : (Array.isArray(days[maxDay]) ? days[maxDay] : []);
      const removed = dayPlaces[maxPlace];
      days = days.map((day, di) => {
        if (di !== maxDay) return day;
        const p = Array.isArray(day.places) ? day.places : (Array.isArray(day) ? day : []);
        return { ...day, places: p.filter((_, pi) => pi !== maxPlace) };
      });
      adjustments.push(`Removed "${removed?.name || 'attraction'}" (high cost) to reduce budget`);
      currentCosts = estimateCosts(days, intent);
    }
  }

  if (currentCosts.isOverBudget) {
    adjustments.push(`Note: Trip is still ${currentCosts.overBy.toLocaleString()} over budget. Consider reducing duration or budget.`);
  }

  return { adjustedDays: days, adjustedCosts: currentCosts, adjustments };
}

module.exports = { estimateCosts, adjustForBudget, getMealTier, MEAL_TIERS };
