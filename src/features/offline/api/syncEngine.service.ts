import { supabase } from '@/core/api/supabaseClient';
import { saveToDB, getAllFromDB, deleteFromDB, STORES } from '@/lib/indexedDB';

// 1. Motor de Download de Base (para uso offline de PDVs e Produtos)
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

    // 3. Vendedores e Supervisores (Fase 6 - Sincronismo Relacional)
    console.log("👥 Baixando Hierarquia para Performance Offline...");
    
    let queryVend = supabase.from("vendedores").select(`
      cod_vendedor, 
      nome, 
      cidade, 
      supervisor_id,
      supervisores!inner (
        id,
        nome,
        filial,
        gerente,
        gerente_comercial
      )
    `);
    if (user?.empresa_id) queryVend = queryVend.eq('empresa_id', user.empresa_id);
    const responseVend = await queryVend;
    
    if (responseVend.data) {
      // Formatamos para o padrão VendedorAtivo esperado pelo App
      const payloadVendedores = responseVend.data.map((r: any) => ({
        cod_vendedor: r.cod_vendedor,
        nome_vendedor: r.nome,
        nome_supervisor: r.supervisores?.nome || "",
        codigo_sup: r.supervisores?.id?.toString() || "",
        municipio: r.cidade || "",
        filial: r.supervisores?.filial || "",
        gerente: r.supervisores?.gerente || "",
        gerente_comercial: r.supervisores?.gerente_comercial || ""
      }));
      await saveToDB(STORES.VENDEDORES_CACHE, payloadVendedores);
    }

    // 4. Visitas Aprovadas (Fase 6 - Indicadores Offline)
    console.log("📊 Baixando Histórico de Visitas para Indicadores...");
    let queryVis = supabase.from("visitas").select("*").eq("status_aprovacao", "Aprovado");
    if (user?.empresa_id) queryVis = queryVis.eq('empresa_id', user.empresa_id);
    
    const responseVis = await queryVis;
    if (responseVis.data) {
      await saveToDB(STORES.VISITAS_CACHE, responseVis.data);
    }

    console.log("✅ Downloads Offline Concluídos. App Ciente de Rede.");
  } catch (e) {
    console.error("⚠️ Fallback: Erro ao preencher cache offline.", e);
  }
}

// 2. Adicionar Ação à Fila Offline Universal
export async function addPendingActionToQueue(actionPayload: any): Promise<void> {
  const payloadOffline = { ...actionPayload, _localTimestamp: Date.now() };
  await saveToDB(STORES.OFFLINE_QUEUE, payloadOffline);
}

// 3. Processar Fila Offline (Upload de dados pendentes - atualmente apenas visitas)
export async function processOfflineQueue(): Promise<{ successCount: number; failCount: number }> {
  if (!navigator.onLine) {
    return { successCount: 0, failCount: 0 };
  }

  const pendingQueue = await getAllFromDB(STORES.OFFLINE_QUEUE);
  if (pendingQueue.length === 0) return { successCount: 0, failCount: 0 };

  let successCount = 0;
  let failCount = 0;

  for (const item of pendingQueue) {
    try {
      // O item atual modela uma "Visita". Se no futuro houverem outras tabelas, precisaremos de um discriminador (ex: action_type)
      const { id, _localTimestamp, ...payloadToInsert } = item;

      const { error } = await supabase.from("visitas").insert([payloadToInsert]);

      if (error) {
        console.error("Falha ao sincronizar item pendente", error);
        failCount++;
      } else {
        await deleteFromDB(STORES.OFFLINE_QUEUE, id);
        successCount++;
      }
    } catch (e) {
      console.error("Exception no processamento da fila", e);
      failCount++;
    }
  }

  return { successCount, failCount };
}
