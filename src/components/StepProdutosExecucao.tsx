import { useState, useMemo, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { canalProdutosExecucao } from "@/lib/canalData";
import { buscarFdsPorCanal } from "@/lib/api";

interface StepProdutosExecucaoProps {
  canalCadastrado: string;
  tipoVisita: string;
  onBack: () => void;
  onSubmit: (produtosSelecionados: string[], execucaoSelecionada: string[], pontuacaoTotal: number) => void;
  loading: boolean;
}

type ConfigType = { produtos: { nome: string; pontos: number }[], execucao: { nome: string; pontos: number }[] } | null;

const StepProdutosExecucao = ({ canalCadastrado, tipoVisita, onBack, onSubmit, loading }: StepProdutosExecucaoProps) => {
  const [produtosSelecionados, setProdutosSelecionados] = useState<string[]>([]);
  const [execucaoSelecionada, setExecucaoSelecionada] = useState<string[]>([]);
  const [config, setConfig] = useState<ConfigType>(null);
  const [isFetchingConfig, setIsFetchingConfig] = useState(true);

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
        // Usa o default local
        setConfig(canalProdutosExecucao[canalCadastrado] || null);
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
    return config.execucao
      .filter((e) => execucaoSelecionada.includes(e.nome))
      .reduce((acc, e) => acc + e.pontos, 0);
  }, [execucaoSelecionada, config]);

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
      <Card>
        <CardContent className="py-10 text-center flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
          <p>Buscando lista de indicadores...</p>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum dado encontrado para o canal "{canalCadastrado}"{tipoVisita === "FDS" ? " no Supabase" : ""}.
          <div className="mt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Pontuação Total</span>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs">
                Produtos: {pontuacaoProdutos}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Execução: {pontuacaoExecucao}
              </Badge>
              <Badge className="text-lg px-3 py-1">{pontuacaoTotal}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Produtos</CardTitle>
          <CardDescription>Marque os produtos encontrados no PDV</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {config.produtos.map((produto) => (
              <label
                key={produto.nome}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted/80 transition-colors"
              >
                <Checkbox
                  checked={produtosSelecionados.includes(produto.nome)}
                  onCheckedChange={() => toggleProduto(produto.nome)}
                />
                <span className="text-sm flex-1">{produto.nome}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {produto.pontos} pts
                </Badge>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Execution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execução</CardTitle>
          <CardDescription>Marque os itens de execução encontrados no PDV</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {config.execucao.map((item) => (
              <label
                key={item.nome}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted/80 transition-colors"
              >
                <Checkbox
                  checked={execucaoSelecionada.includes(item.nome)}
                  onCheckedChange={() => toggleExecucao(item.nome)}
                />
                <span className="text-sm flex-1">{item.nome}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {item.pontos} pts
                </Badge>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={() => onSubmit(produtosSelecionados, execucaoSelecionada, pontuacaoTotal)}
          className="flex-1"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Visita
        </Button>
      </div>
    </div>
  );
};

export default StepProdutosExecucao;
