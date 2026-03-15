import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ModeToggle } from "@/components/ModeToggle";

const AppLayout = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (user.status_assinatura !== "Ativa" && user.nivel !== "Master") {
    return <Navigate to="/bloqueio" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="sticky top-0 z-50 h-16 sm:h-14 flex items-center justify-between border-b border-border px-4 bg-card gap-2 shrink-0">
            <div className="flex items-center min-w-0">
              <SidebarTrigger className="shrink-0" />
              <span className="ml-2 text-xs sm:text-sm font-medium text-muted-foreground truncate">UniBeer — Rota Gestão</span>
            </div>
            <ModeToggle />
          </header>
          <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
