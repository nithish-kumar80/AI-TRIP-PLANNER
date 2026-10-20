const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', bookingController.createBooking);
router.get('/', bookingController.getBookings);
router.get('/:id', bookingController.getBooking);

// Accept both PUT and PATCH for cancel (client uses PUT, spec says PATCH)
router.put('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);

module.exports = router;
