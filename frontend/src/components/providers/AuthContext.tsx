"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  name: string;
  isCitizen: boolean;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerCitizen: () => Promise<void>;
  registerAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginWithGoogle: async () => ({ success: false }),
  logout: async () => {},
  registerCitizen: async () => {},
  registerAdmin: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser: SupabaseUser) => {
    try {
      let isCitizen = false;
      let isAdmin = false;
      let citizenName = "";
      let adminName = "";

      // Safe checks in case tables aren't created yet or RLS blocks
      try {
        const { data, error } = await supabase.from('citizens').select('*').eq('id', sessionUser.id).maybeSingle();
        if (!error && data) {
          isCitizen = true;
          citizenName = data.name || "";
        }
      } catch (e) {
        console.warn("Citizens table not found or inaccessible:", e);
      }

      try {
        const { data, error } = await supabase.from('admins').select('*').eq('id', sessionUser.id).maybeSingle();
        if (!error && data) {
          isAdmin = true;
          adminName = data.name || "";
        }
      } catch (e) {
        console.warn("Admins table not found or inaccessible:", e);
      }

      // Check intent
      const intent = localStorage.getItem("login_intent");
      const currentPath = window.location.pathname;

      if (intent === "admin") {
        if (!isAdmin) {
          try {
            const { error } = await supabase.from('admins').upsert({
              id: sessionUser.id,
              name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Admin',
              email: sessionUser.email
            });
            if (!error) isAdmin = true;
          } catch (e) {
            console.error("Failed auto-registering admin:", e);
          }
        }
        localStorage.removeItem("login_intent");
        if (currentPath !== "/admin") {
          window.location.href = "/admin";
          return;
        }
      } else if (intent === "citizen") {
        if (!isCitizen) {
          try {
            const { error } = await supabase.from('citizens').upsert({
              id: sessionUser.id,
              name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Citizen',
              email: sessionUser.email
            });
            if (!error) isCitizen = true;
          } catch (e) {
            console.error("Failed auto-registering citizen:", e);
          }
        }
        localStorage.removeItem("login_intent");
        if (currentPath !== "/dashboard") {
          window.location.href = "/dashboard";
          return;
        }
      }

      setUser({
        id: sessionUser.id,
        email: sessionUser.email || '',
        name: sessionUser.user_metadata?.name || citizenName || adminName || sessionUser.email?.split('@')[0] || 'User',
        isCitizen,
        isAdmin
      });
    } catch (e) {
      console.error("Error fetching profiles", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          fetchProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (redirectTo?: string) => {
    try {
      if (redirectTo && redirectTo.includes("/admin")) {
        localStorage.setItem("login_intent", "admin");
      } else {
        localStorage.setItem("login_intent", "citizen");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo || `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      localStorage.removeItem("login_intent");
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      window.location.href = "/";
    } catch (e) {
      console.error(e);
    }
  };

  const registerCitizen = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('citizens').upsert({
        id: user.id,
        name: user.name,
        email: user.email
      });
      if (!error) {
        setUser(prev => prev ? { ...prev, isCitizen: true } : null);
      } else {
        console.error("Error inserting citizen row: " + error.message + " (Code: " + error.code + ", Details: " + error.details + ", Hint: " + error.hint + ")");
      }
    } catch (e: any) {
      console.error("Exception in registerCitizen:", e);
    }
  };

  const registerAdmin = async () => {
    if (!user) return;
    try {
      const { error } = await supabase.from('admins').upsert({
        id: user.id,
        name: user.name,
        email: user.email
      });
      if (!error) {
        setUser(prev => prev ? { ...prev, isAdmin: true } : null);
      } else {
        console.error("Error inserting admin row: " + error.message + " (Code: " + error.code + ", Details: " + error.details + ", Hint: " + error.hint + ")");
      }
    } catch (e: any) {
      console.error("Exception in registerAdmin:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, registerCitizen, registerAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
