import api from './api';

export const hotelService = {
  searchHotels: (params) => api.get('/hotels', { params }),
  getHotelById: (id) => api.get(`/hotels/${id}`),
  getFeaturedHotels: () => api.get('/hotels/featured'),
  getHotelReviews: (hotelId, params) => api.get(`/reviews/hotel/${hotelId}`, { params }),
  createReview: (data) => api.post('/reviews', data),
};
