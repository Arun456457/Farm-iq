import React from 'react';
import { Sprout, ShoppingBag, Truck, TrendingUp, ShieldCheck, ArrowRight, UserCheck, Bot } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations, tr } from '../translations';

interface LandingPageProps {
  language: LanguageCode;
  onSelectRole: (role: 'farmer' | 'customer') => void;
  onOpenAuth: (mode: 'login' | 'register', roleHint?: 'farmer' | 'customer' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  onSelectRole,
  onOpenAuth,
}) => {
  const t = translations[language] || translations.en;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/50 via-white to-stone-50 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center w-full">
        {/* Floating badge */}
        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-2xl sm:rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-6 shadow-xs max-w-full text-center">
          <Sprout className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{tr(t.directHubBadge || "Direct Farmer ↔ Customer Agriculture Hub", language)}</span>
          <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span className="font-semibold text-emerald-800">{tr(t.lowCostTransportBadge || "Low-Cost Direct Transport", language)}</span>
        </div>

        {/* Brand Logo Emblem */}
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden shadow-xl shadow-emerald-600/25 border-2 border-emerald-400/50 bg-emerald-950 hover:scale-105 transition-transform duration-300">
            <img src="/farmiq-logo.png" alt="FarmiQ Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight mb-4 font-['Outfit']">
          {tr(t.appName, language)}
        </h1>
        <p className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 font-['Outfit'] max-w-3xl mx-auto leading-snug">
          "{tr(t.tagline, language)}"
        </p>
        <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {tr(t.heroDesc, language)}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            id="btn-landing-register"
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-200 flex items-center gap-2 transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            {tr(t.createAccount, language)}
          </button>
          <button
            id="btn-landing-login"
            onClick={() => onOpenAuth('login')}
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm border border-stone-300 shadow-xs flex items-center gap-2 transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-emerald-700" />
            {tr(t.login, language)}
          </button>
        </div>

        {/* STRICT TWO ROLE CARDS: Farmer vs Customer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Farmer Card */}
          <div 
            id="role-card-farmer"
            onClick={() => onSelectRole('farmer')}
            className="group relative bg-white rounded-2xl p-8 border-2 border-emerald-200 hover:border-emerald-600 shadow-md hover:shadow-xl transition-all text-left cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mb-6 shadow-md shadow-emerald-200">
              <Sprout className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-stone-900">{tr(t.roleFarmer, language)}</h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">{tr(t.sellProduce || "Sell Produce", language)}</span>
            </div>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              {tr(t.farmerDesc, language)}
            </p>
            <ul className="space-y-2 mb-8 text-xs text-stone-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                {tr(t.farmerBullet1 || "Upload produce photo with harvest date & preservation days", language)}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                {tr(t.farmerBullet2 || "Compare your price side-by-side with live APMC Mandi rates", language)}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                {tr(t.farmerBullet3 || "Receive direct customer orders with instant payment settlement", language)}
              </li>
            </ul>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors">
              <span>{tr(t.enterAsFarmer || "Enter as Farmer", language)}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Customer Card */}
          <div 
            id="role-card-customer"
            onClick={() => onSelectRole('customer')}
            className="group relative bg-white rounded-2xl p-8 border-2 border-teal-200 hover:border-teal-600 shadow-md hover:shadow-xl transition-all text-left cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-100/50 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
            <div className="w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center mb-6 shadow-md shadow-teal-200">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-stone-900">{tr(t.roleCustomer, language)}</h2>
              <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full">{tr(t.buyFresh || "Buy Fresh", language)}</span>
            </div>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              {tr(t.customerDesc, language)}
            </p>
            <ul className="space-y-2 mb-8 text-xs text-stone-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                {tr(t.customerBullet1 || "Select any custom quantity (e.g. 1 kg, 5 kg, 20 kg)", language)}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                {tr(t.customerBullet2 || "Affordable distance-based direct farm delivery", language)}
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                {tr(t.customerBullet3 || "Live GPS delivery tracking once the farmer accepts your order", language)}
              </li>
            </ul>
            <div className="flex items-center gap-2 text-sm font-bold text-teal-700 group-hover:text-teal-900 transition-colors">
              <span>{tr(t.enterAsCustomer || "Enter as Customer", language)}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-stone-200/80">
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <TrendingUp className="w-5 h-5 text-amber-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">{tr(t.featureFluctuationsTitle || "Live Mandi Fluctuations", language)}</h3>
            <p className="text-[11px] text-stone-600 mt-1">{tr(t.featureFluctuationsDesc || "Real-time modal prices and arrival tonnes across 20+ APMCs.", language)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <Truck className="w-5 h-5 text-emerald-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">{tr(t.featureLogisticsTitle || "Direct Farm Logistics", language)}</h3>
            <p className="text-[11px] text-stone-600 mt-1">{tr(t.featureLogisticsDesc || "Fair delivery charges calculated automatically by distance.", language)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">{tr(t.featureOversellingTitle || "Prevent Overselling", language)}</h3>
            <p className="text-[11px] text-stone-600 mt-1">{tr(t.featureOversellingDesc || "Atomic inventory locking protects farmers and buyers.", language)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <Bot className="w-5 h-5 text-purple-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">{tr(t.featureAiTitle || "Kisan Mitra AI Assistant", language)}</h3>
            <p className="text-[11px] text-stone-600 mt-1">{tr(t.featureAiDesc || "Smart advisor for crop diseases, market timing, and shelf life.", language)}</p>
          </div>
        </div>
      </section>

      {/* Footer with Admin Access */}
      <footer className="bg-stone-100 border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-stone-700">FarmiQ</span>
            <span>— {tr(t.footerTagline || "Sustainable Agricultural Logistics & Marketplace", language)}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{tr(t.footerVersion || "Version 2.0 (Python + React)", language)}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
