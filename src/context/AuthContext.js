/**
 * Authentication Context
 * Centralized authentication state management
 * Provides auth state and actions to all components
 */

import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Session-only state (no localStorage persistence)
  const [auth, setAuth] = useState({
    token: null,
    role: null,
    userInfo: null,
    isAuthenticated: false,
  });

  /**
   * Login handler
   * Sets auth state without persisting to localStorage
   */
  const login = useCallback((token, role, userInfo) => {
    setAuth({
      token,
      role,
      userInfo,
      isAuthenticated: true,
    });
  }, []);

  /**
   * Logout handler
   * Clears all auth state
   */
  const logout = useCallback(() => {
    setAuth({
      token: null,
      role: null,
      userInfo: null,
      isAuthenticated: false,
    });
  }, []);

  /**
   * Update user info
   * Used after profile updates
   */
  const updateUserInfo = useCallback((userInfo) => {
    setAuth(prev => ({
      ...prev,
      userInfo: { ...prev.userInfo, ...userInfo },
    }));
  }, []);

  const value = {
    ...auth,
    login,
    logout,
    updateUserInfo,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
