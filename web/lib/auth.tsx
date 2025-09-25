"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './http';

type User = { id: string; email: string; name: string } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = sessionStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        api.setToken(parsed.accessToken);
        setUser(parsed.user);
      }
    }
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const { data } = await api.client.post('/auth/login', { email, password });
      api.setToken(data.accessToken);
      setUser(data.user);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth', JSON.stringify({ accessToken: data.accessToken, user: data.user }));
        window.location.href = '/dashboard';
      }
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signup(email: string, password: string, name: string) {
    setLoading(true);
    try {
      const { data } = await api.client.post('/auth/signup', { email, password, name });
      api.setToken(data.accessToken);
      setUser(data.user);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth', JSON.stringify({ accessToken: data.accessToken, user: data.user }));
        window.location.href = '/dashboard';
      }
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auth');
      window.location.href = '/';
    }
    api.clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


