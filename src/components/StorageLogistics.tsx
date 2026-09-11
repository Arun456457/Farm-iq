import React, { useState, useEffect } from 'react';
import { Warehouse, MapPin, Calendar, Clock, CheckCircle, ShieldCheck, Plus, ThermometerSnowflake, QrCode } from 'lucide-react';
import { User, StorageBooking, LanguageCode } from '../types';
import { api } from '../api';
import { translations } from '../translations';

interface StorageLogisticsProps {
  user: User | null;
  language: LanguageCode;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

const STORAGE_FACILITIES = [
  {
    id: "fac-1",
    name: "AgriCold Integrated Logistics Hub",
    location: "Kolar APMC Industrial Corridor, Karnataka",
    state: "Karnataka",
    temp_range: "0°C to 4°C",
    type: "Controlled Atmosphere (CA) Cold Storage",
    daily_rate: 4.5,
    capacity_available_quintals: 850,
    ideal_for: "Tomatoes, Capsicum, Apples, Pomegranate",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80",
    transport_available: "Reefer Trucks Available (₹2/km)"
  },
  {
    id: "fac-2",
    name: "Lasalgaon Onion & Potato Aeration Godown",
    location: "Lasalgaon Mandi Zone, Nashik, Maharashtra",
    state: "Maharashtra",
    temp_range: "12°C to 18°C (Humidity Controlled)",
    type: "Scientific Dehumidified Warehouse",
    daily_rate: 3.2,
    capacity_available_quintals: 1400,
    ideal_for: "Onions, Garlic, Potatoes, Ginger",
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&auto=format&fit=crop&q=80",
    transport_available: "Eicher 14ft Open & Closed Beds"
  },
  {
    id: "fac-3",
    name: "Punjab Agro Central Grain Silo & Cold Hub",
    location: "Khanna APMC, Ludhiana, Punjab",
    state: "Punjab",
    temp_range: "Ambient & Cold Storage (-2°C to 10°C)",
    type: "Grain Silo & High-Density Cold Storage",
    daily_rate: 3.8,
    capacity_available_quintals: 2100,
    ideal_for: "Wheat, Basmati Paddy, Citrus Fruits",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80",
    transport_available: "Bulk Tipper & Heavy Trucks"
  },
  {
    id: "fac-4",
    name: "Sahyadri Agro CA Cold Chain Park",
    location: "Mohadi, Nashik, Maharashtra",
    state: "Maharashtra",
    temp_range: "-1°C to 5°C (Nitrogen Flushing)",
    type: "Controlled Atmosphere (CA) Cold Storage",
    daily_rate: 5.0,
    capacity_available_quintals: 1950,
    ideal_for: "Grapes, Pomegranates, Fresh Vegetables",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
    transport_available: "Cold Reefer Van Dispatch (₹2/km)"
  },
  {
    id: "fac-5",
    name: "Vashi APMC Perishable Terminal Cold Store",
    location: "Sector 19, Vashi, Navi Mumbai, Maharashtra",
    state: "Maharashtra",
    temp_range: "2°C to 8°C",
    type: "Multi-Chamber Cold Storage",
    daily_rate: 4.8,
    capacity_available_quintals: 1200,
    ideal_for: "Exotic Veggies, Fruits, Leafy Greens",
    image: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?w=600&auto=format&fit=crop&q=80",
    transport_available: "Same-Day Mumbai/MMR Dispatch"
  },
  {
    id: "fac-6",
    name: "Agra Mega Potato Preservation & Cold Hub",
    location: "Fatehabad Road, Agra, Uttar Pradesh",
    state: "Uttar Pradesh",
    temp_range: "2°C to 4°C (CIPC Treated)",
    type: "High-Capacity Cold Storage",
    daily_rate: 2.8,
    capacity_available_quintals: 3500,
    ideal_for: "Potatoes, Carrots, Sweet Potatoes",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
    transport_available: "Expressway Direct Fleets"
  },
  {
    id: "fac-7",
    name: "Guntur Spices & Red Chilli Scientific Cold Store",
    location: "Koramitla Road, Guntur, Andhra Pradesh",
    state: "Andhra Pradesh",
    temp_range: "4°C to 10°C (Moisture Barrier)",
    type: "Dehumidified Spice Godown",
    daily_rate: 4.2,
    capacity_available_quintals: 2800,
    ideal_for: "Dry Red Chillies, Turmeric, Coriander",
    image: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80",
    transport_available: "Direct Port & Mandi Logistics"
  },
  {
    id: "fac-8",
    name: "Indore Central Soybean & Garlic Preservation Hub",
    location: "Sanwer Road Industrial Area, Indore, Madhya Pradesh",
    state: "Madhya Pradesh",
    temp_range: "5°C to 14°C",
    type: "Scientific Grain & Bulb Godown",
    daily_rate: 3.5,
    capacity_available_quintals: 1650,
    ideal_for: "Soybean, Garlic, Pulses, Wheat",
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=600&auto=format&fit=crop&q=80",
    transport_available: "All-India Transport Desk"
  },
  {
    id: "fac-9",
    name: "Unjha Cumin & Spices Multi-Commodity Warehouse",
    location: "Highway Zone, Unjha, Gujarat",
    state: "Gujarat",
    temp_range: "Ambient & Controlled 15°C",
    type: "WDRA Certified Scientific Warehouse",
    daily_rate: 3.4,
    capacity_available_quintals: 2400,
    ideal_for: "Jeera (Cumin), Saunf, Mustard, Fenugreek",
    image: "https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80",
    transport_available: "Container Truck Dispatch"
  },
  {
    id: "fac-10",
    name: "Bangalore Rural Agro Packhouse & Ripening Hub",
    location: "Doddaballapur Industrial Park, Karnataka",
    state: "Karnataka",
    temp_range: "1°C to 12°C (Ethylene Ripening)",
    type: "Ripening Chamber & CA Storage",
    daily_rate: 5.2,
    capacity_available_quintals: 950,
    ideal_for: "Bananas, Mangoes, Papayas, Melons",
    image: "https://images.unsplash.com/photo-1603052875302-d376b7c0638a?w=600&auto=format&fit=crop&q=80",
    transport_available: "South India Express Reefer (₹2/km)"
  },
  {
    id: "fac-11",
    name: "Karnal Basmati Modern Silos & Cold Hub",
    location: "GT Road, Karnal, Haryana",
    state: "Punjab",
    temp_range: "Ambient Aerated Silos (12°C)",
    type: "Automated Steel Grain Silos",
    daily_rate: 3.0,
    capacity_available_quintals: 4200,
    ideal_for: "Basmati Paddy, Rice, Maize, Millets",
    image: "https://images.unsplash.com/photo-1586528116493-a029325540fa?w=600&auto=format&fit=crop&q=80",
    transport_available: "Dedicated Rail & Road Rakes"
  },
  {
    id: "fac-12",
    name: "Jaipur Agro-Food Park Solar Cold Storage",
    location: "RIICO Industrial Area, Sitapura, Jaipur, Rajasthan",
    state: "Rajasthan",
    temp_range: "0°C to 6°C (Solar Powered)",
    type: "Eco-Friendly Cold Chain",
    daily_rate: 4.0,
    capacity_available_quintals: 1100,
    ideal_for: "Ber, Pomegranates, Green Vegetables",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&auto=format&fit=crop&q=80",
    transport_available: "Delhi-Mumbai Freight Corridor Access"
  },
  {
    id: "fac-13",
    name: "Coimbatore Multi-Chamber Horticultural Packhouse",
    location: "Pollachi Road, Coimbatore, Tamil Nadu",
    state: "Tamil Nadu",
    temp_range: "2°C to 8°C",
    type: "Pre-Cooling & Cold Storage",
    daily_rate: 4.6,
    capacity_available_quintals: 1300,
    ideal_for: "Coconut, Vegetables, Shallots, Bananas",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    transport_available: "Kerala & TN Inter-State Fleets"
  },
  {
    id: "fac-14",
    name: "Hooghly Potato & Cold Chain Terminal",
    location: "Tarakeswar Highway, Hooghly, West Bengal",
    state: "West Bengal",
    temp_range: "2°C to 4°C",
    type: "High-Density Cold Storage",
    daily_rate: 2.9,
    capacity_available_quintals: 3100,
    ideal_for: "Jyoti Potatoes, Pokhraj, Vegetables",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80",
    transport_available: "Kolkata Metropolitan Logistics"
  }
];

export const StorageLogistics: React.FC<StorageLogisticsProps> = ({
  user,
  language,
  onOpenAuth,
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'facilities' | 'my-bookings'>('facilities');
  const [bookings, setBookings] = useState<StorageBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Booking Modal State
  const [selectedFacility, setSelectedFacility] = useState<typeof STORAGE_FACILITIES[0] | null>(null);
  const [produceType, setProduceType] = useState('Fresh Tomatoes');
  const [quantityQuintal, setQuantityQuintal] = useState<number>(20);
  const [storageType, setStorageType] = useState('Cold Storage (2°C - 4°C)');
  const [durationDays, setDurationDays] = useState<number>(14);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingSuccess, setBookingSuccess] = useState<StorageBooking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookings = async () => {
    try {
      const data = await api.getStorageBookings();
      setBookings(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenBookModal = (fac: typeof STORAGE_FACILITIES[0]) => {
    if (!user) {
      onOpenAuth('login');
      return;
    }
    setSelectedFacility(fac);
    setBookingSuccess(null);
  };

  // Cost calculations
  const dailyRate = selectedFacility?.daily_rate || 4.5;
  const totalCost = Math.round(quantityQuintal * dailyRate * durationDays);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;
    setIsSubmitting(true);

    try {
      const res = await api.bookStorage({
        facility_name: selectedFacility.name,
        location: selectedFacility.location,
        produce_type: produceType,
        quantity_quintal: quantityQuintal,
        storage_type: storageType,
        duration_days: durationDays,
        start_date: startDate,
        daily_rate: dailyRate,
        total_cost: totalCost,
      });

      setBookingSuccess(res.booking);
      setStatusMessage({
        type: 'success',
        text: `Successfully reserved ${quantityQuintal} Quintals at ${selectedFacility.name}!`
      });
      fetchBookings();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to book storage'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFacilities = STORAGE_FACILITIES.filter(fac => {
    const matchesState = selectedState === 'All' || fac.state === selectedState;
    const matchesType = selectedType === 'All' || fac.type.toLowerCase().includes(selectedType.toLowerCase());
    const matchesSearch = searchQuery === '' || 
      fac.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      fac.location.toLowerCase().includes(searchQuery.toLowerCase()) || 
      fac.ideal_for.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesType && matchesSearch;
  });

  const uniqueStates = ['All', 'Maharashtra', 'Karnataka', 'Punjab', 'Uttar Pradesh', 'Gujarat', 'Andhra Pradesh', 'Madhya Pradesh', 'Rajasthan', 'Tamil Nadu', 'West Bengal'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Inline Status Message */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' :
          'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold mb-2">
            <Warehouse className="w-3.5 h-3.5 text-blue-700" />
            <span>Pan-India Agricultural Cold Chain & Logistics Network</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-['Outfit']">
            {t.storageLogistics}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Verified cold chains, temperature-controlled godowns, reefer logistics desks, and warehouse receipts for agricultural loans.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl self-start md:self-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'facilities' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Available Hubs ({filteredFacilities.length})
          </button>
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'my-bookings' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      {activeTab === 'facilities' && (
        <div className="bg-white p-4 rounded-2xl border border-stone-200 mb-6 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search storage hubs by name, location, or crop (e.g., Tomato, Potato, Onion)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-3 py-2 text-xs border border-stone-200 rounded-xl outline-none focus:border-blue-500 bg-stone-50/50"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-stone-200 rounded-xl bg-white text-stone-700 outline-none"
              >
                <option value="All">All Facility Types</option>
                <option value="Cold Storage">Cold Storage</option>
                <option value="Warehouse">Dehumidified Warehouse</option>
                <option value="Silo">Grain Silo</option>
                <option value="Ripening">Ripening Chamber</option>
              </select>
            </div>
          </div>

          {/* State Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-400 font-bold shrink-0 mr-1 text-[11px]">States:</span>
            {uniqueStates.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedState(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                  selectedState === st
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: FACILITIES LIST */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((fac) => (
            <div key={fac.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="relative h-44 w-full bg-stone-100 overflow-hidden">
                  <img src={fac.image} alt={fac.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold bg-blue-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                      <ThermometerSnowflake className="w-3 h-3 text-cyan-300" /> {fac.temp_range}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-xs">
                      {fac.capacity_available_quintals} Q Available
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-base font-bold text-stone-900 leading-snug">{fac.name}</h3>
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3 text-stone-400 shrink-0" /> {fac.location}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1">
                      <div className="flex justify-between text-stone-600">
                        <span>Facility Type:</span>
                        <span className="font-semibold text-stone-800">{fac.type}</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Daily Rental Rate:</span>
                        <span className="font-bold text-blue-900">₹{fac.daily_rate} / Quintal / Day</span>
                      </div>
                      <div className="flex justify-between text-stone-600">
                        <span>Ideal Produce:</span>
                        <span className="font-semibold text-stone-800 truncate max-w-[170px]">{fac.ideal_for}</span>
                      </div>
                      {fac.transport_available && (
                        <div className="flex justify-between text-emerald-700 pt-1 border-t border-stone-200/60 font-semibold text-[11px]">
                          <span>Logistics:</span>
                          <span>{fac.transport_available}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-5 pt-0">
                <button
                  onClick={() => handleOpenBookModal(fac)}
                  className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Warehouse className="w-4 h-4" />
                  <span>{t.bookStorageSpace}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: MY BOOKINGS */}
      {activeTab === 'my-bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto my-6">
              <Warehouse className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No active storage bookings yet.</h3>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Book space in advance to preserve perishable produce and sell when market rates peak.
              </p>
              <button
                onClick={() => setActiveTab('facilities')}
                className="px-5 py-2.5 bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-800 transition"
              >
                Browse Cold Storage Hubs
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900 font-mono">Receipt #{b.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {b.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900">{b.facility_name}</h4>
                    <p className="text-xs text-stone-600">
                      Produce: <strong className="text-stone-800">{b.quantity_quintal} Quintals</strong> of {b.produce_type} ({b.storage_type})
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <span>Duration: <strong className="text-stone-800">{b.duration_days} Days</strong></span>
                      <span>•</span>
                      <span>From: {b.start_date}</span>
                      <span>•</span>
                      <span>Total Cost: <strong className="text-blue-900 font-bold">₹{b.total_cost}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <QrCode className="w-4 h-4 text-emerald-700" /> Space Reserved
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOOKING MODAL (Addresses user complaint directly!) */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 text-left">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-800 to-teal-700 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Outfit']">{t.bookStorageSpace}</h2>
                <p className="text-xs text-blue-100 mt-0.5">{selectedFacility.name}</p>
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Cold Storage Space Confirmed!</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Receipt ID: <strong className="font-mono text-stone-900">{bookingSuccess.id}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Facility:</span>
                    <span className="font-bold text-stone-900">{bookingSuccess.facility_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Days Booked:</span>
                    <span className="font-bold text-blue-900">{bookingSuccess.duration_days} Days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Reserved Quantity:</span>
                    <span className="font-bold text-stone-900">{bookingSuccess.quantity_quintal} Quintals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Rental Cost:</span>
                    <span className="font-bold text-emerald-800 text-sm">₹{bookingSuccess.total_cost}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedFacility(null);
                      setActiveTab('my-bookings');
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition"
                  >
                    View All My Bookings
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Produce / Crop to Store *</label>
                  <input
                    type="text"
                    required
                    value={produceType}
                    onChange={(e) => setProduceType(e.target.value)}
                    placeholder="e.g. Red Onions / Hybrid Tomatoes"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Quantity (Quintals) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quantityQuintal}
                      onChange={(e) => setQuantityQuintal(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-stone-500">1 Quintal = 100 kg</span>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Storage Duration (Days) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="180"
                      value={durationDays}
                      onChange={(e) => setDurationDays(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-blue-600"
                    />
                    <span className="text-[10px] text-stone-500">e.g. 7, 14, 30, 60 days</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Storage Chamber Type</label>
                    <select
                      value={storageType}
                      onChange={(e) => setStorageType(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white outline-none focus:border-blue-600"
                    >
                      <option value="Cold Storage (2°C - 4°C)">Cold Storage (2°C - 4°C)</option>
                      <option value="Controlled Atmosphere (CA)">Controlled Atmosphere (CA)</option>
                      <option value="Scientific Aerated Godown">Scientific Aerated Godown</option>
                      <option value="Deep Freeze (-18°C)">Deep Freeze (-18°C)</option>
                    </select>
                  </div>
                </div>

                {/* Cost Estimation Summary */}
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
                  <div className="flex justify-between text-stone-700">
                    <span>Base Rate:</span>
                    <span>₹{dailyRate} / Quintal / Day</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Calculation:</span>
                    <span>{quantityQuintal} Q × ₹{dailyRate} × {durationDays} Days</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex justify-between font-bold text-stone-900 text-sm">
                    <span>Estimated Total Rental:</span>
                    <span className="text-blue-900 text-base">₹{totalCost}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedFacility(null)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-200 transition disabled:bg-stone-300 cursor-pointer"
                  >
                    {isSubmitting ? 'Confirming Space...' : `Confirm Booking (₹${totalCost})`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
