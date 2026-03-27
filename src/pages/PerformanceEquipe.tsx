import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buscarVisitas, buscarVendedoresAtivos, type Visita, type VendedorAtivo } from "@/lib/api";
import { useDashboardMetrics } from "@/features/relatorios/hooks/useDashboardMetrics";
import { TeamHierarchyView } from "@/components/TeamHierarchyView";
import { VisitaModalDialog } from "@/features/relatorios/components/VisitaModalDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, Users, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PerformanceEquipe = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [vendedoresBaseReal, setVendedoresBaseReal] = useState<VendedorAtivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);

  const {
    dateRange, setDateRange,
    unidade, setUnidade,
    cargoFiltro, setCargoFiltro,
    usuarioFiltro, setUsuarioFiltro,
    visitasHierarchy, usuariosUnicos, cargosUnicos, unidadesUnicas
  } = useDashboardMetrics(visitas, vendedoresBaseReal, user);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [v, vend] = await Promise.all([buscarVisitas(user), buscarVendedoresAtivos(user)]);
      setVisitas(v);
      setVendedoresBaseReal(vend);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-20 pt-16 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0 bg-card hover:bg-muted shadow-sm rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" /> Performance da Equipe
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">Gerencie e analise a estrutura hierárquica e avaliações.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card/40 border border-border/40 p-4 sm:p-6 rounded-xl shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center w-full justify-between">
            <div className="w-full md:w-[350px]">
              <Select value={usuarioFiltro} onValueChange={setUsuarioFiltro}>
                <SelectTrigger className="bg-background/60 h-10 w-full"><SelectValue placeholder="Pesquisar por usuário" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Usuários</SelectItem>
                  {usuariosUnicos.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
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
                          <>{format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}</>
                        ) : (
                          format(dateRange.from, "dd/MM/yy")
                        )
                      ) : ("Selecione uma data")}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange}
                    onSelect={(range) => setDateRange(range)} numberOfMonths={1} locale={ptBR}
                  />
                  {(dateRange?.from || dateRange?.to) && (
                    <div className="p-3 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateRange(undefined)}>Limpar Datas</Button>
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
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="pt-4 border-t border-border/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unidade</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Todas as unidades" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as Unidades</SelectItem>
                    {unidadesUnicas.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Função (Cargo)</Label>
                <Select value={cargoFiltro} onValueChange={setCargoFiltro}>
                  <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Todas as funções" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Funções</SelectItem>
                    {cargosUnicos.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Hierarchy Area */}
        {loading ? (
           <div className="text-center py-20 animate-pulse text-muted-foreground">Carregando hierarquia...</div>
        ) : (
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
            userUnidade={unidade === "todas" ? user?.unidade : unidade} 
            onSelectVisita={setSelectedVisita}
          />
        )}

        <VisitaModalDialog 
          selectedVisita={selectedVisita} 
          onClose={() => setSelectedVisita(null)} 
        />
      </div>
    </div>
  );
};
export default PerformanceEquipe;
