import axios from 'axios';

const TOKEN_KEY = 'polyaxis_token';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Broadcast auth failures so AuthContext can log the user out and redirect (AUTH-06).
let onUnauthorized = null;
export function registerUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => {
    // AUTH-06: the server slides the 60-minute inactivity window by handing back a fresh token.
    const fresh = response.headers?.['x-session-token'];
    if (fresh) setToken(fresh);
    return response;
  },
  (error) => {
    // Login and logout 401s are answers, not expired sessions — reacting to them would re-trigger logout
    // (which itself calls /auth/logout) and loop forever.
    const url = String(error.config?.url || '');
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/logout');
    if (error.response?.status === 401 && onUnauthorized && !isAuthCall && getToken()) {
      onUnauthorized(error.response.data?.error?.code);
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.error?.message || fallback;
}

export function apiErrorDetails(error) {
  return error?.response?.data?.error?.details || null;
}

export default api;
