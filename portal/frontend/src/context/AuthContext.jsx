import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const response = await api.get('auth/me/');
      setUser(response.data.user);
      if (response.data.profile) setProfile(response.data.profile);
    } catch (err) {
      console.error('Error fetching current user:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCurrentUser(); }, []);

  // Shared handler after any successful auth response
  const _handleAuthSuccess = async (tokens, userData, has_profile) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    setUser(userData);
    if (has_profile && userData.role === 'student') {
      try {
        const meRes = await api.get('auth/me/');
        if (meRes.data.profile) setProfile(meRes.data.profile);
      } catch (_) {}
    }
    return { success: true, hasProfile: has_profile, role: userData.role };
  };

  // Email + Password Sign In
  const emailLogin = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('auth/email/login/', { email, password });
      const { tokens, user: userData, has_profile } = res.data;
      return await _handleAuthSuccess(tokens, userData, has_profile);
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Invalid email or password.' };
    } finally {
      setLoading(false);
    }
  };

  // Email + Password Sign Up
  const emailRegister = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('auth/email/register/', payload);
      const { tokens, user: userData, has_profile } = res.data;
      return await _handleAuthSuccess(tokens, userData, has_profile);
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed.' };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth (mock in dev, real id_token in production)
  const loginWithGoogle = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post('auth/google/', payload);
      const { tokens, user: userData, has_profile } = res.data;
      return await _handleAuthSuccess(tokens, userData, has_profile);
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Google authentication failed.' };
    } finally {
      setLoading(false);
    }
  };

  const onboardStudent = async (profileData) => {
    setLoading(true);
    try {
      const response = await api.post('auth/onboard/', profileData);
      setProfile(response.data.profile);
      await fetchCurrentUser();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data || { error: 'Onboarding failed' } };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      emailLogin, emailRegister, loginWithGoogle,
      onboardStudent, logout, fetchCurrentUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
