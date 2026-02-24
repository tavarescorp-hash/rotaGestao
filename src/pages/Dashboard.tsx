import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buscarVisitas, excluirVisita, type Visita } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2, Filter, Calendar, MapPin, ClipboardList, CheckCircle2, ChevronRight, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [unidade, setUnidade] = useState("todas");
  const [indicadorFiltro, setIndicadorFiltro] = useState("todos");
  const [cargoFiltro, setCargoFiltro] = useState("todos");
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);

  const carregarVisitas = async () => {
    setLoading(true);
    const data = await buscarVisitas();
    setVisitas(data);
    setLoading(false);
  };

  useEffect(() => {
    carregarVisitas();
  }, []);

  const minhasVisitas = useMemo(() => {
    return visitas.filter(v => v.avaliador === user?.name);
  }, [visitas, user?.name]);

  const estatisticasMes = useMemo(() => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const visitasMes = minhasVisitas.filter((v) => {
      const dataVisita = new Date(v.data_visita);
      return dataVisita.getFullYear() === anoAtual && dataVisita.getMonth() === mesAtual;
    });

    const qtdeFDS = visitasMes.filter(v => v.indicador_avaliado === 'FDS').length;
    const qtdeRGB = visitasMes.filter(v => v.indicador_avaliado?.includes('RGB')).length;

    // Coaching detalhado
    const coachingVisitas = visitasMes.filter(v => v.indicador_avaliado?.includes('COACHING'));
    const qtdeCoaching = coachingVisitas.length;

    // Calculando base de vendedores e detalhes de progresso por vendedor
    const mapaVendedores = new Map<string, number>();

    // Identifica todos os vendedores que o avaliador logado tem histórico
    minhasVisitas.forEach(v => {
      if (v.nome_vendedor && !mapaVendedores.has(v.nome_vendedor)) {
        mapaVendedores.set(v.nome_vendedor, 0); // inicializa com 0
      }
    });

    const vendedoresUnicos = mapaVendedores.size;

    // Contabiliza o coaching feito no mês atual para cada vendedor
    coachingVisitas.forEach(v => {
      if (v.nome_vendedor) {
        mapaVendedores.set(v.nome_vendedor, (mapaVendedores.get(v.nome_vendedor) || 0) + 1);
      }
    });

    const detalhesCoaching = Array.from(mapaVendedores.entries()).map(([nome, atual]) => ({
      nome,
      atual,
      meta: 5 // Meta fixa por vendedor
    })).sort((a, b) => b.atual - a.atual); // Ordena pelos que tem mais visitas

    const META_FDS = 10;
    const META_RGB = 20;
    const META_COACHING = Math.max(1, vendedoresUnicos) * 5; // 5 de cada vendedor

    // Calcular dias restantes
    const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
    const difTempo = ultimoDia.getTime() - hoje.getTime();
    const dias = Math.ceil(difTempo / (1000 * 3600 * 24));

    return {
      qtdeFDS, qtdeRGB, qtdeCoaching,
      META_FDS, META_RGB, META_COACHING,
      baseVendedores: vendedoresUnicos,
      detalhesCoaching,
      diasRestantes: dias
    };
  }, [minhasVisitas]);

  const indicadoresUnicos = useMemo(() => {
    const unicos = Array.from(new Set(minhasVisitas.map(v => v.indicador_avaliado).filter(Boolean) as string[]));
    return unicos.sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const cargosUnicos = useMemo(() => {
    const unicos = Array.from(new Set(minhasVisitas.map(v => v.cargo).filter(Boolean) as string[]));
    return unicos.sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const filtradas = useMemo(() => {
    return minhasVisitas.filter((v) => {
      if (dataInicio && v.data_visita < dataInicio) return false;
      if (dataFim && v.data_visita > dataFim) return false;
      if (unidade !== "todas" && v.unidade !== unidade) return false;
      if (indicadorFiltro !== "todos" && v.indicador_avaliado !== indicadorFiltro) return false;
      if (cargoFiltro !== "todos" && v.cargo !== cargoFiltro) return false;
      return true;
    });
  }, [minhasVisitas, dataInicio, dataFim, unidade, indicadorFiltro, cargoFiltro]);

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
          <Button
            onClick={() => navigate("/nova-visita")}
            className="shadow-md hover:shadow-primary/20 transition-all duration-300 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Visita
          </Button>
        </div>
      </div>

      {/* User Info Highlight Card */}
      {user && (
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
                  {user.indicadores && user.indicadores.length > 0 ? (
                    user.indicadores.map((ind, i) => (
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
      {user && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Metas do Mês Atual
            </h3>
            <span className="text-[10px] sm:text-xs font-bold text-amber-500 bg-amber-500/10 px-2 sm:px-3 py-1 rounded-full flex items-center border border-amber-500/20 shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Faltam {estatisticasMes.diasRestantes} dias
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Meta FDS */}
            <Card className="glass-card bg-card/40 border-primary/10 overflow-hidden relative shadow-sm">
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

            {/* Meta COACHING */}
            <Card className="glass-card bg-card/40 border-primary/10 overflow-hidden relative shadow-sm flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex justify-between items-end mb-1">
                    <div>
                      <h3 className="text-[10px] font-bold text-muted-foreground flex gap-1 uppercase tracking-widest">
                        COACHING <span className="opacity-70 normal-case tracking-normal border border-border/50 px-1 rounded">({estatisticasMes.baseVendedores} Vnds)</span>
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
                  <div className="space-y-3.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
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
                        Nenhum vendedor encontrado no seu histórico de visitas.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meta RGB */}
            <Card className="glass-card bg-card/40 border-primary/10 overflow-hidden relative shadow-sm">
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
                        {Math.round((estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden shadow-inner border border-black/5 dark:border-white/5">
                    <div
                      className="h-full bg-primary transition-all duration-1000 ease-out rounded-full relative overflow-hidden"
                      style={{ width: `${Math.min((estatisticasMes.qtdeRGB / estatisticasMes.META_RGB) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      )}



      <div className="space-y-6">
        {/* Horizontal Filters Bar */}
        <div className="bg-card/40 border border-border/40 p-3 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Filtros de Pesquisa</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-background/50 h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-background/50 h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas Unidades</SelectItem>
                  <SelectItem value="Campos">Polo Campos</SelectItem>
                  <SelectItem value="Macaé">Polo Macaé</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Indicador</Label>
              <Select value={indicadorFiltro} onValueChange={setIndicadorFiltro}>
                <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Todos os indicadores" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Indicadores</SelectItem>
                  {indicadoresUnicos.map(i => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Visit List Content Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Registros Recentes</h3>
            <span className="text-xs font-bold text-muted-foreground">{filtradas.length} encontrados</span>
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
              {filtradas.map((v, i) => (
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
                              {new Date(v.data_visita).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded bg-background/50 border border-border/50">
                              <MapPin className="w-3.5 h-3.5 text-primary" />
                              {v.unidade}
                            </span>
                            <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded bg-background/50 border border-border/50 text-foreground">
                              {v.avaliador} • {v.cargo}
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

      {/* Dialog para Detalhes da Visita */}
      <Dialog open={!!selectedVisita} onOpenChange={(open) => !open && setSelectedVisita(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-primary/20 bg-background/95 backdrop-blur-xl">
          <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-primary" />
                  Detalhes do Registro
                </DialogTitle>
                <DialogDescription className="mt-1 font-medium">
                  {selectedVisita && new Date(selectedVisita.data_visita).toLocaleDateString('pt-BR')} • {selectedVisita?.unidade}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {selectedVisita && (
              <div className="space-y-6 pb-6">

                <div className="bg-card border border-border/50 p-6 rounded-xl shadow-sm space-y-5">

                  {/* Linha 1: 1. Data, 2. Unidade, 3. Avaliador, 4. Cargo */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-border/30">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Data da Visita</span>
                      <span className="text-sm font-bold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(selectedVisita.data_visita).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Unidade</span>
                      <span className="text-sm font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {selectedVisita.unidade}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Avaliador</span>
                      <span className="text-sm font-semibold">{selectedVisita.avaliador}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Cargo</span>
                      <Badge variant="secondary" className="text-[10px] font-bold py-0.5">{selectedVisita.cargo}</Badge>
                    </div>
                  </div>

                  {/* Linha 2: 5. Vendedor, 6. Codigo, 7. Fantasia, 8. Potencial */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4 border-b border-border/30">
                    <div className="col-span-2 lg:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Vendedor Rep.</span>
                      <span className="text-sm font-semibold">
                        {selectedVisita.codigo_vendedor ? `${selectedVisita.codigo_vendedor} - ${selectedVisita.nome_vendedor}` : selectedVisita.nome_vendedor || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Código PDV</span>
                      <span className="text-sm font-mono font-bold bg-muted/50 px-2 py-0.5 rounded">{selectedVisita.codigo_pdv}</span>
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Nome Fantasia do PDV</span>
                      <span className="text-sm font-bold truncate block" title={selectedVisita.nome_fantasia_pdv}>
                        {selectedVisita.nome_fantasia_pdv}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Potencial Cliente</span>
                      <span className="text-sm font-semibold">{selectedVisita.potencial_cliente || "-"}</span>
                    </div>
                  </div>

                  {/* Linha 3: 9. Canal Cad., 10. Canal Identificado, 11. Indicador Avaliado */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Canal Cadastrado</span>
                      <span className="text-sm font-semibold">{selectedVisita.canal_cadastrado || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Canal Identificado</span>
                      <span className="text-sm font-semibold">{selectedVisita.canal_identificado || selectedVisita.canal_cadastrado || "-"}</span>
                    </div>
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 -mt-2">
                      <span className="text-[10px] uppercase font-bold text-primary block mb-1">Indicador Avaliado</span>
                      <Badge className="bg-primary text-primary-foreground font-bold shadow-sm whitespace-normal text-center w-full block">
                        {selectedVisita.indicador_avaliado}
                      </Badge>
                    </div>
                  </div>

                </div>

                {/* Dinâmico por Tipo de Visita */}
                <div className="space-y-6 pt-4 border-t border-border/50">

                  {/* FDS ou RGB - Produtos e Execução */}
                  {(selectedVisita.indicador_avaliado === "FDS" || selectedVisita.indicador_avaliado?.includes("RGB")) && (
                    <div className="space-y-4">

                      {selectedVisita.indicador_avaliado?.includes("RGB") && (
                        <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl space-y-3 mb-6">
                          <h4 className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                            📋 Questionário RGB
                          </h4>
                          {selectedVisita.rgb_foco_visita && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground block">Foco da visita</span>
                              <span className="text-sm font-semibold">{selectedVisita.rgb_foco_visita}</span>
                            </div>
                          )}
                          {selectedVisita.rgb_comprando_outras && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground block">Comprando de outra fonte?</span>
                              <span className="text-sm font-semibold">{selectedVisita.rgb_comprando_outras}</span>
                            </div>
                          )}
                          {selectedVisita.rgb_ttc_adequado && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground block">TTC adequado?</span>
                              <span className="text-sm font-semibold">{selectedVisita.rgb_ttc_adequado}</span>
                            </div>
                          )}
                          {selectedVisita.rgb_acao_concorrencia && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground block">Ação da concorrência?</span>
                              <span className="text-sm font-semibold">{selectedVisita.rgb_acao_concorrencia}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Mix Padrão Localizado
                        </h4>
                        <Badge variant="outline" className="font-bold border-primary shadow-sm">
                          Score: {selectedVisita.pontuacao_total} pts
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-card border border-border/40">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-3 block">Produtos ({selectedVisita.produtos_selecionados ? selectedVisita.produtos_selecionados.split(";").length : 0})</span>
                          {selectedVisita.produtos_selecionados ? (
                            <ul className="space-y-1.5 text-sm">
                              {selectedVisita.produtos_selecionados.split("; ").map((p, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-foreground/80 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                  {p}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-muted-foreground font-medium italic">Nenhum produto listado</span>
                          )}
                        </div>

                        <div className="p-4 rounded-xl bg-card border border-border/40">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-3 block">Execução ({selectedVisita.execucao_selecionada ? selectedVisita.execucao_selecionada.split(";").length : 0})</span>
                          {selectedVisita.execucao_selecionada ? (
                            <ul className="space-y-1.5 text-sm">
                              {selectedVisita.execucao_selecionada.split("; ").map((e, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-foreground/80 font-medium">
                                  <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/30 mt-1.5 shrink-0" />
                                  {e}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-muted-foreground font-medium italic">Nenhuma execução listada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* COACHING */}
                  {selectedVisita.indicador_avaliado === "COACHING ROTA BASICA COM VENDEDOR" && (
                    <div className="space-y-6 pt-2">
                      <div>
                        <h4 className="text-sm font-extrabold text-blue-500 mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Passos da Rotina Básica Realizados
                        </h4>
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                          {selectedVisita.passos_coaching ? (
                            <ul className="space-y-2 text-sm">
                              {selectedVisita.passos_coaching.split("; ").map((p, idx) => (
                                <li key={idx} className="flex items-start gap-2 font-semibold text-foreground/80">
                                  {p.includes("Não realizou") ? <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />}
                                  {p}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Nada computado</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-green-500">Pontos Fortes</span>
                          <div className="p-4 text-sm font-medium bg-green-500/5 rounded-xl border border-green-500/20 min-h-[100px] whitespace-pre-wrap">
                            {selectedVisita.pontos_fortes || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-destructive">Pontos a Desenvolver</span>
                          <div className="p-4 text-sm font-medium bg-destructive/5 rounded-xl border border-destructive/20 min-h-[100px] whitespace-pre-wrap">
                            {selectedVisita.pontos_desenvolver || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Observações Gerais */}
                {selectedVisita.observacoes && (
                  <div className="pt-6 border-t border-border/50">
                    <h4 className="text-sm font-extrabold text-foreground mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-400" />
                      Observações Finais / Plano de Ação
                    </h4>
                    <div className="p-4 rounded-xl bg-orange-400/5 border border-orange-400/20 text-sm font-medium text-foreground/80 italic leading-relaxed whitespace-pre-wrap">
                      "{selectedVisita.observacoes}"
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
};

export default Dashboard;
