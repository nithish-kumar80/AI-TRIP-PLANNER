import api from './api';

export const agentService = {
  /**
   * Generate a new trip.
   * Pass either { userText } for natural-language input
   * or { formData: { destination, duration, budget, travelers, interests, transportationMode } }
   */
  generate: (payload) => api.post('/agent/generate', payload),

  /**
   * Modify an existing trip using natural language.
   * { tripId, modificationText, currentIntent }
   */
  modify: (payload) => api.post('/agent/modify', payload),

  /**
   * Confirm a trip (mark as planned/saved).
   * { tripId }
   */
  confirm: (payload) => api.post('/agent/confirm', payload),

  /**
   * Download trip PDF.
   * Returns blob — use responseType blob in caller if needed.
   */
  downloadPDF: (tripId) =>
    api.get(`/trips/${tripId}/pdf`, { responseType: 'blob' }),
};
