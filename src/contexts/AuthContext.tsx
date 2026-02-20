import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { NivelHieriaquico, getIndicadoresPorNivel } from "../lib/roles";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unidade?: string;
  funcao?: string;
  nivel?: NivelHieriaquico | string;
  indicadores?: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (sessionUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("unidade, funcao, nivel, Nome")
        .eq("id", sessionUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile", error);
      }

      setUser({
        id: sessionUser.id,
        email: sessionUser.email || "",
        name: profile?.Nome || sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "",
        role: (sessionUser.user_metadata?.role as UserRole) || "user",
        unidade: profile?.unidade,
        funcao: profile?.funcao,
        nivel: profile?.nivel,
        indicadores: getIndicadoresPorNivel(profile?.nivel),
      });
    } catch (err) {
      console.error("Failed to map profile", err);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return !error;
    } catch (err) {
      console.error("Login failed", err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed", err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "admin", loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
