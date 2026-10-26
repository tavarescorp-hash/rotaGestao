import { supabase } from '@/core/api/supabaseClient';
import { STORES, getAllFromDB } from '@/lib/indexedDB';
import { addPendingActionToQueue } from '@/features/offline/api/syncEngine.service';

export interface Visita {
  id?: string;
  data_visita: string;
  unidade: string;
  avaliador: string;
  cargo: string;
  indicador_avaliado: string;
  observacoes: string;
  codigo_pdv: string;
  nome_fantasia_pdv: string;
  potencial_cliente: string;
  canal_identificado: string;
  canal_cadastrado: string;
  filial?: string;
  municipio?: string;
  codigo_vendedor?: string;
  nome_vendedor?: string;
  coorden_x?: string;
  coorden_y?: string;
  produtos_selecionados?: string;
  execucao_selecionada?: string;
  pontuacao_total?: number;
  pontos_fortes?: string;
  pontos_desenvolver?: string;
  passos_coaching?: string;
  rgb_foco_visita?: string;
  rgb_comprando_outras?: string;
  rgb_ttc_adequado?: string;
  rgb_acao_concorrencia?: string;
  fds_qtd_skus?: string;
  fds_refrigerador?: string;
  fds_posicionamento?: string;
  fds_refrigerados?: string;
  fds_precificados?: string;
  fds_melhoria_precificacao?: string;
  fds_observacoes?: string;
  produtos_nao_selecionados?: string;
  execucao_nao_selecionada?: string;
  status_aprovacao?: string;
  empresa_id?: number;
  respostas_json_dynamic?: Record<string, string>;
  id_avaliador?: string;
}

export async function enviarVisita(visita: Visita): Promise<{ success: boolean; message: string; offline?: boolean }> {
  const payload: any = {
    data_visita: visita.data_visita,
    unidade: visita.unidade,
    avaliador: visita.avaliador,
    cargo: visita.cargo,
    indicador_avaliado: visita.indicador_avaliado,
    observacoes: visita.observacoes,
    codigo_pdv: visita.codigo_pdv,
    nome_fantasia_pdv: visita.nome_fantasia_pdv,
    potencial_cliente: visita.potencial_cliente,
    canal_identificado: visita.canal_identificado,
    canal_cadastrado: visita.canal_cadastrado,
    filial: visita.filial,
    municipio: visita.municipio,
    codigo_vendedor: visita.codigo_vendedor,
    nome_vendedor: visita.nome_vendedor,
    coorden_x: visita.coorden_x,
    coorden_y: visita.coorden_y,
    produtos_selecionados: visita.produtos_selecionados,
    execucao_selecionada: visita.execucao_selecionada,
    pontuacao_total: visita.pontuacao_total,
    pontos_fortes: visita.pontos_fortes,
    pontos_desenvolver: visita.pontos_desenvolver,
    passos_coaching: visita.passos_coaching,
    rgb_foco_visita: visita.rgb_foco_visita,
    rgb_comprando_outras: visita.rgb_comprando_outras,
    rgb_ttc_adequado: visita.rgb_ttc_adequado,
    rgb_acao_concorrencia: visita.rgb_acao_concorrencia,
    fds_qtd_skus: visita.fds_qtd_skus,
    fds_refrigerador: visita.fds_refrigerador,
    fds_posicionamento: visita.fds_posicionamento,
    fds_refrigerados: visita.fds_refrigerados,
    fds_precificados: visita.fds_precificados,
    fds_melhoria_precificacao: visita.fds_melhoria_precificacao,
    fds_observacoes: visita.fds_observacoes,
    produtos_nao_selecionados: visita.produtos_nao_selecionados,
    execucao_nao_selecionada: visita.execucao_nao_selecionada,
    status_aprovacao: visita.status_aprovacao || 'Aprovado',
    empresa_id: visita.empresa_id || 1,
    respostas_json_dynamic: visita.respostas_json_dynamic,
    id_avaliador: visita.id_avaliador
  };

  const tryInsert = async (currentPayload: any, attempt: number = 1): Promise<{ success: boolean; message: string; offline?: boolean }> => {
    // Aumentado drasticamente para auto-curar todas colunas caso o banco seja novo (SaaS 2.0 schema)
    if (attempt > 40) throw new Error("Muitas tentativas de salvamento sem sucesso.");

    const { error } = await supabase.from("visitas").insert([currentPayload]);

    if (error) {
      const isMissingColumn = error.code === 'PGRST204' || 
                              error.message?.includes('column') || 
                              error.message?.includes('schema cache') ||
                              error.message?.includes('field');

      if (isMissingColumn) {
        // Exemplo: "Could not find the 'avaliador' column of 'visitas' in the schema cache"
        const match = error.message?.match(/'([^']+)' column/) || error.message?.match(/column ['"](.+?)['"]/);
        const missingColumn = match ? match[1] : null;

        if (missingColumn && missingColumn in currentPayload) {
          console.warn(`⚠️ Coluna [${missingColumn}] não encontrada. Movendo para fallback JSON e tentando novamente...`);
          const { [missingColumn]: missingValue, ...nextPayload } = currentPayload;
          
          // Preserva o dado na coluna JSON genérica 'respostas' se ela existir no db, ou falha gracefully
          if (!nextPayload.respostas) nextPayload.respostas = {};
          if (typeof nextPayload.respostas === 'object') {
             nextPayload.respostas[missingColumn] = missingValue;
          }

          return tryInsert(nextPayload, attempt + 1);
        } else {
          // Último recurso
          console.warn("⚠️ Erro de coluna desconhecido. Removendo campos problemáticos conhecidos...");
          const { id_avaliador, respostas_json_dynamic, respostas, execucao_nao_selecionada, ...safePayload } = currentPayload;
          if (Object.keys(safePayload).length === Object.keys(currentPayload).length) throw error; 
          return tryInsert(safePayload, attempt + 1);
        }
      }
      throw error;
    }
    return { success: true, message: attempt > 1 ? "Visita salva (Estrutura Auto-Corrigida)!" : "Visita salva com sucesso!" };
  };

  try {
    if (!navigator.onLine) {
      await addPendingActionToQueue(visita);
      return { success: true, message: "Modo Offline: Visita gravada localmente.", offline: true };
    }

    return await tryInsert(payload);
  } catch (error: any) {
    console.error("Erro fatal ao salvar visita:", error);
    return { success: false, message: `Erro ao salvar visita. Detalhe: ${error.message || 'Erro de conexão'}` };
  }
}

export async function buscarVisitas(user?: any): Promise<Visita[]> {
  try {
    if (!navigator.onLine) {
      console.log("🌐 Sem internet. Buscando Visitas no Cache Local...");
      const cache = await getAllFromDB(STORES.VISITAS_CACHE);
      
      // Aplicar filtros básicos de segurança (empresa_id) se existirem no cache
      return cache.filter(v => {
        if (user?.empresa_id && v.empresa_id !== user.empresa_id) return false;
        return true;
      });
    }

    let query = supabase
      .from("visitas")
      .select("*")
      .eq("status_aprovacao", "Aprovado")
      .order("created_at", { ascending: false });

    if (user?.empresa_id) {
      query = query.eq('empresa_id', user.empresa_id);
    }

    // Niv1 (Diretor) e Niv2 (GCom - Eduardo Breda) não têm filtros de unidade/nome na SQL (pegam tudo da empresa_id)
    if (user && user.nivel !== 'Niv1' && user.nivel !== 'Niv2' && !user.funcao?.toUpperCase().includes('ANALISTA')) {
      if (user.unidade && user.unidade !== "todas") {
        if (user.unidade.toUpperCase().includes("MACA")) {
          query = query.or('unidade.eq.M,unidade.ilike.%MACA%');
        } else if (user.unidade.toUpperCase().includes("CAMPOS")) {
          query = query.or('unidade.eq.C,unidade.ilike.%CAMPO%');
        } else {
          query = query.eq('unidade', user.unidade);
        }
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    
    // Auto-flatten para manter a UI 100% compátivel caso variáveis estejam dentro de 'respostas'
    return (data || []).map(v => ({
      ...v,
      ...(typeof v.respostas === 'object' ? v.respostas : {}),
      ...(typeof v.respostas_json_dynamic === 'object' ? v.respostas_json_dynamic : {})
    }));
  } catch (error) {
    console.error("Erro ao buscar visitas:", error);
    return [];
  }
}

export async function buscarVisitasPendentes(user?: any): Promise<Visita[]> {
  try {
    let query = supabase
      .from("visitas")
      .select("*")
      .eq("status_aprovacao", "Pendente")
      .order("created_at", { ascending: false });

    if (user?.empresa_id) {
      query = query.eq('empresa_id', user.empresa_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(v => ({
      ...v,
      ...(typeof v.respostas === 'object' ? v.respostas : {}),
      ...(typeof v.respostas_json_dynamic === 'object' ? v.respostas_json_dynamic : {})
    }));
  } catch (error) {
    console.error("Erro ao buscar visitas pendentes:", error);
    return [];
  }
}

export async function aprovarVisita(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("visitas")
      .update({ status_aprovacao: "Aprovado" })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Erro Supabase Aprovar:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error("Nenhuma visita foi encontrada ou atualizada com o ID:", id);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception em aprovarVisita:", err);
    return false;
  }
}

export async function recusarVisita(id: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("visitas")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      console.error("Erro Supabase Recusar/Deletar:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.error("Nenhuma visita foi encontrada ou deletada com o ID:", id);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Exception em recusarVisita:", err);
    return false;
  }
}

export async function excluirVisita(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from("visitas")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true, message: "Visita excluída com sucesso do Supabase!" };
  } catch (error) {
    console.error("Erro ao excluir visita:", error);
    return { success: false, message: "Erro ao excluir visita." };
  }
}

export async function verificarVisitaMensal(codigoPdv: string, avaliador: string, dataBusca: string, user?: any): Promise<boolean> {
  try {
    // Evita o problema de fuso horário do JS separando a string YYYY-MM-DD
    const [anoStr, mesStr] = dataBusca.split("-");
    const ano = parseInt(anoStr, 10);
    const mes = parseInt(mesStr, 10); // 1 a 12
    const strMes = mesStr.padStart(2, '0');

    // Buscar se existe alguma visita com as mesmas credenciais no mês e ano selecionados
    const prevDate = `${ano}-${strMes}-01`;
    const nextDate = mes === 12 ? `${ano + 1}-01-01` : `${ano}-${(mes + 1).toString().padStart(2, '0')}-01`;

    // Recupera a primeira letra (C ou M) se houver
    const isLetterPrefixed = /^[a-zA-Z]/.test(codigoPdv);
    const letter = isLetterPrefixed ? codigoPdv.charAt(0).toUpperCase() : "";
    const numbersOnly = isLetterPrefixed ? codigoPdv.substring(1) : codigoPdv;

    const codigoComPrefixo = letter ? `${letter}${numbersOnly}` : codigoPdv;
    const codigoSemPrefixo = numbersOnly;

    let query = supabase
      .from("visitas")
      .select("id")
      .in("codigo_pdv", [codigoComPrefixo, codigoSemPrefixo])
      .gte("data_visita", prevDate)
      .lt("data_visita", nextDate);

    if (user?.id) {
      query = query.eq("id_avaliador", user.id);
    } else {
      query = query.eq("avaliador", avaliador);
    }

    if (user?.empresa_id) {
      query = query.eq('empresa_id', user.empresa_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao verificar visita existente:", error);
      return false; // Em caso de erro, permite o fluxo (não bloqueia injustamente)
    }

    // Se retornar algum registro, significa que o PDV já foi visitado no mês corrente
    return data && data.length > 0;
  } catch (error) {
    console.error("Erro inesperado ao verificar visita existente:", error);
    return false;
  }
}

export async function getContagemVisitasMensal(empresaId: number): Promise<number> {
  try {
    const now = new Date();
    // Pega o primeiro dia do mês atual no formato YYYY-MM-DD
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from("visitas")
      .select("*", { count: 'exact', head: true })
      .eq("empresa_id", empresaId)
      .gte("data_visita", firstDay);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Erro ao contar visitas mensais:", error);
    return 0;
  }
}
