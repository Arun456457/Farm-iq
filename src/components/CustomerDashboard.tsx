import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ShoppingBag, MapPin, Leaf, TrendingUp, Clock, Plus, Minus, 
  Truck, CheckCircle, AlertCircle, QrCode, CreditCard, Wallet, ArrowRight, ShieldCheck,
  FilePlus, AlertTriangle, Send, MessageSquare, RefreshCw, Calendar, Navigation
} from 'lucide-react';
import { User, Product, Order, LanguageCode, CustomerRequirement, Dispute } from '../types';
import { api } from '../api';
import { translations } from '../translations';
import { LiveTrackingModal } from './LiveTrackingModal';
import { calculateAutomatedDistance, LatLng, AutomatedDistanceResult } from '../utils/distance';

interface CustomerDashboardProps {
  user: User;
  language: LanguageCode;
  activeSubTab?: 'marketplace' | 'customer-orders' | 'post-requirement' | 'disputes';
  onOrderPlaced?: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  language,
  activeSubTab = 'marketplace',
  onOrderPlaced,
}) => {
  const t = translations[language];
  const [subTab, setSubTab] = useState<'marketplace' | 'customer-orders' | 'post-requirement' | 'disputes'>(activeSubTab);
  
  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [organicOnly, setOrganicOnly] = useState(false);

  // Order Placement Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [deliveryAddress, setDeliveryAddress] = useState(user.delivery_address || user.location || '');
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(12);
  
  // Automated Distance & GPS States (replaces manual range slider)
  const [userLiveCoords, setUserLiveCoords] = useState<LatLng | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<AutomatedDistanceResult | null>(null);
  
  // Payment step
  const [paymentStep, setPaymentStep] = useState<'details' | 'payment' | 'receipt'>('details');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING' | 'COD'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Live Tracking Modal
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Requirement Form State
  const [reqCropName, setReqCropName] = useState('');
  const [reqQuantity, setReqQuantity] = useState<number | ''>('');
  const [reqUnit, setReqUnit] = useState('kg');
  const [reqPrice, setReqPrice] = useState<number | ''>('');
  const [reqNeededBy, setReqNeededBy] = useState('');
  const [reqAddress, setReqAddress] = useState(user.delivery_address || user.location || '');
  const [reqNotes, setReqNotes] = useState('');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccessMsg, setReqSuccessMsg] = useState<string | null>(null);

  // Dispute Form State
  const [dispOrderId, setDispOrderId] = useState<string>('');
  const [dispSubject, setDispSubject] = useState('');
  const [dispDescription, setDispDescription] = useState('');
  const [submittingDisp, setSubmittingDisp] = useState(false);
  const [dispSuccessMsg, setDispSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setSubTab(activeSubTab);
  }, [activeSubTab]);

  const loadData = async () => {
    try {
      const [prods, orders, reqs, disps] = await Promise.all([
        api.getProducts(),
        api.getCustomerOrders(),
        api.getRequirements(),
        api.getDisputes()
      ]);
      setProducts(prods);
      setMyOrders(orders);
      setRequirements(reqs);
      setDisputes(disps);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3500); // 3.5-second polling for live multi-device updates
    return () => clearInterval(interval);
  }, []);

  const handlePostRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqCropName.trim() || !reqQuantity) return;
    setSubmittingReq(true);
    setReqSuccessMsg(null);
    try {
      const res = await api.postRequirement({
        crop_name: reqCropName.trim(),
        required_quantity: reqQuantity,
        unit: reqUnit,
        expected_price: reqPrice,
        delivery_address: reqAddress,
        needed_by_date: reqNeededBy,
        notes: reqNotes.trim()
      });
      setReqSuccessMsg(`Requirement #${res.requirement.id} posted! Nearby farmers can now accept and fulfill this order.`);
      setReqCropName('');
      setReqNotes('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to post requirement');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleFileDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispSubject.trim() || !dispDescription.trim()) return;
    setSubmittingDisp(true);
    setDispSuccessMsg(null);
    try {
      const res = await api.fileDispute({
        order_id: dispOrderId ? Number(dispOrderId) : null,
        subject: dispSubject.trim(),
        description: dispDescription.trim()
      });
      setDispSuccessMsg(`Dispute case #${res.id} filed with Admin Escrow Desk. An officer will investigate.`);
      setDispSubject('');
      setDispDescription('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to file dispute');
    } finally {
      setSubmittingDisp(false);
    }
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farmer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesOrganic = !organicOnly || p.organic === 1;

    return matchesSearch && matchesCategory && matchesOrganic;
  });

  // Automatically recalculate road distance whenever product, delivery address, or GPS coordinates change
  useEffect(() => {
    if (selectedProduct) {
      const farmOrigin = selectedProduct.location || (selectedProduct as any).farmer_location || 'Maharashtra Farm Belt';
      const result = calculateAutomatedDistance(farmOrigin, deliveryAddress, userLiveCoords);
      setDeliveryDistanceKm(result.distanceKm);
      setDistanceInfo(result);
    }
  }, [selectedProduct, deliveryAddress, userLiveCoords]);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsStatusMsg('Geolocation is not supported by your browser');
      return;
    }
    setDetectingGps(true);
    setGpsStatusMsg('Detecting precise device coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLiveCoords(coords);
        setDetectingGps(false);
        setGpsStatusMsg(`✓ GPS Locked (${coords.lat.toFixed(3)}°N, ${coords.lng.toFixed(3)}°E)`);
      },
      (err) => {
        console.warn('GPS location request error:', err);
        setDetectingGps(false);
        setGpsStatusMsg('GPS permission denied. Using automated road-corridor routing.');
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  // Calculate pricing
  const unitPrice = selectedProduct?.price || 0;
  const productTotal = Math.round(orderQuantity * unitPrice);
  const deliveryCharge = Math.round(deliveryDistanceKm * 2.0); // Exactly ₹2 per km
  const grandTotal = productTotal + deliveryCharge;

  const handleOpenOrder = (prod: Product) => {
    if (prod.quantity <= 0) return;
    setSelectedProduct(prod);
    setOrderQuantity(Math.min(5, prod.quantity));
    setPaymentStep('details');
    setGpsStatusMsg(null);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (orderQuantity <= 0 || orderQuantity > selectedProduct.quantity) {
      alert(`Please select a valid quantity between 1 and ${selectedProduct.quantity}`);
      return;
    }
    setPaymentStep('payment');
  };

  const handleConfirmOrderAndPay = async () => {
    if (!selectedProduct) return;
    setPlacingOrder(true);
    try {
      const res: any = await api.createOrder({
        product_id: selectedProduct.id,
        quantity: orderQuantity,
        delivery_address: deliveryAddress,
        distance_km: deliveryDistanceKm,
        payment_method: selectedPaymentMethod,
      });

      const orderData = res && res.order ? res.order : res;
      const confirmedOrder: Order = {
        ...orderData,
        product_name: orderData.product_name || selectedProduct.name,
        quantity: orderData.quantity || orderQuantity,
        unit: orderData.unit || selectedProduct.unit,
        grand_total: orderData.grand_total || grandTotal,
        delivery_address: orderData.delivery_address || deliveryAddress,
        farmer_name: orderData.farmer_name || selectedProduct.farmer_name,
        transaction_id: orderData.transaction_id || `UPI-${Math.floor(100000 + Math.random() * 900000)}`
      };

      setLastPlacedOrder(confirmedOrder);
      setPaymentStep('receipt');
      loadData();
      if (onOrderPlaced) onOrderPlaced();
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setPaymentStep('details');
    setLastPlacedOrder(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sub-tabs: Marketplace, Orders, Post Requirement, Disputes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 mb-6 gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSubTab('marketplace')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'marketplace' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.marketplace} ({filteredProducts.length})</span>
          </button>
          <button
            onClick={() => setSubTab('customer-orders')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'customer-orders' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{t.customerOrders} ({myOrders.length})</span>
          </button>
          <button
            onClick={() => setSubTab('post-requirement')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'post-requirement' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FilePlus className="w-4 h-4 text-emerald-600" />
            <span>Post Requirement / Demand ({requirements.filter(r => r.customer_id === user.id).length})</span>
          </button>
          <button
            onClick={() => setSubTab('disputes')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'disputes' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Disputes & Grievances ({disputes.length})</span>
          </button>
        </div>

        {/* Delivery banner */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
          <Truck className="w-3.5 h-3.5" />
          <span>Direct Farm Dispatch: Fixed ₹2 / km delivery charge</span>
        </div>
      </div>

      {/* TAB 1: MARKETPLACE */}
      {subTab === 'marketplace' && (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Categories & Organic Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
              {['All', 'Vegetables', 'Fruits', 'Grains', 'Spices'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <div className="flex items-center gap-1.5 pl-3 border-l border-stone-200">
                <input
                  type="checkbox"
                  id="filter-organic"
                  checked={organicOnly}
                  onChange={(e) => setOrganicOnly(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-teal-600 border-stone-300 focus:ring-teal-500"
                />
                <label htmlFor="filter-organic" className="text-xs font-semibold text-stone-700 cursor-pointer flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-600" /> {t.organicOnly}
                </label>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto my-6">
              <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No produce matches your filter.</h3>
              <p className="text-xs text-stone-500 mt-1">Try searching for other crops or clear your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.quantity <= 0;
                const mandiDiff = (p.price || 0) - (p.market_price || 0);
                const isBelowMandi = mandiDiff < 0;

                return (
                  <div 
                    key={p.id} 
                    className={`bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between ${
                      isOutOfStock ? 'opacity-70 grayscale-30' : ''
                    }`}
                  >
                    <div>
                      {/* Image */}
                      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
                        <img 
                          src={p.image_url} 
                          alt={p.name} 
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="text-[10px] font-bold bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full">
                            {p.category}
                          </span>
                          {p.organic === 1 && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Leaf className="w-3 h-3" /> Organic
                            </span>
                          )}
                        </div>

                        {/* Stock status badge */}
                        <div className="absolute top-3 right-3">
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold bg-red-600 text-white px-2.5 py-1 rounded-full">
                              {t.outOfStock}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-white/95 text-stone-800 px-2.5 py-1 rounded-full shadow-xs">
                              {p.quantity} {p.unit} left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
                          <div className="text-right">
                            <span className="text-xl font-bold text-teal-800">₹{p.price}</span>
                            <span className="text-xs text-stone-500">/{p.unit}</span>
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 mb-3 font-medium">
                          Farmer: <span className="text-stone-900 font-bold">{p.farmer_name}</span> ({p.farm_name || 'Direct Farm'})
                        </p>

                        {/* MANDI COMPARISON BESIDE FARMER PRICE (Requested feature) */}
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 mb-3 text-xs">
                          <div className="flex items-center justify-between font-semibold text-amber-950">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                              Current Mandi Benchmark:
                            </span>
                            <span className="font-bold text-amber-900">₹{p.market_price || 35}/{p.unit}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-600 mt-0.5">
                            <span>Comparison:</span>
                            <span className={`font-bold ${isBelowMandi ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {isBelowMandi ? `Save ₹${Math.abs(mandiDiff)}/kg vs Mandi!` : `Farmer Direct Fresh Rate`}
                            </span>
                          </div>
                        </div>

                        {/* Shelf-Life & Days Stored Display */}
                        <div className="p-2 rounded-lg bg-blue-50/60 border border-blue-100 mb-2 text-[11px] text-blue-900 flex items-center justify-between">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-blue-600" /> Stored: {p.days_since_harvest ?? 1} day(s)
                          </span>
                          <span className="font-semibold text-blue-700">
                            ~{p.remaining_shelf_life ?? 12} days fresh
                          </span>
                        </div>

                        {/* HARVEST DATE (Explicit User Requested Feature) */}
                        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/90 mb-3 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-950 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Harvest Date:</span>
                            <span className="font-bold text-emerald-900">
                              {p.harvest_date ? new Date(p.harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fresh Daily Harvest'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                            {p.days_since_harvest === 0 ? 'Today' : `${p.days_since_harvest || 1}d ago`}
                          </span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-stone-500 mb-4">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{p.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Action Button */}
                    <div className="p-4 pt-0">
                      <button
                        onClick={() => handleOpenOrder(p)}
                        disabled={isOutOfStock}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                          isOutOfStock
                            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                            : 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-200 cursor-pointer'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{isOutOfStock ? t.outOfStock : t.buyNow}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS */}
      {subTab === 'customer-orders' && (
        <div>
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto my-6">
              <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">You haven't placed any orders yet.</h3>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                Explore the marketplace to buy fresh, organic produce straight from local farmers.
              </p>
              <button
                onClick={() => setSubTab('marketplace')}
                className="px-5 py-2.5 bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-teal-800 transition"
              >
                Go to Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {myOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">Order #{o.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        o.status === 'TRANSIT' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                        o.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                        o.status === 'ACCEPTED' ? 'bg-teal-100 text-teal-800' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {o.status}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900">
                      {o.quantity} {o.unit} of {o.product_name}
                    </h4>

                    <p className="text-xs text-stone-600">
                      Farmer: <strong className="text-stone-800">{o.farmer_name}</strong> • Direct Transport: {o.distance_km} km @ ₹2/km
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <span>Produce: ₹{o.product_total}</span>
                      <span>•</span>
                      <span>Delivery Fee: ₹{o.delivery_charge}</span>
                      <span>•</span>
                      <span>Grand Total: <strong className="text-teal-800 font-bold text-sm">₹{o.grand_total}</strong></span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                        Paid via {o.payment_method}
                      </span>
                    </div>
                  </div>

                  {/* Live Tracking Button (Requested feature) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setTrackingOrder(o)}
                      className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{t.liveTracking}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: POST REQUIREMENT / DEMAND */}
      {subTab === 'post-requirement' && (
        <div className="space-y-6 text-left">
          {reqSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reqSuccessMsg}</span>
              </div>
              <button onClick={() => setReqSuccessMsg(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
          )}

          {/* Form & Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create requirement form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Post Crop Requirement</h3>
                  <p className="text-[11px] text-stone-500">Farmers in your area will see and accept this demand.</p>
                </div>
              </div>

              <form onSubmit={handlePostRequirement} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Produce / Crop Needed *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Nashik Red Onion, Alphonso Mango, Wheat"
                    value={reqCropName}
                    onChange={(e) => setReqCropName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-teal-600 bg-stone-50/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={reqQuantity}
                      onChange={(e) => setReqQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-teal-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Unit</label>
                    <select
                      value={reqUnit}
                      onChange={(e) => setReqUnit(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-teal-600 font-semibold"
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">quintal (100 kg)</option>
                      <option value="tonne">tonne (1000 kg)</option>
                      <option value="crates">crates</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Target / Expected Price (₹ per {reqUnit}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={reqPrice}
                    onChange={(e) => setReqPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-teal-600"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Estimated total: ₹{(reqQuantity * reqPrice).toLocaleString('en-IN')}
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Required By Date *</label>
                  <input
                    type="date"
                    required
                    value={reqNeededBy}
                    onChange={(e) => setReqNeededBy(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Delivery Destination / Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={reqAddress}
                    onChange={(e) => setReqAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Quality Specifications / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Organic preferred, medium size, dry skin"
                    value={reqNotes}
                    onChange={(e) => setReqNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-teal-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReq}
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReq ? 'Broadcasting...' : 'Broadcast Requirement to Farmers'}</span>
                </button>
              </form>
            </div>

            {/* List of my posted requirements */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Your Posted Requirements</h3>
                  <p className="text-xs text-stone-500">Live demand feed monitored by verified agricultural producers</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {requirements.filter(r => r.customer_id === user.id).length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
                  <FilePlus className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-800">No active requirements posted yet.</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Can't find what you need in the marketplace? Post your specific crop requirement above and local farmers will accept your order!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requirements.filter(r => r.customer_id === user.id).map((req) => (
                    <div key={req.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-800">#{req.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'FULFILLED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status === 'OPEN' ? 'OPEN - Awaiting Farmer Acceptance' : `ACCEPTED by ${req.accepted_by_farmer_name || 'Farmer'}`}
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-stone-900">
                          {req.required_quantity} {req.unit} of {req.crop_name}
                        </h4>

                        <p className="text-xs text-stone-600">
                          Target Rate: <strong className="text-teal-800">₹{req.expected_price} / {req.unit}</strong> (Est. Total: ₹{(req.required_quantity * req.expected_price).toLocaleString('en-IN')})
                        </p>

                        <div className="text-xs text-stone-500 space-y-0.5">
                          <p>📍 Destination: <span className="text-stone-700">{req.delivery_address}</span></p>
                          <p>📅 Delivery needed by: <span className="text-stone-700 font-semibold">{req.needed_by_date}</span></p>
                          {req.notes && <p>📝 Notes: <span className="italic">{req.notes}</span></p>}
                        </div>

                        {req.status === 'ACCEPTED' && (
                          <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                            <p className="font-bold">✓ Farmer Assigned: {req.accepted_by_farmer_name}</p>
                            <p className="text-[11px] text-emerald-700">Contact: {req.accepted_by_farmer_phone} • Order has been generated in your "My Orders" tab with live tracking!</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES & GRIEVANCES */}
      {subTab === 'disputes' && (
        <div className="space-y-6 text-left">
          {dispSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{dispSuccessMsg}</span>
              </div>
              <button onClick={() => setDispSuccessMsg(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File dispute form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Report Dispute / Grievance</h3>
                  <p className="text-[11px] text-stone-500">Neutral Admin Escrow resolution within 24 hours</p>
                </div>
              </div>

              <form onSubmit={handleFileDispute} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Related Order</label>
                  <select
                    value={dispOrderId}
                    onChange={(e) => setDispOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-teal-600 font-medium"
                  >
                    <option value="">Select an order (or General inquiry)</option>
                    {myOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} - {o.product_name} (₹{o.grand_total})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Grievance Category / Subject *</label>
                  <select
                    value={dispSubject}
                    onChange={(e) => setDispSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-teal-600 font-medium mb-1.5"
                  >
                    <option value="">Select subject category</option>
                    <option value="Damaged Produce in Transit">Damaged Produce in Transit</option>
                    <option value="Quality Substandard (Non-Grade A)">Quality Substandard (Non-Grade A)</option>
                    <option value="Weight / Quantity Shortage">Weight / Quantity Shortage</option>
                    <option value="Driver / Logistics Delay">Driver / Logistics Delay</option>
                    <option value="Escrow Refund Request">Escrow Refund Request</option>
                    <option value="Other Issue">Other Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Detailed Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about the issue, produce condition, or discrepancy for admin inspection..."
                    value={dispDescription}
                    onChange={(e) => setDispDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-teal-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingDisp}
                  className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingDisp ? 'Submitting...' : 'Submit to Admin Escrow Desk'}</span>
                </button>
              </form>
            </div>

            {/* List of filed disputes */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Your Grievance History</h3>
                  <p className="text-xs text-stone-500">Status of filed claims and official administrator resolutions</p>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {disputes.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
                  <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-800">No disputes filed.</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    All your orders are operating normally with standard FarmiQ escrow protections.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.map((d) => (
                    <div key={d.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-800">Case #{d.id}</span>
                          {d.order_id && (
                            <span className="text-xs text-stone-500 font-medium">Order #{d.order_id}</span>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                          d.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {d.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-stone-900">{d.subject}</h4>
                      <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-100 leading-relaxed">
                        {d.description}
                      </p>

                      {d.status === 'RESOLVED' && d.resolution && (
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 mt-2">
                          <strong className="block mb-0.5 font-bold">Admin Resolution:</strong>
                          <span>{d.resolution}</span>
                        </div>
                      )}

                      <div className="text-[10px] text-stone-400 pt-1">
                        Reported on {new Date(d.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-800 to-emerald-700 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Outfit']">
                  {paymentStep === 'details' && 'Configure Direct Order'}
                  {paymentStep === 'payment' && 'Select Payment Option'}
                  {paymentStep === 'receipt' && 'Order Confirmed!'}
                </h2>
                <p className="text-xs text-teal-100 mt-0.5">
                  Direct from {selectedProduct.farmer_name}'s Farm
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: QUANTITY & ADDRESS */}
            {paymentStep === 'details' && (
              <form onSubmit={handleProceedToPayment} className="p-6 space-y-4">
                {/* Product snippet */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <img src={selectedProduct.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-stone-900">{selectedProduct.name}</h4>
                    <p className="text-xs text-stone-500">
                      Farmer Price: <strong className="text-teal-800">₹{selectedProduct.price}/{selectedProduct.unit}</strong> • Available: {selectedProduct.quantity} {selectedProduct.unit}
                    </p>
                  </div>
                </div>

                {/* HARVEST DATE IN ORDER MODAL */}
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Harvest Date: <strong className="font-bold text-emerald-900">{selectedProduct.harvest_date ? new Date(selectedProduct.harvest_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fresh Daily Harvest'}</strong></span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    {selectedProduct.days_since_harvest === 0 ? 'Fresh Today' : `${selectedProduct.days_since_harvest || 1}d ago`}
                  </span>
                </div>

                {/* Interactive Quantity Selector [-] [input] [+] (Mandatory requirement) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Select Quantity ({selectedProduct.unit}) *
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(prev => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-base transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedProduct.quantity}
                      value={orderQuantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val <= selectedProduct.quantity) {
                          setOrderQuantity(Math.max(1, val));
                        }
                      }}
                      className="w-24 text-center py-2 text-base font-bold border border-stone-300 rounded-xl outline-none focus:border-teal-600"
                    />
                    <button
                      type="button"
                      onClick={() => setOrderQuantity(prev => Math.min(selectedProduct.quantity, prev + 1))}
                      className="w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-base transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-stone-500">
                      (Max available: {selectedProduct.quantity} {selectedProduct.unit})
                    </span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-teal-600"
                  />
                </div>

                {/* Automated Road Logistics & Distance (Calculated automatically, not manually) */}
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-50 border border-emerald-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Navigation className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-950">
                        Automated Road Logistics Distance
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Auto-Calculated
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1 text-stone-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-stone-500">
                        <MapPin className="w-3 h-3 text-emerald-600 shrink-0" /> Farm Origin:
                      </span>
                      <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                        {selectedProduct.location || (selectedProduct as any).farmer_location || 'Maharashtra Agri Belt'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-stone-500">
                        <Truck className="w-3 h-3 text-teal-600 shrink-0" /> Delivery To:
                      </span>
                      <span className="font-semibold text-stone-800 truncate max-w-[180px]">
                        {deliveryAddress || 'Your Entered Address'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/70 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-stone-500 block">Computed Route Distance</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-emerald-900">{deliveryDistanceKm}</span>
                        <span className="text-xs font-bold text-emerald-700">km</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 block">Logistics Tariff (@ ₹2/km)</span>
                      <span className="text-sm font-extrabold text-stone-900">₹{deliveryCharge}</span>
                    </div>
                  </div>

                  {/* Optional 1-Click GPS Precise Lock */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={detectingGps}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-60 shadow-xs"
                    >
                      <Navigation className={`w-3 h-3 ${detectingGps ? 'animate-spin' : 'text-emerald-700'}`} />
                      <span>{detectingGps ? 'Acquiring GPS Satellite Lock...' : '📍 Auto-Detect Device GPS Location'}</span>
                    </button>
                    {gpsStatusMsg && (
                      <p className="text-[10px] text-emerald-700 font-medium mt-1 text-center">
                        {gpsStatusMsg}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price Breakdown (Requested feature) */}
                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-700">
                    <span>Produce Total ({orderQuantity} {selectedProduct.unit} × ₹{unitPrice}):</span>
                    <span className="font-semibold">₹{productTotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Delivery Charge ({deliveryDistanceKm} km × ₹2.00):</span>
                    <span className="font-semibold">₹{deliveryCharge}</span>
                  </div>
                  <div className="pt-2 border-t border-teal-200 flex justify-between text-stone-900 font-bold text-sm">
                    <span>Grand Total:</span>
                    <span className="text-teal-900 text-base">₹{grandTotal}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-200 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: PAYMENT OPTIONS (Requested: 'when the customer click take an order then i want payment transaction option also') */}
            {paymentStep === 'payment' && (
              <div className="p-6 space-y-4">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                  <span className="text-stone-600">Total Payable:</span>
                  <span className="text-lg font-bold text-teal-800">₹{grandTotal}</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-700">Choose Payment Method</label>
                  
                  {/* UPI Option */}
                  <div 
                    onClick={() => setSelectedPaymentMethod('UPI')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                      selectedPaymentMethod === 'UPI' ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-teal-700 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">Instant UPI (GPay, PhonePe, Paytm, BHIM)</p>
                      <p className="text-[11px] text-stone-500">Zero surcharge direct bank transfer</p>
                    </div>
                  </div>

                  {/* Cards Option */}
                  <div 
                    onClick={() => setSelectedPaymentMethod('CARD')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                      selectedPaymentMethod === 'CARD' ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-teal-700 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">Debit / Credit Card</p>
                      <p className="text-[11px] text-stone-500">Visa, Mastercard, RuPay</p>
                    </div>
                  </div>

                  {/* Net Banking Option */}
                  <div 
                    onClick={() => setSelectedPaymentMethod('NETBANKING')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                      selectedPaymentMethod === 'NETBANKING' ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-teal-700 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">Net Banking</p>
                      <p className="text-[11px] text-stone-500">All Indian Banks (SBI, HDFC, ICICI, etc.)</p>
                    </div>
                  </div>

                  {/* COD Option */}
                  <div 
                    onClick={() => setSelectedPaymentMethod('COD')}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                      selectedPaymentMethod === 'COD' ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-teal-700 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-900">Pay upon Farm Gate Delivery</p>
                      <p className="text-[11px] text-stone-500">Inspect fresh produce then pay driver via UPI / Cash</p>
                    </div>
                  </div>
                </div>

                {/* If UPI, show VPA input & simulated QR Code */}
                {selectedPaymentMethod === 'UPI' && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
                    <label className="block font-bold text-emerald-950">Enter Your UPI VPA ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. yourname@oksbi"
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg outline-none"
                    />
                    <p className="text-[10px] text-emerald-700">
                      🔒 Secured through Mandi Direct Escrow. Farmer is credited upon verified delivery.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('details')}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={placingOrder}
                    onClick={handleConfirmOrderAndPay}
                    className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-200 transition disabled:bg-stone-300 cursor-pointer"
                  >
                    {placingOrder ? 'Confirming Transaction...' : `Pay ₹${grandTotal} & Place Order`}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONFIRMATION RECEIPT */}
            {paymentStep === 'receipt' && (
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">Payment & Order Successful!</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Your order #{lastPlacedOrder?.id || 'CONFIRMED'} has been transmitted to farmer {lastPlacedOrder?.farmer_name || selectedProduct?.farmer_name || 'Farmer'}.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-left space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Transaction Reference:</span>
                    <span className="font-mono font-bold text-stone-800 bg-stone-200/80 px-2 py-0.5 rounded text-[11px]">
                      {lastPlacedOrder?.transaction_id || `UPI/${lastPlacedOrder?.id || 101}9382`}
                    </span>
                  </div>

                  {/* ITEM NAME - prominently visible */}
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                      Item Name & Quantity
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900 text-sm">
                        {lastPlacedOrder?.product_name || selectedProduct?.name || 'Fresh Farm Produce'}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {lastPlacedOrder?.quantity || orderQuantity} {lastPlacedOrder?.unit || selectedProduct?.unit || 'kg'}
                      </span>
                    </div>
                  </div>

                  {/* TOTAL PAID - prominently visible */}
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                        Total Paid (Inclusive of Delivery)
                      </span>
                      <span className="text-[10px] text-emerald-700">Via {selectedPaymentMethod} • Payment Verified</span>
                    </div>
                    <span className="text-xl font-extrabold text-emerald-800">
                      ₹{lastPlacedOrder?.grand_total || grandTotal}
                    </span>
                  </div>

                  {/* DELIVERY ADDRESS - prominently visible without truncation */}
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" /> Delivery Address
                    </span>
                    <p className="text-xs font-medium text-stone-800 break-words leading-relaxed">
                      {lastPlacedOrder?.delivery_address || deliveryAddress || user.delivery_address || user.location || 'Pune Delivery Address'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      const ord = lastPlacedOrder;
                      handleCloseModal();
                      if (ord) setTrackingOrder(ord);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Track Live Delivery
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                  >
                    Back to Marketplace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE TRACKING MODAL */}
      <LiveTrackingModal
        order={trackingOrder}
        onClose={() => setTrackingOrder(null)}
      />
    </div>
  );
};
