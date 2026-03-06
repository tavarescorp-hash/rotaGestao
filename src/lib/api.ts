import { supabase } from "./supabase";

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
}

export async function enviarVisita(visita: Visita): Promise<{ success: boolean; message: string }> {
  try {
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

export async function buscarVisitas(): Promise<Visita[]> {
  try {
    const { data, error } = await supabase
      .from("visitas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar visitas:", error);
    return [];
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

export async function buscarPdvPorCodigo(codigo: string, unidade?: string, supervisorId?: string) {
  try {
    let codigoBuscado = codigo;

    // Se o código digitado for só números, colocamos a letra da filial automaticamente na frente (Padrão SAP/Kofre)
    if (/^\d+$/.test(codigoBuscado) && unidade) {
      if (unidade.toUpperCase().includes('MACA')) {
        codigoBuscado = `M${codigoBuscado}`;
      } else if (unidade.toUpperCase().includes('CAMPOS')) {
        codigoBuscado = `C${codigoBuscado}`;
      }
    }

    let query = supabase
      .from("pdvs")
      .select('"SIGLA", "PORTE", "CANAL", "FILIAL", "MUNICIPIO", "VENDEDOR", "NOME_VENDEDOR", "NOME _SUPERVISOR", "SUPERVISOR", "GERENTE", "Coorden-X", "Coorden-Y", "NOME VENDEDOR", "NOME SUPERVISOR", "Canal", "Porte", "Sigla"')
      .eq('"CODIGO"', codigoBuscado);

    if (unidade) {
      const unidadeUpper = unidade.toUpperCase();
      if (unidadeUpper.includes("MACA")) {
        // Matches "M" or anything with MACA in it
        query = query.or(`"FILIAL".eq.M,"FILIAL".ilike.%${unidade}%`);
      } else if (unidadeUpper.includes("CAMPOS")) {
        // Matches "C" or anything with CAMPOS in it
        query = query.or(`"FILIAL".eq.C,"FILIAL".ilike.%${unidade}%`);
      } else {
        query = query.ilike('"FILIAL"', `%${unidade}%`);
      }
    }

    if (supervisorId) {
      query = query.eq('"SUPERVISOR"', supervisorId);
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
      nome_fantasia: data.Sigla || data.SIGLA,
      categoria: data.Porte || data.PORTE,
      canal_cadastrado: data.Canal || data.CANAL,
      filial: data.FILIAL,
      municipio: data.MUNICIPIO,
      codigo_vendedor: data.VENDEDOR,
      nome_vendedor: data["NOME VENDEDOR"] || data.NOME_VENDEDOR,
      nome_supervisor: data["NOME SUPERVISOR"] || data["NOME _SUPERVISOR"],
      supervisor: data.SUPERVISOR,
      gerente: data.GERENTE,
      coorden_x: data["Coorden-X"],
      coorden_y: data["Coorden-Y"]
    };
  } catch (error) {
    console.error("Erro inesperado ao buscar PDV:", error);
    return null;
  }
}

export async function verificarVisitaMensal(codigoPdv: string, avaliador: string, dataBusca: string): Promise<boolean> {
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

    const { data, error } = await supabase
      .from("visitas")
      .select("id")
      .in("codigo_pdv", [codigoComPrefixo, codigoSemPrefixo])
      .eq("avaliador", avaliador)
      .gte("data_visita", prevDate)
      .lt("data_visita", nextDate);

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

export async function buscarFdsPorCanal(canal: string) {
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
    const { data, error } = await supabase
      .from("produtos_fds")
      .select('"CANAL", "PRODUTO", "PONTOS", "EXECUCAO"');

    if (error) {
      console.error("Erro ao buscar dados FDS:", error);
      return { produtos: [], execucao: [] };
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
    const produtos = Array.from(new Map(produtosRaw.map(p => [p.nome, p])).values());

    const execucaoRaw = dataFiltrada
      .filter((row: any) => row.EXECUCAO && row.EXECUCAO.trim() !== "")
      .map((row: any) => ({ nome: row.EXECUCAO.trim(), pontos: row.PONTOS || 0 }));

    // Remove execuções duplicadas baseadas no nome, preservando o objeto
    const execucao = Array.from(new Map(execucaoRaw.map(e => [e.nome, e])).values());

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

export async function buscarVendedoresAtivos(unidade?: string): Promise<VendedorAtivo[]> {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("pdvs")
        .select('"NOME_VENDEDOR", "NOME _SUPERVISOR", "FILIAL", "GERENTE", "SUPERVISOR", "MUNICIPIO"')
        .range(from, from + step - 1);

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

    if (allData.length === 0) return [];

    const data = allData;

    // Limpeza de arrays pegando unicos
    const unicosMap = new Map<string, VendedorAtivo>();

    data.forEach((row: any) => {
      const vend = row.NOME_VENDEDOR?.trim();
      const supName = row["NOME _SUPERVISOR"]?.trim() || "";
      const supCode = row.SUPERVISOR?.trim() || "";
      const municipio = row.MUNICIPIO?.trim() || "";

      if (vend && !unicosMap.has(vend)) {
        unicosMap.set(vend, {
          nome_vendedor: vend,
          nome_supervisor: supName,
          codigo_sup: supCode,
          municipio: municipio,
          filial: row.FILIAL?.trim() || "",
          gerente: row.GERENTE?.trim() || ""
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

export async function uploadBasePDVs(dados: any[]): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Limpar a tabela inteira (segurança usando uma exclusão virtual nula)
    // Usamos um filtro que sempre será verdadeiro mas força o client postgres a aceitar o DELETE sem WHERE explícito de ID único
    const { error: errorDel } = await supabase.from("pdvs").delete().neq('CODIGO', 'FORCE_DELETE_ALL_IMPOSSIBLE_CODE');

    // Fallback: se o banco restringir exclusão total assim, tentamos neq na role
    if (errorDel) {
      console.warn("Retentativa de Deleção total pdvs com outro filtro:", errorDel);
      await supabase.from("pdvs").delete().not('created_at', 'is', null);
    }

    // 2. Inserir em lotes (chunks) para não estourar o limite de payload da API REST do Supabase (max 1000)
    const chunkSize = 500;
    for (let i = 0; i < dados.length; i += chunkSize) {
      const chunk = dados.slice(i, i + chunkSize);

      // Sanitizar chaves que vem do Excel vazias ou indefinidas
      const cleanChunk = chunk.map(row => {
        const cleanRow: any = {};
        for (const key in row) {
          // Ignorar colunas auto-geradas pelo banco de dados (que também vem no Download)
          const lowerKey = key.toLowerCase();
          if (['id', 'tipo', 'created_at', 'updated_at'].includes(lowerKey)) continue;

          if (row[key] !== undefined && row[key] !== null) {
            cleanRow[key] = String(row[key]);
          }
        }
        return cleanRow;
      });

      const { error: errorIns } = await supabase.from("pdvs").insert(cleanChunk);
      if (errorIns) throw errorIns;
    }

    return { success: true, message: `Base atualizada com sucesso! ${dados.length} PDVs sincronizados com o banco de dados.` };
  } catch (error: any) {
    console.error("Erro técnico no upload de PDVs:", error);
    return { success: false, message: error.message || "Erro desconhecido ao atualizar tabela de PDVs." };
  }
}

export async function uploadProdutosFDS(dados: any[]): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Limpar tabela produtos
    const { error: errorDel } = await supabase.from("produtos_fds").delete().neq('id', -1);

    if (errorDel) {
      await supabase.from("produtos_fds").delete().not('id', 'is', null);
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

export async function downloadBasePDVs() {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let fetchMore = true;

    while (fetchMore) {
      const { data, error } = await supabase
        .from('pdvs')
        .select('*')
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

export async function downloadProdutosFDS() {
  try {
    let allData: any[] = [];
    let from = 0;
    const step = 1000;
    let fetchMore = true;

    while (fetchMore) {
      const { data, error } = await supabase
        .from('produtos_fds')
        .select('*')
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
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("Nome", { ascending: true });

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
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          name: userData.Nome,
          role: 'user' // Default db role
        }
      }
    });

    if (authError) {
      return { success: false, message: `Erro ao criar conta: ${authError.message}` };
    }

    const newUserId = authData.user?.id;
    if (!newUserId) {
      return { success: false, message: "Falha ao obter ID do novo usuário criado." };
    }

    // 2. Atualiza a tabela Public profiles com os níveis do sistema
    // Usando o supabase "principal" que está logado como Analista, permitindo a edição por RLS
    const { error: profileError } = await supabase.from("profiles").update({
      Nome: userData.Nome,
      nivel: userData.nivel,
      unidade: userData.unidade,
      funcao: userData.funcao,
      ativo: true
    }).eq("id", newUserId);

    if (profileError) {
      // Tentar upsert se update falhar
      await supabase.from("profiles").upsert({
        id: newUserId,
        Nome: userData.Nome,
        nivel: userData.nivel,
        unidade: userData.unidade,
        funcao: userData.funcao,
        ativo: true
      });
    }

    return { success: true, message: `O usuário ${userData.Nome} foi cadastrado com sucesso!` };

  } catch (error: any) {
    console.error("Erro inesperado ao criar usuário admin:", error);
    return { success: false, message: error.message || "Erro desconhecido ao cadastrar funcionário." };
  }
}
