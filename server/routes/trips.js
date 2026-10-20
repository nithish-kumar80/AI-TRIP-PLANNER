const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', tripController.createTrip);
router.get('/', tripController.getTrips);
router.get('/:id', tripController.getTrip);
router.put('/:id', tripController.updateTrip);
router.delete('/:id', tripController.deleteTrip);

// PDF download — GET /api/trips/:id/pdf
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const Trip = require('../models/Trip');
    const { generateTripPDF } = require('../utils/pdfGenerator');
    const trip = await Trip.findOne({ _id: req.params.id, user: req.user._id });
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });
    const buffer = await generateTripPDF(trip.toObject());
    const filename = `VoyageAI-${trip.destination.replace(/\s+/g, '-')}-${trip.duration}days.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) { next(err); }
});

module.exports = router;
