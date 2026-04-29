import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { enviarVisita, buscarPdvPorCodigo, verificarVisitaMensal } from "@/lib/api";
import { getDicaRotaHoje } from "@/features/alertas/api/alertas.service";
import { getBrasiliaDateStr } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Loader2, Search, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import StepProdutosExecucao, { RgbSubmitData } from "@/features/visitas/components/StepProdutosExecucao";
import StepCoaching, { CoachingSubmitData } from "@/features/visitas/components/StepCoaching";

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

import { getIndicadoresPorNivel, REQUER_PRODUTOS_EXECUCAO, REQUER_COACHING } from "@/lib/roles";

const VisitaManual = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSearchingPdv, setIsSearchingPdv] = useState(false);
  const [pdvBuscado, setPdvBuscado] = useState(false);

  const [form, setForm] = useState({
    data_visita: getBrasiliaDateStr(),
    tipo_visita: "",
    observacoes: "",
    codigo_pdv: "",
    nome_fantasia_pdv: "",
    potencial_cliente: "",
    canal_identificado: "",
    canal_cadastrado: "",
    filial: "",
    municipio: "",
    codigo_vendedor: "",
    nome_vendedor: "",
    coorden_x: "",
    coorden_y: "",
  });

  const [dicasRgb, setDicasRgb] = useState<any[]>([]);

  useEffect(() => {
    const isSupervisor = user?.funcao?.toUpperCase().includes('SUPERVISOR') || user?.nivel === 'Master' || user?.nivel === 'Niv4';
    // Removemos a restrição do tipo_visita para mostrar a dica antes do usuário escolher a visita
    if (isSupervisor && form.data_visita) {
      getDicaRotaHoje(user, form.data_visita).then(dicas => setDicasRgb(dicas));
    } else {
      setDicasRgb([]);
    }
  }, [user, form.data_visita]);

  const tipoVisitaOptions = getIndicadoresPorNivel(user?.nivel);

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
      // O banco de dados salva o código com "C" ou "M" no começo, dependendo da filial.
      let prefixo = "";
      const isMacae = user?.unidade?.toUpperCase().includes('MACAE') || user?.unidade?.toUpperCase().includes('MACAÉ');

      if (isMacae) {
        prefixo = "M";
      } else if (user?.unidade?.toUpperCase().includes('CAMPOS')) {
        prefixo = "C";
      } else {
        prefixo = "C"; // Fallback
      }

      const codigoBusca = form.codigo_pdv.match(/^\d+$/) ? `${prefixo}${form.codigo_pdv}` : form.codigo_pdv;

      const currentUserName = user?.name?.toUpperCase() || "";

      // Verifica se o PDV já foi visitado pelo usuário logado no mês selecionado
      const jaVisitado = await verificarVisitaMensal(codigoBusca, user?.name || "", form.data_visita, user);

      if (jaVisitado) {
        toast({
          title: "Ação Bloqueada",
          description: "Você já realizou uma visita para este PDV neste mês.",
          variant: "destructive",
        });
        setPdvBuscado(false);
        return;
      }

      const isSupervisor = user?.funcao?.toUpperCase().includes('SUPERVISOR');
      const isGerente = user?.nivel === 'Niv3';

      const response = await buscarPdvPorCodigo(codigoBusca, user);
      
      if (response && response.data && !response.error) {
        const pdvData = response.data;
        setForm((prev) => ({
          ...prev,
          nome_fantasia_pdv: pdvData.nome_fantasia || "",
          canal_cadastrado: pdvData.canal_cadastrado || "",
          potencial_cliente: pdvData.categoria || "",
          filial: pdvData.filial || "",
          municipio: pdvData.municipio || "",
          codigo_vendedor: pdvData.codigo_vendedor || "",
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
        setPdvBuscado(false);
        setForm(prev => ({
          ...prev, nome_fantasia_pdv: "", canal_cadastrado: "", potencial_cliente: "", filial: "", municipio: "", codigo_vendedor: "", nome_vendedor: "", coorden_x: "", coorden_y: ""
        }));
        toast({
          title: "Atenção",
          description: response?.error || "O código não foi encontrado na base de dados.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSearchingPdv(false);
    }
  };


  const handleSubmitFinal = async (payload: {
    produtosSelecionados?: string[];
    execucaoSelecionada?: string[];
    pontuacaoTotal?: number;
    passos_coaching?: string[];
    pontos_fortes?: string;
    pontos_desenvolver?: string;
    observacoes?: string;
    rgbData?: RgbSubmitData;
    fdsData?: any;
    produtosNaoSelecionados?: string[];
  }) => {
    setLoading(true);
    const result = await enviarVisita({
      data_visita: form.data_visita,
      unidade: user?.unidade || "",
      avaliador: user?.name || "",
      cargo: user?.funcao || "",
      indicador_avaliado: form.tipo_visita,
      observacoes: payload.observacoes || "",
      codigo_pdv: form.codigo_pdv,
      nome_fantasia_pdv: form.nome_fantasia_pdv,
      potencial_cliente: form.potencial_cliente,
      canal_identificado: form.canal_identificado,
      canal_cadastrado: form.canal_cadastrado,
      filial: form.filial,
      municipio: form.municipio,
      codigo_vendedor: form.codigo_vendedor,
      nome_vendedor: form.nome_vendedor,
      coorden_x: form.coorden_x,
      coorden_y: form.coorden_y,
      produtos_selecionados: payload.produtosSelecionados ? payload.produtosSelecionados.join("; ") : "",
      execucao_selecionada: payload.execucaoSelecionada ? payload.execucaoSelecionada.join("; ") : "",
      pontuacao_total: payload.pontuacaoTotal || 0,
      pontos_fortes: payload.pontos_fortes || "",
      pontos_desenvolver: payload.pontos_desenvolver || "",
      passos_coaching: payload.passos_coaching ? payload.passos_coaching.join("; ") : "",
      rgb_foco_visita: payload.rgbData?.rgb_foco_visita || "",
      rgb_comprando_outras: payload.rgbData?.rgb_comprando_outras || "",
      rgb_ttc_adequado: payload.rgbData?.rgb_ttc_adequado || "",
      rgb_acao_concorrencia: payload.rgbData?.rgb_acao_concorrencia || "",
      fds_qtd_skus: payload.fdsData?.fds_qtd_skus || "",
      fds_refrigerador: payload.fdsData?.fds_refrigerador || "",
      fds_posicionamento: payload.fdsData?.fds_posicionamento || "",
      fds_refrigerados: payload.fdsData?.fds_refrigerados || "",
      fds_precificados: payload.fdsData?.fds_precificados || "",
      fds_melhoria_precificacao: payload.fdsData?.fds_melhoria_precificacao || "",
      fds_observacoes: payload.fdsData?.fds_observacoes || "",
      produtos_nao_selecionados: payload.produtosNaoSelecionados ? payload.produtosNaoSelecionados.join("; ") : "",
      empresa_id: user?.empresa_id || 1,
      id_avaliador: user?.id,
    });

    toast({
      title: result.success ? "Sucesso!" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setForm({
        data_visita: getBrasiliaDateStr(),
        tipo_visita: "",
        observacoes: "",
        codigo_pdv: "",
        nome_fantasia_pdv: "",
        potencial_cliente: "",
        canal_identificado: "",
        canal_cadastrado: "",
        filial: "",
        municipio: "",
        codigo_vendedor: "",
        nome_vendedor: "",
        coorden_x: "",
        coorden_y: "",
      });
      setPdvBuscado(false);
      navigate("/dashboard");
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
            onClick={() => navigate("/dashboard")}
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

        <div className="space-y-6">
          {/* Top Info: Date and Search */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <Label className="text-sm font-bold text-foreground flex items-center">Data da Visita <span className="text-destructive ml-1">*</span></Label>
              <Input
                type="date"
                value={form.data_visita}
                min={getBrasiliaDateStr()}
                max={getBrasiliaDateStr()}
                onChange={(e) => handleChange("data_visita", e.target.value)}
                className="h-12 bg-background dark:bg-muted/30 focus-visible:ring-primary shadow-sm"
              />
            </div>

            <div className="space-y-3 relative z-10">
              <Label className="text-sm font-bold text-foreground flex items-center">Código do Cliente <span className="text-destructive ml-1">*</span></Label>
              <div className="flex gap-2">
                <Input
                  value={form.codigo_pdv}
                  onChange={(e) => {
                    // Aceita apenas números
                    const val = e.target.value.replace(/\D/g, '');
                    handleChange("codigo_pdv", val);
                    setPdvBuscado(false);
                  }}
                  placeholder="Pesquisar código..."
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="h-12 bg-background dark:bg-muted/30 text-base shadow-sm font-semibold"
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

          {/* ALERTA INTELIGENTE RGB - AGORA APARECE ANTES MESMO DE DIGITAR O CÓDIGO */}
          {dicasRgb.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="space-y-3 w-full">
                    <h4 className="font-bold text-amber-600 dark:text-amber-500 text-lg flex items-center gap-2">
                      💡 Dica de Rota Inteligente
                    </h4>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                      O sistema detectou clientes na rota desta data que precisam de atenção na execução RGB:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {dicasRgb.map((dica, idx) => (
                        <div key={idx} className="bg-background/80 border border-amber-500/40 p-3 rounded-lg flex flex-col cursor-pointer hover:bg-amber-500/20 hover:scale-[1.02] transition-all"
                          onClick={() => {
                            // Auto preenche o código
                            setForm(prev => ({ ...prev, codigo_pdv: dica.codigo }));
                            toast({ title: "Código Aplicado", description: "O código sugerido foi copiado para o campo de busca.", className: "bg-amber-500 text-white font-bold" });
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-black text-foreground text-base">{dica.codigo}</span>
                            <Badge className="bg-amber-500 text-white hover:bg-amber-600 border-none text-[10px] px-1.5 py-0 font-bold uppercase">Prioridade</Badge>
                          </div>
                          <span className="text-xs font-bold text-muted-foreground truncate">{dica.nome_fantasia}</span>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1 italic leading-tight bg-amber-500/10 px-2 py-0.5 rounded-sm inline-block w-fit">
                            Vendedor: {dica.motivo}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1 - Dados da Visita */}
          <Card className="glass-card bg-card/40 border-primary/10 shadow-md">
            <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 p-4 sm:p-6">
              <CardTitle className="text-lg font-bold text-primary">1- Dados da visita</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-5 sm:pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Responsável</Label>
                  <p className="text-sm font-black text-foreground truncate uppercase">{user?.name || ""}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Unidade</Label>
                  <div className="flex">
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-200/50 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase">
                      {user?.unidade === 'TODAS' ? "TODAS AS UNIDADES" : (user?.unidade || "Não definida")}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Cargo / Função</Label>
                  <div className="flex">
                    <Badge className="bg-[#FFB800] text-black font-black text-[10px] px-2 py-0.5 rounded-md border-none uppercase tracking-wider">
                      {user?.formattedRole}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2 - Informações do PDV */}
          {pdvBuscado && (
            <Card className="glass-card bg-card/40 border-primary/10 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 p-4 sm:p-6">
                <CardTitle className="text-lg font-bold text-primary">2- Informações do PDV</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-5 sm:pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Código</Label>
                    <Input value={`${form.filial?.toUpperCase() || ''}${form.codigo_pdv}`} disabled className="bg-background/20 text-foreground font-bold border-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vendedor</Label>
                    <Input value={form.codigo_vendedor ? `${form.codigo_vendedor} - ${form.nome_vendedor} ` : form.nome_vendedor || "Não informado"} disabled className="bg-background/20 text-foreground font-bold border-0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Nome Fantasia</Label>
                    <Input
                      value={form.nome_fantasia_pdv}
                      disabled
                      className="bg-background/20 text-foreground font-bold border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Potencial</Label>
                    <Input
                      value={form.potencial_cliente || "Não definido"}
                      disabled
                      className="bg-background/20 text-foreground font-bold border-0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Canal Cadastrado</Label>
                    <Input
                      value={form.canal_cadastrado || "Não definido"}
                      disabled
                      className="bg-background/20 text-foreground font-bold border-0"
                    />
                  </div>
                </div>

                {tipoVisitaOptions.length > 0 && (
                  <div className="space-y-4 pt-6 mt-6 border-t border-border/40">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
                      <Label className="text-sm font-bold text-foreground">Objetivo / Tipo de Visita <span className="text-destructive">*</span></Label>
                    </div>

                    <RadioGroup value={form.tipo_visita} onValueChange={(v) => handleChange("tipo_visita", v)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {tipoVisitaOptions.map((option) => {
                        const isDisabled = false; // Agora opções vêm restritas do nível, nunca bloqueadas
                        return (
                          <div key={option} className={`
                            relative rounded-xl border-2 transition-all duration-200 overflow-hidden
                            ${isDisabled ? 'opacity-50 cursor-not-allowed bg-muted/30 border-border/40' : 'cursor-pointer'}
                            ${!isDisabled && form.tipo_visita === option
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                              : ''
                            }
                            ${!isDisabled && form.tipo_visita !== option ? 'border-border/40 bg-card hover:border-primary/50 hover:bg-muted/30' : ''}
                          `}>
                            <RadioGroupItem value={option} id={option} disabled={isDisabled} className="sr-only" />
                            <Label htmlFor={option} className={`w-full h-full flex flex-col items-center justify-center p-4 gap-3 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                ${form.tipo_visita === option ? 'border-primary' : 'border-muted-foreground/30'}
                              `}>
                                {form.tipo_visita === option && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                              </div>
                              <span className={`text-sm font-semibold text-center ${form.tipo_visita === option ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {option}
                              </span>
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                )}

                {/* O ALERTA INTELIGENTE RGB FOI MOVIDO PARA O TOPO DA PÁGINA */}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          {REQUER_PRODUTOS_EXECUCAO.includes(form.tipo_visita) && (
            <StepProdutosExecucao
              canalCadastrado={form.canal_cadastrado}
              tipoVisita={form.tipo_visita}
              onSubmit={(produtos: string[], execucoes: string[], pontuacao: number, rgbData?: RgbSubmitData, fdsData?: any, produtosNaoSelecionados?: string[]) => handleSubmitFinal({
                produtosSelecionados: produtos,
                execucaoSelecionada: execucoes,
                pontuacaoTotal: pontuacao,
                rgbData: rgbData,
                fdsData: fdsData,
                produtosNaoSelecionados: produtosNaoSelecionados
              })}
              loading={loading}
            />
          )}

          {REQUER_COACHING.includes(form.tipo_visita) && (
            <StepCoaching
              onSubmit={(data: CoachingSubmitData) => handleSubmitFinal({
                passos_coaching: data.passos_coaching,
                pontos_fortes: data.pontos_fortes,
                pontos_desenvolver: data.pontos_desenvolver,
                observacoes: data.observacoes,
              })}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitaManual;
