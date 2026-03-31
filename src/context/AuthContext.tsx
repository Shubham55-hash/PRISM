import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';

interface User {
  id: string;
  prismId: string;
  fullName: string;
  displayName: string;
  email: string;
  trustScore: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('prism_token'));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('prism_token'));

  useEffect(() => {
    if (token) {
      api.get<any>('/api/auth/me')
        .then(res => setUser(res.data.data.user))
        .catch(() => {
          localStorage.removeItem('prism_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<any>('/api/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data.data;
    localStorage.setItem('prism_token', accessToken);
    if (refreshToken) localStorage.setItem('prism_refresh', refreshToken);
    
    // Share token with extension
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'SET_TOKEN',
          token: accessToken
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('[PRISM] Extension not connected, token will be set manually');
          }
        });
      } catch (err) {
        console.log('[PRISM] Extension messaging failed');
      }
    }
    
    setToken(accessToken);
    setUser(user);
  }, []);

  const register = useCallback(async (data: any) => {
    const res = await api.post<any>('/api/auth/register', data);
    const { accessToken, refreshToken, user } = res.data.data;
    localStorage.setItem('prism_token', accessToken);
    if (refreshToken) localStorage.setItem('prism_refresh', refreshToken);
    
    // Share token with extension
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'SET_TOKEN',
          token: accessToken
        }, () => {
          if (chrome.runtime.lastError) {
            console.log('[PRISM] Extension not connected, token will be set manually');
          }
        });
      } catch (err) {
        console.log('[PRISM] Extension messaging failed');
      }
    }
    
    setToken(accessToken);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('prism_token');
    localStorage.removeItem('prism_refresh');
    setToken(null);
    setUser(null);
    api.post('/api/auth/logout').catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
