import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Star
} from "lucide-react";
import { Button } from '@/components/ui/button';
import { INDICADORES_TIPO_RGB, REQUER_COACHING } from '@/lib/roles';
import { format, parseISO } from 'date-fns';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";

import { VendedorAtivo } from '@/lib/api';

interface HierarchyProps {
  visitas: any[];
  vendedores: VendedorAtivo[];
  userLevel: string | undefined;
  userName: string | undefined;
  userUnidade: string | undefined;
  onSelectVisita?: (v: any) => void;
}

export function TeamHierarchyView({ vendedores, visitas, userLevel, userName, userUnidade, onSelectVisita }: HierarchyProps) {
  const [filtroLider, setFiltroLider] = useState<{ name: string, type: 'GV' | 'SUP' } | null>(null);
  const [drilldown, setDrilldown] = useState<{ name: string, indicator: string } | null>(null);
  const [selectedOneVisita, setSelectedOneVisita] = useState<any | null>(null);

  // Auto-seleção para Gerente de Vendas (Niv3) e Supervisor (Niv4)
  useEffect(() => {
    if ((userLevel === 'Niv3' || userLevel === 'Niv4') && userName) {
      setFiltroLider({ name: userName, type: userLevel === 'Niv3' ? 'GV' : 'SUP' });
    }
  }, [userLevel, userName]);

  // 1. Agregação de métricas por AVALIADOR (Performance Individual do Líder)
  const metricsByEvaluator = useMemo(() => {
    const stats: Record<string, { fds: number, rgb: number, coaching: number }> = {};
    const currentVisitas = Array.isArray(visitas) ? visitas : [];

    currentVisitas.forEach(v => {
      const name = v.avaliador?.trim().toUpperCase();
      if (!name) return;
      
      if (!stats[name]) stats[name] = { fds: 0, rgb: 0, coaching: 0 };
      
      if (v.indicador_avaliado === 'FDS') stats[name].fds++;
      else if (v.indicador_avaliado && INDICADORES_TIPO_RGB.includes(v.indicador_avaliado)) stats[name].rgb++;
      else if (v.indicador_avaliado && REQUER_COACHING.includes(v.indicador_avaliado)) stats[name].coaching++;
    });
    return stats;
  }, [visitas]);

  const isSupervisorOnly = userLevel === 'Niv4';

  // 2. Listas para os seletores de busca (GVs e Supervisores disponíveis)
  const listaGerentes = useMemo(() => {
    const nomes = new Set<string>();
    vendedores.forEach(v => {
      const canSee = userLevel === 'Niv1' || userLevel === 'Niv2' || (userLevel === 'Niv3' && v.gerente === userName);
      if (canSee && v.gerente) nomes.add(v.gerente);
    });
    return Array.from(nomes).sort();
  }, [vendedores, userLevel, userName]);

  const listaSupervisores = useMemo(() => {
    const nomes = new Set<string>();
    vendedores.forEach(v => {
      const canSee = userLevel === 'Niv1' || userLevel === 'Niv2' || (userLevel === 'Niv3' && v.gerente === userName) || (userLevel === 'Niv4' && v.nome_supervisor === userName);
      if (canSee && v.nome_supervisor) nomes.add(v.nome_supervisor);
    });
    return Array.from(nomes).sort();
  }, [vendedores, userLevel, userName]);

  // Componente de Card de Dashboard Individual
  const LeaderDashboardCard = ({ name, type }: { name: string, type: 'GV' | 'SUP' }) => {
    const stats = metricsByEvaluator[name.toUpperCase()] || { fds: 0, rgb: 0, coaching: 0 };
    const total = stats.fds + stats.rgb + stats.coaching;
    // Meta arbitrária de 30 visitas/mês para o progresso (exemplo)
    const progress = Math.min((total / 30) * 100, 100);

    return (
      <Card className="border border-border/60 bg-card rounded-2xl shadow-lg overflow-hidden mb-6 animate-in fade-in zoom-in duration-300">
        <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex justify-between items-start mb-8 pb-4 border-b border-border/40">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                {type === 'GV' ? <Users className="w-8 h-8" /> : <UserCircle className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="font-black text-xl text-foreground tracking-tight">{name}</h3>
                <p className="text-[10px] text-primary/70 font-black uppercase tracking-[0.2em]">
                  {type === 'GV' ? 'Gerente de Vendas' : 'Supervisor de Vendas'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <ClipboardList className="w-3.5 h-3.5" /> AVALIAÇÕES REALIZADAS PELO LÍDER
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div 
                onClick={() => setDrilldown({ name, indicator: 'FDS' })}
                className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl flex flex-col items-center justify-center shadow-sm group hover:bg-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-[10px] font-black text-emerald-600/70 uppercase mb-1">FDS</p>
                <p className="text-3xl font-black text-emerald-700">{stats.fds}</p>
              </div>

              <div 
                onClick={() => setDrilldown({ name, indicator: 'RGB' })}
                className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex flex-col items-center justify-center shadow-sm group hover:bg-blue-500/20 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-[10px] font-black text-blue-600/70 uppercase mb-1">RGB</p>
                <p className="text-3xl font-black text-blue-700">{stats.rgb}</p>
              </div>

              <div 
                onClick={() => setDrilldown({ name, indicator: 'COACHING' })}
                className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl flex flex-col items-center justify-center shadow-sm group hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-2">
                  <Star className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-[10px] font-black text-amber-600/70 uppercase mb-1">COACHING</p>
                <p className="text-3xl font-black text-amber-700">{stats.coaching}</p>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Nível de Atividade Mensal</span>
                <span className="text-[10px] font-black text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-muted/40" />
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const LiderBuscaBar = () => {
    if (userLevel === 'Niv3' || userLevel === 'Niv4') return null;

    return (
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {userLevel !== 'Niv3' && (
            <Button 
              variant="outline" 
              size="sm" 
              className={`flex-1 h-10 font-black text-[10px] uppercase gap-2 tracking-widest transition-all ${filtroLider?.type === 'GV' ? 'bg-primary/10 border-primary shadow-sm text-primary scale-[1.02]' : ''}`}
              onClick={() => {
                if (filtroLider?.type === 'GV' && !filtroLider.name) setFiltroLider(null);
                else setFiltroLider({ name: '', type: 'GV' });
              }}
            >
              <Users className="w-3.5 h-3.5" /> Gerente de Vendas
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            className={`flex-1 h-10 font-black text-[10px] uppercase gap-2 tracking-widest transition-all ${filtroLider?.type === 'SUP' ? 'bg-primary/10 border-primary shadow-sm text-primary scale-[1.02]' : ''}`}
            onClick={() => {
              if (filtroLider?.type === 'SUP' && !filtroLider.name) setFiltroLider(null);
              else setFiltroLider({ name: '', type: 'SUP' });
            }}
          >
            <UserCircle className="w-3.5 h-3.5" /> Supervisor
          </Button>
          {filtroLider && (
            <Button variant="ghost" size="sm" className="h-10 px-4 text-muted-foreground hover:text-destructive font-bold text-xs" onClick={() => setFiltroLider(null)}>
              Resetar
            </Button>
          )}
        </div>

        {filtroLider && (
          <div className="bg-card/50 p-3 rounded-2xl border border-border/50 animate-in slide-in-from-top-2 duration-200">
             <div className="flex flex-wrap gap-2 p-1 max-h-48 overflow-y-auto custom-scrollbar">
               {(filtroLider.type === 'GV' ? listaGerentes : listaSupervisores).map(nome => (
                 <Badge 
                   key={nome}
                   className={`cursor-pointer px-4 py-2 text-[10px] uppercase tracking-wider transition-all rounded-full border-none shadow-sm ${filtroLider.name === nome ? 'bg-primary text-white scale-110' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                   onClick={() => {
                     if (filtroLider.name === nome) setFiltroLider({ ...filtroLider, name: '' });
                     else setFiltroLider({ ...filtroLider, name: nome });
                   }}
                 >
                   {nome}
                 </Badge>
               ))}
               {(filtroLider.type === 'GV' ? listaGerentes : listaSupervisores).length === 0 && (
                 <p className="text-[10px] text-muted-foreground italic w-full text-center py-2">Nenhum líder encontrado para esta função.</p>
               )}
             </div>
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!filtroLider) {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50 text-center animate-in fade-in duration-500">
           <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-primary/30" />
           </div>
           <h3 className="text-lg font-black text-foreground uppercase tracking-widest">Dashboard de Performance</h3>
           <p className="text-xs text-muted-foreground font-semibold mt-2 max-w-xs">
             Selecione uma função acima para analisar a produtividade individual dos líderes em campo.
           </p>
        </div>
      );
    }

    if (filtroLider.name) {
      return <LeaderDashboardCard name={filtroLider.name} type={filtroLider.type} />;
    }

    // Se nenhum nome selecionado, mostrar todos os líderes daquela função
    const leaders = filtroLider.type === 'GV' ? listaGerentes : listaSupervisores;
    
    return (
      <div className="space-y-4">
        {leaders.map(nome => (
          <LeaderDashboardCard key={nome} name={nome} type={filtroLider.type} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <LiderBuscaBar />
      {renderResults()}

      {/* Modal de Drilldown (Lista de Visitas) */}
      <Dialog open={!!drilldown} onOpenChange={(open) => !open && setDrilldown(null)}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[85vh] overflow-y-auto p-6 bg-background/95 backdrop-blur-md border-primary/20 custom-scrollbar">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setDrilldown(null)} className="h-8 w-8 hover:bg-accent shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary leading-tight">
                  Visitas: {drilldown?.indicator}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-muted-foreground uppercase opacity-70">
                   Realizadas por {drilldown?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3">
            {(() => {
              if (!drilldown) return null;
              const filtered = visitas.filter(v => {
                const evalMatch = v.avaliador?.trim().toUpperCase() === drilldown.name.toUpperCase();
                if (!evalMatch) return false;

                const ind = v.indicador_avaliado?.trim().toUpperCase();
                if (drilldown.indicator === 'FDS') return ind === 'FDS';
                if (drilldown.indicator === 'RGB') return ind && INDICADORES_TIPO_RGB.includes(ind);
                if (drilldown.indicator === 'COACHING') return ind && REQUER_COACHING.includes(ind);
                return false;
              });

              if (filtered.length === 0) {
                return <p className="text-center py-10 text-muted-foreground italic text-sm">Nenhuma visita encontrada.</p>;
              }

              return filtered.map((v, i) => (
                <Card 
                  key={i} 
                  className="group hover:border-primary/40 transition-all cursor-pointer bg-card/50"
                  onClick={() => {
                    setDrilldown(null);
                    onSelectVisita && onSelectVisita(v);
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-black text-sm text-foreground uppercase truncate">
                        {v.nome_fantasia_pdv || "PDV DESCONHECIDO"}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {v.data_visita ? format(parseISO(v.data_visita), "dd/MM/yy") : "--/--/--"}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {v.filial}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all" />
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
