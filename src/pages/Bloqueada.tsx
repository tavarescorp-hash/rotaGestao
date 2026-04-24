import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, AlertTriangle, ShieldX, Headset } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { isAfter, parseISO, endOfDay } from "date-fns";

export default function Bloqueada() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isExpired = user?.data_vencimento ? isAfter(new Date(), endOfDay(parseISO(user.data_vencimento))) : false;
  const isBlocked = (user?.status_assinatura !== "Ativa" || isExpired) && user?.nivel !== "Master";

  // Se a empresa NÃO está bloqueada, manda de volta pro app normal
  if (!isBlocked && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-red-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decoração de Fundo Assustadora / Forte */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/40 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-900/40 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-black/40 backdrop-blur-xl border border-red-500/30 rounded-3xl p-8 sm:p-12 shadow-[0_0_80px_rgba(220,38,38,0.2)] text-center space-y-8 animate-in zoom-in-95 duration-700">
        
        <div className="space-y-4">
          <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <ShieldX className="w-12 h-12 text-red-500" />
          </div>
          
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
              Acesso Suspenso
            </h1>
            <p className="text-red-400 font-bold tracking-widest text-sm mt-1 uppercase">
              Plataforma Gestão de Rota
            </p>
          </div>
        </div>

        <div className="bg-red-950/50 rounded-2xl p-6 border border-red-500/20 shadow-inner">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-red-100/90 font-medium leading-relaxed">
            O acesso administrativo da sua empresa <strong className="text-white">({user?.empresa_nome || "Cliente"})</strong> foi suspenso temporariamente. 
          </p>
          <p className="text-red-100/90 font-medium leading-relaxed mt-4">
            Por favor, entre em contato imediatamente com o seu gestor financeiro/administrativo ou consulte nosso suporte para regularização do serviço.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Button 
            variant="outline" 
            className="w-full h-14 bg-red-950/50 hover:bg-red-900/80 text-white border-red-500/30 hover:border-red-500/50 font-bold transition-all text-base"
            onClick={() => window.open('https://api.whatsapp.com/send?phone=5522974022321', '_blank')}
          >
            <Headset className="w-5 h-5 mr-3" />
            Suporte Global Soluções
          </Button>

          <Button 
            className="w-full h-14 bg-white hover:bg-white/90 text-red-950 font-black text-base transition-all"
            onClick={async () => {
              await logout();
              navigate("/");
            }}
          >
            <Building2 className="w-5 h-5 mr-3" />
            Sair do Sistema
          </Button>
        </div>

      </div>

      <div className="mt-12 text-red-500/60 font-medium text-xs tracking-widest uppercase">
        © Global Soluções - Todos os Direitos Reservados
      </div>
    </div>
  );
}
