// src/lib/roles.ts

export type NivelHieriaquico = "Niv0" | "Niv1" | "Niv2" | "Niv3" | "Niv4" | "Niv5";

export const INDICADORES_MAP = {
    "Niv0": [],
    "Niv1": [
        "Maior Potencial Base COMPASS em RGB BAR",
        "Maiores quedas RGB mês anterior"
    ],
    "Niv2": [
        "FDS",
        "Coaching Rotina Básica com Vendedor",
        "Maiores quedas RGB do mês anterior"
    ],
    "Niv3": [
        "FDS",
        "Coaching Rotina Básica com Vendedor",
        "Maior potencial COMPASS em RGB BAR"
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
    if (!nivel || !(nivel in INDICADORES_MAP)) return [];
    return INDICADORES_MAP[nivel as NivelHieriaquico];
};

// ==========================================
// FORM DYNAMIC CONFIGURATION ARCHITECTURE
// ==========================================
// Aqui declaramos arrays contendo as STRINGS literais dos indicadores que
// acionam determinados "Agrupamentos de Perguntas" (Steps).

export const REQUER_PRODUTOS_EXECUCAO = [
    "FDS",
    "Foco RGB",
    "Maior potencial COMPASS em RGB BAR",
    "Maior Potencial Base COMPASS em RGB BAR",
    "Maiores quedas RGB do mês anterior",
    "Maiores quedas RGB mês anterior",
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
    "Maior potencial COMPASS em RGB BAR",
    "Maior Potencial Base COMPASS em RGB BAR",
    "Maiores quedas RGB do mês anterior",
    "Maiores quedas RGB mês anterior",
    "FOCO RGB",
    "FOCO MAIORES QUEDAS RGB",
    "MAIORES POTENCIAS BASE DE COMPRAS RGB",
    "MAIORES POTENCIAS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS BASE COMPASS em RGB BAR",
    "RGB - Maiores clientes",
    "MAIORES QUEDAS RGB MES ANTERIOR"
];

export const INDICADORES_COMPASS_LOCKED = [
    "Maior potencial COMPASS em RGB BAR",
    "Maior Potencial Base COMPASS em RGB BAR",
    "MAIORES POTENCIAS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS COMPASS em RGB BAR",
    "MAIORES POTENCIAIS BASE COMPASS em RGB BAR",
    "RGB - Maiores clientes"
];

export const INDICADORES_QUEDAS_LOCKED = [
    "Maiores quedas RGB do mês anterior",
    "Maiores quedas RGB mês anterior",
    "MAIORES QUEDAS RGB MES ANTERIOR",
    "FOCO MAIORES QUEDAS RGB"
];
