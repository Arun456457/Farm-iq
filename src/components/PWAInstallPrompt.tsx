import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Smartphone, Monitor, X, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Device detection
    const ua = navigator.userAgent || '';
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const iosCheck = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsMobile(mobileCheck);
    setIsIOS(iosCheck);

    // Standalone / installed check
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[FarmiQ PWA] Installed successfully!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert(
          '📱 Install on iPhone/iPad:\n\n' +
          '1. Tap the Share button (square with arrow 📤 at the bottom of Safari)\n' +
          '2. Scroll down and tap "Add to Home Screen" ➕\n' +
          '3. Tap "Add" in top right corner. Done!'
        );
      } else {
        alert(
          'Install FarmiQ App:\n\n' +
          '• Chrome / Edge: Click the install icon (🖥️ or ⊕) in the browser address bar.\n' +
          '• Mobile Chrome: Tap Menu (⋮) → "Install app" or "Add to Home screen".'
        );
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
  };

  return { isInstallable, isInstalled, isMobile, isIOS, handleInstallClick };
}

/**
 * Top Navbar Install Button
 */
export const PWAInstallNavButton: React.FC = () => {
  const { isInstalled, isMobile, handleInstallClick } = usePWAInstall();

  if (isInstalled) {
    return (
      <div 
        title="FarmiQ is installed as an App"
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200 rounded-lg cursor-default"
      >
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        <span>App Installed</span>
      </div>
    );
  }

  return (
    <button
      id="btn-install-pwa"
      onClick={handleInstallClick}
      title="Install FarmiQ as a standalone Desktop or Mobile App"
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-linear-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-lg shadow-sm shadow-emerald-200 transition-all transform hover:scale-105 active:scale-95"
    >
      <Download className="w-3.5 h-3.5 animate-bounce" />
      <span>{isMobile ? 'Get App' : 'Install App'}</span>
    </button>
  );
};

/**
 * High-Converting Pop-up Modal when any user opens the link on Mobile or Desktop
 */
export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, isMobile, isIOS, handleInstallClick } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isInstalled) return;

    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('farmiq_pwa_prompt_dismissed');
    if (isDismissed) return;

    // Automatically pop up 1.5 seconds after page loads
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInstalled]);

  if (!showModal || isInstalled) return null;

  const handleDismiss = () => {
    setShowModal(false);
    sessionStorage.setItem('farmiq_pwa_prompt_dismissed', 'true');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-white border border-emerald-200/80 rounded-3xl shadow-2xl shadow-emerald-950/20 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon / Banner */}
        <div className="bg-gradient-to-tr from-emerald-800 via-emerald-700 to-teal-700 px-6 pt-6 pb-5 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
            title="Continue in browser"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg shadow-emerald-950/20 shrink-0 flex items-center justify-center">
              <img src="/icons/icon.svg" alt="FarmiQ Logo" className="w-12 h-12 rounded-xl" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-900/50 text-emerald-200 border border-emerald-500/30 mb-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {isMobile ? 'Official Mobile App' : 'Official Desktop App'}
              </span>
              <h3 className="text-xl font-extrabold tracking-tight leading-none text-white">FarmiQ Agri-Hub</h3>
              <p className="text-xs text-emerald-100 mt-1 font-medium">Direct Farmer-to-Customer Marketplace</p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="text-sm font-semibold text-stone-900 mb-3">
            {isMobile 
              ? '📲 Download & Install on your Phone'
              : '🖥️ Install FarmiQ on your Computer'}
          </div>

          {/* Value Highlights */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-start gap-2.5 text-xs text-stone-600">
              <Zap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Instant 1-Tap Access:</strong> Launches full-screen like a native app from your home screen or desktop.</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-stone-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span><strong>Live Mandi Alerts & Offline Cache:</strong> Check APMC rates and crop preservation guides even without signal.</span>
            </div>
          </div>

          {/* iOS Instructions helper if iPhone */}
          {isIOS && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900 leading-relaxed">
              <strong>iPhone Users:</strong> Tap the <strong>Share</strong> button (📤 at the bottom of Safari) and choose <strong>"Add to Home Screen"</strong>.
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              id="modal-install-btn"
              onClick={() => {
                handleInstallClick();
                handleDismiss();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/30 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>{isMobile ? 'Install Mobile App' : 'Install Desktop App'}</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition"
            >
              Continue in Web Browser
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
