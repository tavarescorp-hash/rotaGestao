import { supabase } from '@/core/api/supabaseClient';
import { saveToDB, STORES } from '@/lib/indexedDB';

export async function syncOfflineCache(user?: any): Promise<void> {
  if (!navigator.onLine) return;

  try {
    console.log("🔄 Baixando dados para uso Offline...");

    let queryPdv = supabase.from("pdvs").select('filial, codigo, cod_vendedor, nome_vendedor, cod_supervisor, nome_supervisor, cod_gerente, nome_gerente_vendas, nome_gerente_comercial, rota, canal, cnpj_cpf, sigla, razao_social, porte');
    if (user?.empresa_id) queryPdv = queryPdv.eq('empresa_id', user.empresa_id);

    const responsePdv = await queryPdv;
    if (responsePdv.data) {
      const payloadPdvs = responsePdv.data.map(r => ({ ...r, cod_pdv: r.codigo }));
      await saveToDB(STORES.PDVS_CACHE, payloadPdvs);
    }

    let queryFds = supabase.from("produtos_fds").select('*');
    if (user?.empresa_id) queryFds = queryFds.eq('empresa_id', user.empresa_id);
    const responseFds = await queryFds;
    if (responseFds.data) {
      await saveToDB(STORES.METRICAS_CACHE, { id: 'FDS_FULL', data: responseFds.data });
    }

    console.log("✅ Downloads Offline Concluídos. App Ciente de Rede.");
  } catch (e) {
    console.error("⚠️ Fallback: Erro ao preencher cache offline.", e);
  }
}
