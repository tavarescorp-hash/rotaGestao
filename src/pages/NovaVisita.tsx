import { useNavigate } from "react-router-dom";
import { useVisitaForm } from "@/features/visitas/hooks/useVisitaForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Search, MapPin, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StepProdutosExecucao, { RgbSubmitData } from "@/features/visitas/components/StepProdutosExecucao";
import StepCoaching, { CoachingSubmitData } from "@/features/visitas/components/StepCoaching";

import { getIndicadoresPorNivel, REQUER_PRODUTOS_EXECUCAO, REQUER_COACHING } from "@/lib/roles";

const canalOptions = [
  "Padaria/Confeitaria", "Armazém/Mercearia", "Adega", "Lanchonete",
  "Restaurante C/D", "Restaurante A/B", "Bar C/D", "Bar A/B",
  "Entretenimento Especial", "Loja de Conveniência", "Mini C/D", "Mini A/B",
  "Super C/D", "Super A/B",
];

const NovaVisita = () => {
  const navigate = useNavigate();
  const {
    user,
    form,
    loading,
    isSearchingPdv,
    pdvBuscado,
    isLimitReached,
    isBlocked,
    contagemVisitas,
    handleChange,
    handlePesquisarPdv,
    handleSubmitFinal,
    setPdvBuscado
  } = useVisitaForm();

  if (user?.nivel === "Niv5") {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const tipoVisitaOptions = getIndicadoresPorNivel(user?.nivel);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-6">
        {isBlocked && (
          <Alert variant="destructive" className="bg-red-600/10 border-red-500/50 animate-in zoom-in-95 duration-500">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertTitle className="font-black uppercase tracking-tight">Registro Bloqueado</AlertTitle>
            <AlertDescription className="font-medium text-red-500/90 text-sm">
              Sua empresa possui <strong>pendências administrativas</strong>. Por segurança, a criação de novas visitas foi temporariamente desativada. Entre em contato com o administrador.
            </AlertDescription>
          </Alert>
        )}

        {isLimitReached && !isBlocked && user?.nivel !== 'Master' && (
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/50 animate-in zoom-in-95 duration-500">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertTitle className="font-black uppercase tracking-tight">Limite Mensal Atingido</AlertTitle>
            <AlertDescription className="font-medium text-destructive/90 text-sm">
              Sua empresa já realizou <strong>{contagemVisitas}</strong> visitas este mês (Limite: <strong>{user?.limite_visitas}</strong>). 
              A criação de novas visitas está bloqueada. Entre em contato com o suporte.
            </AlertDescription>
          </Alert>
        )}

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
          <div className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 p-4 sm:p-6 bg-card/40 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
                <CardTitle className="text-lg font-bold text-foreground">1- DADOS DA VISITA</CardTitle>
              </div>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 relative z-10 border-b border-border/40">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-foreground flex items-center">Data da Visita <span className="text-destructive ml-1">*</span></Label>
                <Input
                  type="date"
                  value={form.data_visita}
                  readOnly
                  className="h-12 bg-background/50 dark:bg-muted/10 text-foreground focus-visible:ring-primary shadow-sm cursor-not-allowed font-semibold border-border/50 opacity-100 [&:read-only]:opacity-100"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-bold text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Código do Cliente <span className="text-destructive ml-1">*</span>
                  </span>
                  {(user?.nivel === 'Niv1' || user?.nivel === 'Niv2') && (
                    <div className="bg-muted/50 p-1 rounded-xl border border-border/50 flex items-center shadow-inner">
                      <RadioGroup
                        value={form.filial}
                        onValueChange={(v) => {
                          handleChange("filial", v);
                          setPdvBuscado(false);
                        }}
                        className="flex gap-1"
                      >
                        <div className="flex items-center">
                          <RadioGroupItem value="C" id="unit-c" className="sr-only" />
                          <Label
                            htmlFor="unit-c"
                            className={`
                              px-4 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all duration-300 flex items-center gap-1.5
                              ${form.filial === 'C'
                                ? 'bg-primary text-white shadow-[0_2px_10px_rgba(234,179,8,0.3)] scale-105'
                                : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                              }
                            `}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${form.filial === 'C' ? 'bg-white animate-pulse' : 'bg-muted-foreground/40'}`}></span>
                            CAMPOS (C)
                          </Label>
                        </div>
                        <div className="flex items-center">
                          <RadioGroupItem value="M" id="unit-m" className="sr-only" />
                          <Label
                            htmlFor="unit-m"
                            className={`
                              px-4 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all duration-300 flex items-center gap-1.5
                              ${form.filial === 'M'
                                ? 'bg-primary text-white shadow-[0_2px_10px_rgba(234,179,8,0.3)] scale-105'
                                : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                              }
                            `}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${form.filial === 'M' ? 'bg-white animate-pulse' : 'bg-muted-foreground/40'}`}></span>
                            MACAÉ (M)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </Label>
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary pointer-events-none text-lg transition-transform group-focus-within:scale-110">
                      {form.filial?.toUpperCase()}
                    </span>
                    <Input
                      value={form.codigo_pdv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        handleChange("codigo_pdv", val);
                        setPdvBuscado(false);
                      }}
                      placeholder="Pesquisar código..."
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="h-14 bg-background/50 dark:bg-muted/10 text-foreground shadow-sm font-bold pl-12 border-border/50 focus-visible:border-primary/50 text-xl tracking-wider rounded-xl transition-all focus-within:shadow-md focus-within:shadow-primary/5"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePesquisarPdv();
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handlePesquisarPdv}
                    disabled={isSearchingPdv || !form.codigo_pdv}
                    className="h-14 px-8 shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-95 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-xs"
                  >
                    {isSearchingPdv ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    <span className="ml-2 hidden sm:inline">Pesquisar</span>
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-4 sm:p-6 bg-background/5 relative z-10">
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
          </div>

          {pdvBuscado && (
            <Card className="glass-card bg-card/40 border-primary/10 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
                  <CardTitle className="text-lg font-bold text-foreground">2- INFORMAÇÕES DO PDV</CardTitle>
                </div>
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

                <div className="space-y-3 pt-6 mt-6 border-t border-border/40">
                  <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                    Nova Identificação (Canal) <span className="text-destructive ml-1">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground font-semibold mb-2">
                    Confirme ou altere o canal do PDV verificado no momento da visita.
                  </p>
                  <Select value={form.canal_identificado} onValueChange={(v) => handleChange("canal_identificado", v)}>
                    <SelectTrigger className="h-12 bg-background/50 focus:ring-primary border-primary/20 font-semibold shadow-sm text-base">
                      <SelectValue placeholder="Selecione o canal identificado..." />
                    </SelectTrigger>
                    <SelectContent>
                      {canalOptions.map((canal) => (
                        <SelectItem key={canal} value={canal} className="font-medium cursor-pointer py-3">{canal}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {pdvBuscado && tipoVisitaOptions.length > 0 && (
            <Card className="glass-card bg-card/40 border-primary/10 shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
              <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
                  <CardTitle className="text-lg font-bold text-foreground">3- TIPO DA VISITA</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-5 sm:pt-6">
                <RadioGroup value={form.tipo_visita} onValueChange={(v) => handleChange("tipo_visita", v)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {tipoVisitaOptions.map((option) => {
                    const isDisabled = false;
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
              </CardContent>
            </Card>
          )}
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
          {REQUER_PRODUTOS_EXECUCAO.includes(form.tipo_visita) && (
            <StepProdutosExecucao
              canalCadastrado={form.canal_cadastrado}
              tipoVisita={form.tipo_visita}
              onSubmit={(produtos: string[], execucoes: string[], pontuacao: number, rgbData?: RgbSubmitData, fdsData?: any, produtosNaoSelecionados?: string[], execucaoNaoSelecionada?: string[], respostasDinamicas?: Record<string, string>) => handleSubmitFinal({
                produtosSelecionados: produtos,
                execucaoSelecionada: execucoes,
                pontuacaoTotal: pontuacao,
                rgbData: rgbData,
                fdsData: fdsData,
                produtosNaoSelecionados: produtosNaoSelecionados,
                execucaoNaoSelecionada: execucaoNaoSelecionada,
                respostasDinamicas: respostasDinamicas
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

export default NovaVisita;
