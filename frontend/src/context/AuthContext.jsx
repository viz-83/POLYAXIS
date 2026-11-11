import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { getToken, registerUnauthorizedHandler, setToken } from '../api/client';

const AuthContext = createContext(null);

const USER_KEY = 'polyaxis_user';
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // AUTH-06: 60 minutes of inactivity

function loadStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [loading, setLoading] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);
  const idleTimer = useRef(null);

  const logout = useCallback((message) => {
    const token = getToken();
    setToken(null);
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
    if (message) setSessionMessage(message);
    // Tell the server only if there was a session to end, and send the token we just cleared locally.
    if (token) {
      api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler((code) => {
      const message = code === 'SESSION_EXPIRED'
        ? 'Your session has expired. Please log in again.'
        : 'Please log in to continue.';
      logout(message);
    });
  }, [logout]);

  // AUTH-06: reset an idle timer on user activity; force logout after 60 minutes of inactivity.
  useEffect(() => {
    if (!user) return undefined;

    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        logout('You have been signed out after 60 minutes of inactivity.');
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [user, logout]);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setToken(data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setUser(data.user);
      setSessionMessage(null);
      return data.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user && getToken()),
      isAdmin: user?.role === 'Administrator',
      loading,
      login,
      logout,
      sessionMessage,
      clearSessionMessage: () => setSessionMessage(null),
    }),
    [user, loading, login, logout, sessionMessage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
