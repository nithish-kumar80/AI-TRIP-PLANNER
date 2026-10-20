const tripService = require('../services/tripService');

exports.createTrip = async (req, res, next) => {
  try {
    // tripService.createTrip expects (userId, data) — correct order
    const trip = await tripService.createTrip(req.user._id, req.body);
    // Frontend reads: res.data.data.trip._id
    return res.status(201).json({ success: true, data: { trip } });
  } catch (error) {
    next(error);
  }
};

exports.getTrips = async (req, res, next) => {
  try {
    const result = await tripService.getUserTrips(req.user._id, req.query);
    return res.status(200).json({
      success: true,
      data: {
        trips: result.trips,
        total: result.total,
        page: result.page,
        pages: result.pages,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTrip = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id, req.user._id);
    return res.status(200).json({ success: true, data: { trip } });
  } catch (error) {
    next(error);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.user._id, req.body);
    return res.status(200).json({ success: true, data: { trip } });
  } catch (error) {
    next(error);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user._id);
    return res.status(200).json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    next(error);
  }
};
