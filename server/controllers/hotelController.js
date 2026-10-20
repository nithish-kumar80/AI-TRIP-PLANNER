const hotelService = require('../services/hotelService');
const { AppError } = require('../middleware/errorHandler');

// GET /api/hotels  — search & list hotels
exports.searchHotels = async (req, res, next) => {
  try {
    const result = await hotelService.searchHotels(req.query);
    // Frontend reads: r.data.data.hotels / r.data.data.total / r.data.data.pages
    return res.status(200).json({
      success: true,
      data: {
        hotels: result.hotels,
        total: result.total,
        page: result.page,
        pages: result.pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hotels/featured
exports.getFeaturedHotels = async (req, res, next) => {
  try {
    const hotels = await hotelService.getFeaturedHotels();
    return res.status(200).json({
      success: true,
      data: { hotels },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hotels/:id  — hotel detail + rooms
exports.getHotel = async (req, res, next) => {
  try {
    const result = await hotelService.getHotelById(req.params.id);
    // Frontend reads: r.data.data.hotel and r.data.data.rooms
    return res.status(200).json({
      success: true,
      data: {
        hotel: result,          // includes .rooms already merged in
        rooms: result.rooms,    // also expose separately for convenience
      },
    });
  } catch (error) {
    next(error);
  }
};
