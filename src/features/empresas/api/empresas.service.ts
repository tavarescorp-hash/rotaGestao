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
    console.error("Erro ao atualizar status da empresa:", error);
    return false;
  }
}

export async function createEmpresa(empresa: any): Promise<{ success: boolean, message: string, data?: any }> {
  try {
    const payload = { ...empresa, status_assinatura: 'Ativa' };
    const { data, error } = await supabase
      .from('empresas')
      .insert([payload])
      .select();

    if (error) throw error;
    return { success: true, message: "Empresa criada com sincronismo ativo!", data: data[0] };
  } catch (error: any) {
    console.error("Erro ao criar empresa:", error);
    return { success: false, message: error.message };
  }
}

export async function createUserAdminForEmpresa(userData: any): Promise<{ success: boolean; message: string }> {
  return createUserAdmin(userData);
}
