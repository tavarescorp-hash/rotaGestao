import { supabase } from '@/core/api/supabaseClient';

export async function getConfiguracao(chave: string, user?: any): Promise<string | null> {
  try {
    let query = supabase
      .from("configuracoes")
      .select("valor")
      .eq("chave", chave);

    if (user?.empresa_id) {
      query = query.eq('empresa_id', user.empresa_id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data ? data.valor : null;
  } catch (error) {
    console.error(`Erro ao buscar configuração ${chave}:`, error);
    return null;
  }
}

export async function setConfiguracao(chave: string, valor: string, user?: any): Promise<boolean> {
  try {
    const empresaId = user?.empresa_id || 1;
    const { error } = await supabase
      .from("configuracoes")
      .upsert({ chave, valor, empresa_id: empresaId, atualizado_em: new Date().toISOString() }, { onConflict: 'chave, empresa_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Erro ao salvar configuração ${chave}:`, error);
    return false;
  }
}
