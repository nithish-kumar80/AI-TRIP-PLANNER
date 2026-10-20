exports.buildHotelRecommendPrompt = ({ destination, budget, travelType, amenities, currency = 'INR' }) => {
  return `You are an expert hotel consultant. Recommend 5 hotels that perfectly match the traveler's needs.

Travel Details:
- Destination: ${destination}
- Budget per night: ${currency} ${budget}
- Travel Type: ${travelType || 'leisure'}
- Desired Amenities: ${amenities && amenities.length ? amenities.join(', ') : 'standard amenities'}

Return ONLY a valid JSON object with this exact structure:
{
  "hotels": [
    {
      "name": "string - hotel name",
      "address": "string - full address",
      "city": "string",
      "starRating": number,
      "averageRating": number,
      "pricePerNight": number,
      "amenities": ["string array"],
      "description": "string - 2 sentence description",
      "whyRecommended": "string - why this hotel matches the user's needs",
      "coordinates": { "lat": number, "lng": number },
      "images": [],
      "hotelType": "hotel/resort/boutique/hostel/villa",
      "highlights": ["string array of 3 key features"]
    }
  ],
  "summary": "string - brief recommendation summary"
}

Return ONLY the JSON, no markdown.`;
};
