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
  nome_vendedor?: string;
  coorden_x?: string;
  coorden_y?: string;
  produtos_selecionados?: string;
  execucao_selecionada?: string;
  pontuacao_total?: number;
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
      nome_vendedor: visita.nome_vendedor,
      coorden_x: visita.coorden_x,
      coorden_y: visita.coorden_y,
      produtos_selecionados: visita.produtos_selecionados,
      execucao_selecionada: visita.execucao_selecionada,
      pontuacao_total: visita.pontuacao_total,
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
    // Busca exata case-insensitive ignorando espaços soltos que possam existir no cadastro local
    // Supabase ilike match requires `%` iff we want substring. If we want exact match ignore case, we just pass the string.
    const { data, error } = await supabase
      .from("produtos_fds")
      .select('"PRODUTO", "PONTOS", "EXECUCAO"')
      .ilike("CANAL", canal.trim());

    if (error) {
      console.error("Erro ao buscar dados FDS:", error);
      return { produtos: [], execucao: [] };
    }

    const produtos = data
      .filter((row: any) => row.PRODUTO && row.PRODUTO.trim() !== "")
      .map((row: any) => ({ nome: row.PRODUTO, pontos: row.PONTOS || 0 }));

    // Execuções em FDS frequentemente não têm pontos na planilha (porque
    // a pontuação é do produto). Porém se quisermos que ela tenha pontos
    // podemos pegar os pontos ou usar 0 por enquanto,
    // mas de acordo com os requisitos e prints anteriores, os pontos 
    // estavam sendo associados aos produtos / exeucoes de acordo com a linha.
    const execucao = data
      .filter((row: any) => row.EXECUCAO && row.EXECUCAO.trim() !== "")
      .map((row: any) => ({ nome: row.EXECUCAO, pontos: row.PONTOS || 0 }));

    return { produtos, execucao };
  } catch (error) {
    console.error("Erro inesperado ao buscar FDS:", error);
    return { produtos: [], execucao: [] };
  }
}
