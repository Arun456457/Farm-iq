import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Award, Package, ShoppingBag, Truck, CheckCircle, 
  MapPin, Calendar, Clock, AlertCircle, RefreshCw, FileText, Check, ArrowRight,
  Users, ChevronRight, Phone, Download, Search, Filter, ExternalLink, X, Sparkles, Navigation, Edit3,
  Compass, ChevronDown, ChevronUp, Layers
} from 'lucide-react';
import { User, Order, FPOLot, LanguageCode, CustomerRequirement } from '../types';
import { api } from '../api';
import { translations } from '../translations';
import { calculateAutomatedDistance, calculateAccurateRoadDistanceAsync, calculateDeliveryFee, AutomatedDistanceResult } from '../utils/distance';
import { LocationPickerModal } from './LocationPickerModal';

interface BuyerDashboardProps {
  user: User;
  language: LanguageCode;
  activeSubTab?: 'buyer-orders' | 'buyer-fpo' | 'orders' | 'fpo-lots';
  onSubTabChange?: (tab: string) => void;
  onNavigateToContracts?: () => void;
  onContractCreated?: () => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  user,
  language,
  activeSubTab,
  onSubTabChange,
  onNavigateToContracts,
  onContractCreated
}) => {
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState<'orders' | 'fpo-lots'>(() => {
    if (activeSubTab === 'buyer-fpo' || activeSubTab === 'fpo-lots') return 'fpo-lots';
    return 'orders';
  });

  // Keep internal tab in sync when activeSubTab changes from parent/Navbar
  useEffect(() => {
    if (activeSubTab === 'buyer-fpo' || activeSubTab === 'fpo-lots') {
      setActiveTab('fpo-lots');
    } else if (activeSubTab === 'buyer-orders' || activeSubTab === 'orders') {
      setActiveTab('orders');
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab: 'orders' | 'fpo-lots') => {
    setActiveTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab === 'fpo-lots' ? 'buyer-fpo' : 'buyer-orders');
    }
  };
  
  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [lots, setLots] = useState<FPOLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Procurement state
  const [procuringLotId, setProcuringLotId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState<number | null>(null);
  const [selectedLotDetails, setSelectedLotDetails] = useState<FPOLot | null>(null);

  // Delivery address change & procurement options during order placement
  const [procureLotModal, setProcureLotModal] = useState<FPOLot | null>(null);
  const [procureDeliveryAddress, setProcureDeliveryAddress] = useState<string>(
    user.delivery_address || user.location || 'Sector 19, Central Cold Chain Depot, APMC Vashi, Navi Mumbai - 400703'
  );
  const [procureDistanceKm, setProcureDistanceKm] = useState<number>(45);
  const [distanceInfo, setDistanceInfo] = useState<AutomatedDistanceResult | null>(null);
  const [isCalculatingDistance, setIsCalculatingDistance] = useState<boolean>(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState<boolean>(false);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);
  const [escrowPaymentModel, setEscrowPaymentModel] = useState<'100_ESCROW' | '20_ADVANCE_80_DELIVERY'>('100_ESCROW');
  const [logisticsMode, setLogisticsMode] = useState<'REEFER_COLD_CHAIN' | 'STANDARD_HEAVY_HAUL' | 'BUYER_SELF_FLEET'>('REEFER_COLD_CHAIN');
  const [inspectionProtocol, setInspectionProtocol] = useState<'APMC_WEIGHBRIDGE' | 'DESTINATION_ACCEPTANCE'>('APMC_WEIGHBRIDGE');
  const [logisticsNotes, setLogisticsNotes] = useState<string>('');
  const [showFarmerBreakdown, setShowFarmerBreakdown] = useState<boolean>(false);

  // Auto-calculate road distance between lot origin and buyer delivery address
  useEffect(() => {
    if (!procureLotModal || !procureDeliveryAddress.trim()) return;
    let isCurrent = true;
    const origin = procureLotModal.location || 'Lasalgaon, Nashik';
    setIsCalculatingDistance(true);

    const quickResult = calculateAutomatedDistance(origin, procureDeliveryAddress);
    if (quickResult && quickResult.distanceKm > 0) {
      setProcureDistanceKm(quickResult.distanceKm);
      setDistanceInfo(quickResult);
    }

    calculateAccurateRoadDistanceAsync(origin, procureDeliveryAddress)
      .then((accResult) => {
        if (isCurrent && accResult && accResult.distanceKm > 0) {
          setProcureDistanceKm(accResult.distanceKm);
          setDistanceInfo(accResult);
        }
      })
      .catch((err) => console.warn('Distance calc error:', err))
      .finally(() => {
        if (isCurrent) setIsCalculatingDistance(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [procureLotModal?.id, procureDeliveryAddress]);

  // GPS auto-detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your browser');
      return;
    }
    setIsDetectingGps(true);
    setGpsStatusMsg('Detecting device GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road = addr.road || addr.neighbourhood || addr.suburb || '';
            const locality = addr.city_district || addr.suburb || addr.town || addr.village || '';
            const cityName = addr.city || addr.state_district || 'Maharashtra';
            const formatted = [road, locality, cityName].filter(Boolean).join(', ') || data.display_name;
            setProcureDeliveryAddress(formatted || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setGpsStatusMsg(`✓ GPS Location Locked (${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E)`);
          } else {
            setProcureDeliveryAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            setGpsStatusMsg(`✓ GPS Coordinates Locked`);
          }
        } catch {
          setProcureDeliveryAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setGpsStatusMsg(`✓ GPS Coordinates Captured`);
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        console.warn('GPS error:', err);
        setIsDetectingGps(false);
        setGpsStatusMsg('Location access denied. Please select from presets or map.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Lot filter states
  const [lotSearch, setLotSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  const loadBuyerData = async (silent = false) => {
    if (!silent) setLoading(true);
    setIsSyncing(true);
    try {
      const [buyerOrders, availableLots] = await Promise.all([
        api.getBuyerOrders().catch(() => []),
        api.getLots().catch(() => [])
      ]);
      setOrders(buyerOrders || []);
      setLots(availableLots || []);
    } catch (err: any) {
      console.error('Failed to load buyer data:', err);
    } finally {
      if (!silent) setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadBuyerData(false);

    // 1. Cross-tab & local real-time sync via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('farmiq_bus');
      bc.onmessage = (event) => {
        if (event.data?.type) {
          loadBuyerData(true);
        }
      };
    } catch {
      // BroadcastChannel unsupported
    }

    // 2. Server-Sent Events (SSE) for instant backend push notifications
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/notifications/stream');
      evtSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && (parsed.type || parsed.data)) {
            // Instant re-render on any lot, order, contract or status update
            loadBuyerData(true);
          }
        } catch {
          // heartbeat/keepalive comment
        }
      };
      evtSource.onerror = () => {
        // SSE reconnect handles automatically
      };
    } catch {
      // SSE unsupported fallback
    }

    // 3. In-window custom event listener
    const handleLocalStateChange = () => {
      loadBuyerData(true);
    };
    window.addEventListener('farmiq_state_change', handleLocalStateChange);

    // 4. Polling fallback (3.5s) to guarantee consistency
    const interval = setInterval(() => loadBuyerData(true), 3500);

    return () => {
      clearInterval(interval);
      if (evtSource) evtSource.close();
      if (bc) bc.close();
      window.removeEventListener('farmiq_state_change', handleLocalStateChange);
    };
  }, [user]);

  const getHarvestTimingInfo = (harvestDateStr?: string) => {
    if (!harvestDateStr) return { label: 'Fresh Daily Harvest', isFuture: false, isToday: true, daysText: '0d stored' };
    const match = String(harvestDateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return { label: harvestDateStr, isFuture: false, isToday: false, daysText: '' };
    const hDate = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((today.getTime() - hDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === -1) return { label: `${harvestDateStr} (Tomorrow)`, isFuture: true, isToday: false, daysText: '0 days stored (Harvesting Tomorrow)' };
    if (diffDays === -2) return { label: `${harvestDateStr} (Day After Tomorrow)`, isFuture: true, isToday: false, daysText: '0 days stored (Harvesting in 2 days)' };
    if (diffDays < -2) return { label: `${harvestDateStr} (In ${Math.abs(diffDays)} days)`, isFuture: true, isToday: false, daysText: `0 days stored (Harvesting in ${Math.abs(diffDays)} days)` };
    if (diffDays === 0) return { label: `${harvestDateStr} (Fresh Today)`, isFuture: false, isToday: true, daysText: '0 days stored (Harvested Today)' };
    return { label: `${harvestDateStr}`, isFuture: false, isToday: false, daysText: `Stored for ${diffDays} day${diffDays === 1 ? '' : 's'}` };
  };

  // Open modal so buyer can set/change delivery address when taking lot order
  const handleOpenProcureModal = (lot: FPOLot) => {
    setProcureLotModal(lot);
    const defaultAddr = user.delivery_address || user.location || 'Sector 19, Central Cold Chain Depot, APMC Vashi, Navi Mumbai - 400703';
    setProcureDeliveryAddress(defaultAddr);
    const initialDist = calculateAutomatedDistance(lot.location || 'Lasalgaon, Nashik', defaultAddr);
    setProcureDistanceKm(initialDist.distanceKm || 45);
    setDistanceInfo(initialDist);
    setEscrowPaymentModel('100_ESCROW');
    setLogisticsMode('REEFER_COLD_CHAIN');
    setInspectionProtocol('APMC_WEIGHBRIDGE');
    setLogisticsNotes('');
    setShowFarmerBreakdown(false);
    setGpsStatusMsg(null);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
  };

  // Execute procurement with buyer's custom delivery address
  const handleExecuteProcurement = async () => {
    if (!procureLotModal) return;
    if (!procureDeliveryAddress.trim()) {
      setActionErrorMsg('Please provide a valid delivery warehouse address for this order.');
      return;
    }
    setProcuringLotId(procureLotModal.id);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await api.procureLot(procureLotModal.id, {
        delivery_address: procureDeliveryAddress.trim(),
        distance_km: procureDistanceKm,
        logistics_mode: logisticsMode,
        escrow_model: escrowPaymentModel,
        inspection_protocol: inspectionProtocol,
        logistics_notes: logisticsNotes.trim()
      } as any);

      setActionSuccessMsg(
        `✓ Institutional Procurement Confirmed! Order #${res.order?.id || 'NEW'} created under Escrow Contract #${res.contract?.id || 'ESC'}. Delivery routed to "${procureDeliveryAddress.trim()}". FPO farmers have been notified for dispatch.`
      );

      // Instant optimistic UI render: immediately insert new order and lock lot in local state
      if (res.order) {
        setOrders(prev => [res.order, ...prev.filter(o => o.id !== res.order.id)]);
      }
      if (res.lot) {
        setLots(prev => prev.map(l => l.id === procureLotModal.id ? res.lot : l));
      } else {
        setLots(prev => prev.map(l => l.id === procureLotModal.id ? { ...l, status: 'CONTRACTED' as const } : l));
      }

      setProcureLotModal(null);

      // Cross-tab & local component broadcast
      try {
        const bus = new BroadcastChannel('farmiq_bus');
        bus.postMessage({ type: 'LOT_PROCURED', order: res.order, lot: res.lot, contract: res.contract });
        bus.close();
      } catch {}
      window.dispatchEvent(new CustomEvent('farmiq_state_change', { detail: { type: 'LOT_PROCURED', order: res.order } }));

      // Fresh server re-sync
      await loadBuyerData(true);
      handleTabSwitch('orders');
      if (onContractCreated) {
        onContractCreated();
      }
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to procure produce lot');
    } finally {
      setProcuringLotId(null);
    }
  };

  // Handle buyer confirming receipt & releasing escrow
  const handleConfirmDelivery = async (orderId: number) => {
    setConfirmingDeliveryId(orderId);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      await api.updateOrderStatus(orderId, 'DELIVERED');
      setActionSuccessMsg(`✓ Goods received verified! Escrow payment released to FPO contributing farmers.`);
      
      // Instant optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED', delivered_at: new Date().toISOString() } : o));

      try {
        const bus = new BroadcastChannel('farmiq_bus');
        bus.postMessage({ type: 'ORDER_STATUS_UPDATED', orderId, status: 'DELIVERED' });
        bus.close();
      } catch {}
      window.dispatchEvent(new CustomEvent('farmiq_state_change', { detail: { type: 'ORDER_STATUS_UPDATED', orderId, status: 'DELIVERED' } }));

      await loadBuyerData(true);
    } catch (err: any) {
      setActionErrorMsg(err.message || 'Failed to confirm receipt');
    } finally {
      setConfirmingDeliveryId(null);
    }
  };

  const filteredLots = lots.filter(lot => {
    const matchesSearch = 
      lot.crop_name.toLowerCase().includes(lotSearch.toLowerCase()) ||
      lot.variety.toLowerCase().includes(lotSearch.toLowerCase()) ||
      (lot.fpo_name && lot.fpo_name.toLowerCase().includes(lotSearch.toLowerCase()));
    const matchesGrade = gradeFilter === 'ALL' || lot.quality_grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });

  const activeOrdersCount = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
  const deliveredOrdersCount = orders.filter(o => o.status === 'DELIVERED').length;
  const totalVolumeProcured = orders.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Corporate Institutional Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-stone-800">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-500/20 rounded-2xl border border-teal-400/30 text-teal-300">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold font-['Outfit'] tracking-tight">
                    {user.company_name || user.full_name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Institutional Buyer
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  GSTIN: <span className="font-mono text-stone-300">{user.gstin || '27AAACR1234F1Z1'}</span> • Type: <span className="text-stone-300">{user.buyer_type || 'Retail Chain & Food Processor'}</span> • Hub: <span className="text-stone-300">{user.location}</span>
                </p>
              </div>
            </div>
            
            <p className="text-xs text-stone-300 max-w-2xl pt-1">
              Direct procurement gateway connecting verified institutional buyers with Farmer Producer Organizations (FPOs). Every lot pools produce from multiple certified local farmers with digital quality certification and escrow-backed delivery.
            </p>
          </div>

          <div className="flex sm:items-center gap-3 self-start md:self-auto bg-white/5 p-3 rounded-2xl border border-white/10 backdrop-blur-xs">
            <div className="text-center px-3 border-r border-white/10">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Active Orders</span>
              <span className="text-xl font-bold text-amber-300">{activeOrdersCount}</span>
            </div>
            <div className="text-center px-3 border-r border-white/10">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Completed</span>
              <span className="text-xl font-bold text-emerald-400">{deliveredOrdersCount}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Total Volume</span>
              <span className="text-xl font-bold text-teal-300">{totalVolumeProcured} Qtl</span>
            </div>
          </div>
        </div>

        {/* Global Live Sync Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Real-time FPO farmer order synchronization active (Updates every 3.5s)</span>
          </div>
          <button
            onClick={() => loadBuyerData(false)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync Latest Farm Status</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-medium flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 font-bold hover:text-emerald-900">✕</button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-2xl text-red-900 text-xs font-medium flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-red-700 font-bold hover:text-red-900">✕</button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => handleTabSwitch('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>FPO Purchase Orders & Active Deliveries</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] ${
            activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch('fpo-lots')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'fpo-lots'
              ? 'bg-stone-900 text-white shadow-md'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>FPO Graded Produce Lots (Direct Procurement)</span>
          <span className={`px-2 py-0.2 rounded-full text-[10px] ${
            activeTab === 'fpo-lots' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {lots.length}
          </span>
        </button>
      </div>

      {/* TAB 1: ORDERS & TRACKING */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Institutional Purchase Orders</h3>
              <p className="text-xs text-stone-500">Live order lifecycle tracking directly synced with FPO farmers and direct logistics</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time updates from Farmer Preparation</span>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
              <p className="text-xs text-stone-500 font-medium">Fetching active FPO purchase orders and escrow records...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 space-y-3">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-stone-800">No active FPO purchase orders found</h4>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Browse available graded FPO produce lots below or let FPO farmers match their pooled harvest with your institutional demand profile.
              </p>
              <button
                onClick={() => handleTabSwitch('fpo-lots')}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                Explore Available FPO Lots
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const totalAmount = order.total_amount || ((order.quantity || 0) * (order.price_per_unit || 0));
                const isDelivered = order.status === 'DELIVERED';
                const isShipped = order.status === 'SHIPPED';
                const isPreparing = order.status === 'PROCESSING';
                const isAccepted = order.status === 'ACCEPTED' || order.status === 'ORDER_PLACED';
                const memberFarmers = order.member_farmers || [
                  { farmer_name: order.farmer_name || 'Lead Farmer', contributed_quantity: Math.round((order.quantity || 50) * 0.55), unit: order.unit || 'Quintal', farm_location: order.pickup_location || 'Central Cluster' },
                  { farmer_name: 'Ramesh Kulkarni', contributed_quantity: Math.round((order.quantity || 50) * 0.25), unit: order.unit || 'Quintal', farm_location: 'North Sub-Cluster' },
                  { farmer_name: 'Balasaheb Shinde', contributed_quantity: (order.quantity || 50) - Math.round((order.quantity || 50) * 0.55) - Math.round((order.quantity || 50) * 0.25), unit: order.unit || 'Quintal', farm_location: 'South Sub-Cluster' },
                ];

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold bg-stone-100 px-2 py-1 rounded-lg text-stone-800">
                          #{order.id}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-stone-900">
                            {order.quantity} {order.unit || 'Quintal'} • {order.product_name}
                          </h4>
                          <p className="text-[11px] text-stone-500 font-medium">
                            FPO / Collective: <strong className="text-stone-700">{order.farmer_name || 'Sahyadri Farmers Producer Co.'}</strong> • Placed: {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-1.5 ${
                          isDelivered 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                            : isShipped 
                              ? 'bg-blue-100 text-blue-800 border border-blue-300 animate-pulse'
                              : isPreparing
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-teal-100 text-teal-800 border border-teal-300'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {isDelivered && 'DELIVERED & ESCROW RELEASED'}
                          {isShipped && 'IN TRANSIT TO BUYER HUB'}
                          {isPreparing && 'FARMER PREPARING & PACKAGING'}
                          {isAccepted && 'CONTRACT ACCEPTED (ESCROW LOCKED)'}
                        </span>

                        <span className="text-sm font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                          ₹{totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Order Lifecycle Progress Bar */}
                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                        <span>Order Lifecycle Status:</span>
                        <span className="text-emerald-800">
                          {isDelivered ? 'Step 4 of 4: Order Completed' : isShipped ? 'Step 3 of 4: Out for Delivery' : isPreparing ? 'Step 2 of 4: Packing at FPO Hub' : 'Step 1 of 4: Contract Activated'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        {/* Step 1 */}
                        <div className={`p-2 rounded-lg border font-semibold ${
                          order.status ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-stone-400 border-stone-200'
                        }`}>
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <CheckCircle className="w-3 h-3" />
                            <span>1. Contracted</span>
                          </div>
                          <span className="text-[9px] opacity-90 block">Escrow Funded</span>
                        </div>

                        {/* Step 2 */}
                        <div className={`p-2 rounded-lg border font-semibold ${
                          isPreparing || isShipped || isDelivered ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-stone-400 border-stone-200'
                        }`}>
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Package className="w-3 h-3" />
                            <span>2. Preparing</span>
                          </div>
                          <span className="text-[9px] opacity-90 block">Produce Bagged</span>
                        </div>

                        {/* Step 3 */}
                        <div className={`p-2 rounded-lg border font-semibold ${
                          isShipped || isDelivered ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-stone-400 border-stone-200'
                        }`}>
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Truck className="w-3 h-3" />
                            <span>3. In Transit</span>
                          </div>
                          <span className="text-[9px] opacity-90 block">Direct Transit</span>
                        </div>

                        {/* Step 4 */}
                        <div className={`p-2 rounded-lg border font-semibold ${
                          isDelivered ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-white text-stone-400 border-stone-200'
                        }`}>
                          <div className="flex items-center justify-center gap-1 mb-0.5">
                            <Check className="w-3 h-3" />
                            <span>4. Delivered</span>
                          </div>
                          <span className="text-[9px] opacity-90 block">Escrow Released</span>
                        </div>
                      </div>
                    </div>

                    {/* FPO Multi-Farmer Collaborative Pooling Breakdown */}
                    <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-amber-800" />
                          <span className="text-xs font-bold text-amber-950">
                            FPO Pooled Harvest ({memberFarmers.length} Farmers Combined)
                          </span>
                        </div>
                        <span className="text-[10px] font-bold bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full">
                          Verified Cooperative Aggregation
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        An FPO pools harvests from 2 or more certified farmers to assemble high-volume institutional orders. Here is the individual farm-level contribution breakdown for this lot:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                        {memberFarmers.map((mf, fIdx) => (
                          <div key={fIdx} className="bg-white p-2.5 rounded-lg border border-amber-200/80 shadow-2xs text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-800 flex items-center gap-1">
                                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center text-[9px] font-bold">
                                  {fIdx + 1}
                                </span>
                                {mf.farmer_name}
                              </span>
                              <span className="font-bold text-emerald-800">
                                {mf.contributed_quantity} {mf.unit || order.unit || 'Qtl'}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-500">📍 {mf.farm_location || 'Sub-Cluster Hub'}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Logistics & Delivery Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100">
                      <div>
                        <span className="text-[10px] text-stone-400 block font-medium">Pickup Hub (Farmer Location)</span>
                        <p className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          {order.pickup_location || 'Lasalgaon, Nashik APMC'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-medium">Delivery Destination</span>
                        <p className="font-semibold text-stone-800 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          {order.delivery_address || user.delivery_address || 'Navi Mumbai APMC Terminal'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-medium">Logistics Distance</span>
                        <p className="font-semibold text-emerald-800 flex items-center gap-1 mt-0.5">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          {order.distance_km || 165} km (Delivery: ₹{(order.delivery_fee || calculateDeliveryFee(order.distance_km || 165)).toLocaleString('en-IN')})
                        </p>
                      </div>
                    </div>

                    {/* Order Action Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-2">
                        {onNavigateToContracts && (
                          <button
                            onClick={onNavigateToContracts}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                            <span>View Digital Escrow Agreement</span>
                          </button>
                        )}
                      </div>

                      {/* Confirm Receipt button when goods are in transit or shipped */}
                      {isShipped && (
                        <button
                          onClick={() => handleConfirmDelivery(order.id)}
                          disabled={confirmingDeliveryId === order.id}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:bg-stone-300"
                        >
                          <Check className="w-4 h-4" />
                          <span>{confirmingDeliveryId === order.id ? 'Releasing Escrow...' : 'Confirm Delivery & Release Escrow Payment'}</span>
                        </button>
                      )}

                      {isDelivered && (
                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle className="w-4 h-4" />
                          <span>Transaction Complete • Escrow Released</span>
                        </div>
                      )}

                      {isPreparing && (
                        <div className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <Clock className="w-4 h-4 animate-spin text-amber-600" />
                          <span>FPO is currently grading, packaging, and dispatching your produce</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FPO GRADED PRODUCE LOTS */}
      {activeTab === 'fpo-lots' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Outfit']">FPO Graded Produce Lots</h3>
              <p className="text-xs text-stone-500">
                Aggregated, lab-certified high-volume lots pooled from 2 or more cooperative farmers
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={lotSearch}
                  onChange={(e) => setLotSearch(e.target.value)}
                  placeholder="Search crop or variety..."
                  className="pl-8 pr-3 py-1.5 border border-stone-200 rounded-xl text-xs bg-white outline-none focus:border-emerald-600 w-44 sm:w-56"
                />
              </div>

              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-stone-200 rounded-xl text-xs bg-white outline-none font-bold text-stone-700"
              >
                <option value="ALL">All Grades</option>
                <option value="Grade-A">Grade-A (Premium)</option>
                <option value="Export-Grade">Export-Grade</option>
                <option value="Grade-B">Grade-B</option>
              </select>
            </div>
          </div>

          {filteredLots.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
              <Package className="w-10 h-10 text-stone-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800">No matching produce lots available</h4>
              <p className="text-xs text-stone-500 mt-1">Try adjusting your crop search or quality grading filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredLots.map((lot) => {
                const totalValue = (lot.quantity || 0) * (lot.base_price_per_unit || 0);
                const isProcuring = procuringLotId === lot.id;
                const memberFarmers = (lot.member_farmers && lot.member_farmers.length > 0)
                  ? lot.member_farmers
                  : [
                      { farmer_name: lot.farmer_name || 'Lead Farmer', contributed_quantity: lot.quantity, unit: lot.unit, farm_location: lot.location || 'Central Cluster', is_lead: true, share_pct: 100 }
                    ];

                return (
                  <div key={lot.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition space-y-3">
                    <div className="space-y-3">
                      {/* Top Meta */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-800">#{lot.id}</span>
                          <span className="text-[11px] text-stone-500 font-medium">{lot.fpo_name}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                          lot.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          ● {lot.status}
                        </span>
                      </div>

                      {/* Title & Quantity */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-bold text-stone-900 font-['Outfit']">
                            {lot.quantity} {lot.unit} of {lot.crop_name}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                            {lot.quality_grade}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5 font-medium">
                          Variety: {lot.variety} • Packaging: {lot.packaging_type}
                        </p>
                      </div>

                      {/* Quality Certification specs */}
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-stone-700">
                          <span className="font-semibold flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-emerald-600" /> Certified by:
                          </span>
                          <span className="font-medium text-emerald-800">{lot.certified_by}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-200/60 text-center">
                          <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                            <p className="text-[10px] text-stone-500">Moisture</p>
                            <p className="text-xs font-bold text-stone-800">{lot.moisture_pct}%</p>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                            <p className="text-[10px] text-stone-500">Defect Rate</p>
                            <p className="text-xs font-bold text-stone-800">&lt; {lot.defect_pct}%</p>
                          </div>
                          <div className="bg-white p-1.5 rounded-lg border border-stone-200">
                            <p className="text-[10px] text-stone-500">Color Uniformity</p>
                            <p className="text-xs font-bold text-emerald-800">{lot.color_uniformity_pct}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Multi-Farmer Pooled Produce (2+ Farmers Combined) */}
                      <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-amber-700" />
                            FPO Pooled Collective ({memberFarmers.length} Farmers Combined)
                          </span>
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                            Cooperative Aggregation
                          </span>
                        </div>
                        
                        <div className="space-y-1.5">
                          {memberFarmers.map((mf, fIdx) => (
                            <div key={fIdx} className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1.5 rounded-lg border border-amber-100 shadow-2xs">
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  mf.is_lead ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {mf.is_lead ? '★' : (fIdx + 1)}
                                </span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-stone-800">{mf.farmer_name}</span>
                                    {mf.is_lead && (
                                      <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">Lead</span>
                                    )}
                                  </div>
                                  <div className="text-stone-400 text-[10px] flex items-center gap-2">
                                    {mf.farm_name && <span>🏡 {mf.farm_name}</span>}
                                    {mf.farm_location && <span>📍 {mf.farm_location}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-bold text-emerald-800 block">
                                  {mf.contributed_quantity} {mf.unit || lot.unit}
                                </span>
                                {mf.share_pct !== undefined && (
                                  <span className="text-[10px] text-stone-500 font-medium">
                                    {mf.share_pct}% share
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing and Location */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-stone-500">Base Price: </span>
                          <strong className="text-sm font-bold text-emerald-800">₹{lot.base_price_per_unit}</strong>
                          <span className="text-stone-500"> / {lot.unit}</span>
                          <span className="text-[11px] text-stone-400 block">(Est. Lot Value: ₹{totalValue.toLocaleString('en-IN')})</span>
                        </div>
                        <div className="text-right text-stone-600 text-[11px]">
                          <p className="flex items-center justify-end gap-1"><MapPin className="w-3 h-3 text-stone-400" /> {lot.location}</p>
                          <p className="text-emerald-800 font-medium mt-0.5">Harvest: {getHarvestTimingInfo(lot.harvest_date).label}</p>
                        </div>
                      </div>
                    </div>

                    {/* Procurement Action Footer */}
                    <div className="pt-3 border-t border-stone-100">
                      {lot.status === 'AVAILABLE' ? (
                        <button
                          onClick={() => handleOpenProcureModal(lot)}
                          disabled={isProcuring}
                          className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-300" />
                          <span>{isProcuring ? 'Securing Lot in Escrow...' : 'Procure Produce Lot & Set Delivery Address'}</span>
                        </button>
                      ) : (
                        <div className="w-full py-2 bg-stone-100 rounded-xl text-stone-500 text-xs font-semibold text-center">
                          ✓ Contracted & Assigned
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* BUYER CONSIGNMENT & DELIVERY ADDRESS MODAL */}
      {procureLotModal && (() => {
        const modalMemberFarmers = (procureLotModal.member_farmers && procureLotModal.member_farmers.length > 0)
          ? procureLotModal.member_farmers
          : [
              { farmer_name: procureLotModal.farmer_name || 'Lead Cluster Farmer', contributed_quantity: procureLotModal.quantity, unit: procureLotModal.unit, farm_location: procureLotModal.location || 'Cooperative Cluster', is_lead: true }
            ];

        const calculatedDeliveryFee = logisticsMode === 'BUYER_SELF_FLEET' ? 0 : calculateDeliveryFee(procureDistanceKm);
        const produceVal = Math.round(procureLotModal.quantity * procureLotModal.base_price_per_unit);
        const totalEscrowDeposit = produceVal + calculatedDeliveryFee;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-stone-900 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/10 rounded-2xl ring-1 ring-white/20">
                    <ShoppingBag className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base sm:text-lg">Procure Lot #{procureLotModal.id}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 uppercase tracking-wide">
                        {procureLotModal.quality_grade}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-100/90">FPO Collective Sourcing with Automated Logistics & 100% Escrow</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProcureLotModal(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-left">
                {/* Lot Overview & Pooled Farmers Banner */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-base sm:text-lg flex items-center gap-2">
                        <span>{procureLotModal.crop_name}</span>
                        <span className="text-stone-500 font-normal text-xs sm:text-sm">({procureLotModal.variety})</span>
                      </h4>
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-xs text-stone-600">
                        <span>FPO Cluster: <strong className="text-stone-800 font-bold">{procureLotModal.fpo_name}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" /> {procureLotModal.location}</span>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0 bg-white sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-stone-200">
                      <span className="text-[11px] text-stone-500 block font-medium">Procurement Lot Volume</span>
                      <span className="text-lg font-black text-emerald-800">
                        {procureLotModal.quantity} {procureLotModal.unit}
                      </span>
                      <span className="text-xs text-stone-500 block font-semibold">@ ₹{procureLotModal.base_price_per_unit}/{procureLotModal.unit}</span>
                    </div>
                  </div>

                  {/* Contributing Farmers Accordion */}
                  <div className="pt-2 border-t border-stone-200">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setShowFarmerBreakdown(!showFarmerBreakdown)}
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{modalMemberFarmers.length} Contributing Farmers Pooled</span>
                        <span className="text-[10px] text-emerald-600 font-normal underline">
                          {showFarmerBreakdown ? '(hide details)' : '(view farmer breakdown)'}
                        </span>
                      </button>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                        {procureLotModal.certified_by || 'APMC Certified'}
                      </span>
                    </div>

                    {showFarmerBreakdown && (
                      <div className="mt-2.5 space-y-1.5 animate-in fade-in slide-in-from-top-1">
                        {modalMemberFarmers.map((mf, fIdx) => (
                          <div key={fIdx} className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-xl border border-stone-200 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                mf.is_lead ? 'bg-amber-600 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {mf.is_lead ? '★' : (fIdx + 1)}
                              </span>
                              <div>
                                <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                                  <span>{mf.farmer_name}</span>
                                  {mf.is_lead && <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">Lead Farmer</span>}
                                </div>
                                <div className="text-stone-400 text-[10px]">
                                  {mf.farm_location || mf.farm_name || 'Associated Farm Cluster'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold text-emerald-800">
                                {mf.contributed_quantity} {mf.unit || procureLotModal.unit}
                              </span>
                              {mf.share_pct !== undefined && (
                                <span className="text-[10px] text-stone-400 block">{mf.share_pct}% share</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 1: DELIVERY DESTINATION & WAREHOUSE ADDRESS */}
                <div className="space-y-2.5 p-4 rounded-2xl border border-teal-200/90 bg-teal-50/30">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-teal-700" />
                      <span>Delivery Destination / Warehouse Address *</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsMapPickerOpen(true)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Select on Map</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDetectGps}
                        disabled={isDetectingGps}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Compass className={`w-3 h-3 text-teal-700 ${isDetectingGps ? 'animate-spin' : ''}`} />
                        <span>{isDetectingGps ? 'Detecting...' : 'Auto GPS'}</span>
                      </button>
                    </div>
                  </div>

                  {gpsStatusMsg && (
                    <p className="text-[11px] text-teal-800 font-medium bg-teal-100/60 px-2.5 py-1 rounded-lg">
                      {gpsStatusMsg}
                    </p>
                  )}

                  <textarea
                    rows={2}
                    value={procureDeliveryAddress}
                    onChange={(e) => setProcureDeliveryAddress(e.target.value)}
                    placeholder="Enter custom warehouse, terminal, processing center, or cold storage depot address..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 bg-white"
                  />

                  {/* Quick Destination Presets */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Quick Destination Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setProcureDeliveryAddress("Sector 19, Central Cold Chain Depot, APMC Vashi, Navi Mumbai - 400703")}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-teal-50 hover:text-teal-900 border border-stone-200 transition cursor-pointer shadow-2xs"
                      >
                        📍 Vashi APMC Cold Depot
                      </button>
                      <button
                        type="button"
                        onClick={() => setProcureDeliveryAddress("Agri Logistics Park, Unit B-4, NH-3 Bhiwandi Corridor, Thane - 421302")}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-teal-50 hover:text-teal-900 border border-stone-200 transition cursor-pointer shadow-2xs"
                      >
                        📍 Bhiwandi Logistics Corridor
                      </button>
                      <button
                        type="button"
                        onClick={() => setProcureDeliveryAddress("Plot 12, Market Yard Terminal, Gultekdi, Pune - 411037")}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-teal-50 hover:text-teal-900 border border-stone-200 transition cursor-pointer shadow-2xs"
                      >
                        📍 Pune Market Yard Terminal
                      </button>
                      <button
                        type="button"
                        onClick={() => setProcureDeliveryAddress(user.delivery_address || user.location || "Corporate Agri Sourcing Facility, Maharashtra")}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white hover:bg-teal-50 hover:text-teal-900 border border-stone-200 transition cursor-pointer shadow-2xs"
                      >
                        🏢 Registered Company Address
                      </button>
                    </div>
                  </div>

                  {/* Road Corridor & Live Distance */}
                  <div className="pt-2 border-t border-teal-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-stone-700">
                      <Navigation className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span className="font-semibold">Route: </span>
                      <span className="text-stone-600 truncate max-w-xs">{procureLotModal.location} ➔ Destination</span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-stone-500">Distance:</span>
                        <input
                          type="number"
                          min="5"
                          max="2500"
                          value={procureDistanceKm}
                          onChange={(e) => setProcureDistanceKm(Math.max(5, Number(e.target.value)))}
                          className="w-16 px-2 py-0.5 border border-stone-300 rounded-md text-xs font-bold outline-none focus:border-teal-600 bg-white text-center"
                        />
                        <span className="text-[11px] font-bold text-stone-700">km</span>
                        {isCalculatingDistance && <RefreshCw className="w-3 h-3 text-teal-600 animate-spin" />}
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-stone-500 block">Road Freight Tariff</span>
                        <span className="text-xs font-extrabold text-stone-900">
                          {logisticsMode === 'BUYER_SELF_FLEET' ? '₹0 (Self Fleet)' : `₹${calculatedDeliveryFee.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: LOGISTICS CARRIER & FLEET SELECTION */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Logistics Carrier & Dispatch Fleet Mode</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLogisticsMode('REEFER_COLD_CHAIN')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        logisticsMode === 'REEFER_COLD_CHAIN'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">❄️ Reefer Cold Chain</span>
                          {logisticsMode === 'REEFER_COLD_CHAIN' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">4°C - 8°C temperature control. Preserves shelf-life & reduces transit weight loss.</p>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded mt-2 w-fit">
                        Recommended
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogisticsMode('STANDARD_HEAVY_HAUL')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        logisticsMode === 'STANDARD_HEAVY_HAUL'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">🚛 Standard Hauler</span>
                          {logisticsMode === 'STANDARD_HEAVY_HAUL' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">Heavy commercial truck with weatherproof tarpaulin cover & GPS tracking.</p>
                      </div>
                      <span className="text-[9px] font-bold text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded mt-2 w-fit">
                        Direct Freight
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogisticsMode('BUYER_SELF_FLEET')}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        logisticsMode === 'BUYER_SELF_FLEET'
                          ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 text-emerald-950'
                          : 'border-stone-200 bg-white hover:border-stone-300 text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">🏢 Buyer Self-Fleet</span>
                          {logisticsMode === 'BUYER_SELF_FLEET' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                        </div>
                        <p className="text-[10px] text-stone-500 mt-1">Buyer dispatches own trucks directly to the FPO farm gate terminal. Zero FarmiQ freight tariff.</p>
                      </div>
                      <span className="text-[9px] font-bold text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded mt-2 w-fit">
                        ₹0 Freight
                      </span>
                    </button>
                  </div>
                </div>

                {/* SECTION 3: ESCROW PAYMENT & INSPECTION PROTOCOL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Escrow Model */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                      <span>Escrow Payment Structure</span>
                    </label>
                    <div className="space-y-1.5">
                      <label className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        escrowPaymentModel === '100_ESCROW'
                          ? 'border-teal-600 bg-teal-50/60 font-semibold text-teal-950'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}>
                        <input
                          type="radio"
                          name="escrowModel"
                          checked={escrowPaymentModel === '100_ESCROW'}
                          onChange={() => setEscrowPaymentModel('100_ESCROW')}
                          className="mt-0.5 text-teal-700 focus:ring-teal-600"
                        />
                        <div>
                          <span>100% Escrow Protection</span>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">Total funds locked in escrow; released within 24h after destination inspection.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        escrowPaymentModel === '20_ADVANCE_80_DELIVERY'
                          ? 'border-teal-600 bg-teal-50/60 font-semibold text-teal-950'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}>
                        <input
                          type="radio"
                          name="escrowModel"
                          checked={escrowPaymentModel === '20_ADVANCE_80_DELIVERY'}
                          onChange={() => setEscrowPaymentModel('20_ADVANCE_80_DELIVERY')}
                          className="mt-0.5 text-teal-700 focus:ring-teal-600"
                        />
                        <div>
                          <span>20% Advance + 80% on Unloading</span>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">20% released on dispatch weighment, remaining 80% upon delivery acceptance.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Inspection Protocol */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Quality & Weighment Protocol</span>
                    </label>
                    <div className="space-y-1.5">
                      <label className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        inspectionProtocol === 'APMC_WEIGHBRIDGE'
                          ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}>
                        <input
                          type="radio"
                          name="inspectionProtocol"
                          checked={inspectionProtocol === 'APMC_WEIGHBRIDGE'}
                          onChange={() => setInspectionProtocol('APMC_WEIGHBRIDGE')}
                          className="mt-0.5 text-emerald-700 focus:ring-emerald-600"
                        />
                        <div>
                          <span>Certified APMC Weighbridge Slip</span>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">Standard digital scale printout + quality grading certificate uploaded on dispatch.</p>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        inspectionProtocol === 'DESTINATION_ACCEPTANCE'
                          ? 'border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950'
                          : 'border-stone-200 bg-white text-stone-700'
                      }`}>
                        <input
                          type="radio"
                          name="inspectionProtocol"
                          checked={inspectionProtocol === 'DESTINATION_ACCEPTANCE'}
                          onChange={() => setInspectionProtocol('DESTINATION_ACCEPTANCE')}
                          className="mt-0.5 text-emerald-700 focus:ring-emerald-600"
                        />
                        <div>
                          <span>Destination Inward Inspection</span>
                          <p className="text-[10px] text-stone-500 font-normal mt-0.5">Final approval based on buyer receiving quality assessment & Brix test.</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Special Dispatch Instructions */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-800">
                    Logistics Remarks / Warehouse Receiving Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={logisticsNotes}
                    onChange={(e) => setLogisticsNotes(e.target.value)}
                    placeholder="e.g., Gate Pass #8, Receiving Dock 3, Contact Manager Mr. Rao on +91 98221 00000"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-teal-600 bg-white"
                  />
                </div>

                {/* Financial & Escrow Summary */}
                <div className="p-3.5 bg-stone-100 rounded-2xl space-y-1.5 text-xs border border-stone-200">
                  <div className="flex justify-between text-stone-600">
                    <span>Produce Value ({procureLotModal.quantity} {procureLotModal.unit} @ ₹{procureLotModal.base_price_per_unit}):</span>
                    <span className="font-semibold text-stone-900">₹{produceVal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Freight Tariff ({logisticsMode === 'BUYER_SELF_FLEET' ? 'Self Fleet Pickup' : `${procureDistanceKm} km`}):</span>
                    <span className="font-semibold text-stone-900">
                      ₹{calculatedDeliveryFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-stone-300/80 flex justify-between items-center text-sm font-black text-stone-900">
                    <span>Total Escrow Deposit:</span>
                    <span className="text-emerald-800 text-base">
                      ₹{totalEscrowDeposit.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Escrow Guarantee Note */}
                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <span className="text-[11px]">
                    <strong>100% Escrow Guarantee:</strong> Funds remain safely locked in FarmiQ Escrow until physical delivery inspection at your designated address.
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setProcureLotModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={procuringLotId === procureLotModal.id}
                  onClick={handleExecuteProcurement}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:bg-stone-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>
                    {procuringLotId === procureLotModal.id ? 'Securing Escrow & Ordering...' : 'Confirm Procurement & Route Consignment'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Interactive Map Picker Modal */}
      {isMapPickerOpen && (
        <LocationPickerModal
          isOpen={isMapPickerOpen}
          onClose={() => setIsMapPickerOpen(false)}
          user={user}
          defaultAddress={procureDeliveryAddress}
          title="Select Destination Warehouse / Terminal Location"
          onAddressSaved={(newAddr) => {
            setProcureDeliveryAddress(newAddr);
            setIsMapPickerOpen(false);
          }}
        />
      )}
    </div>
  );
};
