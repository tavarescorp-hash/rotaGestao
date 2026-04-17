import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NovaVisita from "./pages/NovaVisita";
import VisitaRetroativa from "./pages/VisitaRetroativa";
import AdminData from "./pages/AdminData";
import SuperAdmin from "./pages/SuperAdmin";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import Bloqueada from "./pages/Bloqueada";
import { OfflineSyncManager } from "./components/OfflineSyncManager";
import { ReloadPrompt } from "./components/ReloadPrompt";
import { PwaInstallBanner } from "./components/PwaInstallBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="unibeer-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <OfflineSyncManager />
          <ReloadPrompt />
          <PwaInstallBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/nova-visita" element={<NovaVisita />} />
                <Route path="/retroativa" element={<VisitaRetroativa />} />
                <Route path="/admin-data" element={<AdminData />} />
                <Route path="/super-admin" element={<SuperAdmin />} />
              </Route>
              <Route path="/bloqueio" element={<Bloqueada />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
