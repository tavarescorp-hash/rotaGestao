import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retorna a data atual no fuso horário de Brasília (America/Sao_Paulo) no formato YYYY-MM-DD.
 * NUNCA use new Date().toISOString().split("T")[0] — isso usa UTC e avança o dia
 * às 21h de Brasília (UTC-3), causando data errada à noite.
 */
export function getBrasiliaDateStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** 
 * Normaliza nomes para comparação robusta.
 * Remove acentos, partículas de ligação (de, da, do, das, dos) e espaços.
 */
export function normalizeName(s?: string): string {
  if (!s) return "";

  // NUCLEAR: Remove quebras de linha e caracteres invisíveis de controle ANTES de qualquer coisa
  let name = s.replace(/[\n\r\t]/g, ' ').toUpperCase().trim();

  // Resolução de Apelidos (Aliases) conhecidos para unificação de base
  if (name.includes("ANDERSON") && (name.includes("ALEXANDRE"))) return "andersonalexandre";
  if (name.includes("CLEYTON") && name.includes("SOUZA")) return "cleytondesouza";
  if (name.includes("DIEGO") && name.includes("MANHANINI")) return "diegomanhanini";
  if (name.includes("CARGO") && name.includes("VAGO")) return "cargovago";
  if (name.includes("CARLOS") && name.includes("TAVARES")) return "carlostavares";
  if (name.includes("GUILHERME") && name.includes("CHAGAS")) return "guilhermedaschagas";

  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/\b(da|de|do|das|dos)\b/gi, "") // Remove partículas de ligação
    .replace(/[^a-z0-9]/gi, "") // Remove espaços e caracteres especiais
    .trim();
}

/**
 * Compara duas unidades/filiais de forma resiliente e bi-direcional.
 * Ex: 'M' dá match com 'MACAÉ', 'CAMPOS' dá match com 'C'.
 */
export function isBranchMatch(val1: string | null | undefined, val2: string | null | undefined): boolean {
  if (!val1 || !val2) return false;
  const n1 = normalizeName(val1);
  const n2 = normalizeName(val2);

  if (n1 === n2) return true;

  // Tratamento rigoroso de Macaé (M)
  const isM1 = n1 === 'm' || n1.includes('macae');
  const isM2 = n2 === 'm' || n2.includes('macae');
  if (isM1 && isM2) return true;

  // Tratamento rigoroso de Campos (C)
  const isC1 = n1 === 'c' || n1.includes('campos');
  const isC2 = n2 === 'c' || n2.includes('campos');
  if (isC1 && isC2) return true;

  // Se for apenas uma letra e não bateu acima, rejeita (evita 'c' dar match em 'macae')
  if (n1.length === 1 || n2.length === 1) return false;

  return n1.includes(n2) || n2.includes(n1);
}
