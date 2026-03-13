import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
    try {
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
    } catch (err: any) {
      toast({
        title: "Acesso Negado",
        description: err.message || "Email ou senha incorretos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center relative p-4 bg-cover bg-center"
      style={{ backgroundImage: 'url("/restaurant_bg.png")' }}
    >
      {/* Background Overlays - Lighter touch */}
      <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/30 blur-[140px] rounded-full pointer-events-none hidden md:block" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none hidden md:block" />

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] overflow-hidden">

        {/* Subtle top glow within card */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/0 via-primary/80 to-primary/0 opacity-70" />

        <div className="text-center mb-8 flex flex-col items-center space-y-5">
          {/* Logo container - White background in dark mode, subtle in light mode */}
          <div className="w-28 h-28 bg-white/20 dark:bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-black/10 dark:border-white/20">
            {/* Inner specifically for the logo */}
            <div className="w-full h-full flex items-center justify-center p-2">
              <img src="/logo-global.png" alt="Global Soluções" className="h-auto w-[90%] drop-shadow-sm transition-transform duration-500 hover:scale-105" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5 drop-shadow-md">Rota Gestão</h1>
            <p className="text-zinc-300 text-sm font-medium">
              Controle Inteligente de Mercado
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-sm font-semibold text-zinc-200 ml-1">
              E-mail corporativo
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nome@unibeer.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 bg-zinc-800/80 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-zinc-800 transition-all duration-300 rounded-xl px-4"
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-sm font-semibold text-zinc-200 ml-1">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 bg-zinc-800/80 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary focus-visible:bg-zinc-800 transition-all duration-300 rounded-xl px-4"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-bold shadow-[0_4px_14px_0_rgba(180,83,9,0.39)] hover:shadow-[0_6px_20px_rgba(180,83,9,0.23)] border border-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 active:scale-[0.98] mt-4 rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5" />
                <span>Acessar o Sistema</span>
              </div>
            )}
          </Button>
        </form>

        {/* Footer Area inside the card */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-3">
          <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
            Acesso Restrito
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <img
                src="/logo-global.png"
                alt="Desenvolvido por Global Devs"
                className="h-5 object-contain opacity-50 hover:opacity-100 transition-all duration-300 cursor-pointer"
              />
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-zinc-900 border-white/10 text-white shadow-2xl z-50 p-4" side="top" align="center">
              <div className="space-y-2 text-left">
                <h4 className="text-sm font-bold text-primary/90">Carlos Tavares</h4>
                <div className="text-xs text-zinc-300 space-y-1 font-medium tracking-wide">
                  <p>
                    📱 <a href="https://wa.me/5522974022321" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">(22) 97402-2321</a>
                  </p>
                  <p>
                    ✉️ <a href="mailto:globalsolucoesrj@gmail.com" className="hover:text-primary transition-colors hover:underline">globalsolucoesrj@gmail.com</a>
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

      </div>

      {/* Global Footer (mostly for desktop/large screens spacing) */}
      <div className="absolute bottom-6 text-xs text-zinc-400 font-medium tracking-wide z-10 hidden sm:block backdrop-blur-sm px-4 py-1.5 rounded-full bg-black/20">
        © {new Date().getFullYear()} Global Soluções. Todos os direitos reservados.
      </div>
    </div>
  );
};

export default Login;
