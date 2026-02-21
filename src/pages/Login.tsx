import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn } from "lucide-react";
import logoUnibeer from "@/assets/logo-unibeer.png";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    } else {
      toast({
        title: "Erro de autenticação",
        description: "Email ou senha incorretos, ou credenciais não encontradas no Supabase.",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Visual branding */}
      <div
        className="hidden lg:flex w-1/2 bg-zinc-950 relative overflow-hidden flex-col justify-between p-12 text-white bg-cover bg-center"
        style={{ backgroundImage: 'url("/restaurant_bg.png")' }}
      >
        <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-black/80 z-0 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 mb-4">
          <img src={logoUnibeer} alt="UniBeer Distribuidora" className="h-24 md:h-28 lg:h-32 mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]" />
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-5xl font-extrabold tracking-tight leading-tight">
            Gestão de Visitas <span className="text-primary">Inteligente</span>
          </h1>
          <p className="text-lg text-zinc-400 font-medium">
            Plataforma premium para controle, acompanhamento e execução de mercado Rota Unibeer.
          </p>
        </div>

        <div className="relative z-10 mt-auto flex flex-col items-start gap-4">
          <div className="text-sm text-zinc-500 font-medium tracking-wide">
            © {new Date().getFullYear()} UniBeer Distribuidora. Todos os direitos reservados.
          </div>
          <div className="opacity-30 hover:opacity-100 transition-opacity duration-300">
            <img
              src="/logo-global.png"
              alt="Desenvolvido por Global Devs"
              className="h-6 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-primary/5 to-transparent z-0 pointer-events-none lg:hidden" />

        <div className="w-full max-w-[420px] space-y-8 relative z-10">
          <div className="lg:hidden text-center mb-10 flex flex-col items-center">
            <div className="w-32 h-32 bg-zinc-950 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/10">
              <img src={logoUnibeer} alt="UniBeer" className="h-auto w-[85%]" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Rota Gestão</h1>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Acesse sua conta
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Entre com suas credenciais para gerenciar suas rotas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-8">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground/80">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@unibeer.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 px-4 bg-background border-input focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
              />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 px-4 bg-background border-input focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all duration-200"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  <span>Entrar no Sistema</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground font-semibold">
                Sistema Interno
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
