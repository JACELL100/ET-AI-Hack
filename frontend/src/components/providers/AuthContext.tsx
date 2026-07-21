"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";

export type RoleType = "citizen" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  isCitizen: boolean;
  isAdmin: boolean;
  activeRole: RoleType;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (redirectTo?: string) => Promise<{ success: boolean; error?: string }>;
  logout: (targetPortal?: "citizen" | "admin" | "all") => Promise<void>;
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
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isAdminRoute = currentPath.startsWith("/admin") || ["/jaal", "/drishti"].some(p => currentPath.startsWith(p));
      const intent = localStorage.getItem("login_intent");

      const citizenActiveFlag = localStorage.getItem("raksha_citizen_active");
      const adminActiveFlag = localStorage.getItem("raksha_admin_active");

      let isCitizen = false;
      let isAdmin = false;
      let citizenName = "";
      let adminName = "";

      if (isAdminRoute || intent === "admin") {
        // Evaluate Admin portal session ONLY
        if (adminActiveFlag === "true" || intent === "admin") {
          try {
            const { data, error } = await supabase.from('admins').select('*').eq('id', sessionUser.id).maybeSingle();
            if (!error && data) {
              isAdmin = true;
              adminName = data.name || "";
            } else if (intent === "admin") {
              const { error: upsertErr } = await supabase.from('admins').upsert({
                id: sessionUser.id,
                name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Admin',
                email: sessionUser.email
              });
              if (!upsertErr) isAdmin = true;
            }
          } catch (e) {
            console.warn("Error verifying admin profile:", e);
          }
          if (isAdmin) localStorage.setItem("raksha_admin_active", "true");
        }
        localStorage.removeItem("login_intent");

        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: sessionUser.user_metadata?.name || adminName || sessionUser.email?.split('@')[0] || 'Admin',
          isCitizen: false, // Strict isolation on admin routes
          isAdmin,
          activeRole: "admin"
        });
      } else {
        // Evaluate Citizen portal session ONLY
        if (citizenActiveFlag === "true" || intent === "citizen") {
          try {
            const { data, error } = await supabase.from('citizens').select('*').eq('id', sessionUser.id).maybeSingle();
            if (!error && data) {
              isCitizen = true;
              citizenName = data.name || "";
            } else if (intent === "citizen") {
              const { error: upsertErr } = await supabase.from('citizens').upsert({
                id: sessionUser.id,
                name: sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Citizen',
                email: sessionUser.email
              });
              if (!upsertErr) isCitizen = true;
            }
          } catch (e) {
            console.warn("Error verifying citizen profile:", e);
          }
          if (isCitizen) localStorage.setItem("raksha_citizen_active", "true");
        }
        localStorage.removeItem("login_intent");

        setUser({
          id: sessionUser.id,
          email: sessionUser.email || '',
          name: sessionUser.user_metadata?.name || citizenName || sessionUser.email?.split('@')[0] || 'Citizen',
          isCitizen,
          isAdmin: false, // Strict isolation on citizen routes
          activeRole: "citizen"
        });
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
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
        localStorage.setItem("raksha_admin_active", "true");
      } else {
        localStorage.setItem("login_intent", "citizen");
        localStorage.setItem("raksha_citizen_active", "true");
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

  const logout = async (targetPortal?: "citizen" | "admin" | "all") => {
    try {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      const isAdminRoute = currentPath.startsWith("/admin") || ["/jaal", "/drishti"].some(p => currentPath.startsWith(p));
      const isTargetAdmin = targetPortal === "admin" || (targetPortal !== "citizen" && isAdminRoute);

      if (isTargetAdmin) {
        localStorage.removeItem("raksha_admin_active");
      } else {
        localStorage.removeItem("raksha_citizen_active");
      }
      localStorage.removeItem("login_intent");
      localStorage.removeItem("raksha_active_role");

      await supabase.auth.signOut();
      setUser(null);
      window.location.href = isTargetAdmin ? "/admin" : "/login";
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
        localStorage.setItem("raksha_citizen_active", "true");
        setUser(prev => prev ? { ...prev, isCitizen: true } : null);
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
        localStorage.setItem("raksha_admin_active", "true");
        setUser(prev => prev ? { ...prev, isAdmin: true } : null);
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
