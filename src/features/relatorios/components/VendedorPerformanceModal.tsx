import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  Target, 
  Award, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  UserCircle,
  Briefcase
} from "lucide-react";
import { Visita } from "@/features/visitas/api/visitas.service";

interface VendedorPerformanceModalProps {
  vendedor: {
    nome_vendedor: string;
    filial?: string;
    gerente?: string;
    nome_supervisor?: string;
    visitas_recebidas: Visita[];
    metricas: {
      fds: number;
      rgb: number;
      coaching: number;
      total: number;
    };
  } | null;
  onClose: () => void;
  onSelectVisita: (visita: Visita) => void;
}

export function VendedorPerformanceModal({ vendedor, onClose, onSelectVisita }: VendedorPerformanceModalProps) {
  if (!vendedor) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const [a, m, d] = dateStr.split("-");
    return a && m && d ? `${d}/${m}/${a}` : dateStr;
  };

  return (
    <Dialog open={!!vendedor} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="px-6 py-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 shadow-inner">
              <UserCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                {vendedor.nome_vendedor}
              </DialogTitle>
              <DialogDescription className="font-bold text-xs flex items-center gap-4 text-muted-foreground uppercase tracking-widest">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> Vendedor</span>
                <span>•</span>
                <span>{vendedor.filial || "Sem Unidade"}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-6 py-6">
            <div className="space-y-6">
              {/* Resumo de Performance */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="glass-card shadow-sm border-primary/10">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <Target className="w-4 h-4 text-primary mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">FDS</span>
                    <span className="text-xl font-black text-foreground">{vendedor.metricas.fds}</span>
                  </CardContent>
                </Card>

                <Card className="glass-card shadow-sm border-blue-500/10">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <TrendingUp className="w-4 h-4 text-blue-500 mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">RGB</span>
                    <span className="text-xl font-black text-foreground">{vendedor.metricas.rgb}</span>
                  </CardContent>
                </Card>

                <Card className="glass-card shadow-sm border-amber-500/10">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <Award className="w-4 h-4 text-amber-500 mb-1" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Coaching</span>
                    <span className="text-xl font-black text-foreground">{vendedor.metricas.coaching}</span>
                  </CardContent>
                </Card>
              </div>

              {/* Hierarquia Vinculada */}
              <div className="bg-muted/30 rounded-xl p-4 border border-border/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Supervisor</span>
                  <span className="text-sm font-bold">{vendedor.nome_supervisor || "Não informado"}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Gerente de Vendas</span>
                  <span className="text-sm font-bold">{vendedor.gerente || "Não informado"}</span>
                </div>
              </div>

              {/* Lista de Visitas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Histórico de Visitas ({vendedor.visitas_recebidas.length})
                  </h4>
                </div>

                <div className="space-y-3">
                  {vendedor.visitas_recebidas.length > 0 ? (
                    vendedor.visitas_recebidas.map((vis, idx) => (
                      <div 
                        key={idx} 
                        className="group p-4 bg-card border border-border/60 rounded-xl flex items-center justify-between hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer shadow-sm"
                        onClick={() => onSelectVisita(vis)}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                               {vis.nome_fantasia_pdv || "PDV Sem Nome"}
                             </span>
                             <Badge variant="outline" className="text-[9px] font-black py-0 px-1.5 uppercase bg-background">
                               {vis.indicador_avaliado === 'FDS' ? 'FDS' : vis.indicador_avaliado?.includes('RGB') ? 'RGB' : 'Coaching'}
                             </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-bold">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(vis.data_visita)}</span>
                            <span>•</span>
                            <span>Por: {vis.avaliador}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center border-2 border-dashed border-border/40 rounded-2xl">
                      <p className="text-xs font-bold text-muted-foreground italic">Nenhuma visita registrada para este vendedor no período.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
