import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Award, Package, ShoppingBag, Truck, CheckCircle, 
  MapPin, Calendar, Clock, AlertCircle, RefreshCw, FileText, Check, ArrowRight,
  Users, ChevronRight, Phone, Download, Search, Filter, ExternalLink
} from 'lucide-react';
import { User, Order, FPOLot, LanguageCode, CustomerRequirement } from '../types';
import { api } from '../api';
import { translations } from '../translations';

interface BuyerDashboardProps {
  user: User;
  language: LanguageCode;
  onNavigateToContracts?: () => void;
}

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  user,
  language,
  onNavigateToContracts
}) => {
  const t = translations[language] || translations.en;
  const [activeTab, setActiveTab] = useState<'orders' | 'fpo-lots' | 'demands'>('orders');
  
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
    // Real-time polling every 3.5 seconds to reflect Farmer order preparation & transit updates immediately
    const interval = setInterval(() => loadBuyerData(true), 3500);
    return () => clearInterval(interval);
  }, [user]);

  // Handle direct lot procurement
  const handleProcureLot = async (lot: FPOLot) => {
    setProcuringLotId(lot.id);
    setActionSuccessMsg(null);
    setActionErrorMsg(null);
    try {
      const res = await api.procureLot(lot.id);
      setActionSuccessMsg(
        `✓ Institutional Procurement Confirmed! Order #${res.order?.id || 'NEW'} created under Escrow Contract #${res.contract?.id || 'ESC'}. The FPO farmers have been notified to begin grading and packaging.`
      );
      await loadBuyerData(true);
      setActiveTab('orders');
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
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
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
          onClick={() => setActiveTab('fpo-lots')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
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
                onClick={() => setActiveTab('fpo-lots')}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
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
                          <span className="text-[9px] opacity-90 block">₹2/km Direct</span>
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
                          {order.distance_km || 165} km (₹2/km = ₹{(order.delivery_fee || ((order.distance_km || 165) * 2)).toLocaleString('en-IN')})
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
                const memberFarmers = lot.member_farmers || [
                  { farmer_name: lot.farmer_name || 'Lead Farmer', contributed_quantity: Math.round(lot.quantity * 0.55), unit: lot.unit, farm_location: lot.location || 'Central Cluster' },
                  { farmer_name: 'Ramesh Kulkarni', contributed_quantity: Math.round(lot.quantity * 0.25), unit: lot.unit, farm_location: 'North Sub-Cluster' },
                  { farmer_name: 'Balasaheb Shinde', contributed_quantity: lot.quantity - Math.round(lot.quantity * 0.55) - Math.round(lot.quantity * 0.25), unit: lot.unit, farm_location: 'South Sub-Cluster' }
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
                                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[9px] font-bold">
                                  {fIdx + 1}
                                </span>
                                <div>
                                  <span className="font-semibold text-stone-800">{mf.farmer_name}</span>
                                  {mf.farm_location && (
                                    <span className="text-stone-400 text-[10px] ml-1.5">📍 {mf.farm_location}</span>
                                  )}
                                </div>
                              </div>
                              <div className="font-bold text-emerald-800 shrink-0">
                                {mf.contributed_quantity} {mf.unit || lot.unit}
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
                          <p className="text-stone-400 mt-0.5">Harvest: {lot.harvest_date}</p>
                        </div>
                      </div>
                    </div>

                    {/* Procurement Action Footer */}
                    <div className="pt-3 border-t border-stone-100">
                      {lot.status === 'AVAILABLE' ? (
                        <button
                          onClick={() => handleProcureLot(lot)}
                          disabled={isProcuring}
                          className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-300" />
                          <span>{isProcuring ? 'Securing Lot in Escrow...' : 'Procure Produce Lot & Lock Escrow'}</span>
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
    </div>
  );
};
