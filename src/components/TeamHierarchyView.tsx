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
  const [drilldown, setDrilldown] = useState<{ name: string, indicator: string } | null>(null);

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
  const { metricsByEvaluator, totalStats } = useMemo(() => {
    const stats: Record<string, { fds: number, rgb: number, coaching: number }> = {};
    const total = { fds: 0, rgb: 0, coaching: 0 };
    const currentVisitas = Array.isArray(visitas) ? visitas : [];
    const N_RGB = INDICADORES_TIPO_RGB.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
    const N_COACHING = REQUER_COACHING.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());

    currentVisitas.forEach(v => {
      const evalName = normalizeName(v.avaliador);
      if (!evalName) return;
      const indNormalized = (v.indicador_avaliado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      if (!stats[evalName]) stats[evalName] = { fds: 0, rgb: 0, coaching: 0 };
      if (indNormalized === 'FDS') { stats[evalName].fds++; total.fds++; }
      else if (indNormalized && N_RGB.includes(indNormalized)) { stats[evalName].rgb++; total.rgb++; }
      else if (indNormalized && (N_COACHING.includes(indNormalized) || indNormalized.includes("COACHING"))) { stats[evalName].coaching++; total.coaching++; }
    });
    return { metricsByEvaluator: stats, totalStats: total };
  }, [visitas]);

  // --- LISTAS HIERÁRQUICAS ---
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
    console.log(`📊 [DEBUG_DIEGO] Candidatos a GV (Niv3):`, list.filter(n => normalizeName(n).includes("diegomanhanini")));
    return list;
  }, [vendedores, filtroLider]);

  const listaSupervisores = useMemo(() => {
    const nomes = new Set<string>();
    const filterNormal = filtroLider?.type === 'GV' ? normalizeName(filtroLider.name) : null;
    
    vendedores.forEach(v => {
      if (v.nome_supervisor) {
        const vGerenteNormal = normalizeName(v.gerente);
        if (!filterNormal || vGerenteNormal.includes(filterNormal)) {
          nomes.add(v.nome_supervisor.trim());
        }
      }
    });
    return Array.from(nomes).sort();
  }, [vendedores, filtroLider]);

  // --- COMPONENTES DE UI ---
  const LeaderCard = ({ name, type, isMain = false }: { name: string, type: string, isMain?: boolean }) => {
    const stats = metricsByEvaluator[normalizeName(name)] || { fds: 0, rgb: 0, coaching: 0 };
    const progress = Math.min(((stats.fds + stats.rgb + stats.coaching) / 30) * 100, 100);
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
                {type === 'GCOM' ? <Target className="w-8 h-8" /> : type === 'GV' ? <Users className="w-8 h-8" /> : <UserCircle className="w-8 h-8" />}
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
            <div onClick={() => setDrilldown({ name, indicator: 'FDS' })} className="bg-emerald-500/5 p-4 rounded-2xl text-center border border-emerald-500/10 cursor-pointer hover:bg-emerald-500/10 transition-colors">
              <span className="block text-[10px] font-black text-emerald-600/60 uppercase">FDS</span>
              <span className="text-2xl font-black text-emerald-600">{stats.fds}</span>
            </div>
            <div onClick={() => setDrilldown({ name, indicator: 'RGB' })} className="bg-blue-500/5 p-4 rounded-2xl text-center border border-blue-500/10 cursor-pointer hover:bg-blue-500/10 transition-colors">
              <span className="block text-[10px] font-black text-blue-600/60 uppercase">RGB</span>
              <span className="text-2xl font-black text-blue-600">{stats.rgb}</span>
            </div>
            <div onClick={() => setDrilldown({ name, indicator: 'COACHING' })} className="bg-amber-500/5 p-4 rounded-2xl text-center border border-amber-500/10 cursor-pointer hover:bg-amber-500/10 transition-colors">
              <span className="block text-[10px] font-black text-amber-600/60 uppercase">COA</span>
              <span className="text-2xl font-black text-amber-600">{stats.coaching}</span>
            </div>
          </div>
          <Progress value={progress} className="h-1.5 bg-muted/20" />
        </div>
      </Card>
    );
  };

  const CompactCard = ({ name, type }: { name: string, type: 'GCOM' | 'GV' | 'SUP' }) => {
    const stats = metricsByEvaluator[normalizeName(name)] || { fds: 0, rgb: 0, coaching: 0 };
    return (
      <div 
        onClick={() => setFiltroLider({ name, type })}
        className="bg-card/40 border border-border/40 p-4 rounded-2xl flex items-center justify-between group transition-all cursor-pointer hover:border-primary/50 hover:bg-card shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
            {type === 'GCOM' ? <Target className="w-5 h-5" /> : <Users className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase text-muted-foreground/40">{type}</p>
            <p className="text-xs font-black uppercase truncate max-w-[140px] tracking-tight">{name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
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
      const isInitial = !filtroLider;
      const topName = filtroLider?.name || userName || "";
      return (
        <div className="space-y-10">
          {!isInitial && <LeaderCard name={topName} type="G. COMERCIAL" isMain={true} />}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2 flex items-center gap-3">
              <div className="w-1 h-3 bg-primary rounded-full" /> Gerentes de Vendas da Equipe
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {listaGerentes.map(n => <CompactCard key={n} name={n} type="GV" />)}
            </div>
          </div>
        </div>
      );
    }

    // 3. Visualização de GV
    if (filtroLider?.type === 'GV' || (userLevel === 'Niv3' && !filtroLider)) {
      const isInitial = !filtroLider;
      const topName = filtroLider?.name || userName || "";
      return (
        <div className="space-y-10">
          {!isInitial && <LeaderCard name={topName} type="G. VENDAS" isMain={true} />}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2 flex items-center gap-3">
              <div className="w-1 h-3 bg-primary rounded-full" /> Supervisores da Equipe
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {listaSupervisores.map(n => <CompactCard key={n} name={n} type="SUP" />)}
            </div>
          </div>
        </div>
      );
    }

    // 4. Visualização de SUP
    if (filtroLider?.type === 'SUP' || (userLevel === 'Niv4' && !filtroLider)) {
      const isInitial = !filtroLider;
      const topName = filtroLider?.name || userName || "";
      const vendedoresEquipe = Array.from(new Set(vendedores
        .filter(v => normalizeName(v.nome_supervisor) === normalizeName(topName))
        .map(v => v.nome_vendedor))).sort();

      return (
        <div className="space-y-10">
          {!isInitial && <LeaderCard name={topName} type="SUPERVISOR" isMain={true} />}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 px-2 flex items-center gap-3">
              <div className="w-1 h-3 bg-primary rounded-full" /> Vendedores da Equipe
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
               {vendedoresEquipe.map(n => (
                 <div key={n} className="bg-card/40 border border-border/30 p-4 rounded-2xl flex flex-col items-center gap-2 text-center">
                    <User className="w-6 h-6 opacity-30" />
                    <p className="text-[10px] font-black uppercase tracking-tight truncate w-full">{n}</p>
                 </div>
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
            {visitas
              .filter(v => {
                const isEval = normalizeName(v.avaliador) === normalizeName(drilldown?.name || "");
                const ind = (v.indicador_avaliado || "").toUpperCase();
                if (drilldown?.indicator === 'FDS') return isEval && ind.includes('FDS');
                if (drilldown?.indicator === 'RGB') return isEval && (INDICADORES_TIPO_RGB.some(i => ind.includes(i.toUpperCase())));
                if (drilldown?.indicator === 'COACHING') return isEval && (REQUER_COACHING.some(i => ind.includes(i.toUpperCase())) || ind.includes('COACHING'));
                return false;
              })
              .map((v, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-card/60 backdrop-blur-sm border border-border/40 rounded-3xl hover:border-primary/40 hover:bg-primary/5 transition-all animate-in fade-in slide-in-from-right-4">
                   <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center text-muted-foreground"><MapPin className="w-6 h-6" /></div>
                      <div>
                         <p className="font-black text-sm uppercase leading-tight mb-1">{v.ponto_de_venda || v.nome_fantasia_pdv}</p>
                         <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{v.vendedor} | {v.data_visita ? format(parseISO(v.data_visita), 'dd/MM/yyyy') : 'S/D'}</p>
                      </div>
                   </div>
                   <ChevronRight className="w-5 h-5 opacity-20" />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
