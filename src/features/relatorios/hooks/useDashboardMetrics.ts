import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Visita, VendedorAtivo } from "@/lib/api";
import { getIndicadoresPorNivel, INDICADORES_COMPASS_LOCKED, INDICADORES_QUEDAS_LOCKED, INDICADORES_TIPO_RGB, REQUER_COACHING } from "@/lib/roles";

export function useDashboardMetrics(
  visitas: Visita[], 
  vendedoresBaseReal: VendedorAtivo[], 
  user: any
) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [unidade, setUnidade] = useState("todas");
  const [indicadorFiltro, setIndicadorFiltro] = useState("todos");
  const [cargoFiltro, setCargoFiltro] = useState("todos");
  const [activeTab, setActiveTab] = useState("minhas");
  const [avaliadorFiltro, setAvaliadorFiltro] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");

  const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA');
  const isGerenteComercial = user?.nivel === 'Niv2';

  const minhasVisitas = useMemo(() => {
    if (isAnalista) return visitas;

    if (isGerenteComercial) {
      if (activeTab === 'macae') return visitas.filter(v => v.unidade?.toUpperCase().includes('MACA') || v.unidade === 'M');
      if (activeTab === 'campos') return visitas.filter(v => v.unidade?.toUpperCase().includes('CAMPO') || v.unidade === 'C');
      return visitas;
    }

    if (user?.nivel === 'Niv3' && activeTab === 'unidade') {
      const uLogada = user?.unidade?.toUpperCase() || "";
      return visitas.filter(v => {
        const dUnidade = v.unidade?.toUpperCase() || "";
        const isSameUnidade = (uLogada.includes('MACA') && (dUnidade.includes('MACA') || dUnidade === 'M')) ||
                              (uLogada.includes('CAMPO') && (dUnidade.includes('CAMPO') || dUnidade === 'C')) ||
                              (dUnidade === uLogada);
        return isSameUnidade && !v.cargo?.toUpperCase().includes('GERENTE');
      });
    }
    return visitas.filter(v => v.avaliador === user?.name);
  }, [visitas, user?.name, user?.nivel, user?.unidade, activeTab, isAnalista, isGerenteComercial]);

  const avaliadoresUnicos = useMemo(() => {
    const avaliadoresValidos = minhasVisitas.map(v => v.avaliador).filter(Boolean) as string[];
    return Array.from(new Set(avaliadoresValidos)).sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const filtradas = useMemo(() => {
    return minhasVisitas.filter((v) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const nomeS = v.nome_vendedor?.toLowerCase() || '';
        const avalS = v.avaliador?.toLowerCase() || '';
        if (!nomeS.includes(term) && !avalS.includes(term)) return false;
      }
      if (avaliadorFiltro !== "todos" && v.avaliador !== avaliadorFiltro) return false;
      if (unidade !== "todas" && v.unidade !== unidade) return false;
      if (indicadorFiltro !== "todos" && v.indicador_avaliado !== indicadorFiltro) return false;
      if (cargoFiltro !== "todos" && v.cargo !== cargoFiltro) return false;

      if (dateRange?.from || dateRange?.to) {
        const [anoStr, mesStr, diaStr] = (v.data_visita || "").split("-");
        if (!anoStr || !mesStr || !diaStr) return false;

        const visitaDate = new Date(parseInt(anoStr), parseInt(mesStr) - 1, parseInt(diaStr), 12, 0, 0);

        if (dateRange?.from) {
          const fromStart = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0);
          if (visitaDate < fromStart) return false;
        }
        if (dateRange?.to) {
          const toEnd = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59);
          if (visitaDate > toEnd) return false;
        }
      }
      return true;
    });
  }, [minhasVisitas, dateRange, unidade, indicadorFiltro, cargoFiltro, avaliadorFiltro, searchTerm]);

  const visitasHierarchy = useMemo(() => {
    return visitas.filter((v) => {
      if (dateRange?.from || dateRange?.to) {
        const [anoStr, mesStr, diaStr] = (v.data_visita || "").split("-");
        if (!anoStr || !mesStr || !diaStr) return false;

        const visitaDate = new Date(parseInt(anoStr), parseInt(mesStr) - 1, parseInt(diaStr), 12, 0, 0);

        if (dateRange?.from) {
          const fromStart = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0);
          if (visitaDate < fromStart) return false;
        }
        if (dateRange?.to) {
          const toEnd = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59);
          if (visitaDate > toEnd) return false;
        }
      }
      return true;
    });
  }, [visitas, dateRange]);

  const estatisticasMes = useMemo(() => {
    const qtdeFDS = filtradas.filter(v => v.indicador_avaliado === 'FDS').length;
    const qtdeCompass = filtradas.filter(v => v.indicador_avaliado && INDICADORES_COMPASS_LOCKED.includes(v.indicador_avaliado)).length;
    const qtdeQuedas = filtradas.filter(v => v.indicador_avaliado && INDICADORES_QUEDAS_LOCKED.includes(v.indicador_avaliado)).length;
    
    const qtdeRGB = filtradas.filter(v => {
      if (!v.indicador_avaliado) return false;
      return INDICADORES_TIPO_RGB.includes(v.indicador_avaliado) && 
             !INDICADORES_COMPASS_LOCKED.includes(v.indicador_avaliado) && 
             !INDICADORES_QUEDAS_LOCKED.includes(v.indicador_avaliado);
    }).length;

    const coachingVisitas = filtradas.filter(v => v.indicador_avaliado && REQUER_COACHING.includes(v.indicador_avaliado));
    const qtdeCoaching = coachingVisitas.length;

    const mapaVendedores = new Map<string, number>();
    const baseVendedoresOficiais = new Set<string>();
    const normalizeStr = (s?: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : "";

    const avaliadorEscolhido = normalizeStr(avaliadorFiltro);

    vendedoresBaseReal.forEach(v => {
      let match = true;
      const supName = normalizeStr(v.nome_supervisor);

      if (avaliadorFiltro !== "todos") {
        match = supName === avaliadorEscolhido;
      }

      if (match && v.nome_vendedor) {
        baseVendedoresOficiais.add(v.nome_vendedor.toUpperCase().trim());
      }
    });

    const vendedoresCoachingAtuais = new Set<string>();
    coachingVisitas.forEach(v => {
      if (v.nome_vendedor) {
        const vNomeNormalizado = v.nome_vendedor.toUpperCase().trim();
        vendedoresCoachingAtuais.add(vNomeNormalizado);
        mapaVendedores.set(vNomeNormalizado, (mapaVendedores.get(vNomeNormalizado) || 0) + 1);
      }
    });

    const vendedoresUnicos = Math.max(baseVendedoresOficiais.size, vendedoresCoachingAtuais.size);

    const detalhesCoaching = Array.from(mapaVendedores.entries()).map(([nome, atual]) => ({
      nome, atual, meta: 5
    })).sort((a, b) => b.atual - a.atual);

    const multi = (user?.nivel === 'Niv3' && activeTab === 'unidade' && avaliadorFiltro === 'todos')
      ? Math.max(1, avaliadoresUnicos.length)
      : 1;

    let META_FDS = 10 * multi;
    let META_RGB = 20 * multi;
    let META_COACHING = Math.max(1, vendedoresUnicos) * 5;
    let META_COMPASS = 0;
    let META_QUEDAS = 0;

    if (user?.nivel === 'Niv1') {
      META_FDS = 0; META_RGB = 0; META_COMPASS = 10; META_QUEDAS = 10; META_COACHING = 0;
    } else if (user?.nivel === 'Niv2') {
      META_FDS = 10; META_RGB = 0; META_COMPASS = 0; META_QUEDAS = 10; META_COACHING = 10;
    } else if (user?.nivel === 'Niv3') {
      META_FDS = 20; META_RGB = 10; META_COACHING = 20;
    } else if (user?.nivel === 'Niv4' || user?.email === 'carlos.junior@unibeer.com.br') {
      META_COACHING = 40;
    }

    const hoje = new Date();
    const fim = dateRange?.to || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const diasRestantes = Math.max(0, Math.ceil((fim.getTime() - hoje.getTime()) / (1000 * 3600 * 24)));

    return {
      qtdeFDS, qtdeRGB, qtdeCoaching, qtdeCompass, qtdeQuedas,
      META_FDS, META_RGB, META_COACHING, META_COMPASS, META_QUEDAS,
      baseVendedores: vendedoresUnicos,
      vendedoresAvaliados: vendedoresCoachingAtuais.size,
      detalhesCoaching,
      diasRestantes
    };
  }, [filtradas, minhasVisitas, avaliadorFiltro, unidade, cargoFiltro, dateRange, avaliadoresUnicos, user?.nivel, activeTab, vendedoresBaseReal, user?.name]);

  const dadosGraficoAnalista = useMemo(() => {
    if (!isAnalista) return [];

    const mapa = new Map<string, { name: string, FDS: number, RGB: number, Coaching: number }>();
    filtradas.forEach(v => {
      const nomeAvaliador = v.avaliador;
      if (!nomeAvaliador) return;

      if (!mapa.has(nomeAvaliador)) mapa.set(nomeAvaliador, { name: nomeAvaliador, FDS: 0, RGB: 0, Coaching: 0 });

      const curr = mapa.get(nomeAvaliador)!;
      if (v.indicador_avaliado === 'FDS') curr.FDS++;
      else if (v.indicador_avaliado && INDICADORES_TIPO_RGB.includes(v.indicador_avaliado)) curr.RGB++;
      else if (v.indicador_avaliado && REQUER_COACHING.includes(v.indicador_avaliado)) curr.Coaching++;
    });

    return Array.from(mapa.values()).sort((a, b) => (b.FDS + b.RGB + b.Coaching) - (a.FDS + a.RGB + a.Coaching));
  }, [filtradas, isAnalista]);

  const indicadoresUnicos = useMemo(() => {
    return Array.from(new Set(minhasVisitas.map(v => v.indicador_avaliado).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const cargosUnicos = useMemo(() => {
    return Array.from(new Set(minhasVisitas.map(v => v.cargo).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const unidadesUnicas = useMemo(() => {
    return Array.from(new Set(minhasVisitas.map(v => v.unidade).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  return {
    dateRange, setDateRange,
    unidade, setUnidade,
    indicadorFiltro, setIndicadorFiltro,
    cargoFiltro, setCargoFiltro,
    activeTab, setActiveTab,
    avaliadorFiltro, setAvaliadorFiltro,
    searchTerm, setSearchTerm,
    isAnalista, isGerenteComercial,
    minhasVisitas, avaliadoresUnicos, filtradas, visitasHierarchy,
    estatisticasMes, dadosGraficoAnalista, indicadoresUnicos, cargosUnicos, unidadesUnicas
  };
}
