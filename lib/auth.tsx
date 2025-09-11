
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User } from '../types';
import * as api from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('skillforge_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const storedToken = localStorage.getItem('skillforge_token');
    if (storedToken) {
      try {
        setIsLoading(true);
        // In a real app, you'd verify the token with a backend
        // Here, we'll decode it (mock) to get user info
        const userProfile = await api.getProfile();
        setUser(userProfile);
        setToken(storedToken);
      } catch (error) {
        console.error("Session expired or invalid", error);
        localStorage.removeItem('skillforge_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    } else {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    api.initMockData(); // Ensure mock data is ready
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, pass: string) => {
    const { token: newToken, user: loggedInUser } = await api.login(email, pass);
    localStorage.setItem('skillforge_token', newToken);
    setToken(newToken);
    setUser(loggedInUser);
  };

  const logout = () => {
    localStorage.removeItem('skillforge_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
