// src/lib/roles.ts

export type NivelHieriaquico = "Niv0" | "Niv1" | "Niv2" | "Niv3" | "Niv4" | "Niv5";

export const INDICADORES_MAP = {
    "Niv0": [],
    "Niv1": [
        "MAIORES POTENCIAIS BASE COMPASS em RGB BAR",
        "MAIORES QUEDAS RGB MES ANTERIOR"
    ],
    "Niv2": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "MAIORES POTENCIAIS BASE COMPASS em RGB BAR"
    ],
    "Niv3": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "MAIORES POTENCIAIS COMPASS em RGB BAR"
    ],
    "Niv4": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "MAIORES POTENCIAS BASE DE COMPRAS RGB"
    ],
    "Niv5": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "MAIORES POTENCIAS BASE DE COMPRAS RGB"
    ]
};

export const getIndicadoresPorNivel = (nivel?: string | null): string[] => {
    if (!nivel || !(nivel in INDICADORES_MAP)) return [];
    return INDICADORES_MAP[nivel as NivelHieriaquico];
};
