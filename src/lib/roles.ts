// src/lib/roles.ts

export type NivelHieriaquico = "Niv0" | "Niv1" | "Niv2" | "Niv3" | "Niv4" | "Niv5";

export const INDICADORES_MAP = {
    "Niv0": [],
    "Niv1": [
        "RGB - Maiores clientes",
        "MAIORES QUEDAS RGB MES ANTERIOR"
    ],
    "Niv2": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "RGB - Maiores clientes"
    ],
    "Niv3": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "RGB - Maiores clientes"
    ],
    "Niv4": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "RGB - Maiores clientes"
    ],
    "Niv5": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "RGB - Maiores clientes"
    ]
};

export const getIndicadoresPorNivel = (nivel?: string | null): string[] => {
    if (!nivel || !(nivel in INDICADORES_MAP)) return [];
    return INDICADORES_MAP[nivel as NivelHieriaquico];
};
