import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { buscarVisitas, excluirVisita, buscarVendedoresAtivos, type Visita, type VendedorAtivo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2, Filter, Calendar, MapPin, ClipboardList, CheckCircle2, ChevronRight, XCircle, AlertCircle, DownloadCloud, User } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [vendedoresBaseReal, setVendedoresBaseReal] = useState<VendedorAtivo[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [unidade, setUnidade] = useState("todas");
  const [indicadorFiltro, setIndicadorFiltro] = useState("todos");
  const [cargoFiltro, setCargoFiltro] = useState("todos");
  const [selectedVisita, setSelectedVisita] = useState<Visita | null>(null);
  const [activeTab, setActiveTab] = useState("minhas");
  const [avaliadorFiltro, setAvaliadorFiltro] = useState("todos");

  const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA');
  const isGerenteComercial = user?.nivel === 'Niv2';

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
    // Gerente Comercial (Niv2) inicia na aba Macaé por padrão
    if (user?.nivel === 'Niv2' && activeTab === 'minhas') {
      setActiveTab('macae');
    }
  }, [user?.unidade, user?.nivel]);



  const minhasVisitas = useMemo(() => {
    if (isAnalista) {
      return visitas;
    }
    // Niv2 (Gerente Comercial): filtra por unidade conforme aba ativa (Macaé/Campos)
    if (isGerenteComercial) {
      const unidadeAba = activeTab === 'macae' ? 'Macaé' : activeTab === 'campos' ? 'Campos' : null;
      if (unidadeAba) return visitas.filter(v => v.unidade === unidadeAba);
      return visitas;
    }
    // Aba "Supervisores": Exibe os da unidade logada GERAL, EXCETO os relatórios feitos pelos PRÓPRIOS gerentes
    if (user?.nivel === 'Niv3' && activeTab === 'unidade') {
      return visitas.filter(v => v.unidade === user?.unidade && !v.cargo?.toUpperCase().includes('GERENTE'));
    }
    // Aba "Minhas Avaliações": Exibe EXATAMENTE as que o Logado fez
    return visitas.filter(v => v.avaliador === user?.name);
  }, [visitas, user?.name, user?.nivel, user?.unidade, activeTab, isAnalista, isGerenteComercial]);

  const avaliadoresUnicos = useMemo(() => {
    const avaliadoresValidos = minhasVisitas
      .map(v => v.avaliador)
      .filter(Boolean) as string[];

    const unicos = Array.from(new Set(avaliadoresValidos));
    return unicos.sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const filtradas = useMemo(() => {
    return minhasVisitas.filter((v) => {
      if (avaliadorFiltro !== "todos" && v.avaliador !== avaliadorFiltro) return false;

      if (dateRange?.from || dateRange?.to) {
        // Separa YYYY-MM-DD em números inteiros para criar 
        // uma data "limpa" ao meio-dia, totalmente blindada contra fuso horário.
        const [anoStr, mesStr, diaStr] = (v.data_visita || "").split("-");
        if (!anoStr || !mesStr || !diaStr) return false;

        const visitaDate = new Date(parseInt(anoStr), parseInt(mesStr) - 1, parseInt(diaStr), 12, 0, 0);

        if (dateRange?.from) {
          const fromStart = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate(), 0, 0, 0);
          if (visitaDate < fromStart) return false;
        }
        if (dateRange?.to) {
          const toEnd = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59);
          if (visitaDate > toEnd) return false;
        }
      }

      if (unidade !== "todas" && v.unidade !== unidade) return false;
      if (indicadorFiltro !== "todos" && v.indicador_avaliado !== indicadorFiltro) return false;
      if (cargoFiltro !== "todos" && v.cargo !== cargoFiltro) return false;
      return true;
    });
  }, [minhasVisitas, dateRange, unidade, indicadorFiltro, cargoFiltro, avaliadorFiltro]);

  const estatisticasMes = useMemo(() => {
    // Usamos a base 'filtradas' para as contagens, assim os cards respeitam o Período, Cargo e Unidade escolhidos.
    const qtdeFDS = filtradas.filter(v => v.indicador_avaliado === 'FDS').length;
    const qtdeRGB = filtradas.filter(v => v.indicador_avaliado?.includes('RGB')).length;

    // Coaching detalhado
    const coachingVisitas = filtradas.filter(v => v.indicador_avaliado?.includes('COACHING'));
    const qtdeCoaching = coachingVisitas.length;

    // Calculando base de vendedores
    // Pegamos a base oficial de Vendedores vindas do banco de clientes para 
    // listar sempre 0 visitas para quem a equipe tem sob responsabilidade, 
    // preenchendo o Coaching com a equipe completa esteticamente.
    const mapaVendedores = new Map<string, number>();
    const baseVendedoresOficiais = new Set<string>();

    const normalizeStr = (s?: string) => s ? s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase() : "";

    const userLogadoNome = normalizeStr(user?.name);
    const avaliadorEscolhido = normalizeStr(avaliadorFiltro);
    const avaliadoresHistoricoNormalizados = avaliadoresUnicos.map(normalizeStr);

    // Extrai possível código numérico se a função do usuário for 'SUPERVISOR 200'
    const userSupCode = user?.funcao?.match(/\d+/)?.[0] || "";

    vendedoresBaseReal.forEach(v => {
      let match = true;
      const supName = normalizeStr(v.nome_supervisor);

      if (avaliadorFiltro !== "todos") {
        match = supName === avaliadorEscolhido;
      }

      // O backend Supabase AGORA JÁ FILTROU a lista vendedoresBaseReal via Superv(1) ou Gerente(1).
      // Então, se o usuário não filtrou um avaliador específico acima, todo mundo que veio
      // da API pertence a ele legitimamente.

      if (match && v.nome_vendedor) {
        // Apenas contabiliza a base oficial para fins de Teto de Meta,
        // mas não exibe o vendedor visualmente até ele receber uma avaliação de fato.
        const vNomeNormalizado = v.nome_vendedor.toUpperCase().trim();
        baseVendedoresOficiais.add(vNomeNormalizado);
      }
    });

    const vendedoresBaseCount = baseVendedoresOficiais.size;

    // Cria um Set apenas com vendedores avaliados em Coaching
    const vendedoresCoachingAtuais = new Set<string>();

    coachingVisitas.forEach(v => {
      if (v.nome_vendedor) {
        const vNomeNormalizado = v.nome_vendedor.toUpperCase().trim();
        vendedoresCoachingAtuais.add(vNomeNormalizado);
        mapaVendedores.set(vNomeNormalizado, (mapaVendedores.get(vNomeNormalizado) || 0) + 1);
      }
    });

    // Se houve avaliações de coaching para alguém fora da base oficial (ex: transferência),
    // incluímos ele no teto total de vendedores da equipe para não estourar 100%.
    const vendedoresCoachingCount = vendedoresCoachingAtuais.size;
    const vendedoresUnicos = Math.max(vendedoresBaseCount, vendedoresCoachingCount);

    const detalhesCoaching = Array.from(mapaVendedores.entries()).map(([nome, atual]) => ({
      nome,
      atual,
      meta: 5 // Meta fixa por vendedor (5)
    })).sort((a, b) => b.atual - a.atual); // Ordena pelos que tem mais visitas

    const multi = (user?.nivel === 'Niv3' && activeTab === 'unidade' && avaliadorFiltro === 'todos')
      ? Math.max(1, avaliadoresUnicos.length)
      : 1;

    let META_FDS = 10 * multi;
    let META_RGB = 20 * multi;
    let META_COACHING = Math.max(1, vendedoresUnicos) * 5;

    // Regra solicitada: Metas de Coaching cravadas sem mudança
    // Gerentes (Niv3): 80. Supervisores (Niv4): 40. Carlos Junior/Niv1: 40. FDS: 10, RGB: 20.
    if (user?.nivel === 'Niv3') {
      META_FDS = 10;
      META_RGB = 20;
      META_COACHING = 80;
    } else if (user?.nivel === 'Niv4' || user?.nivel === 'Niv1' || user?.email === 'carlos.junior@unibeer.com.br') {
      META_COACHING = 40;
    }

    // Calcular dias restantes com base no filtro final
    const hoje = new Date();
    // Se há um dateRange.to, calculamos em relação a ele, senão final do mês atual.
    const fim = dateRange?.to || new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    const difTempo = fim.getTime() - hoje.getTime();
    const dias = Math.max(0, Math.ceil(difTempo / (1000 * 3600 * 24)));

    return {
      qtdeFDS, qtdeRGB, qtdeCoaching,
      META_FDS, META_RGB, META_COACHING,
      baseVendedores: vendedoresUnicos,
      vendedoresAvaliados: vendedoresCoachingCount,
      detalhesCoaching,
      diasRestantes: dias
    };
  }, [filtradas, minhasVisitas, avaliadorFiltro, unidade, cargoFiltro, dateRange, avaliadoresUnicos, user?.nivel, activeTab, vendedoresBaseReal, user?.name]);

  const dadosGraficoAnalista = useMemo(() => {
    if (!isAnalista) return [];

    const mapa = new Map<string, { name: string, FDS: number, RGB: number, Coaching: number }>();

    filtradas.forEach(v => {
      const nomeAvaliador = v.avaliador;
      if (!nomeAvaliador) return;

      if (!mapa.has(nomeAvaliador)) {
        mapa.set(nomeAvaliador, { name: nomeAvaliador, FDS: 0, RGB: 0, Coaching: 0 });
      }

      const curr = mapa.get(nomeAvaliador)!;
      if (v.indicador_avaliado === 'FDS') curr.FDS++;
      else if (v.indicador_avaliado?.includes('RGB')) curr.RGB++;
      else if (v.indicador_avaliado?.includes('COACHING')) curr.Coaching++;
    });

    return Array.from(mapa.values()).sort((a, b) => (b.FDS + b.RGB + b.Coaching) - (a.FDS + a.RGB + a.Coaching));
  }, [filtradas, isAnalista]);

  const indicadoresUnicos = useMemo(() => {
    const unicos = Array.from(new Set(minhasVisitas.map(v => v.indicador_avaliado).filter(Boolean) as string[]));
    return unicos.sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const cargosUnicos = useMemo(() => {
    const unicos = Array.from(new Set(minhasVisitas.map(v => v.cargo).filter(Boolean) as string[]));
    return unicos.sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const unidadesUnicas = useMemo(() => {
    const unicas = Array.from(new Set(minhasVisitas.map(v => v.unidade).filter(Boolean) as string[]));
    return unicas.sort((a, b) => a.localeCompare(b));
  }, [minhasVisitas]);

  const handleExcluir = async (id: string) => {
    const result = await excluirVisita(id);
    toast({
      title: result.success ? "Sucesso" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) carregarVisitas();
  };

  const exportarParaExcel = () => {
    if (filtradas.length === 0) {
      toast({
        title: "Atenção",
        description: "Não há dados para exportar com os filtros atuais.",
        variant: "default",
      });
      return;
    }

    // Prepare data for Excel
    const dadosExportacao = filtradas.map(v => ({
      "DATA VISITA": format(new Date(v.data_visita + "T00:00:00"), "dd/MM/yyyy"),
      "UNIDADE": v.unidade || "-",
      "AVALIADOR": v.avaliador || "-",
      "CARGO": v.cargo || "-",
      "NOME DO VENDEDOR": v.nome_vendedor || "-",
      "CODIGO": v.codigo_pdv || "-",
      "NOME FANTASIA": v.nome_fantasia_pdv || "-",
      "POTENCIA DO CLIENTE": v.potencial_cliente || "-",
      "CANAL CADASTRADO": v.canal_cadastrado || "-",
      "CANAL IDENTIFICADO": v.canal_identificado || "-",
      "INDICADOR AVALIADO": v.indicador_avaliado || "-",
      "OBSERVAÇAO": v.observacoes || "-",
      "FILIA": v.filial || "-",
      "PRODUTOS SELECIONADOS": v.produtos_selecionados || "-",
      "PONTUAÇÃO TOTAL": v.pontuacao_total ?? "-",
      "PONTOS FORTES": v.pontos_fortes || "-",
      "PONTOS DESENVOLVER": v.pontos_desenvolver || "-",
      "PASSOS COACHING": v.passos_coaching || "-",
      "RGB FOCO VISITA": v.rgb_foco_visita || "-",
      "RGB COMPRANDO OUTRA": v.rgb_comprando_outras || "-",
      "RGB TTC ADEQUADO": v.rgb_ttc_adequado || "-",
      "RGB ACAO CONCORRENCIA": v.rgb_acao_concorrencia || "-",
      "CODIGO DO VENDEDOR": v.codigo_vendedor || "-",
      "FDS QTS SKUS": v.fds_qtd_skus || "-",
      "FDS REFRIGERADOR": v.fds_refrigerador || "-",
      "FDS POSICIONAMENTO": v.fds_posicionamento || "-",
      "FDS REFRIGERADOR ": v.fds_refrigerados || "-", // Extra space to prevent object key duplication
      "FDS PRECIFICAÇÃO": v.fds_precificados || "-",
      "FDS OBSERVAÇOES": v.fds_observacoes || "-",
      "PRODUTOS NAO SELECIONADOS": v.produtos_nao_selecionados || "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Visitas");

    // Adjust column widths automatically
    const max_width = dadosExportacao.reduce((w, r) => Math.max(w, r["NOME FANTASIA"]?.length || 0), 10);
    worksheet["!cols"] = [
      { wch: 15 }, // DATA VISITA
      { wch: 15 }, // UNIDADE
      { wch: 25 }, // AVALIADOR
      { wch: 20 }, // CARGO
      { wch: 25 }, // NOME DO VENDEDOR
      { wch: 12 }, // CODIGO
      { wch: max_width }, // NOME FANTASIA
      { wch: 20 }, // POTENCIA DO CLIENTE
      { wch: 20 }, // CANAL CADASTRADO
      { wch: 20 }, // CANAL IDENTIFICADO
      { wch: 25 }, // INDICADOR AVALIADO
      { wch: 50 }, // OBSERVAÇAO
      { wch: 15 }, // FILIA
      { wch: 50 }, // PRODUTOS SELECIONADOS
      { wch: 15 }, // PONTUAÇÃO TOTAL
      { wch: 40 }, // PONTOS FORTES
      { wch: 40 }, // PONTOS DESENVOLVER
      { wch: 40 }, // PASSOS COACHING
      { wch: 20 }, // RGB FOCO VISITA
      { wch: 25 }, // RGB COMPRANDO OUTRA
      { wch: 20 }, // RGB TTC ADEQUADO
      { wch: 25 }, // RGB ACAO CONCORRENCIA
      { wch: 15 }, // CODIGO DO VENDEDOR
      { wch: 15 }, // FDS QTS SKUS
      { wch: 20 }, // FDS REFRIGERADOR
      { wch: 25 }, // FDS POSICIONAMENTO
      { wch: 20 }, // FDS REFRIGERADOR (2)
      { wch: 25 }, // FDS PRECIFICAÇÃO
      { wch: 50 }, // FDS OBSERVAÇOES
      { wch: 50 }  // PRODUTOS NAO SELECIONADOS
    ];

    XLSX.writeFile(workbook, `Relatorio_Visitas_${format(new Date(), "ddMMyyyy_HHmm")}.xlsx`);

    toast({
      title: "Exportação Concluída",
      description: "O arquivo Excel foi gerado e baixado com sucesso.",
      variant: "default",
    });
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
          {isAnalista && (
            <Button
              variant="default"
              onClick={exportarParaExcel}
              className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-green-900/20 transition-all duration-300 active:scale-95 border-none"
            >
              <DownloadCloud className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          )}
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
      {user && !isAnalista && (
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

      {/* Gerenciamento de Camadas para Gerente (Niv3) */}
      {user?.nivel === 'Niv3' && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-in fade-in slide-in-from-top-2">
          <TabsList className="grid w-full grid-cols-2 lg:w-[500px] h-12 bg-background/50 border border-border/40 shadow-sm">
            <TabsTrigger value="minhas" className="font-bold uppercase tracking-widest text-[10px] sm:text-xs h-full">Minhas Avaliações</TabsTrigger>
            <TabsTrigger value="unidade" className="font-bold uppercase tracking-widest text-[10px] sm:text-xs h-full">Supervisores ({user?.unidade})</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Abas de Unidades para Gerente Comercial (Niv2) */}
      {isGerenteComercial && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-in fade-in slide-in-from-top-2">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-12 bg-background/50 border border-border/40 shadow-sm">
            <TabsTrigger value="macae" className="font-bold uppercase tracking-widest text-[10px] sm:text-xs h-full">
              📍 Macaé
            </TabsTrigger>
            <TabsTrigger value="campos" className="font-bold uppercase tracking-widest text-[10px] sm:text-xs h-full">
              📍 Campos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Metas e Progresso Mensal */}
      {user && !isAnalista && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Metas do Período Selecionado
            </h3>
            <span className="text-[10px] sm:text-xs font-bold text-amber-500 bg-amber-500/10 px-2 sm:px-3 py-1 rounded-full flex items-center border border-amber-500/20 shadow-sm">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Faltam {estatisticasMes.diasRestantes} dias
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 items-start">

            {/* Coluna 1 da Direita/Esquerda - FDS e RGB Empilhados */}
            <div className="flex flex-col gap-4">
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

            {/* Meta COACHING (Coluna Larga Esticada) */}
            <Card className="glass-card bg-card/40 border-primary/10 overflow-hidden relative shadow-sm flex flex-col h-full min-h-[220px]">
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

          </div>
        </div>
      )}

      {/* Painel Visão Global do Analista */}
      {isAnalista && (
        <Card className="glass-card bg-card/40 border-primary/20 overflow-hidden shadow-lg mt-6">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-primary" />
              Desempenho da Equipe (Avaliações por Usuário)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dadosGraficoAnalista}
                  margin={{ top: 20, right: 30, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'currentColor', fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    height={80}
                  />
                  <YAxis tick={{ fill: 'currentColor' }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: 'rgb(20,20,20)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="FDS" name="Visitas FDS" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="RGB" name="Visitas RGB" stackId="a" fill="#a855f7" />
                  <Bar dataKey="Coaching" name="Coaching" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {dadosGraficoAnalista.length === 0 && (
              <div className="text-center text-muted-foreground italic mt-4 py-10 border border-dashed border-border/50 rounded-xl">
                Nenhuma avaliação foi detectada nesses filtros de período para carregar os gráficos.
              </div>
            )}
          </CardContent>
        </Card>
      )}



      <div className="space-y-6">
        {/* Horizontal Filters Bar */}
        <div className="bg-card/40 border border-border/40 p-3 sm:p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="w-4 h-4 text-primary shrink-0" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Filtros de Pesquisa</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5 md:col-span-2 lg:col-span-1 min-w-0">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Período</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full h-9 justify-start text-left font-normal bg-background/50 text-sm overflow-hidden",
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
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={(range) => {
                      setDateRange(range);
                      if (range?.from && range?.to) {
                        setIsCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={1}
                    locale={ptBR}
                  />
                  {(dateRange?.from || dateRange?.to) && (
                    <div className="p-3 border-t">
                      <Button variant="ghost" size="sm" className="w-full" onClick={() => { setDateRange(undefined); setIsCalendarOpen(false); }}>
                        Limpar Datas
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
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
            {/* Avaliador Select */}
            {user?.nivel === 'Niv3' && activeTab === 'unidade' && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avaliador</Label>
                <Select value={avaliadorFiltro} onValueChange={setAvaliadorFiltro}>
                  <SelectTrigger className="bg-background/50 h-9 text-sm"><SelectValue placeholder="Todos os avaliadores" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Avaliadores</SelectItem>
                    {avaliadoresUnicos.map(a => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!(user?.nivel === 'Niv3' && activeTab === 'unidade') && (
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
            )}
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
                  {selectedVisita && (() => {
                    const [a, m, d] = (selectedVisita.data_visita || "").split("-");
                    return a && m && d ? `${d}/${m}/${a}` : selectedVisita.data_visita;
                  })()} • {selectedVisita?.unidade}
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
                        {(() => {
                          const [a, m, d] = (selectedVisita.data_visita || "").split("-");
                          return a && m && d ? `${d}/${m}/${a}` : selectedVisita.data_visita;
                        })()}
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
