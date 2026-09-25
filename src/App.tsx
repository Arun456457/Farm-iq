import React, { useState, useEffect } from 'react';
import { User, LanguageCode, Invoice, Order } from './types';
import { getStoredUser, setStoredUser, removeAuthToken, setAuthToken, api } from './api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AuthModal } from './components/AuthModal';
import { FarmerDashboard } from './components/FarmerDashboard';
import { CustomerDashboard } from './components/CustomerDashboard';
import { LiveMandiRates } from './components/LiveMandiRates';
import { StorageLogistics } from './components/StorageLogistics';
import { DigitalContracts } from './components/DigitalContracts';
import { AdminDashboard } from './components/AdminDashboard';
import { BuyerDashboard } from './components/BuyerDashboard';
import { AIChatbot } from './components/AIChatbot';
import { LocationPickerModal } from './components/LocationPickerModal';
import { InvoiceModal } from './components/InvoiceModal';
import { UPIPaymentModal } from './components/UPIPaymentModal';
import { InstallAppModal } from './components/InstallAppModal';
import { LiveTrackingModal } from './components/LiveTrackingModal';
import { EditProfileModal } from './components/EditProfileModal';

import { triggerFullPageTranslation } from './utils/translator';

export default function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [language, setLanguage] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem('farmiq_lang') as LanguageCode;
      if (saved && ['en', 'hi', 'te', 'mr'].includes(saved)) return saved;
    } catch {}
    return 'en';
  });

  const handleSetLanguage = (newLang: LanguageCode) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('farmiq_lang', newLang);
    } catch {}
    triggerFullPageTranslation(newLang);
  };

  const [currentTab, setCurrentTab] = useState<string>('landing');
  
  useEffect(() => {
    triggerFullPageTranslation(language);
  }, [language]);
  
  // Auth modal
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authRoleHint, setAuthRoleHint] = useState<'farmer' | 'customer' | 'admin'>('farmer');

  // Global Modals
  const [globalInvoice, setGlobalInvoice] = useState<Invoice | null>(null);
  const [globalInvoiceOrder, setGlobalInvoiceOrder] = useState<Order | null>(null);
  const [isGlobalInvoiceOpen, setIsGlobalInvoiceOpen] = useState(false);

  const [globalPayOrder, setGlobalPayOrder] = useState<Order | null>(null);
  const [isGlobalUPIOpen, setIsGlobalUPIOpen] = useState(false);

  const [isGlobalLocationPickerOpen, setIsGlobalLocationPickerOpen] = useState(false);

  // PWA App Installation State & Initial Popup
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                             window.matchMedia('(display-mode: fullscreen)').matches ||
                             window.matchMedia('(display-mode: minimal-ui)').matches ||
                             (window.navigator as any).standalone === true;
        const storedInstalled = localStorage.getItem('farmiq_app_installed') === 'true';
        return Boolean(isStandalone || storedInstalled);
      }
    } catch {}
    return false;
  });
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed) or previously recorded as installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         (window.navigator as any).standalone === true;
    const alreadyInstalled = localStorage.getItem('farmiq_app_installed') === 'true';

    if (isStandalone || alreadyInstalled) {
      setIsAppInstalled(true);
      setIsInstallModalOpen(false);
      return;
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Popup install app at first open if not dismissed in session and not installed
      const hasDismissed = sessionStorage.getItem('farmiq_install_dismissed');
      const isCurrentlyInstalled = localStorage.getItem('farmiq_app_installed') === 'true';
      if (!hasDismissed && !isCurrentlyInstalled) {
        setTimeout(() => {
          setIsInstallModalOpen(true);
        }, 1200);
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      setIsInstallModalOpen(false);
      localStorage.setItem('farmiq_app_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Watch for standalone display mode changes
    const mq = window.matchMedia('(display-mode: standalone)');
    const handleModeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsAppInstalled(true);
        setIsInstallModalOpen(false);
        localStorage.setItem('farmiq_app_installed', 'true');
      }
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handleModeChange);
    }

    // Initial popup for devices where beforeinstallprompt isn't fired automatically (e.g. iOS or browsers without event)
    const hasDismissed = sessionStorage.getItem('farmiq_install_dismissed');
    let timer: any = null;
    if (!hasDismissed && !alreadyInstalled && !isStandalone) {
      timer = setTimeout(() => {
        setIsInstallModalOpen(true);
      }, 1500);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleModeChange);
      }
    };
  }, []);

  // Real-time multi-device sync indicator
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize or re-sync user with database validation
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      api.getMe()
        .then((res: any) => {
          const freshUser: User = (res && res.user) ? res.user : res;
          if (!freshUser || !freshUser.id) throw new Error('Invalid user');
          setUser(freshUser);
          setStoredUser(freshUser);
          if (currentTab === 'landing') {
            if (freshUser.role === 'farmer') setCurrentTab('my-produce');
            else if (freshUser.role === 'admin') setCurrentTab('admin-overview');
            else if (freshUser.role === 'buyer') setCurrentTab('buyer-orders');
            else setCurrentTab('marketplace');
          }
        })
        .catch(() => {
          // Stale session from purged database: log out completely to landing page
          removeAuthToken();
          setUser(null);
          setCurrentTab('landing');
        });
    } else {
      setUser(null);
    }
  }, []);

  // Multi-device sync refresh
  const triggerSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  // Visibility change: instant refresh when user switches window / laptop
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'register', roleHint: 'farmer' | 'customer' | 'admin' = 'farmer') => {
    setAuthMode(mode);
    setAuthRoleHint(roleHint);
    setIsAuthOpen(true);
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    if (authenticatedUser.role === 'farmer') {
      setCurrentTab('my-produce');
    } else if (authenticatedUser.role === 'admin') {
      setCurrentTab('admin-overview');
    } else if (authenticatedUser.role === 'buyer') {
      setCurrentTab('buyer-orders');
    } else {
      setCurrentTab('marketplace');
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setCurrentTab('landing');
  };

  const handleOpenGlobalInvoice = async (orderId: number) => {
    try {
      const inv = await api.getOrderInvoice(orderId);
      setGlobalInvoice(inv);
      setIsGlobalInvoiceOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load invoice');
    }
  };

  const handleOpenGlobalPayNow = async (orderId: number) => {
    try {
      const orders = await api.getCustomerOrders();
      const ord = orders.find(o => o.id === orderId);
      if (ord) {
        setGlobalPayOrder(ord);
        setIsGlobalUPIOpen(true);
      }
    } catch {
      // fallback
    }
  };

  // Global Live Tracking Modal State
  const [globalTrackingOrder, setGlobalTrackingOrder] = useState<Order | null>(null);
  const [isGlobalTrackingOpen, setIsGlobalTrackingOpen] = useState(false);

  const handleOpenGlobalTracking = async (orderId: number) => {
    try {
      const orders = await api.getCustomerOrders();
      const ord = orders.find(o => o.id === orderId);
      if (ord) {
        setGlobalTrackingOrder(ord);
        setIsGlobalTrackingOpen(true);
      }
    } catch {
      // fallback
    }
  };

  // Listen to incoming direct URL action links (from WhatsApp messages: track, pay, invoice)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const trackParam = params.get('track');
      const payParam = params.get('pay');
      const invoiceParam = params.get('invoice');

      if (tabParam) {
        setCurrentTab(tabParam);
      }
      if (trackParam) {
        handleOpenGlobalTracking(Number(trackParam));
      } else if (payParam) {
        handleOpenGlobalPayNow(Number(payParam));
      } else if (invoiceParam) {
        handleOpenGlobalInvoice(Number(invoiceParam));
      }
    } catch {}
  }, []);

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const handleUserUpdated = (updatedUser: User) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
    triggerSync();
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 font-['Inter'] antialiased w-full max-w-full overflow-x-hidden">
      {/* Top Navbar */}
      <Navbar
        user={user}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        language={language}
        setLanguage={handleSetLanguage}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        isSyncing={isSyncing}
        onManualRefresh={triggerSync}
        onOpenLocationPicker={() => setIsGlobalLocationPickerOpen(true)}
        onOpenInvoice={handleOpenGlobalInvoice}
        onPayNow={handleOpenGlobalPayNow}
        onTrackOrder={handleOpenGlobalTracking}
        onOrderAccepted={triggerSync}
        onOrderRejected={triggerSync}
        isAppInstalled={isAppInstalled}
        onOpenInstallModal={isAppInstalled ? undefined : () => setIsInstallModalOpen(true)}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Landing Page (when logged out or on landing tab) */}
        {(!user || currentTab === 'landing') && (
          <LandingPage
            language={language}
            onSelectRole={(role) => handleOpenAuth('register', role)}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* Farmer Dashboard */}
        {user && user.role === 'farmer' && (
          ['my-produce', 'farmer-orders', 'fpo-lots', 'buyer-requirements', 'disputes', 'payment-settings'].includes(currentTab)
        ) && (
          <FarmerDashboard
            user={user}
            language={language}
            activeSubTab={['my-produce', 'farmer-orders', 'fpo-lots', 'buyer-requirements', 'disputes', 'payment-settings'].includes(currentTab) ? (currentTab as any) : 'my-produce'}
            onProduceAdded={triggerSync}
            onNavigateToStorage={() => setCurrentTab('storage')}
            onSubTabChange={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Customer Dashboard */}
        {user && user.role === 'customer' && (
          ['marketplace', 'customer-orders', 'post-requirement', 'disputes'].includes(currentTab)
        ) && (
          <CustomerDashboard
            user={user}
            language={language}
            activeSubTab={['marketplace', 'customer-orders', 'post-requirement', 'disputes'].includes(currentTab) ? (currentTab as any) : 'marketplace'}
            onOrderPlaced={triggerSync}
            onSubTabChange={(tab) => setCurrentTab(tab)}
          />
        )}

        {/* Admin Dashboard */}
        {user && user.role === 'admin' && currentTab === 'admin-overview' && (
          <AdminDashboard
            user={user}
            language={language}
          />
        )}

        {/* Verified Corporate Buyer Dashboard */}
        {user && user.role === 'buyer' && (currentTab === 'buyer-orders' || currentTab === 'buyer-fpo' || currentTab === 'contracts' || !['mandi-rates', 'storage'].includes(currentTab)) && (
          <BuyerDashboard
            user={user}
            language={language}
            activeSubTab={currentTab === 'buyer-fpo' ? 'buyer-fpo' : currentTab === 'contracts' ? 'contracts' : 'buyer-orders'}
            onSubTabChange={(tab) => setCurrentTab(tab)}
            onContractCreated={triggerSync}
          />
        )}

        {/* Common Modules: Live Mandi Rates */}
        {currentTab === 'mandi-rates' && (
          <LiveMandiRates language={language} user={user} />
        )}

        {/* Common Modules: Storage & Logistics */}
        {currentTab === 'storage' && (
          <StorageLogistics
            user={user}
            language={language}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* Common Modules: Digital Contracts for non-buyer or public */}
        {currentTab === 'contracts' && (!user || user.role !== 'buyer') && (
          <DigitalContracts
            user={user}
            language={language}
            onOpenAuth={handleOpenAuth}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        initialRole={authRoleHint}
        onAuthSuccess={handleAuthSuccess}
        language={language}
      />

      {/* Floating AI Agricultural Chatbot (Gemini-powered) */}
      <AIChatbot
        user={user}
        language={language}
      />

      {/* Global Location & Address Modal */}
      <LocationPickerModal
        isOpen={isGlobalLocationPickerOpen}
        onClose={() => setIsGlobalLocationPickerOpen(false)}
        user={user}
        language={language}
        onAddressSaved={(newAddr) => {
          if (user) {
            const updated = { ...user, delivery_address: newAddr, location: newAddr };
            setUser(updated);
            setStoredUser(updated);
          }
          triggerSync();
        }}
      />

      {/* Global Invoice Modal */}
      <InvoiceModal
        isOpen={isGlobalInvoiceOpen}
        onClose={() => setIsGlobalInvoiceOpen(false)}
        invoice={globalInvoice}
        order={globalInvoiceOrder}
        isCustomer={user?.role === 'customer'}
        language={language}
        onPayNow={() => {
          if (globalInvoice) {
            handleOpenGlobalPayNow(globalInvoice.order_id);
          }
        }}
      />

      {/* Global Real-Time UPI Payment Modal */}
      <UPIPaymentModal
        isOpen={isGlobalUPIOpen}
        onClose={() => setIsGlobalUPIOpen(false)}
        order={globalPayOrder}
        language={language}
        onPaymentSuccess={() => {
          triggerSync();
        }}
      />

      {/* PWA App Installation Modal & Initial Popup */}
      {!isAppInstalled && (
        <InstallAppModal
          isOpen={isInstallModalOpen}
          language={language}
          onClose={() => {
            setIsInstallModalOpen(false);
            sessionStorage.setItem('farmiq_install_dismissed', 'true');
          }}
          deferredPrompt={deferredPrompt}
          onInstallSuccess={() => {
            setIsAppInstalled(true);
            setIsInstallModalOpen(false);
            localStorage.setItem('farmiq_app_installed', 'true');
          }}
        />
      )}

      {/* Global Live Tracking Modal */}
      {isGlobalTrackingOpen && globalTrackingOrder && (
        <LiveTrackingModal
          order={globalTrackingOrder}
          language={language}
          onClose={() => {
            setIsGlobalTrackingOpen(false);
            setGlobalTrackingOrder(null);
          }}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        language={language}
        onUserUpdated={handleUserUpdated}
        onOpenLocationPicker={() => setIsGlobalLocationPickerOpen(true)}
      />
    </div>
  );
}
