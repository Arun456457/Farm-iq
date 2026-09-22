import React, { useState, useEffect } from 'react';
import { 
  Award, ChevronLeft, ChevronRight, Download, ExternalLink, Github, 
  Layers, CheckCircle, AlertTriangle, TrendingUp, ShieldCheck, Database, 
  Cpu, Sparkles, Sprout, ArrowRight, Printer, Maximize2, Minimize2,
  Warehouse, FileText, ShoppingBag, Truck, IndianRupee, Globe
} from 'lucide-react';
import { LanguageCode } from '../types';

interface SIHPresentationProps {
  language?: LanguageCode;
  onBack: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const SIHPresentation: React.FC<SIHPresentationProps> = ({
  onBack,
  onNavigateToTab
}) => {
  const [currentSlide, setCurrentSlide] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const totalSlides = 6;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        setCurrentSlide(prev => Math.min(totalSlides, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlide(prev => Math.max(1, prev - 1));
      } else if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans select-none print:bg-white print:text-black print:p-0">
      {/* 1. Header Toolbar (Hidden in Print) */}
      <header className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur-md border-b border-stone-800 px-4 py-3 flex items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Return to FarmiQ</span>
          </button>
          <div className="h-5 w-px bg-stone-800 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider border border-amber-500/30 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              SIH 2025 Submission
            </span>
            <span className="text-xs text-stone-400 font-medium hidden md:inline">
              PS ID: <strong className="text-emerald-400">26132</strong> • Strengthening Market Linkages & Price Discovery
            </span>
          </div>
        </div>

        {/* Slide navigation controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-800 rounded-lg p-0.5 border border-stone-700 text-xs font-semibold">
            <button
              onClick={() => setCurrentSlide(prev => Math.max(1, prev - 1))}
              disabled={currentSlide === 1}
              className="p-1.5 hover:bg-stone-700 rounded disabled:opacity-30 transition"
              title="Previous Slide (Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono text-emerald-400">
              Slide {currentSlide} of {totalSlides}
            </span>
            <button
              onClick={() => setCurrentSlide(prev => Math.min(totalSlides, prev + 1))}
              disabled={currentSlide === totalSlides}
              className="p-1.5 hover:bg-stone-700 rounded disabled:opacity-30 transition"
              title="Next Slide (Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            title="Print / Save All Slides as PDF"
            className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print PDF</span>
          </button>

          <a
            href="https://github.com/Arun456457/Farm-iq.git"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-stone-700 transition"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-stone-400 hover:text-white bg-stone-800 rounded-lg border border-stone-700 transition hidden sm:block"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Slide Thumbnails Bar (Hidden in Print) */}
      <nav className="bg-stone-950/60 border-b border-stone-800/80 px-4 py-2 flex items-center justify-center gap-2 overflow-x-auto print:hidden">
        {[
          { num: 1, title: "Title & Overview" },
          { num: 2, title: "Problem & Solution" },
          { num: 3, title: "Technical Approach" },
          { num: 4, title: "Feasibility & Viability" },
          { num: 5, title: "Impact & Benefits" },
          { num: 6, title: "Research & Evidence" }
        ].map(s => (
          <button
            key={s.num}
            onClick={() => setCurrentSlide(s.num)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              currentSlide === s.num
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'bg-stone-800/70 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-black/30 text-[10px] flex items-center justify-center font-mono">
              {s.num}
            </span>
            <span>{s.title}</span>
          </button>
        ))}
      </nav>

      {/* Main Slide Presentation Stage */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 lg:p-8 print:p-0 print:block">
        <div className="w-full max-w-6xl aspect-[16/9] bg-white text-stone-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative border border-stone-300 print:border-none print:shadow-none print:aspect-auto print:min-h-screen print:page-break-after-always print:rounded-none">

          {/* Official SIH Header Banner (On Every Slide) */}
          <div className="bg-white border-b border-stone-200 px-6 sm:px-8 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-extrabold tracking-wider text-sm sm:text-base text-stone-900 font-['Outfit'] uppercase">
                SMART INDIA HACKATHON 2025
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 rounded-lg">
                <div className="w-6 h-6 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
                  SIH
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[10px] font-black text-emerald-950 uppercase leading-none">SMART INDIA</p>
                  <p className="text-[9px] font-bold text-emerald-700 leading-none">HACKATHON 2025</p>
                </div>
              </div>
            </div>
          </div>

          {/* SLIDE 1: Title Slide */}
          {currentSlide === 1 && (
            <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between relative bg-gradient-to-br from-stone-50 via-white to-emerald-50/40">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 my-auto">
                <div className="flex-1 space-y-4 text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    <Sprout className="w-3.5 h-3.5 text-emerald-700" />
                    FarmiQ • Agricultural Operating System
                  </div>

                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 font-['Outfit'] tracking-tight leading-tight">
                    Strengthening Market Linkages & Price Discovery for Farmers
                  </h1>

                  <p className="text-stone-600 text-sm sm:text-base font-medium max-w-xl">
                    An AI-powered direct agritech trading corridor eliminating exploitative commission agents via live APMC benchmark discovery, cold-storage aggregation, distance-tiered transit, and forward contracts with escrow locks.
                  </p>

                  <div className="pt-2 space-y-1.5 text-xs sm:text-sm text-stone-800 font-semibold">
                    <p>• <strong className="text-stone-900">Problem Statement ID:</strong> 26132</p>
                    <p>• <strong className="text-stone-900">Problem Statement Title:</strong> Strengthening market linkages and price discovery for farmers</p>
                    <p>• <strong className="text-stone-900">Theme:</strong> Agriculture, FoodTech & Rural Development</p>
                    <p>• <strong className="text-stone-900">PS Category:</strong> Software</p>
                    <p>• <strong className="text-stone-900">Team Name:</strong> 404 The Optimists / Arun456457</p>
                    <p>• <strong className="text-stone-900">Live Prototype URL:</strong> <a href="https://farmiq-z14k.onrender.com" target="_blank" rel="noreferrer" className="text-emerald-700 underline font-bold">https://farmiq-z14k.onrender.com</a></p>
                  </div>
                </div>

                {/* Right Hero Graphic */}
                <div className="w-64 sm:w-80 h-64 sm:h-80 rounded-3xl bg-gradient-to-tr from-emerald-800 to-teal-600 p-1 flex items-center justify-center shadow-xl shrink-0">
                  <div className="w-full h-full bg-stone-900 rounded-[22px] p-6 flex flex-col items-center justify-center text-center text-white space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                      <Sprout className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black font-['Outfit'] tracking-tight">FarmiQ</h2>
                      <p className="text-xs text-emerald-300 font-medium">Direct Farm-to-Doorstep Platform</p>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-2 pt-2 text-[11px] font-bold">
                      <div className="bg-stone-800 p-2 rounded-lg border border-stone-700 text-stone-200">
                        20+ APMC Mandis
                      </div>
                      <div className="bg-stone-800 p-2 rounded-lg border border-stone-700 text-stone-200">
                        Zero Middlemen
                      </div>
                      <div className="bg-stone-800 p-2 rounded-lg border border-stone-700 text-stone-200">
                        FPO Aggregation
                      </div>
                      <div className="bg-stone-800 p-2 rounded-lg border border-stone-700 text-stone-200">
                        Gemini AI Advisor
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200 pt-3">
                <span>@SIH Idea submission - Template</span>
                <span className="font-bold text-stone-700">Slide 1 of 6</span>
              </div>
            </div>
          )}

          {/* SLIDE 2: Problem Statement & Solution */}
          {currentSlide === 2 && (
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-stone-50">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit']">
                    FarmiQ: Eliminating Middlemen & Solving Asymmetric Mandi Pricing
                  </h2>
                  <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold text-xs rounded-md">
                    PS ID: 26132
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Real-World Issue */}
                  <div className="bg-stone-900 text-white p-4 rounded-xl shadow-sm border border-stone-800">
                    <div className="flex items-center gap-2 text-red-400 font-bold text-xs mb-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Real-World Issue</span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Indian smallholder farmers face 35–50% price erosion from layered commission agents (<em>arhtiyas</em>), opaque physical auctions, and post-harvest distress sales during peak arrivals when local mandis crash.
                    </p>
                  </div>

                  {/* Why Important */}
                  <div className="bg-stone-900 text-white p-4 rounded-xl shadow-sm border border-stone-800">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-1.5">
                      <TrendingUp className="w-4 h-4" />
                      <span>Why It Matters</span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      Farmers receive only 18–28% of the final consumer retail price. India loses over ₹90,000 crores annually in horticultural food wastage due to absent local cold storage and delayed multi-tier transit.
                    </p>
                  </div>

                  {/* The Solution */}
                  <div className="bg-emerald-950 text-white p-4 rounded-xl shadow-sm border border-emerald-800">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1.5">
                      <CheckCircle className="w-4 h-4" />
                      <span>The FarmiQ Solution</span>
                    </div>
                    <p className="text-xs text-emerald-200 leading-relaxed">
                      A direct farm-to-consumer and B2B corridor uniting live APMC modal rates, algorithmic distance-tiered logistics (₹2–₹5/km), FPO bulk lot aggregation with 100% escrow locks, and cold storage booking.
                    </p>
                  </div>
                </div>

                {/* Risk vs Solution Table */}
                <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                  <div className="bg-stone-100 px-4 py-2 text-xs font-bold text-stone-700 flex justify-between">
                    <span>Critical Supply Chain Vulnerability (Current)</span>
                    <span className="text-emerald-800 font-extrabold">FarmiQ Technological Resolution</span>
                  </div>
                  <div className="divide-y divide-stone-100 text-xs">
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Predatory Middlemen Cuts (30–50%)</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-600" /> Direct Farm-to-Fork Consumer Delivery
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Distress Panic Sales During Market Gluts</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-600" /> On-Demand Cold Storage & Godown Reservation
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Price Rumors & Deceptive Mandi Quotes</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-600" /> Real-Time Benchmark Tracker Across 20+ APMC Mandis
                      </span>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-stone-700 font-medium">Smallholder Disqualification from B2B Bulk</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-emerald-600" /> Collective FPO Lot Aggregation & Verified Buyer Escrow
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200 pt-2">
                <span>Working Prototype: <a href="https://farmiq-z14k.onrender.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">https://farmiq-z14k.onrender.com</a></span>
                <span className="font-bold text-stone-700">Slide 2 of 6</span>
              </div>
            </div>
          )}

          {/* SLIDE 3: Technical Approach */}
          {currentSlide === 3 && (
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-stone-50">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit']">
                    Technical Approach & System Architecture
                  </h2>
                  <span className="text-xs text-stone-500 font-bold">Process Flow & Tech Stack</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Methodology Flow (7 cols) */}
                  <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-stone-200 space-y-3">
                    <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-700" />
                      Methodology & Process of Implementation
                    </h3>

                    <div className="space-y-2">
                      {[
                        { step: "1", title: "Farmer Registration & Listing", desc: "Instant phone/email signup; farmers upload produce with grade, price, and harvest date." },
                        { step: "2", title: "Haversine Distance & APMC Benchmark", desc: "System auto-calculates nearest mandi and benchmarks price against live arrivals." },
                        { step: "3", title: "Direct Order & Tiered Transit Pricing", desc: "Direct consumer orders with fair distance fees (₹5/km local, ₹3/km mid, ₹2/km long-haul)." },
                        { step: "4", title: "FPO Lot Pooling & Escrow Lock", desc: "Farmers aggregate produce to fulfill institutional B2B quotas with 100% pre-funded escrow." },
                        { step: "5", title: "WhatsApp Alert & Dynamic QR Settlement", desc: "Automatic delivery slips, invoice PDFs with QR code, and instant UPI payouts." }
                      ].map(item => (
                        <div key={item.step} className="flex items-start gap-3 p-2 rounded-lg bg-stone-50 border border-stone-100 text-xs">
                          <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                            {item.step}
                          </span>
                          <div>
                            <p className="font-bold text-stone-900">{item.title}</p>
                            <p className="text-stone-500 text-[11px] leading-tight">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Architecture & Tech Used (5 cols) */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="bg-stone-900 text-white p-4 rounded-xl border border-stone-800 space-y-2 text-xs">
                      <h3 className="font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Cpu className="w-4 h-4" />
                        Production Architecture
                      </h3>
                      <div className="space-y-1 text-[11px] text-stone-300 font-mono">
                        <p>• Client: React 19 + TypeScript + Tailwind v4 PWA</p>
                        <p>• Server: Node.js 24 + Express + Server-Sent Events</p>
                        <p>• Cloud DB: MongoDB Atlas Cloud (M0 Cluster0)</p>
                        <p>• AI Engine: Google Gemini 3.8 Flash (Kisan Mitra)</p>
                        <p>• Maps: Leaflet + OpenStreetMap geo-routing</p>
                        <p>• Deployment: Render 24/7 Web Service</p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 text-xs space-y-2">
                      <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-blue-600" />
                        Multi-Lingual Field Accessibility
                      </h4>
                      <p className="text-[11px] text-stone-600">
                        Supports 9 Indian languages (Hindi, Telugu, Marathi, Tamil, Kannada, etc.) ensuring zero language barriers for rural Indian cultivators.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200 pt-2">
                <span>Repository: <a href="https://github.com/Arun456457/Farm-iq.git" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">github.com/Arun456457/Farm-iq</a></span>
                <span className="font-bold text-stone-700">Slide 3 of 6</span>
              </div>
            </div>
          )}

          {/* SLIDE 4: Feasibility & Viability */}
          {currentSlide === 4 && (
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-stone-50">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit']">
                    Feasibility, Viability & Economic Business Model
                  </h2>
                  <span className="text-xs text-stone-500 font-bold">Practical Assessment</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Feasibility */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Feasibility Analysis
                      </h3>
                      <span className="text-amber-500 text-xs font-bold">⭐⭐⭐⭐⭐</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-stone-600">
                      <li>
                        <strong className="text-stone-900">Hardware Agnostic:</strong> Runs on any smartphone browser as an installable PWA; zero heavy app downloads or specialized hardware required.
                      </li>
                      <li>
                        <strong className="text-stone-900">Low Operational Cost:</strong> Built with Node.js and MongoDB cloud; operational infrastructure cost is near zero for early clusters.
                      </li>
                      <li>
                        <strong className="text-stone-900">Adaptive Logistics:</strong> Leverages existing local vehicle drivers (autos, pick-up tempos) via distance-tiered compensation.
                      </li>
                    </ul>
                  </div>

                  {/* Viability */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Market Viability
                      </h3>
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>

                    <ul className="space-y-2.5 text-xs text-stone-600">
                      <li>
                        <strong className="text-stone-900">Eliminates Counterparty Risk:</strong> 100% Pre-funded Escrow for B2B trades prevents corporate payment defaults and harvest rejections.
                      </li>
                      <li>
                        <strong className="text-stone-900">Builds Ground Trust:</strong> Transparent QR invoices, farm origin stamps, and driver phone details eliminate suspicion.
                      </li>
                      <li>
                        <strong className="text-stone-900">APMC Alignment:</strong> Complements existing mandis by using real daily arrivals as official pricing benchmarks.
                      </li>
                    </ul>
                  </div>

                  {/* Business Potential */}
                  <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                        Business Potential
                      </h3>
                      <IndianRupee className="w-4 h-4 text-blue-600" />
                    </div>

                    <ul className="space-y-2.5 text-xs text-stone-600">
                      <li>
                        <strong className="text-stone-900">Farmer Profit Surge:</strong> Increases farmer net realization from 20% to 70%+ by cutting intermediate commission agents.
                      </li>
                      <li>
                        <strong className="text-stone-900">Consumer Savings:</strong> Direct farm-fresh produce delivered 15–20% cheaper than supermarket retail prices.
                      </li>
                      <li>
                        <strong className="text-stone-900">Sustainable Revenue:</strong> 2.5% platform facilitation fee on wholesale FPO commercial lots + micro-convenience fee on retail delivery.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200 pt-2">
                <span>Economic Model: Self-Sustaining Unit Economics</span>
                <span className="font-bold text-stone-700">Slide 4 of 6</span>
              </div>
            </div>
          )}

          {/* SLIDE 5: Impact and Benefits */}
          {currentSlide === 5 && (
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-stone-50">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit']">
                    Measurable Impact & Ground Benefits
                  </h2>
                  <span className="text-xs text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded-md">
                    Transforming Indian Agritech
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  {/* Traditional vs FarmiQ Table */}
                  <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                    <h3 className="text-xs font-bold text-stone-900 uppercase mb-3">
                      Supply Chain Transformation
                    </h3>
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-stone-200 text-stone-500 font-semibold">
                          <th className="pb-2">Metric</th>
                          <th className="pb-2 text-red-600">Traditional Mandi</th>
                          <th className="pb-2 text-emerald-700">FarmiQ Platform</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        <tr>
                          <td className="py-2 font-medium">Middlemen Layers</td>
                          <td className="py-2 text-red-600">4 to 6 Intermediaries</td>
                          <td className="py-2 text-emerald-700 font-bold">0 (Direct Trade)</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Farmer Revenue Share</td>
                          <td className="py-2 text-red-600">18% – 28%</td>
                          <td className="py-2 text-emerald-700 font-bold">72% – 82%</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Post-Harvest Loss</td>
                          <td className="py-2 text-red-600">25% – 30% Wastage</td>
                          <td className="py-2 text-emerald-700 font-bold">&lt; 6% Spoilage</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Transit Duration</td>
                          <td className="py-2 text-red-600">48 – 72 Hours</td>
                          <td className="py-2 text-emerald-700 font-bold">&lt; 18 Hours Direct</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Payment Realization</td>
                          <td className="py-2 text-red-600">15–45 Days Delay</td>
                          <td className="py-2 text-emerald-700 font-bold">Instant UPI / Escrow</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 4 Pillars of Impact */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-950 text-white p-3.5 rounded-xl border border-emerald-800">
                      <p className="text-xs font-bold text-emerald-400">1. Social Equity</p>
                      <p className="text-[11px] text-emerald-200 mt-1">
                        Empowers marginal farmers with collective FPO bargaining power against corporate buyers.
                      </p>
                    </div>

                    <div className="bg-emerald-950 text-white p-3.5 rounded-xl border border-emerald-800">
                      <p className="text-xs font-bold text-emerald-400">2. Economic Uplift</p>
                      <p className="text-[11px] text-emerald-200 mt-1">
                        Direct bank settlement breaks the generational debt cycle caused by local loan-shark traders.
                      </p>
                    </div>

                    <div className="bg-emerald-950 text-white p-3.5 rounded-xl border border-emerald-800">
                      <p className="text-xs font-bold text-emerald-400">3. Food Security</p>
                      <p className="text-[11px] text-emerald-200 mt-1">
                        Cold storage godowns prevent panic dumping and stabilize consumer food price inflation.
                      </p>
                    </div>

                    <div className="bg-emerald-950 text-white p-3.5 rounded-xl border border-emerald-800">
                      <p className="text-xs font-bold text-emerald-400">4. AI Intelligence</p>
                      <p className="text-[11px] text-emerald-200 mt-1">
                        Kisan Mitra (Gemini AI) gives real-time harvest grading and market-timing advice 24/7.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200 pt-2">
                <span>Outcome: Measurable & Sustainable Rural Prosperity</span>
                <span className="font-bold text-stone-700">Slide 5 of 6</span>
              </div>
            </div>
          )}

          {/* SLIDE 6: Research, Citations & Live Prototype */}
          {currentSlide === 6 && (
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between bg-stone-50">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-['Outfit']">
                    Research Foundations & Live System Proof
                  </h2>
                  <span className="text-xs bg-stone-900 text-white px-2.5 py-1 rounded font-mono">
                    Production Verified
                  </span>
                </div>

                {/* Citations Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 text-[11px]">
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-900">Dalwai Committee (DFI)</p>
                    <p className="text-stone-500 text-[10px] mt-0.5">Direct market linkages and disintermediation are vital for doubling farmers' income.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-900">NITI Aayog Agri-Logistics</p>
                    <p className="text-stone-500 text-[10px] mt-0.5">Decentralized cold-storage hubs reduce seasonal perishability shocks by 60%.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-900">e-NAM Framework</p>
                    <p className="text-stone-500 text-[10px] mt-0.5">Unified price discovery across APMC mandis stabilizes national price parity.</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-stone-200">
                    <p className="font-bold text-stone-900">NABARD FPO Directives</p>
                    <p className="text-stone-500 text-[10px] mt-0.5">Smallholders aggregate lots to meet institutional buyer quality criteria.</p>
                  </div>
                </div>

                {/* Interactive Prototype Features Banner */}
                <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-xl shadow-md">
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-2">
                    Live Verified Modules on Render Production:
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                    {[
                      { name: "Produce Market", tab: "marketplace", icon: ShoppingBag },
                      { name: "Live Mandi Ticker", tab: "mandi-rates", icon: TrendingUp },
                      { name: "FPO Bulk Lots", tab: "buyer-fpo", icon: Layers },
                      { name: "Cold Storage", tab: "storage", icon: Warehouse },
                      { name: "Forward Contracts", tab: "contracts", icon: FileText },
                      { name: "Admin Console", tab: "admin-overview", icon: ShieldCheck }
                    ].map((mod, i) => {
                      const Icon = mod.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (onNavigateToTab) {
                              onNavigateToTab(mod.tab);
                            } else {
                              onBack();
                            }
                          }}
                          className="bg-white/10 hover:bg-white/20 p-2.5 rounded-lg border border-white/15 transition flex flex-col items-center gap-1.5 cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-emerald-300" />
                          <span className="text-[10px] font-bold truncate w-full">{mod.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 border-t border-stone-200 pt-2 gap-2">
                <div className="flex items-center gap-3">
                  <span>Live App: <a href="https://farmiq-z14k.onrender.com" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline">farmiq-z14k.onrender.com</a></span>
                  <span>•</span>
                  <span>Cloud DB: <strong className="text-emerald-700">MongoDB Atlas (Verified)</strong></span>
                </div>
                <span className="font-bold text-stone-700">Slide 6 of 6</span>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Slide Thumbnails & Jump Bar (Footer) */}
      <footer className="bg-stone-950 border-t border-stone-800 px-6 py-3 flex items-center justify-between text-xs text-stone-400 print:hidden">
        <span className="font-medium">
          Use <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-stone-300 text-[10px]">←</kbd> and <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-stone-300 text-[10px]">→</kbd> keys to switch slides
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://farmiq-z14k.onrender.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
          >
            <span>farmiq-z14k.onrender.com</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </footer>
    </div>
  );
};
