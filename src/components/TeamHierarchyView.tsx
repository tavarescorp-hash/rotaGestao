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
    } else if (userLevel === 'Niv3') {
      setFiltroLider({ name: '', type: 'SUP' });
    } else if (userLevel === 'Niv2') {
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
      const loginU = (userName || "").toUpperCase();

      // LOGIC REPLICATED FROM CAMPOS (PRO): 
      // Se o usuário é Niv2/Niv3 e a filial do PDV bate com a sua unidade, ele VÊ.
      const isMacaeUser = uUnid.includes("MACA") || uUnid === "M" || normalizeName(loginU).includes(normalizeName("DIEGO MANHANINI"));
      const isCamposUser = uUnid.includes("CAMPOS") || uUnid === "C" || normalizeName(loginU).includes(normalizeName("CAMPOS"));
      const isMasterView = uUnid === 'TODAS' || uUnid === '';

      // Isolamento Exclusivo por Filial
      const matchesFilial = (isMacaeUser && (v.filial === 'M' || v.filial?.toUpperCase().includes('MACAE'))) ||
        (isCamposUser && (v.filial === 'C' || v.filial?.toUpperCase().includes('CAMPOS'))) ||
        isMasterView;

      const canSee = userLevel === 'Niv1' ||
        (userLevel === 'Niv2' && (gCNormal === uNameNormal || matchesFilial || uUnid === 'TODAS' || uUnid === ''));

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
      const uUnidRaw = userUnidade || "";
      const uUnid = uUnidRaw === "null" || uUnidRaw === "undefined" ? "" : uUnidRaw.toUpperCase();
      const loginU = (userName || "").toUpperCase();

      // No loop de supervisores
      // NOTA: O Diego pode ter 'unidade' salva incorretamente como 'C' no banco.
      // O check pelo NOME é o trump card absoluto para garantir isolamento correto.
      const isDiegoUser = normalizeName(loginU).includes("diegomanhanini");
      const isMacaeUser = isDiegoUser || uUnid === "M" || uUnid.includes("MACA");
      // Campos NUNCA pode ser se for Diego (evita colisão de dados sujos do banco)
      const isCamposUser = !isDiegoUser && (uUnid.includes("CAMPOS") || uUnid === "C");
      const isMasterView = uUnid === 'TODAS' || uUnid === '';

      // Isolamento Exclusivo por Filial
      const matchesFilial = (isMacaeUser && (v.filial === 'M' || v.filial?.toUpperCase().includes('MACA'))) ||
        (isCamposUser && (v.filial === 'C' || v.filial?.toUpperCase().includes('CAMPO'))) ||
        isMasterView;

      const isAnalista = userFuncao?.toUpperCase()?.includes('ANALISTA');
      const emptyUnid = uUnid === '' || uUnid === 'NULL' || uUnid === 'UNDEFINED';

      const canSee = userLevel === 'Niv1' || userLevel === 'Niv0' || isAnalista ||
        (userLevel === 'Niv2' && (gCNormal === uNameNormal || matchesFilial || uUnid === 'TODAS' || emptyUnid)) ||
        (userLevel === 'Niv3' && (gNormal === uNameNormal || matchesFilial || uUnid === 'TODAS' || emptyUnid)) ||
        (userLevel === 'Niv4' && supNormal === uNameNormal);

      if (canSee && v.nome_supervisor) {
        // Limpeza de quebra de linha no nome do supervisor para evitar problemas de agrupamento
        const nomeLimpo = v.nome_supervisor.replace(/[\n\r\t]/g, ' ').trim();
        nomes.add(nomeLimpo);
      }
    });

    console.log(`🔍 [VIEW_DEBUG] Supervisores encontrados para ${userLevel}/${userName}:`, Array.from(nomes).length);
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
            <div
              onClick={() => setDrilldown({ name, indicator: 'FDS' })}
              className="group/metric bg-emerald-500/10 p-5 rounded-2xl text-center cursor-pointer hover:bg-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">FDS</p>
              <p className="text-3xl font-black text-emerald-700">{stats.fds}</p>
            </div>
            <div
              onClick={() => setDrilldown({ name, indicator: 'RGB' })}
              className="group/metric bg-blue-500/10 p-5 rounded-2xl text-center cursor-pointer hover:bg-blue-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">RGB</p>
              <p className="text-3xl font-black text-blue-700">{stats.rgb}</p>
            </div>
            <div
              onClick={() => setDrilldown({ name, indicator: 'COACHING' })}
              className="group/metric bg-amber-500/10 p-5 rounded-2xl text-center cursor-pointer hover:bg-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">COACHING</p>
              <p className="text-3xl font-black text-amber-700">{stats.coaching}</p>
            </div>
          </div>
          <div className="pt-4">
            <Progress value={progress} className="h-2" />
          </div>

          {/* Lista de Vendedores da Equipe (Cascata) */}
          {type === 'SUP' && (
            <div className="mt-8 pt-6 border-t border-border/40">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-4 text-center">Membros da Equipe (Vendedores)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {vendedores
                  .filter(v => normalizeName(v.nome_supervisor) === normalizeName(name))
                  .reduce((acc, curr) => {
                    // Evitar duplicatas de vendedores
                    if (!acc.find(a => normalizeName(a.nome_vendedor) === normalizeName(curr.nome_vendedor))) {
                      acc.push(curr);
                    }
                    return acc;
                  }, [] as typeof vendedores)
                  .map(vend => {
                    const vStats = metricsByEvaluator[normalizeName(vend.nome_vendedor)] || { fds: 0, rgb: 0, coaching: 0 };
                    return (
                      <div
                        key={vend.cod_vendedor || vend.nome_vendedor}
                        onClick={() => setDrilldown({ name: vend.nome_vendedor, indicator: 'FDS' })}
                        className="bg-card/50 border border-border/40 p-3 rounded-xl hover:border-primary/40 transition-all cursor-pointer group/vend"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <UserCircle className="w-4 h-4 opacity-40 group-hover/vend:text-primary transition-colors" />
                          <span className="text-[11px] font-black truncate">{vend.nome_vendedor}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="bg-emerald-500/10 py-1 rounded text-center">
                            <span className="block text-[7px] font-black text-emerald-600">FDS</span>
                            <span className="text-[10px] font-bold">{vStats.fds}</span>
                          </div>
                          <div className="bg-blue-500/10 py-1 rounded text-center">
                            <span className="block text-[7px] font-black text-blue-600">RGB</span>
                            <span className="text-[10px] font-bold">{vStats.rgb}</span>
                          </div>
                          <div className="bg-amber-500/10 py-1 rounded text-center">
                            <span className="block text-[7px] font-black text-amber-600">COA</span>
                            <span className="text-[10px] font-bold">{vStats.coaching}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
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
    const isAnalista = userFuncao?.toUpperCase()?.includes('ANALISTA');
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

    if (leaders.length === 0) {
      return (
        <div className="p-10 text-center text-muted-foreground uppercase font-black border border-border/40 border-dashed rounded-xl bg-card/10">
          Nenhuma equipe encontrada assinada para {userName || "o seu usuário"}.
          <br />
          <span className="text-xs font-normal opacity-70 mt-2 block">Verifique se sua conta possui Região (Macaé/Campos) ou verifique o cadastro de liderança dessa filial.</span>
        </div>
      );
    }

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
        <DialogContent className="max-w-[700px] p-0 overflow-hidden bg-card border-border/40 rounded-3xl">
          <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 pb-4 border-b border-border/40">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Visitas: {drilldown?.indicator}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold opacity-60 uppercase tracking-widest mt-1">
              {drilldown?.name}
            </DialogDescription>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-muted/5">
            {(() => {
              const N_RGB = INDICADORES_TIPO_RGB.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());
              const N_COACHING = REQUER_COACHING.map(i => i.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim());

              const filtradasDrill = visitas.filter(v => {
                if (normalizeName(v.avaliador) !== normalizeName(drilldown?.name)) return false;

                const ind = (v.indicador_avaliado || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

                if (drilldown?.indicator === 'FDS') return ind === 'FDS';
                if (drilldown?.indicator === 'RGB') return N_RGB.includes(ind);
                if (drilldown?.indicator === 'COACHING') return N_COACHING.includes(ind) || ind.includes("COACHING");

                return false;
              });

              if (filtradasDrill.length === 0) {
                return (
                  <div className="text-center py-12 opacity-40">
                    <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="font-black text-xs uppercase">Nenhuma visita encontrada para este filtro.</p>
                  </div>
                );
              }

              return filtradasDrill.map((v, i) => (
                <div
                  key={i}
                  onClick={() => {
                    onSelectVisita?.(v);
                    setDrilldown(null);
                  }}
                  className="group flex items-center justify-between p-4 bg-card border border-border/40 hover:border-primary/50 hover:bg-primary/5 rounded-2xl transition-all cursor-pointer shadow-sm animate-in fade-in slide-in-from-right-4 duration-300"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-sm text-foreground leading-tight">{v.nome_fantasia_pdv || "PDV NÃO IDENTIFICADO"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] font-bold h-4 px-1.5 opacity-60">Cod: {v.codigo_pdv}</Badge>
                        <span className="text-[10px] font-medium opacity-40 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {v.data_visita ? format(parseISO(v.data_visita), "dd/MM/yyyy") : "Sem Data"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              ));
            })()}
          </div>
          <div className="p-4 bg-muted/20 border-t border-border/40 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setDrilldown(null)} className="text-xs font-bold uppercase tracking-widest px-6">Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
