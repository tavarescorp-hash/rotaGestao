import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { enviarVisita, verificarVisitaMensal } from "@/features/visitas/api/visitas.service";
import { buscarPdvPorCodigo } from "@/features/pdvs/api/pdvs.service";
import { RgbSubmitData } from "@/features/visitas/components/StepProdutosExecucao";
import { CoachingSubmitData } from "@/features/visitas/components/StepCoaching";

export function useVisitaForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isSearchingPdv, setIsSearchingPdv] = useState(false);
  const [pdvBuscado, setPdvBuscado] = useState(false);

  const initialFormState = {
    data_visita: new Date().toISOString().split("T")[0],
    tipo_visita: "",
    observacoes: "",
    codigo_pdv: "",
    nome_fantasia_pdv: "",
    potencial_cliente: "",
    canal_identificado: "",
    canal_cadastrado: "",
    filial: user?.unidade?.toUpperCase().includes('MACAE') || user?.unidade?.toUpperCase().includes('MACAÉ') ? "M" : "C",
    municipio: "",
    codigo_vendedor: "",
    nome_vendedor: "",
    coorden_x: "",
    coorden_y: "",
  };

  const [form, setForm] = useState(initialFormState);

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
      const prefixo = form.filial || "C";
      const codigoBusca = form.codigo_pdv.match(/^\d+$/) ? `${prefixo}${form.codigo_pdv}` : form.codigo_pdv;

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

      const pdvData = await buscarPdvPorCodigo(codigoBusca, user);
      if (pdvData) {
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
          title: "Cliente não encontrado",
          description: "O código não foi encontrado na base de dados. Não é possível prosseguir.",
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
    execucaoNaoSelecionada?: string[];
    respostasDinamicas?: Record<string, string>;
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
      execucao_nao_selecionada: payload.execucaoNaoSelecionada ? payload.execucaoNaoSelecionada.join("; ") : "",
      empresa_id: user?.empresa_id || 1,
      respostas_json_dynamic: payload.respostasDinamicas || {},
      id_avaliador: user?.id,
    });

    toast({
      title: result.success ? "Sucesso!" : "Erro",
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });

    if (result.success) {
      setForm(initialFormState);
      setPdvBuscado(false);
      window.scrollTo(0, 0);
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return {
    user,
    form,
    loading,
    isSearchingPdv,
    pdvBuscado,
    handleChange,
    handlePesquisarPdv,
    handleSubmitFinal,
    setPdvBuscado
  };
}
