import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  if (name.includes("ANDERSON") && (name.includes("ALEXANDRE") || name.includes("LUCIANO"))) return "andersonlucianodesouza";
  if (name.includes("CLEYTON") && (name.includes("SOUZA") || name.includes("FELIX") || name.includes("SANTOS"))) return "cleytondossantosfelix";
  if (name.includes("DIEGO") && name.includes("MANHANINI")) return "diegomanhanini";
  if (name.includes("GERENTE") && name.includes("CAMPOS")) return "gerentecampos";
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
