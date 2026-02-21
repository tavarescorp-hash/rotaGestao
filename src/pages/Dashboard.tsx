import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buscarVisitas, excluirVisita, type Visita } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2, Filter, Calendar, MapPin, ClipboardList } from "lucide-react";
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
  const [avaliador, setAvaliador] = useState("");

  const carregarVisitas = async () => {
    setLoading(true);
    const data = await buscarVisitas();
    setVisitas(data);
    setLoading(false);
  };

  useEffect(() => {
    carregarVisitas();
  }, []);

  const filtradas = useMemo(() => {
    return visitas.filter((v) => {
      if (dataInicio && v.data_visita < dataInicio) return false;
      if (dataFim && v.data_visita > dataFim) return false;
      if (unidade !== "todas" && v.unidade !== unidade) return false;
      if (avaliador && !v.avaliador.toLowerCase().includes(avaliador.toLowerCase())) return false;
      return true;
    });
  }, [visitas, dataInicio, dataFim, unidade, avaliador]);

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

      {/* Key Metrics Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card bg-card/40 hover:bg-card/60 transition-colors duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <ClipboardList className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">{filtradas.length}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Visitas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-card/40 hover:bg-card/60 transition-colors duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
              <Calendar className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">
                {filtradas.filter((v) => v.fds === "Sim").length}
              </p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">FDS</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-card/40 hover:bg-card/60 transition-colors duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <ClipboardList className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">
                {filtradas.filter((v) => v.coaching === "Sim").length}
              </p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">COACHING</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card bg-card/40 hover:bg-card/60 transition-colors duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <ClipboardList className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight">
                {filtradas.filter((v) => v.rgb === "Sim").length}
              </p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">RGB</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Filters Sidebar area (Left on large screens, Top on small) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass-card bg-card/30 sticky top-6">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-xs font-bold text-muted-foreground flex items-center gap-2 uppercase tracking-widest">
                <Filter className="w-4 h-4 text-primary" />
                Filtrar Resultados
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data Início</Label>
                <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="bg-background/50 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Data Fim</Label>
                <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="bg-background/50 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Localidade</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger className="bg-background/50 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas Unidades</SelectItem>
                    <SelectItem value="Campos">Polo Campos</SelectItem>
                    <SelectItem value="Macaé">Polo Macaé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Responsável</Label>
                <Input placeholder="Nome do avaliador..." value={avaliador} onChange={(e) => setAvaliador(e.target.value)} className="bg-background/50 h-10" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visit List Content Area (Right on large screens) */}
        <div className="lg:col-span-9 space-y-4">
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
                            <span className="flex items-center gap-1.5 font-medium px-2 py-1 rounded bg-background/50 border border-border/50">
                              <span className="font-bold text-foreground">Cód:</span> {v.codigo_pdv}
                            </span>

                            {/* Badges para marcadores importantes */}
                            <div className="flex flex-wrap items-center gap-1.5 ml-auto sm:ml-2">
                              {v.fds === "Sim" && <Badge variant="outline" className="text-[10px] uppercase font-bold text-green-500 border-green-500/30 bg-green-500/10">FDS</Badge>}
                              {v.coaching === "Sim" && <Badge variant="outline" className="text-[10px] uppercase font-bold text-blue-500 border-blue-500/30 bg-blue-500/10">COACHING</Badge>}
                              {v.rgb === "Sim" && <Badge variant="outline" className="text-[10px] uppercase font-bold text-purple-500 border-purple-500/30 bg-purple-500/10">RGB</Badge>}
                              {v.compass === "Sim" && <Badge variant="outline" className="text-[10px] uppercase font-bold text-orange-500 border-orange-500/30 bg-orange-500/10">COMPASS</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-0">
                        {v.observacoes && (
                          <div className="flex-1 sm:hidden text-xs text-muted-foreground line-clamp-1 italic">
                            "{v.observacoes}"
                          </div>
                        )}
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
                    {v.observacoes && (
                      <div className="hidden sm:block mt-4 p-3 rounded-lg bg-background/40 border border-border/40 text-sm text-foreground/80 italic relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 rounded-l-lg" />
                        "{v.observacoes}"
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
