import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Visita, VendedorAtivo, MetaConfig } from "@/lib/api";
import { normalizeName } from "@/lib/utils";
import { getIndicadoresPorNivel, INDICADORES_COMPASS_LOCKED, INDICADORES_QUEDAS_LOCKED, INDICADORES_TIPO_RGB, REQUER_COACHING } from "@/lib/roles";

export function useDashboardMetrics(
  visitas: Visita[], 
  vendedoresBaseReal: VendedorAtivo[], 
  user: any,
  metasUsuario: MetaConfig[] = []
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

  // Níveis de Diretoria e Analistas (Niv0, Niv1 e Analistas) veem dados agregados por padrão
  const isGlobalView = user?.funcao?.toUpperCase()?.includes('ANALISTA') || 
                       user?.nivel === 'Niv1' || 
                       user?.nivel === 'Niv0';
  
  const isGerenteComercial = user?.nivel === 'Niv2';

  const minhasVisitas = useMemo(() => {
    if (!user?.name) return [];
    
    // Diretoria e Analistas possuem visão macro do negócio.
    // Os "Meus Indicadores" deles representam o todo da empresa.
    if (isGlobalView) {
      return visitas;
    }
    
    // Filtro rígido para os líderes de campo (Gerentes, Supervisores, etc):
    // Ver apenas as pesquisas (avaliações) realizadas por eles próprios na tela inicial.
    const nomeLogado = (user?.name || "").trim().toUpperCase();
    
    return visitas.filter(v => 
      v.avaliador && 
      v.avaliador.trim().toUpperCase() === nomeLogado
    );
  }, [visitas, user?.name, isGlobalView]);

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
    // Normalização agressiva: sem acentos, sem espaços, tudo em caixa alta
    const normalizeInd = (s?: string) => 
      s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "").trim().toUpperCase() : "";

    const listNormalized = (arr: string[]) => arr.map(id => normalizeInd(id));
    
    // Normalizações de Referência de roles.ts
    const N_COMPASS = listNormalized(INDICADORES_COMPASS_LOCKED);
    const N_QUEDAS = listNormalized(INDICADORES_QUEDAS_LOCKED);
    const N_TIPO_RGB = listNormalized(INDICADORES_TIPO_RGB);
    const N_COACHING = listNormalized(REQUER_COACHING);

    const qtdeFDS = filtradas.filter(v => normalizeInd(v.indicador_avaliado).includes('FDS')).length;
    
    const qtdeCompass = filtradas.filter(v => {
      const vInd = normalizeInd(v.indicador_avaliado);
      return vInd && (N_COMPASS.includes(vInd) || vInd.includes('COMPASS'));
    }).length;

    const qtdeQuedas = filtradas.filter(v => {
      const vInd = normalizeInd(v.indicador_avaliado);
      return vInd && (N_QUEDAS.includes(vInd) || vInd.includes('QUEDA'));
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
    
    const avaliadorEscolhido = normalizeName(avaliadorFiltro);

    vendedoresBaseReal.forEach(v => {
      let match = true;
      const supName = normalizeName(v.nome_supervisor);

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

     if (user?.nivel === 'Niv1' || user?.nivel === 'Niv0') {
      // Diretor: Meta fixa de 10 para cada indicador
      META_FDS = 10;
      META_RGB = 10; 
      META_COACHING = 10;
      META_COMPASS = 10;
      META_QUEDAS = 10;
    } else if (user?.nivel === 'Niv2') {
      // Gerente Comercial: Metas individuais fixas em 10
      META_FDS = 10;
      META_RGB = 10;
      META_COACHING = 10;
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

    // SOBREPOSIÇÃO POR METAS DINÂMICAS (Banco de Dados)
    if (metasUsuario && metasUsuario.length > 0) {
      metasUsuario.forEach(m => {
        const ind = normalizeInd(m.indicador);
        const val = m.meta_mensal;
        
        // Mapeamento Flexível: Tenta encontrar termos-chave se não houver match direto nas listas de roles.ts
        if (ind === 'FDS' || ind.includes('FDS')) {
          META_FDS = val;
        } else if (ind === 'RGB' || ind.includes('RGB') || N_TIPO_RGB.includes(ind)) {
          META_RGB = val;
        } else if (ind === 'COACHING' || ind.includes('COACHING') || N_COACHING.includes(ind)) {
          META_COACHING = val;
        } else if (ind === 'COMPASS' || ind.includes('COMPASS') || N_COMPASS.includes(ind)) {
          META_COMPASS = val;
        } else if (ind === 'QUEDA' || ind.includes('QUEDA') || N_QUEDAS.includes(ind)) {
          META_QUEDAS = val;
        }
      });
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
  }, [filtradas, minhasVisitas, avaliadorFiltro, unidade, cargoFiltro, dateRange, avaliadoresUnicos, user?.nivel, activeTab, vendedoresBaseReal, user?.name, metasUsuario]);

  const dadosGraficoAnalista = useMemo(() => {
    if (!isGlobalView) return [];

    const mapa = new Map<string, { name: string, FDS: number, RGB: number, Coaching: number, Compass: number, Quedas: number }>();
    
    const normalizeInd = (s?: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, "").trim().toUpperCase() : "";
    const listN = (arr: string[]) => arr.map(id => normalizeInd(id));
    const N_COMPASS = listN(INDICADORES_COMPASS_LOCKED);
    const N_QUEDAS = listN(INDICADORES_QUEDAS_LOCKED);
    const N_TIPO_RGB = listN(INDICADORES_TIPO_RGB);
    const N_COACHING = listN(REQUER_COACHING);

    filtradas.forEach(v => {
      const nomeAvaliador = v.avaliador;
      if (!nomeAvaliador) return;

      if (!mapa.has(nomeAvaliador)) mapa.set(nomeAvaliador, { name: nomeAvaliador, FDS: 0, RGB: 0, Coaching: 0, Compass: 0, Quedas: 0 });

      const curr = mapa.get(nomeAvaliador)!;
      const vInd = normalizeInd(v.indicador_avaliado);

      if (vInd === 'FDS') curr.FDS++;
      else if (N_TIPO_RGB.includes(vInd)) curr.RGB++;
      else if (N_COACHING.includes(vInd)) curr.Coaching++;
      else if (N_COMPASS.includes(vInd) || vInd.includes('COMPASS')) curr.Compass++;
      else if (N_QUEDAS.includes(vInd) || vInd.includes('QUEDA')) curr.Quedas++;
    });

    return Array.from(mapa.values()).sort((a, b) => 
      (b.FDS + b.RGB + b.Coaching + b.Compass + b.Quedas) - (a.FDS + a.RGB + a.Coaching + a.Compass + a.Quedas)
    );
  }, [filtradas, isGlobalView]);

  const usuariosUnicos = useMemo(() => {
    const nomes = new Set<string>();
    
    // Usar o utilitário centralizado normalizeName para garantir consistência
    const uRaw = (user?.unidade || "").toUpperCase();
    // TRUMP CARD: Se for Diego, independente do que está salvo no banco, é Macaé.
    const isDiegos = normalizeName(user?.name || "").includes("diegomanhanini");
    const isMacae = isDiegos || uRaw === "M" || uRaw.includes("MACA");
    // Campos nunca pode ser se for Diego (evita colisão de dados sujos)
    const isCampos = !isDiegos && (uRaw === "C" || uRaw.includes("CAMPOS"));

    vendedoresBaseReal.forEach(v => {
      const isMyBranch = (isMacae && (v.filial === 'M' || v.filial?.toUpperCase().includes('MACA'))) ||
                         (isCampos && (v.filial === 'C' || v.filial?.toUpperCase().includes('CAMPO')));

      if (isGlobalView || isGerenteComercial) {
         if (v.nome_vendedor) nomes.add(v.nome_vendedor.trim().toUpperCase());
         if (v.nome_supervisor) nomes.add(v.nome_supervisor.trim().toUpperCase());
         if (v.gerente) nomes.add(v.gerente.trim().toUpperCase());
         if (v.gerente_comercial) nomes.add(v.gerente_comercial.trim().toUpperCase());
      } else if (user?.nivel === 'Niv3') {
         if (normalizeName(v.gerente) === normalizeName(user?.name) || isMyBranch) {
            if (v.nome_vendedor) nomes.add(v.nome_vendedor.trim().toUpperCase());
            if (v.nome_supervisor) nomes.add(v.nome_supervisor.trim().toUpperCase());
         }
      } else if (user?.nivel === 'Niv4') {
         if (normalizeName(v.nome_supervisor) === normalizeName(user?.name)) {
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
