import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, X, Share, PlusSquare, Download } from 'lucide-react';
import { cn } from "@/lib/utils";

export function PwaInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'other'>('other');

  useEffect(() => {
    // 1. Verificar se já está instalado (Modo Standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // 2. Verificar se o usuário já fechou recentemente (Persistência 7 dias)
    const lastDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (lastDismissed) {
      const now = new Date().getTime();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (now - parseInt(lastDismissed) < sevenDays) return;
    }

    // 3. Detectar Plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIos) {
      setPlatform('ios');
      // No iOS mostramos após um pequeno delay
      setTimeout(() => setShowBanner(true), 3000);
    } else if (isAndroid) {
      setPlatform('android');
    }

    // 4. Capturar Evento de Instalação (Chrome/Android)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-prompt-dismissed', new Date().getTime().toString());
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[9998] md:left-auto md:right-8 md:bottom-8 md:max-w-md animate-in fade-in slide-in-from-bottom-10 duration-500">
      <div className="relative group overflow-hidden bg-card/80 backdrop-blur-2xl border-2 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] p-5">

        {/* Efeito Glow de fundo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-black text-sm uppercase tracking-tight text-foreground">
                Instalar Gestão de Rota
              </h3>
              <button
                onClick={dismiss}
                className="p-1 -mr-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              {platform === 'ios'
                ? 'Tenha acesso rápido: toque em compartilhar e selecione "Adicionar à Tela de Início".'
                : 'Instale o aplicativo na sua tela inicial para acesso offline e melhor desempenho.'}
            </p>

            <div className="mt-4 flex gap-2">
              {platform === 'android' && (
                <Button
                  onClick={handleInstallClick}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest h-9 rounded-xl"
                >
                  <Download className="w-3.5 h-3.5 mr-2" />
                  Instalar Agora
                </Button>
              )}

              {platform === 'ios' && (
                <div className="flex items-center gap-3 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 w-full justify-center">
                  <div className="flex items-center gap-1.5 opacity-60">
                    <Share className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase">+</span>
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-primary">Instrução iOS</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
