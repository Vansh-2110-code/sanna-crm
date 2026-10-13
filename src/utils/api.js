import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-inject Authorization Token and Tenant ID into headers from sessionStorage or localStorage (durable persistence)
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('astra_token') || localStorage.getItem('astra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const activeTenant = sessionStorage.getItem('crm_active_tenant') || localStorage.getItem('crm_active_tenant');
  if (activeTenant) {
    config.headers['x-tenant-id'] = activeTenant;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthPath = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
      const errDetail = String(error.response?.data?.error || '').toLowerCase();
      if (!isAuthPath && (errDetail.includes('invalid') || errDetail.includes('expired'))) {
        console.warn('Session expired or invalid token. Clearing credentials.');
        sessionStorage.removeItem('astra_token');
        sessionStorage.removeItem('astra_user');
        localStorage.removeItem('astra_token');
        localStorage.removeItem('astra_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
