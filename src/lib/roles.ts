// src/lib/roles.ts

export type NivelHieriaquico = "Niv0" | "Niv1" | "Niv2" | "Niv3" | "Niv4" | "Niv5";

export const INDICADORES_MAP = {
    "Niv0": [],
    "Niv1": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "MAIORES POTENCIAS BASE DE COMPRAS RGB"
    ],
    "Niv2": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "FOCO MAIORES QUEDAS RGB"
    ],
    "Niv3": [
        "FDS",
        "COACHING ROTA BASICA COM VENDEDOR",
        "MAIORES POTENCIAS BASE DE COMPRAS RGB"
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
