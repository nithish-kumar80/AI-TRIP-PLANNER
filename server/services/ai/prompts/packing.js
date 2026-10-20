exports.buildPackingPrompt = ({ destination, duration, activities, weather, season }) => {
  return `You are an expert travel packing consultant. Generate a comprehensive, categorized packing checklist.

Trip Details:
- Destination: ${destination}
- Duration: ${duration} days
- Activities: ${activities && activities.length ? activities.join(', ') : 'general sightseeing'}
- Weather/Climate: ${weather || 'temperate'}
- Season: ${season || 'unknown'}

Return ONLY a valid JSON object:
{
  "checklist": {
    "clothes": ["string array - specific clothing items"],
    "electronics": ["string array - devices and accessories"],
    "medicines": ["string array - health essentials"],
    "documents": ["string array - important documents"],
    "accessories": ["string array - travel accessories"]
  },
  "tips": ["string array of 5 packing tips"],
  "totalItems": number,
  "luggageRecommendation": "string - what type of luggage to bring"
}

Return ONLY the JSON, no markdown.`;
};
