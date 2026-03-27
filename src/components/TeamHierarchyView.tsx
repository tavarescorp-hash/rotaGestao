import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronDown, 
  User, 
  Users, 
  TrendingUp, 
  Target, 
  Award,
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  ClipboardList
} from "lucide-react";
import { INDICADORES_TIPO_RGB, REQUER_COACHING } from '@/lib/roles';
import { format } from 'date-fns';

import { VendedorAtivo } from '@/lib/api';
import { VendedorPerformanceModal } from "@/features/relatorios/components/VendedorPerformanceModal";

interface HierarchyProps {
  visitas: any[];
  vendedores: VendedorAtivo[];
  userLevel: string | undefined;
  userName: string | undefined;
  userUnidade: string | undefined;
  onSelectVisita?: (v: any) => void;
}

export function TeamHierarchyView({ vendedores, visitas, userLevel, userName, userUnidade, onSelectVisita }: HierarchyProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVendedorData, setSelectedVendedorData] = useState<any | null>(null);

  // 1. Construir a árvore e consolidar os números
  const tree = useMemo(() => {
    const checkNameMatch = (target?: string, search?: string) => {
      if (!target || !search) return false;
      const t = target.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const parts = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/);
      return parts.every(part => t.includes(part));
    };

    // Filtrar base de vendedores pela visão do usuário logado
    const vendsValidos = vendedores.filter(v => {
      if (userLevel === 'Niv1' || (userLevel === 'Niv2' && (userUnidade?.toUpperCase() === 'TODAS' || !userUnidade))) return true;
      if (userLevel === 'Niv2') return v.filial === userUnidade; 
      if (userLevel === 'Niv3') return checkNameMatch(v.gerente, userName) || v.filial === userUnidade;
      if (userLevel === 'Niv4') return true; 
      return true; 
    });

    const hierarquia: Record<string, Record<string, Record<string, any[]>>> = {};

    vendsValidos.forEach(v => {
      let f = v.gerente_comercial || 'Equipe de Gestão';
      if (f === 'Equipe de Gestão' || !v.gerente_comercial) {
        if (v.filial?.toUpperCase().includes('MACA') || v.filial === 'M') f = 'Comercial Macaé';
        else if (v.filial?.toUpperCase().includes('CAMPO') || v.filial === 'C') f = 'Comercial Campos';
      }

      const g = v.gerente || 'Sem Gerente de Vendas';
      const s = v.nome_supervisor || 'Sem Supervisor';

      if (!hierarquia[f]) hierarquia[f] = {};
      if (!hierarquia[f][g]) hierarquia[f][g] = {};
      if (!hierarquia[f][g][s]) hierarquia[f][g][s] = [];

      const myVisits = visitas.filter(vis => vis.nome_vendedor?.trim().toUpperCase() === v.nome_vendedor?.trim().toUpperCase());
      const fds = myVisits.filter(vis => vis.indicador_avaliado === 'FDS').length;
      const rgb = myVisits.filter(vis => vis.indicador_avaliado && INDICADORES_TIPO_RGB.includes(vis.indicador_avaliado)).length;
      const coaching = myVisits.filter(vis => vis.indicador_avaliado && REQUER_COACHING.includes(vis.indicador_avaliado)).length;

      hierarquia[f][g][s].push({
        ...v,
        visitas_recebidas: myVisits,
        metricas: { fds, rgb, coaching, total: fds + rgb + coaching }
      });
    });

    return hierarquia;
  }, [vendedores, visitas, userLevel, userName, userUnidade]);

  const isSupervisorOnly = userLevel === 'Niv4';
  const isGerenteVendas = userLevel === 'Niv3';

  // Componente Interno de Linha de Vendedor
  const VendedorRow = ({ vendedor }: { vendedor: any }) => {
    return (
      <Collapsible className="group/vend border-t border-border/40 transition-colors bg-background">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 hover:bg-muted/30 w-full transition-colors group">
          <div 
            className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 group"
            onClick={() => setSelectedVendedorData(vendedor)}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20 shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
              {vendedor.nome_vendedor?.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                {vendedor.nome_vendedor}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[9px] font-black h-4 px-1.5 flex items-center bg-background shrink-0 uppercase tracking-tighter">
                  COD: {vendedor.cod_vendedor || vendedor.codigo_vendedor}
                </Badge>
                {vendedor.metricas.total > 0 && (
                   <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3 text-green-500" /> {vendedor.metricas.total} visitas
                   </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-2 sm:mt-0 justify-between sm:justify-end w-full sm:w-auto">
            <div className="flex items-center gap-4">
               <div className="flex flex-col items-end">
                  <div className="flex gap-1.5">
                    <div className="text-center">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">FDS</p>
                      <Badge variant="secondary" className="h-4 p-0 px-1 font-mono text-[9px]">{vendedor.metricas.fds}</Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">RGB</p>
                      <Badge variant="secondary" className="h-4 p-0 px-1 font-mono text-[9px]">{vendedor.metricas.rgb}</Badge>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-0.5">Coach</p>
                      <Badge variant="secondary" className="h-4 p-0 px-1 font-mono text-[9px] text-blue-500">{vendedor.metricas.coaching}</Badge>
                    </div>
                  </div>
               </div>
            </div>
            
            <CollapsibleTrigger asChild>
              <button className="p-1 hover:bg-muted rounded-md transition-colors shrink-0">
                <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]/vend:rotate-180 transition-transform duration-200" />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="bg-muted/5 border-t border-border/20 px-4 py-3 space-y-2">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-2">
              <ClipboardList className="w-3.5 h-3.5" />
              Histórico do Período ({vendedor.visitas_recebidas.length})
            </div>
            {vendedor.visitas_recebidas.map((vis: any, i: number) => (
              <div 
                key={i} 
                onClick={() => onSelectVisita && onSelectVisita(vis)}
                className="flex flex-col sm:flex-row justify-between sm:items-center bg-card border border-border/50 p-2.5 rounded-lg text-xs hover:bg-muted hover:border-primary/40 transition cursor-pointer shadow-sm group/card"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 group-hover/card:bg-primary group-hover/card:text-white transition-colors">
                    {vis.indicador_avaliado?.substring(0, 1) || "A"}
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="font-bold text-foreground truncate">
                       {vis.nome_fantasia_pdv || "PDV Sem Nome"}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" /> {vis.avaliador} • <Calendar className="w-3 h-3 ml-1" /> {format(new Date(vis.data_visita || new Date()), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-bold h-5 uppercase bg-background border-primary/20 text-primary shrink-0 ml-auto sm:ml-0 mt-2 sm:mt-0">
                  {vis.indicador_avaliado}
                </Badge>
              </div>
            ))}
            {vendedor.visitas_recebidas.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic p-2 text-center">Nenhuma visita detectada.</p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  if (isSupervisorOnly) {
    const meusVendedores = Object.values(tree).flatMap(filiais => 
      Object.values(filiais).flatMap(gerentes => 
        Object.values(gerentes).flatMap(supervisores => supervisores)
      )
    );
    if (meusVendedores.length === 0) return <p className="text-muted-foreground text-sm p-4 text-center">Nenhum vendedor encontrado na sua carteira.</p>;

    return (
      <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 bg-muted/20 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Minha Equipe ({meusVendedores.length})</h3>
        </div>
        {meusVendedores.map((v, i) => <VendedorRow key={i} vendedor={v} />)}
        <VendedorPerformanceModal
          vendedor={selectedVendedorData}
          onClose={() => setSelectedVendedorData(null)}
          onSelectVisita={(vis) => {
            setSelectedVendedorData(null);
            onSelectVisita && onSelectVisita(vis);
          }}
        />
      </div>
    );
  }

  const isDiretor = userLevel === 'Niv1';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {Object.entries(tree).map(([comercial, gerentes]) => {
        const shouldHideComercial = !isDiretor;
        const cFDS = Object.values(gerentes).flatMap(g => Object.values(g).flat()).reduce((acc, v) => acc + v.metricas.fds, 0);
        const cCoaching = Object.values(gerentes).flatMap(g => Object.values(g).flat()).reduce((acc, v) => acc + v.metricas.coaching, 0);

        return (
          <Collapsible key={comercial} className={`bg-card rounded-xl ${!shouldHideComercial ? 'border border-border/80 shadow-md overflow-hidden mb-6' : ''}`} defaultOpen={shouldHideComercial}>
            {!shouldHideComercial && (
              <CollapsibleTrigger className="w-full flex justify-between items-center p-5 bg-primary/5 hover:bg-primary/10 transition focus:outline-none group gap-2 border-b border-border/40">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 shadow-inner">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="text-left min-w-0 overflow-hidden w-full">
                    <h3 className="font-black text-lg text-foreground group-hover:text-primary transition-colors truncate">{comercial}</h3>
                    <p className="text-xs text-muted-foreground font-semibold truncate uppercase tracking-widest mt-1">
                      {Object.keys(gerentes).length} Gerentes • {Object.values(gerentes).flatMap(g => Object.values(g).flat()).length} Vendedores
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden sm:flex items-center gap-6 mr-6 text-right">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Totais FDS</p>
                      <p className="font-mono font-black text-lg text-foreground">{cFDS}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Coachings</p>
                      <p className="font-mono font-black text-lg text-primary">{cCoaching}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-6 h-6 text-primary/70 group-data-[state=open]:rotate-180 transition-transform duration-300" />
                </div>
              </CollapsibleTrigger>
            )}

            <CollapsibleContent className={!shouldHideComercial ? "p-4 space-y-4 bg-muted/5" : "space-y-4"}>
              {Object.entries(gerentes).map(([gerente, supervisores]) => {
                const shouldHideGerenteHeader = isGerenteVendas;
                if (isGerenteVendas && gerente !== userName && gerente !== "Sem Gerente") return null;

                const qtdeSup = Object.keys(supervisores).length;
                const totalVends = Object.values(supervisores).flat().length;
                const tFDS = Object.values(supervisores).flat().reduce((acc, v) => acc + v.metricas.fds, 0);
                const tCoaching = Object.values(supervisores).flat().reduce((acc, v) => acc + v.metricas.coaching, 0);

                return (
                  <Collapsible key={gerente} className={`border border-border/60 bg-card rounded-xl shadow-sm overflow-hidden ${!shouldHideComercial ? 'ml-2 border-l-4 border-l-blue-500/30' : ''}`} defaultOpen={shouldHideGerenteHeader}>
                    {!shouldHideGerenteHeader && (
                      <CollapsibleTrigger className="w-full flex justify-between items-center p-4 hover:bg-muted/30 transition focus:outline-none group gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="text-left min-w-0 overflow-hidden w-full">
                            <h3 className="font-bold text-base text-foreground group-hover:text-blue-500 transition-colors truncate">Gerente: {gerente}</h3>
                            <p className="text-xs text-muted-foreground font-medium truncate">{qtdeSup} Supervisores • {totalVends} Vendedores</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="hidden sm:flex items-center gap-4 mr-4 text-right">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total FDS</p>
                              <p className="font-mono font-bold text-sm">{tFDS}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Coaching</p>
                              <p className="font-mono font-bold text-sm text-blue-500">{tCoaching}</p>
                            </div>
                          </div>
                          <ChevronDown className="w-5 h-5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-300" />
                        </div>
                      </CollapsibleTrigger>
                    )}

                    <CollapsibleContent className="bg-muted/10">
                      <div className={!shouldHideGerenteHeader ? "p-3 pt-0" : "p-0"}>
                        <div className={`flex flex-col gap-2 rounded-lg ${!shouldHideGerenteHeader ? "border-l-2 border-blue-500/20 ml-2 pl-2 mt-2" : ""}`}>
                          {Object.entries(supervisores).map(([supervisor, vends]) => {
                            const supFDS = vends.reduce((a, v) => a + v.metricas.fds, 0);
                            const supRGB = vends.reduce((a, v) => a + v.metricas.rgb, 0);
                            const supCoaching = vends.reduce((a, v) => a + v.metricas.coaching, 0);

                            return (
                              <Collapsible key={supervisor} className="border border-border/50 bg-background rounded-lg shadow-sm border-l-4 border-l-primary/30 ml-2">
                                <CollapsibleTrigger className="w-full flex justify-between items-center p-3 hover:bg-muted/50 transition focus:outline-none group gap-2">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-md bg-secondary/50 flex items-center justify-center shrink-0 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all">
                                      <Users className="w-4 h-4" />
                                    </div>
                                    <div className="text-left min-w-0 overflow-hidden w-full flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                      <div>
                                        <h4 className="font-bold text-sm truncate">{supervisor}</h4>
                                        <p className="text-[11px] text-muted-foreground truncate">{vends.length} vendedores na carteira</p>
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 md:mt-0">
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/20 text-primary bg-primary/5 font-black uppercase tracking-widest">{supFDS} FDS</Badge>
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/20 text-blue-600 bg-blue-500/5 font-black uppercase tracking-widest">{supRGB} RGB</Badge>
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/20 text-amber-600 bg-amber-500/5 font-black uppercase tracking-widest">{supCoaching} COA</Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200 shrink-0" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="bg-muted/5 border-t border-border/30 rounded-b-lg overflow-hidden flex flex-col">
                                    {vends.map((v, i) => <VendedorRow key={i} vendedor={v} />)}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            );
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      <VendedorPerformanceModal
        vendedor={selectedVendedorData}
        onClose={() => setSelectedVendedorData(null)}
        onSelectVisita={(vis) => {
          setSelectedVendedorData(null);
          onSelectVisita && onSelectVisita(vis);
        }}
      />
    </div>
  );
}
