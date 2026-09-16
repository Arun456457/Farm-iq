import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, X, Check, Share2, PlusSquare, ArrowRight, ShieldCheck } from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('farmiq_app_installed', 'true');
          if (onInstallSuccess) onInstallSuccess();
          onClose();
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      // For iOS, user follows manual steps shown in modal
    } else {
      alert('To install FarmiQ:\n\n• On Chrome/Edge Desktop: Click the Install icon (⤓) in your browser address bar.\n• On Mobile: Tap the 3 dots menu and select "Install app" or "Add to Home screen".');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-md w-full overflow-hidden text-stone-900 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-left">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center border border-white/40 bg-emerald-950">
              <img src="/farmiq-logo.png" alt="FarmiQ Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  PWA Mobile & Desktop
                </span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-white font-['Outfit'] mt-0.5">
                Install FarmiQ
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed mt-1">
            Install FarmiQ on your device for direct 1-tap access, real-time mandi rate updates, full-screen speed, and zero browser tabs!
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 text-left space-y-4 text-xs">
          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Fast 1-Tap Launch</p>
                <p className="text-[11px] text-stone-600">Home screen or desktop icon</p>
              </div>
            </div>
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-950">Full-Screen View</p>
                <p className="text-[11px] text-stone-600">No URL bars or sliding</p>
              </div>
            </div>
          </div>

          {/* Conditional Instructions for iOS Safari */}
          {isIOS ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
              <p className="font-bold text-amber-900 flex items-center gap-1.5 text-xs">
                <Smartphone className="w-4 h-4 text-amber-700" />
                iOS Safari Install Instructions:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-amber-950 font-medium leading-relaxed">
                <li>
                  Tap the <strong className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300"><Share2 className="w-3 h-3 inline" /> Share</strong> button at the bottom of Safari.
                </li>
                <li>
                  Scroll down and tap <strong className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-amber-300"><PlusSquare className="w-3 h-3 inline" /> Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="bg-white px-1.5 py-0.5 rounded border border-amber-300">Add</strong> at the top right to install!
                </li>
              </ol>
            </div>
          ) : (
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-emerald-700" />
                  Desktop (Windows / Mac)
                </span>
                <span className="text-emerald-700 font-bold">1-Click Install</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-700 border-t border-stone-200 pt-2">
                <span className="flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                  Mobile (Android Chrome)
                </span>
                <span className="text-emerald-700 font-bold">Native App Icon</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            {!isIOS && (
              <button
                id="btn-confirm-install-app"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Installing...' : 'Install App Now'}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (isIOS) {
                  localStorage.setItem('farmiq_app_installed', 'true');
                  if (onInstallSuccess) onInstallSuccess();
                }
                onClose();
              }}
              className="py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer text-center"
            >
              {isIOS ? 'Got It, Close' : 'Maybe Later'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
