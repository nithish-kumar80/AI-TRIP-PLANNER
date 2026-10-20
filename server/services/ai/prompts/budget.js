exports.buildBudgetPrompt = ({ destination, totalBudget, travelers, duration, travelStyle, currency = 'INR' }) => {
  return `You are an expert travel financial advisor. Create a detailed budget breakdown for this trip.

Trip Details:
- Destination: ${destination}
- Total Budget: ${currency} ${totalBudget}
- Travelers: ${travelers}
- Duration: ${duration} days
- Travel Style: ${travelStyle || 'moderate'}

Return ONLY a valid JSON object:
{
  "totalBudget": number,
  "perPersonBudget": number,
  "breakdown": {
    "hotel": { "amount": number, "percentage": number, "perNight": number, "reasoning": "string" },
    "transport": { "amount": number, "percentage": number, "reasoning": "string" },
    "food": { "amount": number, "percentage": number, "perDay": number, "reasoning": "string" },
    "shopping": { "amount": number, "percentage": number, "reasoning": "string" },
    "entertainment": { "amount": number, "percentage": number, "reasoning": "string" },
    "emergency": { "amount": number, "percentage": number, "reasoning": "string" }
  },
  "savingTips": ["string array of 5 money-saving tips for this destination"],
  "currency": "${currency}",
  "budgetLevel": "budget/moderate/luxury",
  "dailyBudget": number,
  "summary": "string - brief analysis of whether budget is sufficient"
}

Return ONLY the JSON, no markdown.`;
};
