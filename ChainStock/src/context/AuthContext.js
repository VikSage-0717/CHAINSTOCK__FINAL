import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true while checking stored token on startup
  const [error, setError] = useState(null);

  useEffect(() => {
    bootstrapAuth();
  }, []);

  /**
   * Runs once on app startup:
   * - Checks AsyncStorage for a token
   * - Validates it against the backend
   * - Auto-logs-in if valid, auto-logs-out if invalid/missing
   */
  const bootstrapAuth = async () => {
    try {
      const token = await authService.getToken();

      if (!token) {
        setUser(null);
        return;
      }

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      // Token missing, invalid, or expired -> clear and treat as logged out
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      setUser({ _id: data._id, name: data.name, email: data.email });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (name, email, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await authService.register(name, email, password);
      setUser({ _id: data._id, name: data.name, email: data.email });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await authService.logout();
    setUser(null);
    setIsLoading(false);
  };

  const value = {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
