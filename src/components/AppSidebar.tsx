import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, PlusCircle, LogOut, Shield, User } from "lucide-react";
import logoUnibeer from "@/assets/logo-unibeer.png";
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
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { setOpenMobile } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA');

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300">
      {/* HEADER */}
      <SidebarHeader className="p-6 border-b border-sidebar-border/50 flex flex-col items-center justify-center bg-sidebar-accent/10">
        <div className="bg-white dark:bg-zinc-100/90 p-3 rounded-2xl shadow-md border border-black/5 dark:border-white/10 mb-3 w-full flex items-center justify-center transition-colors">
          <img src={logoUnibeer} alt="UniBeer" className="h-10 md:h-12 object-contain drop-shadow-sm transition-transform hover:scale-105 duration-300" />
        </div>
        <div className="text-center mt-2">
          {/* Replaced text-primary with text-foreground for high contrast, and standardized the font weights */}
          <h2 className="text-base font-black tracking-widest text-foreground uppercase">Rota Gestão</h2>
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
                if (isAnalista && item.title === "Nova Visita") {
                  return null;
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
            <p className="text-sm font-bold truncate text-foreground">{user?.name}</p>
            <Badge variant="secondary" className="mt-1 text-xs uppercase font-bold tracking-wider bg-muted text-muted-foreground border-none">
              {user?.role === "admin" ? "Admin" : "Usuário"}
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
              <img src="/logo-global.png" alt="Desenvolvido por Global Devs" className="h-6 object-contain opacity-30 hover:opacity-100 transition-opacity duration-300 cursor-pointer" />
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
