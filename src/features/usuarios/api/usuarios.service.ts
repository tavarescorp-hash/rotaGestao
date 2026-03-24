import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/core/api/supabaseClient';

/** Busca a lista completa de usuários do sistema */
export async function getUsers(user?: any) {
  try {
    let query = supabase
      .from("profiles")
      .select("*")
      .order("Nome", { ascending: true });

    // Isolamento Multi-Tenant SaaS
    if (user?.empresa_id) {
      query = query.eq('empresa_id', user.empresa_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
}

/** Habilita ou desabilita o acesso de um usuário */
export async function toggleUserStatus(userId: string, currentStatus: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ ativo: !currentStatus })
      .eq("id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao alterar status do usuário:", error);
    return false;
  }
}

/** 
 * Cria um usuário sem deslogar o analista atual.
 * Como o auth.signUp comum sobrescreve a sessão local, precisamos instanciar um client isolado secundário para a requisição.
 */
export async function createUserAdmin(userData: any): Promise<{ success: boolean; message: string }> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Chaves do Supabase não encontradas.");
    }

    // Instancia um client secundário (isolate auth session)
    const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Fundamental: não salvar a sessão localmente
        autoRefreshToken: false,
      }
    });

    // 1. Cria a conta no Identity (Authentication)
    const { data: authData, error: authError } = await tempClient.auth.signUp({
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      options: {
        data: {
          name: userData.Nome,
          role: 'user'
        }
      }
    });

    if (authError) {
      // Traduz erros comuns do Supabase para português
      let mensagem = authError.message;
      if (mensagem.toLowerCase().includes('invalid email') || mensagem.toLowerCase().includes('email address')) {
        mensagem = `O e-mail "${userData.email}" não é válido. Verifique o formato (exemplo@dominio.com).`;
      } else if (mensagem.toLowerCase().includes('already registered') || mensagem.toLowerCase().includes('already been registered')) {
        mensagem = `O e-mail "${userData.email}" já está cadastrado no sistema.`;
      } else if (mensagem.toLowerCase().includes('password')) {
        mensagem = `Senha inválida. Use ao menos 6 caracteres.`;
      }
      return { success: false, message: mensagem };
    }

    const newUserId = authData.user?.id;
    if (!newUserId || (authData.user?.identities && authData.user.identities.length === 0)) {
      return { success: false, message: `O e-mail "${userData.email}" já está cadastrado no sistema.` };
    }

    // 2. Atualiza a tabela Public profiles com com a persistencia da Role do Sistema
    const empresaId = userData.empresa_id || 1;

    const { error: profileError } = await supabase.from("profiles").update({
      Nome: userData.Nome,
      nivel: userData.nivel,
      unidade: userData.unidade,
      funcao: userData.funcao,
      ativo: true,
      empresa_id: empresaId
    }).eq("id", newUserId);

    if (profileError) {
      await supabase.from("profiles").upsert({
        id: newUserId,
        Nome: userData.Nome,
        nivel: userData.nivel,
        unidade: userData.unidade,
        funcao: userData.funcao,
        ativo: true,
        empresa_id: empresaId
      });
    }

    return { success: true, message: `O usuário ${userData.Nome} foi cadastrado com sucesso!` };
  } catch (error: any) {
    console.error("Erro inesperado ao criar usuário admin:", error);
    return { success: false, message: error.message || "Erro desconhecido ao cadastrar funcionário." };
  }
}

export async function createUserAdminForEmpresa(userData: any): Promise<{ success: boolean; message: string }> {
  return createUserAdmin(userData);
}
