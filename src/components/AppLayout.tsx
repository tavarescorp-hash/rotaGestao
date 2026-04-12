import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isAfter, parseISO, endOfDay } from "date-fns";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ModeToggle } from "@/components/ModeToggle";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isExpired = user.data_vencimento ? isAfter(new Date(), endOfDay(parseISO(user.data_vencimento))) : false;

  if (user?.nivel === 'Master' && location.pathname !== '/super-admin') {
    return <Navigate to="/super-admin" replace />;
  }

  const isBlocked = (user.status_assinatura !== "Ativa" || isExpired) && user.nivel !== "Master";

  if (!user) return <Navigate to="/" replace />;

  return (
    <SidebarProvider>
      <div className="h-[100dvh] flex w-full overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="sticky top-0 z-50 h-14 flex items-center justify-between border-b border-border px-4 bg-card gap-2 shrink-0">
            <div className="flex items-center min-w-0">
              <SidebarTrigger className="shrink-0" />
              <span className="ml-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">{user?.empresa_nome} — Rota Gestão</span>
            </div>
            <ModeToggle />
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
            {/* Bloqueio Informativo desativado temporariamente para estabilização */}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
