import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export interface CoachingSubmitData {
    passos_coaching: string[];
    pontos_fortes: string;
    pontos_desenvolver: string;
    observacoes: string;
}

interface StepCoachingProps {
    onSubmit: (data: CoachingSubmitData) => void;
    loading: boolean;
}

const PASSOS_OPCOES = [
    "PASSO 1: Planejamento",
    "PASSO 2: Leitura de Loja",
    "PASSO 3: FDS",
    "PASSO 4: Negociação",
    "PASSO 5: Fechamento e Acompanhamento",
];

const NENHUM_PASSO = "Não realizou nenhum dos 5 passos da rotina básica.";

const StepCoaching = ({ onSubmit, loading }: StepCoachingProps) => {
    const [passos, setPassos] = useState<string[]>([]);
    const [pontosFortes, setPontosFortes] = useState("");
    const [pontosDesenvolver, setPontosDesenvolver] = useState("");
    const [observacoes, setObservacoes] = useState("");

    const handlePassoChange = (passo: string, checked: boolean) => {
        if (passo === NENHUM_PASSO) {
            if (checked) {
                setPassos([NENHUM_PASSO]);
            } else {
                setPassos([]);
            }
            return;
        }

        if (checked) {
            setPassos((prev) => [...prev.filter((p) => p !== NENHUM_PASSO), passo]);
        } else {
            setPassos((prev) => prev.filter((p) => p !== passo));
        }
    };

    const handleSubmit = () => {
        onSubmit({
            passos_coaching: passos,
            pontos_fortes: pontosFortes,
            pontos_desenvolver: pontosDesenvolver,
            observacoes: observacoes,
        });
    };

    const isFormValid = passos.length > 0 && pontosFortes.trim() && pontosDesenvolver.trim() && observacoes.trim();

    return (
        <div className="space-y-6">
            {/* Title Card */}
            <Card className="glass-card bg-primary/5 border-primary/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[40px] rounded-full pointer-events-none" />
                <CardContent className="p-6 relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)]"></span>
                        <h2 className="text-xl font-extrabold text-foreground tracking-tight">Coaching Rota Básica</h2>
                    </div>
                    <p className="text-sm font-semibold text-muted-foreground">Avalie o desempenho do vendedor com base na rotina padrão.</p>
                </CardContent>
            </Card>

            {/* Form Fields */}
            <Card className="glass-card bg-card/40 border-primary/10 shadow-xl overflow-hidden">
                <CardContent className="pt-6 space-y-8">

                    {/* Checkboxes */}
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                            Marque os passos que o vendedor realizou durante a visita <span className="text-destructive ml-1">*</span>
                        </Label>
                        <div className="grid gap-3 p-4 bg-background/40 rounded-xl border border-border/50">
                            {PASSOS_OPCOES.map((passo) => (
                                <Label
                                    key={passo}
                                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${passos.includes(passo) ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                                        }`}
                                >
                                    <Checkbox
                                        checked={passos.includes(passo)}
                                        onCheckedChange={(c) => handlePassoChange(passo, !!c)}
                                    />
                                    <span className="text-sm font-semibold">{passo}</span>
                                </Label>
                            ))}
                            <div className="h-px bg-border/50 my-2" />
                            <Label
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${passos.includes(NENHUM_PASSO) ? "border-destructive bg-destructive/10 text-destructive" : "border-transparent hover:bg-muted"
                                    }`}
                            >
                                <Checkbox
                                    checked={passos.includes(NENHUM_PASSO)}
                                    onCheckedChange={(c) => handlePassoChange(NENHUM_PASSO, !!c)}
                                    className={passos.includes(NENHUM_PASSO) ? "data-[state=checked]:bg-destructive data-[state=checked]:border-destructive" : ""}
                                />
                                <span className="text-sm font-semibold">{NENHUM_PASSO}</span>
                            </Label>
                        </div>
                    </div>

                    {/* Text Areas */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                                Pontos fortes do vendedor <span className="text-destructive ml-1">*</span>
                            </Label>
                            <Textarea
                                placeholder="Descreva os pontos fortes identificados..."
                                value={pontosFortes}
                                onChange={(e) => setPontosFortes(e.target.value)}
                                className="min-h-[100px] resize-y bg-background/50 focus-visible:ring-primary shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                                Pontos a desenvolver <span className="text-destructive ml-1">*</span>
                            </Label>
                            <Textarea
                                placeholder="Descreva as áreas que precisam de melhoria..."
                                value={pontosDesenvolver}
                                onChange={(e) => setPontosDesenvolver(e.target.value)}
                                className="min-h-[100px] resize-y bg-background/50 focus-visible:ring-primary shadow-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-primary uppercase tracking-widest flex items-center">
                                OBSERVAÇÕES / PLANO DE AÇÃO <span className="text-destructive ml-1">*</span>
                            </Label>
                            <Textarea
                                placeholder="Descreva as observações finais e o plano de ação definido..."
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                className="min-h-[100px] resize-y bg-background/50 focus-visible:ring-primary shadow-sm"
                            />
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 pb-8">
                <Button
                    type="button"
                    disabled={loading || !isFormValid}
                    onClick={handleSubmit}
                    className="flex-1 h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.98]"
                >
                    {loading ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Finalizar Avaliação
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};

export default StepCoaching;
