const Trip = require('../models/Trip');
const { AppError } = require('../middleware/errorHandler');
const geminiService = require('./ai/geminiService');

exports.createTrip = async (userId, data) => {
  const trip = await Trip.create({ user: userId, ...data });
  return trip;
};

exports.generateAITrip = async (userId, params) => {
  const aiData = await geminiService.generateItinerary(params);
  const trip = await Trip.create({
    user: userId,
    destination: params.destination,
    budget: params.budget,
    travelers: params.travelers,
    duration: params.duration,
    interests: params.interests,
    transportationMode: params.transportationMode,
    currency: params.currency || 'INR',
    title: aiData.title,
    overview: aiData.overview,
    highlights: aiData.highlights,
    itinerary: aiData.itinerary,
    budgetBreakdown: aiData.budgetBreakdown,
    recommendedHotels: aiData.recommendedHotels,
    recommendedRestaurants: aiData.recommendedRestaurants,
    travelTips: aiData.travelTips,
    packingChecklist: aiData.packingChecklist,
    destinationCoordinates: aiData.destinationCoordinates,
    weatherInfo: aiData.weatherInfo,
    aiGenerated: true,
    isSaved: false,
  });
  return trip;
};

exports.getUserTrips = async (userId, query = {}) => {
  const { page = 1, limit = 10, status, search } = query;
  const filter = { user: userId };
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { destination: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [trips, total] = await Promise.all([
    Trip.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Trip.countDocuments(filter),
  ]);

  return { trips, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) };
};

exports.getTripById = async (tripId, userId) => {
  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) throw new AppError('Trip not found.', 404);
  return trip;
};

exports.updateTrip = async (tripId, userId, data) => {
  const trip = await Trip.findOneAndUpdate(
    { _id: tripId, user: userId },
    { ...data },
    { new: true, runValidators: true }
  );
  if (!trip) throw new AppError('Trip not found.', 404);
  return trip;
};

exports.deleteTrip = async (tripId, userId) => {
  const trip = await Trip.findOneAndDelete({ _id: tripId, user: userId });
  if (!trip) throw new AppError('Trip not found.', 404);
};

exports.regenerateItinerary = async (tripId, userId, overrides = {}) => {
  const trip = await Trip.findOne({ _id: tripId, user: userId });
  if (!trip) throw new AppError('Trip not found.', 404);

  const params = {
    destination: overrides.destination || trip.destination,
    budget: overrides.budget || trip.budget,
    travelers: overrides.travelers || trip.travelers,
    duration: overrides.duration || trip.duration,
    interests: overrides.interests || trip.interests,
    transportationMode: overrides.transportationMode || trip.transportationMode,
    currency: trip.currency || 'INR',
  };

  const aiData = await geminiService.generateItinerary(params);
  Object.assign(trip, {
    title: aiData.title,
    overview: aiData.overview,
    highlights: aiData.highlights,
    itinerary: aiData.itinerary,
    budgetBreakdown: aiData.budgetBreakdown,
    recommendedHotels: aiData.recommendedHotels,
    recommendedRestaurants: aiData.recommendedRestaurants,
    travelTips: aiData.travelTips,
    packingChecklist: aiData.packingChecklist,
    destinationCoordinates: aiData.destinationCoordinates,
    weatherInfo: aiData.weatherInfo,
    ...overrides,
  });
  await trip.save();
  return trip;
};
