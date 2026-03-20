import { supabase } from "./supabase";
import { saveToDB, getFromDB, getAllFromDB, STORES } from "./indexedDB";

const WEBHOOK_URL = "https://SEU-WEBHOOK-N8N";

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
}

export async function enviarVisita(visita: Visita): Promise<{ success: boolean; message: string; offline?: boolean }> {
  try {
    // ---------------------------------------------------------
    // ROTEAMENTO OFFLINE (PWA)
    // ---------------------------------------------------------
    if (!navigator.onLine) {
      // Adicionamos um timestamp local para podermos ordenar na fila depois
      const visitaOffline = { ...visita, _localTimestamp: Date.now() };
      await saveToDB(STORES.OFFLINE_QUEUE, visitaOffline);
      return { success: true, message: "Sem internet! Visita salva na Fila Offline com sucesso. Ela será enviada automaticamente quando a rede voltar.", offline: true };
    }

    const { error } = await supabase.from("visitas").insert([{
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
      empresa_id: visita.empresa_id || 1, // Fallback para Unibeer em caso extremo
    }]);

    if (error) {
      console.error("Erro ao inserir visita no Supabase:", error);
      throw error;
    }

    return { success: true, message: "Visita registrada com sucesso no Supabase!" };
  } catch (error) {
    console.error("Erro ao salvar visita:", error);
    return { success: false, message: "Erro ao salvar visita. Verifique a conexão." };
  }
}

export async function buscarVisitas(user?: any): Promise<Visita[]> {
  try {
    let query = supabase
      .from("visitas")
      .select("*")
      .eq("status_aprovacao", "Aprovado")
      .order("created_at", { ascending: false });

    // Isolamento Multi-Tenant SaaS
    if (user?.empresa_id) {
       query = query.eq('empresa_id', user.empresa_id);
    }

    // Se não for Analista nem Diretor, filtramos estritamente pela árvore ou filial da pessoa para não vazar dados
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
    return data || [];
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

    // Isolamento Multi-Tenant SaaS
    if (user?.empresa_id) {
       query = query.eq('empresa_id', user.empresa_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
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
    
    // Confirma que pelo menos 1 linha foi modificada
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

export async function buscarPdvPorCodigo(codigo: string, user?: any) {
  try {
    let codigoBuscado = codigo;

    // Se o código digitado for só números, colocamos a letra da filial automaticamente (Padrão)
    if (/^\d+$/.test(codigoBuscado) && user?.unidade) {
      if (user.unidade.toUpperCase().includes('MACA')) {
        codigoBuscado = `M${codigoBuscado}`;
      } else if (user.unidade.toUpperCase().includes('CAMPOS')) {
        codigoBuscado = `C${codigoBuscado}`;
      }
    }

    // ---------------------------------------------------------
    // ROTEAMENTO OFFLINE (PWA) - Resgata da Memória Local (IndexedDB)
    // ---------------------------------------------------------
    if (!navigator.onLine) {
       console.log("🌐 Sem internet. Buscando PDV no Cache Local IndexedDB...");
       const cachePdvs = await getAllFromDB(STORES.PDVS_CACHE);
       const dataOff = cachePdvs.find(row => row.codigo === codigoBuscado);
       
       if (dataOff) {
          return {
            nome_fantasia: dataOff.sigla || dataOff.razao_social,
            categoria: dataOff.porte,
            canal_cadastrado: dataOff.canal,
            filial: dataOff.filial,
            municipio: "",
            codigo_vendedor: dataOff.cod_vendedor,
            nome_vendedor: dataOff.nome_vendedor,
            nome_supervisor: dataOff.nome_supervisor,
            supervisor: dataOff.cod_supervisor ? dataOff.cod_supervisor.toString() : "",
            gerente: dataOff.nome_gerente_vendas,
            coorden_x: "",
            coorden_y: ""
          };
       }
       return null; // Não achou no modo offline
    }

    let query = supabase
      .from("pdvs")
      .select('filial, codigo, cod_vendedor, nome_vendedor, cod_supervisor, nome_supervisor, cod_gerente, nome_gerente_vendas, nome_gerente_comercial, rota, canal, cnpj_cpf, sigla, razao_social, porte')
      .eq('codigo', codigoBuscado);

    // Isolamento Multi-Tenant SaaS
    if (user?.empresa_id) {
       query = query.eq('empresa_id', user.empresa_id);
    }

    // Aplicação de Restrição RBAC Dinâmica para Pesquisas
    if (user?.nivel === 'Niv4' && user?.funcao) {
      const supervisorId = user.funcao.replace('SUPERVISOR ', '').trim();
      query = query.eq('cod_supervisor', supervisorId);
    } else if (user?.nivel === 'Niv3') {
      let gerenteRef = user?.name ? user.name : null;
      if (gerenteRef?.toUpperCase() === 'CARLOS JUNIOR') gerenteRef = 'CARLOS TAVARES';
      if (gerenteRef?.toUpperCase() === 'GUILHERME CHAGAS') gerenteRef = 'GUILHERME DAS CHAGAS';

      if (user?.unidade?.toUpperCase().includes("MACA")) {
        query = query.or(`nome_gerente_vendas.eq.${gerenteRef},filial.eq.M,filial.ilike.%MACA%`);
      } else if (user?.unidade?.toUpperCase().includes("CAMPOS")) {
        query = query.or(`nome_gerente_vendas.eq.${gerenteRef},filial.eq.C,filial.ilike.%CAMPO%`);
      }
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("Erro ao buscar PDV:", error);
      }
      return null; // Not found or error
    }

    // Adapt the exact schema response to what the UI is currently expecting
    return {
      nome_fantasia: data.sigla || data.razao_social,
      categoria: data.porte,
      canal_cadastrado: data.canal,
      filial: data.filial,
      municipio: "", // Campo não existente na base limpa base clientes unibeer.xlsx
      codigo_vendedor: data.cod_vendedor,
      nome_vendedor: data.nome_vendedor,
      nome_supervisor: data.nome_supervisor,
      supervisor: data.cod_supervisor ? data.cod_supervisor.toString() : "",
      gerente: data.nome_gerente_vendas,
      coorden_x: "", // Campo não existente na base limpa base clientes unibeer.xlsx
      coorden_y: ""  // Campo não existente na base limpa base clientes unibeer.xlsx
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar PDV:", error);
    return null;
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
      .eq("avaliador", avaliador)
      .gte("data_visita", prevDate)
      .lt("data_visita", nextDate);

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

export async function buscarFdsPorCanal(canal: string): Promise<{ produtos: { nome: string; pontos: number }[]; execucao: { nome: string; pontos: number }[] }> {
  try {
    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

    let canalBusca = normalize(canal);

    // Hardcode fallback em caso extremo que o CSV fuja do padrão da string do banco
    if (canalBusca === "entretenimento espec") {
      canalBusca = normalize("Entretenimento Espec.");
    }

    // Buscamos a tabela inteira (é pequena, em torno de 150 linhas) para garantir
    // que o filtro do frontend seja impecável com NFD (remoção de acentos)

    let data;

    if (!navigator.onLine) {
       console.log("🌐 Sem internet. Buscando FDS no Cache Local IndexedDB...");
       const cacheData = await getFromDB(STORES.METRICAS_CACHE, 'FDS_FULL');
       if (cacheData && cacheData.data) {
          data = cacheData.data;
       } else {
          return { produtos: [], execucao: [] };
       }
    } else {
       let query = supabase
         .from("produtos_fds")
         .select('"CANAL", "PRODUTO", "PONTOS", "EXECUCAO"');
       
       const res = await query;
       if (res.error) {
         console.error("Erro ao buscar dados FDS:", res.error);
         return { produtos: [], execucao: [] };
       }
       data = res.data;
    }

    // Filtra apenas os registros cujo CANAL normalizado bate perfeitamente
    const dataFiltrada = data.filter((row: any) => {
      if (!row.CANAL) return false;
      return normalize(row.CANAL) === canalBusca;
    });

    const produtosRaw = dataFiltrada
      .filter((row: any) => row.PRODUTO && row.PRODUTO.trim() !== "")
      .map((row: any) => ({ nome: row.PRODUTO.trim(), pontos: row.PONTOS || 0 }));

    // Remove produtos duplicados baseados no nome, preservando o objeto
    const produtos = Array.from(new Map(produtosRaw.map(p => [p.nome, p])).values()) as {nome: string, pontos: number}[];

    const execucaoRaw = dataFiltrada
      .filter((row: any) => row.EXECUCAO && row.EXECUCAO.trim() !== "")
      .map((row: any) => ({ nome: row.EXECUCAO.trim(), pontos: row.PONTOS || 0 }));

    // Remove execuções duplicadas baseadas no nome, preservando o objeto
    const execucao = Array.from(new Map(execucaoRaw.map(e => [e.nome, e])).values()) as {nome: string, pontos: number}[];

    return { produtos, execucao };
  } catch (error) {
    console.error("Erro inesperado ao buscar FDS:", error);
    return { produtos: [], execucao: [] };
  }
}

// Interface for the active sellers list
export interface VendedorAtivo {
  nome_vendedor: string;
  nome_supervisor: string;
  codigo_sup: string;
  municipio: string;
  filial: string;
  gerente: string;
}

export async function buscarVendedoresAtivos(user?: any): Promise<VendedorAtivo[]> {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    // Extrair códigos de referência
    const supervisorId = user?.nivel === 'Niv4' && user?.funcao ? user.funcao.replace('SUPERVISOR ', '').trim() : null;
    let gerenteRef = user?.nivel === 'Niv3' && user?.name ? user.name : null;

    // Normalizar nome do gerente para o padrão banco
    if (gerenteRef?.toUpperCase() === 'CARLOS JUNIOR') gerenteRef = 'CARLOS TAVARES';
    if (gerenteRef?.toUpperCase() === 'GUILHERME CHAGAS') gerenteRef = 'GUILHERME DAS CHAGAS';

    // ---------------------------------------------------------
    // ROTEAMENTO OFFLINE (PWA) - Resgata da Memória Local (IndexedDB)
    // ---------------------------------------------------------
    if (!navigator.onLine) {
       console.log("🌐 Sem internet. Buscando Vendedores no Cache Local IndexedDB...");
       const cachePdvs = await getAllFromDB(STORES.PDVS_CACHE);
       
       allData = cachePdvs.filter(pdv => {
          if (user?.nivel === 'Niv4' && supervisorId) {
             return pdv.cod_supervisor === supervisorId || pdv.cod_supervisor?.toString() === supervisorId;
          } else if (user?.nivel === 'Niv3') {
             if (user.unidade?.toUpperCase().includes("MACA")) {
                return pdv.filial === 'M' || pdv.filial?.toUpperCase().includes('MACAE') || pdv.filial?.toUpperCase().includes('MACAÉ') || pdv.nome_gerente_vendas === gerenteRef;
             } else if (user.unidade?.toUpperCase().includes("CAMPOS")) {
                return pdv.filial === 'C' || pdv.filial?.toUpperCase().includes('CAMPOS') || pdv.nome_gerente_vendas === gerenteRef;
             }
          }
          return true;
       });
    } else {
      while (hasMore) {
      let baseQuery = supabase
        .from("pdvs")
        .select('nome_vendedor, nome_supervisor, filial, nome_gerente_vendas, cod_supervisor, cod_gerente');

      // Isolamento Multi-Tenant SaaS
      if (user?.empresa_id) {
         baseQuery = baseQuery.eq('empresa_id', user.empresa_id);
      }

      // Aplicação de Restrição RBAC Dinâmica no Banco de Dados
      if (user?.nivel === 'Niv4' && supervisorId) {
        baseQuery = baseQuery.eq('cod_supervisor', supervisorId);
      } else if (user?.nivel === 'Niv3') {
        // Gerente pode ver a própria equipe ou da própria filial inteira no overview
        if (user.unidade?.toUpperCase().includes("MACA")) {
          // Acesso Gerente Macaé (M ou MACAÉ)
          baseQuery = baseQuery.or('filial.eq.M,filial.ilike.%MACAE%');
        } else if (user.unidade?.toUpperCase().includes("CAMPOS")) {
          // Acesso Gerente Campos (C ou CAMPOS)
          baseQuery = baseQuery.or('filial.eq.C,filial.ilike.%CAMPOS%');
        }
      }

      const { data, error } = await baseQuery.range(from, from + step - 1);

      if (error) {
        console.error("Erro ao buscar base real de vendedores:", error);
        break; // Tenta usar o que já pegou se falhar no meio
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < step) {
          hasMore = false; // ÚItima página
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }
    } // Fim Else Navigator.OnLine

    if (allData.length === 0) return [];

    const data = allData;

    // Limpeza de arrays pegando unicos
    const unicosMap = new Map<string, VendedorAtivo>();

    data.forEach((row: any) => {
      const vend = row.nome_vendedor?.trim();
      const supName = row.nome_supervisor?.trim() || "";
      const supCode = row.cod_supervisor?.toString() || "";
      const municipio = ""; // Sem município na base atual 

      if (vend && !unicosMap.has(vend)) {
        unicosMap.set(vend, {
          nome_vendedor: vend,
          nome_supervisor: supName,
          codigo_sup: supCode,
          municipio: municipio,
          filial: row.filial?.trim() || "",
          gerente: row.nome_gerente_vendas?.trim() || ""
        });
      }
    });

    return Array.from(unicosMap.values());
  } catch (error) {
    console.error("Erro inesperado ao buscar vendedores ativos:", error);
    return [];
  }
}

// -----------------------------------------------------------------------------
// FUNÇÕES DE ADMINISTRAÇÃO (UPLOAD EM MASSA)
// -----------------------------------------------------------------------------

export async function uploadBasePDVs(dados: any[], user?: any): Promise<{ success: boolean; message: string }> {
  try {
    const empresaId = user?.empresa_id || 1;

    // 1. Limpar SOMENTE a base da Empresa atual
    const { error: errorDel } = await supabase.from("pdvs").delete().eq('empresa_id', empresaId);

    // Fallback se nulo
    if (errorDel) {
      console.warn("Retentativa de Deleção total pdvs com outro filtro:", errorDel);
    }

    // 1.5 Filtrar as linhas vazias/fantasmas do Excel (Garantir que todas tenham um 'codigo' obrigatório)
    const dadosLimpados = dados.filter(row => row && row.codigo && String(row.codigo).trim() !== "");

    // 2. Inserir em lotes (chunks) para não estourar o limite de payload da API REST do Supabase (max 1000)
    const chunkSize = 500;
    for (let i = 0; i < dadosLimpados.length; i += chunkSize) {
      const chunk = dadosLimpados.slice(i, i + chunkSize);

      // Sanitizar chaves e filtrar exclusivamente as colunas vitais para o banco
      const allowedColumns = [
        "filial", "codigo", "cod_vendedor", "nome_vendedor", "cod_supervisor",
        "nome_supervisor", "cod_gerente", "nome_gerente_vendas", "nome_gerente_comercial",
        "rota", "canal", "cnpj_cpf", "sigla", "razao_social", "porte"
      ];

      const cleanChunk = chunk.map(row => {
        const cleanRow: any = {};
        
        // Em vez de iterar sobre todas as 150 chaves do Excel velho, puxamos apenas as 20 que precisamos
        for (const allowedKey of allowedColumns) {
          if (row[allowedKey] !== undefined && row[allowedKey] !== null) {
            cleanRow[allowedKey] = String(row[allowedKey]);
          }
        }
        
        // Injeta empresa_id ativamente para forçar o vinculo
        cleanRow.empresa_id = empresaId;
        return cleanRow;
      });

      const { error: errorIns } = await supabase.from("pdvs").insert(cleanChunk);
      if (errorIns) throw errorIns;
    }

    return { success: true, message: `Base atualizada com sucesso! ${dadosLimpados.length} PDVs sincronizados com o banco de dados.` };
  } catch (error: any) {
    console.error("Erro técnico no upload de PDVs:", error);
    return { success: false, message: error.message || "Erro desconhecido ao atualizar tabela de PDVs." };
  }
}

export async function uploadProdutosFDS(dados: any[], user?: any): Promise<{ success: boolean; message: string }> {
  try {
    const empresaId = user?.empresa_id || 1;

    // 1. Limpar tabela produtos SOMENTE do Tenant atual
    const { error: errorDel } = await supabase.from("produtos_fds").delete().eq('empresa_id', empresaId);

    if (errorDel) {
      console.warn("Aviso ao deletar FDS antigo", errorDel);
    }

    // 2. Inserir em lotes (chunks)
    const chunkSize = 500;
    for (let i = 0; i < dados.length; i += chunkSize) {
      const chunk = dados.slice(i, i + chunkSize);

      const cleanChunk = chunk.map(row => {
        const cleanRow: any = {};
        for (const key in row) {
          // Ignorar colunas auto-geradas pelo banco de dados (que também vem no Download)
          const lowerKey = key.toLowerCase();
          if (['id', 'tipo', 'created_at', 'updated_at'].includes(lowerKey)) continue;

          if (row[key] !== undefined && row[key] !== null) {
            // Se for cotação numerica da planilha
            if (key.toUpperCase() === 'PONTOS') {
              cleanRow[key] = parseInt(row[key]) || 0;
            } else {
              cleanRow[key] = String(row[key]);
            }
          }
        }
        // Injeta empresa_id no novo payload
        cleanRow.empresa_id = empresaId;
        return cleanRow;
      });

      const { error: errorIns } = await supabase.from("produtos_fds").insert(cleanChunk);
      if (errorIns) throw errorIns;
    }

    return { success: true, message: `Matriz de Produtos atualizada! ${dados.length} itens sincronizados.` };
  } catch (error: any) {
    console.error("Erro técnico no upload de Produtos:", error);
    return { success: false, message: error.message || "Erro desconhecido ao atualizar Produtos FDS." };
  }
}

// -----------------------------------------------------------------------------
// FUNÇÕES DE EXPORTAÇÃO (DOWNLOAD DE BANCO)
// -----------------------------------------------------------------------------

export async function downloadBasePDVs(user?: any) {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let fetchMore = true;
    
    const empresaId = user?.empresa_id || 1;

    while (fetchMore) {
      const { data, error } = await supabase
        .from('pdvs')
        .select('*')
        .eq('empresa_id', empresaId)
        .range(from, from + step - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += step;
      } else {
        fetchMore = false;
      }
    }
    return allData;
  } catch (error) {
    console.error("Erro ao baixar base de PDVs:", error);
    return null;
  }
}

export async function downloadProdutosFDS(user?: any) {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let fetchMore = true;
    
    const empresaId = user?.empresa_id || 1;

    while (fetchMore) {
      const { data, error } = await supabase
        .from('produtos_fds')
        .select('*')
        .eq('empresa_id', empresaId)
        .range(from, from + step - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += step;
      } else {
        fetchMore = false;
      }
    }
    return allData;
  } catch (error) {
    console.error("Erro ao baixar base de Produtos FDS:", error);
    return null;
  }
}

// -----------------------------------------------------------------------------
// FUNÇÕES DE ADMINISTRAÇÃO (USUÁRIOS)
// -----------------------------------------------------------------------------

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
import { createClient } from '@supabase/supabase-js';

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
    // Quando o email já está cadastrado (mas não confirmado), o Supabase retorna user com identities vazio
    if (!newUserId || (authData.user?.identities && authData.user.identities.length === 0)) {
      return { success: false, message: `O e-mail "${userData.email}" já está cadastrado no sistema.` };
    }

    // 2. Atualiza a tabela Public profiles com os níveis do sistema
    // Usando o supabase "principal" que está logado como Analista, permitindo a edição por RLS
    // Garante vincular à empresa do Analista que o convocou
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
      // Tentar upsert se update falhar
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

// ==========================================
// SAAS SUPER ADMIN (Master)
// ==========================================

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

export async function createEmpresa(empresa: any): Promise<{success: boolean, message: string, data?: any}> {
  try {
    // Injeta status default ativo
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
  // Mesmo sistema de isolate auth do createUserAdmin, mas forçando qual Empresa
  return createUserAdmin(userData);
}

// ==========================================
// CONFIGURAÇÕES GLOBAIS DO SISTEMA
// ==========================================

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

// ---------------------------------------------------------
// MOTOR DE SINCRONIZAÇÃO OFFLINE (DOWNLOAD DO MUNDO) PARA O PWA
// ---------------------------------------------------------
export async function syncOfflineCache(user?: any): Promise<void> {
  if (!navigator.onLine) return; // Se está sem internet, não tem como puxar

  try {
     console.log("🔄 Baixando dados para uso Offline...");
     
     // 1. Baixar Tabela de Clientes (Pdvs)
     let queryPdv = supabase.from("pdvs").select('filial, codigo, cod_vendedor, nome_vendedor, cod_supervisor, nome_supervisor, cod_gerente, nome_gerente_vendas, nome_gerente_comercial, rota, canal, cnpj_cpf, sigla, razao_social, porte');
     if (user?.empresa_id) queryPdv = queryPdv.eq('empresa_id', user.empresa_id);
     
     const responsePdv = await queryPdv;
     if (responsePdv.data) {
        const payloadPdvs = responsePdv.data.map(r => ({...r, cod_pdv: r.codigo}));
        await saveToDB(STORES.PDVS_CACHE, payloadPdvs);
     }

     // 2. Tabela de FDS
     let queryFds = supabase.from("produtos_fds").select('*');
     if (user?.empresa_id) queryFds = queryFds.eq('empresa_id', user.empresa_id);
     const responseFds = await queryFds;
     if (responseFds.data) {
        await saveToDB(STORES.METRICAS_CACHE, { id: 'FDS_FULL', data: responseFds.data });
     }

     console.log("✅ Downloads Offline Concluídos. App Ciente de Rede.");
  } catch(e) {
     console.error("⚠️ Fallback: Erro ao preencher cache offline.", e);
  }
}
