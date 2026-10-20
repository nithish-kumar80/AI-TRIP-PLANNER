import api from './api';

export const bookingService = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: (params) => api.get('/bookings', { params }),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  // Server accepts PUT /:id/cancel
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
};
