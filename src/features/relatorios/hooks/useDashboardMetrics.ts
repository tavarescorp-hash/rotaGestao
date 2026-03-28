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
  const [usuarioFiltro, setUsuarioFiltro] = useState("todos");

  const isGlobalView = user?.funcao?.toUpperCase().includes('ANALISTA') || user?.nivel === 'Niv1';
  const isGerenteComercial = user?.nivel === 'Niv2';

  const minhasVisitas = useMemo(() => {
    // Para Diretoria e Gerência Comercial (Niv1/Niv2)
    if (isGlobalView || isGerenteComercial) {
      // Se não houver filtro ativo, mostra apenas o DASHBOARD PESSOAL (minhas visitas)
      if (usuarioFiltro === "todos" && avaliadorFiltro === "todos" && activeTab === "minhas") {
        return visitas.filter(v => v.avaliador === user?.name);
      }
      
      // Se houver filtro de unidade (GC) ou se clicou em alguém na equipe, libera o global para o filtro
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
  }, [visitas, user?.name, user?.nivel, user?.unidade, activeTab, isGlobalView, isGerenteComercial, usuarioFiltro, avaliadorFiltro]);

  const avaliadoresUnicos = useMemo(() => {
    const avaliadoresValidos = minhasVisitas.map(v => v.avaliador).filter(Boolean) as string[];
    return Array.from(new Set(avaliadoresValidos)).sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const filtradas = useMemo(() => {
    return minhasVisitas.filter((v) => {
      if (usuarioFiltro !== "todos") {
        const u = usuarioFiltro.toUpperCase();
        const vendInfo = vendedoresBaseReal.find(base => base.nome_vendedor?.toUpperCase() === v.nome_vendedor?.toUpperCase());
        
        if (
          v.nome_vendedor?.toUpperCase() !== u && 
          v.avaliador?.toUpperCase() !== u && 
          v.cargo?.toUpperCase() !== u &&
          vendInfo?.gerente_comercial?.toUpperCase() !== u
        ) return false;
      }
      if (avaliadorFiltro !== "todos" && v.avaliador !== avaliadorFiltro) return false;
      if (unidade !== "todas" && v.unidade !== unidade) return false;
      if (indicadorFiltro !== "todos" && v.indicador_avaliado !== indicadorFiltro) return false;
      if (cargoFiltro !== "todos" && v.cargo?.toUpperCase() !== cargoFiltro.toUpperCase()) return false;

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
  }, [minhasVisitas, dateRange, unidade, indicadorFiltro, cargoFiltro, avaliadorFiltro, usuarioFiltro]);

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
    const normalizeInd = (s?: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() : "";

    const listNormalized = (arr: string[]) => arr.map(id => normalizeInd(id));
    
    // Normalizações de Referência de roles.ts
    const N_COMPASS = listNormalized(INDICADORES_COMPASS_LOCKED);
    const N_QUEDAS = listNormalized(INDICADORES_QUEDAS_LOCKED);
    const N_TIPO_RGB = listNormalized(INDICADORES_TIPO_RGB);
    const N_COACHING = listNormalized(REQUER_COACHING);

    const qtdeFDS = filtradas.filter(v => normalizeInd(v.indicador_avaliado) === 'FDS').length;
    
    const qtdeCompass = filtradas.filter(v => {
      const vInd = normalizeInd(v.indicador_avaliado);
      return vInd && N_COMPASS.includes(vInd);
    }).length;

    const qtdeQuedas = filtradas.filter(v => {
      const vInd = normalizeInd(v.indicador_avaliado);
      return vInd && N_QUEDAS.includes(vInd);
    }).length;
    
    // RGB Total (Incluindo subcategorias se fizerem parte da coleção de RGB)
    const qtdeRGB = filtradas.filter(v => {
      const vInd = normalizeInd(v.indicador_avaliado);
      if (!vInd) return false;
      return N_TIPO_RGB.includes(vInd);
    }).length;

    const coachingVisitas = filtradas.filter(v => {
      const vInd = normalizeInd(v.indicador_avaliado);
      return vInd && N_COACHING.includes(vInd);
    });
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

    // Nova Lógica de Metas Fase 7: Agregação por Soma de Subordinados
    const countSupervisores = () => {
      const sups = new Set<string>();
      vendedoresBaseReal.forEach(v => {
        if (v.nome_supervisor) sups.add(v.nome_supervisor.trim().toUpperCase());
      });
      return Math.max(1, sups.size);
    };

    const countGerentesVendas = () => {
      const gers = new Set<string>();
      vendedoresBaseReal.forEach(v => {
        if (v.gerente) gers.add(v.gerente.trim().toUpperCase());
      });
      return Math.max(1, gers.size);
    };

    const nSupervisores = countSupervisores();
    const nGerentes = countGerentesVendas();

    let META_FDS = 10 * multi;
    let META_RGB = 20 * multi;
    let META_COACHING = Math.max(1, vendedoresUnicos) * 5;
    let META_COMPASS = 0;
    let META_QUEDAS = 0;

    if (user?.nivel === 'Niv1') {
      // Diretor: Meta é 10 FDS por supervisor e 40 Coaching por supervisor (agregado)
      META_FDS = nSupervisores * 10;
      META_RGB = nSupervisores * 20; 
      META_COACHING = nSupervisores * 40;
      META_COMPASS = 10; // Meta fixa Direção
      META_QUEDAS = 10;
    } else if (user?.nivel === 'Niv2') {
      // Gerente Comercial: Meta baseada nos seus supervisores da filial
      META_FDS = nSupervisores * 10;
      META_RGB = nSupervisores * 20;
      META_COACHING = nSupervisores * 40;
      META_QUEDAS = 10;
    } else if (user?.nivel === 'Niv3') {
      META_FDS = 20; 
      META_RGB = 10; 
      META_COACHING = 20;
    } else if (user?.nivel === 'Niv4' || user?.email === 'carlos.junior@unibeer.com.br') {
      META_COACHING = 40;
      META_FDS = 10;
      META_RGB = 20;
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
    if (!isGlobalView) return [];

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
  }, [filtradas, isGlobalView]);

  const usuariosUnicos = useMemo(() => {
    const nomes = new Set<string>();
    
    // Função universal flexível: Em vez de match exato, verifica se todos os fragmentos do 'search' (guilherme.chagas) estão em 'target' (Guilherme DAS Chagas)
    const checkNameMatch = (target?: string, search?: string) => {
      if (!target || !search) return false;
      const t = target.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const parts = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/);
      return parts.every(part => t.includes(part));
    };

    const isMacae = user?.unidade?.toUpperCase().includes('MACAE') || user?.unidade?.toUpperCase().includes('MACAÉ');

    vendedoresBaseReal.forEach(v => {
      const isMyBranch = isMacae ? (v.filial === 'M' || v.filial === 'MACAE') : (v.filial === 'C' || v.filial === 'CAMPOS');

      if (isGlobalView || isGerenteComercial) {
         if (v.nome_vendedor) nomes.add(v.nome_vendedor.trim().toUpperCase());
         if (v.nome_supervisor) nomes.add(v.nome_supervisor.trim().toUpperCase());
         if (v.gerente) nomes.add(v.gerente.trim().toUpperCase());
         if (v.gerente_comercial) nomes.add(v.gerente_comercial.trim().toUpperCase());
      } else if (user?.nivel === 'Niv3') {
         if (checkNameMatch(v.gerente, user?.name) || isMyBranch) {
            if (v.nome_vendedor) nomes.add(v.nome_vendedor.trim().toUpperCase());
            if (v.nome_supervisor) nomes.add(v.nome_supervisor.trim().toUpperCase());
         }
      } else if (user?.nivel === 'Niv4') {
         if (checkNameMatch(v.nome_supervisor, user?.name)) {
            if (v.nome_vendedor) nomes.add(v.nome_vendedor.trim().toUpperCase());
         }
      }
    });

    return Array.from(nomes).sort((a, b) => a.localeCompare(b));
  }, [vendedoresBaseReal, user?.name, user?.nivel, user?.unidade, isGlobalView, isGerenteComercial]);

  const cargosUnicos = useMemo(() => {
    let cargos = ['VENDEDOR', 'SUPERVISOR', 'GERENTE'];
    if (user?.nivel === 'Niv3') cargos = ['VENDEDOR', 'SUPERVISOR'];
    if (user?.nivel === 'Niv4') cargos = ['VENDEDOR'];
    if (isGlobalView || isGerenteComercial) cargos = ['VENDEDOR', 'SUPERVISOR', 'GERENTE'];
    
    return cargos.sort((a, b) => a.localeCompare(b));
  }, [user?.nivel, isGlobalView, isGerenteComercial]);

  const unidadesUnicas = useMemo(() => {
    // Pegar filiais dos vendedores reais na base de dados para listar tudo
    const filiais = vendedoresBaseReal.map(v => {
      let f = v.filial?.toUpperCase();
      if (f === "C") return "CAMPOS";
      if (f === "M") return "MACAÉ";
      return f;
    }).filter(Boolean) as string[];
    
    const visUnits = minhasVisitas.map(v => v.unidade?.toUpperCase()).filter(Boolean) as string[];
    return Array.from(new Set([...filiais, ...visUnits])).sort((a, b) => a.localeCompare(b));
  }, [vendedoresBaseReal, minhasVisitas]);

  return {
    dateRange, setDateRange,
    unidade, setUnidade,
    indicadorFiltro, setIndicadorFiltro,
    cargoFiltro, setCargoFiltro,
    activeTab, setActiveTab,
    avaliadorFiltro, setAvaliadorFiltro,
    usuarioFiltro, setUsuarioFiltro,
    isAnalista: isGlobalView, isGerenteComercial, // Mantendo export estrito isAnalista para o componente legado
    minhasVisitas, avaliadoresUnicos, filtradas, visitasHierarchy,
    estatisticasMes, dadosGraficoAnalista, usuariosUnicos, cargosUnicos, unidadesUnicas
  };
}
