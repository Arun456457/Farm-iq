import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Package, ShoppingBag, IndianRupee, MapPin, Calendar, Leaf, 
  Trash2, Upload, AlertCircle, CheckCircle, Info, Clock, ArrowUpRight, TrendingUp, Sparkles,
  FilePlus, AlertTriangle, Send, CheckCheck, RefreshCw, Phone, User as UserIcon,
  Building2, ShieldCheck, Award, Sliders, Check, ExternalLink, Briefcase, ChevronRight,
  Truck, ArrowRight, Users
} from 'lucide-react';
import { User, Product, Order, LanguageCode, CustomerRequirement, Dispute, FPOLot, VerifiedBuyer, QualityGrade, FPOMemberFarmer } from '../types';
import { api } from '../api';
import { translations } from '../translations';

interface FarmerDashboardProps {
  user: User;
  language: LanguageCode;
  onProduceAdded: () => void;
  activeSubTab?: 'my-produce' | 'fpo-lots' | 'farmer-orders' | 'buyer-requirements' | 'disputes';
  onNavigateToStorage?: () => void;
}

export const FarmerDashboard: React.FC<FarmerDashboardProps> = ({
  user,
  language,
  onProduceAdded,
  activeSubTab = 'my-produce',
  onNavigateToStorage,
}) => {
  const t = translations[language];
  const [subTab, setSubTab] = useState<'my-produce' | 'fpo-lots' | 'farmer-orders' | 'buyer-requirements' | 'disputes'>(activeSubTab);
  
  // Data state
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [lots, setLots] = useState<FPOLot[]>([]);
  const [verifiedBuyers, setVerifiedBuyers] = useState<VerifiedBuyer[]>([]);
  const [selectedLotForMatch, setSelectedLotForMatch] = useState<FPOLot | null>(null);
  const [showCreateLotModal, setShowCreateLotModal] = useState(false);
  const [matchingLotId, setMatchingLotId] = useState<string | null>(null);
  const [matchingSuccessMsg, setMatchingSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lot Form State
  const [lotCropName, setLotCropName] = useState('');
  const [lotVariety, setLotVariety] = useState('');
  const [lotQuantity, setLotQuantity] = useState<number | ''>('');
  const [lotUnit, setLotUnit] = useState('Quintal');
  const [lotPackaging, setLotPackaging] = useState('Plastic Crates (25kg)');
  const [lotBasePrice, setLotBasePrice] = useState<number | ''>('');
  const [lotHarvestDate, setLotHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [lotFpoName, setLotFpoName] = useState(user.farm_name || 'Sahyadri Farmers Producer Co. Ltd');
  const [lotLocation, setLotLocation] = useState(user.location || 'Lasalgaon, Nashik');
  const [lotGrade, setLotGrade] = useState<QualityGrade>('Grade-A');
  const [lotMoisture, setLotMoisture] = useState<number>(12);
  const [lotDefect, setLotDefect] = useState<number>(2.0);
  const [lotColorUniformity, setLotColorUniformity] = useState<number>(95);
  const [lotCertifiedBy, setLotCertifiedBy] = useState('Agmark Quality Lab Nashik');
  const [creatingLot, setCreatingLot] = useState(false);
  // FPO Multi-Farmer Collaborative Pooling (Requires 2 or more farmers combined)
  const [lotMemberFarmers, setLotMemberFarmers] = useState<FPOMemberFarmer[]>([
    {
      farmer_name: `${user.full_name} (Lead Aggregator)`,
      contributed_quantity: 45,
      unit: 'Quintal',
      farm_location: user.location || 'Lasalgaon, Nashik',
      phone: user.phone || '+91 98220 54321'
    },
    {
      farmer_name: 'Ramesh Shinde (Member Farmer)',
      contributed_quantity: 35,
      unit: 'Quintal',
      farm_location: 'Niphad Sub-Cluster',
      phone: '+91 98221 44556'
    }
  ]);

  // Requirements & Dispute actions
  const [acceptingReqId, setAcceptingReqId] = useState<string | null>(null);
  const [reqActionMsg, setReqActionMsg] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
  const [orderNotification, setOrderNotification] = useState<string | null>(null);

  // Dispute form
  const [dispOrderId, setDispOrderId] = useState<string>('');
  const [dispSubject, setDispSubject] = useState('');
  const [dispDescription, setDispDescription] = useState('');
  const [submittingDisp, setSubmittingDisp] = useState(false);
  const [dispSuccessMsg, setDispSuccessMsg] = useState<string | null>(null);

  // Add Produce Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('kg');
  const [price, setPrice] = useState<number | ''>('');
  const [harvestDate, setHarvestDate] = useState('');
  const [location, setLocation] = useState(user.location || '');
  const [description, setDescription] = useState('');
  const [organic, setOrganic] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live Mandi price lookup for produce being typed
  const [estimatedMandiPrice, setEstimatedMandiPrice] = useState<number | null>(null);
  const [mandiRateDetails, setMandiRateDetails] = useState<any | null>(null);
  const [mandiLoading, setMandiLoading] = useState(false);

  useEffect(() => {
    setSubTab(activeSubTab);
  }, [activeSubTab]);

  const loadFarmerData = async () => {
    try {
      setError(null);
      const [prods, orders, reqs, disps, lotsData, buyersData] = await Promise.all([
        api.getFarmerProducts(),
        api.getFarmerOrders(),
        api.getRequirements().catch(() => []),
        api.getDisputes().catch(() => []),
        api.getLots().catch(() => []),
        api.getVerifiedBuyers().catch(() => [])
      ]);
      setMyProducts(prods);
      setMyOrders(orders);
      setRequirements(reqs);
      setDisputes(disps);
      setLots(lotsData);
      setVerifiedBuyers(buyersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load farmer dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotCropName.trim() || !lotQuantity || !lotBasePrice) {
      alert('Please fill crop name, quantity, and base price.');
      return;
    }
    if (!lotMemberFarmers || lotMemberFarmers.length < 2) {
      alert('An FPO (Farmer Producer Organization) lot requires 2 or more farmers combined to aggregate produce. Please add at least 2 contributing farmers.');
      return;
    }
    setCreatingLot(true);
    setMatchingSuccessMsg(null);
    try {
      const res = await api.createLot({
        crop_name: lotCropName.trim(),
        variety: lotVariety.trim() || 'Premium Commercial Variety',
        quantity: Number(lotQuantity),
        unit: lotUnit,
        packaging_type: lotPackaging,
        base_price_per_unit: Number(lotBasePrice),
        harvest_date: lotHarvestDate,
        location: lotLocation,
        fpo_name: lotFpoName,
        quality_grade: lotGrade,
        moisture_pct: Number(lotMoisture),
        defect_pct: Number(lotDefect),
        color_uniformity_pct: Number(lotColorUniformity),
        certified_by: lotCertifiedBy,
        member_farmers: lotMemberFarmers
      });

      setShowCreateLotModal(false);
      setLotCropName('');
      setLotVariety('');
      setLotQuantity('');
      setLotBasePrice('');
      setMatchingSuccessMsg(`Lot #${res.lot.id} successfully created with ${res.lot.quality_grade} quality grading and ${lotMemberFarmers.length} pooled farmers! Matching verified institutional buyers are shown below.`);
      await loadFarmerData();
      setSelectedLotForMatch(res.lot);
    } catch (err: any) {
      alert(err.message || 'Failed to create produce lot');
    } finally {
      setCreatingLot(false);
    }
  };

  const handleMatchLotWithBuyer = async (lotId: string, buyerId: string) => {
    setMatchingLotId(lotId);
    setMatchingSuccessMsg(null);
    try {
      const res = await api.matchLotWithBuyer(lotId, buyerId);
      const orderNum = res.order?.id ? `Order #${res.order.id}` : 'Order';
      setMatchingSuccessMsg(`🎉 Success! Escrow Contract activated with ${res.contract?.buyer_name || 'Buyer'}. ${orderNum} created — you can now click "Prepare Order" below or in the Orders tab!`);
      
      // Optimistic update
      if (res.order) {
        setMyOrders(prev => [res.order, ...prev.filter(o => o.id !== res.order.id)]);
      }
      setLots(prev => prev.map(l => l.id === lotId ? {
        ...l,
        status: 'CONTRACTED',
        matched_buyer_name: res.contract?.buyer_name || 'Verified Buyer',
        linked_order_id: res.order?.id,
        fulfillment_status: 'ACCEPTED'
      } : l));

      await loadFarmerData();
      if (selectedLotForMatch && selectedLotForMatch.id === lotId) {
        setSelectedLotForMatch(prev => prev ? { 
          ...prev, 
          status: 'CONTRACTED', 
          matched_buyer_name: res.contract?.buyer_name,
          linked_order_id: res.order?.id,
          fulfillment_status: 'ACCEPTED'
        } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to lock contract with verified buyer');
    } finally {
      setMatchingLotId(null);
    }
  };

  useEffect(() => {
    loadFarmerData();
    const interval = setInterval(loadFarmerData, 4000); // 4-second auto-sync
    return () => clearInterval(interval);
  }, []);

  const handleAcceptRequirement = async (reqId: string) => {
    setAcceptingReqId(reqId);
    setReqActionMsg(null);
    try {
      const res = await api.acceptRequirement(reqId);
      setReqActionMsg(`Requirement #${reqId} claimed! Order #${res.order?.id || ''} has been added to your Incoming Orders queue for packaging & dispatch.`);
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to accept requirement');
    } finally {
      setAcceptingReqId(null);
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
      setDispSuccessMsg(`Farmer Grievance #${res.id} filed with Admin. Escrow team will review immediately.`);
      setDispSubject('');
      setDispDescription('');
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to file grievance');
    } finally {
      setSubmittingDisp(false);
    }
  };

  // Calculate Mandi benchmark when typing crop name
  useEffect(() => {
    const trimmed = name.trim();
    if (trimmed.length >= 2) {
      setMandiLoading(true);
      const timer = setTimeout(() => {
        api.getMandiPrices({ crop: trimmed })
          .then(res => {
            if (res.mandi_prices && res.mandi_prices.length > 0) {
              setEstimatedMandiPrice(res.mandi_prices[0].modal_price);
              setMandiRateDetails(res.mandi_prices[0]);
            } else {
              setEstimatedMandiPrice(null);
              setMandiRateDetails(null);
            }
          })
          .catch(() => {
            setEstimatedMandiPrice(null);
            setMandiRateDetails(null);
          })
          .finally(() => {
            setMandiLoading(false);
          });
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setEstimatedMandiPrice(null);
      setMandiRateDetails(null);
      setMandiLoading(false);
    }
  }, [name]);

  // Handle local image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // Submit Produce
  const handleAddProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quantity || !price) {
      alert('Please fill in crop name, quantity, and price per unit.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createProduct({
        name: name.trim(),
        category,
        quantity: Number(quantity),
        unit,
        price: Number(price),
        harvest_date: harvestDate,
        location: location.trim(),
        description: description.trim(),
        organic,
        image_base64: imageBase64,
      });

      setShowAddModal(false);
      // Reset form with NO predefined dummy values
      setName('');
      setCategory('');
      setQuantity('');
      setUnit('kg');
      setPrice('');
      setHarvestDate('');
      setLocation(user.location || '');
      setDescription('');
      setOrganic(false);
      setImagePreview(null);
      setImageBase64(null);
      setEstimatedMandiPrice(null);
      setMandiRateDetails(null);
      
      onProduceAdded();
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to list produce');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setName('');
    setCategory('');
    setQuantity('');
    setUnit('kg');
    setPrice('');
    setHarvestDate('');
    setLocation(user.location || '');
    setDescription('');
    setOrganic(false);
    setImagePreview(null);
    setImageBase64(null);
    setEstimatedMandiPrice(null);
    setMandiRateDetails(null);
  };

  // Delete product
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.deleteProduct(id);
      loadFarmerData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  // Update order status with optimistic sync and notification
  const handleStatusUpdate = async (orderId: number, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    setOrderNotification(null);
    // Optimistic UI updates across orders and lots
    setMyOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus as any } : o));
    setLots(prev => prev.map(l => (l.linked_order_id === orderId || (l as any).id === orderId) ? { ...l, fulfillment_status: nextStatus as any } : l));
    
    try {
      await api.updateOrderStatus(orderId, nextStatus);
      const label = nextStatus === 'PREPARING' ? 'Packing & Preparation in progress' :
                    nextStatus === 'TRANSIT' ? 'Handed over to Transit' :
                    nextStatus === 'DELIVERED' ? 'Delivered & Escrow released' : 'Updated';
      setOrderNotification(`✓ Order #${orderId}: ${label}!`);
      await loadFarmerData();
    } catch (err: any) {
      setOrderNotification(`⚠️ ${err.message || 'Failed to update order status'}`);
      await loadFarmerData();
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handlePrepareOrderForLot = (lot: FPOLot) => {
    const linked = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
    if (linked) {
      handleStatusUpdate(linked.id, 'PREPARING');
    } else if (lot.linked_order_id) {
      handleStatusUpdate(lot.linked_order_id, 'PREPARING');
    }
  };

  const handleDispatchOrderForLot = (lot: FPOLot) => {
    const linked = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
    if (linked) {
      handleStatusUpdate(linked.id, 'TRANSIT');
    } else if (lot.linked_order_id) {
      handleStatusUpdate(lot.linked_order_id, 'TRANSIT');
    }
  };

  const handleDeliverOrderForLot = (lot: FPOLot) => {
    const linked = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
    if (linked) {
      handleStatusUpdate(linked.id, 'DELIVERED');
    } else if (lot.linked_order_id) {
      handleStatusUpdate(lot.linked_order_id, 'DELIVERED');
    }
  };

  // Aggregates
  const totalAvailableQty = myProducts.reduce((acc, p) => acc + (p.quantity || 0), 0);
  const totalEarnings = myOrders.reduce((acc, o) => o.status !== 'CANCELLED' ? acc + o.product_total : acc, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Profile Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-md mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-[11px] font-bold tracking-wider uppercase">
              Farmer Dashboard
            </span>
            <span className="text-emerald-200 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {user.location}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 font-['Outfit']">
            {user.full_name}
          </h1>
          <p className="text-emerald-100 text-xs sm:text-sm mt-0.5 font-medium">
            Farm: {user.farm_name || 'Direct Agro Farm'} • Phone: {user.phone}
          </p>
        </div>

        <button
          id="btn-add-produce"
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-xl bg-white text-emerald-900 font-bold text-xs shadow-lg shadow-black/10 flex items-center gap-2 hover:bg-emerald-50 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-emerald-700" />
          <span>{t.addProduce}</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-left">
        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Active Listings</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{myProducts.length}</span>
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Available on marketplace</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Total Available Quantity</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{totalAvailableQty} <span className="text-sm font-normal text-stone-500">kg</span></span>
            <Leaf className="w-5 h-5 text-teal-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Ready for direct pickup</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Incoming Orders</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{myOrders.length}</span>
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{myOrders.filter(o => o.status === 'ORDERED').length} need acceptance</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Total Farm Revenue</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-800">₹{totalEarnings}</span>
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-semibold">100% direct realization</p>
        </div>
      </div>

      {/* Sub-tabs: My Produce, FPO Lots & Verified Buyers, Orders, Buyer Requirements, Disputes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 mb-6 gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSubTab('my-produce')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'my-produce' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{t.myProduce} ({myProducts.length})</span>
          </button>
          <button
            onClick={() => setSubTab('fpo-lots')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'fpo-lots' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-4 h-4 text-teal-700" />
            <span>FPO Lots & Verified Buyers ({lots.length})</span>
          </button>
          <button
            onClick={() => setSubTab('farmer-orders')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'farmer-orders' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.incomingOrders} ({myOrders.length})</span>
          </button>
          <button
            onClick={() => setSubTab('buyer-requirements')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'buyer-requirements' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FilePlus className="w-4 h-4 text-emerald-600" />
            <span>Buyer Requirements ({requirements.filter(r => r.status === 'OPEN').length} Open)</span>
          </button>
          <button
            onClick={() => setSubTab('disputes')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
              subTab === 'disputes' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Disputes & Grievances ({disputes.length})</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shrink-0">
          <Leaf className="w-3.5 h-3.5" />
          <span>Multi-Device Sync Active: Instant inventory updates</span>
        </div>
      </div>

      {/* SUB-TAB 1: MY PRODUCE */}
      {subTab === 'my-produce' && (
        <div>
          {myProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto my-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-stone-800 mb-1">You haven't listed any produce yet.</h3>
              <p className="text-xs text-stone-500 mb-6">
                Upload your harvest photo, set your price, check the live Mandi rate, and sell directly to consumers.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-800 transition"
              >
                + {t.addProduce}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
              {myProducts.map((p) => {
                const mandiDiff = (p.price || 0) - (p.market_price || 0);
                const isBelowMandi = mandiDiff < 0;

                return (
                  <div key={p.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                    <div>
                      {/* Product Image */}
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
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          title="Delete Listing"
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 text-stone-500 hover:text-red-600 hover:bg-white transition shadow-xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product Details */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-lg font-bold text-stone-900">{p.name}</h3>
                          <div className="text-right">
                            <span className="text-xl font-bold text-emerald-800">₹{p.price}</span>
                            <span className="text-xs text-stone-500">/{p.unit}</span>
                          </div>
                        </div>

                        {/* Mandi Comparison Highlight (Requested feature) */}
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 mb-3 text-xs">
                          <div className="flex items-center justify-between font-semibold text-amber-950 mb-1">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                              Mandi Benchmark:
                            </span>
                            <span className="font-bold">₹{p.market_price || 35}/{p.unit}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-600">
                            <span>Price Difference:</span>
                            <span className={`font-bold ${isBelowMandi ? 'text-emerald-700' : 'text-amber-800'}`}>
                              {isBelowMandi ? `₹${Math.abs(mandiDiff)} below Mandi (High Demand!)` : `₹${mandiDiff} above Mandi`}
                            </span>
                          </div>
                        </div>

                        {/* Shelf-Life & Preservation Advisor */}
                        <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/70 mb-3 text-xs text-blue-950">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-700" />
                              Preservation:
                            </span>
                            <span className="text-[11px] font-bold text-blue-800">
                              {p.remaining_shelf_life ?? 12} days left
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-600 leading-tight">
                            Harvested: {p.harvest_date} • Stored for {p.days_since_harvest ?? 1} days.
                          </p>
                          <p className="text-[10px] text-blue-800 font-medium mt-1">
                            💡 {p.action_advice || 'Mandi prices fluctuate; store in cold hub if holding for surge.'}
                          </p>
                        </div>

                        {/* Quantity & Location */}
                        <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-100">
                          <span className="font-semibold">Stock: {p.quantity} {p.unit}</span>
                          <span className="flex items-center gap-1 text-[11px]">
                            <MapPin className="w-3 h-3 text-stone-400" /> {p.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom storage recommendation action */}
                    {onNavigateToStorage && (
                      <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-stone-500 text-[11px]">Need cold storage?</span>
                        <button
                          onClick={onNavigateToStorage}
                          className="text-emerald-800 font-bold hover:underline flex items-center gap-1 text-[11px]"
                        >
                          Book Space (₹4.5/Q) <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: FPO LOTS & VERIFIED BUYERS */}
      {subTab === 'fpo-lots' && (
        <div className="space-y-6 text-left">
          {matchingSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{matchingSuccessMsg}</span>
              </div>
              <button onClick={() => setMatchingSuccessMsg(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>
          )}

          {/* Tab Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-teal-900 via-emerald-900 to-emerald-800 p-6 rounded-2xl text-white shadow-sm">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">Institutional FPO Marketplace</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-['Outfit']">FPO Graded Lots & Verified Buyers</h3>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                Aggregate farm produce into commercial graded lots. Connect directly with institutional buyers (retail chains, processors, exporters) verified & approved by FarmiQ Admin with 100% Escrow security.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={loadFarmerData}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowCreateLotModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs shadow-md flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Produce Lot</span>
              </button>
            </div>
          </div>

          {/* Active Lot Matching Focus Banner */}
          {selectedLotForMatch && (
            <div className="p-4 rounded-2xl bg-teal-50 border-2 border-teal-500 text-teal-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-600 text-white shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-teal-200/80 px-2 py-0.5 rounded text-teal-900">Matching Mode Active</span>
                    <span className="text-xs font-mono font-bold text-teal-800">#{selectedLotForMatch.id}</span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                    {selectedLotForMatch.quantity} {selectedLotForMatch.unit} of {selectedLotForMatch.crop_name} ({selectedLotForMatch.variety}) - {selectedLotForMatch.quality_grade}
                  </h4>
                  <p className="text-xs text-stone-600">
                    Base Valuation: ₹{selectedLotForMatch.base_price_per_unit} / {selectedLotForMatch.unit} • Total: ₹{(selectedLotForMatch.quantity * selectedLotForMatch.base_price_per_unit).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedLotForMatch(null)}
                className="px-3 py-1.5 rounded-lg border border-teal-300 text-xs font-bold text-teal-900 hover:bg-teal-100 transition self-start sm:self-auto cursor-pointer"
              >
                Exit Match Mode
              </button>
            </div>
          )}

          {/* LOTS SECTION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-stone-900">Active FPO Produce Lots ({lots.length})</h4>
                <p className="text-xs text-stone-500">Commercial grade lots aggregated for institutional procurement</p>
              </div>
            </div>

            {lots.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-stone-300 max-w-xl mx-auto">
                <Building2 className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-stone-800">No FPO lots listed yet</h4>
                <p className="text-xs text-stone-500 mt-1 mb-4">
                  Create your first quality-graded produce lot to receive bids and matching contracts from verified retail buyers.
                </p>
                <button
                  onClick={() => setShowCreateLotModal(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
                >
                  + Create First Produce Lot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {lots.map((lot) => {
                  const isSelected = selectedLotForMatch?.id === lot.id;
                  const totalValue = (lot.quantity || 0) * (lot.base_price_per_unit || 0);

                  return (
                    <div
                      key={lot.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                        isSelected 
                          ? 'border-teal-600 ring-2 ring-teal-200' 
                          : 'border-stone-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Top Meta */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-800">#{lot.id}</span>
                            <span className="text-[11px] text-stone-500 font-medium">{lot.fpo_name}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                            lot.status === 'AVAILABLE' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            ● {lot.status}
                          </span>
                        </div>

                        {/* Title & Quantity */}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-bold text-stone-900">
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

                        {/* Quality Specs Pill Grid */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-stone-700">
                            <span className="font-semibold flex items-center gap-1">
                              <Award className="w-3.5 h-3.5 text-emerald-600" /> Lab Certification:
                            </span>
                            <span className="font-medium text-emerald-800">{lot.certified_by}</span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-200/60 text-center">
                            <div className="bg-white p-2 rounded-lg border border-stone-200">
                              <p className="text-[10px] text-stone-500">Moisture</p>
                              <p className="text-xs font-bold text-stone-800">{lot.moisture_pct}%</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-stone-200">
                              <p className="text-[10px] text-stone-500">Defect Rate</p>
                              <p className="text-xs font-bold text-stone-800">&lt; {lot.defect_pct}%</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-stone-200">
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
                              FPO Pooled Collective ({lot.member_farmers?.length || 3} Farmers Combined)
                            </span>
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                              Multi-Farmer Lot
                            </span>
                          </div>
                          
                          <div className="space-y-1.5">
                            {(lot.member_farmers || [
                              { farmer_name: lot.farmer_name || 'Lead Farmer', contributed_quantity: Math.round(lot.quantity * 0.55), unit: lot.unit, farm_location: lot.location || 'Central Cluster' },
                              { farmer_name: 'Ramesh Kulkarni', contributed_quantity: Math.round(lot.quantity * 0.25), unit: lot.unit, farm_location: 'North Sub-Cluster' },
                              { farmer_name: 'Balasaheb Shinde', contributed_quantity: lot.quantity - Math.round(lot.quantity * 0.55) - Math.round(lot.quantity * 0.25), unit: lot.unit, farm_location: 'South Sub-Cluster' }
                            ]).map((mf, fIdx) => (
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

                      {/* Action footer */}
                      <div className="pt-4 mt-3 border-t border-stone-100">
                        {lot.status === 'AVAILABLE' ? (
                          <button
                            onClick={() => setSelectedLotForMatch(isSelected ? null : lot)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                              isSelected 
                                ? 'bg-teal-700 text-white' 
                                : 'bg-stone-900 hover:bg-stone-800 text-white'
                            }`}
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span>{isSelected ? '✓ Matching Active (See Buyers Below)' : 'Match with Verified Institutional Buyers'}</span>
                          </button>
                        ) : (() => {
                          const linkedOrder = myOrders.find(o => o.lot_id === lot.id || (lot.linked_order_id && o.id === lot.linked_order_id));
                          const orderStatus = linkedOrder?.status || lot.fulfillment_status || 'ACCEPTED';
                          const orderId = linkedOrder?.id || lot.linked_order_id;
                          const isUpdating = updatingOrderId === orderId;

                          return (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 font-semibold">
                                <div className="flex items-center gap-1.5 truncate mr-2">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                                  <span className="truncate">Contracted with {lot.matched_buyer_name || 'Verified Buyer'}</span>
                                </div>
                                <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-950 font-bold uppercase shrink-0">
                                  Escrow Secured
                                </span>
                              </div>

                              {/* Interactive Order Preparation Stepper */}
                              {orderStatus === 'ACCEPTED' && (
                                <button
                                  onClick={() => handlePrepareOrderForLot(lot)}
                                  disabled={isUpdating}
                                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-400"
                                >
                                  <Package className="w-4 h-4" />
                                  <span>{isUpdating ? 'Initiating Packing...' : '📦 Prepare Order (Pack & Quality Grade)'}</span>
                                </button>
                              )}

                              {orderStatus === 'PREPARING' && (
                                <button
                                  onClick={() => handleDispatchOrderForLot(lot)}
                                  disabled={isUpdating}
                                  className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-400"
                                >
                                  <Truck className="w-4 h-4" />
                                  <span>{isUpdating ? 'Marking In Transit...' : '🚚 Mark Dispatched to Logistics Hub'}</span>
                                </button>
                              )}

                              {orderStatus === 'TRANSIT' && (
                                <button
                                  onClick={() => handleDeliverOrderForLot(lot)}
                                  disabled={isUpdating}
                                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-400"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>{isUpdating ? 'Confirming Delivery...' : '✓ Confirm Delivered & Release Escrow'}</span>
                                </button>
                              )}

                              {orderStatus === 'DELIVERED' && (
                                <div className="flex items-center justify-between text-xs bg-stone-100 text-emerald-800 p-2.5 rounded-xl border border-stone-200 font-bold">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    Order Delivered & Settled
                                  </span>
                                  <span className="text-[11px] font-mono font-extrabold text-stone-900">
                                    ₹{(lot.quantity * lot.base_price_per_unit).toLocaleString()} Settled
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-0.5 px-1">
                                <span>Fulfillment Status: <strong className="text-stone-800 uppercase font-bold">{orderStatus}</strong></span>
                                <button
                                  type="button"
                                  onClick={() => setSubTab('farmer-orders')}
                                  className="text-teal-700 hover:text-teal-800 font-semibold underline inline-flex items-center gap-0.5 cursor-pointer"
                                >
                                  View in Orders tab <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* VERIFIED BUYERS SECTION */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-stone-900">Verified Institutional Buyers</h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin Verified
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {selectedLotForMatch 
                    ? `Showing corporate buyers interested in ${selectedLotForMatch.crop_name} (${selectedLotForMatch.quality_grade})` 
                    : 'Institutional buyers reviewed & approved by FarmiQ Admin with pre-funded Escrow'}
                </p>
              </div>

              {selectedLotForMatch && (
                <div className="text-xs text-teal-800 font-semibold bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 self-start sm:self-auto">
                  Clicking "Lock Contract" creates an immediate legally binding escrow contract for Lot #{selectedLotForMatch.id}
                </div>
              )}
            </div>

            {verifiedBuyers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-stone-300">
                <ShieldCheck className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-stone-800">No verified buyers available right now</h4>
                <p className="text-xs text-stone-500 mt-1">
                  When new corporate buyers register, FarmiQ Admin reviews and verifies their GSTIN/FSSAI credentials before they appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {verifiedBuyers.map((buyer) => {
                  const isMatchForSelectedLot = selectedLotForMatch && (
                    buyer.demand_crop.toLowerCase().includes(selectedLotForMatch.crop_name.toLowerCase()) ||
                    selectedLotForMatch.crop_name.toLowerCase().includes(buyer.demand_crop.toLowerCase())
                  );

                  return (
                    <div
                      key={buyer.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                        isMatchForSelectedLot 
                          ? 'border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20' 
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header: Company & Admin verified tag */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-4 h-4 text-stone-700" />
                              <h4 className="text-sm font-bold text-stone-900">{buyer.company_name}</h4>
                            </div>
                            <p className="text-[11px] text-stone-500 font-medium mt-0.5">{buyer.buyer_type}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified by Admin
                          </span>
                        </div>

                        {/* Demands */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1.5">
                          <div className="flex items-baseline justify-between">
                            <span className="text-stone-600">Procurement Crop Demand:</span>
                            <span className="font-bold text-stone-900">{buyer.demand_crop} ({buyer.demand_grade})</span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-stone-600">Target Volume:</span>
                            <span className="font-bold text-stone-900">{buyer.target_volume_quintal} {buyer.unit}</span>
                          </div>
                          <div className="flex items-baseline justify-between pt-1 border-t border-stone-200">
                            <span className="text-stone-600">Procurement Offer Price:</span>
                            <span className="text-sm font-bold text-emerald-800">₹{buyer.procurement_price} / {buyer.unit}</span>
                          </div>
                        </div>

                        {/* Contact & Location Details */}
                        <div className="text-[11px] text-stone-600 space-y-1">
                          <p className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-stone-400" /> Sourcing: <span className="font-medium text-stone-800">{buyer.contact_person}</span>
                          </p>
                          {buyer.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" /> {buyer.phone} • {buyer.email}
                            </p>
                          )}
                          <p className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-stone-400" /> Distribution Hub: {buyer.location}
                          </p>
                          {buyer.gstin && (
                            <p className="font-mono text-[10px] text-stone-500">
                              GSTIN: {buyer.gstin} • Escrow: 100% Pre-funded
                            </p>
                          )}
                        </div>

                        {/* Match Reasons */}
                        {buyer.match_reasons && buyer.match_reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {buyer.match_reasons.map((reason, idx) => (
                              <span key={idx} className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium">
                                ✓ {reason}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action */}
                      <div className="pt-4 mt-3 border-t border-stone-100">
                        {selectedLotForMatch ? (
                          <button
                            onClick={() => handleMatchLotWithBuyer(selectedLotForMatch.id, buyer.id)}
                            disabled={matchingLotId === selectedLotForMatch.id || selectedLotForMatch.status !== 'AVAILABLE'}
                            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>
                              {matchingLotId === selectedLotForMatch.id 
                                ? 'Locking Escrow Contract...' 
                                : `Lock Contract for Lot #${selectedLotForMatch.id} (₹${buyer.procurement_price}/Q)`}
                            </span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const matchingLot = lots.find(l => l.status === 'AVAILABLE' && l.crop_name.toLowerCase().includes(buyer.demand_crop.toLowerCase()));
                              if (matchingLot) {
                                setSelectedLotForMatch(matchingLot);
                              } else {
                                const anyAvailable = lots.find(l => l.status === 'AVAILABLE');
                                if (anyAvailable) setSelectedLotForMatch(anyAvailable);
                                else setShowCreateLotModal(true);
                              }
                            }}
                            className="w-full py-2 rounded-xl border border-stone-300 hover:border-emerald-500 text-stone-700 hover:text-emerald-800 font-bold text-xs transition flex items-center justify-center gap-1 cursor-pointer bg-white"
                          >
                            <span>Select Lot to Contract with this Buyer</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INCOMING ORDERS */}
      {subTab === 'farmer-orders' && (
        <div>
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300 max-w-xl mx-auto my-6">
              <ShoppingBag className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-800">No customer orders yet.</h3>
              <p className="text-xs text-stone-500 mt-1">
                As soon as customers in your area place an order, it will appear here in real-time with delivery details.
              </p>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              {orderNotification && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
                  <span>{orderNotification}</span>
                  <button onClick={() => setOrderNotification(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">✕</button>
                </div>
              )}
              {myOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">Order #{o.id}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        o.status === 'TRANSIT' ? 'bg-blue-100 text-blue-800' :
                        o.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                        o.status === 'ACCEPTED' ? 'bg-teal-100 text-teal-800' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {o.status}
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {new Date(o.created_at).toLocaleDateString()} {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900">
                      {o.quantity} {o.unit} of {o.product_name}
                    </h4>

                    <div className="text-xs text-stone-600 space-y-0.5">
                      <p>Customer: <span className="font-semibold text-stone-800">{o.customer_name}</span></p>
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        Delivery Address: {o.delivery_address}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                      <span>Produce: <strong className="text-stone-800">₹{o.product_total}</strong></span>
                      <span>•</span>
                      <span>Delivery ({o.distance_km} km @ ₹2/km): <strong className="text-stone-800">₹{o.delivery_charge}</strong></span>
                      <span>•</span>
                      <span>Grand Total: <strong className="text-emerald-800 font-bold text-sm">₹{o.grand_total}</strong></span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
                        Paid via {o.payment_method}
                      </span>
                    </div>
                  </div>

                  {/* Status Progression Workflow */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0">
                    {o.status === 'ORDERED' && (
                      <button
                        onClick={() => handleStatusUpdate(o.id, 'ACCEPTED')}
                        disabled={updatingOrderId === o.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:bg-stone-400"
                      >
                        {updatingOrderId === o.id ? 'Updating...' : 'Accept Order & Begin Dispatch'}
                      </button>
                    )}
                    {o.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStatusUpdate(o.id, 'PREPARING')}
                        disabled={updatingOrderId === o.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:bg-stone-400 flex items-center justify-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>{updatingOrderId === o.id ? 'Starting packing...' : '📦 Prepare Order (Pack & Sort)'}</span>
                      </button>
                    )}
                    {o.status === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusUpdate(o.id, 'TRANSIT')}
                        disabled={updatingOrderId === o.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:bg-stone-400 flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>{updatingOrderId === o.id ? 'Dispatching...' : '🚚 Handover to Transit'}</span>
                      </button>
                    )}
                    {o.status === 'TRANSIT' && (
                      <button
                        onClick={() => handleStatusUpdate(o.id, 'DELIVERED')}
                        disabled={updatingOrderId === o.id}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:bg-stone-400 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{updatingOrderId === o.id ? 'Confirming...' : '✓ Confirm Delivered'}</span>
                      </button>
                    )}
                    {o.status === 'DELIVERED' && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle className="w-4 h-4" /> Delivered & Settled
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: BUYER REQUIREMENTS & DEMAND POOL */}
      {subTab === 'buyer-requirements' && (
        <div className="space-y-6 text-left">
          {reqActionMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{reqActionMsg}</span>
              </div>
              <button onClick={() => setReqActionMsg(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-stone-900 font-['Outfit']">Customer Requirements & Bulk Demands</h3>
              <p className="text-xs text-stone-500">
                Direct procurement requests posted by consumers and restaurants. Accept and fulfill to generate instant direct orders!
              </p>
            </div>

            <button
              onClick={loadFarmerData}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Demands</span>
            </button>
          </div>

          {requirements.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
              <FilePlus className="w-12 h-12 text-stone-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-stone-800">No buyer requirements currently active.</h4>
              <p className="text-xs text-stone-500 mt-1">
                When buyers post custom orders for bulk vegetables or fruits, they will appear here instantly for you to accept.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requirements.map((req) => {
                const isClaimedByMe = req.accepted_by_farmer_id === user.id;
                const isClaimedByOther = req.status === 'ACCEPTED' && !isClaimedByMe;
                const totalPayout = (req.required_quantity || 0) * (req.expected_price || 0);

                return (
                  <div
                    key={req.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                      isClaimedByMe ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-stone-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header tags */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-800">#{req.id}</span>
                          <span className="text-[11px] text-stone-500 font-medium">
                            Posted {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                          isClaimedByMe ? 'bg-emerald-100 text-emerald-800' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {req.status === 'OPEN' ? '● OPEN TO CLAIM' : isClaimedByMe ? '✓ CLAIMED BY YOU' : `CLAIMED by ${req.accepted_by_farmer_name}`}
                        </span>
                      </div>

                      {/* Crop info */}
                      <div>
                        <h4 className="text-lg font-bold text-stone-900">
                          {req.required_quantity} {req.unit} of {req.crop_name}
                        </h4>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xs text-stone-500">Buyer Target Price:</span>
                          <span className="text-base font-bold text-emerald-800">₹{req.expected_price} / {req.unit}</span>
                          <span className="text-xs font-semibold text-stone-700">
                            (Total: ₹{totalPayout.toLocaleString('en-IN')})
                          </span>
                        </div>
                      </div>

                      {/* Customer info & Delivery */}
                      <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 text-stone-800 font-semibold">
                          <UserIcon className="w-3.5 h-3.5 text-stone-500" />
                          <span>Buyer: {req.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate">{req.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-stone-600">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>Needed By: <strong>{req.needed_by_date}</strong></span>
                        </div>
                        {req.notes && (
                          <p className="text-stone-500 italic pt-1 border-t border-stone-200 mt-1">
                            "{req.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-4 mt-2 border-t border-stone-100">
                      {req.status === 'OPEN' ? (
                        <button
                          onClick={() => handleAcceptRequirement(req.id)}
                          disabled={acceptingReqId === req.id}
                          className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:bg-stone-300"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>{acceptingReqId === req.id ? 'Claiming...' : 'Accept & Claim This Order (₹2/km Delivery)'}</span>
                        </button>
                      ) : isClaimedByMe ? (
                        <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-900 p-2.5 rounded-xl border border-emerald-200 font-medium">
                          <span>✓ In your Incoming Orders tab</span>
                          <button
                            onClick={() => setSubTab('farmer-orders')}
                            className="text-xs font-bold text-emerald-800 hover:underline"
                          >
                            View Order →
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-stone-400 font-medium py-1">
                          Fulfilled by {req.accepted_by_farmer_name}
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

      {/* SUB-TAB 4: DISPUTES & GRIEVANCES */}
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
            {/* File grievance form */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Farmer Grievance Desk</h3>
                  <p className="text-[11px] text-stone-500">Neutral Admin Escrow & payment protection desk</p>
                </div>
              </div>

              <form onSubmit={handleFileDispute} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Related Order</label>
                  <select
                    value={dispOrderId}
                    onChange={(e) => setDispOrderId(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Select an incoming order (or general issue)</option>
                    {myOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id} - {o.product_name} (Buyer: {o.customer_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Subject / Issue Category *</label>
                  <select
                    value={dispSubject}
                    onChange={(e) => setDispSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="">Select issue category</option>
                    <option value="Escrow Payment Release Delayed">Escrow Payment Release Delayed</option>
                    <option value="Transporter / Truck Failed to Arrive">Transporter / Truck Failed to Arrive</option>
                    <option value="Buyer Rejected Fresh Produce Without Cause">Buyer Rejected Fresh Produce Without Cause</option>
                    <option value="Transit Damage Dispute">Transit Damage Dispute</option>
                    <option value="Cold Storage Booking Grievance">Cold Storage Booking Grievance</option>
                    <option value="Other Farm Support Issue">Other Farm Support Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Detailed Description *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Provide details about the consignment, truck status, or buyer interaction..."
                    value={dispDescription}
                    onChange={(e) => setDispDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600"
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
                  <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Your Grievances & Claims</h3>
                  <p className="text-xs text-stone-500">Track claim investigation and payment escrow settlements</p>
                </div>
                <button
                  onClick={loadFarmerData}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {disputes.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
                  <AlertCircle className="w-12 h-12 text-stone-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-stone-800">No active grievances filed.</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Your transactions are operating under FarmiQ protected contracts and direct escrow payouts.
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
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 text-left">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Outfit']">{t.addProduce}</h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Upload actual produce photo, inspect live Mandi rates, and reach consumers directly.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddProduce} className="p-6 space-y-4">
              {/* Crop Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Product / Crop Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mango, Tomato, Onion, Wheat, Green Chilli, etc."
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 pr-8"
                  />
                  {mandiLoading && (
                    <div className="absolute right-2.5 top-2.5">
                      <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Live Mandi Benchmark display inside modal */}
              {mandiLoading && (
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center gap-2 text-stone-600">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Fetching real-time APMC Mandi market price for &ldquo;{name}&rdquo;...</span>
                </div>
              )}

              {!mandiLoading && mandiRateDetails && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-300 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <TrendingUp className="w-4 h-4 text-amber-700" />
                      <span>Live Mandi Market Rate (APMC / AGMARKNET)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ● Live Agmarknet Feed
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/60">
                    <div>
                      <p className="font-bold text-stone-800 text-sm">
                        {mandiRateDetails.crop} {mandiRateDetails.variety ? <span className="font-normal text-stone-600 text-xs">({mandiRateDetails.variety})</span> : null}
                      </p>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        {mandiRateDetails.mandi}, {mandiRateDetails.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-amber-900 leading-tight">
                        ₹{mandiRateDetails.modal_price} <span className="text-xs font-medium text-stone-600">/ {unit || 'kg'}</span>
                      </div>
                      <p className="text-[10px] text-stone-500">
                        Market Range: ₹{mandiRateDetails.min_price} – ₹{mandiRateDetails.max_price}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-stone-600">
                      Mandi Trend: <strong className="text-stone-800">{mandiRateDetails.trend || 'STABLE'}</strong> ({mandiRateDetails.pct_change ? `${mandiRateDetails.pct_change > 0 ? '+' : ''}${mandiRateDetails.pct_change}%` : 'Daily average'})
                    </span>
                    <button
                      type="button"
                      onClick={() => setPrice(mandiRateDetails.modal_price)}
                      className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-[11px] font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Use Mandi Rate (₹{mandiRateDetails.modal_price})</span>
                    </button>
                  </div>
                </div>
              )}

              {!name.trim() && (
                <p className="text-[11px] text-stone-500 flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
                  <span>💡</span>
                  <span>Enter crop name (e.g. <strong>Mango</strong>, <strong>Tomato</strong>, <strong>Onion</strong>, <strong>Wheat</strong>, <strong>Chilli</strong>) to instantly get the current Mandi price.</span>
                </p>
              )}

              {/* Category and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Category *</label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-emerald-600"
                  >
                    <option value="" disabled>-- Select Category --</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains">Grains & Pulses</option>
                    <option value="Spices">Spices</option>
                    <option value="Other">Other Fresh Produce</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Unit of Measurement *</label>
                  <select
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg bg-white outline-none focus:border-emerald-600"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="quintal">Quintal (100 kg)</option>
                    <option value="box">Crate / Box</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
              </div>

              {/* Quantity and Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Available Quantity *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 100"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Farmer Price (₹ per {unit}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Harvest Date and Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Harvest Date *</label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                  />
                  <span className="text-[10px] text-stone-500">Calculates preservation & remaining shelf life</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Farm Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Farm location or village"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Organic Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="organic-check"
                  checked={organic}
                  onChange={(e) => setOrganic(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-stone-300 focus:ring-emerald-500"
                />
                <label htmlFor="organic-check" className="text-xs font-bold text-stone-800 flex items-center gap-1 cursor-pointer">
                  <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                  Chemical-Free / Organic Certified Produce
                </label>
              </div>

              {/* Product Image Upload (Requirement: Real device upload with preview) */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Produce Image (Upload from device) *
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition bg-stone-50/50 flex flex-col items-center justify-center"
                >
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img src={imagePreview} alt="Preview" className="h-28 w-auto mx-auto rounded-lg object-cover shadow-xs" />
                      <p className="text-[11px] text-emerald-700 font-semibold">Click to choose a different photo</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-stone-400 mb-1" />
                      <p className="text-xs font-semibold text-stone-700">Click to upload photo from your device</p>
                      <p className="text-[10px] text-stone-500">Supports JPG, PNG, WEBP (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Description & Quality Notes
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Freshly hand-picked early morning, grade-A firmness, sorted and graded without wax."
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition disabled:bg-stone-300 cursor-pointer"
                >
                  {submitting ? 'Uploading Listing...' : 'Publish to Marketplace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FPO PRODUCE LOT MODAL */}
      {showCreateLotModal && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8 border border-stone-100 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900 font-['Outfit']">Create Graded FPO Produce Lot</h3>
                  <p className="text-xs text-stone-500">Aggregate high-volume farm produce for verified institutional procurement</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateLotModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="space-y-4 pt-4 text-xs">
              {/* Crop & Variety */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={lotCropName}
                    onChange={(e) => setLotCropName(e.target.value)}
                    placeholder="e.g. Tomato, Onion, Wheat"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Variety / Hybrid</label>
                  <input
                    type="text"
                    value={lotVariety}
                    onChange={(e) => setLotVariety(e.target.value)}
                    placeholder="e.g. Hybrid Shivam Red, Garwa"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* Quantity & Packaging */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Volume *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={lotQuantity}
                    onChange={(e) => setLotQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Unit</label>
                  <select
                    value={lotUnit}
                    onChange={(e) => setLotUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white outline-none focus:border-emerald-600 font-medium"
                  >
                    <option value="Quintal">Quintal (100 kg)</option>
                    <option value="Tonne">Tonne (1000 kg)</option>
                    <option value="Crates">Crates</option>
                    <option value="Bags">Bags (50 kg)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Base Price (₹/Unit) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={lotBasePrice}
                    onChange={(e) => setLotBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 3500"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* Packaging & FPO Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Packaging Standard</label>
                  <input
                    type="text"
                    value={lotPackaging}
                    onChange={(e) => setLotPackaging(e.target.value)}
                    placeholder="e.g. Plastic Crates (25kg), Jute Bags"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">FPO / Farm Society Name</label>
                  <input
                    type="text"
                    value={lotFpoName}
                    onChange={(e) => setLotFpoName(e.target.value)}
                    placeholder="e.g. Sahyadri Farmers Producer Co."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* Harvest Date & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Harvest Date</label>
                  <input
                    type="date"
                    value={lotHarvestDate}
                    onChange={(e) => setLotHarvestDate(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Aggregation Hub / Location</label>
                  <input
                    type="text"
                    value={lotLocation}
                    onChange={(e) => setLotLocation(e.target.value)}
                    placeholder="e.g. Lasalgaon, Nashik"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* FPO Multi-Farmer Aggregation (2 or More Farmers Combined) */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                      <Users className="w-4 h-4 text-amber-700" /> FPO Member Farmers Aggregation (2+ Farmers Combined)
                    </span>
                    <p className="text-[10px] text-amber-800 mt-0.5">
                      Cooperative pooling combines produce from multiple farmers into a single commercial lot
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-full">
                    {lotMemberFarmers.length} Farmers Contributing
                  </span>
                </div>

                <div className="space-y-2">
                  {lotMemberFarmers.map((mf, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-lg border border-amber-200 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-700 flex items-center gap-1">
                          <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[9px] font-bold">
                            {idx + 1}
                          </span>
                          Farmer #{idx + 1} {idx === 0 ? '(Lead Aggregator)' : '(Participating Member)'}
                        </span>
                        {lotMemberFarmers.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setLotMemberFarmers(lotMemberFarmers.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 font-medium text-[10px]"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-stone-500 text-[10px] mb-0.5">Farmer Name *</label>
                          <input
                            type="text"
                            required
                            value={mf.farmer_name}
                            onChange={(e) => {
                              const updated = [...lotMemberFarmers];
                              updated[idx].farmer_name = e.target.value;
                              setLotMemberFarmers(updated);
                            }}
                            placeholder="Full name"
                            className="w-full px-2 py-1 border border-stone-300 rounded bg-stone-50/50"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 text-[10px] mb-0.5">Contributed Volume ({lotUnit}) *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={mf.contributed_quantity}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              const updated = [...lotMemberFarmers];
                              updated[idx].contributed_quantity = val;
                              setLotMemberFarmers(updated);
                              // Auto-update total lot quantity
                              const sum = updated.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0);
                              setLotQuantity(sum);
                            }}
                            placeholder="Qty"
                            className="w-full px-2 py-1 border border-stone-300 rounded bg-stone-50/50 font-bold text-emerald-800"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-500 text-[10px] mb-0.5">Village / Sub-Cluster</label>
                          <input
                            type="text"
                            value={mf.farm_location || ''}
                            onChange={(e) => {
                              const updated = [...lotMemberFarmers];
                              updated[idx].farm_location = e.target.value;
                              setLotMemberFarmers(updated);
                            }}
                            placeholder="e.g. Niphad Valley"
                            className="w-full px-2 py-1 border border-stone-300 rounded bg-stone-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLotMemberFarmers([
                        ...lotMemberFarmers,
                        {
                          farmer_name: `Member Farmer #${lotMemberFarmers.length + 1}`,
                          contributed_quantity: 15,
                          unit: lotUnit,
                          farm_location: lotLocation || 'Sub-Cluster Hub',
                          phone: '+91 98220 00000'
                        }
                      ]);
                      const newSum = lotMemberFarmers.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0) + 15;
                      setLotQuantity(newSum);
                    }}
                    className="text-amber-800 hover:text-amber-950 font-bold text-[11px] flex items-center gap-1 bg-amber-100 hover:bg-amber-200/80 px-2.5 py-1 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Contributing Farmer
                  </button>
                  <span className="text-[11px] font-bold text-amber-950">
                    Combined Total: {lotMemberFarmers.reduce((acc, curr) => acc + (Number(curr.contributed_quantity) || 0), 0)} {lotUnit}
                  </span>
                </div>
              </div>

              {/* Quality Grading Specs */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" /> Quality Grading & Lab Parameters
                  </span>
                  <select
                    value={lotGrade}
                    onChange={(e) => setLotGrade(e.target.value as QualityGrade)}
                    className="px-2.5 py-1 border border-stone-300 rounded-lg bg-white font-bold text-xs text-emerald-800"
                  >
                    <option value="Grade-A">Grade-A (Premium)</option>
                    <option value="Export-Grade">Export-Grade (Highest Quality)</option>
                    <option value="Grade-B">Grade-B (Commercial Standard)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>
                    <label className="block text-stone-600 font-medium mb-0.5">Moisture (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lotMoisture}
                      onChange={(e) => setLotMoisture(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-0.5">Defect Rate (&lt; %)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={lotDefect}
                      onChange={(e) => setLotDefect(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 font-medium mb-0.5">Color Uniformity (%)</label>
                    <input
                      type="number"
                      step="1"
                      value={lotColorUniformity}
                      onChange={(e) => setLotColorUniformity(Number(e.target.value))}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 font-medium mb-0.5 text-[11px]">Certifying Testing Lab</label>
                  <input
                    type="text"
                    value={lotCertifiedBy}
                    onChange={(e) => setLotCertifiedBy(e.target.value)}
                    placeholder="e.g. Agmark Quality Lab Nashik, MSAMB Quality Cell"
                    className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              {/* Submit / Cancel */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateLotModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLot}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition disabled:bg-stone-300 cursor-pointer"
                >
                  {creatingLot ? 'Creating Graded Lot...' : 'Publish Produce Lot & Match Buyers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
