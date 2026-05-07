import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('ff_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [initializing, setInit] = useState(true);

  /* ── Re-hydrate session on mount ──
     CRITICAL: Only clear token if we get a definite 401 (token truly invalid/expired).
     Network errors, 429 rate-limit, 500 server errors must NOT log the user out —
     just keep the locally-stored user and let them continue.
  ── */
  useEffect(() => {
    const token = localStorage.getItem('ff_token');
    if (!token) { setInit(false); return; }

    api.getMe()
      .then(res => {
        if (res?.user) saveUser(res.user);
      })
      .catch((err) => {
        // Only destroy the session if the token is genuinely rejected (401)
        // 429 rate-limit, 500 server error, network failure → keep session alive
        const msg = err?.message || '';
        const isRealAuthFailure =
          msg.includes('Unauthorized') ||
          msg.includes('Token expired') ||
          msg.includes('Invalid token') ||
          msg.includes('User not found') ||
          msg.includes('Token revoked');

        if (isRealAuthFailure) {
          localStorage.removeItem('ff_token');
          localStorage.removeItem('ff_refresh');
          localStorage.removeItem('ff_user');
          saveUser(null);
        }
        // else: keep existing user state — network hiccup or rate limit
      })
      .finally(() => setInit(false));
  }, []); // eslint-disable-line

  const saveUser = (u) => {
    setUser(u);
    if (u) localStorage.setItem('ff_user', JSON.stringify(u));
    else   localStorage.removeItem('ff_user');
  };

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('ff_token',   res.tokens.access);
      localStorage.setItem('ff_refresh', res.tokens.refresh);
      saveUser(res.user);
      return res;
    } finally { setLoading(false); }
  }, []);

  /* ── Logout ── */
  const logout = useCallback(async () => {
    try { await api.logout(); } catch {}
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_refresh');
    localStorage.removeItem('ff_user');
    saveUser(null);
  }, []);

  /* ── Password ── */
  const forgotPassword = useCallback((email) => api.forgotPassword({ email }), []);

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    setLoading(true);
    try { return await api.resetPassword({ email, otp, newPassword }); }
    finally { setLoading(false); }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      await api.setPassword({ currentPassword, newPassword });
      saveUser({ ...user, mustChangePassword: false });
      return { success: true };
    } finally { setLoading(false); }
  }, [user]);

  /* ── KYC ──
     After upload, refresh user state to get kyc.status='pending'.
     If getMe() fails for any reason (network, rate-limit), manually
     update kycStatus in state so the UI reflects the submission.
  ── */
  const uploadKyc = useCallback(async (formData) => {
    setLoading(true);
    try {
      const res = await api.uploadKyc(formData);
      // Try to get fresh user state from server
      try {
        const fresh = await api.getMe();
        if (fresh?.user) {
          saveUser(fresh.user);
        }
      } catch {
        // Server refresh failed — update state locally so UI doesn't get stuck
        setUser(prev => prev ? {
          ...prev,
          kyc: {
            ...(prev.kyc || {}),
            status:      'pending',
            submittedAt: new Date().toISOString(),
          },
        } : prev);
        // Also update localStorage
        const stored = localStorage.getItem('ff_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.kyc = { ...(parsed.kyc || {}), status: 'pending', submittedAt: new Date().toISOString() };
            localStorage.setItem('ff_user', JSON.stringify(parsed));
          } catch {}
        }
      }
      return res;
    } finally { setLoading(false); }
  }, []);

  /* ── GST verify ── */
  const verifyGst = useCallback((gstNumber) => api.verifyGst({ gstNumber }), []);

  /* ── Refresh user from server ── */
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res?.user) { saveUser(res.user); return res.user; }
    } catch {} // silent — don't break UI on refresh failure
  }, []);

  /* ── Derived state ── */
  const kycStatus         = user?.kyc?.status || 'not_submitted';
  const isKycApproved     = kycStatus === 'approved';
  const isPendingApproval = user?.status === 'pending_approval';
  const isActive          = user?.status === 'active';
  const mustChangePassword = user?.mustChangePassword || false;

  return (
    <AuthContext.Provider value={{
      user, loading, initializing,
      login, logout,
      forgotPassword, resetPassword, changePassword,
      uploadKyc, verifyGst, refreshUser,
      kycStatus, isKycApproved, isActive, isPendingApproval, mustChangePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
