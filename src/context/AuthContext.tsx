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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('prism_token'));
  const [isLoading, setIsLoading] = useState(!!localStorage.getItem('prism_token'));

  // Auto-login with stored token
  useEffect(() => {
    if (token) {
      api.get<User>('/api/identity')
        .then(identity => setUser(identity as any))
        .catch(() => {
          localStorage.removeItem('prism_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: User }>('/api/auth/login', { email, password });
    localStorage.setItem('prism_token', res.accessToken);
    localStorage.setItem('prism_refresh', res.refreshToken);
    setToken(res.accessToken);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('prism_token');
    localStorage.removeItem('prism_refresh');
    setToken(null);
    setUser(null);
    api.post('/api/auth/logout').catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
