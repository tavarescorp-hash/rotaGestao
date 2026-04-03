import { supabase } from '@/core/api/supabaseClient';
import { getFromDB, STORES } from '@/lib/indexedDB';

export async function buscarFdsPorCanal(canal: string): Promise<{ produtos: { nome: string; pontos: number }[]; execucao: { nome: string; pontos: number }[] }> {
  try {
    const normalize = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

    let canalBusca = normalize(canal);

    // Ajuste de Normalização: Garantir que variações comuns de entrada para entretenimento coincidam.
    // O banco de dados está como 'Entretenimento Espec' (sem ponto).
    if (canalBusca.includes("entretenimento esp")) {
      canalBusca = "entretenimento espec";
    }

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

    const dataFiltrada = data.filter((row: any) => {
      if (!row.CANAL) return false;
      return normalize(row.CANAL) === canalBusca;
    });

    const produtosRaw = dataFiltrada
      .filter((row: any) => row.PRODUTO && row.PRODUTO.trim() !== "")
      .map((row: any) => ({ nome: row.PRODUTO.trim(), pontos: row.PONTOS || 0 }));

    const produtos = Array.from(new Map(produtosRaw.map(p => [p.nome, p])).values()) as { nome: string, pontos: number }[];

    const execucaoRaw = dataFiltrada
      .filter((row: any) => row.EXECUCAO && row.EXECUCAO.trim() !== "")
      .map((row: any) => ({ nome: row.EXECUCAO.trim(), pontos: row.PONTOS || 0 }));

    const execucao = Array.from(new Map(execucaoRaw.map(e => [e.nome, e])).values()) as { nome: string, pontos: number }[];

    return { produtos, execucao };
  } catch (error) {
    console.error("Erro inesperado ao buscar FDS:", error);
    return { produtos: [], execucao: [] };
  }
}

export async function uploadProdutosFDS(dados: any[], user?: any): Promise<{ success: boolean; message: string }> {
  try {
    const empresaId = user?.empresa_id || 1;

    const { error: errorDel } = await supabase.from("produtos_fds").delete().eq('empresa_id', empresaId);

    if (errorDel) {
      console.warn("Aviso ao deletar FDS antigo", errorDel);
    }

    const chunkSize = 500;
    for (let i = 0; i < dados.length; i += chunkSize) {
      const chunk = dados.slice(i, i + chunkSize);

      const cleanChunk = chunk.map(row => {
        const cleanRow: any = {};
        for (const key in row) {
          const lowerKey = key.toLowerCase();
          if (['id', 'tipo', 'created_at', 'updated_at'].includes(lowerKey)) continue;

          if (row[key] !== undefined && row[key] !== null) {
            if (key.toUpperCase() === 'PONTOS') {
              cleanRow[key] = parseInt(row[key]) || 0;
            } else {
              cleanRow[key] = String(row[key]);
            }
          }
        }
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
