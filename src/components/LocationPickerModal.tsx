import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Search, Check, X, Compass, Loader2, Sparkles, ExternalLink, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { User } from '../types';
import { api, setStoredUser } from '../api';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onAddressSaved?: (newAddress: string, coords: { lat: number; lng: number }, pincode?: string) => void;
  title?: string;
  defaultAddress?: string;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  user,
  onAddressSaved,
  title = "Select Address & Location",
  defaultAddress
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Initial coords: user coordinates or Maharashtra / Pune center
  const initialLat = user?.latitude || 18.5204;
  const initialLng = user?.longitude || 73.8567;

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng
  });

  const [addressText, setAddressText] = useState(
    defaultAddress || user?.delivery_address || user?.location || 'Kothrud, Pune, Maharashtra'
  );
  const [areaName, setAreaName] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapLayerType, setMapLayerType] = useState<'google_road' | 'google_hybrid' | 'osm'>('google_road');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Quick preset locations in agricultural regions & major hubs
  const PRESET_LOCATIONS = [
    { label: 'Pune (Kothrud)', lat: 18.5074, lng: 73.8077, address: 'Flat 402, Green Meadows, Kothrud, Pune' },
    { label: 'Nashik (Lasalgaon Mandi)', lat: 20.1415, lng: 74.2237, address: 'Sahyadri Agri Orchards, Lasalgaon, Nashik' },
    { label: 'Mumbai (Vashi APMC)', lat: 19.0760, lng: 72.9977, address: 'Sector 19, APMC Market, Vashi, Navi Mumbai' },
    { label: 'Nagpur (Kalamna)', lat: 21.1458, lng: 79.1390, address: 'Kalamna Market Road, East Nagpur' },
    { label: 'Kolhapur (Shirol)', lat: 16.7050, lng: 74.2433, address: 'Jaysingpur Farm Gate, Shirol, Kolhapur' },
  ];

  // Custom marker icon using SVG
  const customPinIcon = L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="position: relative; width: 38px; height: 38px; transform: translate(-50%, -100%);">
        <div style="
          background: radial-gradient(circle at 35% 35%, #10b981 0%, #047857 70%, #064e3b 100%);
          width: 36px; height: 36px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          border: 2.5px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 16px; color: white;">📍</span>
        </div>
        <div style="
          width: 14px; height: 6px;
          background: rgba(0,0,0,0.25);
          border-radius: 50%;
          position: absolute;
          bottom: -4px; left: 12px;
          filter: blur(1px);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

  // Reverse geocode lat/lng to readable address
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    setStatusMsg('Resolving street address...');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const addr = data.address || {};
          const road = addr.road || addr.neighbourhood || addr.suburb || '';
          const locality = addr.city_district || addr.suburb || addr.town || addr.village || '';
          const cityName = addr.city || addr.state_district || 'Pune';
          const postCode = addr.postcode || '';

          setAreaName(road || locality);
          setCity(cityName);
          setPincode(postCode);

          const formatted = [road, locality, cityName, postCode].filter(Boolean).join(', ');
          setAddressText(formatted || data.display_name);
          setStatusMsg(`✓ Pinpoint location identified: ${cityName}`);
        }
      }
    } catch {
      setStatusMsg(`Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Small delay to ensure modal DOM is visible and dimensions are calculated
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [coords.lat, coords.lng],
          zoom: 14,
          zoomControl: true,
        });

        // Default Google Maps crisp Road layer with accurate street & landmark names
        const layer = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Maps',
          maxZoom: 20,
        }).addTo(map);
        tileLayerRef.current = layer;

        const marker = L.marker([coords.lat, coords.lng], {
          icon: customPinIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const newPos = marker.getLatLng();
          setCoords({ lat: newPos.lat, lng: newPos.lng });
          reverseGeocode(newPos.lat, newPos.lng);
        });

        map.on('click', (e: L.LeafletMouseEvent) => {
          marker.setLatLng(e.latlng);
          setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          reverseGeocode(e.latlng.lat, e.latlng.lng);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } else {
        mapInstanceRef.current.invalidateSize();
        mapInstanceRef.current.setView([coords.lat, coords.lng], 14);
        if (markerRef.current) {
          markerRef.current.setLatLng([coords.lat, coords.lng]);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [isOpen]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch between Google Maps Roads, Satellite, and OpenStreetMap
  const switchTileLayer = (layer: 'google_road' | 'google_hybrid' | 'osm') => {
    setMapLayerType(layer);
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    let url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let attribution = '&copy; Google Maps';
    let maxZoom = 20;

    if (layer === 'google_hybrid') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Satellite Imagery';
    } else if (layer === 'osm') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      attribution = '&copy; OpenStreetMap contributors';
      maxZoom = 19;
    }

    const newLayer = L.tileLayer(url, { attribution, maxZoom }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  };

  // Helper to pan map & marker to new position
  const panToCoords = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setStatusMsg('Acquiring high-accuracy GPS signal...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        panToCoords(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setIsLocating(false);
        setStatusMsg('GPS request timed out. Using default region.');
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Search places via Nominatim
  const handleSearchPlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim() + ', India'
        )}&limit=4`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch {
      // fallback
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    panToCoords(lat, lng);
    setAddressText(item.display_name);
    setSearchResults([]);
    setSearchQuery('');
    setStatusMsg(`Selected: ${item.display_name.slice(0, 45)}...`);
  };

  // Save to profile and callback
  const handleSaveAddress = async () => {
    if (!addressText.trim()) {
      alert('Please enter or select a valid address.');
      return;
    }

    setIsSaving(true);
    try {
      // If user is logged in, persist to backend profile
      if (user) {
        const updatePayload: Partial<User> = {
          delivery_address: addressText.trim(),
          location: addressText.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
        };

        const res = await api.updateProfile(updatePayload);
        if (res && res.user) {
          setStoredUser(res.user);
        }
      }

      if (onAddressSaved) {
        onAddressSaved(addressText.trim(), coords, pincode.trim());
      }

      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save address to profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">{title}</h2>
              <p className="text-xs text-stone-500">
                Pick on the interactive map or enter manual details below
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Top Bar: Search & Current GPS Location */}
          <div className="flex flex-col sm:flex-row gap-2">
            <form onSubmit={handleSearchPlaces} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search city, town, mandi, or colony..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-3 py-2 bg-stone-800 text-white rounded-xl text-xs font-semibold hover:bg-stone-900 transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-100 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
            >
              {isLocating ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Navigation className="w-4 h-4 text-emerald-600" />
              )}
              <span>{isLocating ? 'Locating...' : 'Use My GPS Location'}</span>
            </button>
          </div>

          {/* Search dropdown results */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl shadow-md p-2 space-y-1">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-2">Matching Places</p>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectSearchResult(item)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs hover:bg-emerald-50 hover:text-emerald-900 transition flex items-start gap-2 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="truncate">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-stone-500">Quick hubs:</span>
            {PRESET_LOCATIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  panToCoords(preset.lat, preset.lng);
                  setAddressText(preset.address);
                  setStatusMsg(`Selected hub: ${preset.label}`);
                }}
                className="px-2 py-1 bg-stone-100 hover:bg-emerald-100 text-stone-700 hover:text-emerald-900 rounded-lg text-[11px] font-medium transition cursor-pointer border border-stone-200/60"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Map Layer Mode & Google Maps External Link */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => switchTileLayer('google_road')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  mapLayerType === 'google_road' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🗺️ Google Road Map
              </button>
              <button
                type="button"
                onClick={() => switchTileLayer('google_hybrid')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  mapLayerType === 'google_hybrid' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🛰️ Google Satellite
              </button>
              <button
                type="button"
                onClick={() => switchTileLayer('osm')}
                className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1 ${
                  mapLayerType === 'osm' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                🌐 OpenStreetMap
              </button>
            </div>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 hover:underline bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              title="Verify address and location directly on Google Maps"
            >
              <span>View on Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Interactive Map Container */}
          <div className="relative rounded-xl overflow-hidden border border-stone-300 shadow-inner">
            <div
              ref={mapContainerRef}
              className="w-full h-64 sm:h-72 z-0 bg-stone-100"
            />
            {/* Map overlay hint */}
            <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-medium text-stone-600 shadow-sm border border-stone-200 flex items-center gap-1 z-[1000]">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Google Maps view active • Click or drag pin to adjust exact location</span>
            </div>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div className="text-xs text-stone-600 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 flex items-center justify-between">
              <span className="truncate">{statusMsg}</span>
              <span className="text-[11px] font-mono text-stone-400 shrink-0">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>
          )}

          {/* Address Inputs */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Full Address / Delivery Point:
              </label>
              <textarea
                rows={2}
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="House / Flat No., Street, Landmark, Area, City, State, PIN"
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">Locality / Landmark</label>
                <input
                  type="text"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g. Near Market Yard"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">City / District</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Pune"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">PIN Code</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 411038"
                  className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-stone-100 bg-stone-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAddress}
            disabled={isSaving || !addressText.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Save & Use Selected Address</span>
          </button>
        </div>
      </div>
    </div>
  );
};
