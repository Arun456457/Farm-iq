import React from 'react';
import { Sprout, RefreshCw, Globe, LogOut, ShieldAlert, Package, ShoppingBag, TrendingUp, Warehouse, FileText, User as UserIcon } from 'lucide-react';
import { User, LanguageCode } from '../types';
import { translations } from '../translations';
import { PWAInstallNavButton } from './PWAInstallPrompt';

interface NavbarProps {
  user: User | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  isSyncing: boolean;
  onManualRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  currentTab,
  setCurrentTab,
  language,
  setLanguage,
  onLogout,
  onOpenAuth,
  isSyncing,
  onManualRefresh,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div 
            id="brand-logo" 
            onClick={() => setCurrentTab(user ? (user.role === 'farmer' ? 'my-produce' : user.role === 'admin' ? 'admin-overview' : 'marketplace') : 'landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-emerald-950">FarmiQ</span>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">Direct ↔ ₹2/km</span>
              </div>
              <p className="text-[11px] text-emerald-700 hidden sm:block font-medium">Farmer-to-Customer Agricultural Hub</p>
            </div>
          </div>

          {/* Navigation Items (when logged in) */}
          {user && (
            <nav className="hidden lg:flex items-center gap-1 bg-emerald-50/60 p-1 rounded-xl border border-emerald-100/80">
              {user.role === 'farmer' && (
                <>
                  <button
                    id="nav-my-produce"
                    onClick={() => setCurrentTab('my-produce')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentTab === 'my-produce' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    {t.myProduce}
                  </button>
                  <button
                    id="nav-incoming-orders"
                    onClick={() => setCurrentTab('farmer-orders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentTab === 'farmer-orders' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t.incomingOrders}
                  </button>
                </>
              )}

              {user.role === 'customer' && (
                <>
                  <button
                    id="nav-marketplace"
                    onClick={() => setCurrentTab('marketplace')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentTab === 'marketplace' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    {t.marketplace}
                  </button>
                  <button
                    id="nav-customer-orders"
                    onClick={() => setCurrentTab('customer-orders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      currentTab === 'customer-orders' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {t.customerOrders}
                  </button>
                </>
              )}

              {user.role === 'admin' && (
                <button
                  id="nav-admin"
                  onClick={() => setCurrentTab('admin-overview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentTab === 'admin-overview' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {t.adminDashboard}
                </button>
              )}

              {/* Common Modules */}
              <button
                id="nav-mandi-rates"
                onClick={() => setCurrentTab('mandi-rates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'mandi-rates' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                {t.liveMandiRates}
              </button>
              <button
                id="nav-storage"
                onClick={() => setCurrentTab('storage')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'storage' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                }`}
              >
                <Warehouse className="w-3.5 h-3.5 text-blue-600" />
                {t.storageLogistics}
              </button>
              <button
                id="nav-contracts"
                onClick={() => setCurrentTab('contracts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'contracts' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                {t.digitalContracts}
              </button>
            </nav>
          )}

          {/* Right Actions: PWA Install, Sync status, Language, User profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            <PWAInstallNavButton />

            {/* Real-time sync badge */}
            <div 
              id="live-sync-indicator"
              onClick={onManualRefresh}
              title="Click to manually refresh feed across devices"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-800 cursor-pointer hover:bg-emerald-100 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full bg-emerald-500 ${isSyncing ? 'animate-ping' : 'animate-pulse'}`} />
              <span className="hidden sm:inline">{t.syncActive}</span>
              <RefreshCw className={`w-3 h-3 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>

            {/* Language Switcher */}
            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 absolute left-2 text-stone-500 pointer-events-none" />
              <select
                id="language-selector"
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="pl-7 pr-2 py-1 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg text-stone-700 outline-none hover:bg-stone-100 transition"
              >
                <option value="en">EN (English)</option>
                <option value="hi">HI (हिन्दी)</option>
                <option value="te">TE (తెలుగు)</option>
                <option value="mr">MR (मराठी)</option>
              </select>
            </div>

            {/* Auth Buttons or User Profile */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-stone-800 leading-tight">{user.full_name}</p>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Logout"
                  className="p-1.5 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-nav-login"
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                >
                  {t.login}
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => onOpenAuth('register')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs shadow-emerald-200 transition"
                >
                  {t.createAccount}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Nav strip */}
        {user && (
          <div className="flex lg:hidden overflow-x-auto py-2 gap-2 border-t border-stone-100 no-scrollbar">
            {user.role === 'farmer' && (
              <>
                <button
                  onClick={() => setCurrentTab('my-produce')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    currentTab === 'my-produce' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {t.myProduce}
                </button>
                <button
                  onClick={() => setCurrentTab('farmer-orders')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    currentTab === 'farmer-orders' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {t.incomingOrders}
                </button>
              </>
            )}
            {user.role === 'customer' && (
              <>
                <button
                  onClick={() => setCurrentTab('marketplace')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    currentTab === 'marketplace' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {t.marketplace}
                </button>
                <button
                  onClick={() => setCurrentTab('customer-orders')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    currentTab === 'customer-orders' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {t.customerOrders}
                </button>
              </>
            )}
            {user.role === 'admin' && (
              <button
                onClick={() => setCurrentTab('admin-overview')}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  currentTab === 'admin-overview' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
                }`}
              >
                {t.adminDashboard}
              </button>
            )}
            <button
              onClick={() => setCurrentTab('mandi-rates')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                currentTab === 'mandi-rates' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {t.liveMandiRates}
            </button>
            <button
              onClick={() => setCurrentTab('storage')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                currentTab === 'storage' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {t.storageLogistics}
            </button>
            <button
              onClick={() => setCurrentTab('contracts')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                currentTab === 'contracts' ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-700'
              }`}
            >
              {t.digitalContracts}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
