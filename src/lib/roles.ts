// src/lib/roles.ts

export type NivelHieriaquico = "Niv0" | "Niv1" | "Niv2" | "Niv3" | "Niv4" | "Niv5";

export const INDICADORES_MAP = {
    "Niv0": [],
    "Niv1": [
        "Maiores Potenciais Base Compass em RGB BAR",
        "Maiores Quedas RGB Mês Anterior"
    ],
    "Niv2": [
        "FDS",
        "Coaching Rotina Básica com Vendedor",
        "Maiores Quedas RGB Mês Anterior"
    ],
    "Niv3": [
        "FDS",
        "Coaching Rotina Básica com Vendedor",
        "Maiores Potenciais Base Compass em RGB BAR"
    ],
    "Niv4": [
        "FDS",
        "Coaching Rotina Básica com Vendedor",
        "Foco RGB"
    ],
    "Niv5": [
        "FDS",
        "Coaching Rotina Básica com Vendedor",
        "Foco RGB"
    ]
};

export const getIndicadoresPorNivel = (nivel?: string | null): string[] => {
    if (!nivel) return INDICADORES_MAP["Niv5"]; // Default para qualquer usuário logado

    const normalized = nivel.toUpperCase();
    let levelKey: NivelHieriaquico = "Niv5";

    if (normalized.includes("NIV0") || normalized.includes("MASTER") || normalized.includes("ADMIN") || normalized.includes("ANALISTA")) levelKey = "Niv0";
    else if (normalized.includes("NIV1") || normalized.includes("DIRETOR") || normalized.includes("DIRETORIA")) levelKey = "Niv1";
    else if (normalized.includes("NIV2") || normalized.includes("GERENTE COMERCIAL")) levelKey = "Niv2";
    else if (normalized.includes("NIV3") || normalized.includes("GERENTE")) levelKey = "Niv3";
    else if (normalized.includes("NIV4") || normalized.includes("SUPERVISOR")) levelKey = "Niv4";
    else if (normalized.includes("NIV5") || normalized.includes("VENDEDOR") || normalized.includes("USUARIO")) levelKey = "Niv5";
    // Tenta usar a chave direta se existir no mapa
    else if (nivel in INDICADORES_MAP) levelKey = nivel as NivelHieriaquico;

    return INDICADORES_MAP[levelKey] || INDICADORES_MAP["Niv5"];
};

// ==========================================
// FORM DYNAMIC CONFIGURATION ARCHITECTURE
// ==========================================
// Aqui declaramos arrays contendo as STRINGS literais dos indicadores que
// acionam determinados "Agrupamentos de Perguntas" (Steps).

export const REQUER_PRODUTOS_EXECUCAO = [
    "FDS",
    "Foco RGB",
    "Maior Potencial COMPASS em RGB BAR",
    "Maiores Potenciais Base Compass em RGB BAR",
    "Maiores Quedas RGB Mês Anterior",
    "Maiores Quedas RGB Mês Anterior",
    "FOCO RGB",
    "FOCO MAIORES QUEDAS RGB",
    "MAIORES POTENCIAS BASE DE COMPRAS RGB",
    "MAIORES POTENCIAS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS BASE COMPASS em RGB BAR",
    "RGB - Maiores clientes"
];

export const REQUER_COACHING = [
    "Coaching Rotina Básica com Vendedor",
    "COACHING ROTA BASICA COM VENDEDOR"
];

export const INDICADORES_TIPO_RGB = [
    "Foco RGB",
    "Maior Potencial COMPASS em RGB BAR",
    "Maiores Potenciais Base Compass em RGB BAR",
    "Maiores Quedas RGB Mês Anterior",
    "Maiores Quedas RGB Mês Anterior",
    "FOCO RGB",
    "FOCO MAIORES QUEDAS RGB",
    "MAIORES POTENCIAS BASE DE COMPRAS RGB",
    "MAIORES POTENCIAS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS BASE COMPASS em RGB BAR",
    "RGB - Maiores Clientes",
    "MAIORES QUEDAS RGB MES ANTERIOR"
];

export const INDICADORES_COMPASS_LOCKED = [
    "Maior Potencial COMPASS em RGB BAR",
    "Maiores Potenciais Base Compass em RGB BAR",
    "MAIORES POTENCIAS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS BASE COMPASS em RGB BAR",
    "RGB - Maiores Clientes"
];

export const INDICADORES_QUEDAS_LOCKED = [
    "Maiores Quedas RGB Mês Anterior",
    "Maiores quedas RGB mês anterior",
    "MAIORES QUEDAS RGB MES ANTERIOR",
    "FOCO MAIORES QUEDAS RGB"
];
