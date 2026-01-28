"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  register: (email: string, password: string, storeName: string, subdomain: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error validando sesión:", error.message);
        // Si el token es inválido, forzamos cierre de sesión para limpiar
        supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Error inesperado en Auth:", err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Si hay un evento de "cierre de sesión" o token inválido, limpiamos
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setLoading(false);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const register = async (email: string, password: string, storeName: string, subdomain: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          store_name: storeName,
          subdomain: subdomain
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    resetPassword,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};