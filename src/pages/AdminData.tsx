import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileSpreadsheet, AlertTriangle, Loader2, Database, Users, UserPlus, Shield, ShieldOff, Lock, Unlock, CheckCircle2, Download, ClipboardCheck, XCircle, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import * as XLSX from 'xlsx';
import { uploadBasePDVs, uploadProdutosFDS, getUsers, toggleUserStatus, createUserAdmin, downloadBasePDVs, downloadProdutosFDS, buscarVisitasPendentes, aprovarVisita, recusarVisita, getConfiguracao, setConfiguracao } from '@/lib/api';
import { format } from 'date-fns';

const AdminData = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // Estados Bases
    const [loadingPdvs, setLoadingPdvs] = useState(false);
    const [loadingProdutos, setLoadingProdutos] = useState(false);

    // Estados Usuários
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Estados Aprovação
    const [visitasPendentes, setVisitasPendentes] = useState<any[]>([]);
    const [loadingAprovacoes, setLoadingAprovacoes] = useState(false);
    const [visitaSelecionada, setVisitaSelecionada] = useState<any | null>(null);

    // Form Novo Usuário
    const [newUser, setNewUser] = useState({
        Nome: '',
        email: '',
        password: '',
        unidade: '',
        funcao: '',
        nivel: ''
    });

    // Estados Configurações Globais
    const [configFocoRgb, setConfigFocoRgb] = useState<string>('');
    const [loadingConfig, setLoadingConfig] = useState(false);

    const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA');

    useEffect(() => {
        if (isAnalista) {
            fetchUsers();
            fetchAprovacoes();
            fetchConfiguracoes();
        }
    }, [isAnalista]);

    const fetchAprovacoes = async () => {
        setLoadingAprovacoes(true);
        const data = await buscarVisitasPendentes();
        setVisitasPendentes(data);
        setLoadingAprovacoes(false);
    };

    const fetchConfiguracoes = async () => {
        setLoadingConfig(true);
        const focoRgb = await getConfiguracao('foco_rgb_mes');
        setConfigFocoRgb(focoRgb || 'Nenhum');
        setLoadingConfig(false);
    };

    const handleSaveConfig = async () => {
        setLoadingAction('saveConfig');
        const valorParaSalvar = configFocoRgb === 'Nenhum' ? '' : configFocoRgb;
        const success = await setConfiguracao('foco_rgb_mes', valorParaSalvar);
        
        if (success) {
            toast({ title: "Configuração Salva", description: "A nova diretriz Foco RGB foi salva com sucesso e já está valendo para todos os avaliadores.", className: "bg-green-600 text-white" });
        } else {
            toast({ title: "Erro", description: "Não foi possível sincronizar a configuração.", variant: "destructive" });
        }
        setLoadingAction(null);
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        const data = await getUsers();
        setUsuarios(data);
        setLoadingUsers(false);
    };

    if (!isAnalista) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">Acesso Negado</h2>
                <p className="text-muted-foreground max-w-md">
                    Esta área é restrita para o perfil de Analista de Inteligência. Você não tem permissão para gerenciar a base de dados do sistema.
                </p>
            </div>
        );
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'pdvs' | 'produtos') => {
        const file = event.target.files?.[0];
        if (!file) return;

        const isLoading = type === 'pdvs' ? setLoadingPdvs : setLoadingProdutos;
        const uploadFunc = type === 'pdvs' ? uploadBasePDVs : uploadProdutosFDS;

        isLoading(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Converte a planilha para JSON, pulando linhas vazias
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

            if (jsonData.length === 0) {
                toast({
                    title: "Planilha Vazia",
                    description: "Não encontramos dados na primeira aba da planilha.",
                    variant: "destructive"
                });
                isLoading(false);
                return;
            }

            toast({
                title: "Processando Planilha...",
                description: `Lemos ${jsonData.length} linhas. Iniciando sincronização pesada com o banco de dados. Por favor aguarde.`,
            });

            const response = await uploadFunc(jsonData);

            if (response.success) {
                toast({
                    title: "Sucesso!",
                    description: response.message,
                    className: "bg-green-600 border-none text-white",
                });
            } else {
                toast({
                    title: "Falha na Sincronização",
                    description: response.message,
                    variant: "destructive"
                });
            }

        } catch (error: any) {
            console.error("Erro ao ler arquivo:", error);
            toast({
                title: "Erro de Leitura",
                description: "Não foi possível extrair os dados deste tipo de arquivo. Use Excel (.xlsx) ou CSV.",
                variant: "destructive"
            });
        } finally {
            isLoading(false);
            event.target.value = '';
        }
    };

    const handleDownload = async (type: 'pdvs' | 'produtos') => {
        const downloadFunc = type === 'pdvs' ? downloadBasePDVs : downloadProdutosFDS;
        const fileName = type === 'pdvs' ? 'Base_PDVS_Atual.xlsx' : 'Base_ProdutosFDS_Atual.xlsx';

        toast({ title: "Iniciando Download...", description: "Buscando os dados completos do servidor." });

        try {
            const data = await downloadFunc();
            if (!data || data.length === 0) {
                toast({ title: "Base Vazia", description: "Não há dados para exportar.", variant: "destructive" });
                return;
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
            XLSX.writeFile(workbook, fileName);

            toast({ title: "Download Concluído", description: `Arquivo ${fileName} gerado com sucesso!`, className: "bg-green-600 border-none text-white" });
        } catch (error) {
            console.error("Erro no download:", error);
            toast({ title: "Erro", description: "Falha ao gerar o arquivo Excel.", variant: "destructive" });
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean, userName: string) => {
        setLoadingAction(userId);
        const success = await toggleUserStatus(userId, currentStatus);

        if (success) {
            // Atualizar UI local instantaneamente sem precisar recarregar o banco inteiro
            setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, ativo: !currentStatus } : u));
            toast({
                title: !currentStatus ? "Acesso Restabelecido" : "Acesso Bloqueado",
                description: `O perfil de ${userName} foi ${!currentStatus ? 'reativado' : 'desativado'} com sucesso.`,
                className: !currentStatus ? "bg-green-600 border-none text-white" : "destructive",
            });
        } else {
            toast({
                title: "Erro de Comunicação",
                description: "Não foi possível alterar o status do usuário no banco de dados.",
                variant: "destructive"
            });
        }
        setLoadingAction(null);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newUser.Nome || !newUser.email || !newUser.password || !newUser.nivel || !newUser.unidade || !newUser.funcao) {
            toast({ title: "Campos Incompletos", description: "Preencha todos os campos obrigatórios, incluindo a Função.", variant: "destructive" });
            return;
        }

        setLoadingAction('create');

        const response = await createUserAdmin(newUser);

        if (response.success) {
            toast({
                title: "Usuário Criado",
                description: `${response.message} Login: ${newUser.email}`,
                className: "bg-green-600 border-none text-white",
            });
            setIsDialogOpen(false);
            setNewUser({ Nome: '', email: '', password: '', unidade: '', funcao: '', nivel: '' });
            fetchUsers(); // Recarregar lista
        } else {
            toast({
                title: "Falha na Criação",
                description: response.message,
                variant: "destructive"
            });
        }

        setLoadingAction(null);
    };

    const handleAprovar = async (id: string, pdv: string) => {
        setLoadingAction(`aprovar-${id}`);
        const success = await aprovarVisita(id);
        if (success) {
            toast({ title: "Visita Aprovada!", description: `A visita no PDV ${pdv} já está pontuando no painel oficial.`, className: "bg-green-600 text-white" });
            setVisitasPendentes(prev => prev.filter(v => String(v.id) !== String(id)));
        } else {
            toast({ title: "Erro", description: "Não foi possível aprovar a visita.", variant: "destructive" });
        }
        setLoadingAction(null);
    };

    const handleRecusar = async (id: string, pdv: string) => {
        setLoadingAction(`recusar-${id}`);
        const success = await recusarVisita(id);
        if (success) {
            toast({ title: "Visita Recusada", description: `A visita no PDV ${pdv} foi negada e invalidada.` });
            setVisitasPendentes(prev => prev.filter(v => String(v.id) !== String(id)));
        } else {
            toast({ title: "Erro", description: "Não foi possível recusar a visita.", variant: "destructive" });
        }
        setLoadingAction(null);
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

            <div className="flex flex-col space-y-2 border-b border-border/40 pb-6 pt-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                    <Database className="w-8 h-8 text-primary" />
                    Gestão Central
                </h1>
                <p className="text-muted-foreground font-medium">
                    Área restrita de Administração do Sistema. Faça upload de diretrizes ou ajuste acessos.
                </p>
            </div>

            <Tabs defaultValue="bases" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-[800px] mb-8 h-auto p-1">
                    <TabsTrigger value="bases" className="font-bold tracking-wide py-2">
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Bases de Dados
                    </TabsTrigger>
                    <TabsTrigger value="usuarios" className="font-bold tracking-wide py-2">
                        <Users className="w-4 h-4 mr-2" />
                        Usuários
                    </TabsTrigger>
                    <TabsTrigger value="aprovacoes" className="font-bold tracking-wide py-2">
                        <ClipboardCheck className="w-4 h-4 mr-2" />
                        Aprovações
                        {visitasPendentes.length > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 min-w-5 flex items-center justify-center p-0 rounded-full text-[10px]">
                                {visitasPendentes.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="configuracoes" className="font-bold tracking-wide py-2">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="bases" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Card PDVS */}
                        <Card className="glass-card bg-card/40 border-primary/20 overflow-hidden relative group hover:border-primary/40 transition-colors">
                            <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent border-b border-border/50 pb-8">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileSpreadsheet className="w-6 h-6 text-primary" />
                                    Base de Clientes (PDVs)
                                </CardTitle>
                                <CardDescription className="font-medium text-muted-foreground/80 mt-2">
                                    Esta ação <strong>apagará</strong> toda a atual carteira de clientes do aplicativo e <strong>injetará</strong> as novas linhas da sua planilha.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[220px]">
                                {loadingPdvs ? (
                                    <div className="flex flex-col items-center gap-4 text-primary animate-pulse">
                                        <Loader2 className="w-12 h-12 animate-spin" />
                                        <p className="font-bold tracking-tight">Destruindo e Recriando Tabela...</p>
                                        <span className="text-xs text-muted-foreground">Isso pode levar até 1 minuto. Não feche.</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <UploadCloud className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <h3 className="font-bold">Faça upload de uma planilha Excel</h3>
                                            <p className="text-xs text-muted-foreground">O arquivo deve conter NOME_VENDEDOR, FILIAL, NOME _SUPERVISOR</p>
                                        </div>
                                        <div className="flex gap-2 w-full max-w-sm mt-4">
                                            <div className="relative w-full flex-[2]">
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls, .csv"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => handleFileUpload(e, 'pdvs')}
                                                    disabled={loadingPdvs}
                                                />
                                                <Button className="w-full pointer-events-none shadow-md">
                                                    Substituir Arquivo
                                                </Button>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="flex-1 shadow-sm font-bold bg-secondary/50 hover:bg-secondary border-primary/20"
                                                onClick={() => handleDownload('pdvs')}
                                                disabled={loadingPdvs}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Baixar Atual
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Card Produtos FDS */}
                        <Card className="glass-card bg-card/40 border-primary/20 overflow-hidden relative group hover:border-primary/40 transition-colors">
                            <CardHeader className="bg-gradient-to-br from-purple-500/10 to-transparent border-b border-border/50 pb-8">
                                <CardTitle className="flex items-center gap-2 text-xl text-purple-600 dark:text-purple-400">
                                    <FileSpreadsheet className="w-6 h-6" />
                                    Base de Produtos FDS
                                </CardTitle>
                                <CardDescription className="font-medium text-muted-foreground/80 mt-2">
                                    Atualize a lista de pontuações, canais e materiais de execução oficiais de FotodeSucesso.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[220px]">
                                {loadingProdutos ? (
                                    <div className="flex flex-col items-center gap-4 text-purple-600 dark:text-purple-400 animate-pulse">
                                        <Loader2 className="w-12 h-12 animate-spin" />
                                        <p className="font-bold tracking-tight">Sincronizando Produtos...</p>
                                        <span className="text-xs text-muted-foreground">Isso pode levar alguns segundos.</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <UploadCloud className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <h3 className="font-bold">Faça upload da Matriz Oficial</h3>
                                            <p className="text-xs text-muted-foreground">Colunas obrigatórias: PRODUTO, CANAL, EXECUCAO, PONTOS</p>
                                        </div>
                                        <div className="flex gap-2 w-full max-w-sm mt-4">
                                            <div className="relative w-full flex-[2]">
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls, .csv"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => handleFileUpload(e, 'produtos')}
                                                    disabled={loadingProdutos}
                                                />
                                                <Button className="w-full bg-purple-600 hover:bg-purple-700 pointer-events-none shadow-md text-white">
                                                    Substituir Arquivo
                                                </Button>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="flex-1 shadow-sm font-bold bg-secondary/50 hover:bg-secondary border-purple-500/20 text-purple-600 dark:text-purple-400"
                                                onClick={() => handleDownload('produtos')}
                                                disabled={loadingProdutos}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Baixar Atual
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-4 text-amber-900 dark:text-amber-200 mt-6 !mt-8">
                        <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="font-bold">Aviso Importante sobre Formatação</h4>
                            <p className="text-sm opacity-90">
                                A inteligência do sistema <strong>não</strong> consegue advinhar o que as colunas da sua planilha significam se os títulos não forem iguais aos do banco de dados.
                                Antes de arrastar a planilha, abra no seu Excel e garanta que o NOME DAS COLUNAS (cabeçalho da primeira linha) esteja exatamente garantido.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="usuarios" className="space-y-6">
                    <Card className="glass-card bg-card/40 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6 bg-secondary/10">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Users className="w-6 h-6 text-primary" />
                                    Diretório de Acessos
                                </CardTitle>
                                <CardDescription className="font-medium mt-1 text-muted-foreground/80">
                                    Gerencie todos os perfs criados na plataforma Rota Unibeer.
                                </CardDescription>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button className="gap-2 font-bold shadow-md shadow-primary/20">
                                        <UserPlus className="w-4 h-4" />
                                        Novo Usuário
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <form onSubmit={handleCreateUser}>
                                        <DialogHeader>
                                            <DialogTitle className="text-xl">Adicionar Perfil</DialogTitle>
                                            <DialogDescription>
                                                Crie um novo acesso. A conta ficará ativa imediatamente.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="nome">Nome Completo</Label>
                                                <Input id="nome" required value={newUser.Nome} onChange={e => setNewUser({ ...newUser, Nome: e.target.value })} placeholder="Ex: João da Silva" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">E-mail</Label>
                                                <Input id="email" type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="vendas@exemplo.com" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pass">Senha Inicial</Label>
                                                <Input id="pass" type="password" required value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Mínimo 6 caracteres" minLength={6} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Unidade</Label>
                                                    <Select value={newUser.unidade} onValueChange={v => setNewUser({ ...newUser, unidade: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Macaé">Macaé</SelectItem>
                                                            <SelectItem value="Campos">Campos</SelectItem>
                                                            <SelectItem value="Todas">Todas (Admin)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Nível</Label>
                                                    <Select value={newUser.nivel} onValueChange={v => setNewUser({ ...newUser, nivel: v })}>
                                                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Niv1">Niv1 (Vendedor)</SelectItem>
                                                            <SelectItem value="Niv2">Niv2 (Avaliador Base)</SelectItem>
                                                            <SelectItem value="Niv4">Niv4 (Supervisor)</SelectItem>
                                                            <SelectItem value="Niv3">Niv3 (Gerente)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Função (Cargo no sistema)</Label>
                                                <Select value={newUser.funcao} onValueChange={v => setNewUser({ ...newUser, funcao: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Vendedor">Vendedor</SelectItem>
                                                        <SelectItem value="Supervisor de Vendas">Supervisor de Vendas</SelectItem>
                                                        <SelectItem value="Gerente de Vendas">Gerente de Vendas</SelectItem>
                                                        <SelectItem value="Analista de Inteligência">Analista de Inteligência</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit" disabled={loadingAction === 'create'} className="w-full">
                                                {loadingAction === 'create' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                Salvar Usuário
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingUsers ? (
                                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <span>Carregando perfis...</span>
                                </div>
                            ) : (
                                <div className="rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-secondary/30">
                                            <TableRow>
                                                <TableHead className="font-bold text-foreground">Status</TableHead>
                                                <TableHead className="font-bold text-foreground">Nome de Usuário</TableHead>
                                                <TableHead className="font-bold text-foreground">Nível</TableHead>
                                                <TableHead className="font-bold text-foreground">Unidade</TableHead>
                                                <TableHead className="font-bold text-foreground">Função</TableHead>
                                                <TableHead className="text-right font-bold text-foreground">Configurar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-background/50">
                                            {usuarios.map((usr) => (
                                                <TableRow key={usr.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell>
                                                        {usr.ativo !== false ? (
                                                            <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-none px-2 shadow-none font-bold">
                                                                <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
                                                                ATIVO
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-none px-2 shadow-none font-bold">
                                                                <Lock className="w-3 h-3 mr-1 inline-block" />
                                                                BLOQUEADO
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-bold text-foreground">{usr.Nome}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-medium bg-background">{usr.nivel}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium text-muted-foreground">{usr.unidade}</TableCell>
                                                    <TableCell className="text-sm font-medium text-muted-foreground">{usr.funcao}</TableCell>
                                                    <TableCell className="text-right">
                                                        {usr.id !== user?.id ? (
                                                            <Button
                                                                variant={usr.ativo !== false ? "outline" : "default"}
                                                                size="sm"
                                                                disabled={loadingAction === usr.id}
                                                                className={usr.ativo !== false ? "text-destructive hover:bg-destructive/10 hover:text-destructive border-border" : "bg-green-600 hover:bg-green-700 text-white"}
                                                                onClick={() => handleToggleStatus(usr.id, usr.ativo !== false, usr.Nome)}
                                                            >
                                                                {loadingAction === usr.id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : usr.ativo !== false ? (
                                                                    <>
                                                                        <ShieldOff className="w-4 h-4 mr-2" />
                                                                        Desativar Acesso
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Unlock className="w-4 h-4 mr-2" />
                                                                        Reativar
                                                                    </>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground italic px-3">Você (Não pode desativar)</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {usuarios.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground font-medium">
                                                        Nenhum usuário localizado.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="aprovacoes" className="space-y-6">
                    <Card className="glass-card bg-card/40 border-primary/20">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-6 bg-secondary/10">
                            <div>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <ClipboardCheck className="w-6 h-6 text-primary" />
                                    Central de Aprovações
                                </CardTitle>
                                <CardDescription className="font-medium mt-1 text-muted-foreground/80">
                                    Visitas inseridas manualmente no passado aguardando seu veredito.
                                </CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingAprovacoes ? (
                                <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <span>Buscando pendências...</span>
                                </div>
                            ) : (
                                <div className="rounded-md overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-secondary/30">
                                            <TableRow>
                                                <TableHead className="font-bold text-foreground">Data da Visita</TableHead>
                                                <TableHead className="font-bold text-foreground">PDV</TableHead>
                                                <TableHead className="font-bold text-foreground">Responsável</TableHead>
                                                <TableHead className="font-bold text-foreground mx-auto">Ação</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="bg-background/50">
                                            {visitasPendentes.map((visita) => (
                                                <TableRow key={visita.id} className="hover:bg-muted/50 transition-colors">
                                                    <TableCell className="font-bold text-foreground">
                                                        {format(new Date(visita.data_visita + "T00:00:00"), 'dd/MM/yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-foreground">{visita.codigo_pdv}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{visita.nome_fantasia_pdv}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-bold text-foreground">{visita.avaliador}</div>
                                                        <div className="text-xs text-muted-foreground">{visita.cargo}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex justify-center">
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                className="bg-primary/90 hover:bg-primary text-white"
                                                                onClick={() => setVisitaSelecionada(visita)}
                                                            >
                                                                👁️ Detalhes
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {visitasPendentes.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-medium">
                                                        <div className="flex flex-col items-center justify-center gap-2">
                                                            <CheckCircle2 className="w-10 h-10 text-green-500/50" />
                                                            <p>Zero pendências! Tudo limpo por aqui.</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* Detalhes Modal (Dialog) */}
                            <Dialog open={!!visitaSelecionada} onOpenChange={(open) => !open && setVisitaSelecionada(null)}>
                                <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-100 max-h-[85vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                            <span>🎫 Ticket {visitaSelecionada?.codigo_pdv}</span>
                                            <Badge variant="secondary" className="bg-primary/20 text-primary-foreground text-xs ml-auto">
                                                {visitaSelecionada?.tipo_visita?.toUpperCase() || 'NORMAL'}
                                            </Badge>
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            {visitaSelecionada?.nome_fantasia_pdv}
                                        </DialogDescription>
                                    </DialogHeader>

                                    {visitaSelecionada && (
                                        <div className="space-y-6 mt-4">
                                            {/* Info Block 1 */}
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="space-y-1">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">Avaliador</p>
                                                    <p className="font-medium">{visitaSelecionada.avaliador}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">Vendedor Acompanhado</p>
                                                    <p className="font-medium">{visitaSelecionada.vendedor_acompanhado || 'N/A'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">Canal</p>
                                                    <p className="font-medium">{visitaSelecionada.canal_pdv || 'Não informado'}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">Data Registrada</p>
                                                    <p className="font-medium">{format(new Date(visitaSelecionada.data_visita + "T00:00:00"), 'dd/MM/yyyy')}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">Pontuação FDS</p>
                                                    <p className="font-bold text-amber-500 text-lg">{visitaSelecionada.pontuacao_fds || 0} pts</p>
                                                </div>
                                            </div>

                                            {/* Products Executed */}
                                            {visitaSelecionada.produtos_selecionados && (
                                                <div className="space-y-2 border-t border-zinc-800 pt-4">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">✅ Produtos Encontrados (Positivados)</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {visitaSelecionada.produtos_selecionados.split(',').map((p: string, i: number) => (
                                                            <Badge key={i} variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">{p.trim()}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Ouro / Execution */}
                                            {visitaSelecionada.execucao_selecionada && (
                                                <div className="space-y-2">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">🏆 Indicadores Ouro</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {visitaSelecionada.execucao_selecionada.split(',').map((p: string, i: number) => (
                                                            <Badge key={i} variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">{p.trim()}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Gaps */}
                                            {visitaSelecionada.produtos_nao_selecionados && (
                                                <div className="space-y-2 border-t border-zinc-800 pt-4">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">❌ Produtos Falantes (Gaps Identificados)</p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {visitaSelecionada.produtos_nao_selecionados.split(',').map((p: string, i: number) => (
                                                            <Badge key={i} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">{p.trim()}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* FDS Extra Checks */}
                                            {(visitaSelecionada.fds_precificacao || visitaSelecionada.fds_condicao_produto || visitaSelecionada.fds_vencimento || visitaSelecionada.fds_equipamento) && (
                                                  <div className="space-y-3 border-t border-zinc-800 pt-4">
                                                    <p className="text-zinc-500 font-semibold uppercase text-xs">📋 Detalhes FDS</p>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        {visitaSelecionada.fds_precificacao && <div><span className="text-zinc-400">Precificação:</span> <span className="text-white">{visitaSelecionada.fds_precificacao}</span></div>}
                                                        {visitaSelecionada.fds_condicao_produto && <div><span className="text-zinc-400">Condições:</span> <span className="text-white">{visitaSelecionada.fds_condicao_produto}</span></div>}
                                                        {visitaSelecionada.fds_vencimento && <div><span className="text-zinc-400">Vencimento Validado:</span> <span className="text-white">{visitaSelecionada.fds_vencimento}</span></div>}
                                                        {visitaSelecionada.fds_equipamento && <div><span className="text-zinc-400">Equipamento Gelado:</span> <span className="text-white">{visitaSelecionada.fds_equipamento}</span></div>}
                                                    </div>
                                                  </div>
                                            )}

                                            {/* Notes / PDD */}
                                            {(visitaSelecionada.observacoes || visitaSelecionada.pontos_desenvolver) && (
                                                <div className="space-y-3 border-t border-zinc-800 pt-4 pb-2">
                                                    {visitaSelecionada.observacoes && (
                                                        <div>
                                                            <p className="text-zinc-500 font-semibold uppercase text-xs mb-1">📝 Observações Gerais</p>
                                                            <p className="text-sm bg-zinc-950 p-3 rounded-md italic text-zinc-300 border border-zinc-800">{visitaSelecionada.observacoes}</p>
                                                        </div>
                                                    )}
                                                    {visitaSelecionada.pontos_desenvolver && (
                                                         <div>
                                                             <p className="text-zinc-500 font-semibold uppercase text-xs mb-1">🎯 Pontos a Desenvolver (Coaching)</p>
                                                             <p className="text-sm bg-zinc-950 p-3 rounded-md italic text-zinc-300 border border-zinc-800">{visitaSelecionada.pontos_desenvolver}</p>
                                                         </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <DialogFooter className="sm:justify-between border-t border-zinc-800 pt-4 mt-6">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-destructive border-destructive hover:bg-destructive/10 hidden sm:flex w-full sm:w-auto"
                                            disabled={loadingAction !== null}
                                            onClick={() => {
                                                handleRecusar(visitaSelecionada.id, visitaSelecionada.codigo_pdv);
                                                setVisitaSelecionada(null);
                                            }}
                                        >
                                            {loadingAction === `recusar-${visitaSelecionada?.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                                            RECUSAR TICKET
                                        </Button>
                                        <Button
                                            type="button"
                                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto mt-2 sm:mt-0 font-bold"
                                            disabled={loadingAction !== null}
                                            onClick={() => {
                                                handleAprovar(visitaSelecionada.id, visitaSelecionada.codigo_pdv);
                                                setVisitaSelecionada(null);
                                            }}
                                        >
                                            {loadingAction === `aprovar-${visitaSelecionada?.id}` ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                            APROVAR TICKET
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="configuracoes" className="space-y-6">
                    <Card className="glass-card bg-card/40 border-primary/20 max-w-2xl mx-auto">
                        <CardHeader className="flex flex-col items-start border-b border-border/50 pb-6 bg-secondary/10">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Settings className="w-6 h-6 text-primary" />
                                Configurações Globais
                            </CardTitle>
                            <CardDescription className="font-medium mt-1 text-muted-foreground/80">
                                Defina regras e metas que valerão automaticamente para todos os usuários do sistema.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            {loadingConfig ? (
                                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                    <span>Lendo configurações atuais...</span>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-base font-bold text-foreground">Foco de Visita RGB do Mês</Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Força todos os Avaliadores a preencherem o formulário RGB com este foco pré-definido, bloqueando alterações manuais no celular deles.
                                            </p>
                                        </div>
                                        <div className="w-full sm:w-2/3">
                                            <Select value={configFocoRgb} onValueChange={setConfigFocoRgb}>
                                                <SelectTrigger className="h-12 border-primary/30">
                                                    <SelectValue placeholder="Selecione o Foco Vigente" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Nenhum" className="font-semibold text-muted-foreground">Desativado (Os Avaliadores escolhem livremente)</SelectItem>
                                                    <SelectItem value="RGB - Maiores clientes" className="font-bold text-foreground">RGB - Maiores clientes</SelectItem>
                                                    <SelectItem value="RGB - Maiores quedas" className="font-bold text-foreground">RGB - Maiores quedas</SelectItem>
                                                    <SelectItem value="RGB - Maiores COMPASS não compradores" className="font-bold text-foreground">RGB - Maiores COMPASS não compradores</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-border/40 flex justify-end">
                                        <Button 
                                            onClick={handleSaveConfig} 
                                            disabled={loadingAction === 'saveConfig'}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-12 px-8"
                                        >
                                            {loadingAction === 'saveConfig' ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                            Salvar Alterações
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

        </div>
    );
};

export default AdminData;
