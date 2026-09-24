import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  RefreshCw,
  MapPin,
  Sparkles,
  Navigation,
  Layers,
  Grid,
  Map as MapIcon,
  Phone,
  Clock,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Camera,
  Check,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MandiRate, MandiMarket, LanguageCode, User } from '../types';
import { api } from '../api';
import { translations } from '../translations';
import { translateText } from '../utils/domTranslator';
import { haversineDistanceKm, getCropImage, initialMandiRates, getMandiAreas } from '../data/mandiDatabase';

interface LiveMandiRatesProps {
  language: LanguageCode;
  user?: User | null;
}

const CATEGORIES = [
  { id: 'All', labelKey: 'filterAll' },
  { id: 'Vegetables', labelKey: 'filterVeg' },
  { id: 'Fruits', labelKey: 'filterFruit' },
  { id: 'Grains & Cereals', labelKey: 'filterGrains' },
  { id: 'Pulses', labelKey: 'filterPulses' },
  { id: 'Spices', labelKey: 'filterSpices' },
  { id: 'Cash Crops', labelKey: 'filterCash' }
];

export const LiveMandiRates: React.FC<LiveMandiRatesProps> = ({ language, user }) => {
  const t = translations[language];

  // Admin Crop Image Edit States
  const [editingCrop, setEditingCrop] = useState<{ crop: string; currentImage: string; variety?: string } | null>(null);
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [savingImage, setSavingImage] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Synchronous pre-initialization so page renders in 0ms with NO loading spinner
  const initialAreas = getMandiAreas();
  const [mandiRates, setMandiRates] = useState<MandiRate[]>(() => [...initialMandiRates]);
  const [markets, setMarkets] = useState<MandiMarket[]>(() => initialAreas.markets || []);
  const [states, setStates] = useState<string[]>(() => initialAreas.states || []);
  const [districtsByState, setDistrictsByState] = useState<Record<string, string[]>>(() => initialAreas.districtsByState || {});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');

  // Filter & Selection states
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedMandi, setSelectedMandi] = useState<string>('All');
  const [selectedMarketDetails, setSelectedMarketDetails] = useState<MandiMarket | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Unit and View preferences
  const [priceUnit, setPriceUnit] = useState<'kg' | 'quintal'>('kg');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Geolocation states
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Fetch areas directory (States, Districts, Markets)
  useEffect(() => {
    let mounted = true;
    api.getMandiAreas()
      .then(res => {
        if (!mounted) return;
        setStates(res.states || []);
        setDistrictsByState(res.districtsByState || {});
        setMarkets(res.markets || []);
      })
      .catch(err => {
        console.error('Failed to load mandi areas:', err);
      });
    return () => { mounted = false; };
  }, []);

  // Fetch rates based on active filters & location
  const fetchRates = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const res = await api.getMandiPrices({
        state: selectedState === 'All' ? undefined : selectedState,
        district: selectedDistrict === 'All' ? undefined : selectedDistrict,
        mandi: selectedMandi === 'All' ? undefined : selectedMandi,
        crop: searchQuery.trim() || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        lat: userLocation?.lat,
        lng: userLocation?.lng
      });

      setMandiRates(res.mandi_prices || []);
      if (res.selected_market) {
        setSelectedMarketDetails(res.selected_market);
      } else if (selectedMandi !== 'All') {
        const found = markets.find(m => m.name.toLowerCase().includes(selectedMandi.toLowerCase()));
        if (found) setSelectedMarketDetails(found);
      } else {
        setSelectedMarketDetails(null);
      }

      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Mandi fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Trigger rate fetch when selection parameters change
  useEffect(() => {
    fetchRates();
    const interval = setInterval(() => fetchRates(true), 6000); // dynamic tick
    return () => clearInterval(interval);
  }, [selectedState, selectedDistrict, selectedMandi, selectedCategory, searchQuery, userLocation]);

  // Handle GPS Auto-Locate nearest mandi
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation not supported by your browser');
      return;
    }
    setIsLocating(true);
    setLocationStatus(t.locating || 'Locating nearest market...');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });

        // Calculate distance to all known markets
        if (markets.length > 0) {
          let closest = markets[0];
          let minDist = Infinity;
          markets.forEach(m => {
            const d = haversineDistanceKm(lat, lng, m.lat, m.lng);
            if (d < minDist) {
              minDist = d;
              closest = m;
            }
          });

          setSelectedState(closest.state);
          setSelectedDistrict(closest.district);
          setSelectedMandi(closest.name);
          setSelectedMarketDetails({ ...closest, distanceKm: minDist });
          setLocationStatus(`${closest.name} (${minDist} km away)`);
        } else {
          setLocationStatus('Located coordinates successfully');
        }
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error fallback to default agricultural hub:', err);
        // Fallback default: Pune / Lasalgaon region
        const fallbackLat = 18.5204;
        const fallbackLng = 73.8567;
        setUserLocation({ lat: fallbackLat, lng: fallbackLng });

        const defaultMkt = markets.find(m => m.id === 'mkt-mh-pune-gultekdi') || markets[0];
        if (defaultMkt) {
          const d = haversineDistanceKm(fallbackLat, fallbackLng, defaultMkt.lat, defaultMkt.lng);
          setSelectedState(defaultMkt.state);
          setSelectedDistrict(defaultMkt.district);
          setSelectedMandi(defaultMkt.name);
          setSelectedMarketDetails({ ...defaultMkt, distanceKm: d });
          setLocationStatus(`${defaultMkt.name} (${d} km away)`);
        }
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Reset all area filters
  const handleResetFilters = () => {
    setSelectedState('All');
    setSelectedDistrict('All');
    setSelectedMandi('All');
    setSelectedMarketDetails(null);
    setSelectedCategory('All');
    setSearchQuery('');
    setLocationStatus(null);
  };

  // Compute available districts for the selected state
  const availableDistricts = selectedState === 'All'
    ? Object.values(districtsByState).flat().filter((v, i, a) => a.indexOf(v) === i).sort()
    : (districtsByState[selectedState] || []);

  // Compute available mandis for the selected state & district
  const availableMandis = markets.filter(m => {
    if (selectedState !== 'All' && m.state !== selectedState) return false;
    if (selectedDistrict !== 'All' && m.district !== selectedDistrict) return false;
    return true;
  });

  // Manage Leaflet Map lifecycle when in 'map' mode
  useEffect(() => {
    if (viewMode !== 'map') return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const centerLat = selectedMarketDetails?.lat || userLocation?.lat || 19.5;
      const centerLng = selectedMarketDetails?.lng || userLocation?.lng || 75.5;
      const zoomLevel = selectedMarketDetails ? 11 : 6;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([centerLat, centerLng], zoomLevel);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // User location pin if present
    if (userLocation) {
      const userPin = L.divIcon({
        className: 'user-geo-pin',
        html: `
          <div style="position:relative; width:22px; height:22px;">
            <div style="width:22px; height:22px; background:#0284c7; border:3px solid white; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
            <div style="position:absolute; inset:-4px; border:2px solid #0284c7; border-radius:50%; opacity:0.6; animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userPin })
        .bindPopup('<b>Your Approximate Area</b>')
        .addTo(markersGroup);
    }

    // Add APMC market pins
    const displayMarkets = availableMandis.length > 0 ? availableMandis : markets;

    displayMarkets.forEach(mkt => {
      const isSelected = selectedMandi.toLowerCase() === mkt.name.toLowerCase();
      const dist = userLocation ? haversineDistanceKm(userLocation.lat, userLocation.lng, mkt.lat, mkt.lng) : null;

      const mandiIcon = L.divIcon({
        className: 'mandi-map-pin',
        html: `
          <div style="
            background: ${isSelected ? '#047857' : '#d97706'};
            color: white;
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            border: 2px solid white;
            cursor: pointer;
            transform: translate(-50%, -100%);
          ">
            <span>🏛️ ${mkt.name.split(' ')[0]}</span>
            ${dist !== null ? `<span style="opacity:0.85; font-size:9px;">(${dist} km)</span>` : ''}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([mkt.lat, mkt.lng], { icon: mandiIcon });

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '220px';
      popupContent.style.fontFamily = 'sans-serif';
      popupContent.innerHTML = `
        <div style="padding:4px 0;">
          <div style="font-size:10px; font-weight:700; color:#d97706; text-transform:uppercase;">APMC Market Yard</div>
          <div style="font-size:14px; font-weight:800; color:#1c1917; margin-bottom:4px;">${mkt.name}</div>
          <div style="font-size:12px; color:#78716c; margin-bottom:8px;">📍 ${mkt.district}, ${mkt.state}</div>
          <div style="font-size:11px; color:#44403c; margin-bottom:4px;">🕒 Hours: ${mkt.operatingHours || '06:00 AM - 04:00 PM'}</div>
          <div style="font-size:11px; color:#44403c; margin-bottom:8px;">📦 Arrivals: ${mkt.totalArrivalsToday || 1200} tonnes/day</div>
          <button id="btn-select-mandi-${mkt.id}" style="
            width:100%;
            background:#047857;
            color:white;
            border:none;
            border-radius:8px;
            padding:6px 12px;
            font-size:12px;
            font-weight:700;
            cursor:pointer;
          ">
            Select & Fetch Rates
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-select-mandi-${mkt.id}`);
        if (btn) {
          btn.onclick = () => {
            setSelectedState(mkt.state);
            setSelectedDistrict(mkt.district);
            setSelectedMandi(mkt.name);
            setSelectedMarketDetails(mkt);
            marker.closePopup();
          };
        }
      });

      marker.addTo(markersGroup);
    });

    if (selectedMarketDetails) {
      map.setView([selectedMarketDetails.lat, selectedMarketDetails.lng], 12, { animate: true });
    }
  }, [viewMode, availableMandis, selectedMarketDetails, userLocation, selectedMandi]);

  // Clean up Leaflet map when switching out of map view or unmounting
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Format price helper according to chosen unit (kg or quintal)
  const formatPrice = (pricePerKg: number) => {
    const unitText = priceUnit === 'quintal' 
      ? translateText('Quintal', language) 
      : translateText('kg', language);
    if (priceUnit === 'quintal') {
      return {
        modal: `₹${(pricePerKg * 100).toLocaleString('en-IN')}`,
        unit: unitText,
        min: `₹${(pricePerKg * 100 * 0.85).toFixed(0)}`,
        max: `₹${(pricePerKg * 100 * 1.18).toFixed(0)}`
      };
    }
    return {
      modal: `₹${pricePerKg}`,
      unit: unitText,
      min: `₹${Math.round(pricePerKg * 0.85)}`,
      max: `₹${Math.round(pricePerKg * 1.18)}`
    };
  };

  // Handle Admin image save
  const handleSaveCropImage = async () => {
    if (!editingCrop || !newImageUrl.trim()) return;
    try {
      setSavingImage(true);
      setImageError(null);
      await api.updateMandiImage(editingCrop.crop, newImageUrl.trim());
      setMandiRates(prev => prev.map(r => 
        (r.crop.toLowerCase() === editingCrop.crop.toLowerCase() || editingCrop.crop.toLowerCase().includes(r.crop.toLowerCase()))
          ? { ...r, image: newImageUrl.trim() }
          : r
      ));
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingCrop(null);
      }, 1200);
    } catch (err: any) {
      setImageError(err.message || 'Failed to update image');
    } finally {
      setSavingImage(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const CROP_PHOTO_PRESETS = [
    { name: 'Fresh Tomato', url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80' },
    { name: 'Red Onion', url: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=80' },
    { name: 'Potatoes', url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop&q=80' },
    { name: 'Ripe Mango', url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop&q=80' },
    { name: 'Golden Wheat', url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop&q=80' },
    { name: 'Rice / Paddy', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80' },
    { name: 'Green Chilli', url: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=500&auto=format&fit=crop&q=80' },
    { name: 'Red Chilli', url: 'https://images.unsplash.com/photo-1582281298055-e25b84a30b0b?w=500&auto=format&fit=crop&q=80' },
    { name: 'Garlic Bulbs', url: 'https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=500&auto=format&fit=crop&q=80' },
    { name: 'Ginger Root', url: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=500&auto=format&fit=crop&q=80' },
    { name: 'Turmeric Root', url: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80' },
    { name: 'Bananas', url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=80' },
    { name: 'Fresh Apples', url: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500&auto=format&fit=crop&q=80' },
    { name: 'Green Grapes', url: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=500&auto=format&fit=crop&q=80' },
    { name: 'Pomegranate', url: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=500&auto=format&fit=crop&q=80' },
    { name: 'Fresh Guava', url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=500&auto=format&fit=crop&q=80' },
    { name: 'Okra / Bhindi', url: 'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=500&auto=format&fit=crop&q=80' },
    { name: 'Fresh Coriander', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80' },
    { name: 'Yellow Moong Dal', url: 'https://images.unsplash.com/photo-1516512248820-6c9b542cdfaf?w=500&auto=format&fit=crop&q=80' },
    { name: 'Tur / Arhar Dal', url: 'https://images.unsplash.com/photo-1543362906-acfc16c67564?w=500&auto=format&fit=crop&q=80' },
    { name: 'Mustard Crop', url: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=500&auto=format&fit=crop&q=80' },
    { name: 'Green Cardamom', url: 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop&q=80' },
    { name: 'Black Pepper', url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=500&auto=format&fit=crop&q=80' },
    { name: 'Fresh Coconut', url: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?w=500&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Admin Photo Management Mode Banner */}
      {user && user.role === 'admin' && (
        <div className="mb-4 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-900 font-black text-[10px] tracking-wider uppercase">
              Admin Mode
            </span>
            <span className="font-semibold">
              Live Mandi Photo Editor Active: Click <strong>"Edit Photo"</strong> on any produce card to change or customize its photo across the entire platform.
            </span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200">
            {mandiRates.length} Commodities Active
          </span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold mb-2 max-w-full">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>National AGMARKNET & Local APMC Discovery</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-['Outfit'] tracking-tight">
            {t.liveMandiRates}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time daily modal prices, trade arrivals, and commodity price trends across your selected local market yard.
          </p>
        </div>

        {/* Live Tick & Refresh */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right text-xs text-stone-500">
            <span className="block font-medium">Tick Updated: {lastUpdated}</span>
            <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Continuous APMC Benchmarks
            </span>
          </div>
          <button
            onClick={() => fetchRates()}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white border border-stone-200 text-stone-700 hover:text-emerald-700 hover:bg-stone-50 shadow-2xs transition"
            title="Refresh rates"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-700' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Area & Local Market Selection Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 mb-6 space-y-4">
        {/* Row 1: Hierarchical Area Selectors & GPS auto-detect */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          {/* 1. GPS Auto-detect Button */}
          <button
            onClick={handleDetectLocation}
            disabled={isLocating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs hover:shadow disabled:opacity-75"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? (t.locating || 'Locating...') : (t.useCurrentLocation || 'Use My Location')}</span>
          </button>

          {/* 2. State Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              {t.selectState || 'State'}
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict('All');
                setSelectedMandi('All');
              }}
              className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 focus:bg-white transition"
            >
              <option value="All">{t.allStates || 'All States (India)'}</option>
              {states.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* 3. District Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              {t.selectDistrict || 'District'}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setSelectedMandi('All');
              }}
              className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 focus:bg-white transition"
            >
              <option value="All">{t.allDistricts || 'All Districts'}</option>
              {availableDistricts.map((dst) => (
                <option key={dst} value={dst}>{dst}</option>
              ))}
            </select>
          </div>

          {/* 4. Local Mandi / Market Yard Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
              {t.selectMandi || 'Local Mandi / Market'}
            </label>
            <select
              value={selectedMandi}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMandi(val);
                const found = markets.find(m => m.name === val);
                if (found) {
                  setSelectedMarketDetails(found);
                  if (selectedState === 'All') setSelectedState(found.state);
                  if (selectedDistrict === 'All') setSelectedDistrict(found.district);
                } else {
                  setSelectedMarketDetails(null);
                }
              }}
              className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 focus:bg-white transition text-stone-800"
            >
              <option value="All">{t.allMarkets || 'All Mandi Yards'}</option>
              {availableMandis.map((mkt) => {
                const dist = userLocation ? haversineDistanceKm(userLocation.lat, userLocation.lng, mkt.lat, mkt.lng) : null;
                return (
                  <option key={mkt.id} value={mkt.name}>
                    {mkt.name} {dist !== null ? `(${dist} km)` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Row 2: Search, Category, Unit Switcher, View Switcher */}
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between pt-2 border-t border-stone-100">
          {/* Crop Search */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.cropSearchPlaceholder || "Search produce (e.g. Onion, Pyaz, Tomato)..."}
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Quick Filter Controls: Unit Switcher + View Switcher + Reset */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* Unit Switcher */}
            <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
              <button
                onClick={() => setPriceUnit('kg')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  priceUnit === 'kg' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ₹ / {translateText('kg', language)}
              </button>
              <button
                onClick={() => setPriceUnit('quintal')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  priceUnit === 'quintal' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                ₹ / {translateText('Quintal (100 kg)', language)}
              </button>
            </div>

            {/* View Mode Toggle: Grid vs Map */}
            <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'grid' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{t.gridView || 'Grid'}</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                  viewMode === 'map' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>{t.mapView || 'Map'}</span>
              </button>
            </div>

            {/* Reset Filters */}
            {(selectedState !== 'All' || selectedDistrict !== 'All' || selectedMandi !== 'All' || searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-xs font-semibold transition"
                title={t.resetFilters || "Reset filters"}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.resetFilters || 'Reset'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Location Status Message if detected */}
        {locationStatus && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Active Location: <strong>{locationStatus}</strong></span>
          </div>
        )}
      </div>

      {/* Selected Local Mandi Overview Banner */}
      {selectedMarketDetails && (
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl p-5 mb-6 shadow-md border border-stone-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold">
                  {t.localMarketOverview || 'Selected Local Mandi Yard'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-700/80 text-stone-300 text-[10px] font-semibold">
                  {selectedMarketDetails.district}, {selectedMarketDetails.state}
                </span>
                {selectedMarketDetails.distanceKm !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" /> {selectedMarketDetails.distanceKm} km away
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                🏛️ {selectedMarketDetails.name}
              </h2>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-stone-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedMarketDetails.operatingHours || '06:00 AM - 04:00 PM'}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  {selectedMarketDetails.totalArrivalsToday || 1450} tonnes today
                </span>
                {selectedMarketDetails.contact && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedMarketDetails.contact}
                  </span>
                )}
              </div>
            </div>

            {/* Quick action button to view on map */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-xs border border-white/15 transition flex items-center gap-1.5"
              >
                <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>{viewMode === 'map' ? 'Back to Cards' : 'View on Interactive Map'}</span>
              </button>
            </div>
          </div>

          {/* Major commodities traded at this yard */}
          {selectedMarketDetails.majorCommodities && selectedMarketDetails.majorCommodities.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-stone-400 text-[11px] font-medium mr-1">Major Traded Crops:</span>
              {selectedMarketDetails.majorCommodities.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSearchQuery(c)}
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-emerald-600/40 text-stone-200 hover:text-white text-[11px] transition"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commodity Category Filter Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 pb-4 mb-4">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50 hover:text-stone-900'
              }`}
            >
              {(t as any)[cat.labelKey] || cat.id}
            </button>
          );
        })}
      </div>

      {/* Interactive Map View */}
      {viewMode === 'map' && (
        <div className="mb-8 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <MapIcon className="w-4 h-4 text-emerald-700" />
              <span>Interactive APMC Local Mandis Map</span>
              <span className="text-[11px] font-normal text-stone-500">
                (Click any pin to select that market yard)
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">
              {availableMandis.length} Mandis in View
            </span>
          </div>
          <div
            ref={mapContainerRef}
            className="w-full h-[450px] bg-stone-100 relative z-0"
          />
        </div>
      )}

      {/* Commodity Rates Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-600">Fetching live local APMC mandi benchmarks...</p>
        </div>
      ) : mandiRates.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-stone-900">No commodities found for this filter</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            Try resetting the search query or select another district/mandi to see active trades.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mandiRates.map((rate, idx) => {
            const priceInfo = formatPrice(rate.modal_price);
            return (
              <div
                key={`${rate.crop}-${rate.mandi}-${idx}`}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Produce Image Header */}
                  <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                    <img
                      src={rate.image || getCropImage(rate.crop)}
                      alt={rate.crop}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = getCropImage(rate.crop);
                      }}
                    />
                    {/* Variety Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold bg-black/75 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                        {translateText(rate.variety, language)}
                      </span>
                    </div>

                    {/* Admin Edit Photo Button */}
                    {user && user.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCrop({
                            crop: rate.crop,
                            currentImage: rate.image || getCropImage(rate.crop),
                            variety: rate.variety
                          });
                          setNewImageUrl(rate.image || getCropImage(rate.crop));
                          setSaveSuccess(false);
                          setImageError(null);
                        }}
                        className="absolute bottom-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-[11px] font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer border border-amber-300 active:scale-95"
                        title={translateText("Admin: Change crop photo", language)}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{translateText('Edit Photo', language)}</span>
                      </button>
                    )}

                    {/* Trend Pill */}
                    <div className="absolute top-3 right-3">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 ${
                        rate.trend === 'UP' ? 'bg-emerald-600 text-white' :
                        rate.trend === 'DOWN' ? 'bg-red-600 text-white' :
                        'bg-stone-700 text-white'
                      }`}>
                        {rate.trend === 'UP' && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {rate.trend === 'DOWN' && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {rate.trend === 'STABLE' && <Minus className="w-3.5 h-3.5" />}
                        <span>{rate.trend === 'UP' ? `+${rate.pct_change}%` : rate.trend === 'DOWN' ? `-${rate.pct_change}%` : translateText('Stable', language)}</span>
                      </span>
                    </div>

                    {/* Category Tag */}
                    {rate.category && (
                      <div className="absolute bottom-3 left-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-stone-800 px-2 py-0.5 rounded-md shadow-2xs">
                          {translateText(rate.category, language)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Information Details */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-stone-900 tracking-tight">{translateText(rate.crop, language)}</h3>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-semibold text-stone-700">{translateText(rate.mandi, language)}</span>
                          {rate.district ? `(${translateText(rate.district, language)})` : `(${translateText(rate.state, language)})`}
                        </p>
                        {rate.distanceKm !== undefined && (
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                            📍 {rate.distanceKm} {translateText('km from you', language)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-emerald-900 font-['Outfit']">
                          {priceInfo.modal}
                        </div>
                        <span className="text-xs text-stone-500 font-medium">/{priceInfo.unit}</span>
                      </div>
                    </div>

                    {/* Price Range & Daily Arrivals */}
                    <div className="mt-4 p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-stone-600">
                        <span>{translateText('Modal Price Range:', language)}</span>
                        <span className="font-semibold text-stone-800">{priceInfo.min} - {priceInfo.max}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>{translateText("Today's Market Arrivals:", language)}</span>
                        <span className="font-semibold text-stone-800">{rate.arrival_tonnes} {translateText('tonnes', language)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Benchmark Advice */}
                <div className="p-3 bg-emerald-50/70 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-950 font-medium">
                  <span className="text-stone-500">{t.benchmarkAdvice || 'Benchmark Advice'}:</span>
                  <span className="font-bold text-emerald-900">
                    {rate.trend === 'UP' ? translateText('Bullish: Strong demand at yard', language) : rate.trend === 'DOWN' ? translateText('Bearish: Heavy supply arriving', language) : translateText('Balanced trade volume', language)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Admin Produce Photo Edit Modal */}
      {editingCrop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 text-stone-900 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-100" />
                <div>
                  <h3 className="text-sm font-bold">Edit Produce Photo</h3>
                  <p className="text-[10px] text-amber-100">
                    Customizing photo for <strong>{editingCrop.crop}</strong> ({editingCrop.variety})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingCrop(null)}
                className="p-1 rounded-xl hover:bg-white/20 text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Preview Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Current Photo</span>
                  <div className="h-28 rounded-xl overflow-hidden border border-stone-200 bg-stone-100">
                    <img
                      src={editingCrop.currentImage}
                      alt={editingCrop.crop}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">New Preview</span>
                  <div className="h-28 rounded-xl overflow-hidden border-2 border-emerald-500 bg-stone-100">
                    <img
                      src={newImageUrl || editingCrop.currentImage}
                      alt={editingCrop.crop}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = editingCrop.currentImage;
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* URL Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 block">
                  Image URL (Paste Unsplash or direct image link):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="flex-1 px-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                  {newImageUrl && (
                    <button
                      onClick={() => setNewImageUrl('')}
                      className="px-2 py-2 text-stone-400 hover:text-stone-600 text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Upload Local Image */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                  <span>Or Upload Image File:</span>
                  <span className="text-[10px] text-stone-400 font-normal">JPG, PNG (Max 5MB)</span>
                </label>
                <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl cursor-pointer text-stone-600 hover:text-amber-800 bg-stone-50 hover:bg-amber-50/50 transition">
                  <Upload className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold">Choose photo from computer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Curated High-Definition Agricultural Presets */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                  <span>Quick Authentic Presets:</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Tested 100% Matching</span>
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-stone-50 rounded-xl border border-stone-200">
                  {CROP_PHOTO_PRESETS.map((preset, pIdx) => {
                    const isSelected = newImageUrl === preset.url;
                    return (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setNewImageUrl(preset.url)}
                        className={`p-1 rounded-lg border text-left flex flex-col items-center gap-1 transition ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500'
                            : 'border-stone-200 bg-white hover:border-amber-400'
                        }`}
                      >
                        <div className="w-full h-12 rounded overflow-hidden bg-stone-100">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-[9px] font-bold text-stone-700 truncate w-full text-center">
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Success / Error Feedback */}
              {imageError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{imageError}</span>
                </div>
              )}

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Crop photo updated successfully across FarmiQ!</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingCrop(null)}
                disabled={savingImage}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCropImage}
                disabled={savingImage || !newImageUrl.trim()}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold flex items-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {savingImage ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving to Cloud...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save & Apply Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
