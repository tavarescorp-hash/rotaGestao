import React, { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Efeito para Forçar Update Automático (Zero Friction)
  useEffect(() => {
    if (needRefresh) {
      console.log('🔄 Nova versão detectada! Atualizando sistema automaticamente...');
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  // Verificação periódica de atualizações (a cada 10 minutos)
  useEffect(() => {
    const checkInterval = 10 * 60 * 1000; // 10 minutos
    
    // Verificação imediata ao montar
    updateServiceWorker(false);

    const intervalId = setInterval(() => {
      if (!(!offlineReady && !needRefresh)) return;
      updateServiceWorker(false); // apenas verifica sem forçar refresh imediato
    }, checkInterval);

    return () => clearInterval(intervalId);
  }, [offlineReady, needRefresh, updateServiceWorker]);

  // Verificar atualização sempre que o app voltar para o primeiro plano (focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateServiceWorker(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateServiceWorker]);

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] p-4 rounded-xl border-2 border-primary bg-card text-card-foreground shadow-2xl max-w-sm animate-in fade-in slide-in-from-bottom-8">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-foreground mb-1">
              {offlineReady ? 'App pronto para uso offline!' : 'Nova atualização disponível!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {offlineReady
                ? 'Você já pode usar o sistema mesmo sem internet.'
                : 'Uma nova versão do aplicativo Rota Unibeer foi baixada. Deseja atualizar agora para acessar as novidades e correções?'}
            </p>
          </div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex justify-end gap-2 mt-2">
          {needRefresh && (
            <Button 
              onClick={() => updateServiceWorker(true)} 
              className="w-full font-bold bg-primary text-primary-foreground flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar Sistema
            </Button>
          )}
          {offlineReady && (
            <Button onClick={close} variant="outline" className="w-full">
              Entendi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
