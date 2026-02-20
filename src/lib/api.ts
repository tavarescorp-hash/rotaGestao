import { supabase } from "./supabase";

const WEBHOOK_URL = "https://SEU-WEBHOOK-N8N";

export interface Visita {
  id?: string;
  data_visita: string;
  unidade: string;
  avaliador: string;
  cargo: string;
  fds: string;
  coaching: string;
  rgb: string;
  compass: string;
  observacoes: string;
  codigo_pdv: string;
  nome_fantasia_pdv: string;
  potencial_cliente: string;
  canal_identificado: string;
  canal_cadastrado: string;
  filial?: string;
  municipio?: string;
  nome_vendedor?: string;
  coorden_x?: string;
  coorden_y?: string;
  produtos_selecionados?: string;
  execucao_selecionada?: string;
  pontuacao_total?: number;
}

export async function enviarVisita(visita: Visita): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(visita),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return { success: true, message: "Visita registrada com sucesso!" };
  } catch (error) {
    return { success: false, message: "Erro ao salvar visita. Verifique a conexão." };
  }
}

export async function buscarVisitas(): Promise<Visita[]> {
  try {
    const res = await fetch(WEBHOOK_URL, { method: "GET" });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function excluirVisita(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return { success: true, message: "Visita excluída com sucesso!" };
  } catch {
    return { success: false, message: "Erro ao excluir visita." };
  }
}

export async function buscarPdvPorCodigo(codigo: string) {
  try {
    const { data, error } = await supabase
      .from("pdvs")
      .select('"SIGLA", "PORTE", "CANAL", "FILIAL", "MUNICIPIO", "NOME_VENDEDOR", "NOME _SUPERVISOR", "SUPERVISOR", "GERENTE", "Coorden-X", "Coorden-Y"')
      .eq('"CODIGO"', codigo)
      .single();

    if (error) {
      if (error.code !== "PGRST116") {
        console.error("Erro ao buscar PDV:", error);
      }
      return null; // Not found or error
    }

    // Adapt the exact schema response to what the UI is currently expecting
    return {
      nome_fantasia: data.SIGLA,
      categoria: data.PORTE,
      canal_cadastrado: data.CANAL,
      filial: data.FILIAL,
      municipio: data.MUNICIPIO,
      nome_vendedor: data.NOME_VENDEDOR,
      nome_supervisor: data["NOME _SUPERVISOR"],
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

export async function buscarFdsPorCanal(canal: string) {
  try {
    const { data, error } = await supabase
      .from("produtos_fds")
      .select("produto, pontos, execucao, tipo")
      .ilike("canal", canal);

    if (error) {
      console.error("Erro ao buscar dados FDS:", error);
      return { produtos: [], execucao: [] };
    }

    const produtos = data
      .filter((row: any) => row.tipo === "produto")
      .map((row: any) => ({ nome: row.produto, pontos: row.pontos }));

    const execucao = data
      .filter((row: any) => row.tipo === "execucao")
      .map((row: any) => ({ nome: row.execucao, pontos: row.pontos }));

    return { produtos, execucao };
  } catch (error) {
    console.error("Erro inesperado ao buscar FDS:", error);
    return { produtos: [], execucao: [] };
  }
}
