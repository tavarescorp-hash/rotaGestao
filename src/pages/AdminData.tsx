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
import { uploadBasePDVs, uploadProdutosFDS, getUsers, toggleUserStatus, createUserAdmin, downloadBasePDVs, downloadProdutosFDS, buscarVisitasPendentes, buscarVisitas, aprovarVisita, recusarVisita, getConfiguracao, setConfiguracao, getEmpresas } from '@/lib/api';
import { format } from 'date-fns';
import { VisitaModalDialog } from '@/features/relatorios/components/VisitaModalDialog';
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

    const isMaster = user?.nivel === 'Master';
    const isAnalista = user?.funcao?.toUpperCase().includes('ANALISTA') || user?.nivel === 'Niv0' || user?.nivel === 'Niv5' || isMaster;

    // SaaS Tenant Selector
    const [empresas, setEmpresas] = useState<any[]>([]);
    const [selectedEmpresaId, setSelectedEmpresaId] = useState<number>(user?.empresa_id || 1);
    
    // O usuário "Ativo" para a tela de AdminData. Se for Master, ele age em nome da Empresa Selecionada
    const activeUser = isMaster && selectedEmpresaId ? { ...user, empresa_id: selectedEmpresaId } : user;

    useEffect(() => {
        if (isMaster) {
            getEmpresas().then(data => {
                setEmpresas(data);
                if (data.length > 0 && selectedEmpresaId === 0) {
                    setSelectedEmpresaId(data[0].id);
                }
            });
        }
    }, [isMaster]);

    useEffect(() => {
        if (isAnalista) {
            fetchUsers();
            fetchAprovacoes();
            fetchConfiguracoes();
        }
    }, [isAnalista, selectedEmpresaId]);

    const fetchAprovacoes = async () => {
        setLoadingAprovacoes(true);
        const data = await buscarVisitasPendentes(activeUser);
        setVisitasPendentes(data);
        setLoadingAprovacoes(false);
    };

    const fetchConfiguracoes = async () => {
        setLoadingConfig(true);
        const focoRgb = await getConfiguracao('foco_rgb_mes', activeUser);
        setConfigFocoRgb(focoRgb || 'Nenhum');
        setLoadingConfig(false);
    };

    const handleSaveConfig = async () => {
        setLoadingAction('saveConfig');
        const valorParaSalvar = configFocoRgb === 'Nenhum' ? '' : configFocoRgb;
        const success = await setConfiguracao('foco_rgb_mes', valorParaSalvar, activeUser);
        
        if (success) {
            toast({ title: "Configuração Salva", description: "A nova diretriz Foco RGB foi salva com sucesso e já está valendo para todos os avaliadores.", className: "bg-green-600 text-white" });
        } else {
            toast({ title: "Erro", description: "Não foi possível sincronizar a configuração.", variant: "destructive" });
        }
        setLoadingAction(null);
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        const data = await getUsers(activeUser);
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

            // Converte a planilha para JSON, pulando linhas vazias sem forçar strings vazias
            const rawData = XLSX.utils.sheet_to_json(worksheet);
            
            // Filtro rigoroso: O objeto deve existir e ter as propriedades básicas válidas
            const jsonData = rawData.filter((row: any) => {
              if (type === 'pdvs') {
                 // PDV exige obrigatoriamente um código válido para existir
                 return row && row.codigo && String(row.codigo).trim() !== "";
              }
              // Para produtos, deve ter NOME DO PRODUTO e CANAL
              if (type === 'produtos') {
                 return row && row.PRODUTO && String(row.PRODUTO).trim() !== "" && row.CANAL;
              }
              return true;
            });

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

            // Pass the user object to the upload function
            const response = await uploadFunc(jsonData, activeUser);

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
            const data = await downloadFunc(activeUser);
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

    const handleDownloadVisitas = async () => {
        toast({ title: "Iniciando Download...", description: "Extraindo histórico completo de visitas..." });
        try {
            const data = await buscarVisitas(activeUser);
            if (!data || data.length === 0) {
                toast({ title: "Ops", description: "Não há visitas ou permissão insufiente.", variant: "destructive" });
                return;
            }
            
            // Formatando e selecionando colunas ricas
            const excelData = data.map((v: any) => {
                const { id, respostas, respostas_json_dynamic, created_at, ...cleanVisita } = v;
                return {
                    "DATA": v.data_visita,
                    "UNIDADE": v.unidade,
                    "AVALIADOR": v.avaliador,
                    "CARGO": v.cargo,
                    "VENDEDOR": v.nome_vendedor || v.vendedor,
                    "CODIGO_VENDEDOR": v.codigo_vendedor,
                    "PDV": v.codigo_pdv,
                    "NOME_FANTASIA": v.nome_fantasia_pdv,
                    "POTENCIAL": v.potencial_cliente,
                    "CANAL_IDENTIFICADO": v.canal_identificado,
                    "CANAL_CADASTRADO": v.canal_cadastrado,
                    "INDICADOR": v.indicador_avaliado,
                    "PONTUACAO": v.pontuacao_total,
                    "OBS_GERAL": v.observacoes,
                    "PRODUTOS_SEL": v.produtos_selecionados,
                    "EXEC_SEL": v.execucao_selecionada,
                    "PONTOS_FORTES": v.pontos_fortes,
                    "A_DESENVOLVER": v.pontos_desenvolver,
                    "COACHING": v.passos_coaching,
                    "STATUS": v.status_aprovacao
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            // Auto ajusta largura das colunas
            const wscols = Object.keys(excelData[0] || {}).map(() => ({ wch: 20 }));
            worksheet['!cols'] = wscols;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Visitas");
            XLSX.writeFile(workbook, "Relatorio_Visitas_Rota_Unibeer.xlsx");

            toast({ title: "Download Concluído", description: "Histórico transferido para o Excel com sucesso!", className: "bg-green-600 border-none text-white" });
        } catch (error) {
            console.error("Erro no download de visitas:", error);
            toast({ title: "Erro", description: "Falha ao extrair a matriz do banco.", variant: "destructive" });
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

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoadingAction('addUser');

        if (!newUser.Nome || !newUser.email || !newUser.password || !newUser.nivel || !newUser.unidade || !newUser.funcao) {
            toast({ title: "Campos Incompletos", description: "Preencha todos os campos obrigatórios, incluindo a Função.", variant: "destructive" });
            setLoadingAction(null);
            return;
        }

        const success = await createUserAdmin({...newUser, empresa_id: selectedEmpresaId});

        if (success.success) {
            toast({
                title: "Usuário Criado",
                description: `${success.message} Login: ${newUser.email}`,
                className: "bg-green-600 border-none text-white",
            });
            setIsDialogOpen(false);
            setNewUser({ Nome: '', email: '', password: '', unidade: '', funcao: '', nivel: '' });
            fetchUsers(); // Recarregar lista
        } else {
            toast({
                title: "Falha na Criação",
                description: success.message,
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                            <Database className="w-8 h-8 text-primary" />
                            Gestão Central
                        </h1>
                        <p className="text-muted-foreground font-medium mt-2">
                            Área restrita de Administração do Sistema. Faça upload de diretrizes ou ajuste acessos.
                        </p>
                    </div>
                    {isMaster && (
                        <div className="w-full md:w-[300px] border border-primary/20 p-3 rounded-xl bg-primary/5 shadow-inner">
                            <Label className="text-[10px] text-primary uppercase tracking-widest font-black mb-1.5 block">Nível Master: Empresa Selecionada</Label>
                            <Select 
                                value={String(selectedEmpresaId)} 
                                onValueChange={(val) => setSelectedEmpresaId(Number(val))}
                            >
                                <SelectTrigger className="w-full bg-card/80 backdrop-blur-md border-primary/30 h-10 shadow-sm focus:ring-primary/40 font-semibold focus:ring-offset-background">
                                    <SelectValue placeholder="Selecione o Cliente" />
                                </SelectTrigger>
                                <SelectContent>
                                    {empresas.map((emp) => (
                                        <SelectItem key={emp.id} value={String(emp.id)} className="font-medium cursor-pointer">
                                            {emp.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Card PDVS */}
                        <Card className="glass-card bg-card/40 border-primary/20 overflow-hidden relative group hover:border-primary/40 transition-colors">
                            <CardHeader className="bg-gradient-to-br from-primary/10 to-transparent border-b border-border/50 pb-8">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileSpreadsheet className="w-6 h-6 text-primary" />
                                    Base (PDVs)
                                </CardTitle>
                                <CardDescription className="font-medium text-muted-foreground/80 mt-2">
                                    Substitui a carteira de clientes, unidades e organograma de vendedores/supervisores.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[220px]">
                                {loadingPdvs ? (
                                    <div className="flex flex-col items-center gap-4 text-primary animate-pulse">
                                        <Loader2 className="w-12 h-12 animate-spin" />
                                        <p className="font-bold tracking-tight">Recriando Tabela...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <UploadCloud className="w-8 h-8 text-primary" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <h3 className="font-bold">Substituir Planilha</h3>
                                        </div>
                                        <div className="flex gap-2 w-full mt-4 flex-col">
                                            <div className="relative w-full">
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls, .csv"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => handleFileUpload(e, 'pdvs')}
                                                    disabled={loadingPdvs}
                                                />
                                                <Button className="w-full pointer-events-none shadow-md" variant="secondary">
                                                    Carregar e Substituir
                                                </Button>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full shadow-sm font-bold border-primary/20"
                                                onClick={() => handleDownload('pdvs')}
                                                disabled={loadingPdvs}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Baixar Base Atual
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
                                    Matriz FDS
                                </CardTitle>
                                <CardDescription className="font-medium text-muted-foreground/80 mt-2">
                                    Atualize materiais de execução do Foto de Sucesso.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[220px]">
                                {loadingProdutos ? (
                                    <div className="flex flex-col items-center gap-4 text-purple-600 dark:text-purple-400 animate-pulse">
                                        <Loader2 className="w-12 h-12 animate-spin" />
                                        <p className="font-bold tracking-tight">Sincronizando...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 w-full">
                                        <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                            <UploadCloud className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <h3 className="font-bold">Substituir Matriz FDS</h3>
                                        </div>
                                        <div className="flex gap-2 w-full mt-4 flex-col">
                                            <div className="relative w-full">
                                                <input
                                                    type="file"
                                                    accept=".xlsx, .xls, .csv"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => handleFileUpload(e, 'produtos')}
                                                    disabled={loadingProdutos}
                                                />
                                                <Button className="w-full pointer-events-none shadow-md bg-purple-600 hover:bg-purple-700 text-white border-none">
                                                    Carregar e Substituir
                                                </Button>
                                            </div>
                                            <Button
                                                variant="outline"
                                                className="w-full shadow-sm font-bold border-purple-500/20 text-purple-600 dark:text-purple-400"
                                                onClick={() => handleDownload('produtos')}
                                                disabled={loadingProdutos}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Baixar Base Atual
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* NOVO: Relatório de Visitas */}
                        <Card className="glass-card bg-card/40 border-emerald-500/30 overflow-hidden relative group hover:border-emerald-500/50 transition-colors shadow-lg shadow-emerald-500/5">
                            <CardHeader className="bg-gradient-to-br from-emerald-500/10 to-transparent border-b border-border/50 pb-8">
                                <CardTitle className="flex items-center gap-2 text-xl text-emerald-600 dark:text-emerald-400">
                                    <Download className="w-6 h-6" />
                                    Exportar Visitas
                                </CardTitle>
                                <CardDescription className="font-medium text-muted-foreground/80 mt-2">
                                    Faça o download do histórico completo de todas as visitas realizadas até o momento.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[220px]">
                                <div className="flex flex-col items-center gap-4 w-full">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FileSpreadsheet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div className="text-center space-y-1 mb-2">
                                        <h3 className="font-bold">Gerador de Relatórios XLS</h3>
                                        <p className="text-xs text-muted-foreground">Extrai todas as colunas em formato Excel (XLSX) formatado e limpo.</p>
                                    </div>
                                    <Button
                                        className="w-full shadow-md font-bold bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-md transition-all group-hover:shadow-emerald-500/20"
                                        onClick={handleDownloadVisitas}
                                    >
                                        <Download className="w-5 h-5 mr-3 animate-bounce shadow-emerald-500/50" />
                                        Baixar Visitas em Excel (XLS)
                                    </Button>
                                </div>
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
                                    <form onSubmit={handleAddUser}>
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
                                                            <SelectItem value="Niv1">Niv1 (Diretor)</SelectItem>
                                                            <SelectItem value="Niv2">Niv2 (Gerente Comercial)</SelectItem>
                                                            <SelectItem value="Niv3">Niv3 (Gerente de Vendas)</SelectItem>
                                                            <SelectItem value="Niv4">Niv4 (Supervisor de Vendas)</SelectItem>
                                                            <SelectItem value="Niv5">Niv5 (Analista)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Função (Cargo no sistema)</Label>
                                                <Select value={newUser.funcao} onValueChange={v => setNewUser({ ...newUser, funcao: v })}>
                                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Diretor">Diretor</SelectItem>
                                                        <SelectItem value="Gerente Comercial">Gerente Comercial</SelectItem>
                                                        <SelectItem value="Gerente de Vendas">Gerente de Vendas</SelectItem>
                                                        <SelectItem value="Supervisor de Vendas">Supervisor de Vendas</SelectItem>
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
                                                        <div className="flex justify-center items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-8"
                                                                disabled={loadingAction !== null}
                                                                onClick={() => handleAprovar(visita.id, visita.codigo_pdv)}
                                                            >
                                                                {loadingAction === `aprovar-${visita.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                                                                Aprovar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-destructive border-destructive hover:bg-destructive/10 font-bold h-8"
                                                                disabled={loadingAction !== null}
                                                                onClick={() => handleRecusar(visita.id, visita.codigo_pdv)}
                                                            >
                                                                {loadingAction === `recusar-${visita.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                                                                Recusar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="h-8 font-bold text-xs"
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


                            <VisitaModalDialog 
                                selectedVisita={visitaSelecionada} 
                                onClose={() => setVisitaSelecionada(null)}
                                actionFooter={
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-destructive border-destructive hover:bg-destructive/10 hidden sm:flex w-full sm:w-auto h-12"
                                            disabled={loadingAction !== null}
                                            onClick={() => {
                                                if (visitaSelecionada) {
                                                    handleRecusar(visitaSelecionada.id, visitaSelecionada.codigo_pdv);
                                                    setVisitaSelecionada(null);
                                                }
                                            }}
                                        >
                                            {loadingAction === `recusar-${visitaSelecionada?.id}` ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
                                            RECUSAR TICKET
                                        </Button>
                                        <Button
                                            type="button"
                                            className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto mt-0 font-bold h-12"
                                            disabled={loadingAction !== null}
                                            onClick={() => {
                                                if (visitaSelecionada) {
                                                    handleAprovar(visitaSelecionada.id, visitaSelecionada.codigo_pdv);
                                                    setVisitaSelecionada(null);
                                                }
                                            }}
                                        >
                                            {loadingAction === `aprovar-${visitaSelecionada?.id}` ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
                                            APROVAR TICKET
                                        </Button>
                                    </>
                                }
                            />
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
