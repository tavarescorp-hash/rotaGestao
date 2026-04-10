import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { NivelHieriaquico, getIndicadoresPorNivel } from "../lib/roles";
import { normalizeName } from "../lib/utils";

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  unidade?: string;
  funcao?: string;
  codigo?: string;
  nivel?: NivelHieriaquico | string;
  formattedRole?: string;
  indicadores?: string[];
  empresa_id?: number;
  empresa_nome?: string;
  empresa_logo?: string;
  empresa_cor?: string;
  status_assinatura?: string;
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
          *,
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
        console.error("❌ [Auth Sync] Erro ao buscar perfil no Supabase:", error);
      }
      
      if (profile) {
        console.log("👤 [Auth Sync] Perfil carregado com sucesso:", {
          id: sessionUser.id,
          nome: profile.Nome,
          funcao: profile.funcao,
          nivel: profile.nivel,
          unidade: profile.unidade,
          empresa: profile.empresa_id
        });
      } else {
        console.warn("⚠️ [Auth Sync] Nenhum perfil encontrado para o ID:", sessionUser.id);
      }
      
      const empresaInfo = profile?.empresas ? (Array.isArray(profile.empresas) ? profile.empresas[0] : profile.empresas) as any : null;

      // Bloqueio apenas por usuário inativo (O bloqueio de empresa será lidado nas Rotas)
      if (profile && profile.ativo === false) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      const isMaster = profile?.nivel === 'Master';

      const formatRoleHelper = (funcao?: string, codigo?: string, nivel?: string) => {
        const mapping: Record<string, string> = {
          "NIV0": "ANALISTA",
          "NIV1": "DIRETOR", 
          "NIV2": "GERENTE COMERCIAL",
          "NIV3": "GERENTE DE VENDAS",
          "NIV4": "SUPERVISOR",
          "NIV5": "VENDEDOR"
        };
        const levelNormalized = nivel?.toUpperCase().trim() || "";
        let cargoBase = "";
        if (levelNormalized.includes("NIV0") || levelNormalized.includes("ANALISTA")) cargoBase = mapping["NIV0"];
        else if (levelNormalized.includes("NIV1") || levelNormalized.includes("DIRETOR")) cargoBase = mapping["NIV1"];
        else if (levelNormalized.includes("NIV2") || levelNormalized.includes("GERENTE COMERCIAL")) cargoBase = mapping["NIV2"];
        else if (levelNormalized.includes("NIV3")) cargoBase = mapping["NIV3"];
        else if (levelNormalized.includes("NIV4")) cargoBase = mapping["NIV4"];
        else if (levelNormalized.includes("NIV5")) cargoBase = mapping["NIV5"];
        if (!cargoBase) {
          const f = funcao?.trim().toUpperCase();
          if (f && f !== "USUÁRIO" && f !== "USUARIO") cargoBase = f;
        }
        if (!cargoBase) {
          if (levelNormalized.includes("SUPERVISOR")) cargoBase = "SUPERVISOR";
          else if (levelNormalized.includes("GERENTE")) cargoBase = "GERENTE";
          else if (levelNormalized.includes("DIRETOR")) cargoBase = "DIRETOR";
          else cargoBase = "USUÁRIO";
        }
        return `${cargoBase}${codigo ? ` ${codigo}` : ""}`;
      };

      const rawName = (profile?.Nome || sessionUser.user_metadata?.name || sessionUser.email?.split("@")[0] || "").toUpperCase();
      
      const userNivel = profile?.nivel;
      const userUnidade = profile?.unidade || (isMaster ? "TODAS" : "");
      let userFuncao = profile?.funcao;
      
      // Override Visual de Segurança: Força o crachá independentemente do que foi salvo errado no Supabase
      if (userNivel === 'Niv0' || userNivel === 'Niv5') {
        userFuncao = "ANALISTA";
      }

      setUser({
        id: sessionUser.id,
        email: sessionUser.email || "",
        name: rawName.replace(/[\n\r]/g, ' ').trim(), // Limpa quebras de linha no nome exibido
        role: (sessionUser.user_metadata?.role as UserRole) || "user",
        unidade: userUnidade,
        funcao: userFuncao,
        codigo: profile?.codigo,
        nivel: userNivel,
        formattedRole: userFuncao || formatRoleHelper(userFuncao, profile?.codigo, userNivel),
        indicadores: getIndicadoresPorNivel(userNivel),
        empresa_id: isMaster ? 0 : (profile?.empresa_id || 1),
        empresa_nome: isMaster ? "Gestão de Rota" : (empresaInfo?.nome || "Gestão de Rota"),
        empresa_logo: isMaster ? "/logo-gestao-rota.png" : (empresaInfo?.logo_url || "/logo-gestao-rota.png"),
        empresa_cor: isMaster ? "#0E385D" : (empresaInfo?.cor_primaria || "#B45309"),
        status_assinatura: isMaster ? "Ativa" : (empresaInfo?.status_assinatura || "Ativa"),
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

    // Handle PWA resume from background / screen unlock
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.error("Erro ao revalidar sessão no retorno do PWA", error);
          }
          if (session?.user) {
            // Re-fetch profile in background to ensure we're fresh
            fetchProfile(session.user);
          }
        });
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
