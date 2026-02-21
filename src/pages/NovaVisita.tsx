import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { enviarVisita, buscarPdvPorCodigo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StepProdutosExecucao from "@/components/StepProdutosExecucao";

const canalOptions = [
  "Padaria/Confeitaria",
  "Armazém/Mercearia",
  "Adega",
  "Lanchonete",
  "Restaurante C/D",
  "Restaurante A/B",
  "Bar C/D",
  "Bar A/B",
  "Entretenimento Espec.",
  "Loja de Conveniência",
  "Mini C/D",
  "Mini A/B",
  "Super C/D",
  "Super A/B",
];

const potencialOptions = ["Diamante", "Ouro", "Prata", "Bronze"];



const NovaVisita = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSearchingPdv, setIsSearchingPdv] = useState(false);
  const [pdvBuscado, setPdvBuscado] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    data_visita: new Date().toISOString().split("T")[0],
    tipo_visita: "",
    observacoes: "",
    codigo_pdv: "",
    nome_fantasia_pdv: "",
    potencial_cliente: "",
    canal_identificado: "",
    canal_cadastrado: "",
    filial: "",
    municipio: "",
    nome_vendedor: "",
    coorden_x: "",
    coorden_y: "",
  });

  const tipoVisitaOptions = user?.indicadores || [];

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePesquisarPdv = async () => {
    if (!form.data_visita || !user?.unidade || !user?.funcao || !form.codigo_pdv) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a data e o código do cliente.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingPdv(true);
    try {
      const pdvData = await buscarPdvPorCodigo(form.codigo_pdv);
      if (pdvData) {
        // Obter nome em caixa alta para comparação insensível
        const currentUserName = user?.name?.toUpperCase() || "";

        // Lista de responsáveis vinculados a este PDV no banco
        const responsvaveis = [
          pdvData.nome_vendedor?.toUpperCase(),
          pdvData.nome_supervisor?.toUpperCase(),
          pdvData.supervisor?.toUpperCase(),
          pdvData.gerente?.toUpperCase()
        ].filter(Boolean) as string[];

        // Verifica se o usuário atual tem o nome igual ou contido no nome de algum responsável
        const isOwner = responsvaveis.some(resp =>
          resp === currentUserName ||
          resp.includes(currentUserName) ||
          currentUserName.includes(resp)
        );

        if (!isOwner && currentUserName) {
          toast({
            title: "Acesso Inválido",
            description: "Código não é da sua base.",
            variant: "destructive",
          });
          setPdvBuscado(false);
          return;
        }

        setForm((prev) => ({
          ...prev,
          nome_fantasia_pdv: pdvData.nome_fantasia || "",
          canal_cadastrado: pdvData.canal_cadastrado || "",
          potencial_cliente: pdvData.categoria || "",
          filial: pdvData.filial || "",
          municipio: pdvData.municipio || "",
          nome_vendedor: pdvData.nome_vendedor || "",
          coorden_x: pdvData.coorden_x || "",
          coorden_y: pdvData.coorden_y || "",
        }));
        setPdvBuscado(true);
        toast({
          title: "Cliente Localizado",
          description: "Dados do PDV preenchidos com sucesso.",
        });
      } else {
        setPdvBuscado(true);
        setForm(prev => ({
          ...prev, nome_fantasia_pdv: "", canal_cadastrado: "", potencial_cliente: "", filial: "", municipio: "", nome_vendedor: "", coorden_x: "", coorden_y: ""
        }));
        toast({
          title: "Cliente não encontrado",
          description: "O código inserido não retornou resultados práticos, preencha manualmente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearchingPdv(false);
    }
  };

  const handleNext1 = () => {
    if (!form.data_visita || !user?.unidade || !user?.funcao || !form.codigo_pdv) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a data e o código do cliente.",
        variant: "destructive",
      });
      return;
    }
    if (!pdvBuscado) {
      toast({
        title: "Pesquisa necessária",
        description: "Pesquise o código do cliente antes de prosseguir.",
        variant: "destructive",
      });
      return;
    }
    if (!form.nome_fantasia_pdv) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome fantasia do cliente.",
        variant: "destructive",
      });
      return;
    }
    if (!form.canal_cadastrado) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o canal cadastrado para continuar.",
        variant: "destructive",
      });
      return;
    }
    if (!form.canal_identificado) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o canal identificado para continuar.",
        variant: "destructive",
      });
      return;
    }
    if (!form.tipo_visita) {
      toast({
        title: "Campo obrigatório",
        description: "Selecione o tipo de visita para continuar.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handleSubmitFinal = async (
    produtosSelecionados: string[],
    execucaoSelecionada: string[],
    pontuacaoTotal: number
  ) => {
    setLoading(true);
    const result = await enviarVisita({
      data_visita: form.data_visita,
      unidade: user?.unidade || "",
      avaliador: user?.name || "",
      cargo: user?.funcao || "",
      fds: form.tipo_visita === "FDS" ? "Sim" : "Não",
      coaching: form.tipo_visita === "COACHING ROTA BASICA COM VENDEDOR" ? "Sim" : "Não",
      rgb: ["FOCO RGB", "FOCO MAIORES QUEDAS RGB"].includes(form.tipo_visita) ? "Sim" : "Não",
      compass: ["MAIORES POTENCIAS BASE DE COMPRAS", "MAIORES POTENCIAS BASE DE COMPRAS RGB"].includes(form.tipo_visita) ? "Sim" : "Não",
      observacoes: "",
      codigo_pdv: form.codigo_pdv,
      nome_fantasia_pdv: form.nome_fantasia_pdv,
      potencial_cliente: form.potencial_cliente,
      canal_identificado: form.canal_identificado,
      canal_cadastrado: form.canal_cadastrado,
      filial: form.filial,
      municipio: form.municipio,
      nome_vendedor: form.nome_vendedor,
      coorden_x: form.coorden_x,
      coorden_y: form.coorden_y,
      produtos_selecionados: produtosSelecionados.join("; "),
      execucao_selecionada: execucaoSelecionada.join("; "),
      pontuacao_total: pontuacaoTotal,
    });

    toast({
      title: result.success ? "Sucesso!" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setForm({
        data_visita: new Date().toISOString().split("T")[0],
        tipo_visita: "",
        observacoes: "",
        codigo_pdv: "",
        nome_fantasia_pdv: "",
        potencial_cliente: "",
        canal_identificado: "",
        canal_cadastrado: "",
        filial: "",
        municipio: "",
        nome_vendedor: "",
        coorden_x: "",
        coorden_y: "",
      });
      setPdvBuscado(false);
      setStep(1);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header with Progress Tracker */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="w-10 h-10 rounded-full border-border/50 hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              if (step === 2) setStep(1);
              else navigate("/dashboard");
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Registro de Visita</h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              Complete as informações abaixo para gravar a visita no sistema.
            </p>
          </div>
        </div>

      </div>

      {step === 1 && (
        <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden relative">
          {/* Decorative background gradients */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full pointer-events-none" />

          <CardHeader className="pb-4 border-b border-border/40 relative z-10">
            <CardTitle className="text-lg font-bold">1. Dados da Visita e do PDV</CardTitle>
            <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Os campos com asterisco (*) são obrigatórios</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 relative z-10">
            <div className="space-y-8">

              {/* Info Avaliador / Readonly */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 p-5 rounded-xl bg-background/50 border border-white/5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Técnico / Responsável</Label>
                  <Input type="text" value={user?.name || ""} disabled className="bg-transparent border-0 px-0 h-auto font-bold text-foreground opacity-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unidade Base</Label>
                  <Input type="text" value={user?.unidade || ""} disabled className="bg-transparent border-0 px-0 h-auto font-bold text-foreground opacity-100" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargo / Função</Label>
                  <Input type="text" value={user?.funcao || ""} disabled className="bg-transparent border-0 px-0 h-auto font-bold text-foreground opacity-100" />
                </div>
              </div>

              {/* Data and PDV Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground flex items-center">
                    Data da Visita <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={form.data_visita}
                    onChange={(e) => handleChange("data_visita", e.target.value)}
                    className="h-12 bg-background/50 focus-visible:ring-primary shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground flex items-center">
                    Código do Cliente <span className="text-destructive ml-1">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.codigo_pdv}
                      onChange={(e) => {
                        handleChange("codigo_pdv", e.target.value);
                        setPdvBuscado(false);
                      }}
                      placeholder="Identificador do PDV..."
                      className="h-12 bg-background/50 focus-visible:ring-primary shadow-sm font-mono text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePesquisarPdv();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handlePesquisarPdv}
                      disabled={isSearchingPdv || !form.codigo_pdv}
                      className="h-12 px-6 shadow-md hover:shadow-primary/20 transition-all duration-300 active:scale-95"
                    >
                      {isSearchingPdv ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                      <span className="ml-2 hidden sm:inline font-bold">Pesquisar</span>
                    </Button>
                  </div>
                </div>
              </div>

              {pdvBuscado && (
                <div className="pt-8 mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-border/50"></div>
                    <h3 className="font-bold text-xs uppercase tracking-widest text-primary">Informações do PDV Localizado</h3>
                    <div className="h-px flex-1 bg-border/50"></div>
                  </div>

                  <div className="bg-muted/10 p-6 rounded-2xl border border-border/50 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Código Confirmado *</Label>
                        <Input value={form.codigo_pdv} disabled className="bg-background/20 font-mono text-foreground font-bold border-0" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vendedor Alocado</Label>
                        <Input value={form.nome_vendedor || "Não informado"} disabled className="bg-background/20 text-foreground font-bold border-0" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Razão / Nome Fantasia *</Label>
                        <Input
                          value={form.nome_fantasia_pdv}
                          disabled
                          className="bg-background/20 text-foreground font-bold border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Filial</Label>
                        <Input
                          value={form.filial || "Não informada"}
                          disabled
                          className="bg-background/20 text-foreground font-bold border-0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Potencial</Label>
                        <Input
                          value={form.potencial_cliente || "Não definido"}
                          disabled
                          className="bg-background/20 text-foreground font-bold border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Gestão Cadastrada *</Label>
                        <Input
                          value={form.canal_cadastrado || "Não definido"}
                          disabled
                          className="bg-background/20 text-foreground font-bold border-0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-primary uppercase tracking-widest">Nova Identificação *</Label>
                        <Select value={form.canal_identificado} onValueChange={(v) => handleChange("canal_identificado", v)}>
                          <SelectTrigger className="h-10 bg-background focus:ring-primary border-primary/30">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {canalOptions.map((canal) => (
                              <SelectItem key={canal} value={canal} className="font-medium cursor-pointer">{canal}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tipoVisitaOptions.length > 0 && (
                <div className="space-y-4 pt-6 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
                    <Label className="text-sm font-bold text-foreground">Objetivo / Tipo de Visita <span className="text-destructive">*</span></Label>
                  </div>

                  <RadioGroup value={form.tipo_visita} onValueChange={(v) => handleChange("tipo_visita", v)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tipoVisitaOptions.map((option) => {
                      const isDisabled = option !== "FDS";
                      return (
                        <div key={option} className={`
                          relative flex items-center p-4 rounded-xl border-2 transition-all duration-200
                          ${isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/30 border-border/40' : 'cursor-pointer'}
                          ${!isDisabled && form.tipo_visita === option
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                            : ''
                          }
                          ${!isDisabled && form.tipo_visita !== option ? 'border-border/40 bg-card hover:border-primary/50 hover:bg-muted/30' : ''}
                        `}>
                          <RadioGroupItem value={option} id={option} disabled={isDisabled} className="sr-only" />
                          <Label htmlFor={option} className={`w-full flex items-center gap-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                               ${form.tipo_visita === option ? 'border-primary' : 'border-muted-foreground/30'}
                             `}>
                              {form.tipo_visita === option && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <span className={`text-sm font-semibold ${form.tipo_visita === option ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {option}
                            </span>
                            {isDisabled && (
                              <span className="ml-auto text-[10px] uppercase font-bold text-muted-foreground bg-background px-2 py-0.5 rounded-full border border-border/50 shadow-sm">
                                Em Breve
                              </span>
                            )}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              )}

              {pdvBuscado && (
                <div className="flex gap-4 pt-8 mt-8 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="w-1/3 h-12 text-muted-foreground font-semibold hover:text-foreground hover:bg-muted"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNext1}
                    className="flex-1 h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
                  >
                    Próxima Etapa
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
          <StepProdutosExecucao
            // Aqui garantimos que passamos o canal_cadastrado correto para a busca
            canalCadastrado={form.canal_cadastrado}
            tipoVisita={form.tipo_visita}
            onBack={() => setStep(1)}
            onSubmit={handleSubmitFinal}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default NovaVisita;
