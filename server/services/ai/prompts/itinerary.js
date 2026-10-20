exports.buildItineraryPrompt = ({ destination, budget, travelers, duration, interests, transportationMode, currency = 'INR' }) => {
  // For long trips (> 7 days), use compact mode to fit within token limits
  const isLongTrip = parseInt(duration) > 7;

  const activityDetail = isLongTrip
    ? `{ "time": "HH:MM AM/PM", "activity": "string", "location": "string", "estimatedCost": number, "coordinates": { "lat": number, "lng": number } }`
    : `{ "time": "HH:MM AM/PM", "activity": "string", "location": "string", "description": "1 sentence", "estimatedCost": number, "coordinates": { "lat": number, "lng": number } }`;

  const mealDetail = isLongTrip
    ? `{ "mealType": "breakfast/lunch/dinner", "name": "string", "cuisine": "string", "priceRange": "$/$$/$$$" }`
    : `{ "mealType": "breakfast/lunch/dinner", "name": "string", "cuisine": "string", "priceRange": "$/$$/$$$" }`;

  const compactNote = isLongTrip
    ? `\nIMPORTANT: This is a ${duration}-day trip. Be CONCISE to fit response in tokens:
- Each day: max 3 activities, max 2 meals, short activity names (no descriptions)
- Highlights: exactly 5 items
- travelTips: exactly 5 items
- Packing items: max 3 per category
- Use short strings throughout (< 60 chars each)\n`
    : '';

  return `You are an expert travel planner. Generate a comprehensive travel itinerary.

Trip Details:
- Destination: ${destination}
- Total Budget: ${currency} ${budget}
- Travelers: ${travelers}
- Duration: ${duration} days
- Interests: ${interests && interests.length > 0 ? interests.join(', ') : 'General sightseeing'}
- Transportation: ${transportationMode || 'mixed'}
${compactNote}
Return ONLY a valid JSON object (no markdown, no explanation, no code fences) with this exact structure:
{
  "title": "string",
  "overview": "string - 2 sentences max",
  "highlights": ["5 strings"],
  "weatherInfo": { "season": "string", "avgTemp": "string", "climate": "string" },
  "itinerary": [
    {
      "day": 1,
      "date": "Day 1",
      "title": "string",
      "activities": [ ${activityDetail} ],
      "meals": [ ${mealDetail} ],
      "accommodation": { "name": "string", "address": "string", "checkIn": "string", "checkOut": "string" }
    }
  ],
  "budgetBreakdown": {
    "hotel": number, "transport": number, "food": number,
    "shopping": number, "entertainment": number, "emergency": number
  },
  "recommendedHotels": [
    { "name": "string", "address": "string", "pricePerNight": number, "rating": number, "amenities": ["string"], "whyRecommended": "string" }
  ],
  "recommendedRestaurants": [
    { "name": "string", "cuisine": "string", "priceRange": "string", "rating": number, "address": "string" }
  ],
  "travelTips": ["5 strings"],
  "packingChecklist": {
    "clothes": ["strings"], "electronics": ["strings"],
    "medicines": ["strings"], "documents": ["strings"], "accessories": ["strings"]
  },
  "destinationCoordinates": { "lat": number, "lng": number }
}

Rules:
1. All costs in ${currency}, sum ≈ total budget
2. Include exactly ${duration} days in the itinerary array
3. Return ONLY the JSON — no text before or after`;
};
