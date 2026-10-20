const bookingService = require('../services/bookingService');
const { AppError } = require('../middleware/errorHandler');

// POST /api/bookings — create a simulated booking
exports.createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(
      req.user._id,
      req.user.email,
      req.user.name,
      req.body,
    );
    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings — list current user's bookings
exports.getBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getUserBookings(req.user._id, req.query);
    return res.status(200).json({
      success: true,
      data: {
        bookings: result.bookings,
        total: result.total,
        page: result.page,
        pages: result.pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id — get single booking (owner only)
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user._id);
    return res.status(200).json({ success: true, data: { booking } });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/cancel — cancel a booking (owner only)
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user._id,
      req.body.reason,
    );
    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: { booking },
    });
  } catch (error) {
    next(error);
  }
};
