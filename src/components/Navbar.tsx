import React, { useState, useRef, useEffect } from 'react';
import { 
  Sprout, RefreshCw, Globe, LogOut, ShieldAlert, Package, ShoppingBag, 
  TrendingUp, Warehouse, FileText, User as UserIcon, MapPin, Download, 
  Menu, X, ChevronRight, CheckCircle2, Phone
} from 'lucide-react';
import { User, LanguageCode } from '../types';
import { translations } from '../translations';
import { NotificationCenter } from './NotificationCenter';
import { triggerFullPageTranslation } from '../utils/translator';

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
  onOpenLocationPicker?: () => void;
  onOpenInvoice?: (orderId: number) => void;
  onPayNow?: (orderId: number) => void;
  onTrackOrder?: (orderId: number) => void;
  onOrderAccepted?: (orderId: number) => void;
  onOrderRejected?: (orderId: number) => void;
  onOpenInstallModal?: () => void;
  onOpenEditProfile?: () => void;
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
  onOpenLocationPicker,
  onOpenInvoice,
  onPayNow,
  onTrackOrder,
  onOrderAccepted,
  onOrderRejected,
  onOpenInstallModal,
  onOpenEditProfile,
}) => {
  const t = translations[language];
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-emerald-100 shadow-xs w-full max-w-full">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-1 sm:gap-2 lg:gap-3 w-full">
          {/* 1. Left: Logo & Brand */}
          <div 
            id="brand-logo" 
            onClick={() => handleSelectTab(user ? (user.role === 'farmer' ? 'my-produce' : user.role === 'admin' ? 'admin-overview' : 'marketplace') : 'landing')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm shadow-emerald-300/60 group-hover:scale-105 transition-transform shrink-0 border border-emerald-400/40 bg-emerald-950">
              <img src="/farmiq-logo.png" alt="FarmiQ Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 font-['Outfit']">FarmiQ</span>
            </div>
          </div>

          {/* 2. Center: Primary role tabs + Active module pill when selected from ☰ menu */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 bg-emerald-50/70 p-1 rounded-xl border border-emerald-100/80 shrink-0">
              {user.role === 'farmer' && (
                <>
                  <button
                    id="nav-my-produce"
                    onClick={() => handleSelectTab('my-produce')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      currentTab === 'my-produce' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    {t.myProduce}
                  </button>
                  <button
                    id="nav-incoming-orders"
                    onClick={() => handleSelectTab('farmer-orders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      currentTab === 'farmer-orders' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                    {t.incomingOrders}
                  </button>
                </>
              )}

              {user.role === 'customer' && (
                <>
                  <button
                    id="nav-marketplace"
                    onClick={() => handleSelectTab('marketplace')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      currentTab === 'marketplace' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    {t.marketplace}
                  </button>
                  <button
                    id="nav-customer-orders"
                    onClick={() => handleSelectTab('customer-orders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      currentTab === 'customer-orders' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    {t.customerOrders}
                  </button>
                </>
              )}

              {user.role === 'admin' && (
                <button
                  id="nav-admin"
                  onClick={() => handleSelectTab('admin-overview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    currentTab === 'admin-overview' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-emerald-800'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                  {t.adminDashboard}
                </button>
              )}

              {user.role === 'buyer' && (
                <>
                  <button
                    id="nav-buyer-orders"
                    onClick={() => handleSelectTab('buyer-orders')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      currentTab === 'buyer-orders' ? 'bg-white text-emerald-800 shadow-xs font-bold' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                    Buyer Orders
                  </button>
                  <button
                    id="nav-buyer-fpo"
                    onClick={() => handleSelectTab('buyer-fpo')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      currentTab === 'buyer-fpo' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-emerald-800'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5 text-emerald-700" />
                    Procure FPO Lots
                  </button>
                </>
              )}

              {/* Active indicator when selecting a module from the ☰ menu */}
              {currentTab === 'contracts' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold shadow-xs">
                  <FileText className="w-3.5 h-3.5 text-purple-700" />
                  Digital Contracts
                </span>
              )}
              {currentTab === 'mandi-rates' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold shadow-xs">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  Live Mandi Rates
                </span>
              )}
              {currentTab === 'storage' && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold shadow-xs">
                  <Warehouse className="w-3.5 h-3.5 text-blue-600" />
                  Storage & Logistics
                </span>
              )}
            </nav>
          )}

          {/* 3. Right: Location, Install App, Notifications, Language, User profile & THREE LINES MENU at corner */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Install App button ("install option above") */}
            {onOpenInstallModal && (
              <button
                id="btn-install-app-header"
                type="button"
                onClick={onOpenInstallModal}
                title="Install FarmiQ on Desktop or Mobile"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] sm:text-xs font-bold shadow-xs transition cursor-pointer shrink-0 active:scale-95"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Install FarmiQ</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}

            {/* Location button */}
            {user && onOpenLocationPicker && (
              <button
                type="button"
                onClick={onOpenLocationPicker}
                title="Change delivery or farm location on interactive map"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-stone-700 hover:text-emerald-900 transition text-xs font-semibold cursor-pointer max-w-[110px] sm:max-w-[160px] shrink-0 shadow-2xs"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate text-[11px]">
                  {user.delivery_address || user.location || 'Set Location'}
                </span>
              </button>
            )}

            {/* Notification Center */}
            {user && (
              <NotificationCenter
                user={user}
                onOrderAccepted={onOrderAccepted}
                onOrderRejected={onOrderRejected}
                onOpenInvoice={onOpenInvoice}
                onPayNow={onPayNow}
                onTrackOrder={onTrackOrder}
              />
            )}

            {/* Language Switcher */}
            <div className="relative flex items-center shrink-0">
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 absolute left-1.5 sm:left-2 text-stone-500 pointer-events-none" />
              <select
                id="language-selector"
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as LanguageCode;
                  setLanguage(newLang);
                  triggerFullPageTranslation(newLang);
                }}
                className="pl-5 sm:pl-6.5 pr-1 sm:pr-1.5 py-1 text-[11px] sm:text-xs font-semibold bg-stone-50 border border-stone-200 rounded-lg text-stone-700 outline-none hover:bg-stone-100 transition cursor-pointer"
              >
                <option value="en">EN</option>
                <option value="hi">HI</option>
                <option value="te">TE</option>
                <option value="mr">MR</option>
              </select>
            </div>

            {/* User Profile */}
            {user ? (
              <button 
                type="button"
                id="btn-nav-profile-pill"
                onClick={() => {
                  if (onOpenEditProfile) onOpenEditProfile();
                }}
                className="flex items-center gap-1.5 pl-1 sm:pl-1.5 border-l border-stone-200 shrink-0 hover:opacity-80 transition cursor-pointer text-left"
                title={`${user.full_name} (${user.role}) - Click to edit profile`}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-2 ring-emerald-100">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden xl:flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-bold text-stone-800 whitespace-nowrap max-w-[90px] xl:max-w-[120px] truncate">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-200/70 shrink-0">
                    {user.role}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  id="btn-nav-login"
                  onClick={() => onOpenAuth('login')}
                  className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                >
                  {t.login}
                </button>
                <button
                  id="btn-nav-register"
                  onClick={() => onOpenAuth('register')}
                  className="px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs shadow-emerald-200 transition"
                >
                  {t.createAccount}
                </button>
              </div>
            )}

            {/* 4. AT CORNER: THREE LINES BUTTON (☰) WITH DROPDOWN MENU */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  id="btn-three-lines-menu"
                  type="button"
                  onClick={toggleMenu}
                  title={isMenuOpen ? "Close FarmiQ Menu" : "Open FarmiQ Menu: Digital Contracts, Mandi Rates, Storage & Logout"}
                  className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 shadow-2xs active:scale-95 ml-0.5 border ${
                    isMenuOpen 
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-500 ring-2 ring-emerald-200' 
                      : 'bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 border-stone-200'
                  }`}
                  aria-label="Navigation Menu"
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? (
                    <X className="w-4 h-4 text-emerald-900 shrink-0" />
                  ) : (
                    <Menu className="w-4 h-4 text-emerald-900 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-emerald-950 hidden sm:inline">
                    {isMenuOpen ? 'Close' : 'Menu'}
                  </span>
                </button>

                {/* DROPDOWN MENU - DROPS DOWN FROM THE ☰ BUTTON */}
                {isMenuOpen && (
                  <div 
                    id="farmiq-dropdown-menu"
                    className="absolute right-0 top-full mt-2 w-72 sm:w-84 max-w-[92vw] bg-white rounded-2xl shadow-2xl border border-stone-200/95 z-50 overflow-hidden text-stone-900 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* Top: Profile Card with Edit Profile */}
                    <div className="p-3 bg-gradient-to-br from-emerald-50/90 to-teal-50/80 border-b border-stone-200/90">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 ring-2 ring-emerald-200">
                            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {user.full_name}
                            </p>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200 inline-block">
                              {user.role}
                            </span>
                          </div>
                        </div>
                        <button
                          id="menu-item-edit-profile"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            if (onOpenEditProfile) onOpenEditProfile();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                          title="Edit Profile"
                        >
                          <UserIcon className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-stone-600 space-y-0.5 pt-1.5 border-t border-emerald-200/60">
                        <p className="truncate flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="font-semibold text-stone-800">{user.phone || 'No phone set'}</span>
                        </p>
                        <p className="truncate flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="text-stone-500 truncate">{user.delivery_address || user.location || 'Location not set'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Menu Options List - Stood one by one vertically */}
                    <div className="p-1.5 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                      {/* Mobile Primary Views */}
                      {user.role === 'farmer' && (
                        <div className="contents md:hidden">
                          <button
                            id="menu-item-my-produce"
                            type="button"
                            onClick={() => {
                              handleSelectTab('my-produce');
                              setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                              currentTab === 'my-produce' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-xs">{t.myProduce}</span>
                            </div>
                            {currentTab === 'my-produce' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                          </button>
                          <button
                            id="menu-item-farmer-orders"
                            type="button"
                            onClick={() => {
                              handleSelectTab('farmer-orders');
                              setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                              currentTab === 'farmer-orders' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <ShoppingBag className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-xs">{t.incomingOrders}</span>
                            </div>
                            {currentTab === 'farmer-orders' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                          </button>
                        </div>
                      )}

                      {user.role === 'customer' && (
                        <div className="contents md:hidden">
                          <button
                            id="menu-item-marketplace"
                            type="button"
                            onClick={() => {
                              handleSelectTab('marketplace');
                              setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                              currentTab === 'marketplace' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-xs">{t.marketplace}</span>
                            </div>
                            {currentTab === 'marketplace' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                          </button>
                          <button
                            id="menu-item-customer-orders"
                            type="button"
                            onClick={() => {
                              handleSelectTab('customer-orders');
                              setIsMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                              currentTab === 'customer-orders' ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'hover:bg-stone-50 text-stone-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="text-xs">{t.customerOrders}</span>
                            </div>
                            {currentTab === 'customer-orders' && <span className="text-[10px] text-emerald-600 font-bold">Active</span>}
                          </button>
                        </div>
                      )}

                      {/* 1. Digital Contracts */}
                      <button
                        id="menu-item-contracts"
                        type="button"
                        onClick={() => {
                          handleSelectTab('contracts');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                          currentTab === 'contracts'
                            ? 'bg-purple-50 text-purple-900 font-bold border border-purple-200'
                            : 'hover:bg-purple-50/50 text-stone-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                          <span className="text-xs truncate">{t.digitalContracts}</span>
                        </div>
                        <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded shrink-0">
                          Escrow
                        </span>
                      </button>

                      {/* 2. Live Mandi Rates */}
                      <button
                        id="menu-item-mandi"
                        type="button"
                        onClick={() => {
                          handleSelectTab('mandi-rates');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                          currentTab === 'mandi-rates'
                            ? 'bg-amber-50 text-amber-900 font-bold border border-amber-200'
                            : 'hover:bg-amber-50/50 text-stone-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <TrendingUp className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-xs truncate">{t.liveMandiRates}</span>
                        </div>
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                          APMC Live
                        </span>
                      </button>

                      {/* 3. Storage & Logistics */}
                      <button
                        id="menu-item-storage"
                        type="button"
                        onClick={() => {
                          handleSelectTab('storage');
                          setIsMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition cursor-pointer ${
                          currentTab === 'storage'
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                            : 'hover:bg-blue-50/50 text-stone-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Warehouse className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-xs truncate">{t.storageLogistics}</span>
                        </div>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
                          Cold Chain
                        </span>
                      </button>

                      {/* 4. Change Location */}
                      {onOpenLocationPicker && (
                        <button
                          id="menu-item-location"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenLocationPicker();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-emerald-50/60 text-stone-700 font-medium transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs truncate">Change Location</span>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                            Map GPS
                          </span>
                        </button>
                      )}

                      {/* 5. Live Sync */}
                      <button
                        id="menu-item-sync"
                        type="button"
                        onClick={onManualRefresh}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-emerald-50/60 text-stone-700 font-medium transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <RefreshCw className={`w-4 h-4 text-teal-600 shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
                          <span className="text-xs truncate">{t.syncActive}</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      </button>

                      {/* 6. Install FarmiQ */}
                      {onOpenInstallModal && (
                        <button
                          id="menu-item-install-app"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onOpenInstallModal();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-emerald-50/60 text-stone-700 font-medium transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Download className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="text-xs truncate">Install FarmiQ</span>
                          </div>
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                            1-Click PWA
                          </span>
                        </button>
                      )}

                      {/* Divider */}
                      <div className="border-t border-stone-200 my-1 pt-1">
                        {/* 7. Logout Option (LAST item) */}
                        <button
                          id="btn-menu-logout"
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-red-50 text-red-700 font-semibold transition cursor-pointer active:scale-98"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <LogOut className="w-4 h-4 text-red-600 shrink-0" />
                            <span className="text-xs truncate">Logout from FarmiQ</span>
                          </div>
                          <span className="text-[9px] font-bold text-white bg-red-600 px-2 py-0.5 rounded shadow-2xs shrink-0">
                            SIGN OUT
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
