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
  "Entretenimento Esp.",
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
          potencial_cliente: pdvData.categoria || "", // Assuming category equates to potential here based on instructions
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
      avaliador: user?.name || "", // Sending the user's name as 'avaliador' in DB for rendering on dashboard
      cargo: user?.funcao || "",
      fds: form.tipo_visita === "FDS" ? "Sim" : "Não",
      coaching: form.tipo_visita === "COACHING ROTA BASICA COM VENDEDOR" ? "Sim" : "Não",
      rgb: ["FOCO RGB", "FOCO MAIORES QUEDAS RGB"].includes(form.tipo_visita) ? "Sim" : "Não",
      compass: ["MAIORES POTENCIAS BASE DE COMPRAS", "MAIORES POTENCIAS BASE DE COMPRAS RGB"].includes(form.tipo_visita) ? "Sim" : "Não",
      observacoes: "", // Campo substituído por Código do Cliente na UI
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

  const stepLabel =
    step === 1 ? "Etapa 1 de 2 — Dados da Visita e do PDV" :
      "Etapa 2 de 2 — Produtos e Execução";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (step === 2) setStep(1);
            else navigate("/dashboard");
          }}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Visita</h1>
          <p className="text-sm text-muted-foreground">{stepLabel}</p>
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Visita</CardTitle>
            <CardDescription>Campos marcados com * são obrigatórios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome</Label>
                  <Input type="text" value={user?.name || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Unidade</Label>
                  <Input type="text" value={user?.unidade || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-1.5">
                  <Label>Avaliador</Label>
                  <Input type="text" value={user?.funcao || ""} disabled className="bg-muted" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Data da Visita *</Label>
                <Input
                  type="date"
                  value={form.data_visita}
                  onChange={(e) => handleChange("data_visita", e.target.value)}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="space-y-1.5 flex-1">
                  <Label>Código do Cliente *</Label>
                  <Input
                    value={form.codigo_pdv}
                    onChange={(e) => {
                      handleChange("codigo_pdv", e.target.value);
                      setPdvBuscado(false);
                    }}
                    placeholder="Ex: 12345"
                  />
                </div>
                <Button type="button" onClick={handlePesquisarPdv} disabled={isSearchingPdv || !form.codigo_pdv}>
                  {isSearchingPdv ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  <span className="ml-2 hidden sm:inline">Pesquisar</span>
                </Button>
              </div>

              {pdvBuscado && (
                <div className="pt-6 space-y-5 border-t border-border mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg">Dados do PDV</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Código *</Label>
                      <Input value={form.codigo_pdv} disabled className="bg-muted text-muted-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Nome Vendedor</Label>
                      <Input value={form.nome_vendedor} disabled className="bg-muted text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Nome Fantasia do Cliente *</Label>
                      <Input
                        value={form.nome_fantasia_pdv}
                        disabled
                        className="bg-muted text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Filial</Label>
                      <Input
                        value={form.filial}
                        disabled
                        className="bg-muted text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Potencial do Cliente</Label>
                    <Input
                      value={form.potencial_cliente}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Canal Cadastrado *</Label>
                    <Input
                      value={form.canal_cadastrado}
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Canal Identificado</Label>
                    <Select value={form.canal_identificado} onValueChange={(v) => handleChange("canal_identificado", v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o canal" /></SelectTrigger>
                      <SelectContent>
                        {canalOptions.map((canal) => (
                          <SelectItem key={canal} value={canal}>{canal}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>


                </div>
              )}

              {tipoVisitaOptions.length > 0 && (
                <div className="space-y-3 pt-6 border-t border-border mt-6">
                  <Label>Tipo de Visita *</Label>
                  <RadioGroup value={form.tipo_visita} onValueChange={(v) => handleChange("tipo_visita", v)} className="space-y-2">
                    {tipoVisitaOptions.map((option) => (
                      <div key={option} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                        <RadioGroupItem value={option} id={option} />
                        <Label htmlFor={option} className="text-sm cursor-pointer flex-1">{option}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              {pdvBuscado && (
                <div className="flex gap-3 pt-4 mt-6">
                  <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
                    Cancelar
                  </Button>
                  <Button type="button" onClick={handleNext1} className="flex-1">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Próximo
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <StepProdutosExecucao
          canalCadastrado={form.canal_cadastrado}
          onBack={() => setStep(1)}
          onSubmit={handleSubmitFinal}
          loading={loading}
        />
      )}
    </div>
  );
};

export default NovaVisita;
