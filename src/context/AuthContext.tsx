'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, type Usuario, type Role } from '@/lib/api';

interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  can: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setUsuario(null);
      setLoading(false);
      return;
    }
    try {
      const u = await auth.me();
      setUsuario(u);
      if (typeof window !== 'undefined') localStorage.setItem('usuario', JSON.stringify(u));
    } catch {
      setUsuario(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null;
    if (stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {}
    }
    loadUser();
  }, []);

  const login = async (email: string, senha: string) => {
    const { token, usuario: u } = await auth.login(email, senha);
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(u));
    }
    setUsuario(u);
  };

  const logout = () => {
    setUsuario(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
  };

  const can = (roles: Role[]) => {
    if (!usuario) return false;
    return roles.includes(usuario.role);
  };

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, refresh: loadUser, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
