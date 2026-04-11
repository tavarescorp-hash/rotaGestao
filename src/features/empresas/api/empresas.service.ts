import { supabase } from '@/core/api/supabaseClient';
import { createUserAdmin } from '@/features/usuarios/api/usuarios.service';

export async function getEmpresas() {
  try {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    return [];
  }
}

export async function updateEmpresaStatus(id: number, novoStatus: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('empresas')
      .update({ status_assinatura: novoStatus })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    return false;
  }
}

export async function createEmpresa(empresa: any): Promise<{ success: boolean, message: string, data?: any }> {
  try {
    const payload = { 
      ...empresa, 
      status_assinatura: 'Ativa',
      data_vencimento: empresa.data_vencimento || null,
      limite_visitas: empresa.limite_visitas || 500
    };
    const { data, error } = await supabase
      .from('empresas')
      .insert([payload])
      .select();

    if (error) throw error;
    return { success: true, message: "Empresa criada com sincronismo ativo!", data: data[0] };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateEmpresaBilling(id: number, data: { data_vencimento?: string | null, limite_visitas?: number }): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('empresas')
      .update(data)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Erro ao atualizar cobrança da empresa:", error);
    return false;
  }
}



