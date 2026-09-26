import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Filter, ShoppingBag, MapPin, Leaf, TrendingUp, Clock, Plus, Minus, 
  Truck, CheckCircle, CheckCircle2, AlertCircle, QrCode, CreditCard, Wallet, ArrowRight, ShieldCheck,
  FilePlus, AlertTriangle, Send, MessageSquare, RefreshCw, Calendar, Navigation, Sparkles,
  FileText, IndianRupee, Check, ExternalLink, Compass, Phone, Banknote, XCircle
} from 'lucide-react';
import { User, Product, Order, LanguageCode, CustomerRequirement, Dispute, Invoice } from '../types';
import { api, setStoredUser } from '../api';
import { translations, tr, translateCrop, translateUnit, translateCategory } from '../translations';
import { LiveTrackingModal } from './LiveTrackingModal';
import { calculateAutomatedDistance, calculateAccurateRoadDistanceAsync, calculateDeliveryFee, LatLng, AutomatedDistanceResult, getGoogleMapsDirectionsUrl } from '../utils/distance';
import { InvoiceModal } from './InvoiceModal';
import { UPIPaymentModal } from './UPIPaymentModal';
import { LocationPickerModal } from './LocationPickerModal';

interface CustomerDashboardProps {
  user: User;
  language: LanguageCode;
  activeSubTab?: 'marketplace' | 'customer-orders' | 'post-requirement' | 'disputes';
  onOrderPlaced?: () => void;
  onSubTabChange?: (tab: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  user,
  language,
  activeSubTab = 'marketplace',
  onOrderPlaced,
  onSubTabChange,
}) => {
  const t = translations[language] || translations.en;
  const [subTab, setSubTab] = useState<'marketplace' | 'customer-orders' | 'post-requirement' | 'disputes'>(() => {
    try {
      const saved = sessionStorage.getItem('farmiq_customer_subtab');
      if (saved && ['marketplace', 'customer-orders', 'post-requirement', 'disputes'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return activeSubTab;
  });

  const handleSwitchSubTab = (tab: 'marketplace' | 'customer-orders' | 'post-requirement' | 'disputes') => {
    setSubTab(tab);
    try {
      sessionStorage.setItem('farmiq_customer_subtab', tab);
    } catch {}
    if (onSubTabChange) onSubTabChange(tab);
  };
  
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
  const [customerPhone, setCustomerPhone] = useState(user.phone || '');
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState<number>(12);
  
  // Automated Distance & GPS States (replaces manual range slider)
  const [userLiveCoords, setUserLiveCoords] = useState<LatLng | null>(
    user.latitude && user.longitude ? { lat: user.latitude, lng: user.longitude } : null
  );
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Modals for Invoices, UPI Payment, and Map Location Picker
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const [selectedPayOrder, setSelectedPayOrder] = useState<Order | null>(null);
  const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);

  const [isAddressMapOpen, setIsAddressMapOpen] = useState(false);
  const [distanceInfo, setDistanceInfo] = useState<AutomatedDistanceResult | null>(null);
  
  // Payment step
  const [paymentStep, setPaymentStep] = useState<'details' | 'payment' | 'receipt'>('details');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'UPI' | 'COD'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [rejectedCodAlertOrder, setRejectedCodAlertOrder] = useState<Order | null>(null);
  const [agentAssignedPopupOrder, setAgentAssignedPopupOrder] = useState<{
    order: Order;
    driver_name: string;
    driver_phone: string;
    vehicle_number?: string;
  } | null>(null);

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

  const isInitialMount = useRef(true);
  const hasProcessedUrlParams = useRef(false);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      try {
        const saved = sessionStorage.getItem('farmiq_customer_subtab');
        if (saved && saved !== activeSubTab && onSubTabChange) {
          onSubTabChange(saved);
        }
      } catch {}
      return;
    }
    if (activeSubTab && activeSubTab !== subTab) {
      setSubTab(activeSubTab);
      try {
        sessionStorage.setItem('farmiq_customer_subtab', activeSubTab);
      } catch {}
    }
  }, [activeSubTab]);

  // Sync state whenever user profile is edited and saved
  useEffect(() => {
    if (user.delivery_address || user.location) {
      setDeliveryAddress(user.delivery_address || user.location || '');
    }
    if (user.phone) {
      setCustomerPhone(user.phone);
    }
    if (user.latitude && user.longitude) {
      setUserLiveCoords({ lat: user.latitude, lng: user.longitude });
    }
  }, [user]);

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

      // Detect any unacknowledged Cash on Delivery rejection to popup notification
      const codReject = (orders || []).find((o: Order) =>
        o.status === 'REJECTED' &&
        (o.payment_method === 'Cash on Delivery' || o.payment_status === 'REJECTED_NO_PAYMENT') &&
        !sessionStorage.getItem('dismissed_cod_reject_' + o.id)
      );
      if (codReject) {
        setRejectedCodAlertOrder(codReject);
      }

      // Detect any unacknowledged Delivery Agent Assignment to show popup notification
      const newlyAssigned = (orders || []).find((o: Order) =>
        Boolean(
          o.delivery_agent_assigned &&
          o.driver_name &&
          o.driver_name !== o.farmer_name &&
          !sessionStorage.getItem(`dismissed_agent_assigned_${o.id}_${o.driver_name}`)
        )
      );
      if (newlyAssigned) {
        setAgentAssignedPopupOrder({
          order: newlyAssigned,
          driver_name: newlyAssigned.driver_name!,
          driver_phone: newlyAssigned.driver_phone || '+91 98210 00000',
          vehicle_number: newlyAssigned.vehicle_number
        });
      }

      // Check if user came via a direct WhatsApp action link (track, pay, invoice)
      if (!hasProcessedUrlParams.current) {
        hasProcessedUrlParams.current = true;
        try {
          const p = new URLSearchParams(window.location.search);
          const tId = p.get('track');
          const pyId = p.get('pay');
          const invId = p.get('invoice');
          if (tId) {
            const found = orders.find(o => o.id === Number(tId));
            if (found) {
              setSubTab('customer-orders');
              setTrackingOrder(found);
            }
          } else if (pyId) {
            const found = orders.find(o => o.id === Number(pyId));
            if (found) {
              setSubTab('customer-orders');
              handleOpenUPIModal(found);
            }
          } else if (invId) {
            const found = orders.find(o => o.id === Number(invId));
            if (found) {
              setSubTab('customer-orders');
              handleOpenInvoice(found);
            }
          }
        } catch {}
      }
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
    let isCurrent = true;
    if (selectedProduct) {
      const farmOrigin = selectedProduct.location || (selectedProduct as any).farmer_location || 'Lasalgaon, Nashik';
      const farmCoords = (selectedProduct as any).farmer_latitude && (selectedProduct as any).farmer_longitude
        ? { lat: (selectedProduct as any).farmer_latitude, lng: (selectedProduct as any).farmer_longitude }
        : null;

      // 1. Instant synchronous distance estimate
      const syncResult = calculateAutomatedDistance(farmOrigin, deliveryAddress, userLiveCoords, farmCoords);
      setDeliveryDistanceKm(syncResult.distanceKm);
      setDistanceInfo(syncResult);

      // 2. High-precision real-world road graph calculation (matching Google Maps driving distance)
      calculateAccurateRoadDistanceAsync(farmOrigin, deliveryAddress, farmCoords, userLiveCoords).then((accurateResult) => {
        if (isCurrent) {
          setDeliveryDistanceKm(accurateResult.distanceKm);
          setDistanceInfo(accurateResult);
        }
      });
    }
    return () => {
      isCurrent = false;
    };
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
  const deliveryCharge = calculateDeliveryFee(deliveryDistanceKm);
  const grandTotal = productTotal + deliveryCharge;

  const handleOpenOrder = (prod: Product) => {
    if (prod.quantity <= 0) return;
    setSelectedProduct(prod);
    setOrderQuantity(Math.min(5, prod.quantity));
    setPaymentStep('details');
    setGpsStatusMsg(null);
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (orderQuantity <= 0 || orderQuantity > selectedProduct.quantity) {
      alert(`Please select a valid quantity between 1 and ${selectedProduct.quantity}`);
      return;
    }
    setPlacingOrder(true);
    try {
      const isCodChoice = selectedPaymentMethod === 'COD' || (selectedPaymentMethod as string) === 'Cash on Delivery';
      const res: any = await api.createOrder({
        product_id: selectedProduct.id,
        quantity: orderQuantity,
        delivery_address: deliveryAddress,
        customer_phone: customerPhone.trim(),
        distance_km: deliveryDistanceKm,
        payment_method: isCodChoice ? 'Cash on Delivery' : 'UPI',
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
        status: orderData.status || 'ORDERED',
        payment_method: isCodChoice ? 'Cash on Delivery' : 'UPI',
        payment_status: isCodChoice ? 'CASH_ON_DELIVERY_PENDING_APPROVAL' : 'UNPAID',
        farmer_whatsapp_url: orderData.farmer_whatsapp_url || (res && res.farmer_whatsapp_url) || '',
        farmer_whatsapp_msg: orderData.farmer_whatsapp_msg || (res && res.farmer_whatsapp_msg) || '',
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

  const handleOpenInvoice = async (order: Order) => {
    try {
      const inv = await api.getOrderInvoice(order.id);
      setSelectedInvoice(inv);
      setSelectedInvoiceOrder(order);
      setIsInvoiceModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to load invoice');
    }
  };

  const handleOpenUPIModal = (order: Order) => {
    setSelectedPayOrder(order);
    setIsUPIModalOpen(true);
  };

  const handleConfirmCOD = async (orderId: number) => {
    try {
      const res = await api.payOrderCOD(orderId);
      setMyOrders(prev => prev.map(o => o.id === orderId ? res.order : o));
      try {
        const bc = new BroadcastChannel('farmiq_bus');
        bc.postMessage({ type: 'ORDER_PAID', orderId });
        bc.close();
      } catch {}
      window.dispatchEvent(new CustomEvent('farmiq_state_change', { detail: { type: 'ORDER_PAID', orderId } }));
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to select Cash on Delivery');
    }
  };

  const handlePaymentSuccess = (updatedOrder: Order) => {
    setMyOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    loadData();
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
            onClick={() => handleSwitchSubTab('marketplace')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'marketplace' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.marketplace} ({filteredProducts.length})</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('customer-orders')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'customer-orders' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{t.customerOrders} ({myOrders.length})</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('post-requirement')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'post-requirement' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FilePlus className="w-4 h-4 text-emerald-600" />
            <span>{tr('Post Requirement / Demand', language)} ({requirements.filter(r => r.customer_id === user.id).length})</span>
          </button>
          <button
            onClick={() => handleSwitchSubTab('disputes')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'disputes' ? 'border-teal-700 text-teal-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{tr('Disputes & Grievances', language)} ({disputes.length})</span>
          </button>
        </div>

        {/* Delivery banner */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
          <Truck className="w-3.5 h-3.5" />
          <span>{tr('Direct Farm Dispatch: Low-Cost Doorstep Delivery', language)}</span>
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
                  {cat === 'All' ? tr('All Categories', language) : tr(cat, language)}
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
                            {translateCategory(p.category, language)}
                          </span>
                          {p.organic === 1 && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                              <Leaf className="w-3 h-3" /> {tr('Organic Only', language)}
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
                              {p.quantity} {translateUnit(p.unit, language)} {tr('Available Stock', language)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-900">{translateCrop(p.name, language)}</h3>
                          <div className="text-right">
                            <span className="text-xl font-bold text-teal-800">₹{p.price}</span>
                            <span className="text-xs text-stone-500">/{translateUnit(p.unit, language)}</span>
                          </div>
                        </div>

                        <p className="text-xs text-stone-600 mb-3 font-medium">
                          {tr('Farmer', language)}: <span className="text-stone-900 font-bold">{p.farmer_name}</span> ({p.farm_name || 'Direct Farm'})
                        </p>

                        {/* MANDI COMPARISON BESIDE FARMER PRICE (Requested feature) */}
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/90 mb-3 text-xs">
                          <div className="flex items-center justify-between font-semibold text-amber-950">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                              {tr('Market Benchmark', language)}:
                            </span>
                            <span className="font-bold text-amber-900">₹{p.market_price || 35}/{translateUnit(p.unit, language)}</span>
                          </div>
                          {(p.mandi_name || p.location) && (
                            <p className="text-[10px] text-stone-600 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                              <span className="font-medium">@ {p.mandi_name || 'Local APMC'} {p.mandi_district ? `(${p.mandi_district})` : ''}</span>
                            </p>
                          )}
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
                            {p.harvest_timing === 'FUTURE' || (p.days_until_harvest && p.days_until_harvest > 0) ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {p.days_until_harvest === 1 ? 'Harvesting Tomorrow' : p.days_until_harvest === 2 ? 'Harvesting in 2 Days' : `Harvesting in ${p.days_until_harvest}d`} (0d stored)
                              </span>
                            ) : p.days_since_harvest === 0 ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                Farm Fresh Harvest (0d stored)
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-600" /> Stored: {p.days_since_harvest} {p.days_since_harvest === 1 ? 'day' : 'days'}
                              </span>
                            )}
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
                            {p.harvest_timing === 'FUTURE' || (p.days_until_harvest && p.days_until_harvest > 0) 
                              ? (p.days_until_harvest === 1 ? 'Tomorrow' : p.days_until_harvest === 2 ? 'In 2 days' : `In ${p.days_until_harvest}d`)
                              : p.days_since_harvest === 0 
                                ? 'Today' 
                                : `${p.days_since_harvest}d ago`}
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
                type="button"
                onClick={() => handleSwitchSubTab('marketplace')}
                className="px-5 py-2.5 bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-teal-800 transition cursor-pointer"
              >
                Go to Marketplace
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {myOrders.map((o) => {
                const isRejected = o.status === 'REJECTED';
                const isPaid = !isRejected && (o.payment_status === 'PAID' || o.status === 'PAID');
                const isCOD = !isRejected && (o.payment_method === 'Cash on Delivery' || o.payment_status === 'CASH_ON_DELIVERY');
                const isPaymentSettled = isPaid || isCOD;
                const isConfirmed = !isRejected && (o.status === 'CONFIRMED' || o.status === 'ACCEPTED' || isPaid || isCOD || ['PREPARING', 'TRANSIT', 'DELIVERED'].includes(o.status));

                return (
                <div key={o.id} className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  isRejected ? 'border-rose-200 bg-rose-50/20' : 'border-stone-200'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-stone-900">Order #{o.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isRejected ? 'bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 font-black' :
                        o.status === 'DELIVERED' ? 'bg-emerald-600 text-white font-black shadow-xs flex items-center gap-1' :
                        o.status === 'TRANSIT' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                        o.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                        isPaid ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-black' :
                        isCOD ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold flex items-center gap-1' :
                        o.status === 'CONFIRMED' || o.status === 'ACCEPTED' ? 'bg-teal-100 text-teal-800 border border-teal-300' :
                        'bg-amber-100 text-amber-900 animate-pulse border border-amber-300 flex items-center gap-1'
                      }`}>
                        {isRejected ? (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" /> ORDER REJECTED BY FARMER
                          </>
                        ) : o.status === 'DELIVERED' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-200" /> DELIVERED TO DOORSTEP
                          </>
                        ) : o.status === 'ORDERED' ? (
                          <>
                            <Clock className="w-3 h-3" /> AWAITING FARMER AVAILABILITY
                          </>
                        ) : isCOD ? (
                          <>
                            <Banknote className="w-3 h-3 text-amber-700" /> CASH ON DELIVERY
                          </>
                        ) : o.status === 'CONFIRMED' ? (
                          'CONFIRMED BY FARMER'
                        ) : (
                          o.status
                        )}
                      </span>
                      {isPaid && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> PAID via UPI
                        </span>
                      )}
                      {isCOD && !isPaid && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white flex items-center gap-1">
                          <Banknote className="w-3 h-3" /> COD Confirmed
                        </span>
                      )}
                      <span className="text-[11px] text-stone-500">
                        {new Date(o.created_at).toLocaleDateString()} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900">
                      {o.quantity} {o.unit} of {o.product_name}
                    </h4>

                    <p className="text-xs text-stone-600">
                      Farmer: <strong className="text-stone-800">{o.farmer_name}</strong> • Direct Transport: {o.distance_km} km
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <span>Produce: ₹{o.product_total}</span>
                      <span>•</span>
                      <span>Delivery Fee: ₹{o.delivery_charge}</span>
                      <span>•</span>
                      <span>Grand Total: <strong className="text-teal-800 font-bold text-sm">₹{o.grand_total}</strong></span>
                      <span>•</span>
                      <span>Contact: <strong className="text-stone-800 font-semibold">{o.customer_phone || user.phone || 'Saved Phone'}</strong></span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                        isRejected ? 'bg-rose-100 text-rose-800 font-bold' :
                        isPaid ? 'bg-emerald-100 text-emerald-800' :
                        isCOD ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' :
                        'bg-stone-100 text-stone-600'
                      }`}>
                        {isRejected ? '✕ No Payment Charged' :
                         isPaid ? `✓ Paid via UPI (UTR: ${o.transaction_id || 'VERIFIED'})` :
                         isCOD ? `💵 Cash on Delivery (Pay ₹${o.grand_total} at Doorstep)` :
                         '⏳ Payment / COD Pending'}
                      </span>
                    </div>

                    {isRejected && (
                      <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs text-rose-900">
                        <div className="flex items-center gap-1.5 font-bold">
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Order could not be accepted by farmer</span>
                        </div>
                        <p className="text-rose-700 text-[11px] leading-relaxed">
                          {o.rejection_reason || 'Produce is currently unavailable. No payment was charged to your account.'}
                        </p>
                      </div>
                    )}

                    {o.status === 'ORDERED' && (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-[11px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 inline-flex items-center gap-1.5 leading-relaxed">
                          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Farmer <strong>{o.farmer_name}</strong> has received your order and is verifying crop availability. Payment & COD options will unlock immediately upon farmer confirmation.</span>
                        </p>
                        {o.farmer_whatsapp_url && (
                          <div className="pt-0.5">
                            <a
                              href={o.farmer_whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                              <span>📲 Open WhatsApp Message to Farmer</span>
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {isConfirmed && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Farmer Accepted Your Order! Ready for Fulfillment:</span>
                          </div>
                          {o.customer_whatsapp_url && (
                            <a
                              href={o.customer_whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 shadow-2xs transition"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>WhatsApp Message</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap pt-0.5">
                          {/* Option 1: Track Order */}
                          <button
                            type="button"
                            onClick={() => setTrackingOrder(o)}
                            className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>📍 {tr('Track Order', language)}</span>
                          </button>

                          {/* Option 2: Pay via UPI */}
                          {!isPaymentSettled ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenUPIModal(o)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs animate-pulse cursor-pointer active:scale-95"
                              >
                                <IndianRupee className="w-3.5 h-3.5" />
                                <span>💳 {tr('Pay via UPI', language)}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleConfirmCOD(o.id)}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                              >
                                <Banknote className="w-3.5 h-3.5" />
                                <span>💵 {tr('Cash on Delivery', language)}</span>
                              </button>
                            </>
                          ) : isPaid ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{tr('Pay via UPI', language)}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center gap-1">
                              <Banknote className="w-3.5 h-3.5 text-amber-700" />
                              <span>{tr('Cash on Delivery', language)}</span>
                            </span>
                          )}

                          {/* Option 3: View Invoice */}
                          <button
                            type="button"
                            onClick={() => handleOpenInvoice(o)}
                            className="px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-800 font-bold text-xs flex items-center gap-1.5 border border-stone-300 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-700" />
                            <span>📄 {tr('View Invoice', language)}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: Invoice, Pay Now, Live Tracking */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* View Invoice (Available once confirmed) */}
                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(o)}
                        className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-stone-200 shadow-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Invoice</span>
                      </button>
                    )}

                    {/* Pay Now UPI button (Available when confirmed but unpaid) */}
                    {isConfirmed && !isPaymentSettled && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenUPIModal(o)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer animate-pulse"
                        >
                          <IndianRupee className="w-4 h-4" />
                          <span>Pay via UPI</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmCOD(o.id)}
                          className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Banknote className="w-4 h-4" />
                          <span>Cash on Delivery</span>
                        </button>
                      </div>
                    )}

                    {/* Live Tracking Button */}
                    {!isRejected && (
                      <button
                        onClick={() => setTrackingOrder(o)}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer ${
                          o.status === 'DELIVERED'
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-teal-700 hover:bg-teal-800 text-white'
                        }`}
                      >
                        {o.status === 'DELIVERED' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            <span>Track Delivery (Delivered ✓)</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-4 h-4" />
                            <span>{t.liveTracking}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
              })}
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
                    Estimated total: ₹{((Number(reqQuantity) || 0) * (Number(reqPrice) || 0)).toLocaleString('en-IN')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-800 to-emerald-700 p-5 sm:p-6 text-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold font-['Outfit']">
                  {paymentStep === 'details' && (t.confirmOrder || 'Confirm Direct Order')}
                  {paymentStep === 'receipt' && 'Order Placed & Sent to Farmer!'}
                </h2>
                <p className="text-xs text-teal-100 mt-0.5">
                  Direct from {selectedProduct.farmer_name}'s Farm
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: QUANTITY & ADDRESS & CONFIRM ORDER */}
            {paymentStep === 'details' && (
              <form onSubmit={handleConfirmOrder} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 flex flex-col">
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
                    {selectedProduct.harvest_timing === 'FUTURE' || (selectedProduct.days_until_harvest && selectedProduct.days_until_harvest > 0)
                      ? (selectedProduct.days_until_harvest === 1 ? 'Harvesting Tomorrow' : selectedProduct.days_until_harvest === 2 ? 'In 2 Days' : `In ${selectedProduct.days_until_harvest}d`)
                      : selectedProduct.days_since_harvest === 0 
                        ? 'Fresh Today' 
                        : `${selectedProduct.days_since_harvest || 1}d ago`}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Delivery Address *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddressMapOpen(true)}
                      className="text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pin on Interactive Map / GPS</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your flat/street delivery address..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
                  />
                  {/* Quick address preset chips */}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <span className="text-[10px] text-stone-400 font-semibold">Quick Address:</span>
                    <button
                      type="button"
                      onClick={() => setDeliveryAddress(user.delivery_address || user.location || "Flat 402, Green Meadows, Model Colony, Pune - 411016")}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 hover:bg-teal-50 hover:text-teal-800 text-stone-700 border border-stone-200 transition cursor-pointer"
                    >
                      🏠 Home / Saved
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryAddress("Tower 4, Cyber City, Magarpatta Road, Hadapsar, Pune - 411028")}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 hover:bg-teal-50 hover:text-teal-800 text-stone-700 border border-stone-200 transition cursor-pointer"
                    >
                      🏢 Office
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryAddress("Society Main Gate & Security Desk, Kharadi, Pune - 411014")}
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 hover:bg-teal-50 hover:text-teal-800 text-stone-700 border border-stone-200 transition cursor-pointer"
                    >
                      🏬 Society Gate
                    </button>
                  </div>
                </div>

                {/* Contact / WhatsApp Phone Number for Order Updates */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-stone-700">
                      Contact / WhatsApp Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-700 font-semibold">📲 For Order Updates</span>
                  </div>
                  <div className="relative flex items-center">
                    <Phone className="w-3.5 h-3.5 absolute left-3 text-stone-400 pointer-events-none" />
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-8 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500 font-medium"
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Farmer will send harvest acceptance, UPI payment link & live tracking to this number.
                  </p>
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
                      <span className="text-[11px] text-stone-500 block">Computed Driving Distance</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-extrabold text-emerald-900">{deliveryDistanceKm}</span>
                        <span className="text-xs font-bold text-emerald-700">km</span>
                        {distanceInfo?.durationText && (
                          <span className="text-[10px] text-stone-500 font-medium ml-1">
                            (~{distanceInfo.durationText})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 block">Logistics Delivery Tariff</span>
                      <span className="text-sm font-extrabold text-stone-900">₹{deliveryCharge}</span>
                    </div>
                  </div>

                  {/* Google Maps Live Route Link */}
                  {distanceInfo?.googleMapsDirectionsUrl && (
                    <div className="pt-1 flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Google Maps Driving Route</span>
                      </div>
                      <a
                        href={distanceInfo.googleMapsDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline"
                        title="Open turn-by-turn driving directions in Google Maps"
                      >
                        <span>View Route on Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

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

                {/* Choose Payment Method: UPI vs Cash on Delivery */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-stone-700">
                    {tr('Payment Method', language)} *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div
                      onClick={() => setSelectedPaymentMethod('UPI')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        selectedPaymentMethod === 'UPI'
                          ? 'border-teal-600 bg-teal-50/70 text-teal-950 font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          📱 {tr('UPI Instant Escrow', language)}
                        </span>
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'UPI' ? 'border-teal-700 bg-teal-700' : 'border-stone-300'}`}>
                          {selectedPaymentMethod === 'UPI' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-normal">
                        Pay securely via UPI once farmer confirms harvest availability.
                      </p>
                    </div>

                    <div
                      onClick={() => setSelectedPaymentMethod('COD')}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        selectedPaymentMethod === 'COD'
                          ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          💵 {tr('Cash on Delivery', language)}
                        </span>
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'COD' ? 'border-emerald-700 bg-emerald-700' : 'border-stone-300'}`}>
                          {selectedPaymentMethod === 'COD' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-500 font-normal">
                        Farmer receives a COD accept/reject prompt; pay cash at delivery.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/80 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-700">
                    <span>{tr('Product Total', language)} ({orderQuantity} {translateUnit(selectedProduct.unit, language)} × ₹{unitPrice}):</span>
                    <span className="font-semibold">₹{productTotal}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>{tr('Delivery Fee', language)} ({deliveryDistanceKm} km):</span>
                    <span className="font-semibold">₹{deliveryCharge}</span>
                  </div>
                  <div className="pt-2 border-t border-teal-200 flex justify-between text-stone-900 font-bold text-sm">
                    <span>{tr('Grand Total', language)}:</span>
                    <span className="text-teal-900 text-base">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Payment Guarantee Card */}
                <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${selectedPaymentMethod === 'COD' ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-amber-50 border border-amber-200/90 text-amber-900'}`}>
                  <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${selectedPaymentMethod === 'COD' ? 'text-emerald-700' : 'text-amber-700'}`} />
                  <div className="space-y-0.5 leading-relaxed">
                    <span className="font-bold block">
                      {selectedPaymentMethod === 'COD' ? 'Cash on Delivery Verification:' : 'Zero Upfront Payment Protection:'}
                    </span>
                    <p className="text-[11px]">
                      {selectedPaymentMethod === 'COD' ? (
                        <>When you place this order, farmer <strong>{selectedProduct.farmer_name}</strong> will receive an instant popup to accept your COD request. If accepted, the harvest will be prepared immediately and you will pay in cash upon doorstep arrival. If rejected, no payment is deducted.</>
                      ) : (
                        <>When you click <strong>Confirm Order</strong>, your request is sent directly to farmer <strong>{selectedProduct.farmer_name}</strong>. You will only pay via UPI after the farmer confirms crop availability. Once transaction is complete, preparation begins!</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-3 mt-auto sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                  >
                    {tr('Cancel', language)}
                  </button>
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="flex-1 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md shadow-teal-200 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:bg-stone-300"
                  >
                    {placingOrder ? (
                      <span>{tr('Placing Order...', language)}</span>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-teal-300" />
                        <span>{tr('Confirm Direct Order', language)}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CONFIRMATION RECEIPT */}
            {paymentStep === 'receipt' && (
              <div className="p-5 sm:p-6 text-center space-y-4 overflow-y-auto flex-1 flex flex-col">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-4 ring-emerald-50">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">🎉 Order Placed Successfully!</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Your order #{lastPlacedOrder?.id || 'CONFIRMED'} has been sent to farmer {lastPlacedOrder?.farmer_name || selectedProduct?.farmer_name || 'Farmer'} for acceptance.
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                    You will receive an instant notification as soon as the farmer confirms your order and your commercial tax invoice is ready.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-left space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                    <span className="text-stone-500 font-medium">Order Status:</span>
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Awaiting Farmer Confirmation
                    </span>
                  </div>

                  {/* ITEM NAME - prominently visible */}
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-0.5">
                      Produce & Quantity
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

                  {/* TOTAL TO PAY */}
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                        Order Total (Delivery Included)
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        {lastPlacedOrder?.payment_method === 'Cash on Delivery' || selectedPaymentMethod === 'COD'
                          ? '💵 Pay in Cash upon doorstep delivery'
                          : 'UPI Payment Due on Confirmation'}
                      </span>
                    </div>
                    <span className="text-xl font-extrabold text-emerald-800">
                      ₹{lastPlacedOrder?.grand_total || grandTotal}
                    </span>
                  </div>

                  {/* DELIVERY ADDRESS */}
                  <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                    <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Delivery Address
                    </span>
                    <p className="text-xs font-medium text-stone-800 break-words leading-relaxed">
                      {lastPlacedOrder?.delivery_address || deliveryAddress || user.delivery_address || user.location || 'Pune Delivery Address'}
                    </p>
                  </div>

                  {/* WHATSAPP ALERT SENT TO FARMER CARD */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-left space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                          <span>📲 WhatsApp Order Alert Dispatched to Farmer</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-semibold">Live Alert</span>
                        </span>
                        <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                          Farmer <strong>{lastPlacedOrder?.farmer_name || selectedProduct?.farmer_name || 'Farmer'}</strong> has received an instant WhatsApp message with your order details. As soon as the farmer accepts, you will get a WhatsApp confirmation message with direct <strong>Track Order</strong>, <strong>Pay via UPI</strong>, and <strong>View Invoice</strong> options!
                        </p>
                      </div>
                    </div>
                    {lastPlacedOrder?.farmer_whatsapp_url && (
                      <div className="pt-1 flex items-center justify-end">
                        <a
                          href={lastPlacedOrder.farmer_whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open WhatsApp Message to Farmer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 mt-auto sticky bottom-0 bg-white/95 backdrop-blur-xs pb-1 shrink-0">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      handleSwitchSubTab('customer-orders');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{t.customerOrders || 'View in My Orders'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                  >
                    Continue Shopping
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
        onOpenInvoice={handleOpenInvoice}
      />

      {/* INVOICE MODAL */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
        order={selectedInvoiceOrder}
        isCustomer={true}
        onPayNow={() => {
          if (selectedInvoiceOrder) {
            handleOpenUPIModal(selectedInvoiceOrder);
          }
        }}
      />

      {/* REAL-TIME UPI PAYMENT MODAL */}
      <UPIPaymentModal
        isOpen={isUPIModalOpen}
        onClose={() => setIsUPIModalOpen(false)}
        order={selectedPayOrder}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* INTERACTIVE LOCATION PICKER MODAL */}
      <LocationPickerModal
        isOpen={isAddressMapOpen}
        onClose={() => setIsAddressMapOpen(false)}
        user={user}
        defaultAddress={deliveryAddress}
        title="Select Delivery Address & GPS Location"
        onAddressSaved={(addr, coords) => {
          setDeliveryAddress(addr);
          setUserLiveCoords(coords);
        }}
      />

      {/* COD REJECTION POPUP NOTIFICATION */}
      {rejectedCodAlertOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50">
              <XCircle className="w-9 h-9" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                Cash on Delivery Rejected
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-2">
                Order #{rejectedCodAlertOrder.id} Not Accepted
              </h3>
              <p className="text-sm text-stone-600 mt-1">
                Farmer <strong>{rejectedCodAlertOrder.farmer_name || 'The Farmer'}</strong> could not accept your Cash on Delivery request for <strong>{rejectedCodAlertOrder.product_name}</strong> ({rejectedCodAlertOrder.quantity} {rejectedCodAlertOrder.unit || 'kg'}).
              </p>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left space-y-1">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Zero Deduction Guarantee</span>
              </div>
              <p className="text-xs text-emerald-800">
                No payment was deducted from your account. You can choose another farmer or place an order using direct UPI.
              </p>
            </div>

            <button
              onClick={() => {
                sessionStorage.setItem('dismissed_cod_reject_' + rejectedCodAlertOrder.id, 'true');
                setRejectedCodAlertOrder(null);
              }}
              className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition cursor-pointer"
            >
              Understood / Dismiss
            </button>
          </div>
        </div>
      )}

      {/* DELIVERY AGENT ASSIGNED POPUP NOTIFICATION */}
      {agentAssignedPopupOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-blue-200 text-center space-y-4 animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto ring-8 ring-blue-50">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wide">
                🚚 Delivery Agent Assigned!
              </span>
              <h3 className="text-lg font-bold text-stone-900 mt-2">
                Order #{agentAssignedPopupOrder.order.id} is On Its Way
              </h3>
              <p className="text-sm text-stone-600 mt-1">
                Farmer <strong>{agentAssignedPopupOrder.order.farmer_name || 'The Farmer'}</strong> has assigned a dedicated delivery agent to deliver your fresh <strong>{agentAssignedPopupOrder.order.product_name}</strong> directly to your doorstep.
              </p>
            </div>

            {/* Delivery Agent Profile Card */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-left space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Delivery Agent:</span>
                <span className="text-sm font-bold text-stone-900">{agentAssignedPopupOrder.driver_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-medium">Contact Phone:</span>
                <span className="text-xs font-bold text-emerald-800">{agentAssignedPopupOrder.driver_phone}</span>
              </div>
              {agentAssignedPopupOrder.vehicle_number && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Vehicle Number:</span>
                  <span className="text-xs font-mono font-bold text-stone-700 bg-stone-200/70 px-2 py-0.5 rounded">
                    {agentAssignedPopupOrder.vehicle_number}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
                <a
                  href={`tel:${agentAssignedPopupOrder.driver_phone}`}
                  className="flex-1 py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg border border-emerald-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Agent</span>
                </a>
                <a
                  href={`https://api.whatsapp.com/send?phone=${agentAssignedPopupOrder.driver_phone.replace(/\D/g, '')}&text=${encodeURIComponent(`Hello, regarding FarmiQ Order #${agentAssignedPopupOrder.order.id}...`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-lg border border-teal-200 flex items-center justify-center gap-1.5 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <button
                onClick={() => {
                  sessionStorage.setItem(`dismissed_agent_assigned_${agentAssignedPopupOrder.order.id}_${agentAssignedPopupOrder.driver_name}`, 'true');
                  const targetOrd = agentAssignedPopupOrder.order;
                  setAgentAssignedPopupOrder(null);
                  setTrackingOrder(targetOrd);
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>📍 Live Track Dispatch</span>
              </button>
              <button
                onClick={() => {
                  sessionStorage.setItem(`dismissed_agent_assigned_${agentAssignedPopupOrder.order.id}_${agentAssignedPopupOrder.driver_name}`, 'true');
                  setAgentAssignedPopupOrder(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-xs transition cursor-pointer"
              >
                Understood / Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
