import React, { useEffect, useState, useCallback } from "react";
import { CloudOff, RefreshCw, UploadCloud, Wifi } from "lucide-react";
import { getAllFromDB, deleteFromDB, STORES } from "../lib/indexedDB";
import { processOfflineQueue } from "@/features/offline/api/syncEngine.service";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

export const OfflineSyncManager = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingVisits, setPendingVisits] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const checkPendingQueue = useCallback(async () => {
    try {
      const queue = await getAllFromDB(STORES.OFFLINE_QUEUE);
      setPendingVisits(queue);
    } catch (e) {
      console.error("Erro ao ler fila offline:", e);
    }
  }, []);

  const processQueue = async () => {
    if (!navigator.onLine) {
      toast({
        title: "Atenção",
        description: "Você ainda está sem internet. Tente novamente mais tarde.",
        variant: "destructive"
      });
      return;
    }

    if (pendingVisits.length === 0) return;

    setIsSyncing(true);
    const { successCount, failCount } = await processOfflineQueue();

    setIsSyncing(false);
    await checkPendingQueue(); // Atualiza contador UI

    if (successCount > 0 && failCount === 0) {
      toast({
        title: "Sincronização Concluída!",
        description: `${successCount} Visitas enviadas para a Nuvem com sucesso!`,
        variant: "default",
        className: "bg-green-600 text-white border-none",
      });
    } else if (failCount > 0) {
      toast({
        title: "Sincronização Incompleta",
        description: `${successCount} enviadas. ${failCount} falharam. Tente novamente.`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    checkPendingQueue();

    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Conexão Restabelecida",
        description: "Internet voltou. Preparando sincronização..."
      });
      // Um pequeno delay para evitar engasgos instantâneos ao voltar a rede
      setTimeout(() => {
        checkPendingQueue().then(() => {
           // Tenta auto-processar se houver itens
           processQueue();
        });
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Modo Offline Ativado",
        description: "Você perdeu a conexão. Suas visitas serão salvas localmente.",
        variant: "destructive"
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Polling de segurança a cada 30 min pra varrer se não ficou nada pendente
    const interval = setInterval(() => {
       checkPendingQueue();
    }, 1000 * 60 * 30);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [checkPendingQueue]);

  if (pendingVisits.length === 0 && isOnline) {
    return null; // Oculta o selo se estiver tudo perfeito
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className={`flex flex-col gap-2 p-3 sm:p-4 rounded-xl shadow-2xl border ${isOnline ? 'bg-amber-100 border-amber-300 dark:bg-amber-900/40 dark:border-amber-700/50' : 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900/50'} backdrop-blur-md transition-all`}>
        
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isOnline ? 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-300' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'} animate-pulse`}>
            {isOnline ? <UploadCloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
          </div>
          <div>
            <p className={`text-sm font-bold ${isOnline ? 'text-amber-900 dark:text-amber-100' : 'text-red-900 dark:text-red-100'} m-0 leading-tight`}>
              {isOnline ? "Visitas Pendentes" : "Modo Offline"}
            </p>
            <p className={`text-xs font-medium ${isOnline ? 'text-amber-700 dark:text-amber-300' : 'text-red-600 dark:text-red-300'} m-0 leading-tight mt-0.5`}>
              {pendingVisits.length}{pendingVisits.length === 1 ? ' Visita aguardando' : ' Visitas aguardando'}
            </p>
          </div>
        </div>

        {isOnline && pendingVisits.length > 0 && (
          <Button 
            onClick={processQueue}
            disabled={isSyncing}
            size="sm"
            className="w-full mt-1 bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-95 transition-all text-xs h-8 font-bold"
          >
            {isSyncing ? (
              <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> Sincronizando...</>
            ) : (
              <><Wifi className="w-3.5 h-3.5 mr-2" /> Sincronizar Agora</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
