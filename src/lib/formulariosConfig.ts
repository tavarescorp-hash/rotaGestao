export type QuestionType = "text" | "textarea" | "radio" | "select";

export interface FormQuestion {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[]; // Opções para rádio ou select
  required?: boolean;
  dependsOn?: {
    questionId: string; // ID da pergunta da qual esta depende
    valueToMatch: string | string[]; // Mostrar esta pergunta se o pai tiver este(s) valor(es)
    matchType?: 'equals' | 'not_equals'; // Padrão é 'equals'
  };
}

export const FDS_QUESTIONS: FormQuestion[] = [
  {
    id: "acao_concorrencia",
    label: "Há alguma ação vigente da concorrência no PDV?",
    type: "radio",
    options: [
      "Sim, ação de preço para volume.",
      "Sim, ação promocional para consumidor final.",
      "Sim, contrato de visibilidade/exclusividade.",
      "Não.",
      "Outro"
    ],
    required: true,
  },
  {
    id: "acao_concorrencia_outro",
    label: "Descreva a ação da concorrência...",
    type: "text",
    dependsOn: { questionId: "acao_concorrencia", valueToMatch: "Outro" },
    required: true,
  },
  {
    id: "qtd_skus",
    label: "Quantos SKUs há no PDV?",
    type: "select",
    options: [
      "Não, 1  SKU",
      "Não, 2  SKUs",
      "Não, 3  SKUs",
      "Não, 4  SKUs",
      "Não, 5  SKUs",
      "Sim, 6  SKUs",
      "Sim, 7  SKUs",
      "Sim, 8  SKUs",
      "Sim, 9  SKUs",
      "Sim, 10 SKUs",
      "Sim, +10 SKUs",
      "Nenhum SKU no PDV."
    ],
    required: true,
  },
  {
    id: "possui_refrigerador",
    label: "PDV POSSUI ALGUM REFRIGERADOR?",
    type: "radio",
    options: [
      "PDV NÃO POSSUI GELADEIRA OU POSSUI APENAS GELADEIRA DA CONCORRÊNCIA",
      "PDV POSSUI APENAS GELADEIRA SEM MARCA",
      "PDV POSSUI GELADEIRA DA CIA"
    ],
    required: true,
  },
  {
    id: "posicionamento",
    label: "POSICIONAMENTO: O REFRIGERADOR DA CIA ESTÁ COM NO MÍNIMO 50% ABASTECIDO COM A MARCA DA GELADEIRA?",
    type: "radio",
    options: [
      "Não, 10% da marca do equipamento",
      "Não, 25% da marca do equipamento",
      "Sim, 50% da marca do equipamento",
      "Sim, 75% da marca do equipamento",
      "Sim, 100% da marca do equipamento",
      "Outro"
    ],
    dependsOn: { questionId: "possui_refrigerador", valueToMatch: "PDV POSSUI GELADEIRA DA CIA" },
    required: true,
  },
  {
    id: "posicionamento_outro",
    label: "Especifique o posicionamento do refrigerador...",
    type: "text",
    dependsOn: { questionId: "posicionamento", valueToMatch: "Outro" },
    required: true,
  },

  {
    id: "refrigerados",
    label: "OS PRODUTOS DA MARCA DA CIA ESTÃO DEVIDAMENTE REFRIGERADOS?",
    type: "radio",
    options: ["SIM", "NÃO"],
    dependsOn: { questionId: "possui_refrigerador", valueToMatch: [""], matchType: "not_equals" }, 
    required: true,
  },
  {
    id: "precificados",
    label: "TODOS OS SKUs OBRIGATÓRIOS PRESENTES ESTÃO PRECIFICADOS?",
    type: "radio",
    options: ["SIM", "NÃO"],
    dependsOn: { questionId: "possui_refrigerador", valueToMatch: [""], matchType: "not_equals" }, // Mostra sempre se passou do refri 
    required: true,
  },
  {
    id: "melhoria_precificacao",
    label: "SE NÃO, O QUE PODE SER FEITO PARA MELHORAR A PRECIFICAÇÃO?",
    type: "text",
    dependsOn: { questionId: "precificados", valueToMatch: "NÃO" },
    required: true,
  },
  {
    id: "observacoes",
    label: "OBSERVAÇÕES/ PLANO DE AÇÃO",
    type: "textarea",
    required: true,
  }
];

export const RGB_QUESTIONS: FormQuestion[] = [
  {
    id: "foco_visita",
    label: "Qual o foco da visita?",
    type: "radio",
    options: ["RGB - Maiores clientes", "RGB - Maiores quedas", "RGB - Maiores COMPASS não compradores"],
    required: true,
  },
  {
    id: "comprando_outras",
    label: "O cliente está comprando nossos produtos de outra fonte?",
    type: "radio",
    options: ["Sim", "Não", "Não quis informar"],
    required: true,
  },
  {
    id: "ttc_adequado",
    label: "O TTC está de acordo com a régua de preço recomendado?",
    type: "radio",
    options: ["Sim", "Não"],
    required: true,
  },
  {
    id: "acao_concorrencia",
    label: "Há alguma ação vigente da concorrência no PDV?",
    type: "radio",
    options: [
      "Sim, ação de preço para volume.",
      "Sim, ação promocional para consumidor final.",
      "Sim, contrato de visibilidade/exclusividade.",
      "Não.",
      "Outro"
    ],
    required: true,
  },
  {
    id: "acao_concorrencia_outro",
    label: "Descreva a ação da concorrência...",
    type: "text",
    dependsOn: { questionId: "acao_concorrencia", valueToMatch: "Outro" },
    required: true,
  },
  {
    id: "qtd_skus",
    label: "Quantos SKUs há no PDV?",
    type: "select",
    options: [
      "Não, 1  SKU",
      "Não, 2  SKUs",
      "Não, 3  SKUs",
      "Não, 4  SKUs",
      "Não, 5  SKUs",
      "Sim, 6  SKUs",
      "Sim, 7  SKUs",
      "Sim, 8  SKUs",
      "Sim, 9  SKUs",
      "Sim, 10 SKUs",
      "Sim, +10 SKUs",
      "Nenhum SKU no PDV."
    ],
    required: true,
  },
  {
    id: "possui_refrigerador",
    label: "PDV POSSUI ALGUM REFRIGERADOR?",
    type: "radio",
    options: [
      "PDV NÃO POSSUI GELADEIRA OU POSSUI APENAS GELADEIRA DA CONCORRÊNCIA",
      "PDV POSSUI APENAS GELADEIRA SEM MARCA",
      "PDV POSSUI GELADEIRA DA CIA"
    ],
    required: true,
  },
  {
    id: "posicionamento",
    label: "POSICIONAMENTO: O REFRIGERADOR DA CIA ESTÁ COM NO MÍNIMO 50% ABASTECIDO COM A MARCA DA GELADEIRA?",
    type: "radio",
    options: [
      "SIM, 50% da marca do equipamento",
      "Sim, 75% da marca do equipamento",
      "Sim, 100% da marca do equipamento",
      "Não, 25% da marca do equipamento",
      "Não, 10% da marca do equipamento",
      "Não há produto da marca do equipamento",
      "NÃO POSSUI REFRIGERADOR DA CIA",
      "Outro"
    ],
    dependsOn: { questionId: "possui_refrigerador", valueToMatch: "PDV POSSUI GELADEIRA DA CIA" },
    required: true,
  },
  {
    id: "posicionamento_outro",
    label: "Especifique o posicionamento do refrigerador...",
    type: "text",
    dependsOn: { questionId: "posicionamento", valueToMatch: "Outro" },
    required: true,
  },
  {
    id: "refrigerados",
    label: "OS PRODUTOS DA MARCA DA CIA ESTÃO DEVIDAMENTE REFRIGERADOS?",
    type: "radio",
    options: ["SIM", "NÃO"],
    dependsOn: { questionId: "possui_refrigerador", valueToMatch: [""], matchType: "not_equals" }, 
    required: true,
  },
  {
    id: "precificados",
    label: "TODOS OS SKUs OBRIGATÓRIOS PRESENTES ESTÃO PRECIFICADOS?",
    type: "radio",
    options: ["SIM", "NÃO"],
    dependsOn: { questionId: "possui_refrigerador", valueToMatch: [""], matchType: "not_equals" }, // Mostra sempre se passou do refri 
    required: true,
  },
  {
    id: "melhoria_precificacao",
    label: "SE NÃO, O QUE PODE SER FEITO PARA MELHORAR A PRECIFICAÇÃO?",
    type: "text",
    dependsOn: { questionId: "precificados", valueToMatch: "NÃO" },
    required: true,
  },
  {
    id: "observacoes",
    label: "OBSERVAÇÕES/ PLANO DE AÇÃO",
    type: "textarea",
    required: true,
  }
];

export const getQuestionsForIndicator = (tipoVisita: string, isRgbLocked?: boolean, rgbBaseOption?: string): FormQuestion[] => {
  if (!tipoVisita) return [];

  // Tratamento Dinâmico para RGB e seus travamentos no "Foco"
  if (tipoVisita.toUpperCase().includes("RGB")) {
    // Se isRgbLocked for true, adaptamos as opções da primeira pergunta dinamicamente
    // Mas para manter a pureza do Builder, podemos apenas retornar a lista bruta, 
    // e o componente se encarrega de setar o valor inicial e ocultar/travar. 
    return RGB_QUESTIONS; 
  }

  if (tipoVisita === "FDS") {
    return FDS_QUESTIONS;
  }

  return [];
};
