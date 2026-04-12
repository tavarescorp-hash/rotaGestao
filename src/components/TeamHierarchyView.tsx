import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { normalizeName } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Users,
  Target,
  CheckCircle2,
  Calendar,
  ClipboardList,
  UserCircle,
  TrendingUp,
  Star,
  ArrowLeft,
  ChevronRight,
  ArrowUpRight,
  MapPin
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { INDICADORES_TIPO_RGB, REQUER_COACHING } from '@/lib/roles';
import { format, parseISO } from 'date-fns';
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

import { VendedorAtivo } from '@/lib/api';

interface HierarchyProps {
  visitas: any[];
  vendedores: VendedorAtivo[];
  userLevel: string | undefined;
  userName: string | undefined;
  userId?: string | undefined;
  userUnidade: string | undefined;
  userFuncao?: string | undefined;
  searchTerm?: string;
  onSelectVisita?: (v: any) => void;
}

export function TeamHierarchyView({ vendedores, visitas, userLevel, userName, userId, userUnidade, userFuncao, searchTerm, onSelectVisita }: HierarchyProps) {
  const [filtroLider, setFiltroLider] = useState<{ name: string, type: 'GCOM' | 'GV' | 'SUP' } | null>(null);
  const [drilldown, setDrilldown] = useState<{ name: string, indicator: string, type?: 'GCOM' | 'GV' | 'SUP', vendedorFiltro?: string } | null>(null);

  // Efeito de Busca: Salta direto para o líder se o termo de busca for um nome exato
  useEffect(() => {
    if (searchTerm && searchTerm !== "todos") {
      const s = searchTerm.toUpperCase().trim();
      const match = vendedores.find(v =>
        v.nome_supervisor?.toUpperCase() === s ||
        v.gerente?.toUpperCase() === s ||
        v.gerente_comercial?.toUpperCase() === s
      );

      if (match) {
        if (match.nome_supervisor?.toUpperCase() === s) setFiltroLider({ name: match.nome_supervisor, type: 'SUP' });
        else if (match.gerente?.toUpperCase() === s) setFiltroLider({ name: match.gerente, type: 'GV' });
        else if (match.gerente_comercial?.toUpperCase() === s) setFiltroLider({ name: match.gerente_comercial, type: 'GCOM' });
      }
    } else if (searchTerm === "todos") {
      setFiltroLider(null);
    }
  }, [searchTerm, vendedores]);

  // Auto-seleção baseada no nível do usuário
  useEffect(() => {
    if (!filtroLider) {
      if (userLevel === 'Niv4' && userName) setFiltroLider({ name: userName, type: 'SUP' });
      else if (userLevel === 'Niv3' && userName) setFiltroLider({ name: userName, type: 'GV' });
      else if (userLevel === 'Niv2' && userName) setFiltroLider({ name: userName, type: 'GCOM' });
    }
  }, [userLevel, userName]);

  // --- LÓGICA DE MÉTRICAS ---
  const { metricsByEvaluator, metricsByVendedor, totalStats } = useMemo(() => {
    const stats: Record<string, { fds: number, rgb: number, coaching: number }> = {};
    const statsVend: Record<string, { fds: number, rgb: number, coaching: number }> = {};
    const total = { fds: 0, rgb: 0, coaching: 0 };
    const currentVisitas = Array.isArray(visitas) ? visitas : [];
    const N_RGB = INDICADORES_TIPO_RGB.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
    const N_COACHING = REQUER_COACHING.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());

    currentVisitas.forEach(v => {
      const evalName = normalizeName(v.avaliador);
      const vendName = normalizeName(v.nome_vendedor || v.vendedor);
      const indNormalized = (v.indicador_avaliado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      
      if (evalName) {
        if (!stats[evalName]) stats[evalName] = { fds: 0, rgb: 0, coaching: 0 };
        if (indNormalized.includes('FDS')) { stats[evalName].fds++; total.fds++; }
        else if (indNormalized && (N_RGB.includes(indNormalized) || indNormalized.includes('RGB'))) { stats[evalName].rgb++; total.rgb++; }
        else if (indNormalized && (N_COACHING.includes(indNormalized) || indNormalized.includes("COACHING"))) { stats[evalName].coaching++; total.coaching++; }
      }
      
      if (vendName) {
        if (!statsVend[vendName]) statsVend[vendName] = { fds: 0, rgb: 0, coaching: 0 };
        if (indNormalized.includes('FDS')) { statsVend[vendName].fds++; }
        else if (indNormalized && (N_RGB.includes(indNormalized) || indNormalized.includes('RGB'))) { statsVend[vendName].rgb++; }
        else if (indNormalized && (N_COACHING.includes(indNormalized) || indNormalized.includes("COACHING"))) { statsVend[vendName].coaching++; }
      }
    });
    return { metricsByEvaluator: stats, metricsByVendedor: statsVend, totalStats: total };
  }, [visitas]);

  // --- HELPER DE MÉTRICAS ESTRUTURAIS ---
  const calculateStructuralMetrics = (name: string, type: 'GCOM' | 'GV' | 'SUP') => {
    let fds = 0, rgb = 0, coaching = 0;
    const visitedIds = new Set<string>();
    const N_RGB = INDICADORES_TIPO_RGB.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
    const N_COACHING = REQUER_COACHING.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
    const nRef = normalizeName(name);

    const sellersNaEstrutura = new Set<string>();
    const leadersNaEstrutura = new Set<string>();
    leadersNaEstrutura.add(nRef);

    vendedores.forEach(v => {
      const vGcom = normalizeName(v.gerente_comercial);
      const vGv = normalizeName(v.gerente);
      const vSup = normalizeName(v.nome_supervisor);
      const vSel = normalizeName(v.nome_vendedor);

      const match = (type === 'GCOM') ? (vGcom === nRef) : 
                    (type === 'GV') ? (vGv === nRef) :
                    (type === 'SUP') ? (vSup === nRef) : false;

      if (match) {
        if (vSel) sellersNaEstrutura.add(vSel);
        if (vSup) leadersNaEstrutura.add(vSup);
        if (vGv) leadersNaEstrutura.add(vGv);
      }
    });

    visitas.forEach(v => {
      const avaliador = normalizeName(v.avaliador);
      const vendedor = normalizeName(v.nome_vendedor || v.vendedor);
      
      if (leadersNaEstrutura.has(avaliador) || sellersNaEstrutura.has(vendedor)) {
        const id = v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`;
        if (!visitedIds.has(id)) {
          visitedIds.add(id);
          const indNormalized = (v.indicador_avaliado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
          if (indNormalized.includes('FDS')) fds++;
          else if (N_RGB.includes(indNormalized) || indNormalized.includes('RGB')) rgb++;
          else if (N_COACHING.includes(indNormalized) || indNormalized.includes('COACHING')) coaching++;
        }
      }
    });

    const total = fds + rgb + coaching;
    
    // Unificação de Metas: Niv4 (Supervisor) = 10 FDS + 20 RGB + (5 * nº de vendedores)
    // Para GV e GCOM mantemos valores de referência estrutural por enquanto (60 e 80)
    const meta = (type === 'SUP') 
      ? (10 + 20 + (sellersNaEstrutura.size * 5)) 
      : (type === 'GV' ? 60 : 80);

    return { fds, rgb, coaching, total, progress: Math.min((total / meta) * 100, 100), visitedIds };
  };

  const listaGerentesComerciais = useMemo(() => {
    const nomes = new Set<string>();
    vendedores.forEach(v => { if (v.gerente_comercial) nomes.add(v.gerente_comercial); });
    return Array.from(nomes).sort();
  }, [vendedores]);

  const listaGerentes = useMemo(() => {
    const nomes = new Set<string>();
    const filterNormal = filtroLider?.type === 'GCOM' ? normalizeName(filtroLider.name) : null;

    vendedores.forEach(v => {
      if (v.gerente) {
        const vGComNormal = normalizeName(v.gerente_comercial);
        if (!filterNormal || vGComNormal.includes(filterNormal)) {
          nomes.add(v.gerente.trim());
        }
      }
    });

    const list = Array.from(nomes).sort();
    return list;
  }, [vendedores, filtroLider]);

  const listaSupervisores = useMemo(() => {
    const nomes = new Set<string>();
    const filterNormal = filtroLider?.type === 'GV' ? normalizeName(filtroLider.name) : null;

    vendedores.forEach(v => {
      if (v.nome_supervisor) {
        const vGerenteNormal = normalizeName(v.gerente);
        const vFilialNormal = normalizeName(v.filial);
        const userUnidNormal = normalizeName(userUnidade || "");
        
        // Regra Híbrida: Mostra se o nome do gerente bater OU se for da mesma unidade (para Niv3 ter visão total)
        const matchesName = !filterNormal || vGerenteNormal.includes(filterNormal);
        const matchesUnit = userLevel === 'Niv3' && vFilialNormal.includes(userUnidNormal) && !!userUnidNormal;
        
        if (matchesName || matchesUnit) {
          nomes.add(v.nome_supervisor.trim());
        }
      }
    });
    return Array.from(nomes).sort();
  }, [vendedores, filtroLider]);

  // --- COMPONENTES DE UI ---
  // --- COMPONENTES DE UI ---
  const LeaderCard = ({ name, type, isMain = false }: { name: string, type: string, isMain?: boolean }) => {
    const tAsType = type.includes('COMERCIAL') ? 'GCOM' : type.includes('VENDAS') || type === 'GV' ? 'GV' : 'SUP';
    const stats = calculateStructuralMetrics(name, tAsType);
    const isMe = normalizeName(userName) === normalizeName(name);

    return (
      <Card className={cn(
        "border-none rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500",
        isMain ? "bg-gradient-to-br from-[#0F172A] to-[#1E293B] border-t border-white/5" : "bg-card/40 backdrop-blur-md"
      )}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner", isMain ? "bg-primary/30 text-primary" : "bg-primary/10 text-primary")}>
                {type.includes('GCOM') ? <Target className="w-8 h-8" /> : type.includes('GV') || type.includes('VENDAS') ? <Users className="w-8 h-8" /> : <UserCircle className="w-8 h-8" />}
              </div>
              <div>
                <h3 className={cn("font-black text-xl tracking-tight uppercase leading-none mb-1", isMain && "text-primary")}>{name}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary border-none">{type}</Badge>
                  {isMe && <Badge className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 border-none px-2 py-0.5">VOCÊ</Badge>}
                </div>
              </div>
            </div>
            {isMain && filtroLider?.name && (
              <Button variant="ghost" size="sm" onClick={() => setFiltroLider(null)} className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] hover:bg-white/5"><ArrowLeft className="w-3.5 h-3.5 mr-2" /> Voltar</Button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div onClick={() => setDrilldown({ name, indicator: 'FDS', type: tAsType })} className="bg-emerald-500/5 p-4 rounded-2xl text-center border border-emerald-500/10 cursor-pointer hover:bg-emerald-500/10 transition-colors">
              <span className="block text-[10px] font-black text-emerald-600/60 uppercase">FDS</span>
              <span className="text-2xl font-black text-emerald-600">{stats.fds}</span>
            </div>
            <div onClick={() => setDrilldown({ name, indicator: 'RGB', type: tAsType })} className="bg-blue-500/5 p-4 rounded-2xl text-center border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-colors">
              <span className="block text-[10px] font-black text-blue-600/60 uppercase">RGB</span>
              <span className="text-2xl font-black text-blue-600">{stats.rgb}</span>
            </div>
            <div onClick={() => setDrilldown({ name, indicator: 'COACHING', type: tAsType })} className="bg-amber-500/5 p-4 rounded-2xl text-center border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-colors">
              <span className="block text-[10px] font-black text-amber-600/60 uppercase">COA</span>
              <span className="text-2xl font-black text-amber-600">{stats.coaching}</span>
            </div>
          </div>
          <div className="w-full space-y-2 mt-2">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                <span>Andamento de Indicadores</span>
                <span className={cn(stats.progress >= 100 ? "text-green-500" : "text-[#FFB800]")}>{Math.round(stats.progress)}%</span>
             </div>
             <div className="h-2 w-full bg-black/20 dark:bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                <div 
                  className={cn("h-full rounded-full transition-all duration-1000 shadow-sm", stats.progress >= 100 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[0_0_10px_rgba(255,184,0,0.4)]")} 
                  style={{ width: `${stats.progress}%` }} 
                />
             </div>
          </div>
        </div>
      </Card>
    );
  };

  const VendedorCard = ({ name, liderName }: { name: string, liderName: string }) => {
    const stats = useMemo(() => {
      const sts = { fds: 0, rgb: 0, coaching: 0 };
      const N_RGB = INDICADORES_TIPO_RGB.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
      const N_COACHING = REQUER_COACHING.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
      
      visitas.forEach(v => {
        const vAvaliador = normalizeName(v.avaliador);
        const vSeller = normalizeName(v.nome_vendedor || v.vendedor);
        
        if (vAvaliador === normalizeName(liderName) && vSeller === normalizeName(name)) {
          const indNormalized = (v.indicador_avaliado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
          if (indNormalized.includes('FDS')) sts.fds++;
          else if (N_RGB.includes(indNormalized) || indNormalized.includes('RGB')) sts.rgb++;
          else if (N_COACHING.includes(indNormalized) || indNormalized.includes("COACHING")) sts.coaching++;
        }
      });
      return sts;
    }, [visitas, name, liderName]);
    
    const totalVisitas = stats.fds + stats.rgb + stats.coaching;
    const metaIndividual = 20; // Estimativa padrão para fechamento mensal individual
    const progress = Math.min((totalVisitas / metaIndividual) * 100, 100);

    return (
      <Card className="border-border/30 bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm hover:border-[#FFB800]/50 transition-colors">
        <div className="p-4">
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center shrink-0">
                 <User className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFB800] mb-0.5">Vendedor</p>
                <h3 className="text-sm font-black uppercase truncate text-foreground leading-tight" title={name}>{name}</h3>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div onClick={() => setDrilldown({ name: liderName, indicator: 'FDS', type: 'SUP', vendedorFiltro: name })} className="bg-emerald-500/5 p-2 rounded-xl text-center cursor-pointer hover:bg-emerald-500/10 transition-colors">
              <span className="block text-[8px] font-black text-emerald-600/60 uppercase">FDS</span>
              <span className="text-sm font-black text-emerald-600">{stats.fds}</span>
            </div>
            <div onClick={() => setDrilldown({ name: liderName, indicator: 'RGB', type: 'SUP', vendedorFiltro: name })} className="bg-blue-500/5 p-2 rounded-xl text-center cursor-pointer hover:bg-blue-500/10 transition-colors">
              <span className="block text-[8px] font-black text-blue-600/60 uppercase">RGB</span>
              <span className="text-sm font-black text-blue-600">{stats.rgb}</span>
            </div>
            <div onClick={() => setDrilldown({ name: liderName, indicator: 'COACHING', type: 'SUP', vendedorFiltro: name })} className="bg-amber-500/5 p-2 rounded-xl text-center cursor-pointer hover:bg-amber-500/10 transition-colors">
              <span className="block text-[8px] font-black text-amber-600/60 uppercase">COA</span>
              <span className="text-sm font-black text-amber-600">{stats.coaching}</span>
            </div>
          </div>
          
          <div className="w-full space-y-1.5 mt-2">
            <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
              <span>Nível de Cobertura</span>
              <span className={cn(progress >= 100 ? "text-green-500" : "text-[#FFB800]")}>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
               <div 
                 className={cn("h-full rounded-full transition-all duration-1000", progress >= 100 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.4)]")} 
                 style={{ width: `${progress}%` }} 
               />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const CompactCard = ({ name, type }: { name: string, type: 'GCOM' | 'GV' | 'SUP' }) => {
    const stats = calculateStructuralMetrics(name, type);

    return (
      <div
        onClick={() => setFiltroLider({ name, type })}
        className="bg-card/40 border border-border/40 p-4 rounded-2xl flex flex-col gap-4 group transition-all cursor-pointer hover:border-[#FFB800]/50 hover:bg-card shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-[#FFB800] border border-[#FFB800]/20">
               {type === 'GCOM' ? <Target className="w-5 h-5" /> : type === 'GV' ? <Users className="w-5 h-5" /> : <UserCircle className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-black text-[#FFB800] uppercase tracking-widest leading-none mb-1">{type === 'GCOM' ? 'Gerente Comercial' : type === 'GV' ? 'GV' : 'SUP'}</p>
              <h3 className="text-xs font-black uppercase truncate text-foreground leading-tight">{name}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-black text-foreground bg-muted px-2 py-0.5 rounded">{stats.total} avs</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#FFB800] transition-all group-hover:translate-x-1" />
          </div>
        </div>

        <div className="w-full space-y-1.5">
          <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
            <span>Andamento de Indicadores</span>
            <span className={cn(stats.progress >= 100 ? "text-green-500" : "text-[#FFB800]")}>{Math.round(stats.progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
             <div 
               className={cn("h-full rounded-full transition-all duration-1000", stats.progress >= 100 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.4)]")} 
               style={{ width: `${stats.progress}%` }} 
             />
          </div>
        </div>
      </div>
    );
  };

  const renderFunnel = () => {
    // 1. Diretor ou Analista: Começa direto com os GCOMs (escondendo o card "Total Filial" que já está no topo do dashboard)
    if (!filtroLider && (userLevel === 'Niv1' || userLevel === 'Niv0' || userFuncao?.includes('ANALISTA'))) {
      return (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listaGerentesComerciais.map(n => <CompactCard key={n} name={n} type="GCOM" />)}
          </div>
        </div>
      );
    }

    // 2. Visualização de GCOM
    if (filtroLider?.type === 'GCOM' || (userLevel === 'Niv2' && !filtroLider)) {
      const topName = filtroLider?.name || userName || "";
      const isMyOwnView = normalizeName(topName) === normalizeName(userName);

      const individualStats = calculateStructuralMetrics(topName, 'GCOM'); // Para pegar os IDs
      // Filtra apenas o que ELE fez
      const myVisitasIds = new Set(visitas.filter(v => normalizeName(v.avaliador) === normalizeName(topName)).map(v => v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`));
      
      const myStats = {
        fds: visitas.filter(v => myVisitasIds.has(v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`) && (v.indicador_avaliado || "").toUpperCase().includes('FDS')).length,
        rgb: visitas.filter(v => myVisitasIds.has(v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`) && ((v.indicador_avaliado || "").toUpperCase().includes('RGB') || INDICADORES_TIPO_RGB.map(i => i.toUpperCase()).includes(v.indicador_avaliado?.toUpperCase()))).length,
        coaching: visitas.filter(v => myVisitasIds.has(v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`) && ((v.indicador_avaliado || "").toUpperCase().includes('COACHING') || REQUER_COACHING.map(i => i.toUpperCase()).includes(v.indicador_avaliado?.toUpperCase()))).length,
      };
      const myTotal = myStats.fds + myStats.rgb + myStats.coaching;

      return (
        <div className="space-y-4 flex flex-col items-center">
          {!isMyOwnView && <LeaderCard name={topName} type="G. COMERCIAL" isMain={true} />}
          
          {/* Linha Vertical de Conexão */}
          <div className="w-px h-8 bg-gradient-to-b from-[#FFB800] to-transparent opacity-50" />

          <div className="w-full space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2 flex items-center justify-center gap-3">
               Organograma de Gestão
            </h4>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative">
               {listaGerentes.map(n => <CompactCard key={n} name={n} type="GV" />)}
            </div>
          </div>
        </div>
      );
    }

    // 3. Visualização de GV
    if (filtroLider?.type === 'GV' || (userLevel === 'Niv3' && !filtroLider)) {
      const topName = filtroLider?.name || userName || "";
      const isMyOwnView = normalizeName(topName) === normalizeName(userName);
      
      const myVisitasIds = new Set(visitas.filter(v => normalizeName(v.avaliador) === normalizeName(topName)).map(v => v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`));
      
      const myStats = {
        fds: visitas.filter(v => myVisitasIds.has(v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`) && (v.indicador_avaliado || "").toUpperCase().includes('FDS')).length,
        rgb: visitas.filter(v => myVisitasIds.has(v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`) && ((v.indicador_avaliado || "").toUpperCase().includes('RGB') || INDICADORES_TIPO_RGB.map(i => i.toUpperCase()).includes(v.indicador_avaliado?.toUpperCase()))).length,
        coaching: visitas.filter(v => myVisitasIds.has(v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`) && ((v.indicador_avaliado || "").toUpperCase().includes('COACHING') || REQUER_COACHING.map(i => i.toUpperCase()).includes(v.indicador_avaliado?.toUpperCase()))).length,
      };
      const myTotal = myStats.fds + myStats.rgb + myStats.coaching;

      return (
        <div className="space-y-4 flex flex-col items-center">
          {!isMyOwnView && <LeaderCard name={topName} type="G. VENDAS" isMain={true} />}
          
          <div className="w-px h-8 bg-gradient-to-b from-[#FFB800] to-transparent opacity-50" />

          <div className="w-full space-y-6 text-center">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2 flex items-center justify-center gap-3">
               Estrutura Operacional
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
               {listaSupervisores.map(n => <CompactCard key={n} name={n} type="SUP" />)}
            </div>
          </div>
        </div>
      );
    }

    // 4. Visualização de SUP
    if (filtroLider?.type === 'SUP' || (userLevel === 'Niv4' && !filtroLider)) {
      const topName = filtroLider?.name || userName || "";
      const isMyOwnView = normalizeName(topName) === normalizeName(userName);
      
      // Coleta a base oficial de vendedores cadastrados para este supervisor
      const vendedoresEquipe = Array.from(new Set(
        vendedores
          .filter(v => normalizeName(v.nome_supervisor) === normalizeName(topName))
          .map(v => v.nome_vendedor)
          .filter(Boolean)
      )).sort();

      return (
        <div className="space-y-10">
          {!isMyOwnView && <LeaderCard name={topName} type="SUPERVISOR" isMain={true} />}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2 flex items-center gap-3">
              <div className="w-1 h-3 bg-primary rounded-full" /> Vendedores da Equipe
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendedoresEquipe.map(n => (
                 <VendedorCard key={n} name={n} liderName={topName} />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/10 pb-10">
        <div className="relative">
          <div className="absolute -left-6 top-0 bottom-0 w-1.5 bg-[#FFB800] rounded-full shadow-[0_0_15px_rgba(255,184,0,0.4)]" />
          <h2 className="text-4xl font-black tracking-tighter uppercase text-foreground leading-none">
            Minha <span className="text-[#FFB800]">Equipe</span>
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em] mt-3 opacity-60">
            Gestão Hierárquica Progressiva - {userUnidade || 'Geral'}
          </p>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        {renderFunnel()}
      </div>

      <Dialog open={!!drilldown} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-card border-border/40 rounded-[2.5rem] shadow-2xl">
          <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent p-10 pb-6 border-b border-border/10">
            <DialogTitle className="text-2xl font-black flex items-center gap-4">
              <div className="w-14 h-14 rounded-[1.2rem] bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                <ClipboardList className="w-8 h-8" />
              </div>
              <div>
                <span className="block text-foreground uppercase tracking-tight">Detalhes: {drilldown?.indicator}</span>
                <DialogDescription className="text-[11px] font-black opacity-50 uppercase tracking-[0.3em] mt-1">{drilldown?.name}</DialogDescription>
              </div>
            </DialogTitle>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 bg-muted/5">
            {(() => {
              const stats = calculateStructuralMetrics(drilldown?.name || "", drilldown?.type || 'SUP');
              const list = visitas.filter(v => {
                const id = v.id || `${v.avaliador}-${v.data_visita}-${v.codigo_pdv}-${v.indicador_avaliado}`;
                if (!stats.visitedIds.has(id)) return false;

                // NOVO: Se clicamos em um vendedor específico, filtra apenas as dele
                if (drilldown?.vendedorFiltro) {
                  const vNomeNormalizado = normalizeName(v.nome_vendedor || v.vendedor);
                  const fNomeNormalizado = normalizeName(drilldown.vendedorFiltro);
                  if (!vNomeNormalizado.includes(fNomeNormalizado)) return false;
                }

                const ind = (v.indicador_avaliado || "").toUpperCase();
                if (drilldown?.indicator === 'FDS') return ind.includes('FDS');
                if (drilldown?.indicator === 'RGB') return (INDICADORES_TIPO_RGB.some(i => ind.includes(i.toUpperCase())) || ind.includes('RGB'));
                if (drilldown?.indicator === 'COACHING') return (REQUER_COACHING.some(i => ind.includes(i.toUpperCase())) || ind.includes('COACHING'));
                return false;
              });

              if (list.length === 0) return <p className="text-center py-10 opacity-30 font-bold italic">Nenhum registro encontrado para este indicador.</p>;

              return list.map((v, i) => (
                <div 
                  key={i} 
                  onClick={() => {
                    onSelectVisita(v);
                    setDrilldown(null);
                  }}
                  className="flex items-center justify-between p-6 bg-card/60 backdrop-blur-sm border border-border/40 rounded-3xl hover:border-primary/40 hover:bg-primary/5 transition-all animate-in fade-in slide-in-from-right-4 cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground"><MapPin className="w-6 h-6" /></div>
                    <div>
                      <p className="font-black text-sm uppercase leading-tight mb-1">{v.ponto_de_venda || v.nome_fantasia_pdv}</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{v.vendedor} | {v.data_visita ? format(parseISO(v.data_visita), 'dd/MM/yyyy') : 'S/D'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-20" />
                </div>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
