import axios from 'axios';
import { showError, getErrorMessage } from '../utils/errorHandler';
import { API_BASE } from '../config/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = getErrorMessage(err);
    showError(message);
    return Promise.reject(err);
  }
);

export const billAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getById: (id) => api.get(`/bills/${id}`),
  getStats: () => api.get('/bills/stats'),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  getPdfUrl: (id) => `${API_BASE}/bills/${id}/pdf`,
};

export default api;
