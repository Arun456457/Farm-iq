import React from 'react';
import { Sprout, ShoppingBag, Truck, TrendingUp, ShieldCheck, ArrowRight, UserCheck, Bot } from 'lucide-react';
import { LanguageCode } from '../types';
import { translations } from '../translations';

interface LandingPageProps {
  language: LanguageCode;
  onSelectRole: (role: 'farmer' | 'customer') => void;
  onOpenAuth: (mode: 'login' | 'register', roleHint?: 'farmer' | 'customer' | 'admin') => void;
  onDemoLogin: (role: 'farmer' | 'customer' | 'admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  onSelectRole,
  onOpenAuth,
  onDemoLogin,
}) => {
  const t = translations[language];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-emerald-50/50 via-white to-stone-50 flex flex-col justify-between">
      {/* Hero Section */}
      <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center w-full">
        {/* Floating badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-6 shadow-xs">
          <Sprout className="w-4 h-4 text-emerald-700" />
          <span>Direct Farmer ↔ Customer Agriculture Hub</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span className="font-semibold text-emerald-800">Fixed ₹2/km Direct Transport</span>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-4xl sm:text-6xl font-black text-stone-900 tracking-tight mb-4 font-['Outfit']">
          {t.appName}
        </h1>
        <p className="text-2xl sm:text-3xl font-bold text-emerald-800 mb-6 font-['Outfit'] max-w-3xl mx-auto leading-snug">
          "{t.tagline}"
        </p>
        <p className="text-stone-600 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.heroDesc}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button
            id="btn-landing-register"
            onClick={() => onOpenAuth('register')}
            className="px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md shadow-emerald-200 flex items-center gap-2 transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            {t.createAccount}
          </button>
          <button
            id="btn-landing-login"
            onClick={() => onOpenAuth('login')}
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm border border-stone-300 shadow-xs flex items-center gap-2 transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            {t.login}
          </button>
          <button
            id="btn-landing-demo"
            onClick={() => onDemoLogin('farmer')}
            className="px-6 py-3.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm border border-amber-300 shadow-xs flex items-center gap-2 transition-transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Sprout className="w-4 h-4 text-amber-700" />
            {t.continueDemo}
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
              <h2 className="text-2xl font-bold text-stone-900">{t.roleFarmer}</h2>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">Sell Produce</span>
            </div>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              {t.farmerDesc}
            </p>
            <ul className="space-y-2 mb-8 text-xs text-stone-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Upload produce photo with harvest date & preservation days
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Compare your price side-by-side with live APMC Mandi rates
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                Receive direct customer orders with instant payment settlement
              </li>
            </ul>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 group-hover:text-emerald-900 transition-colors">
              <span>Enter as Farmer</span>
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
              <h2 className="text-2xl font-bold text-stone-900">{t.roleCustomer}</h2>
              <span className="text-xs font-bold text-teal-800 bg-teal-100 px-3 py-1 rounded-full">Buy Fresh</span>
            </div>
            <p className="text-stone-600 text-sm mb-6 leading-relaxed">
              {t.customerDesc}
            </p>
            <ul className="space-y-2 mb-8 text-xs text-stone-600">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                Select any custom quantity (e.g. 1 kg, 5 kg, 20 kg)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                Transparent ₹2 per kilometer direct farm delivery rate
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                Live GPS delivery tracking once the farmer accepts your order
              </li>
            </ul>
            <div className="flex items-center gap-2 text-sm font-bold text-teal-700 group-hover:text-teal-900 transition-colors">
              <span>Enter as Customer</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Feature Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-stone-200/80">
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <TrendingUp className="w-5 h-5 text-amber-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">Live Mandi Fluctuations</h3>
            <p className="text-[11px] text-stone-600 mt-1">Real-time modal prices and arrival tonnes across 20+ APMCs.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <Truck className="w-5 h-5 text-emerald-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">Direct ₹2/km Logistics</h3>
            <p className="text-[11px] text-stone-600 mt-1">Fair delivery charges calculated automatically by distance.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <ShieldCheck className="w-5 h-5 text-blue-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">Prevent Overselling</h3>
            <p className="text-[11px] text-stone-600 mt-1">Atomic inventory locking protects farmers and buyers.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-stone-200/60 shadow-2xs text-left">
            <Bot className="w-5 h-5 text-purple-600 mb-2" />
            <h3 className="text-xs font-bold text-stone-900">Kisan Mitra AI Assistant</h3>
            <p className="text-[11px] text-stone-600 mt-1">Smart advisor for crop diseases, market timing, and shelf life.</p>
          </div>
        </div>
      </section>

      {/* Footer with Admin Access */}
      <footer className="bg-stone-100 border-t border-stone-200 py-6 px-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-700" />
            <span className="font-semibold text-stone-700">FarmiQ</span>
            <span>— Sustainable Agricultural Logistics & Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onDemoLogin('admin')}
              className="text-stone-600 hover:text-emerald-800 font-semibold underline underline-offset-4"
            >
              Admin Monitor Login
            </button>
            <span>•</span>
            <span>Version 2.0 (Python + React)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
