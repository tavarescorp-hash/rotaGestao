import { supabase } from '@/core/api/supabaseClient';

export interface MetaConfig {
  id: string;
  user_id: string;
  indicador: string;
  meta_mensal: number;
}

/**
 * Busca a configuração de metas vinculadas ao usuário logado.
 * Prioriza os dados da tabela public.metas_config.
 */
export async function buscarMetasConfig(userId?: string, empresaId?: number): Promise<MetaConfig[]> {
  if (!userId) return [];
  
  try {
    let query = supabase
      .from('metas_config')
      .select('*')
      .eq('user_id', userId);
      
    if (empresaId) {
      query = query.eq('empresa_id', empresaId);
    }
      
    const { data, error } = await query;
    
    if (error) {
      if (error.code === '42P01') {
        console.warn("⚠️ Tabela 'metas_config' ainda não existe no banco de dados.");
      } else {
        console.error("Erro ao buscar metas-config:", error);
      }
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Erro inesperado ao buscar metas-config:", error);
    return [];
  }
}
