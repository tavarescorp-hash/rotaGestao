import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Calendar, MapPin, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { getQuestionsForIndicator } from "@/lib/formulariosConfig";
import { Visita } from "@/features/visitas/api/visitas.service";
import { REQUER_PRODUTOS_EXECUCAO, REQUER_COACHING } from "@/lib/roles";

interface VisitaModalDialogProps {
  selectedVisita: Visita | null;
  onClose: () => void;
  actionFooter?: React.ReactNode;
}

export function VisitaModalDialog({ selectedVisita, onClose, actionFooter }: VisitaModalDialogProps) {
  if (!selectedVisita) return null;

  return (
    <Dialog open={!!selectedVisita} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-none bg-background/95 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="p-8 pb-6 border-b border-border/10 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
              <ClipboardList className="w-7 h-7" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight text-foreground">
                Detalhes do Registro
              </DialogTitle>
              <DialogDescription className="mt-1 font-black text-[10px] uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                {(() => {
                  const [a, m, d] = (selectedVisita.data_visita || "").split("-");
                  return a && m && d ? `${d}/${m}/${a}` : selectedVisita.data_visita;
                })()} 
                <span className="w-1 h-1 rounded-full bg-primary" />
                {selectedVisita?.unidade}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
          <div className="space-y-8 pb-8">

            <div className="bg-card/40 border border-border/40 p-6 rounded-[2rem] shadow-sm space-y-6">
              {/* Linha 1: Info Base */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-border/10">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Data</span>
                  <span className="text-sm font-black flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    {(() => {
                      const [a, m, d] = (selectedVisita.data_visita || "").split("-");
                      return a && m && d ? `${d}/${m}/${a}` : selectedVisita.data_visita;
                    })()}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Unidade</span>
                  <span className="text-sm font-black flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {selectedVisita.unidade}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Avaliador</span>
                  <span className="text-sm font-black text-foreground/80">{selectedVisita.avaliador}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Cargo</span>
                  <Badge variant="secondary" className="text-[9px] font-black py-1 bg-primary/10 text-primary border-none uppercase">{selectedVisita.cargo}</Badge>
                </div>
              </div>

              {/* Linha 2: PDV & Vendedor */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-border/10">
                <div className="col-span-2 lg:col-span-1 space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Vendedor</span>
                  <span className="text-sm font-black truncate block">
                    {selectedVisita.nome_vendedor || "-"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Código PDV</span>
                  <span className="text-sm font-black text-primary font-mono bg-primary/5 px-2 py-0.5 rounded-lg border border-primary/10 inline-block">{selectedVisita.codigo_pdv}</span>
                </div>
                <div className="col-span-2 lg:col-span-1 space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">PDV</span>
                  <span className="text-sm font-black truncate block" title={selectedVisita.nome_fantasia_pdv}>
                    {selectedVisita.nome_fantasia_pdv}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Potencial</span>
                  <span className="text-sm font-black">{selectedVisita.potencial_cliente || "-"}</span>
                </div>
              </div>

              {/* Linha 3: Canais e Indicador */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Canal Cad.</span>
                  <span className="text-sm font-black opacity-80">{selectedVisita.canal_cadastrado || "-"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-black text-muted-foreground/60 tracking-widest block">Canal Ident.</span>
                  <span className="text-sm font-black opacity-80">{selectedVisita.canal_identificado || selectedVisita.canal_cadastrado || "-"}</span>
                </div>
                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                  <span className="text-[9px] uppercase font-black text-primary block mb-2 tracking-widest">Indicador Avaliado</span>
                  <Badge className="bg-primary text-black font-black shadow-lg text-[10px] uppercase py-1.5 w-full block text-center rounded-xl border-none">
                    {selectedVisita.indicador_avaliado}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Dinâmico por Tipo de Visita */}
            <div className="space-y-8">
              {(() => {
                const indicadorUpper = (selectedVisita.indicador_avaliado || "").toUpperCase().trim();
                const isCoaching = REQUER_COACHING.some(rc => indicadorUpper.includes(rc.toUpperCase().trim()));
                const isProdExec = REQUER_PRODUTOS_EXECUCAO.some(rp => indicadorUpper.includes(rp.toUpperCase().trim()));

                return (
                  <>
                    {/* 1. Questionário Dinâmico */}
                    {selectedVisita.respostas_json_dynamic && Object.keys(selectedVisita.respostas_json_dynamic).length > 0 && (
                      <div className="bg-card/40 border border-border/40 p-6 rounded-[2rem] space-y-4">
                        <h4 className="text-xs font-black text-primary mb-4 uppercase tracking-[0.2em] flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><ClipboardList className="w-4 h-4" /></div>
                          Questionário: {selectedVisita.indicador_avaliado}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(() => {
                          const qs = getQuestionsForIndicator(selectedVisita.indicador_avaliado || "");
                          return qs.map(q => {
                            const answer = selectedVisita.respostas_json_dynamic?.[q.id];
                            if (!answer) return null;
                            return (
                              <div key={q.id} className="bg-background/40 p-3 rounded-xl border border-border/20">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">{q.label}</span>
                                <span className="text-sm font-black text-foreground/90">{answer}</span>
                              </div>
                            );
                          });
                        })()}
                        </div>
                      </div>
                    )}

                    {/* 2. Seção FDS / RGB (Mix e Execução) */}
                    {isProdExec && (
                      <div className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                          <h4 className="text-xs font-black text-foreground flex items-center gap-3 uppercase tracking-[0.2em]">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                            Mix e Execução
                          </h4>
                          <Badge className="font-black bg-emerald-500 text-black shadow-lg rounded-xl px-4 py-1.5 border-none">
                            SCORE: {selectedVisita.pontuacao_total} PTS
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 rounded-[2rem] bg-card/40 border border-border/40 shadow-sm">
                            <span className="text-[9px] uppercase font-black text-muted-foreground/60 mb-4 block tracking-[0.2em]">Produtos Localizados</span>
                            {selectedVisita.produtos_selecionados ? (
                              <ul className="space-y-2.5">
                                {selectedVisita.produtos_selecionados.split("; ").map((p, idx) => (
                                  <li key={idx} className="flex items-center gap-3 text-sm font-black text-foreground/80"><div className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(255,184,0,0.4)]" />{p}</li>
                                ))}
                              </ul>
                            ) : (<span className="text-sm text-muted-foreground font-black italic opacity-40">Nenhum produto listado</span>)}
                          </div>
                          <div className="p-6 rounded-[2rem] bg-card/40 border border-border/40 shadow-sm">
                            <span className="text-[9px] uppercase font-black text-muted-foreground/60 mb-4 block tracking-[0.2em]">Ativos de Execução</span>
                            {selectedVisita.execucao_selecionada ? (
                              <ul className="space-y-2.5">
                                {selectedVisita.execucao_selecionada.split("; ").map((e, idx) => (
                                  <li key={idx} className="flex items-center gap-3 text-sm font-black text-foreground/80"><div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(56,189,248,0.4)]" />{e}</li>
                                ))}
                              </ul>
                            ) : (<span className="text-sm text-muted-foreground font-black italic opacity-40">Nenhuma execução listada</span>)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Seção específica de COACHING */}
                    {isCoaching && (
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-xs font-black text-blue-500 mb-5 flex items-center gap-3 uppercase tracking-[0.2em]">
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div>
                            Passos da Rotina Básica
                          </h4>
                          <div className="p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 shadow-sm">
                            {selectedVisita.passos_coaching ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedVisita.passos_coaching.split("; ").map((p, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-background/40 rounded-2xl border border-blue-500/10">
                                    {p.includes("Não realizou") ? <XCircle className="w-4 h-4 text-destructive shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />}
                                    <span className="text-xs font-black text-foreground/80 tracking-tight">{p}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (<span className="text-sm text-muted-foreground italic font-black opacity-40">Nada computado</span>)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 px-2">Pontos Fortes</span>
                            <div className="p-6 text-sm font-black text-foreground/80 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 min-h-[120px] shadow-inner whitespace-pre-wrap leading-relaxed">
                              {selectedVisita.pontos_fortes || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-destructive px-2">A Desenvolver</span>
                            <div className="p-6 text-sm font-black text-foreground/80 bg-destructive/5 rounded-[2rem] border border-destructive/10 min-h-[120px] shadow-inner whitespace-pre-wrap leading-relaxed">
                              {selectedVisita.pontos_desenvolver || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Observações Gerais */}
            {selectedVisita.observacoes && (
              <div className="pt-8 border-t border-border/10">
                <h4 className="text-xs font-black text-foreground mb-4 flex items-center gap-3 uppercase tracking-[0.2em]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-amber-500" /></div>
                  Plano de Ação / Obs
                </h4>
                <div className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/10 text-sm font-black text-foreground/70 italic leading-relaxed whitespace-pre-wrap shadow-inner">
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
