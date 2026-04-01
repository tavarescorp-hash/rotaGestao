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
  
  let name = s.toUpperCase().trim();
  
  // Resolução de Apelidos (Aliases) conhecidos para unificação de base
  if (name.includes("DIEGO") && name.includes("MANHANINI")) name = "DIEGO MANHANINI";
  if (name.includes("GERENTE") && name.includes("CAMPOS")) name = "GERENTE CAMPOS";
  if (name === "CARLOS JUNIOR") name = "CARLOS TAVARES";
  if (name === "GUILHERME CHAGAS") name = "GUILHERME DAS CHAGAS";
  
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .toLowerCase()
    .replace(/\b(da|de|do|das|dos)\b/gi, "") // Remove partículas de ligação
    .replace(/[^a-z0-9]/gi, "") // Remove espaços e caracteres especiais
    .trim();
}
