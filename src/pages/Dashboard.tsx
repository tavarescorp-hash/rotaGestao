import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buscarVisitas, excluirVisita, buscarVendedoresAtivos, buscarMetasConfig, type Visita, type VendedorAtivo, type MetaConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, RefreshCw, Trash2, Filter, Calendar, MapPin, ClipboardList, ChevronRight, Users, Settings2, User, Trophy, BarChart3, ListChecks, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getIndicadoresPorNivel, INDICADORES_COMPASS_LOCKED, INDICADORES_QUEDAS_LOCKED, INDICADORES_TIPO_RGB, REQUER_COACHING } from "@/lib/roles";
import { useDashboardMetrics } from "@/features/relatorios/hooks/useDashboardMetrics";
import { VisitaModalDialog } from "@/features/relatorios/components/VisitaModalDialog";
import { TeamHierarchyView } from "@/components/TeamHierarchyView";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, FunnelChart, Funnel, LabelList, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";


const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [vendedoresBaseReal, setVendedoresBaseReal] = useState<VendedorAtivo[]>([]);
  const [metasUsuario, setMetasUsuario] = useState<MetaConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtroIndicadorModal, setFiltroIndicadorModal] = useState<string | null>(null);
  const [filtroPiramideModal, setFiltroPiramideModal] = useState<string | null>(null);
  const [filtroAvaliadorDetalhe, setFiltroAvaliadorDetalhe] = useState<string | null>(null);

  const {
    dateRange, setDateRange,
    unidade, setUnidade,
    indicadorFiltro, setIndicadorFiltro,
    cargoFiltro, setCargoFiltro,
    usuarioFiltro, setUsuarioFiltro,
    isAnalista,
    filtradas,
    estatisticasMes, cargosUnicos, unidadesUnicas, usuariosUnicos,
    dadosGraficoAnalista, visitasHierarchy
  } = useDashboardMetrics(visitas, vendedoresBaseReal, user, metasUsuario);

  // Lógica de cascata para encontrar quais indicadores exibir
  const indicadoresExibicao = React.useMemo(() => {
    if (metasUsuario && metasUsuario.length > 0) {
      return metasUsuario.map(m => m.indicador);
    }
    const porNivel = getIndicadoresPorNivel(user?.nivel);
    if (porNivel.length > 0) return porNivel;
    const porFuncao = getIndicadoresPorNivel(user?.funcao);
    if (porFuncao.length > 0) return porFuncao;
    return [];
  }, [metasUsuario, user?.nivel, user?.funcao]);

  const carregarVisitas = async () => {
    setLoading(true);
    try {
      const [dataVisitas, dataVendedores, dataMetas] = await Promise.all([
        buscarVisitas(user),
        buscarVendedoresAtivos(user),
        buscarMetasConfig(user?.id, user?.empresa_id)
      ]);
      setVisitas(dataVisitas);
      setVendedoresBaseReal(dataVendedores);
      if (dataMetas.length > 0) {
        console.log("✅ [SaaS Meta Sync] Metas encontradas no Supabase:", dataMetas);
      } else {
        console.warn("ℹ️ [SaaS Meta Sync] Nenhuma meta customizada no Supabase para este user_id:", user?.id);
      }
      setMetasUsuario(dataMetas);
    } catch (error) {
      console.error("❌ [SaaS Meta Sync] Erro ao carregar dados do Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarVisitas();
  }, []);

  useEffect(() => {
    if (indicadoresExibicao.length === 0 && !loading) {
      console.warn("⚠️ Nenhuma métrica vinculada encontrada para:", {
        name: user?.name,
        nivel: user?.nivel,
        funcao: user?.funcao
      });
    }
  }, [indicadoresExibicao, user, loading]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <Card className="bg-amber-50/40 dark:bg-[#0A0F1E]/95 border-amber-100/50 dark:border-none shadow-2xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFB800]/5 to-transparent pointer-events-none" />

        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-[#FFB800] flex items-center justify-center shadow-[0_0_15px_rgba(255,184,0,0.2)]">
                <ClipboardList className="w-8 h-8 md:w-10 md:h-10 text-black" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-black dark:text-white uppercase">{user?.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge className="bg-[#FFB800] text-black font-black text-[10px] md:text-xs px-3 py-1.5 rounded-lg border-none hover:bg-[#FFB800]/90 transition-colors uppercase">
                    {user?.formattedRole}
                  </Badge>

                  <Badge className="bg-slate-500/80 dark:bg-slate-700/80 text-white font-bold text-[10px] md:text-xs px-3 py-1.5 rounded-lg border-none hover:bg-slate-600 transition-colors">
                    Unidade: <span className="font-black ml-1 uppercase">
                      {(() => {
                        const u = user?.unidade?.toUpperCase();
                        if (u === "C" || u === "CAMPO") return "CAMPOS";
                        if (u === "M") return "MACAÉ";
                        return u || "CAMPOS";
                      })()}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>

            {/* Right: Metrics Tags (Linked Metrics) - Estilo Screenshot Cinza/Branco */}
            <div className="w-full lg:max-w-md bg-slate-200/60 dark:bg-white/5 p-4 rounded-2xl border border-slate-300/30 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-slate-500 dark:text-white/40 font-black uppercase tracking-[0.1em] flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" />
                  Consolidado da Operação
                </p>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Live Insight</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {indicadoresExibicao.map((ind, i) => {
                  const upper = ind.toUpperCase();
                  let count = 0;
                  let colorClass = "text-slate-600 dark:text-white/70";
                  let label = ind;

                  if (upper.includes('FDS')) { count = estatisticasMes.qtdeFDS; colorClass = "text-emerald-600 dark:text-emerald-400"; label = "FDS"; }
                  else if (upper.includes('COMPASS')) { count = estatisticasMes.qtdeCompass; colorClass = "text-purple-600 dark:text-purple-400"; label = "COMPASS"; }
                  else if (upper.includes('QUEDA')) { count = estatisticasMes.qtdeQuedas; colorClass = "text-rose-600 dark:text-rose-400"; label = "QUEDAS"; }
                  else if (upper.includes('RGB')) { count = estatisticasMes.qtdeRGB; colorClass = "text-blue-600 dark:text-blue-400"; label = "RGB"; }
                  else if (upper.includes('COACHING')) { count = estatisticasMes.qtdeCoaching; colorClass = "text-amber-600 dark:text-amber-400"; label = "COA"; }

                  return (
                    <span key={i} className={cn("bg-white dark:bg-white/10 px-3 py-1.5 rounded-xl font-black text-[10px] shadow-sm border border-slate-200/50 dark:border-none", colorClass)}>
                      {label}: {count}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FERRAMENTAS DE FILTRO E SINCRONIZAÇÃO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#0A0F1E]/60 p-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none justify-start text-left bg-card dark:bg-card/40 border-border dark:border-border/10 font-bold text-[10px] h-10 px-4 rounded-xl">
                <Calendar className="mr-2 h-4 w-4 text-[#FFB800]" />
                <span>{dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "dd/MM/yy")} - ${format(dateRange.to, "dd/MM/yy")}` : format(dateRange.from, "dd/MM/yy")) : "Selecionar Data"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} locale={ptBR} numberOfMonths={1} />
            </PopoverContent>
          </Popover>

          <Button
            variant={showAdvancedFilters ? "secondary" : "outline"}
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex-1 sm:flex-none bg-card dark:bg-card/40 border-border dark:border-border/10 font-bold text-[10px] h-10 px-4 rounded-xl"
          >
            <Settings2 className="h-4 w-4 mr-2 text-[#FFB800]" />
            Filtros Avançados
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
          {!isAnalista && (
            <Button
              onClick={() => navigate("/nova-visita")}
              className="bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-black text-[10px] h-10 px-6 rounded-xl uppercase tracking-widest shadow-[0_4px_12px_rgba(255,184,0,0.3)] transition-all w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Nova Visita
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={carregarVisitas}
            disabled={loading}
            className="font-black text-[10px] h-10 px-6 rounded-xl uppercase tracking-widest shadow-sm hover:shadow-md transition-all w-full sm:w-auto"
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sincronizar Dados
          </Button>
        </div>
      </div>

      {showAdvancedFilters && (
        <Card className="bg-card dark:bg-card/20 border-border/40 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl overflow-hidden shadow-xl">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unidade</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger className="bg-background/50 h-10 font-bold text-xs rounded-xl border-border/60"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="todas">Todas as Unidades</SelectItem>
                    {unidadesUnicas.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cargo</Label>
                <Select value={cargoFiltro} onValueChange={setCargoFiltro}>
                  <SelectTrigger className="bg-background/50 h-10 font-bold text-xs rounded-xl border-border/60"><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="todos">Todos os Cargos</SelectItem>
                    {cargosUnicos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Métrica Indicador</Label>
                <Select value={indicadorFiltro} onValueChange={setIndicadorFiltro}>
                  <SelectTrigger className="bg-background/50 h-10 font-bold text-xs rounded-xl border-border/60"><SelectValue placeholder="Todas" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="todos">Todas as Métricas</SelectItem>
                    <SelectItem value="FDS">FDS</SelectItem>
                    <SelectItem value="RGB">RGB</SelectItem>
                    <SelectItem value="COACHING">Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1.5 pt-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pesquisar por Usuário (Líder ou Vendedor)</Label>
                <Select value={usuarioFiltro} onValueChange={setUsuarioFiltro}>
                  <SelectTrigger className="bg-background/50 h-11 font-bold text-xs rounded-xl border-border/60 shadow-inner"><SelectValue placeholder="Pesquisar por usuário..." /></SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    <SelectItem value="todos">Todos os Usuários</SelectItem>
                    {usuariosUnicos.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. MEUS INDICADORES SECTION */}
      {!isAnalista && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-[#FFB800]/20 flex items-center justify-center border border-[#FFB800]/30 shadow-sm">
              <Calendar className="w-4 h-4 text-[#FFB800]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black uppercase tracking-widest text-[#FFB800] leading-tight">
                Meus Indicadores
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase opacity-70">
                Acompanhamento de suas avaliações neste período.
              </p>
            </div>
          </div>

          {(() => {
            const showFDS = indicadoresExibicao.some(i => i.toUpperCase().includes('FDS'));
            const showRGB = indicadoresExibicao.some(i => i.toUpperCase() === 'RGB' || i.toUpperCase().includes('FOCO RGB'));
            const showCoaching = indicadoresExibicao.some(i => i.toUpperCase().includes('COACHING'));
            const showCompass = indicadoresExibicao.some(i => i.toUpperCase().includes('COMPASS'));
            const showQuedas = indicadoresExibicao.some(i => i.toUpperCase().includes('QUEDA'));

            const totalCards = [showFDS, showRGB, showCoaching, showCompass, showQuedas].filter(Boolean).length;
            const colSpanCard = totalCards <= 2 ? "md:col-span-2" : "md:col-span-1";

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {showCompass && (
                  <Card onClick={() => setFiltroIndicadorModal('COMPASS')} className={cn("bg-white dark:bg-[#0F172A]/40 border-black/5 dark:border-white/5 hover:border-[#FFB800]/30 cursor-pointer overflow-hidden transition-all duration-300 group shadow-lg", colSpanCard)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-[0.1em]">Maiores potenciais base compass em RGB BAR</h3>
                            <p className="text-2xl font-black text-foreground dark:text-white">
                              {estatisticasMes.qtdeCompass} <span className="text-sm font-bold text-muted-foreground/30">/ {estatisticasMes.META_COMPASS}</span>
                            </p>
                          </div>
                          <div className={cn("text-xs font-black px-2 py-1 rounded", (estatisticasMes.qtdeCompass / Math.max(estatisticasMes.META_COMPASS, 1)) >= 1 ? "bg-green-500/10 text-green-500" : "bg-[#FFB800]/10 text-[#FFB800]")}>
                            {Math.round((estatisticasMes.qtdeCompass / Math.max(estatisticasMes.META_COMPASS, 1)) * 100) || 0}%
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted dark:bg-black/40 rounded-full overflow-hidden border border-black/5 p-[1.5px]">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000", (estatisticasMes.qtdeCompass / Math.max(estatisticasMes.META_COMPASS, 1)) >= 1 ? "bg-green-500 shadow-[2px_0_8px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[2px_0_5px_rgba(255,184,0,0.3)]")}
                            style={{ width: `${Math.min((estatisticasMes.qtdeCompass / Math.max(estatisticasMes.META_COMPASS, 1)) * 100, 100) || 0}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {showQuedas && (
                  <Card onClick={() => setFiltroIndicadorModal('QUEDAS')} className={cn("bg-white dark:bg-[#0F172A]/40 border-black/5 dark:border-white/5 hover:border-[#FFB800]/30 cursor-pointer overflow-hidden transition-all duration-300 group shadow-lg", colSpanCard)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-[0.1em]">Maiores quedas RGB mês anterior</h3>
                            <p className="text-2xl font-black text-foreground dark:text-white">
                              {estatisticasMes.qtdeQuedas} <span className="text-sm font-bold text-muted-foreground/30">/ {estatisticasMes.META_QUEDAS}</span>
                            </p>
                          </div>
                          <div className={cn("text-xs font-black px-2 py-1 rounded", (estatisticasMes.qtdeQuedas / Math.max(estatisticasMes.META_QUEDAS, 1)) >= 1 ? "bg-green-500/10 text-green-500" : "bg-[#FFB800]/10 text-[#FFB800]")}>
                            {Math.round((estatisticasMes.qtdeQuedas / Math.max(estatisticasMes.META_QUEDAS, 1)) * 100) || 0}%
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted dark:bg-black/40 rounded-full overflow-hidden border border-black/5 p-[1.5px]">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000", (estatisticasMes.qtdeQuedas / Math.max(estatisticasMes.META_QUEDAS, 1)) >= 1 ? "bg-green-500 shadow-[2px_0_8px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[2px_0_5px_rgba(255,184,0,0.3)]")}
                            style={{ width: `${Math.min((estatisticasMes.qtdeQuedas / Math.max(estatisticasMes.META_QUEDAS, 1)) * 100, 100) || 0}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {showFDS && (
                  <Card onClick={() => setFiltroIndicadorModal('FDS')} className={cn("bg-white dark:bg-[#0F172A]/40 border-black/5 dark:border-white/5 hover:border-[#FFB800]/30 cursor-pointer overflow-hidden transition-all duration-300 group shadow-lg", colSpanCard)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-[0.1em]">FDS</h3>
                            <p className="text-2xl font-black text-foreground dark:text-white">
                              {estatisticasMes.qtdeFDS} <span className="text-sm font-bold text-muted-foreground/30">/ {estatisticasMes.META_FDS}</span>
                            </p>
                          </div>
                          <div className={cn("text-xs font-black px-2 py-1 rounded", (estatisticasMes.qtdeFDS / estatisticasMes.META_FDS) >= 1 ? "bg-green-500/10 text-green-500" : "bg-[#FFB800]/10 text-[#FFB800]")}>
                            {Math.round((estatisticasMes.qtdeFDS / estatisticasMes.META_FDS) * 100) || 0}%
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted dark:bg-black/40 rounded-full overflow-hidden border border-black/5 p-[1.5px]">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000", (estatisticasMes.qtdeFDS / estatisticasMes.META_FDS) >= 1 ? "bg-green-500 shadow-[2px_0_8px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[2px_0_5px_rgba(255,184,0,0.3)]")}
                            style={{ width: `${Math.min((estatisticasMes.qtdeFDS / estatisticasMes.META_FDS) * 100, 100) || 0}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {showRGB && (
                  <Card onClick={() => setFiltroIndicadorModal('RGB')} className={cn("bg-white dark:bg-[#0F172A]/40 border-black/5 dark:border-white/5 hover:border-[#FFB800]/30 cursor-pointer overflow-hidden transition-all duration-300 group shadow-lg", colSpanCard)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-[0.1em]">RGB</h3>
                            <p className="text-2xl font-black text-foreground dark:text-white">
                              {estatisticasMes.qtdeRGB} <span className="text-sm font-bold text-muted-foreground/30">/ {estatisticasMes.META_RGB}</span>
                            </p>
                          </div>
                          <div className={cn("text-xs font-black px-2 py-1 rounded", (estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) >= 1 ? "bg-green-500/10 text-green-500" : "bg-[#FFB800]/10 text-[#FFB800]")}>
                            {Math.round((estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) * 100) || 0}%
                          </div>
                        </div>
                        <div className="h-2 w-full bg-muted dark:bg-black/40 rounded-full overflow-hidden border border-black/5 p-[1.5px]">
                          <div
                            className={cn("h-full rounded-full transition-all duration-1000", (estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) >= 1 ? "bg-green-500 shadow-[2px_0_8px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[2px_0_5px_rgba(255,184,0,0.3)]")}
                            style={{ width: `${Math.min((estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) * 100, 100) || 0}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {showCoaching && (
                  <Card onClick={() => setFiltroIndicadorModal('COACHING')} className="md:col-span-2 bg-white dark:bg-[#0F172A]/40 border-black/5 dark:border-white/5 hover:border-[#FFB800]/30 cursor-pointer overflow-hidden flex flex-col transition-all duration-300 shadow-xl relative">
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-[10px] font-black text-muted-foreground dark:text-white/40 uppercase tracking-[0.1em] flex items-center gap-2">
                            COACHING <span className="text-[8px] opacity-40 font-bold">({estatisticasMes.detalhesCoaching.length} Vnds)</span>
                          </h3>
                          <div className="flex items-end gap-3 mt-1">
                            <p className="text-2xl font-black text-foreground dark:text-white">
                              {estatisticasMes.qtdeCoaching} <span className="text-sm font-bold text-muted-foreground/30">/ {estatisticasMes.META_COACHING}</span>
                            </p>
                            <div className={cn("text-xs font-black px-2 py-1 rounded mb-1", (estatisticasMes.qtdeCoaching / estatisticasMes.META_COACHING) >= 1 ? "bg-green-500/10 text-green-500" : "bg-[#FFB800]/10 text-[#FFB800]")}>
                              {Math.round((estatisticasMes.qtdeCoaching / estatisticasMes.META_COACHING) * 100) || 0}%
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <div className="h-2 w-full bg-muted dark:bg-black/40 rounded-full overflow-hidden border border-black/5 p-[1.5px]">
                            <div
                              className={cn("h-full rounded-full transition-all duration-1000", (estatisticasMes.qtdeCoaching / estatisticasMes.META_COACHING) >= 1 ? "bg-green-500 shadow-[2px_0_8px_rgba(34,197,94,0.4)]" : "bg-[#FFB800] shadow-[2px_0_5px_rgba(255,184,0,0.3)]")}
                              style={{ width: `${Math.min((estatisticasMes.qtdeCoaching / estatisticasMes.META_COACHING) * 100, 100) || 0}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Individual Vendor List Inside Card */}
                      <div className="border-t border-muted dark:border-white/5 pt-4 space-y-4 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                        <div className="flex items-center justify-between px-1 mb-2">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Vendedor</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50 text-right">Realizado / Meta</span>
                        </div>
                        {estatisticasMes.detalhesCoaching.slice(0, 5).map((vend, idx) => (
                          <div key={idx} className="space-y-2 group/vend">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-[10px] font-bold text-foreground/80 group-hover/vend:text-foreground transition-colors uppercase tracking-tight">{vend.nome}</span>
                              <span className="text-[10px] font-black text-[#FFB800]">{vend.atual} / {vend.meta}</span>
                            </div>
                            <div className="h-2 w-full bg-muted/60 dark:bg-black/30 rounded-full overflow-hidden p-[1px]">
                              <div
                                className={cn("h-full rounded-full transition-all duration-1000", vend.atual >= vend.meta ? 'bg-green-500' : 'bg-[#FFB800] shadow-[1px_0_5px_rgba(255,184,0,0.2)]')}
                                style={{ width: `${Math.min((vend.atual / vend.meta) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {estatisticasMes.detalhesCoaching.length === 0 && (
                          <p className="text-[10px] italic text-muted-foreground/30 text-center py-4">Nenhum dado individual registrado.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. VISÃO MESTAL ANALISTA (LINHA CRESCENTE) */}
      {isAnalista && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 mt-8">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-[#FFB800]/20 flex items-center justify-center border border-[#FFB800]/30 shadow-sm">
              <TrendingUp className="w-4 h-4 text-[#FFB800]" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-black uppercase tracking-widest text-[#FFB800] leading-tight">
                Performances Consolidadas
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold tracking-wide uppercase opacity-70">
                Linha crescente de avaliações fechadas por gestor de campo.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dadosGraficoAnalista.map((usr, i) => {
              const total = usr.FDS + usr.RGB + usr.Coaching + usr.Compass + usr.Quedas;
              const meta = 60; // Base Linear Dinâmica
              const prog = Math.min((total / meta) * 100, 100);
              return (
                <Card key={i} onClick={() => setFiltroAvaliadorDetalhe(usr.name.toUpperCase())} className="bg-white/40 dark:bg-card/40 backdrop-blur-sm border-border/40 hover:border-[#FFB800]/50 cursor-pointer transition-all shadow-sm group overflow-hidden">
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm uppercase truncate text-foreground group-hover:text-[#FFB800] transition-colors">{usr.name}</h3>
                      <span className="text-[10px] font-black bg-[#FFB800]/10 border border-[#FFB800]/20 px-2 py-0.5 rounded text-[#FFB800]">{total} Avs Fechadas</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-[-5px]">
                      {usr.FDS > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded uppercase">FDS: {usr.FDS}</span>}
                      {usr.RGB > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded uppercase">RGB: {usr.RGB}</span>}
                      {usr.Coaching > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded uppercase">COA: {usr.Coaching}</span>}
                      {usr.Compass > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-purple-500/10 text-purple-600 rounded uppercase">COM: {usr.Compass}</span>}
                      {usr.Quedas > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 bg-rose-500/10 text-rose-600 rounded uppercase">QUE: {usr.Quedas}</span>}
                      {(usr.FDS === 0 && usr.RGB === 0 && usr.Coaching === 0 && usr.Compass === 0 && usr.Quedas === 0) && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 bg-muted/30 text-muted-foreground/40 rounded uppercase">Sem Atividade</span>
                      )}
                    </div>
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                        <span>Linha de Meta Crescente</span>
                        <span className={cn(prog >= 100 ? "text-green-500 drop-shadow-[0_0_2px_rgba(34,197,94,0.8)]" : "text-[#FFB800]")}>{Math.round(prog)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5">
                        <div
                          className={cn("h-full rounded-full transition-all duration-1000", prog >= 100 ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-[#FFB800] shadow-[0_0_8px_rgba(255,184,0,0.4)]")}
                          style={{ width: `${prog}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {dadosGraficoAnalista.length === 0 && (
              <p className="text-[11px] font-bold opacity-40 uppercase tracking-widest italic py-10 col-span-3 text-center border border-dashed border-border/50 rounded-2xl">Aguardando Avaliações de Equipe no Período Selecionado.</p>
            )}
          </div>
        </div>
      )}

      {/* 4. GESTÃO DE EQUIPE SECTION */}
      {(!isAnalista && (user?.nivel === 'Niv1' || user?.nivel === 'Niv2' || user?.nivel === 'Niv3' || user?.nivel === 'Niv4')) && (
        <div className="space-y-6 pt-16 border-t border-muted/30">
          <TeamHierarchyView
            visitas={visitasHierarchy}
            vendedores={usuarioFiltro === "todos" ? vendedoresBaseReal : vendedoresBaseReal.filter(v =>
              v.nome_vendedor?.toUpperCase() === usuarioFiltro.toUpperCase() ||
              v.nome_supervisor?.toUpperCase() === usuarioFiltro.toUpperCase() ||
              v.gerente?.toUpperCase() === usuarioFiltro.toUpperCase() ||
              v.gerente_comercial?.toUpperCase() === usuarioFiltro.toUpperCase()
            )}
            userLevel={user?.nivel}
            userName={user?.name}
            userId={user?.id}
            userUnidade={unidade === "todas" ? user?.unidade : unidade}
            userFuncao={user?.funcao}
            searchTerm={usuarioFiltro}
            onSelectVisita={setSelectedVisita}
          />
        </div>
      )}

      {/* Modais Customizados */}
      <VisitaModalDialog selectedVisita={selectedVisita} onClose={() => setSelectedVisita(null)} />

      <Dialog open={!!filtroIndicadorModal} onOpenChange={(open) => !open && setFiltroIndicadorModal(null)}>
        <DialogContent className="sm:max-w-[650px] w-[95vw] max-h-[85vh] overflow-y-auto p-0 custom-scrollbar bg-background dark:bg-[#0D121F] border border-border dark:border-white/10 shadow-2xl">
          <div className="sticky top-0 z-10 bg-background/90 dark:bg-[#0D121F]/90 backdrop-blur-md p-6 border-b border-border dark:border-white/5">
            <DialogHeader className="m-0 text-left">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setFiltroIndicadorModal(null)} className="h-10 w-10 hover:bg-muted dark:hover:bg-white/5 rounded-xl border border-border dark:border-white/5">
                  <ArrowLeft className="w-5 h-5 text-foreground dark:text-white" />
                </Button>
                <div>
                  <DialogTitle className="text-xl font-black uppercase tracking-[0.1em] text-[#FFB800]">Indicador: {filtroIndicadorModal}</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-muted-foreground dark:text-white/40 mt-1 uppercase tracking-widest">Registros vinculados a esta métrica no dashboard.</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-3">
            {(() => {
              const normalizeInd = (s?: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() : "";
              const listNormalized = (arr: string[]) => arr.map(id => normalizeInd(id));
              const N_COMPASS = listNormalized(INDICADORES_COMPASS_LOCKED);
              const N_QUEDAS = listNormalized(INDICADORES_QUEDAS_LOCKED);
              const N_TIPO_RGB = listNormalized(INDICADORES_TIPO_RGB);
              const N_COACHING = listNormalized(REQUER_COACHING);

              const fVal = filtroIndicadorModal || "";
              const mFiltradas = filtradas.filter(v => {
                const vInd = normalizeInd(v.indicador_avaliado);
                if (fVal === 'FDS') return vInd === 'FDS';
                if (fVal === 'RGB') return N_TIPO_RGB.includes(vInd);
                if (fVal === 'COACHING') return N_COACHING.includes(vInd);
                if (fVal === 'COMPASS') return N_COMPASS.includes(vInd);
                if (fVal === 'QUEDAS') return N_QUEDAS.includes(vInd);
                return false;
              });

              if (mFiltradas.length === 0) return <p className="text-sm font-bold italic opacity-30 text-center py-20">Sem visitas para este indicador.</p>;

              return mFiltradas.map((v, i) => (
                <Card key={v.id || i} onClick={() => setSelectedVisita(v)} className="bg-card dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 border-border dark:border-white/5 hover:border-[#FFB800]/30 transition-all cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-muted dark:bg-[#FFB800]/10 flex items-center justify-center text-foreground dark:text-[#FFB800] font-black border border-border dark:border-[#FFB800]/20">
                        {v.avaliador.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-black h-4 border-[#FFB800] text-[#FFB800] bg-[#FFB800]/5 shrink-0 px-1.5 font-mono">
                            {v.codigo_pdv}
                          </Badge>
                          <Badge variant="secondary" className="text-[8px] font-black h-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 border-none px-1.5 uppercase flex items-center gap-1">
                            <Trophy className="w-2 h-2 text-[#FFB800]" />
                            {v.indicador_avaliado}
                          </Badge>
                          <p className="font-bold text-sm text-foreground truncate group-hover:text-[#FFB800] transition-colors">{v.nome_fantasia_pdv}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase mt-1">
                          <span className="text-[#FFB800]/70">{v.avaliador}</span>
                          <span>•</span>
                          <span>{v.data_visita}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#FFB800] transition-all" />
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Pirâmide (Resumo de Usuários) */}
      <Dialog open={!!filtroPiramideModal} onOpenChange={(open) => !open && setFiltroPiramideModal(null)}>
        <DialogContent className="max-w-[700px] border-none bg-card/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden sm:rounded-2xl">
          <div className="bg-[#38BDF8] px-6 py-6 flex items-start justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <DialogTitle className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none mb-1">
                {filtroPiramideModal}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-bold text-xs uppercase tracking-widest">
                Resumo da Operação Individual
              </DialogDescription>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-xl bg-black/10 flex items-center justify-center backdrop-blur-md border border-white/20">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-card/50">
            <div className="grid grid-cols-1 gap-4">
              {(() => {
                if (!filtroPiramideModal) return null;

                const matchCargo = (c: string, target: string) => {
                  if (target === 'DIRETOR') return c.includes('DIRETOR');
                  if (target === 'GERENTE COMERCIAL') return c.includes('GERENTE COMERCIAL') || c.includes('GCOM');
                  if (target === 'GERENTE DE VENDAS') return c.includes('GERENTE DE VENDAS') || c.includes('GNV') || c.includes('GERENTE REGIONAL');
                  if (target === 'SUPERVISOR') return c.includes('SUPERVISOR');
                  return false;
                };

                const avsDaLideranca = filtradas.filter(
                  v => matchCargo(v.cargo?.trim().toUpperCase() || "", filtroPiramideModal)
                );

                const resumoSellers: Record<string, { fds: number, rgb: number, coaching: number, compass: number, quedas: number, total: number }> = {};

                const normalizeInd = (s?: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() : "";
                const listN = (arr: string[]) => arr.map(id => normalizeInd(id));
                const N_COMPASS = listN(INDICADORES_COMPASS_LOCKED);
                const N_QUEDAS = listN(INDICADORES_QUEDAS_LOCKED);
                const N_TIPO_RGB = listN(INDICADORES_TIPO_RGB);
                const N_COACHING = listN(REQUER_COACHING);

                avsDaLideranca.forEach(v => {
                  const n = v.avaliador?.toUpperCase() || "NÃO IDENTIFICADO";
                  if (!resumoSellers[n]) {
                    resumoSellers[n] = { fds: 0, rgb: 0, coaching: 0, compass: 0, quedas: 0, total: 0 };
                  }
                  const vInd = normalizeInd(v.indicador_avaliado);
                  if (vInd === 'FDS') resumoSellers[n].fds++;
                  else if (N_COACHING.includes(vInd)) resumoSellers[n].coaching++;
                  else if (N_COMPASS.includes(vInd)) resumoSellers[n].compass++;
                  else if (N_QUEDAS.includes(vInd)) resumoSellers[n].quedas++;
                  else if (N_TIPO_RGB.includes(vInd)) resumoSellers[n].rgb++;
                  resumoSellers[n].total++;
                });

                const sortedUsers = Object.entries(resumoSellers).sort((a, b) => b[1].total - a[1].total);

                if (sortedUsers.length === 0) {
                  return <p className="text-center text-muted-foreground/50 py-10 font-bold uppercase tracking-widest text-xs">Nenhum Usuário Vinculado.</p>;
                }

                return sortedUsers.map(([nome, d], idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setFiltroAvaliadorDetalhe(nome);
                    }}
                    className="bg-white dark:bg-[#0F172A]/80 border dark:border-white/5 shadow-sm rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center hover:border-[#38BDF8]/50 transition-colors cursor-pointer group hover:bg-[#38BDF8]/5 dark:hover:bg-[#38BDF8]/10 relative"
                  >
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38BDF8]/20 group-hover:text-[#38BDF8] transition-colors hidden sm:block" />

                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="min-w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center font-black text-xs text-slate-500 dark:text-white/40 uppercase">
                        {nome.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight leading-tight">{nome}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{d.total} Avaliações Realizadas</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto overflow-x-auto custom-scrollbar mt-2 sm:mt-0">
                      {d.fds > 0 && <span className="bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20 text-[9px] font-black px-2 py-1 rounded">FDS: {d.fds}</span>}
                      {d.coaching > 0 && <span className="bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-[9px] font-black px-2 py-1 rounded">COACHING: {d.coaching}</span>}
                      {d.rgb > 0 && <span className="bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 text-[9px] font-black px-2 py-1 rounded">RGB: {d.rgb}</span>}
                      {d.compass > 0 && <span className="bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20 text-[9px] font-black px-2 py-1 rounded">COMPASS: {d.compass}</span>}
                      {d.quedas > 0 && <span className="bg-[#F43F5E]/10 text-[#F43F5E] border border-[#F43F5E]/20 text-[9px] font-black px-2 py-1 rounded">QUEDAS: {d.quedas}</span>}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhamento por Avaliador Específico (Origem: Pirâmide) */}
      <Dialog open={!!filtroAvaliadorDetalhe} onOpenChange={(open) => !open && setFiltroAvaliadorDetalhe(null)}>
        <DialogContent className="sm:max-w-[650px] w-[95vw] max-h-[85vh] overflow-y-auto p-0 custom-scrollbar bg-background dark:bg-[#0D121F] border border-border dark:border-white/10 shadow-2xl">
          <div className="sticky top-0 z-10 bg-background/90 dark:bg-[#0D121F]/90 backdrop-blur-md p-6 border-b border-border dark:border-white/5 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setFiltroAvaliadorDetalhe(null)} className="h-10 w-10 hover:bg-muted dark:hover:bg-white/5 rounded-xl border border-border dark:border-white/5 shrink-0">
              <ArrowLeft className="w-5 h-5 text-foreground dark:text-white" />
            </Button>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-[0.1em] text-[#38BDF8] line-clamp-1">{filtroAvaliadorDetalhe}</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground dark:text-white/40 mt-1 uppercase tracking-widest line-clamp-1">
                Todas as avaliações realizadas por este gestor
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-3">
            {(() => {
              if (!filtroAvaliadorDetalhe) return null;

              const mFiltradas = filtradas.filter(
                v => (v.avaliador?.toUpperCase() || "NÃO IDENTIFICADO") === filtroAvaliadorDetalhe
              );

              if (mFiltradas.length === 0) return <p className="text-sm font-bold italic opacity-30 text-center py-20">Sem histórico encontrado.</p>;

              return mFiltradas.map((v, i) => (
                <Card key={v.id || i} onClick={() => setSelectedVisita(v)} className="bg-card dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 border-border dark:border-white/5 hover:border-[#38BDF8]/30 transition-all cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-muted dark:bg-[#38BDF8]/10 flex items-center justify-center text-foreground dark:text-[#38BDF8] font-black border border-border dark:border-[#38BDF8]/20 shrink-0">
                        {v.avaliador.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-black h-4 border-[#38BDF8] text-[#38BDF8] bg-[#38BDF8]/5 shrink-0 px-1.5 font-mono">
                            {v.codigo_pdv}
                          </Badge>
                          <Badge variant="secondary" className="text-[8px] font-black h-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 border-none px-1.5 uppercase flex items-center gap-1 shrink-0">
                            <Trophy className="w-2 h-2 text-[#38BDF8]" />
                            {v.indicador_avaliado}
                          </Badge>
                          <p className="font-bold text-sm text-foreground truncate group-hover:text-[#38BDF8] transition-colors">{v.nome_fantasia_pdv}</p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase mt-1">
                          <span className="text-[#38BDF8]/70">Score: {v.pontuacao_total || '--'}/100</span>
                          <span>•</span>
                          <span>{v.data_visita}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-[#38BDF8] transition-all" />
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>
      {/* FOOTER - Versão do Sistema */}
      <div className="flex flex-col items-center justify-center pt-10 pb-4 opacity-30 select-none w-full">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Sistema Gestão de Rota</p>
        <p className="text-[8px] font-bold text-muted-foreground mt-1">Versão 1.2.9 • Build {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
};

export default Dashboard;
