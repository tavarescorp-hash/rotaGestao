import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { canalProdutosExecucao } from "@/lib/canalData";
import { buscarFdsPorCanal, getConfiguracao } from "@/lib/api";
import { INDICADORES_TIPO_RGB, INDICADORES_COMPASS_LOCKED, INDICADORES_QUEDAS_LOCKED } from "@/lib/roles";
import { useAuth } from "@/contexts/AuthContext";

export interface RgbSubmitData {
  rgb_foco_visita: string;
  rgb_comprando_outras: string;
  rgb_ttc_adequado: string;
  rgb_acao_concorrencia: string;
  rgb_observacoes?: string;
}

export interface FdsSubmitData {
  fds_qtd_skus: string;
  fds_refrigerador: string;
  fds_posicionamento: string;
  fds_refrigerados: string;
  fds_precificados: string;
  fds_melhoria_precificacao: string;
}

// Removed duplicate StepProdutosExecucaoProps definition

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

type ConfigType = { produtos: { nome: string; pontos: number }[], execucao: { nome: string; pontos: number }[] } | null;

interface SubmitFnPops {
  (
    produtosSelecionados: string[],
    execucaoSelecionada: string[],
    pontuacaoTotal: number,
    rgbData?: RgbSubmitData,
    fdsData?: FdsSubmitData,
    produtosNaoSelecionados?: string[]
  ): void;
}

interface StepProdutosExecucaoProps {
  canalCadastrado: string;
  tipoVisita: string;
  onSubmit: SubmitFnPops;
  loading: boolean;
}

const StepProdutosExecucao = ({ canalCadastrado, tipoVisita, onSubmit, loading }: StepProdutosExecucaoProps) => {
  const { user } = useAuth();
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [execucaoSelecionada, setExecucaoSelecionada] = useState<string[]>([]);
  const [config, setConfig] = useState<ConfigType>(null);
  const [isFetchingConfig, setIsFetchingConfig] = useState(true);

  // RGB States
  const [rgbFocoVisita, setRgbFocoVisita] = useState("");
  const [isFocoRgbLocked, setIsFocoRgbLocked] = useState(false);
  const [rgbComprandoOutras, setRgbComprandoOutras] = useState("");
  const [rgbTtcAdequado, setRgbTtcAdequado] = useState("");
  const [rgbAcaoConcorrencia, setRgbAcaoConcorrencia] = useState("");
  const [rgbAcaoConcorrenciaOutro, setRgbAcaoConcorrenciaOutro] = useState("");
  const [rgbObservacoes, setRgbObservacoes] = useState("");

  const isRgb = INDICADORES_TIPO_RGB.includes(tipoVisita);
  
  // FDS States
  const [fdsQtdSkus, setFdsQtdSkus] = useState("");
  const [fdsRefrigerador, setFdsRefrigerador] = useState("");
  const [fdsPosicionamento, setFdsPosicionamento] = useState("");
  const [fdsPosicionamentoOutro, setFdsPosicionamentoOutro] = useState("");
  const [fdsRefrigerados, setFdsRefrigerados] = useState("");
  const [fdsPrecificados, setFdsPrecificados] = useState("");
  const [fdsMelhoriaPrecificacao, setFdsMelhoriaPrecificacao] = useState("");
  const [fdsObservacoes, setFdsObservacoes] = useState("");

  const isRgbValid = isRgb
    ? rgbFocoVisita && rgbComprandoOutras && rgbTtcAdequado && (rgbAcaoConcorrencia && (rgbAcaoConcorrencia !== "Outro" || rgbAcaoConcorrenciaOutro.trim() !== "")) && rgbObservacoes.trim() !== ""
    : true;

  const isFds = tipoVisita === "FDS";
  const isFdsValid = isFds
    ? !!(
        fdsQtdSkus &&
        fdsRefrigerador &&
        fdsPosicionamento &&
        (fdsPosicionamento !== "Outro:" || fdsPosicionamentoOutro.trim() !== "") &&
        fdsRefrigerados &&
        fdsPrecificados &&
        (fdsPrecificados === "SIM" || (fdsPrecificados === "NÃO" && fdsMelhoriaPrecificacao.trim() !== "")) &&
        fdsObservacoes.trim() !== ""
      )
    : true;

  const handleFinalizar = () => {
    let rgbData = undefined;
    if (isRgb) {
      rgbData = {
        rgb_foco_visita: rgbFocoVisita,
        rgb_comprando_outras: rgbComprandoOutras,
        rgb_ttc_adequado: rgbTtcAdequado,
        rgb_acao_concorrencia: rgbAcaoConcorrencia === "Outro" ? `Outro: ${rgbAcaoConcorrenciaOutro}` : rgbAcaoConcorrencia,
        rgb_observacoes: rgbObservacoes,
      };
    }

    let fdsData = undefined;
    if (isFds) {
      fdsData = {
        fds_qtd_skus: fdsQtdSkus,
        fds_refrigerador: fdsRefrigerador,
        fds_posicionamento: fdsPosicionamento === "Outro:" ? `Outro: ${fdsPosicionamentoOutro}` : fdsPosicionamento,
        fds_refrigerados: fdsRefrigerados,
        fds_precificados: fdsPrecificados,
        fds_melhoria_precificacao: fdsPrecificados === "SIM" ? "" : fdsMelhoriaPrecificacao,
        fds_observacoes: fdsObservacoes,
      };
    }

    // Calcular Gaps (Produtos Não Selecionados)
    const produtosNaoSelecionados = config 
      ? config.produtos.map(p => p.nome).filter(nome => !produtosSelecionados.includes(nome))
      : [];

    onSubmit(produtosSelecionados, execucaoSelecionada, pontuacaoTotal, rgbData, fdsData, produtosNaoSelecionados);
  };

  useEffect(() => {
    const loadConfig = async () => {
      setIsFetchingConfig(true);
      // Busca dinamicamente do Supabase para QUALQUER indicador (FDS ou RGB)
      // para garantir que use a lógica NFD de blindagem de acentos e o portfólio novo
      const data = await buscarFdsPorCanal(canalCadastrado);
      if (data && (data.produtos.length > 0 || data.execucao.length > 0)) {
        setConfig(data);
      } else {
        setConfig(null); // Nenhum dado achado na tabela
      }
      setIsFetchingConfig(false);
    };

    const loadGlobalConfigurations = async () => {
      if (INDICADORES_COMPASS_LOCKED.includes(tipoVisita)) {
        setRgbFocoVisita("RGB - Maiores COMPASS não compradores");
        setIsFocoRgbLocked(true);
      } else if (INDICADORES_QUEDAS_LOCKED.includes(tipoVisita)) {
        setRgbFocoVisita("RGB - Maiores quedas");
        setIsFocoRgbLocked(true);
      } else if (isRgb) {
        const focoRgbGlobal = await getConfiguracao('foco_rgb_mes', user);
        if (focoRgbGlobal && focoRgbGlobal !== 'Nenhum') {
          setRgbFocoVisita(focoRgbGlobal);
          setIsFocoRgbLocked(true);
        } else {
          setIsFocoRgbLocked(false);
        }
      }
    };

    // Reseta as seleções toda vez que o canal ou o tipo de visita mudam
    // Isso evita que produtos de um PDV anterior fiquem "presos" na memória e somem pontos
    setProdutosSelecionados([]);
    setExecucaoSelecionada([]);

    loadConfig();
    loadGlobalConfigurations();
  }, [canalCadastrado, tipoVisita, isRgb]);

  const pontuacaoProdutos = useMemo(() => {
    if (!config) return 0;
    return config.produtos
      .filter((p) => produtosSelecionados.includes(p.nome))
      .reduce((acc, p) => acc + p.pontos, 0);
  }, [produtosSelecionados, config]);

  const pontuacaoExecucao = useMemo(() => {
    if (!config) return 0;
    // Em FDS ou RGB, os pontos já estão atrelados ao Produto na mesma linha do banco.
    // Para não duplicar a pontuação de Produtos e Execução na somatória total de 100 pontos,
    // a execução vale 0 pontos na conta matemática (pois o produto já pontuou).
    return config.execucao
      .filter((e) => execucaoSelecionada.includes(e.nome))
      .reduce((acc, e) => {
        // A execução não soma pontos matemáticos extras (evita duplicar teto de 100)
        return acc;
      }, 0);
  }, [execucaoSelecionada, config, tipoVisita]);

  const pontuacaoTotal = pontuacaoProdutos + pontuacaoExecucao;

  const toggleProduto = (nome: string) => {
    setProdutosSelecionados((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome]
    );
  };

  const toggleExecucao = (nome: string) => {
    setExecucaoSelecionada((prev) =>
      prev.includes(nome) ? prev.filter((n) => n !== nome) : [...prev, nome]
    );
  };

  if (isFetchingConfig) {
    return (
      <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden min-h-[400px] flex items-center justify-center">
        <CardContent className="py-10 text-center flex flex-col items-center justify-center text-muted-foreground w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary relative z-10" />
          </div>
          <p className="font-semibold mt-4 text-foreground/80 animate-pulse">Carregando indicadores...</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden min-h-[400px] flex items-center justify-center">
        <CardContent className="py-10 text-center text-muted-foreground w-full space-y-6">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-2">Sem Indicadores</h3>
            <p>Nenhum dado encontrado para o canal <span className="text-primary font-bold">"{canalCadastrado}"</span>{tipoVisita === "FDS" ? " no Supabase" : ""}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Score summary - Highlighted Top Bar */}
      <Card className="glass-card bg-primary/5 border-primary/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
        <CardContent className="py-5 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              ⭐
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground block">Desempenho</span>
              <span className="text-lg font-extrabold text-foreground">Pontuação Total</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-background/40 p-2 rounded-xl border border-white/5">
            <div className="flex flex-col items-center px-3">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Produtos</span>
              <span className="font-bold text-foreground">{pontuacaoProdutos}</span>
            </div>
            <div className="w-px h-8 bg-border/50"></div>
            <div className="flex items-center justify-center px-4 bg-primary text-primary-foreground rounded-lg h-full shadow-inner">
              <span className="text-xl font-black">{pontuacaoTotal}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products */}
        <Card className="glass-card bg-card/40 border-primary/10 shadow-xl flex flex-col h-full">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-bold">📦</div>
              <div>
                <CardTitle className="text-lg font-bold">Produtos</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mix encontrado no PDV</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 overflow-y-auto max-h-[500px]">
            {config.produtos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum produto listado para este canal.</div>
            ) : (
              <div className="space-y-3">
                {config.produtos.map((produto) => {
                  const isChecked = produtosSelecionados.includes(produto.nome);
                  return (
                    <label
                      key={produto.nome}
                      className={`
                          flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                          ${isChecked
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/40 bg-background/30 hover:border-primary/50 hover:bg-muted/30'
                        }
                        `}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleProduto(produto.nome)}
                        className={`w-5 h-5 rounded shrink-0 ${isChecked ? 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' : ''}`}
                      />
                      <span className={`text-sm font-semibold flex-1 leading-tight break-words pr-2 ${isChecked ? 'text-foreground' : 'text-foreground/80'}`}>
                        {produto.nome}
                      </span>
                      <Badge
                        variant={isChecked ? "default" : "secondary"}
                        className={`text-xs shrink-0 font-bold ${isChecked ? 'shadow-sm shadow-primary/20' : 'opacity-70'}`}
                      >
                        +{produto.pontos}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution */}
        <Card className="glass-card bg-card/40 border-primary/10 shadow-xl flex flex-col h-full">
          <CardHeader className="pb-4 border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-bold">🎯</div>
              <div>
                <CardTitle className="text-lg font-bold">Execução</CardTitle>
                <CardDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Itens de execução aferidos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1 overflow-y-auto max-h-[500px]">
            {config.execucao.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma regra de execução para este canal.</div>
            ) : (
              <div className="space-y-3">
                {config.execucao.map((item) => {
                  const isChecked = execucaoSelecionada.includes(item.nome);
                  return (
                    <label
                      key={item.nome}
                      className={`
                          flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                          ${isChecked
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/40 bg-background/30 hover:border-primary/50 hover:bg-muted/30'
                        }
                        `}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleExecucao(item.nome)}
                        className={`w-5 h-5 rounded shrink-0 ${isChecked ? 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' : ''}`}
                      />
                      <span className={`text-sm font-semibold flex-1 leading-tight break-words pr-2 ${isChecked ? 'text-foreground' : 'text-foreground/80'}`}>
                        {item.nome}
                      </span>
                      <Badge
                        variant={isChecked ? "default" : "secondary"}
                        className={`text-xs shrink-0 font-bold ${isChecked ? 'shadow-sm shadow-primary/20' : 'opacity-70'}`}
                      >
                        {tipoVisita === "FDS" ? (
                          <span className="text-[10px] uppercase font-normal tracking-wider">Vinculado</span>
                        ) : (
                          <>+{item.pontos}</>
                        )}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FDS Específico */}
      {isFds && (
        <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <CardHeader className="pb-3 sm:pb-4 border-b border-border/40 p-4 sm:p-6 bg-card/40">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
              <CardTitle className="text-lg font-bold text-foreground">4- PERGUNTAS FDS</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                Quantos SKUs há no PDV? <span className="text-destructive ml-1">*</span>
              </Label>
              <Select value={fdsQtdSkus} onValueChange={setFdsQtdSkus}>
                <SelectTrigger className="h-12 bg-background/50 focus:ring-primary border-primary/20 font-semibold shadow-sm text-base">
                  <SelectValue placeholder="Selecione a quantidade de SKUs..." />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Não, 1  SKU",
                    "Não, 2  SKUs",
                    "Não, 3  SKUs",
                    "Não, 4  SKUs",
                    "Não, 5  SKUs",
                    "Sim, 6  SKUs",
                    "Sim, 7  SKUs",
                    "Sim, 8  SKUs",
                    "Sim, 9  SKUs",
                    "Sim, 10 SKUs",
                    "Sim, +10 SKUs",
                    "Nenhum SKU no PDV."
                  ].map((opt) => (
                    <SelectItem key={opt} value={opt} className="font-medium cursor-pointer py-3">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                PDV POSSUI ALGUM REFRIGERADOR? <span className="text-destructive ml-1">*</span>
              </Label>
              <RadioGroup 
                value={fdsRefrigerador} 
                onValueChange={(val) => {
                  setFdsRefrigerador(val);
                  if (val === "PDV NÃO POSSUI GELADEIRA OU POSSUI APENAS GELADEIRA DA CONCORRÊNCIA" || val === "PDV POSSUI APENAS GELADEIRA SEM MARCA") {
                    setFdsPosicionamento("NÃO POSSUI REFRIGERADOR DA CIA");
                  } else {
                    setFdsPosicionamento("");
                  }
                }} 
                className="grid gap-3"
              >
                {[
                  "PDV NÃO POSSUI GELADEIRA OU POSSUI APENAS GELADEIRA DA CONCORRÊNCIA",
                  "PDV POSSUI APENAS GELADEIRA SEM MARCA",
                  "PDV POSSUI GELADEIRA DA CIA"
                ].map((opt) => (
                  <Label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${fdsRefrigerador === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                    <RadioGroupItem value={opt} />
                    <span className="text-sm font-semibold leading-tight">{opt}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {fdsRefrigerador && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                    POSICIONAMENTO: O REFRIGERADOR DA CIA ESTÁ COM NO MÍNIMO 50% ABASTECIDO COM A MARCA DA GELADEIRA? <span className="text-destructive ml-1">*</span>
                  </Label>
                  <RadioGroup value={fdsPosicionamento} onValueChange={setFdsPosicionamento} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(fdsRefrigerador === "PDV POSSUI GELADEIRA DA CIA" 
                      ? [
                          "Não, 10% da marca do equipamento",
                          "Não, 25% da marca do equipamento",
                          "Sim, 50% da marca do equipamento",
                          "Sim, 75% da marca do equipamento",
                          "Sim, 100% da marca do equipamento",
                          "Outro:"
                        ]
                      : [
                          "NÃO POSSUI REFRIGERADOR DA CIA",
                          "Outro:"
                        ]
                    ).map((opt) => (
                      <Label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${fdsPosicionamento === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                        <RadioGroupItem value={opt} />
                        <span className="text-sm font-semibold">{opt === "Outro:" ? "Outro:" : opt}</span>
                      </Label>
                    ))}
                  </RadioGroup>

                  {fdsPosicionamento === "Outro:" && (
                    <div className="pl-8 pt-2 animate-in fade-in slide-in-from-top-2">
                      <Input
                        placeholder="Especifique o posicionamento do refrigerador..."
                        value={fdsPosicionamentoOutro}
                        onChange={(e) => setFdsPosicionamentoOutro(e.target.value)}
                        className="h-12 bg-background/50"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                    OS PRODUTOS DA MARCA DA CIA ESTÃO DEVIDAMENTE REFRIGERADOS? <span className="text-destructive ml-1">*</span>
                  </Label>
                  <RadioGroup value={fdsRefrigerados} onValueChange={setFdsRefrigerados} className="flex gap-4">
                    {["SIM", "NÃO"].map((opt) => (
                      <Label key={opt} className={`flex-1 flex items-center justify-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${fdsRefrigerados === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                        <RadioGroupItem value={opt} />
                        <span className="text-sm font-semibold">{opt}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                    TODOS OS SKUs OBRIGATÓRIOS PRESENTES ESTÃO PRECIFICADOS? <span className="text-destructive ml-1">*</span>
                  </Label>
                  <RadioGroup value={fdsPrecificados} onValueChange={setFdsPrecificados} className="flex gap-4">
                    {["SIM", "NÃO"].map((opt) => (
                      <Label key={opt} className={`flex-1 flex items-center justify-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${fdsPrecificados === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                        <RadioGroupItem value={opt} />
                        <span className="text-sm font-semibold">{opt}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                {fdsPrecificados === "NÃO" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                      SE NÃO, O QUE PODE SER FEITO PARA MELHORAR A PRECIFICAÇÃO? <span className="text-destructive ml-1">*</span>
                    </Label>
                    <Input
                      placeholder="Escreva como você vai atuar para resolver o problema de precificação..."
                      value={fdsMelhoriaPrecificacao}
                      onChange={(e) => setFdsMelhoriaPrecificacao(e.target.value)}
                      className="h-12 bg-background/50"
                    />
                  </div>
                )}

                <div className="space-y-4 pt-4 border-t border-border/20">
                  <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                    OBSERVAÇÕES/ PLANO DE AÇÃO <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input
                    placeholder="Escreva suas observações ou plano de ação..."
                    value={fdsObservacoes}
                    onChange={(e) => setFdsObservacoes(e.target.value)}
                    className="h-12 bg-background/50"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FOCO RGB Questions */}
      {isRgb && (
        <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="pt-6 space-y-8">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                Qual o foco da visita? <span className="text-destructive ml-1">*</span>
              </Label>
              <RadioGroup value={rgbFocoVisita} onValueChange={setRgbFocoVisita} className={`grid gap-3 ${isFocoRgbLocked ? "opacity-90 pointer-events-none" : ""}`} disabled={isFocoRgbLocked}>
                {(() => {
                  const allOptions = ["RGB - Maiores clientes", "RGB - Maiores quedas", "RGB - Maiores COMPASS não compradores"];
                  let visibleOptions = allOptions;

                  if (isFocoRgbLocked) {
                    if (INDICADORES_COMPASS_LOCKED.includes(tipoVisita)) {
                      visibleOptions = ["RGB - Maiores COMPASS não compradores"];
                    } else if (INDICADORES_QUEDAS_LOCKED.includes(tipoVisita)) {
                      visibleOptions = ["RGB - Maiores quedas"];
                    } else if (rgbFocoVisita) {
                      visibleOptions = [rgbFocoVisita];
                    }
                  }

                  return visibleOptions.map((opt) => (
                    <Label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isFocoRgbLocked ? "cursor-not-allowed border-primary bg-primary/5 shadow-sm" : "cursor-pointer"} ${rgbFocoVisita === opt ? "border-primary bg-primary/5 shadow-sm" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                      <RadioGroupItem value={opt} id={opt} />
                      <span className="text-sm font-semibold">{opt}</span>
                    </Label>
                  ));
                })()}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                O cliente está comprando nossos produtos de outra fonte? <span className="text-destructive ml-1">*</span>
              </Label>
              <RadioGroup value={rgbComprandoOutras} onValueChange={setRgbComprandoOutras} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {["Sim", "Não", "Não quis informar"].map((opt) => (
                  <Label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${rgbComprandoOutras === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                    <RadioGroupItem value={opt} />
                    <span className="text-sm font-semibold">{opt}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                O TTC está de acordo com a régua de preço recomendado? <span className="text-destructive ml-1">*</span>
              </Label>
              <RadioGroup value={rgbTtcAdequado} onValueChange={setRgbTtcAdequado} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Sim", "Não"].map((opt) => (
                  <Label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${rgbTtcAdequado === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                    <RadioGroupItem value={opt} />
                    <span className="text-sm font-semibold">{opt}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                Há alguma ação vigente da concorrência no PDV? <span className="text-destructive ml-1">*</span>
              </Label>
              <RadioGroup value={rgbAcaoConcorrencia} onValueChange={setRgbAcaoConcorrencia} className="grid gap-3">
                {[
                  "Sim, ação de preço para volume.",
                  "Sim, ação promocional para consumidor final.",
                  "Sim, contrato de visibilidade/exclusividade.",
                  "Não.",
                  "Outro"
                ].map((opt) => (
                  <Label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${rgbAcaoConcorrencia === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                    <RadioGroupItem value={opt} />
                    <span className="text-sm font-semibold">{opt === "Outro" ? "Outro:" : opt}</span>
                  </Label>
                ))}
              </RadioGroup>

              {rgbAcaoConcorrencia === "Outro" && (
                <div className="pl-8 pt-2 animate-in fade-in slide-in-from-top-2">
                  <Input
                    placeholder="Descreva a ação da concorrência..."
                    value={rgbAcaoConcorrenciaOutro}
                    onChange={(e) => setRgbAcaoConcorrenciaOutro(e.target.value)}
                    className="h-12 bg-background/50"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-border/40">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                OBSERVAÇÕES/ PLANO DE AÇÃO <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                placeholder="Detalhes, justificativas ou plano de ação para a visita..."
                value={rgbObservacoes}
                onChange={(e) => setRgbObservacoes(e.target.value)}
                className="min-h-[100px] resize-y bg-background/50 focus:ring-primary border-primary/20 shadow-sm"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-border/40">
        <Button
          type="button"
          disabled={loading || !isRgbValid || !isFdsValid}
          onClick={handleFinalizar}
          className="flex-1 h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Registrando Visita...</>
          ) : (
            <><Save className="w-5 h-5 mr-3" /> Salvar Visita e Finalizar</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default StepProdutosExecucao;
