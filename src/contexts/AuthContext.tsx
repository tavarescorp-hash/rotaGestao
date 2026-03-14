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
  empresa_id?: number;
  empresa_nome?: string;
  empresa_logo?: string;
  empresa_cor?: string;
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
        .select(`
          unidade, 
          funcao, 
          nivel, 
          Nome, 
          ativo,
          empresa_id,
          empresas (
            nome,
            logo_url,
            cor_primaria,
            status_assinatura
          )
        `)
        .eq("id", sessionUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile", error);
      }
      
      const empresaInfo = profile?.empresas ? (Array.isArray(profile.empresas) ? profile.empresas[0] : profile.empresas) as any : null;

      // Bloqueio por usuário inativo OU empresa inadimplente
      if (profile && (profile.ativo === false || (empresaInfo && empresaInfo.status_assinatura !== "Ativa"))) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: sessionUser.id,
        email: sessionUser.email || "",
        name: sessionUser.user_metadata?.name || profile?.Nome || sessionUser.email?.split("@")[0] || "",
        role: (sessionUser.user_metadata?.role as UserRole) || "user",
        unidade: profile?.unidade,
        funcao: profile?.funcao,
        nivel: profile?.nivel,
        indicadores: getIndicadoresPorNivel(profile?.nivel),
        empresa_id: profile?.empresa_id || 1,
        empresa_nome: empresaInfo?.nome || "Global Soluções",
        empresa_logo: empresaInfo?.logo_url || "/logo-global.png",
        empresa_cor: empresaInfo?.cor_primaria || "#B45309",
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return false;

      if (data?.user) {
        const { data: profile } = await supabase.from("profiles").select("ativo").eq("id", data.user.id).single();
        if (profile && profile.ativo === false) {
          await supabase.auth.signOut();
          throw new Error("Usuário desativado ou bloqueado.");
        }
      }

      return true;
    } catch (err) {
      console.error("Login failed", err);
      throw err;
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
