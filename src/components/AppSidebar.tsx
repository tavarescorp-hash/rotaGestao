import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, LogOut, Shield, User, Users, Database, CalendarPlus, Globe } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Nova Visita", url: "/nova-visita", icon: PlusCircle },
  { title: "Visita Retroativa", url: "/retroativa", icon: CalendarPlus },
  { title: "Gestão de Dados", url: "/admin-data", icon: Database },
  { title: "SaaS Admin", url: "/super-admin", icon: Globe },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isMaster = user?.nivel === 'Master';
  const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA') || user?.nivel === 'Niv0' || user?.nivel === 'Niv5' || isMaster;
  const isSupervisorOrGerente = user?.nivel === 'Niv3' || user?.nivel === 'Niv4' || isMaster;

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300">
      {/* HEADER */}
      <SidebarHeader className="p-6 border-b border-sidebar-border/50 flex flex-col items-center justify-center bg-sidebar-accent/10">
        <div className="w-full h-auto flex items-center justify-center mt-2 mb-2">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-md border border-white/10 dark:border-white/5 transition-all hover:shadow-lg">
            <img 
              src="/logo-gestao-rota.png" 
              alt="Gestão Rota" 
              className="w-full h-full object-cover transition-transform hover:scale-110 duration-300" 
            />
          </div>
        </div>
        <div className="text-center mt-2">
          {/* Replaced text-primary with text-foreground for high contrast, and standardized the font weights */}
          <h2 className="text-base font-black tracking-widest text-foreground uppercase">{user?.empresa_nome || "Gestão de Rota"}</h2>
          <p className="text-xs text-muted-foreground font-semibold uppercase mt-0.5">Visitas de Mercado</p>
        </div>
      </SidebarHeader>

      {/* CONTENT / MENU */}
      <SidebarContent className="px-4 py-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                // Nível Master de SaaS não mistura operações de rua (ocultar relatórios)
                if (isMaster) {
                  // Nível Master não vê nada operacional
                } else {
                  const isGestor = user?.nivel === 'Niv1' || user?.nivel === 'Niv2' || user?.nivel === 'Niv3' || user?.nivel === 'Niv4';
                  
                  // Analistas não podem fazer visitas (são nível de retaguarda)
                  if (isAnalista && item.title === "Nova Visita") return null;
                  
                  // Apenas Analistas e Master acessam a Gestão de Dados
                  if (!isAnalista && item.title === "Gestão de Dados") return null;
                  
                  // Acesso liberado à Visita Retroativa para todos os usuários (Niv1, Niv2, Niv3, Niv4)

                   // Regra SaaS Admin: Apenas nível Master de Arquitetura SaaS
                  if (item.title === "SaaS Admin") return null;
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        onClick={() => {
                          setOpenMobile(false);
                          window.scrollTo(0, 0);
                        }}
                        /* Standardized the nav link text and padding */
                        className="flex items-center w-full px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden text-foreground/80 font-semibold hover:bg-sidebar-accent hover:text-foreground"
                        activeClassName="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary hover:text-primary-foreground font-bold"
                      >
                        <item.icon className="w-5 h-5 mr-3 z-10 opacity-80 group-[.active]:opacity-100" />
                        <span className="z-10 text-sm">{item.title}</span>
                        {/* Active state subtle background glow */}
                        <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-[.active]:opacity-100 transition-opacity" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER */}
      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar-accent/5">
        <div className="flex items-center gap-3 p-3 mb-4 rounded-xl bg-sidebar-accent/30 border border-sidebar-border/50">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-sm shrink-0">
            {user?.role === "admin" ? (
              <Shield className="w-5 h-5 text-primary" />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {/* Standardized user name and role text sizes/colors */}
            <p className="text-sm font-black truncate text-foreground uppercase tracking-tight">{user?.name}</p>
            <Badge className="mt-1.5 text-[10px] uppercase font-black tracking-widest bg-[#FFB800] text-black border-none hover:bg-[#FFB800]/90 px-2 py-0.5 rounded-md transition-colors">
              {user?.formattedRole}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-center text-sm font-bold text-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 border-border transition-colors h-12"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2 opacity-80" />
          Encerrar Sessão
        </Button>
        <div className="mt-6 mb-1 flex items-center justify-center">
          <Popover>
            <PopoverTrigger asChild>
              <img src="/logo-global.png" alt="Desenvolvido por Global Soluções" className="h-6 object-contain opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer brightness-0 dark:invert" />
            </PopoverTrigger>
            <PopoverContent className="w-64 bg-zinc-900 border-zinc-700/50 text-white shadow-xl z-50 p-4" side="top" align="center">
              <div className="space-y-2 text-left">
                <h4 className="text-sm font-bold text-primary">Carlos Tavares</h4>
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
      </SidebarFooter>
    </Sidebar>
  );
}
