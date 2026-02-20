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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas visitas de mercado</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarVisitas} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => navigate("/nova-visita")}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Visita
          </Button>
        </div>
      </div>

      {/* User Info Card */}
      {user && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6 pb-6 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">{user.name}</h3>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="default" className="text-xs bg-primary/90">{user.funcao || "Sem função"}</Badge>
                  <Badge variant="outline" className="text-xs">{user.unidade || "Sem unidade"}</Badge>
                </div>
              </div>
              <div className="flex-1 max-w-xl">
                <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Indicadores de Avaliação</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {user.indicadores && user.indicadores.length > 0 ? (
                    user.indicadores.map((ind, i) => (
                      <span key={i} className="bg-background border border-border px-2 py-1 rounded-md text-foreground shadow-sm">
                        {ind}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">Nenhum indicador mapeado para este cargo.</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Data Início</Label>
              <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data Fim</Label>
              <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unidade</Label>
              <Select value={unidade} onValueChange={setUnidade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Campos">Campos</SelectItem>
                  <SelectItem value="Macaé">Macaé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Avaliador</Label>
              <Input placeholder="Buscar avaliador..." value={avaliador} onChange={(e) => setAvaliador(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filtradas.length}</p>
                <p className="text-xs text-muted-foreground">Visitas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filtradas.filter((v) => v.unidade === "Campos").length}
                </p>
                <p className="text-xs text-muted-foreground">Campos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filtradas.filter((v) => v.unidade === "Macaé").length}
                </p>
                <p className="text-xs text-muted-foreground">Macaé</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {filtradas.filter((v) => v.fds === "Sim").length}
                </p>
                <p className="text-xs text-muted-foreground">Com FDS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visit List */}
      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma visita encontrada</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Visita" para registrar</p>
            </CardContent>
          </Card>
        ) : (
          filtradas.map((v, i) => (
            <Card key={v.id || i} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{v.avaliador}</span>
                      <Badge variant="secondary">{v.cargo}</Badge>
                      <Badge variant="outline">{v.unidade}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {v.data_visita}
                      </span>
                      {v.fds === "Sim" && <Badge className="bg-success text-success-foreground text-xs">FDS</Badge>}
                      {v.coaching === "Sim" && <Badge variant="outline" className="text-xs">Coaching</Badge>}
                      {v.rgb === "Sim" && <Badge variant="outline" className="text-xs">RGB</Badge>}
                      {v.compass === "Sim" && <Badge variant="outline" className="text-xs">COMPASS</Badge>}
                    </div>
                    {v.observacoes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{v.observacoes}</p>
                    )}
                  </div>
                  {isAdmin && v.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => handleExcluir(v.id!)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
