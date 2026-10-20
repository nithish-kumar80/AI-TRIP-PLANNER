const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { generateBookingReference } = require('../utils/helpers');
const { sendBookingConfirmationEmail } = require('../utils/mailer');
const { AppError } = require('../middleware/errorHandler');
const { v4: uuidv4 } = require('uuid');

// ─── Create booking (simulated — no real hotel reservation) ──────────────────
exports.createBooking = async (userId, userEmail, userName, data) => {
  const {
    hotelId, roomId, checkIn, checkOut,
    guests, specialRequests, paymentMethod, guestDetails,
  } = data;

  // 1. Validate hotel
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new AppError('Hotel not found.', 404);
  if (!hotel.isActive) throw new AppError('This hotel is currently unavailable.', 400);

  // 2. Validate room
  const room = await Room.findOne({ _id: roomId, hotel: hotelId });
  if (!room) throw new AppError('Room not found for this hotel.', 404);
  if (!room.isAvailable || room.availableRooms < 1) {
    throw new AppError('No rooms available. Please try a different room type.', 400);
  }

  // 3. Validate dates
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  if (isNaN(checkInDate) || isNaN(checkOutDate)) {
    throw new AppError('Invalid check-in or check-out date.', 400);
  }
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (checkInDate < today) throw new AppError('Check-in date cannot be in the past.', 400);
  if (checkOutDate <= checkInDate) throw new AppError('Check-out must be after check-in.', 400);

  // 4. Calculate price (always from DB — never trust client price)
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  if (nights < 1) throw new AppError('Minimum stay is 1 night.', 400);

  const pricePerNight = room.pricePerNight;
  const totalAmount = pricePerNight * nights;
  const taxes = Math.round(totalAmount * 0.12); // 12% GST
  const finalAmount = totalAmount + taxes;

  // 5. Generate unique booking reference: HTL-YYYYMMDD-XXXXXX
  const bookingReference = generateBookingReference();

  // 6. Save booking to MongoDB (simulated — status: confirmed)
  const booking = await Booking.create({
    user: userId,
    hotel: hotelId,
    room: roomId,
    bookingReference,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    guests: guests || { adults: 1, children: 0 },
    pricePerNight,
    totalAmount,
    taxes,
    finalAmount,
    currency: hotel.currency || 'INR',
    status: 'confirmed',
    paymentStatus: 'paid',
    paymentMethod: paymentMethod || 'card',
    guestDetails: guestDetails || { name: userName, email: userEmail },
    specialRequests: specialRequests || '',
  });

  // 7. Decrease available rooms (simulated inventory)
  await Room.findByIdAndUpdate(roomId, { $inc: { availableRooms: -1 } });

  // 8. Create payment record
  try {
    await Payment.create({
      user: userId,
      booking: booking._id,
      transactionId: `TXN-${uuidv4().slice(0, 12).toUpperCase()}`,
      amount: finalAmount,
      currency: hotel.currency || 'INR',
      status: 'success',
      method: paymentMethod || 'card',
    });
  } catch (e) {
    console.warn('[Booking] Payment record creation failed (non-critical):', e.message);
  }

  // 9. Create in-app notification
  try {
    await Notification.create({
      user: userId,
      type: 'booking_confirmed',
      title: 'Booking Confirmed! 🎉',
      message: `Your booking at ${hotel.name} is confirmed. Ref: ${bookingReference}`,
      actionUrl: '/bookings',
      metadata: { bookingId: booking._id, hotelName: hotel.name },
    });
  } catch (e) {
    console.warn('[Booking] Notification creation failed (non-critical):', e.message);
  }

  // 10. Send confirmation email — non-blocking, booking is valid even if email fails
  const emailData = {
    ...booking.toObject(),
    hotelName: hotel.name,
    hotelCity: hotel.city,
    hotelCoverImage: hotel.coverImage,
    roomName: room.name,
    roomType: room.roomType,
    finalAmount,
  };
  sendBookingConfirmationEmail(
    guestDetails?.email || userEmail,
    guestDetails?.name || userName,
    emailData,
  ).catch((err) => {
    console.error('[Booking] Confirmation email failed (booking still valid):', err.message);
  });

  // 11. Return populated booking
  return booking.populate([
    { path: 'hotel', select: 'name coverImage address city averageRating pricePerNight' },
    { path: 'room', select: 'name roomType pricePerNight images bedType maxOccupancy' },
  ]);
};

// ─── Get user's bookings (paginated) ─────────────────────────────────────────
exports.getUserBookings = async (userId, query = {}) => {
  const { page = 1, limit = 10, status } = query;
  const filter = { user: userId };
  if (status && status !== 'all') filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('hotel', 'name coverImage address city averageRating')
      .populate('room', 'name roomType pricePerNight images bedType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  };
};

// ─── Get single booking by ID (owner only) ───────────────────────────────────
exports.getBookingById = async (bookingId, userId) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId })
    .populate('hotel', 'name coverImage address city averageRating starRating amenities')
    .populate('room', 'name roomType pricePerNight images bedType maxOccupancy');
  if (!booking) throw new AppError('Booking not found.', 404);
  return booking;
};

// ─── Cancel booking (owner only) ─────────────────────────────────────────────
exports.cancelBooking = async (bookingId, userId, reason) => {
  const booking = await Booking.findOne({ _id: bookingId, user: userId });
  if (!booking) throw new AppError('Booking not found.', 404);

  if (['cancelled', 'refunded', 'checked_out'].includes(booking.status)) {
    throw new AppError(`Booking cannot be cancelled. Current status: ${booking.status}`, 400);
  }

  booking.status = 'cancelled';
  booking.paymentStatus = 'refunded';
  booking.cancellationReason = reason || 'Cancelled by user';
  booking.cancelledAt = new Date();
  await booking.save();

  // Restore available rooms
  await Room.findByIdAndUpdate(booking.room, { $inc: { availableRooms: 1 } }).catch(() => {});

  // Create cancellation notification
  const hotel = await Hotel.findById(booking.hotel);
  try {
    await Notification.create({
      user: userId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking at ${hotel?.name || 'hotel'} (${booking.bookingReference}) has been cancelled. Refund will be processed within 5-7 business days.`,
    });
  } catch (e) {
    console.warn('[Booking] Cancellation notification failed (non-critical):', e.message);
  }

  return booking;
};
