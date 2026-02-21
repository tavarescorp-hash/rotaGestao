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
import { canalProdutosExecucao } from "@/lib/canalData";
import { buscarFdsPorCanal } from "@/lib/api";

export interface RgbSubmitData {
  rgb_foco_visita: string;
  rgb_comprando_outras: string;
  rgb_ttc_adequado: string;
  rgb_acao_concorrencia: string;
}

interface StepProdutosExecucaoProps {
  canalCadastrado: string;
  canalIdentificado: string;
  setCanalIdentificado: (v: string) => void;
  tipoVisita: string;
  onBack: () => void;
  onSubmit: (produtosSelecionados: string[], execucaoSelecionada: string[], pontuacaoTotal: number, rgbData?: RgbSubmitData) => void;
  loading: boolean;
}

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

const StepProdutosExecucao = ({ canalCadastrado, canalIdentificado, setCanalIdentificado, tipoVisita, onBack, onSubmit, loading }: StepProdutosExecucaoProps) => {
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [execucaoSelecionada, setExecucaoSelecionada] = useState<string[]>([]);
  const [config, setConfig] = useState<ConfigType>(null);
  const [isFetchingConfig, setIsFetchingConfig] = useState(true);

  // RGB States
  const [rgbFocoVisita, setRgbFocoVisita] = useState("");
  const [rgbComprandoOutras, setRgbComprandoOutras] = useState("");
  const [rgbTtcAdequado, setRgbTtcAdequado] = useState("");
  const [rgbAcaoConcorrencia, setRgbAcaoConcorrencia] = useState("");
  const [rgbAcaoConcorrenciaOutro, setRgbAcaoConcorrenciaOutro] = useState("");

  const isRgb = tipoVisita === "FOCO RGB" || tipoVisita === "FOCO MAIORES QUEDAS RGB";
  const isRgbValid = isRgb
    ? rgbFocoVisita && rgbComprandoOutras && rgbTtcAdequado && (rgbAcaoConcorrencia && (rgbAcaoConcorrencia !== "Outro" || rgbAcaoConcorrenciaOutro.trim() !== ""))
    : true;

  const handleFinalizar = () => {
    let rgbData = undefined;
    if (isRgb) {
      rgbData = {
        rgb_foco_visita: rgbFocoVisita,
        rgb_comprando_outras: rgbComprandoOutras,
        rgb_ttc_adequado: rgbTtcAdequado,
        rgb_acao_concorrencia: rgbAcaoConcorrencia === "Outro" ? `Outro: ${rgbAcaoConcorrenciaOutro}` : rgbAcaoConcorrencia,
      };
    }
    onSubmit(produtosSelecionados, execucaoSelecionada, pontuacaoTotal, rgbData);
  };

  useEffect(() => {
    const loadConfig = async () => {
      setIsFetchingConfig(true);
      if (tipoVisita === "FDS") {
        // Busca dinamicamente do Supabase
        const data = await buscarFdsPorCanal(canalCadastrado);
        if (data && (data.produtos.length > 0 || data.execucao.length > 0)) {
          setConfig(data);
        } else {
          setConfig(null); // Nenhum dado achado na tabela
        }
      } else {
        // Usa o default local buscando de forma insensível a maiúsculas/minúsculas se o canal possuir alguma variação
        const localCanalKey = Object.keys(canalProdutosExecucao).find(
          c => c.toLowerCase() === canalCadastrado.toLowerCase()
        );
        setConfig(localCanalKey ? canalProdutosExecucao[localCanalKey] : null);
      }
      setIsFetchingConfig(false);
    };

    loadConfig();
  }, [canalCadastrado, tipoVisita]);

  const pontuacaoProdutos = useMemo(() => {
    if (!config) return 0;
    return config.produtos
      .filter((p) => produtosSelecionados.includes(p.nome))
      .reduce((acc, p) => acc + p.pontos, 0);
  }, [produtosSelecionados, config]);

  const pontuacaoExecucao = useMemo(() => {
    if (!config) return 0;
    // Em FDS (do Supabase), os pontos já estão atrelados ao Produto na mesma linha.
    // Para não duplicar a pontuação de Produtos e Execução, se for FDS,
    // a execução vale 0 pontos na somatória (pois o produto já pontuou) OU
    // contamos apenas os pontos de execução se tivermos uma lógica diferente.
    // Conforme pedido, a somatória total deve ser 100 baseada na pontuação.
    // Por hora, mantemos a pontuação das execuções zerada se vier do Supabase FDS
    // (a API já passa os pontos para a execução, mas aqui garantimos que não duplique).
    return config.execucao
      .filter((e) => execucaoSelecionada.includes(e.nome))
      .reduce((acc, e) => {
        // Se for FDS, a execução não soma pontos extras (evita duplicar)
        if (tipoVisita === "FDS") return acc;
        return acc + e.pontos;
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
          <div className="pt-6">
            <Button variant="outline" onClick={onBack} className="h-12 px-8 font-semibold hover:bg-muted">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Identificação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* Nova Identificação Select */}
      <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
              Nova Identificação (Canal) <span className="text-destructive ml-1">*</span>
            </Label>
            <p className="text-xs text-muted-foreground font-semibold mb-2">
              Confirme ou altere o canal do PDV verificado no momento da visita.
            </p>
            <Select value={canalIdentificado} onValueChange={setCanalIdentificado}>
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

      {/* FOCO RGB Questions */}
      {isRgb && (
        <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="pt-6 space-y-8">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                Qual o foco da visita? <span className="text-destructive ml-1">*</span>
              </Label>
              <RadioGroup value={rgbFocoVisita} onValueChange={setRgbFocoVisita} className="grid gap-3">
                {["RGB - Maiores clientes", "RGB - Maiores quedas", "RGB - Maiores COMPASS não compradores"].map((opt) => (
                  <Label key={opt} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${rgbFocoVisita === opt ? "border-primary bg-primary/5" : "border-transparent bg-background/40 hover:bg-muted"}`}>
                    <RadioGroupItem value={opt} />
                    <span className="text-sm font-semibold">{opt}</span>
                  </Label>
                ))}
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

          </CardContent>
        </Card>
      )}

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
              <span className="text-xs font-semibold ml-1 opacity-80">pts</span>
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
                          flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                          ${isChecked
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/40 bg-background/30 hover:border-primary/50 hover:bg-muted/30'
                        }
                        `}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleProduto(produto.nome)}
                        className={`w-5 h-5 rounded ${isChecked ? 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' : ''}`}
                      />
                      <span className={`text-sm font-semibold flex-1 ${isChecked ? 'text-foreground' : 'text-foreground/80'}`}>
                        {produto.nome}
                      </span>
                      <Badge
                        variant={isChecked ? "default" : "secondary"}
                        className={`text-xs shrink-0 font-bold ${isChecked ? 'shadow-sm shadow-primary/20' : 'opacity-70'}`}
                      >
                        +{produto.pontos} <span className="opacity-70 ml-1 font-normal text-[10px]">pts</span>
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
                          flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                          ${isChecked
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/40 bg-background/30 hover:border-primary/50 hover:bg-muted/30'
                        }
                        `}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleExecucao(item.nome)}
                        className={`w-5 h-5 rounded ${isChecked ? 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground' : ''}`}
                      />
                      <span className={`text-sm font-semibold flex-1 ${isChecked ? 'text-foreground' : 'text-foreground/80'}`}>
                        {item.nome}
                      </span>
                      <Badge
                        variant={isChecked ? "default" : "secondary"}
                        className={`text-xs shrink-0 font-bold ${isChecked ? 'shadow-sm shadow-primary/20' : 'opacity-70'}`}
                      >
                        {tipoVisita === "FDS" ? (
                          <span className="text-[10px] uppercase font-normal tracking-wider">Vinculado</span>
                        ) : (
                          <>+{item.pontos} <span className="opacity-70 ml-1 font-normal text-[10px]">pts</span></>
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

      {/* Actions */}
      <div className="flex gap-4 pt-6 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="w-1/3 h-14 text-base font-semibold hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5 mr-no" /> Voltar
        </Button>
        <Button
          type="button"
          disabled={loading || !canalIdentificado || !isRgbValid}
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
