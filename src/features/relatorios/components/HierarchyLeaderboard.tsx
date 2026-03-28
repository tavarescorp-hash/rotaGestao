import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Award, Target, ChevronRight } from "lucide-react";
import { Visita, VendedorAtivo } from "@/lib/api";
import { INDICADORES_TIPO_RGB, REQUER_COACHING } from "@/lib/roles";

interface HierarchyLeaderboardProps {
  visitas: Visita[];
  vendedores: VendedorAtivo[];
  onSelectLevel?: (level: string, name: string) => void;
}

export function HierarchyLeaderboard({ visitas, vendedores, onSelectLevel }: HierarchyLeaderboardProps) {
  const [activeLevel, setActiveLevel] = useState<"filial" | "comercial" | "gerente" | "supervisor">("filial");

  const data = useMemo(() => {
    const groups: Record<string, { 
      name: string; 
      fds: number; 
      rgb: number; 
      coaching: number; 
      vendedores: Set<string>;
      supervisores: Set<string>;
    }> = {};

    vendedores.forEach(v => {
      let key = "";
      if (activeLevel === "filial") {
        if (v.filial?.toUpperCase().includes('MACA') || v.filial === 'M') key = 'Comercial Macaé';
        else if (v.filial?.toUpperCase().includes('CAMPO') || v.filial === 'C') key = 'Comercial Campos';
        else key = v.filial || "Outros";
      } else if (activeLevel === "comercial") {
        key = v.gerente_comercial || "Sem G. Comercial";
      } else if (activeLevel === "gerente") {
        key = v.gerente || "Sem G. Vendas";
      } else if (activeLevel === "supervisor") {
        key = v.nome_supervisor || "Sem Supervisor";
      }

      if (!groups[key]) {
        groups[key] = { name: key, fds: 0, rgb: 0, coaching: 0, vendedores: new Set(), supervisores: new Set() };
      }
      
      if (v.nome_vendedor) groups[key].vendedores.add(v.nome_vendedor.toUpperCase());
      if (v.nome_supervisor) groups[key].supervisores.add(v.nome_supervisor.toUpperCase());
    });

    // Calcular Visitas por Grupo
    visitas.forEach(vis => {
      const vNome = vis.nome_vendedor?.toUpperCase();
      if (!vNome) return;

      const vendBase = vendedores.find(v => v.nome_vendedor?.toUpperCase() === vNome);
      if (!vendBase) return;

      let key = "";
      if (activeLevel === "filial") {
        if (vendBase.filial?.toUpperCase().includes('MACA') || vendBase.filial === 'M') key = 'Comercial Macaé';
        else if (vendBase.filial?.toUpperCase().includes('CAMPO') || vendBase.filial === 'C') key = 'Comercial Campos';
        else key = vendBase.filial || "Outros";
      } else if (activeLevel === "comercial") {
        key = vendBase.gerente_comercial || "Sem G. Comercial";
      } else if (activeLevel === "gerente") {
        key = vendBase.gerente || "Sem G. Vendas";
      } else if (activeLevel === "supervisor") {
        key = vendBase.nome_supervisor || "Sem Supervisor";
      }

      if (groups[key]) {
        if (vis.indicador_avaliado === 'FDS') groups[key].fds++;
        else if (vis.indicador_avaliado && INDICADORES_TIPO_RGB.includes(vis.indicador_avaliado)) groups[key].rgb++;
        if (vis.indicador_avaliado && REQUER_COACHING.includes(vis.indicador_avaliado)) groups[key].coaching++;
      }
    });

    return Object.values(groups).map(g => {
      const nSups = (activeLevel === "supervisor" || activeLevel === "gerente" || activeLevel === "comercial") ? 1 : g.supervisores.size;
      const nVends = g.vendedores.size;
      const metaFds = Math.max(1, nSups) * 10;
      const metaCoaching = Math.max(1, nVends) * 5;
      const metaRgb = Math.max(1, nSups) * 20;

      return {
        ...g,
        metaFds,
        metaCoaching,
        metaRgb,
        pctFds: Math.min(100, Math.round((g.fds / metaFds) * 100)) || 0,
        pctCoaching: Math.min(100, Math.round((g.coaching / metaCoaching) * 100)) || 0,
        pctRgb: Math.min(100, Math.round((g.rgb / metaRgb) * 100)) || 0
      };
    }).sort((a, b) => (b.pctFds + b.pctCoaching) - (a.pctFds + a.pctCoaching));
  }, [visitas, vendedores, activeLevel]);

  return (
    <Card className="glass-card bg-card/40 border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-bold">Desempenho por Nível</CardTitle>
          </div>
          <Tabs value={activeLevel} onValueChange={(v: any) => setActiveLevel(v)} className="w-full sm:w-auto">
            <TabsList className="grid grid-cols-4 bg-background/50 h-8 p-1 gap-1">
              <TabsTrigger value="filial" className="text-[9px] sm:text-[10px] uppercase font-black px-2">Filial</TabsTrigger>
              <TabsTrigger value="comercial" className="text-[9px] sm:text-[10px] uppercase font-black px-2">Comercial</TabsTrigger>
              <TabsTrigger value="gerente" className="text-[9px] sm:text-[10px] uppercase font-black px-2">G.Vendas</TabsTrigger>
              <TabsTrigger value="supervisor" className="text-[9px] sm:text-[10px] uppercase font-black px-2">Supervisor</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/40">
          {data.map((item, idx) => (
            <div 
              key={idx} 
              className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
              onClick={() => onSelectLevel && onSelectLevel(activeLevel, item.name)}
            >
              <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </span>
                    {idx === 0 && <Award className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {item.vendedores.size} Vendedores</span>
                    {activeLevel !== "supervisor" && (
                      <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {item.supervisores.size} Supervisores</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 items-center w-full md:w-auto">
                  {/* FDS */}
                  <div className="w-full md:w-28 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">FDS</span>
                      <span>{item.fds} / {item.metaFds}</span>
                    </div>
                    <Progress value={item.pctFds} className="h-1.5" indicatorColor={item.pctFds >= 100 ? "bg-green-500" : "bg-emerald-500"} />
                  </div>

                  {/* RGB */}
                  <div className="w-full md:w-24 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">RGB</span>
                      <span>{item.rgb} / {item.metaRgb}</span>
                    </div>
                    <Progress value={item.pctRgb} className="h-1.5" indicatorColor={item.pctRgb >= 100 ? "bg-green-500" : "bg-blue-500"} />
                  </div>

                  {/* Coaching */}
                  <div className="w-full md:w-24 space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground uppercase">Coaching</span>
                      <span>{item.coaching} / {item.metaCoaching}</span>
                    </div>
                    <Progress value={item.pctCoaching} className="h-1.5" indicatorColor={item.pctCoaching >= 100 ? "bg-green-500" : "bg-orange-500"} />
                  </div>

                  <ChevronRight className="hidden md:block w-4 h-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="p-10 text-center text-sm text-muted-foreground italic">
              Nenhum dado encontrado para este nível nos filtros selecionados.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
