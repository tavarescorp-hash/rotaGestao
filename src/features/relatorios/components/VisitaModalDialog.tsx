import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, MapPin, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getQuestionsForIndicator } from "@/lib/formulariosConfig";
import { Visita } from "@/features/visitas/api/visitas.service";

interface VisitaModalDialogProps {
  selectedVisita: Visita | null;
  onClose: () => void;
  actionFooter?: React.ReactNode;
}

export function VisitaModalDialog({ selectedVisita, onClose, actionFooter }: VisitaModalDialogProps) {
  if (!selectedVisita) return null;

  return (
    <Dialog open={!!selectedVisita} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-primary/20 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="px-6 py-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-primary" />
                Detalhes do Registro
              </DialogTitle>
              <DialogDescription className="mt-1 font-medium">
                {(() => {
                  const [a, m, d] = (selectedVisita.data_visita || "").split("-");
                  return a && m && d ? `${d}/${m}/${a}` : selectedVisita.data_visita;
                })()} • {selectedVisita?.unidade}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          <div className="space-y-6 pb-6">

            <div className="bg-card border border-border/50 p-6 rounded-xl shadow-sm space-y-5">
              {/* Linha 1 */}
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

              {/* Linha 2 */}
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

              {/* Linha 3 */}
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
              {/* Motor Dinâmico de Exibição ou Retrocompatibilidade */}
              {selectedVisita.respostas_json_dynamic && Object.keys(selectedVisita.respostas_json_dynamic).length > 0 ? (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl space-y-3 mb-6">
                  <h4 className="text-sm font-extrabold text-primary mb-3 uppercase tracking-widest flex items-center gap-2">
                    📋 Questionário: {selectedVisita.indicador_avaliado}
                  </h4>
                  {(() => {
                    const qs = getQuestionsForIndicator(selectedVisita.indicador_avaliado || "");
                    return qs.map(q => {
                      const answer = selectedVisita.respostas_json_dynamic?.[q.id];
                      if (!answer) return null;
                      return (
                        <div key={q.id}>
                          <span className="text-xs font-bold text-muted-foreground block">{q.label}</span>
                          <span className="text-sm font-semibold">{answer}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
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

                  {selectedVisita.indicador_avaliado === "FDS" && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-xl space-y-3 mb-6">
                      <h4 className="text-sm font-extrabold text-yellow-600 dark:text-yellow-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                        📋 Questionário FDS
                      </h4>
                      {selectedVisita.rgb_acao_concorrencia && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">Ação da concorrência?</span>
                          <span className="text-sm font-semibold">{selectedVisita.rgb_acao_concorrencia}</span>
                        </div>
                      )}
                      {selectedVisita.fds_qtd_skus && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">Quantos SKUs há no PDV?</span>
                          <span className="text-sm font-semibold">{selectedVisita.fds_qtd_skus}</span>
                        </div>
                      )}
                      {selectedVisita.fds_refrigerador && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">Possui Refrigerador?</span>
                          <span className="text-sm font-semibold">{selectedVisita.fds_refrigerador}</span>
                        </div>
                      )}
                      {selectedVisita.fds_posicionamento && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">Posicionamento Geladeira Cia</span>
                          <span className="text-sm font-semibold">{selectedVisita.fds_posicionamento}</span>
                        </div>
                      )}
                      {selectedVisita.fds_refrigerados && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">Devidamente refrigerados?</span>
                          <span className="text-sm font-semibold">{selectedVisita.fds_refrigerados}</span>
                        </div>
                      )}
                      {selectedVisita.fds_precificados && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">SKUs obrigatórios precificados?</span>
                          <span className="text-sm font-semibold">{selectedVisita.fds_precificados}</span>
                        </div>
                      )}
                      {selectedVisita.fds_melhoria_precificacao && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">Plano p/ melhorar precificação</span>
                          <span className="text-sm font-semibold">{selectedVisita.fds_melhoria_precificacao}</span>
                        </div>
                      )}
                      {selectedVisita.fds_observacoes && (
                        <div>
                          <span className="text-xs font-bold text-muted-foreground block">Observações / Plano (FDS)</span>
                          <span className="text-sm font-semibold">{selectedVisita.fds_observacoes}</span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
