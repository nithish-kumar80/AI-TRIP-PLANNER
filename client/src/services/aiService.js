import api from './api';

export const aiService = {
  // Trip planning — TripPlannerPage calls this
  generatePlan: (data) => api.post('/ai/plan', data),

  // Chat — ChatPage calls this
  chat: (data) => api.post('/ai/chat', data),           // { message, sessionId }
  getChatHistory: () => api.get('/ai/chat/history'),
  getChatSession: (sessionId) => api.get(`/ai/chat/${sessionId}`),
  deleteChatSession: (sessionId) => api.delete(`/ai/chat/${sessionId}`),

  // Budget & Packing — BudgetPage calls these
  generateBudget: (data) => api.post('/ai/budget', data),
  generatePacking: (data) => api.post('/ai/packing', data),

  // Hotel recommendations
  recommendHotels: (data) => api.post('/ai/recommend-hotels', data),
};

export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (formData) =>
    api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getDashboard: () => api.get('/users/dashboard'),
  getFavorites: () => api.get('/favorites'),
  addFavorite: (data) => api.post('/favorites', data),
  removeFavorite: (id) => api.delete(`/favorites/${id}`),
  getNotifications: () => api.get('/notifications'),
  markNotificationRead: (id) => api.put(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/notifications/read-all'),
};
