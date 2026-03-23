import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronRight, User, Users, Briefcase, TrendingUp } from 'lucide-react';
import { INDICADORES_TIPO_RGB, REQUER_COACHING } from '@/lib/roles';

interface VendedorAtivo {
  nome_vendedor: string;
  nome_supervisor: string;
  codigo_sup: string;
  municipio: string;
  filial: string;
  gerente: string;
}

interface HierarchyProps {
  visitas: any[];
  vendedores: VendedorAtivo[];
  userLevel: string | undefined;
  userName: string | undefined;
  userUnidade: string | undefined;
}

export function TeamHierarchyView({ visitas, vendedores, userLevel, userName, userUnidade }: HierarchyProps) {

  // 1. Construir a árvore e consolidar os números
  const tree = useMemo(() => {
    const hierarquia: Record<string, Record<string, any[]>> = {};

    // Filtrar base de vendedores pela visão do usuário logado
    const vendsValidos = vendedores.filter(v => {
      if (userLevel === 'Niv1' || (userLevel === 'Niv2' && (userUnidade?.toUpperCase() === 'TODAS' || !userUnidade))) return true;
      if (userLevel === 'Niv2') return v.filial === userUnidade; // Comercial enxerga a filial inteira (Gerentes de Vendas + Supervisores + Vendedores)
      if (userLevel === 'Niv3') return v.gerente === userName || v.filial === userUnidade; // Gerente de Vendas enxerga SEUS supervisores
      if (userLevel === 'Niv4') return v.nome_supervisor === userName; // Supervisor vê SEUS vendedores
      return true; // fallback analista
    });

    // Construção da Árvore: Nível 1: Gerente (Niv3) -> Nível 2: Supervisor (Niv4) -> Folhas: Vendedores
    vendsValidos.forEach(v => {
      const g = v.gerente || 'Sem Gerente';
      const s = v.nome_supervisor || 'Sem Supervisor';

      if (!hierarquia[g]) hierarquia[g] = {};
      if (!hierarquia[g][s]) hierarquia[g][s] = [];

      // Calcular performance individual deste vendedor
      const myVisits = visitas.filter(vis => vis.nome_vendedor?.trim().toUpperCase() === v.nome_vendedor?.trim().toUpperCase());
      const fds = myVisits.filter(vis => vis.indicador_avaliado === 'FDS').length;
      const rgb = myVisits.filter(vis => vis.indicador_avaliado && INDICADORES_TIPO_RGB.includes(vis.indicador_avaliado)).length;
      const coaching = myVisits.filter(vis => vis.indicador_avaliado && REQUER_COACHING.includes(vis.indicador_avaliado)).length;

      hierarquia[g][s].push({
        ...v,
        metricas: { fds, rgb, coaching, total: fds + rgb + coaching }
      });
    });

    return hierarquia;
  }, [vendedores, visitas, userLevel, userName, userUnidade]);

  // Se for Diretor (Niv1) ou Gerente Comercial (Niv2), mostramos a visão completa: [Gerente Vendas => Supervisores => Vendedores]
  // Se for Gerente de Vendas (Niv3), pulamos o seu próprio nome e mostramos direto os [Supervisores => Vendedores].
  // Se for Supervisor (Niv4), mostramos só a lista de Vendedores simples.

  const isSupervisorOnly = userLevel === 'Niv4';
  const isGerenteVendas = userLevel === 'Niv3';

  // Componente Reutilizável de Vendedor
  const VendedorRow = ({ vendedor }: { vendedor: any }) => {
    const m = vendedor.metricas;
    const metaCoaching = 5; // Exemplo de meta individual
    const pctCoaching = Math.min(100, Math.round((m.coaching / metaCoaching) * 100)) || 0;

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-4 hover:bg-muted/30 border-t border-border/40 transition-colors">
        <div className="flex items-center gap-3 mb-2 w-full sm:w-auto sm:mb-0 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-1 ring-primary/20 shrink-0">
            {vendedor.nome_vendedor.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 w-full overflow-hidden">
            <p className="text-sm font-semibold text-foreground truncate">{vendedor.nome_vendedor}</p>
            <p className="text-xs text-muted-foreground truncate">{vendedor.filial} • {vendedor.municipio}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center w-full sm:w-auto mt-2 sm:mt-0">
          <div className="flex flex-col items-center sm:items-end shrink-0">
            <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold">FDS/RGB</span>
            <Badge variant="secondary" className="mt-1 font-mono">{m.fds} / {m.rgb}</Badge>
          </div>
          <div className="flex-1 sm:w-32 flex flex-col items-end">
            <div className="flex justify-between w-full mb-1">
              <span className="text-xs font-semibold">Coaching</span>
              <span className="text-xs text-muted-foreground font-mono">{m.coaching}/{metaCoaching}</span>
            </div>
            <Progress value={pctCoaching} className="h-1.5 w-full bg-border" indicatorColor={pctCoaching >= 100 ? "bg-green-500" : "bg-primary"} />
          </div>
        </div>
      </div>
    );
  };

  if (isSupervisorOnly) {
    // Achatamos a árvore para o Supervisor
    const meusVendedores = Object.values(tree).flatMap(g => Object.values(g).flatMap(s => s));
    if (meusVendedores.length === 0) return <p className="text-muted-foreground text-sm p-4 text-center">Nenhum vendedor encontrado na sua carteira.</p>;

    return (
      <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 bg-muted/20 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Minha Equipe ({meusVendedores.length})</h3>
        </div>
        {meusVendedores.map((v, i) => <VendedorRow key={i} vendedor={v} />)}
      </div>
    );
  }

  // Renderização para Diretor (Niv1), Comercial (Niv2) e Gerente Vendas (Niv3)
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {Object.entries(tree).map(([gerente, supervisores]) => {

        // Pula o agrupamento visual pelo nome do gerente se quem está logado for O PRÓPRIO Gerente de Vendas (Niv3).
        // Isso faz com que a tela dele mostre apenas os Cards de Supervisor (seus subordinados) sem precisar expandir a si mesmo.
        const shouldHideGerenteHeader = isGerenteVendas;

        // Se for Gerente de Vendas, só renderiza se o ramo pertencer a ele mesmo ou estiver na mesma filial
        if (isGerenteVendas && gerente !== userName && gerente !== "Sem Gerente") return null;

        const qtdeSup = Object.keys(supervisores).length;
        const totalVends = Object.values(supervisores).flat().length;

        // Totais Agregados do Gerente
        const tFDS = Object.values(supervisores).flat().reduce((acc, v) => acc + v.metricas.fds, 0);
        const tCoaching = Object.values(supervisores).flat().reduce((acc, v) => acc + v.metricas.coaching, 0);

        const blocoGerente = (
          <Collapsible key={gerente} className="border border-border/60 bg-card rounded-xl shadow-sm overflow-hidden" defaultOpen={shouldHideGerenteHeader}>
            {!shouldHideGerenteHeader && (
              <CollapsibleTrigger className="w-full flex justify-between items-center p-4 hover:bg-muted/30 transition focus:outline-none group gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="text-left min-w-0 overflow-hidden w-full">
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate">Gerente: {gerente}</h3>
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
                      <p className="font-mono font-bold text-sm text-primary">{tCoaching}</p>
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-300" />
                </div>
              </CollapsibleTrigger>
            )}

            <CollapsibleContent className="bg-muted/10">
              <div className={!shouldHideGerenteHeader ? "p-3 pt-0" : "p-0"}>
                <div className={`flex flex-col gap-2 rounded-lg ${!shouldHideGerenteHeader ? "border-l-2 border-primary/20 ml-2 pl-2 mt-2" : ""}`}>

                  {Object.entries(supervisores).map(([supervisor, vends]) => {
                    const sFDS = vends.reduce((a, v) => a + v.metricas.fds, 0);
                    const sCoaching = vends.reduce((a, v) => a + v.metricas.coaching, 0);
                    const sMetaCoaching = vends.length * 5;
                    const pctSC = Math.min(100, Math.round((sCoaching / sMetaCoaching) * 100)) || 0;

                    return (
                      <Collapsible key={supervisor} className="border border-border/50 bg-background rounded-lg shadow-sm">
                        <CollapsibleTrigger className="w-full flex justify-between items-center p-3 hover:bg-muted/50 transition focus:outline-none group gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Users className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            <div className="text-left min-w-0 overflow-hidden w-full">
                              <h4 className="font-bold text-sm truncate">{supervisor}</h4>
                              <p className="text-[11px] text-muted-foreground truncate">{vends.length} vendedores ativos</p>
                            </div>
                          </div>
                          <div className="flex gap-4 items-center shrink-0">
                            <div className="w-24 hidden md:block text-right">
                              <Progress value={pctSC} className="h-1.5 w-full bg-border" indicatorColor={pctSC >= 100 ? "bg-green-500" : "bg-primary"} />
                              <span className="text-[10px] text-muted-foreground font-semibold mt-1 inline-block">{pctSC}% da Equipe</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform duration-200" />
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="bg-card">
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

        return blocoGerente;
      })}
    </div>
  );
}
