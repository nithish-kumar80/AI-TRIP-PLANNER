import api from './api';

export const tripService = {
  createTrip: (data) => api.post('/trips', data),
  getMyTrips: (params) => api.get('/trips', { params }),
  getTripById: (id) => api.get(`/trips/${id}`),
  updateTrip: (id, data) => api.put(`/trips/${id}`, data),
  deleteTrip: (id) => api.delete(`/trips/${id}`),
  exportPDF: (id) => api.get(`/trips/${id}/export-pdf`, { responseType: 'blob' }),
  regenerateItinerary: (id, data) => api.post(`/trips/${id}/regenerate`, data),
};
