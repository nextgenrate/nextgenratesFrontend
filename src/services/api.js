import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'https://nextgenratesbackend-production.up.railway.app/api';

const api = axios.create({ baseURL: BASE, withCredentials: true });

/* ── Attach token to every request ── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ff_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/* ── Response interceptor ──
   ONLY redirect to /login when we get a 401 AND the request was NOT:
   - a file upload (kyc/upload, registration/submit)
   - the /auth/me hydration call (handled by AuthContext itself)
   - an auth route (login, forgot-password etc.)
   
   Do NOT clear tokens or redirect for 429 (rate limit), 403 (forbidden),
   400 (bad request), 422 (validation), or 500 (server error).
   Those are real errors the UI should display to the user.
── */
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const status  = err.response?.status;
    const url     = err.config?.url || '';
    const message = err.response?.data?.message || err.message || 'Request failed';

    if (status === 401) {
      // Never clear token/redirect for these paths — let the caller handle it
      const skipRedirect =
        url.includes('/kyc/upload') ||
        url.includes('/kyc/verify-gst') ||
        url.includes('/registration/submit') ||
        url.includes('/auth/me') ||
        url.includes('/auth/login');

      if (!skipRedirect) {
        localStorage.removeItem('ff_token');
        localStorage.removeItem('ff_refresh');
        localStorage.removeItem('ff_user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

/* ── Auth ── */
export const login          = (d) => api.post('/auth/login', d);
export const logout         = ()  => api.post('/auth/logout');
export const verifyEmail    = (d) => api.post('/auth/verify-email', d);
export const resendOtp      = (d) => api.post('/auth/resend-otp', d);
export const forgotPassword = (d) => api.post('/auth/forgot-password', d);
export const resetPassword  = (d) => api.post('/auth/reset-password', d);
export const setPassword    = (d) => api.post('/auth/set-password', d);
export const getMe          = ()  => api.get('/auth/me');

/* ── Registration ── */
export const sendRegistrationOtp   = (d)  => api.post('/auth/registration/send-otp', d);
export const verifyRegistrationOtp = (d)  => api.post('/auth/registration/verify-otp', d);
export const submitRegistration    = (fd) => api.post('/auth/registration/submit', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

/* ── KYC ── */
export const uploadKyc    = (fd) => api.post('/kyc/upload', fd, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getKycStatus = ()  => api.get('/kyc/status');
export const verifyGst    = (d) => api.post('/kyc/verify-gst', d);

/* ── Rates ── */
export const searchRates   = (d) => api.post('/rates/search', d);
export const getRateById   = (id) => api.get(`/rates/${id}`);
export const searchPorts = ({ q = '', type = 'sea', limit = 100 } = {}) =>
  api.get('/rates/ports/search', { params: { q, type, limit } });
export const getLoadTypes  = ()   => api.get('/rates/meta/load-types');
export const sendRateEmail = (d)  => api.post('/rates/send-email', d);

/* ── Bookings ── */
export const createBooking = (d)  => api.post('/bookings', d);
export const getBookings   = (p)  => api.get('/bookings', { params: p });
export const getBooking    = (id) => api.get(`/bookings/${id}`);

/* ── Enquiries ── */
export const createEnquiry = (d) => api.post('/bookings/enquiries', d);
export const getEnquiries  = (p) => api.get('/bookings/enquiries', { params: p });

/* ── Profile ── */
export const updateProfile = (d) => api.put('/auth/profile', d);

export default api;
