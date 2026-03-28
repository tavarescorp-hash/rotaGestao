import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buscarVisitas, excluirVisita, buscarVendedoresAtivos, type Visita, type VendedorAtivo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, RefreshCw, Trash2, Filter, Calendar, MapPin, ClipboardList, CheckCircle2, ChevronRight, AlertCircle, User, Users, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getIndicadoresPorNivel, INDICADORES_COMPASS_LOCKED, INDICADORES_QUEDAS_LOCKED, INDICADORES_TIPO_RGB, REQUER_COACHING } from "@/lib/roles";
import { useDashboardMetrics } from "@/features/relatorios/hooks/useDashboardMetrics";
import { VisitaModalDialog } from "@/features/relatorios/components/VisitaModalDialog";

const Dashboard = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [vendedoresBaseReal, setVendedoresBaseReal] = useState<VendedorAtivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtroIndicadorModal, setFiltroIndicadorModal] = useState<string | null>(null);


  const {
    dateRange, setDateRange,
    unidade, setUnidade,
    indicadorFiltro, setIndicadorFiltro,
    cargoFiltro, setCargoFiltro,
    activeTab, setActiveTab,
    avaliadorFiltro, setAvaliadorFiltro,
    usuarioFiltro, setUsuarioFiltro,
    isAnalista, isGerenteComercial,
    filtradas, visitasHierarchy,
    estatisticasMes, dadosGraficoAnalista, cargosUnicos, unidadesUnicas
  } = useDashboardMetrics(visitas, vendedoresBaseReal, user);


  const carregarVisitas = async () => {
    setLoading(true);
    const [dataVisitas, dataVendedores] = await Promise.all([
      buscarVisitas(user),
      buscarVendedoresAtivos(user)
    ]);
    setVisitas(dataVisitas);
    setVendedoresBaseReal(dataVendedores);
    setLoading(false);
  };

  useEffect(() => {
    carregarVisitas();
  }, []);

  useEffect(() => {
    if (user?.unidade && user.unidade !== "todas" && unidade === "todas") {
      setUnidade(user.unidade);
    }
  }, [user?.unidade, user?.nivel, unidade, setUnidade]);

  const handleExcluir = async (id: string) => {
    const result = await excluirVisita(id);
    toast({
      title: result.success ? "Sucesso" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) carregarVisitas();
  };



  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-border/40">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground font-semibold">Acompanhe e gerencie as visitas da Rota Unibeer.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={carregarVisitas}
            disabled={loading}
            className="border-border/50 hover:bg-accent/50 hover:text-accent-foreground transition-all duration-300 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
          {!isAnalista && (
            <Button
              onClick={() => navigate("/nova-visita")}
              className="shadow-md hover:shadow-primary/20 transition-all duration-300 active:scale-95"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nova Visita
            </Button>
          )}
        </div>
      </div>

      {/* User Info Highlight Card */}
      {user && (!isAnalista || user?.nivel === 'Niv1' || user?.nivel === 'Niv2') && (
        <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 shadow-lg shadow-primary/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
          <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-inner">
                  <ClipboardList className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="default" className="text-xs px-2.5 py-0.5 bg-primary/90 text-primary-foreground font-semibold shadow-sm">
                      {user.funcao || "Sem função"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs px-2.5 py-0.5 bg-secondary/50 font-medium">
                      Unidade: <span className="font-bold ml-1">{user.unidade || "Não definida"}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex-1 md:max-w-md lg:max-w-xl bg-black/20 dark:bg-black/40 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-muted-foreground mb-2 font-bold uppercase tracking-widest flex items-center gap-2">
                  <Filter className="w-3 h-3" />
                  Métricas de Avaliação Vinculadas
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {getIndicadoresPorNivel(user.nivel) && getIndicadoresPorNivel(user.nivel).length > 0 ? (
                    getIndicadoresPorNivel(user.nivel).map((ind, i) => (
                      <span key={i} className="bg-background/80 backdrop-blur-sm border border-border/50 px-2.5 py-1 rounded-md text-foreground/90 font-medium shadow-sm">
                        {ind}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground/60 italic px-2">Nenhum indicador mapeado para este cargo.</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metas e Progresso Mensal */}
      {user && (!isAnalista || user?.nivel === 'Niv1' || user?.nivel === 'Niv2') && (
        <>
          <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-inner">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-primary leading-tight">
                  {(user?.nivel === 'Niv1' || user?.nivel === 'Niv2') ? "Performance da Gestão" : "Meus Indicadores"}
                </h2>
                <p className="text-xs text-muted-foreground font-semibold">Toda a sua performance detalhada do período.</p>
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-4 items-start ${(user?.nivel === 'Niv1' || user?.nivel === 'Niv2') ? 'lg:grid-cols-1' : 'lg:grid-cols-[1fr_2fr]'}`}>

            {/* Coluna 1 da Direita/Esquerda - FDS, RGB, Compass, Quedas (Empilhados ou Grid) */}
            <div className={`grid gap-4 ${(user?.nivel === 'Niv1' || user?.nivel === 'Niv2') ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'flex flex-col'}`}>
              {/* Meta FDS */}
              {(user?.nivel === 'Niv1' || user?.nivel === 'Niv2' || user?.nivel === 'Niv3' || user?.nivel === 'Niv4') && (
                <Card 
                  onClick={() => setFiltroIndicadorModal('FDS')}
                  className="glass-card bg-card/40 border-primary/10 hover:border-primary/50 hover:bg-card/60 cursor-pointer overflow-hidden relative shadow-sm h-full w-full transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-end mb-1">
                        <div>
                          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">FDS</h3>
                          <p className="text-xl font-black text-foreground mt-1">
                            {estatisticasMes.qtdeFDS} <span className="text-sm font-semibold text-muted-foreground uppercase">/ {estatisticasMes.META_FDS}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {Math.round((estatisticasMes.qtdeFDS / estatisticasMes.META_FDS) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                        <div
                          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                          style={{ width: `${Math.min((estatisticasMes.qtdeFDS / estatisticasMes.META_FDS) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meta RGB Padrão */}
              {(user?.nivel === 'Niv1' || user?.nivel === 'Niv2' || user?.nivel === 'Niv3' || user?.nivel === 'Niv4') && (
                <Card 
                  onClick={() => setFiltroIndicadorModal('RGB')}
                  className="glass-card bg-card/40 border-primary/10 hover:border-primary/50 hover:bg-card/60 cursor-pointer overflow-hidden relative shadow-sm w-full transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-end mb-1">
                        <div>
                          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RGB</h3>
                          <p className="text-xl font-black text-foreground mt-1">
                            {estatisticasMes.qtdeRGB} <span className="text-sm font-semibold text-muted-foreground uppercase">/ {estatisticasMes.META_RGB}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
                            {Math.round((estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) * 100) || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                        <div
                          className="h-full bg-primary transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                          style={{ width: `${Math.min((estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) * 100, 100) || 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meta Maiores Potenciais Compass (Apenas Diretor) */}
              {user?.nivel === 'Niv1' && (
                <Card 
                  onClick={() => setFiltroIndicadorModal('COMPASS')}
                  className="glass-card bg-card/40 border-blue-500/20 hover:border-blue-500/50 hover:bg-blue-500/10 cursor-pointer overflow-hidden relative shadow-sm w-full transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-end mb-1">
                        <div>
                          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Maiores potenciais base <br/> compass em RGB BAR</h3>
                          <p className="text-xl font-black text-foreground mt-1">
                            {estatisticasMes.qtdeCompass} <span className="text-sm font-semibold text-muted-foreground uppercase">/ {estatisticasMes.META_COMPASS}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                            {Math.round((estatisticasMes.qtdeCompass / estatisticasMes.META_COMPASS) * 100) || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                        <div
                          className="h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                          style={{ width: `${Math.min((estatisticasMes.qtdeCompass / estatisticasMes.META_COMPASS) * 100, 100) || 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meta Maiores Quedas */}
              {(user?.nivel === 'Niv1' || user?.nivel === 'Niv2') && (
                <Card 
                  onClick={() => setFiltroIndicadorModal('QUEDAS')}
                  className="glass-card bg-card/40 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer overflow-hidden relative shadow-sm w-full transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-end mb-1">
                        <div>
                          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">Maiores quedas <br/> RGB mês anterior</h3>
                          <p className="text-xl font-black text-foreground mt-1">
                            {estatisticasMes.qtdeQuedas} <span className="text-sm font-semibold text-muted-foreground uppercase">/ {estatisticasMes.META_QUEDAS}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                            {Math.round((estatisticasMes.qtdeQuedas / estatisticasMes.META_QUEDAS) * 100) || 0}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                        <div
                          className="h-full bg-amber-500 transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                          style={{ width: `${Math.min((estatisticasMes.qtdeQuedas / estatisticasMes.META_QUEDAS) * 100, 100) || 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Meta COACHING (Coluna Larga Esticada) */}
            {(user?.nivel === 'Niv1' || user?.nivel === 'Niv2' || user?.nivel === 'Niv3' || user?.nivel === 'Niv4') && (
              <Card 
                onClick={() => setFiltroIndicadorModal('COACHING')}
                className="glass-card bg-card/40 border-primary/10 hover:border-primary/50 hover:bg-card/60 cursor-pointer overflow-hidden relative shadow-sm flex flex-col h-full min-h-[220px] transition-all"
              >
                <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex justify-between items-end mb-1">
                    <div>
                      <h3 className="text-[10px] font-bold text-muted-foreground flex gap-1 uppercase tracking-widest">
                        COACHING <span className="opacity-70 normal-case tracking-normal border border-border/50 px-1 rounded">({estatisticasMes.vendedoresAvaliados} Vnds)</span>
                      </h3>
                      <p className="text-xl font-black text-foreground mt-1">
                        {estatisticasMes.qtdeCoaching} <span className="text-sm font-semibold text-muted-foreground uppercase">/ {estatisticasMes.META_COACHING}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {Math.round((estatisticasMes.qtdeCoaching / estatisticasMes.META_COACHING) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                    <div
                      className="h-full bg-primary transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                      style={{ width: `${Math.min((estatisticasMes.qtdeCoaching / estatisticasMes.META_COACHING) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Lista de Vendedores */}
                <div className="pt-3 flex-1 flex flex-col border-t border-border/30">
                  <h4 className="text-[9px] font-bold text-muted-foreground flex justify-between uppercase tracking-widest mb-3">
                    <span>Vendedor</span>
                    <span>Realizado</span>
                  </h4>
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {estatisticasMes.detalhesCoaching.map((vend, idx) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-semibold text-foreground/90 truncate mr-2" title={vend.nome}>
                            {vend.nome}
                          </span>
                          <span className="font-bold text-muted-foreground shrink-0">
                            {vend.atual} / {vend.meta}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-secondary/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 ease-out rounded-full ${vend.atual >= vend.meta ? 'bg-green-500' : 'bg-primary/70'}`}
                            style={{ width: `${Math.min((vend.atual / vend.meta) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {estatisticasMes.detalhesCoaching.length === 0 && (
                      <p className="text-[10px] text-muted-foreground italic text-center py-2">
                        Nenhum vendedor encontrado ou configurado sob sua hierarquia.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            </div>
          </div>


          <Dialog open={!!filtroIndicadorModal} onOpenChange={(open) => !open && setFiltroIndicadorModal(null)}>
            <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-background/95 backdrop-blur-md border-primary/20">
              <DialogHeader className="mb-4">
                <div className="flex items-start sm:items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setFiltroIndicadorModal(null)} className="h-8 w-8 hover:bg-secondary/50 shrink-0">
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </Button>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      Avaliações: {filtroIndicadorModal}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm font-semibold text-muted-foreground mt-0.5">
                      Tickets de avaliação registrados no período com esta métrica.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3">
                {(() => {
                  const normalizeInd = (s?: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase() : "";
                  const listNormalized = (arr: string[]) => arr.map(id => normalizeInd(id));

                  const N_COMPASS = listNormalized(INDICADORES_COMPASS_LOCKED);
                  const N_QUEDAS = listNormalized(INDICADORES_QUEDAS_LOCKED);
                  const N_TIPO_RGB = listNormalized(INDICADORES_TIPO_RGB);
                  const N_COACHING = listNormalized(REQUER_COACHING);

                  let filtradasDoModal = [];
                  const fVal = filtroIndicadorModal || "";
                  
                  if (fVal === 'FDS') {
                    filtradasDoModal = filtradas.filter(v => normalizeInd(v.indicador_avaliado) === 'FDS');
                  } else if (fVal === 'COMPASS') {
                    filtradasDoModal = filtradas.filter(v => {
                      const vInd = normalizeInd(v.indicador_avaliado);
                      return vInd && N_COMPASS.includes(vInd);
                    });
                  } else if (fVal === 'QUEDAS') {
                    filtradasDoModal = filtradas.filter(v => {
                      const vInd = normalizeInd(v.indicador_avaliado);
                      return vInd && N_QUEDAS.includes(vInd);
                    });
                  } else if (fVal === 'COACHING') {
                    filtradasDoModal = filtradas.filter(v => {
                      const vInd = normalizeInd(v.indicador_avaliado);
                      return vInd && N_COACHING.includes(vInd);
                    });
                  } else if (fVal === 'RGB') {
                    filtradasDoModal = filtradas.filter(v => {
                      const vInd = normalizeInd(v.indicador_avaliado);
                      return vInd && N_TIPO_RGB.includes(vInd);
                    });
                  }

                  if (filtradasDoModal.length === 0) {
                    return (
                      <div className="text-center py-10 bg-secondary/10 rounded-xl border border-dashed border-border/50 shadow-inner">
                        <ClipboardList className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-semibold text-muted-foreground">Nenhuma visita de {filtroIndicadorModal} encontrada no período.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid gap-3">
                      {filtradasDoModal.map((v, i) => (
                        <Card 
                          key={v.id || i} 
                          onClick={() => setSelectedVisita(v)}
                          className="group glass-card bg-card/60 hover:bg-card hover:shadow-md cursor-pointer transition-all duration-300 border-border/40 hover:border-primary/40"
                        >
                          <CardContent className="p-4 flex items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground uppercase tracking-wider">{v.avaliador || "Avaliador não informado"}</span>
                                {v.coaching_realizado && (
                                  <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded">
                                    Coaching
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {v.data_visita ? format(new Date(v.data_visita), "dd/MM/yy") : "--/--/--"}</span>
                                <span className="text-border/50">•</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {(v.pdv_nome || "PDV Desconhecido").split(' ').slice(0, 3).join(' ')}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}





      <div className="space-y-6">
        {/* Horizontal Filters Bar (Novo Layout) */}
        <div className="bg-card/40 border border-border/40 p-3 sm:p-6 rounded-xl shadow-sm space-y-4">
          
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full justify-between">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest hidden md:block">Metas e Performance</h2>
            
            <div className="flex gap-2 w-full md:w-auto overflow-hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[160px] sm:w-[200px] h-10 justify-start text-left font-normal bg-background/60 flex-shrink-0",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd/MM/yy")} -{" "}
                            {format(dateRange.to, "dd/MM/yy")}
                          </>
                        ) : (
                          format(dateRange.from, "dd/MM/yy")
                        )
                      ) : (
                        "Selecione uma data"
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                    }}
                    numberOfMonths={1}
                    locale={ptBR}
                  />
                  {(dateRange?.from || dateRange?.to) && (
                    <div className="p-3 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => { setDateRange(undefined); }}>
                        Limpar Datas
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Button 
                variant={showAdvancedFilters ? "secondary" : "outline"} 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="h-10 px-3 bg-background/60 flex-1 whitespace-nowrap"
              >
                <Settings2 className="h-4 w-4 sm:mr-2 shrink-0" />
                <span className="hidden sm:inline">Filtros Avançados</span>
                <span className="sm:hidden inline ml-2 text-xs">Filtros</span>
              </Button>
            </div>
          </div>

          {/* Collapsible: Gaveta Oculta de Filtros */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unidade</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Todas as unidades" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Unidades</SelectItem>
                    {unidadesUnicas.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!(user?.nivel === 'Niv3' && activeTab === 'unidade') ? (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Função (Cargo)</Label>
                  <Select value={cargoFiltro} onValueChange={setCargoFiltro}>
                    <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Todas as funções" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas as Funções</SelectItem>
                      {cargosUnicos.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Indicador</Label>
                <Select value={indicadorFiltro} onValueChange={setIndicadorFiltro}>
                  <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Todos os indicadores" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Indicadores</SelectItem>
                    {user?.nivel !== 'Niv1' && <SelectItem value="FDS">FDS</SelectItem>}
                    <SelectItem value="RGB">Foco Mês (RGB)</SelectItem>
                    {user?.nivel !== 'Niv1' && <SelectItem value="COACHING">Coaching</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

            </div>
          )}
        </div>

        {/* Visit List Content Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Registros Recentes</h3>
            <span className="text-xs font-bold text-muted-foreground">{filtradas.length} encontrados (Exibindo últimos 5)</span>
          </div>

          {filtradas.length === 0 ? (
            <Card className="glass-card bg-card/20 border-dashed border-2">
              <CardContent className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Nenhum registro encontrado</h3>
                <p className="text-sm text-foreground/80 font-semibold max-w-sm mb-6">Modifique os filtros ao lado ou registre uma nova visita para popular esta lista.</p>
                <Button onClick={() => navigate("/nova-visita")} variant="secondary" className="shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Registro
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filtradas.slice(0, 5).map((v, i) => (
                <Card key={v.id || i} className="group glass-card bg-card/40 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                      {/* Avatar / Icon & Main Data */}
                      <div className="flex items-start sm:items-center gap-4 flex-1">
                        <div className="hidden sm:flex w-10 h-10 rounded-full bg-secondary/20 items-center justify-center border border-secondary/30 shrink-0">
                          <span className="text-sm font-bold text-secondary-foreground">
                            {v.avaliador.charAt(0).toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-base text-foreground truncate">{v.avaliador}</span>
                            <span className="text-xs font-bold text-muted-foreground px-1.5 py-0.5 rounded-md bg-secondary/10 border border-secondary/20">
                              {v.cargo}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded bg-background/50 border border-border/50">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                              {(() => {
                                const [a, m, d] = (v.data_visita || "").split("-");
                                return a && m && d ? `${d}/${m}/${a}` : v.data_visita;
                              })()}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded bg-background/50 border border-border/50">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {v.unidade}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded bg-background/50 border border-border/50 text-foreground">
                              <User className="w-3.5 h-3.5 text-primary" />
                              {v.nome_vendedor || 'Vendedor não informado'}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded bg-background/50 border border-border/50">
                              Cód: {v.codigo_pdv}
                            </span>

                            {/* Badges para marcadores importantes */}
                            <div className="flex flex-wrap items-center gap-1.5 ml-auto sm:ml-2">
                              {/* Remove old boolean indicators, only show the main indicator_avaliado badge */}
                              {v.indicador_avaliado && (
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] uppercase font-bold 
                                    ${v.indicador_avaliado === 'FDS' ? 'text-green-500 border-green-500/30 bg-green-500/10' : ''}
                                    ${v.indicador_avaliado === 'COACHING ROTA BASICA COM VENDEDOR' ? 'text-blue-500 border-blue-500/30 bg-blue-500/10' : ''}
                                    ${v.indicador_avaliado?.includes('RGB') ? 'text-purple-500 border-purple-500/30 bg-purple-500/10' : ''}
                                    ${v.indicador_avaliado === 'COMPASS / MAIORES POTÊNCIAS' ? 'text-orange-500 border-orange-500/30 bg-orange-500/10' : ''}
                                  `}
                                >
                                  {v.indicador_avaliado === 'COACHING ROTA BASICA COM VENDEDOR' ? 'COACHING' : v.indicador_avaliado}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-0 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1 sm:flex-none font-semibold hover:shadow-md transition-all active:scale-95"
                          onClick={() => setSelectedVisita(v)}
                        >
                          Ver Tudo
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>

                        {isAdmin && v.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto text-destructive border-destructive/20 hover:text-destructive-foreground hover:bg-destructive shadow-sm"
                            onClick={() => handleExcluir(v.id!)}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline">Excluir</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <VisitaModalDialog 
        selectedVisita={selectedVisita} 
        onClose={() => setSelectedVisita(null)} 
      />
    </div>
  );
};

export default Dashboard;
