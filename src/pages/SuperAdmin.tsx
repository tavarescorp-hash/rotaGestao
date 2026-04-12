import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getEmpresas, updateEmpresaStatus, createEmpresa, createUserAdminForEmpresa, updateEmpresaBilling } from "@/lib/api";
import { format, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Calendar, Target, PlusCircle, Building2, UserPlus, Power } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  logo_url: string;
  cor_primaria: string;
  status_assinatura: string;
  data_vencimento?: string;
  limite_visitas?: number;
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
  const [novoAdmin, setNovoAdmin] = useState({ Nome: "", email: "", password: "", unidade: "", empresa_id: 1 });
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<Empresa | null>(null);

  // Faturamento
  const [faturamentoData, setFaturamentoData] = useState({ data_vencimento: "", limite_visitas: 500 });
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.nivel === "Master") {
      carregarEmpresas();
    }
  }, [user?.nivel]);

  if (user?.nivel !== "Master") {
    return <Navigate to="/dashboard" replace />;
  }

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
    setNovoAdmin({ Nome: "", email: "", password: "", unidade: "", empresa_id: empresa.id });
    setIsAdminDialogOpen(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAdmin.Nome || !novoAdmin.email || !novoAdmin.password) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }

    // Criamos um payload compatível com o sistema global.
    const payload = {
      ...novoAdmin,
      nivel: "Niv1",
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

  const handleOpenBillingDialog = (empresa: Empresa) => {
    setEmpresaSelecionada(empresa);
    setFaturamentoData({
      data_vencimento: empresa.data_vencimento || "",
      limite_visitas: empresa.limite_visitas || 500
    });
    setIsBillingDialogOpen(true);
  };

  const handleUpdateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaSelecionada) return;

    const dataFormatted = faturamentoData.data_vencimento === "" ? null : faturamentoData.data_vencimento;
    
    const sucesso = await updateEmpresaBilling(empresaSelecionada.id, {
      ...faturamentoData,
      data_vencimento: dataFormatted
    });


    if (sucesso) {
      toast({ title: "Faturamento atualizado!", description: "Dados de cobrança salvos com sucesso." });
      setIsBillingDialogOpen(false);
      carregarEmpresas();
    } else {
      toast({ title: "Erro", description: "Falha ao atualizar dados de cobrança.", variant: "destructive" });
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
            Gerencie os Inquilinos (Tenants) da Plataforma Gestão de Rota.
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
                <Input value={novaEmpresa.nome} onChange={e => setNovaEmpresa({ ...novaEmpresa, nome: e.target.value })} placeholder="Ex: Distribuidora Azul" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ *</Label>
                <Input value={novaEmpresa.cnpj} onChange={e => setNovaEmpresa({ ...novaEmpresa, cnpj: e.target.value })} placeholder="00.000.000/0001-00" />
              </div>
              <div className="space-y-2">
                <Label>URL da Logomarca (PNG/JPG)</Label>
                <Input value={novaEmpresa.logo_url} onChange={e => setNovaEmpresa({ ...novaEmpresa, logo_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Cor Primária (Hexadecimal)</Label>
                <div className="flex gap-2">
                  <Input type="color" value={novaEmpresa.cor_primaria} onChange={e => setNovaEmpresa({ ...novaEmpresa, cor_primaria: e.target.value })} className="w-16 h-10 p-1" />
                  <Input value={novaEmpresa.cor_primaria} onChange={e => setNovaEmpresa({ ...novaEmpresa, cor_primaria: e.target.value })} placeholder="#HexColor" className="flex-1" />
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
          <div className="overflow-x-auto">
            <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Identidade</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Plano/Status</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Uso (Mensal)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Carregando carteira de clientes...</TableCell></TableRow>
              ) : empresas.filter(e => e.id > 0).length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma empresa cliente encontrada.</TableCell></TableRow>
              ) : (
                empresas.filter(e => e.id > 0).map((empresa) => (
                  <TableRow key={empresa.id}>
                    <TableCell className="font-mono text-xs">{empresa.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border bg-white flex items-center justify-center shrink-0">
                          {empresa.logo_url ? (
                            <img src={empresa.logo_url} alt={empresa.nome} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-bold text-base">{empresa.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-sm">{empresa.cnpj || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={empresa.status_assinatura === 'Ativa' ? 'default' : 'destructive'} className="uppercase font-bold tracking-wider text-[10px]">
                        {empresa.status_assinatura}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenBillingDialog(empresa)} className="h-8 w-8 p-0" title="Cobrança">
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenAdminDialog(empresa)} className="h-8 w-8 p-0" title="Criar Admin">
                        <UserPlus className="w-4 h-4 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(empresa)}
                        className="h-8 w-8 p-0"
                        title={empresa.status_assinatura === 'Ativa' ? 'Bloquear' : 'Liberar'}
                      >
                        <Power className={cn("w-4 h-4", empresa.status_assinatura === 'Ativa' ? "text-slate-400" : "text-destructive")} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </div>
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
              <Input value={novoAdmin.Nome} onChange={e => setNovoAdmin({ ...novoAdmin, Nome: e.target.value })} placeholder="Nome" />
            </div>
            <div className="space-y-2">
              <Label>E-mail de Acesso</Label>
              <Input type="email" value={novoAdmin.email} onChange={e => setNovoAdmin({ ...novoAdmin, email: e.target.value })} placeholder="admin@empresa.com.br" />
            </div>
            <div className="space-y-2">
              <Label>Senha Inicial</Label>
              <Input type="text" value={novoAdmin.password} onChange={e => setNovoAdmin({ ...novoAdmin, password: e.target.value })} placeholder="Senha forte..." />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Input value={novoAdmin.unidade} onChange={e => setNovoAdmin({ ...novoAdmin, unidade: e.target.value })} placeholder="Ex: Macaé, Campos, todas..." />
            </div>
            <Button type="submit" className="w-full">Gerar Conta Admin</Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Modal Financeiro / Cobrança */}
      <Dialog open={isBillingDialogOpen} onOpenChange={setIsBillingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Gestão Financeira: {empresaSelecionada?.nome}
            </DialogTitle>
            <DialogDescription>
              Controle o vencimento e os limites de uso deste cliente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateBilling} className="space-y-6 pt-4">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase text-muted-foreground">Próximo Vencimento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="date" 
                    value={faturamentoData.data_vencimento} 
                    onChange={e => setFaturamentoData({ ...faturamentoData, data_vencimento: e.target.value })} 
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase text-muted-foreground">Limite de Visitas (Mensal)</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    value={faturamentoData.limite_visitas} 
                    onChange={e => {
                      const val = parseInt(e.target.value);
                      setFaturamentoData({ ...faturamentoData, limite_visitas: isNaN(val) ? 0 : val });
                    }} 
                    className="pl-10"
                    placeholder="Ex: 500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">O sistema bloqueará o botão "Nova Visita" assim que o limite for atingido.</p>
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-xs h-11">
              Salvar Alterações de Faturamento
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
