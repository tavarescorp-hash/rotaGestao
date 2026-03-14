import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Building2, UserPlus, Power } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// Import API functions (to be created)
import { getEmpresas, updateEmpresaStatus, createEmpresa, createUserAdminForEmpresa } from "@/lib/api";

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  logo_url: string;
  cor_primaria: string;
  status_assinatura: string;
  created_at?: string;
}

export default function SuperAdmin() {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulário Nova Empresa
  const [novaEmpresa, setNovaEmpresa] = useState({ nome: "", cnpj: "", logo_url: "", cor_primaria: "#B22222" });
  const [isEmpresaDialogOpen, setIsEmpresaDialogOpen] = useState(false);

  // Formulário Novo Admin
  const [novoAdmin, setNovoAdmin] = useState({ Nome: "", email: "", password: "", empresa_id: 1 });
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);

  if (user?.nivel !== "Master") {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const carregarEmpresas = async () => {
    setLoading(true);
    const dados = await getEmpresas();
    setEmpresas(dados);
    setLoading(false);
  };

  const handleToggleStatus = async (empresa: Empresa) => {
    const novoStatus = empresa.status_assinatura === "Ativa" ? "Inadimplente" : "Ativa";
    const sucesso = await updateEmpresaStatus(empresa.id, novoStatus);
    
    if (sucesso) {
      toast({ title: "Status atualizado!", description: `A empresa ${empresa.nome} agora está ${novoStatus}.` });
      carregarEmpresas();
    } else {
      toast({ title: "Erro", description: "Não foi possível alterar o status.", variant: "destructive" });
    }
  };

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEmpresa.nome || !novaEmpresa.cnpj) {
      toast({ title: "Erro", description: "Preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }

    const { success, message } = await createEmpresa(novaEmpresa);
    if (success) {
      toast({ title: "Sucesso!", description: message });
      setIsEmpresaDialogOpen(false);
      setNovaEmpresa({ nome: "", cnpj: "", logo_url: "", cor_primaria: "#B22222" });
      carregarEmpresas();
    } else {
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };

  const handleOpenAdminDialog = (empresa: Empresa) => {
    setEmpresaSelecionada(empresa);
    setNovoAdmin({ Nome: "", email: "", password: "", empresa_id: empresa.id });
    setIsAdminDialogOpen(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAdmin.Nome || !novoAdmin.email || !novoAdmin.password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    // Criamos um payload compatível com o sistema (Niv1) global.
    const payload = {
      ...novoAdmin,
      nivel: "Niv1", // Nível de Analista / Master da Empresa
      unidade: "todas",
      funcao: "ANALISTA COMERCIAL",
    };

    const { success, message } = await createUserAdminForEmpresa(payload);
    
    if (success) {
      toast({ title: "Sucesso!", description: message });
      setIsAdminDialogOpen(false);
    } else {
      toast({ title: "Erro", description: message, variant: "destructive" });
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-20 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            SaaS Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os Inquilinos (Tenants) da Plataforma Global Soluções.
          </p>
        </div>
        
        <Dialog open={isEmpresaDialogOpen} onOpenChange={setIsEmpresaDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-bold flex items-center gap-2" size="lg">
              <PlusCircle className="w-5 h-5" />
              Adicionar Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nova Empresa</DialogTitle>
              <DialogDescription>Crie um novo Tenant no banco de dados.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateEmpresa} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input value={novaEmpresa.nome} onChange={e => setNovaEmpresa({...novaEmpresa, nome: e.target.value})} placeholder="Ex: Distribuidora Azul" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({...novaEmpresa, cnpj: e.target.value})} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-2">
                <Label>URL da Logomarca (PNG/JPG)</Label>
                <Input value={novaEmpresa.logo_url} onChange={e => setNovaEmpresa({...novaEmpresa, logo_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Cor Primária (Hexadecimal)</Label>
                <div className="flex gap-2">
                  <Input type="color" value={novaEmpresa.cor_primaria} onChange={e => setNovaEmpresa({...novaEmpresa, cor_primaria: e.target.value})} className="w-16 h-10 p-1" />
                  <Input value={novaEmpresa.cor_primaria} onChange={e => setNovaEmpresa({...novaEmpresa, cor_primaria: e.target.value})} placeholder="#HexColor" className="flex-1" />
                </div>
              </div>
              <Button type="submit" className="w-full">Cadastrar Cliente</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-xl">Empresas Cadastradas ({empresas.length})</CardTitle>
          <CardDescription>Status das assinaturas e parametrizações ativas.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Identidade</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Tema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando carteira de clientes...</TableCell></TableRow>
              ) : empresas.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma empresa encontrada.</TableCell></TableRow>
              ) : (
                empresas.map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-mono text-xs">{empresa.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border bg-white flex items-center justify-center shrink-0">
                          {empresa.logo_url ? (
                            <img src={empresa.logo_url} alt={empresa.nome} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-bold text-base">{empresa.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-sm">{empresa.cnpj || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border shadow-sm" style={{ backgroundColor: empresa.cor_primaria || '#B22222' }} />
                        <span className="text-xs text-muted-foreground uppercase">{empresa.cor_primaria || '#B22222'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={empresa.status_assinatura === 'Ativa' ? 'default' : 'destructive'} className="uppercase font-bold tracking-wider text-[10px]">
                        {empresa.status_assinatura}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenAdminDialog(empresa)} className="h-8">
                        <UserPlus className="w-4 h-4 mr-2 text-primary" />
                        Criar Admin
                      </Button>
                      <Button 
                        variant={empresa.status_assinatura === 'Ativa' ? 'secondary' : 'default'} 
                        size="sm" 
                        onClick={() => handleToggleStatus(empresa)}
                        className="h-8 w-28"
                      >
                        <Power className="w-4 h-4 mr-2" />
                        {empresa.status_assinatura === 'Ativa' ? 'Bloquear' : 'Liberar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal para criar o Admin Inicial da Empresa */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Inicial: {empresaSelecionada?.nome}</DialogTitle>
            <DialogDescription>
              Crie o primeiro usuário Analista (Nível Gerencial) para que eles mesmos possam subir os vendedores e gerentes pelo painel deles.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4 pt-4">
             <div className="space-y-2">
              <Label>Nome Completo do Admin</Label>
              <Input value={novoAdmin.Nome} onChange={e => setNovoAdmin({...novoAdmin, Nome: e.target.value})} placeholder="Nome" />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input type="email" value={novoAdmin.email} onChange={e => setNovoAdmin({...novoAdmin, email: e.target.value})} placeholder="admin@empresa.com.br" />
            </div>
            <div className="space-y-2">
              <Label>Senha Inicial</Label>
              <Input type="text" value={novoAdmin.password} onChange={e => setNovoAdmin({...novoAdmin, password: e.target.value})} placeholder="Senha forte..." />
            </div>
            <Button type="submit" className="w-full">Gerar Conta Admin</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
