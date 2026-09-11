import React, { useState, useEffect } from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Search, Filter, RefreshCw, MapPin, Sparkles } from 'lucide-react';
import { MandiRate, LanguageCode } from '../types';
import { api } from '../api';
import { translations } from '../translations';

interface LiveMandiRatesProps {
  language: LanguageCode;
}

export const LiveMandiRates: React.FC<LiveMandiRatesProps> = ({ language }) => {
  const t = translations[language];
  const [mandiRates, setMandiRates] = useState<MandiRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [refreshing, setRefreshing] = useState(false);

  const fetchRates = async () => {
    try {
      setRefreshing(true);
      const res = await api.getMandiPrices({
        state: selectedState === 'All' ? undefined : selectedState,
        crop: searchQuery.trim() || undefined,
      });
      setMandiRates(res.mandi_prices);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error("Mandi fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 5000); // 5-second dynamic market tick
    return () => clearInterval(interval);
  }, [selectedState, searchQuery]);

  const uniqueStates = ['All', 'Maharashtra', 'Karnataka', 'Punjab', 'Delhi', 'Uttar Pradesh', 'Andhra Pradesh', 'Madhya Pradesh'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
            <span>National AGMARKNET & APMC Live Feeds</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-['Outfit']">
            {t.liveMandiRates}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Real-time daily modal prices, trade arrivals, and commodity price trends across major state mandis.
          </p>
        </div>

        {/* Live Status & Refresh */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right text-xs text-stone-500">
            <span className="block font-medium">Tick Updated: {lastUpdated}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">Continuous Price Discovery</span>
          </div>
          <button
            onClick={fetchRates}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-emerald-700 hover:bg-stone-50 shadow-2xs transition"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crop (e.g. Onion, Wheat, Tomato)..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* State filter pills */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 w-full md:w-auto pb-1 md:pb-0">
          {uniqueStates.map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedState === st
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Commodity Rates Grid with Reference Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mandiRates.map((rate, idx) => (
          <div 
            key={`${rate.crop}-${rate.mandi}-${idx}`}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Reference Image (Requested feature) */}
              <div className="relative h-40 w-full bg-stone-100 overflow-hidden">
                <img 
                  src={rate.image} 
                  alt={rate.crop}
                  className="w-full h-full object-cover"
                  onError={(e: any) => {
                    e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold bg-black/70 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                    {rate.variety}
                  </span>
                </div>

                {/* Live Trend Indicator */}
                <div className="absolute top-3 right-3">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 ${
                    rate.trend === 'UP' ? 'bg-emerald-600 text-white' :
                    rate.trend === 'DOWN' ? 'bg-red-600 text-white' :
                    'bg-stone-700 text-white'
                  }`}>
                    {rate.trend === 'UP' && <ArrowUpRight className="w-3.5 h-3.5" />}
                    {rate.trend === 'DOWN' && <ArrowDownRight className="w-3.5 h-3.5" />}
                    {rate.trend === 'STABLE' && <Minus className="w-3.5 h-3.5" />}
                    <span>{rate.trend === 'UP' ? `+${rate.pct_change}%` : rate.trend === 'DOWN' ? `-${rate.pct_change}%` : 'Stable'}</span>
                  </span>
                </div>
              </div>

              {/* Information */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{rate.crop}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-400" /> {rate.mandi} ({rate.state})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-amber-900">₹{rate.modal_price}</span>
                    <span className="text-xs text-stone-500">/{rate.unit}</span>
                  </div>
                </div>

                {/* Price Range & Arrivals */}
                <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Min - Max Modal Range:</span>
                    <span className="font-semibold text-stone-800">₹{rate.min_price} - ₹{rate.max_price}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Today's Market Arrivals:</span>
                    <span className="font-semibold text-stone-800">{rate.arrival_tonnes} tonnes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Advice for Farmer */}
            <div className="p-3 bg-amber-50/60 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-950 font-medium">
              <span>Benchmark Advice:</span>
              <span className="font-bold">
                {rate.trend === 'UP' ? 'Bullish: Strong demand' : 'Bearish: Consider cold storage'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
