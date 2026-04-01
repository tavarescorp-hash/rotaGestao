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
  MapPin
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

import { VendedorAtivo } from '@/lib/api';

interface HierarchyProps {
  visitas: any[];
  vendedores: VendedorAtivo[];
  userLevel: string | undefined;
  userName: string | undefined;
  userUnidade: string | undefined;
  userFuncao?: string | undefined;
  onSelectVisita?: (v: any) => void;
}

export function TeamHierarchyView({ vendedores, visitas, userLevel, userName, userUnidade, userFuncao, onSelectVisita }: HierarchyProps) {
  const [filtroLider, setFiltroLider] = useState<{ name: string, type: 'GCOM' | 'GV' | 'SUP' } | null>(null);
  const [drilldown, setDrilldown] = useState<{ name: string, indicator: string } | null>(null);

  // Auto-seleção para Gerente de Vendas (Niv3) e Supervisor (Niv4)
  useEffect(() => {
    if (userLevel === 'Niv4' && userName) {
      setFiltroLider({ name: userName, type: 'SUP' });
    } else if (userLevel === 'Niv3' && userName) {
      setFiltroLider({ name: '', type: 'SUP' });
    } else if (userLevel === 'Niv2' && userName) {
      setFiltroLider({ name: '', type: 'GV' });
    }
  }, [userLevel, userName]);

  const metricsByEvaluator = useMemo(() => {
    const stats: Record<string, { fds: number, rgb: number, coaching: number }> = {};
    const currentVisitas = Array.isArray(visitas) ? visitas : [];
    const N_RGB = INDICADORES_TIPO_RGB.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
    const N_COACHING = REQUER_COACHING.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());

    currentVisitas.forEach(v => {
      const evalName = normalizeName(v.avaliador);
      if (!evalName) return;
      const indNormalized = (v.indicador_avaliado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      if (!stats[evalName]) stats[evalName] = { fds: 0, rgb: 0, coaching: 0 };
      if (indNormalized === 'FDS') stats[evalName].fds++;
      else if (indNormalized && N_RGB.includes(indNormalized)) stats[evalName].rgb++;
      else if (indNormalized && (N_COACHING.includes(indNormalized) || indNormalized.includes("COACHING"))) stats[evalName].coaching++;
    });
    return stats;
  }, [visitas]);

  const listaGerentesComerciais = useMemo(() => {
    const nomes = new Set<string>();
    vendedores.forEach(v => { if (v.gerente_comercial) nomes.add(v.gerente_comercial); });
    return Array.from(nomes).sort();
  }, [vendedores]);

  const listaGerentes = useMemo(() => {
    const nomes = new Set<string>();
    const uNameNormal = normalizeName(userName);
    vendedores.forEach(v => {
      const gCNormal = normalizeName(v.gerente_comercial);
      const uUnid = (userUnidade || "").toUpperCase();
      const isRegionalMacaé = (uUnid.includes("MACA") || uUnid === "M" || uUnid === "TODAS") && (v.filial === 'M' || v.filial?.toUpperCase().includes('MACAE'));
      const isRegionalCampos = (uUnid.includes("CAMPOS") || uUnid === "C" || uUnid === "TODAS") && (v.filial === 'C' || v.filial?.toUpperCase().includes('CAMPOS'));
      const canSee = userLevel === 'Niv1' || (userLevel === 'Niv2' && (gCNormal === uNameNormal || isRegionalMacaé || isRegionalCampos || uUnid === 'TODAS'));
      if (canSee && v.gerente) nomes.add(v.gerente);
    });
    return Array.from(nomes).sort();
  }, [vendedores, userLevel, userName, userUnidade]);

  const listaSupervisores = useMemo(() => {
    const nomes = new Set<string>();
    const uNameNormal = normalizeName(userName);
    vendedores.forEach(v => {
      const gCNormal = normalizeName(v.gerente_comercial);
      const gNormal = normalizeName(v.gerente);
      const supNormal = normalizeName(v.nome_supervisor);
      const uUnid = (userUnidade || "").toUpperCase();
      const isRegionalMacaé = (uUnid.includes("MACA") || uUnid === "M" || uUnid === "TODAS") && (v.filial === 'M' || v.filial?.toUpperCase().includes('MACAE'));
      const isRegionalCampos = (uUnid.includes("CAMPOS") || uUnid === "C" || uUnid === "TODAS") && (v.filial === 'C' || v.filial?.toUpperCase().includes('CAMPOS'));
      const isAnalista = userFuncao?.toUpperCase().includes('ANALISTA');
      const canSee = userLevel === 'Niv1' || userLevel === 'Niv0' || isAnalista || (userLevel === 'Niv2' && (gCNormal === uNameNormal || isRegionalMacaé || isRegionalCampos || uUnid === 'TODAS')) || (userLevel === 'Niv3' && gNormal === uNameNormal) || (userLevel === 'Niv4' && supNormal === uNameNormal);
      if (canSee && v.nome_supervisor) nomes.add(v.nome_supervisor);
    });
    return Array.from(nomes).sort();
  }, [vendedores, userLevel, userName, userUnidade, userFuncao]);

  const LeaderDashboardCard = ({ name, type }: { name: string, type: string }) => {
    const stats = metricsByEvaluator[normalizeName(name)] || { fds: 0, rgb: 0, coaching: 0 };
    const progress = Math.min(((stats.fds + stats.rgb + stats.coaching) / 30) * 100, 100);

    return (
      <Card className="border border-border/60 bg-card rounded-2xl shadow-lg overflow-hidden mb-6 animate-in fade-in zoom-in duration-300">
        <div className="p-6 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex justify-between items-start mb-8 pb-4 border-b border-border/40">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {type === 'GV' ? <Users /> : type === 'GCOM' ? <Target /> : <UserCircle />}
              </div>
              <div>
                <h3 className="font-black text-xl">{name}</h3>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] uppercase font-black opacity-60">{type}</p>
                  {type === 'SUP' && vendedores.find(v => normalizeName(v.nome_supervisor) === normalizeName(name))?.codigo_sup && (
                    <Badge variant="outline" className="text-[8px] font-black h-4 px-1.5 border-primary/30">
                      CÓD: {vendedores.find(v => normalizeName(v.nome_supervisor) === normalizeName(name))?.codigo_sup}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFiltroLider(prev => prev ? { ...prev, name: '' } : null)}>
               <ArrowLeft className="w-3 h-3 h-3" /> Voltar
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div onClick={() => setDrilldown({ name, indicator: 'FDS' })} className="bg-emerald-500/10 p-5 rounded-2xl text-center cursor-pointer">
              <p className="text-[10px] font-black text-emerald-600">FDS</p>
              <p className="text-3xl font-black">{stats.fds}</p>
            </div>
            <div onClick={() => setDrilldown({ name, indicator: 'RGB' })} className="bg-blue-500/10 p-5 rounded-2xl text-center cursor-pointer">
              <p className="text-[10px] font-black text-blue-600">RGB</p>
              <p className="text-3xl font-black">{stats.rgb}</p>
            </div>
            <div onClick={() => setDrilldown({ name, indicator: 'COACHING' })} className="bg-amber-500/10 p-5 rounded-2xl text-center cursor-pointer">
              <p className="text-[10px] font-black text-amber-600">COACHING</p>
              <p className="text-3xl font-black">{stats.coaching}</p>
            </div>
          </div>
          <div className="pt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </Card>
    );
  };

  const CompactLeaderCard = ({ name, type }: { name: string, type: string }) => {
    const stats = metricsByEvaluator[normalizeName(name)] || { fds: 0, rgb: 0, coaching: 0 };
    const progress = Math.min(((stats.fds + stats.rgb + stats.coaching) / 30) * 100, 100);

    return (
      <Card className="hover:border-primary/50 cursor-pointer p-4 transition-all" onClick={() => setFiltroLider(prev => prev ? { ...prev, name } : null)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Users className="w-5 h-5" /></div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs truncate">{name}</h3>
            {type === 'SUP' && (
              <p className="text-[8px] font-black opacity-40 uppercase tracking-tighter">
                CÓD: {vendedores.find(v => normalizeName(v.nome_supervisor) === normalizeName(name))?.codigo_sup || "---"}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-emerald-500/5 p-1 rounded text-center"><span className="block text-[8px] font-black">FDS</span><span className="text-xs font-bold">{stats.fds}</span></div>
          <div className="bg-blue-500/5 p-1 rounded text-center"><span className="block text-[8px] font-black">RGB</span><span className="text-xs font-bold">{stats.rgb}</span></div>
          <div className="bg-amber-500/5 p-1 rounded text-center"><span className="block text-[8px] font-black">COA</span><span className="text-xs font-bold">{stats.coaching}</span></div>
        </div>
        <Progress value={progress} className="h-1 mt-3" />
      </Card>
    );
  };

  const LiderBuscaBar = () => {
    const isAnalista = userFuncao?.toUpperCase().includes('ANALISTA');
    if ((userLevel === 'Niv3' || userLevel === 'Niv4') && !isAnalista) return null;
    return (
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex flex-wrap gap-2">
          {(userLevel === 'Niv1' || userLevel === 'Niv0' || isAnalista) && (
            <Button variant="outline" size="sm" className={`flex-1 ${filtroLider?.type === 'GCOM' ? 'border-primary' : ''}`} onClick={() => setFiltroLider({ name: '', type: 'GCOM' })}>G. COMERCIAL</Button>
          )}
          {(userLevel === 'Niv1' || userLevel === 'Niv0' || userLevel === 'Niv2' || isAnalista) && (
            <Button variant="outline" size="sm" className={`flex-1 ${filtroLider?.type === 'GV' ? 'border-primary' : ''}`} onClick={() => setFiltroLider({ name: '', type: 'GV' })}>G. VENDAS</Button>
          )}
          <Button variant="outline" size="sm" className={`flex-1 ${filtroLider?.type === 'SUP' ? 'border-primary' : ''}`} onClick={() => setFiltroLider({ name: '', type: 'SUP' })}>SUPERVISOR</Button>
        </div>
        {filtroLider && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/20 rounded-lg">
            {(filtroLider.type === 'GCOM' ? listaGerentesComerciais : filtroLider.type === 'GV' ? listaGerentes : listaSupervisores).map(n => (
              <Badge key={n} className="cursor-pointer" variant={filtroLider.name === n ? 'default' : 'outline'} onClick={() => setFiltroLider({ ...filtroLider, name: n })}>{n}</Badge>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!filtroLider) return <div className="p-10 text-center text-muted-foreground uppercase font-black">Escolha um nível para auditar</div>;
    if (filtroLider.name) return <LeaderDashboardCard name={filtroLider.name} type={filtroLider.type} />;
    
    const leaders = filtroLider.type === 'GCOM' ? listaGerentesComerciais : filtroLider.type === 'GV' ? listaGerentes : listaSupervisores;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {leaders.map(n => <CompactLeaderCard key={n} name={n} type={filtroLider.type} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <LiderBuscaBar />
      {renderResults()}
      <Dialog open={!!drilldown} onOpenChange={() => setDrilldown(null)}>
        <DialogContent className="max-w-[600px]">
          <DialogTitle>Visitas: {drilldown?.indicator}</DialogTitle>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {visitas.filter(v => normalizeName(v.avaliador) === normalizeName(drilldown?.name)).map((v, i) => (
              <Card key={i} className="p-3"><p className="font-bold text-sm">{v.nome_fantasia_pdv}</p></Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
