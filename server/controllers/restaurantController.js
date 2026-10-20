const Restaurant = require('../models/Restaurant');
const { AppError } = require('../middleware/errorHandler');

// GET /api/restaurants
exports.getRestaurants = async (req, res, next) => {
  try {
    const {
      city, cuisine, priceRange, dietaryOptions,
      mealType, minRating, page = 1, limit = 20, search,
    } = req.query;

    const filter = { isActive: true };
    if (city)          filter.city = { $regex: city, $options: 'i' };
    if (cuisine)       filter.cuisine = { $in: [new RegExp(cuisine, 'i')] };
    if (priceRange)    filter.priceRange = priceRange;
    if (minRating)     filter.rating = { $gte: parseFloat(minRating) };
    if (dietaryOptions) filter.dietaryOptions = { $in: dietaryOptions.split(',') };
    if (mealType)      filter.mealTypes = { $in: [mealType] };
    if (search)        filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { cuisine: { $in: [new RegExp(search, 'i')] } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter).sort({ rating: -1 }).skip(skip).limit(parseInt(limit)),
      Restaurant.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: { restaurants, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

// GET /api/restaurants/:id
exports.getRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) throw new AppError('Restaurant not found.', 404);
    return res.json({ success: true, data: { restaurant } });
  } catch (err) { next(err); }
};

// GET /api/restaurants/city/:city
exports.getRestaurantsByCity = async (req, res, next) => {
  try {
    const { city } = req.params;
    const { limit = 30 } = req.query;
    const restaurants = await Restaurant.find({ city: city.toLowerCase(), isActive: true })
      .sort({ rating: -1 })
      .limit(parseInt(limit));
    return res.json({ success: true, data: { restaurants, count: restaurants.length } });
  } catch (err) { next(err); }
};
