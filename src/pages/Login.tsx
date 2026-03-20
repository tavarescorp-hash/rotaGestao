import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Estado Dinâmico do Tenant (SaaS)
  const [tenantStyle, setTenantStyle] = useState({
    logo_url: "/logo-gestao-rota.png",
    cor_primaria: "#d9e7e9ff",
    nome: "Gestão de Rota"
  });

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      if (user.nivel === 'Master') {
        navigate("/super-admin");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;

    // Forçar Gestão de Rota (Default) para o CEO/Master
    if (email.trim().toLowerCase() === 'tavarescorp@gmail.com') {
      setTenantStyle({
        logo_url: "/logo-gestao-rota.png",
        cor_primaria: "#0E385D", // Nova cor temática do botão baseada na logo postada
        nome: "Gestão de Rota"
      });
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_tenant_by_email', { user_email: email.trim() });
      if (!error && data) {
        setTenantStyle({
          logo_url: data.logo_url || "/logo-gestao-rota.png",
          cor_primaria: data.cor_primaria || "#0E385D",
          nome: data.nome || "Gestão de Rota"
        });
      }
    } catch (err) {
      // Falha silenciosa: mantém estilo global
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login(email, password);
      if (success) {
        // O `user` vai ser atualizado via contexto e o `useEffect` acima fará o redirect correto.
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
      <div className="absolute top-0 right-0 w-[500px] h-[500px] blur-[140px] rounded-full pointer-events-none hidden md:block" style={{ backgroundColor: tenantStyle.cor_primaria, opacity: 0.3 }} />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none hidden md:block" style={{ backgroundColor: tenantStyle.cor_primaria, opacity: 0.2 }} />

      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-md bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.8)] overflow-hidden">

        {/* Subtle top glow within card */}
        <div className="absolute top-0 left-0 right-0 h-1.5 opacity-70" style={{ background: `linear-gradient(to right, transparent, ${tenantStyle.cor_primaria}, transparent)` }} />

        <div className="text-center mb-8 flex flex-col items-center space-y-5">
          {/* Logo container - Transparent wrapper for original unboxed logo */}
          <div className="w-full h-32 flex items-center justify-center overflow-hidden mb-2">
            {/* Inner specifically for the logo com fundo branco */}
            <div className="h-[100px] w-[100px] sm:h-[120px] sm:w-[120px] bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-white/20">
              <img
                src={tenantStyle.logo_url}
                alt={tenantStyle.nome}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1.5 drop-shadow-md" style={{ color: tenantStyle.cor_primaria !== '#B45309' ? tenantStyle.cor_primaria : 'white' }}>{tenantStyle.nome}</h1>
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
              placeholder="nome@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              required
              className="h-12 bg-zinc-800/80 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:bg-zinc-800 transition-all duration-300 rounded-xl px-4"
              style={{ '--tw-ring-color': tenantStyle.cor_primaria, borderColor: tenantStyle.cor_primaria } as any}
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
            className="w-full h-12 text-base font-bold text-white transition-all duration-300 active:scale-[0.98] mt-4 rounded-xl border border-white/10 hover:brightness-110"
            style={{ backgroundColor: tenantStyle.cor_primaria, boxShadow: `0 4px 14px 0 ${tenantStyle.cor_primaria}66` }}
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
                alt="Desenvolvido por Global Soluções"
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
