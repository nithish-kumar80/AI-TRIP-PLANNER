const Place = require('../models/Place');
const { AppError } = require('../middleware/errorHandler');

// GET /api/places — search places with filters
exports.getPlaces = async (req, res, next) => {
  try {
    const {
      city, category, placeType,
      minRating, page = 1, limit = 20,
      sort = 'popularity:-1', search,
      featured,
    } = req.query;

    const filter = { isActive: true };
    if (city)       filter.city = { $regex: city, $options: 'i' };
    if (category)   filter.category = category;
    if (placeType)  filter.placeType = placeType;
    if (minRating)  filter.rating = { $gte: parseFloat(minRating) };
    if (featured === 'true') filter.isFeatured = true;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const [field, dir] = sort.split(':');
    const sortObj = { [field]: dir === '1' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [places, total] = await Promise.all([
      Place.find(filter).sort(sortObj).skip(skip).limit(parseInt(limit)),
      Place.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: { places, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

// GET /api/places/:id
exports.getPlace = async (req, res, next) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) throw new AppError('Place not found.', 404);
    return res.json({ success: true, data: { place } });
  } catch (err) { next(err); }
};

// GET /api/places/cities — list all cities that have places
exports.getCities = async (req, res, next) => {
  try {
    const cities = await Place.distinct('city', { isActive: true });
    return res.json({ success: true, data: { cities: cities.sort() } });
  } catch (err) { next(err); }
};

// GET /api/places/categories — list all categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Place.distinct('category', { isActive: true });
    return res.json({ success: true, data: { categories } });
  } catch (err) { next(err); }
};

// GET /api/places/city/:city — get all places for a specific city (used by itinerary generator)
exports.getPlacesByCity = async (req, res, next) => {
  try {
    const { city } = req.params;
    const { limit = 50 } = req.query;
    const places = await Place.find({ city: city.toLowerCase(), isActive: true })
      .sort({ popularity: -1 })
      .limit(parseInt(limit));
    return res.json({ success: true, data: { places, count: places.length } });
  } catch (err) { next(err); }
};
