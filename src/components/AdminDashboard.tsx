import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Package, ShoppingBag, IndianRupee, Warehouse, 
  FileText, AlertTriangle, CheckCircle, RefreshCw, Eye, Truck, FilePlus, Filter,
  ShieldCheck, Building2, Check, X, Phone, Mail, MapPin, CheckCircle2, XCircle,
  Database, Cloud, HardDrive, Lock, Send, ArrowDownLeft, Clock
} from 'lucide-react';
import { User, Product, Order, Dispute, LanguageCode, CustomerRequirement, StorageBooking, VerifiedBuyer, DigitalContract } from '../types';
import { api } from '../api';
import { translations } from '../translations';
import { LiveTrackingModal } from './LiveTrackingModal';

interface AdminDashboardProps {
  user: User;
  language: LanguageCode;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, language }) => {
  const t = translations[language];
  const [overview, setOverview] = useState<any>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'requirements' | 'storage' | 'users' | 'buyers' | 'disputes' | 'escrow'>('overview');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [storageBookings, setStorageBookings] = useState<StorageBooking[]>([]);
  const [buyersList, setBuyersList] = useState<VerifiedBuyer[]>([]);
  const [monetization, setMonetization] = useState<any>(null);
  const [contractsList, setContractsList] = useState<DigitalContract[]>([]);
  const [escrowFilter, setEscrowFilter] = useState<'ALL' | 'PENDING' | 'HELD' | 'DELIVERY_CONFIRMED' | 'RELEASED' | 'REFUNDED'>('ALL');
  const [escrowActionLoading, setEscrowActionLoading] = useState<string | null>(null);
  const [escrowActionMsg, setEscrowActionMsg] = useState<string | null>(null);
  const [rejectingContract, setRejectingContract] = useState<DigitalContract | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [buyerFilter, setBuyerFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [verifyingBuyerId, setVerifyingBuyerId] = useState<string | null>(null);
  const [buyerActionMsg, setBuyerActionMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cloud Database state
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [dbSyncMsg, setDbSyncMsg] = useState<string | null>(null);

  // Live tracking modal for Admin
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);

  // Order status filter
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('ALL');

  // Resolution modal
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  // Order status update in progress
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  const fetchAdminData = async (isFirstLoad = false) => {
    try {
      if (isFirstLoad) setLoading(true);
      const [over, uList, dList, rList, sList, bList, mData, dbStat, cList] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getDisputes(),
        api.getRequirements(),
        api.getStorageBookings(),
        api.getAdminBuyers().catch(() => []),
        api.getAdminMonetization().catch(() => null),
        api.getDbStatus().catch(() => null),
        api.getContracts().catch(() => [])
      ]);
      setOverview(over);
      setUsersList(uList.users || []);
      setDisputes(dList || []);
      setRequirements(rList || []);
      setStorageBookings(sList || []);
      setBuyersList(bList || []);
      setMonetization(mData);
      if (dbStat) setDbStatus(dbStat);
      if (cList && cList.length > 0) {
        setContractsList(cList);
      } else if (mData?.contracts) {
        setContractsList(mData.contracts);
      }
    } catch (err) {
      console.error("Admin sync error:", err);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  };

  const handleApproveEscrow = async (contractId: string) => {
    setEscrowActionLoading(contractId);
    setEscrowActionMsg(null);
    try {
      const res = await api.adminApproveContractEscrow(contractId, "Escrow verified and accepted by Admin. Guaranteed payout locked in vault.");
      setEscrowActionMsg(`✓ Contract #${contractId} Escrow Accepted! Funds safely locked in vault & Farmer received Escrow FPO Guarantee Popup.`);
      await fetchAdminData(false);
    } catch (err: any) {
      setEscrowActionMsg(`⚠️ ${err.message || 'Failed to approve escrow'}`);
    } finally {
      setEscrowActionLoading(null);
    }
  };

  const handleOpenRejectModal = (contract: DigitalContract) => {
    setRejectingContract(contract);
    setRejectReasonInput('Deposit verification mismatch / Escrow rejected by Admin.');
  };

  const handleConfirmRejectEscrow = async () => {
    if (!rejectingContract) return;
    setEscrowActionLoading(rejectingContract.id);
    try {
      const res = await api.adminRejectContractEscrow(rejectingContract.id, rejectReasonInput);
      setEscrowActionMsg(`↩️ Contract #${rejectingContract.id} Escrow Rejected. ₹${(rejectingContract.escrow_amount || 0).toLocaleString('en-IN')} refunded back to Verified Buyer.`);
      setRejectingContract(null);
      await fetchAdminData(false);
    } catch (err: any) {
      setEscrowActionMsg(`⚠️ ${err.message || 'Failed to reject escrow'}`);
    } finally {
      setEscrowActionLoading(null);
    }
  };

  const handleReleasePayout = async (contractId: string) => {
    setEscrowActionLoading(contractId);
    setEscrowActionMsg(null);
    try {
      const res = await api.adminReleaseContractPayout(contractId);
      setEscrowActionMsg(`💰 Payout for Contract #${contractId} successfully transferred to Farmer's account!`);
      await fetchAdminData(false);
    } catch (err: any) {
      setEscrowActionMsg(`⚠️ ${err.message || 'Failed to release payout'}`);
    } finally {
      setEscrowActionLoading(null);
    }
  };

  useEffect(() => {
    fetchAdminData(true);
    const interval = setInterval(() => fetchAdminData(false), 3000); // Live 3-second sync without screen freeze
    return () => clearInterval(interval);
  }, []);

  const handleVerifyBuyer = async (buyerId: string) => {
    setVerifyingBuyerId(buyerId);
    setBuyerActionMsg(null);
    // Optimistic UI state update
    setBuyersList(prev => prev.map(b => b.id === buyerId ? { ...b, verified: true, status: 'VERIFIED' } : b));
    try {
      const res = await api.verifyBuyer(buyerId);
      if (res.buyer) {
        setBuyersList(prev => prev.map(b => (b.id === buyerId || b.id === res.buyer.id) ? { ...b, ...res.buyer, verified: true, status: 'VERIFIED' } : b));
      }
      setBuyerActionMsg(`✓ Buyer "${res.buyer?.company_name || 'Organization'}" successfully verified and approved for FPO matching!`);
    } catch (err: any) {
      setBuyerActionMsg(`⚠️ ${err.message || 'Failed to verify buyer'}`);
    } finally {
      setVerifyingBuyerId(null);
      setTimeout(() => fetchAdminData(false), 600);
    }
  };

  const handleRejectBuyer = async (buyerId: string) => {
    setVerifyingBuyerId(buyerId);
    setBuyerActionMsg(null);
    // Optimistic UI state update
    setBuyersList(prev => prev.map(b => b.id === buyerId ? { ...b, verified: false, status: 'REJECTED' } : b));
    try {
      const res = await api.rejectBuyer(buyerId);
      if (res.buyer) {
        setBuyersList(prev => prev.map(b => (b.id === buyerId || b.id === res.buyer.id) ? { ...b, ...res.buyer, verified: false, status: 'REJECTED' } : b));
      }
      setBuyerActionMsg(`✕ Buyer "${res.buyer?.company_name || 'Organization'}" status set to REJECTED.`);
    } catch (err: any) {
      setBuyerActionMsg(`⚠️ ${err.message || 'Failed to reject buyer'}`);
    } finally {
      setVerifyingBuyerId(null);
      setTimeout(() => fetchAdminData(false), 600);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await fetchAdminData(false);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !resolutionNote.trim()) return;
    setIsResolving(true);
    try {
      await api.resolveDispute(selectedDispute.id, resolutionNote.trim());
      setSelectedDispute(null);
      setResolutionNote('');
      fetchAdminData(false);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve dispute');
    } finally {
      setIsResolving(false);
    }
  };

  const handleManualDbSync = async () => {
    setIsSyncingDb(true);
    setDbSyncMsg(null);
    try {
      const res = await api.syncDb();
      if (res.status) setDbStatus(res.status);
      setDbSyncMsg("✓ Synced with database!");
    } catch (err: any) {
      setDbSyncMsg(`⚠️ Sync failed: ${err.message}`);
    } finally {
      setIsSyncingDb(false);
      setTimeout(() => setDbSyncMsg(null), 4000);
    }
  };

  const allOrders: Order[] = overview?.recent_orders || [];
  const filteredOrders = orderStatusFilter === 'ALL' 
    ? allOrders 
    : allOrders.filter(o => o.status === orderStatusFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-900 to-stone-800 rounded-2xl p-6 text-white shadow-md mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-red-600/80 text-[10px] font-bold tracking-wider uppercase">
              Super Admin Authority
            </span>
            <span className="text-stone-400 text-xs">Live System Health: 100% Operational</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1 font-['Outfit']">
            Platform Master Console
          </h1>
          <p className="text-stone-300 text-xs sm:text-sm mt-0.5">
            Administer multi-device sync, database state, verified farmers, disputes, and logistics escrow.
          </p>
        </div>

        <button
          onClick={() => fetchAdminData()}
          className="px-4 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs flex items-center gap-2 transition self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Cloud Database & Persistent Storage Status Banner */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 sm:p-5 mb-6 border border-stone-800 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              dbStatus?.provider === 'mongodb' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : dbStatus?.provider === 'postgres' 
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {dbStatus?.provider === 'mongodb' ? (
                <Cloud className="w-5 h-5" />
              ) : dbStatus?.provider === 'postgres' ? (
                <Database className="w-5 h-5" />
              ) : (
                <HardDrive className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm font-['Outfit']">Database Persistence:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                  dbStatus?.connected 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {dbStatus?.provider === 'mongodb' ? 'MongoDB Atlas (Cloud)' : dbStatus?.provider === 'postgres' ? 'PostgreSQL (Cloud)' : 'Local File Storage'}
                </span>
                {dbStatus?.counts && (
                  <span className="text-[11px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-md font-mono">
                    {dbStatus.counts.users} Users • {dbStatus.counts.products} Products • {dbStatus.counts.orders} Orders
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300 mt-1">
                {dbStatus?.statusMessage || 'Checking database connection...'}
                {dbStatus?.lastSyncedAt && (
                  <span className="text-stone-400 ml-2 text-[11px]">
                    • Last synced: {new Date(dbStatus.lastSyncedAt).toLocaleTimeString()}
                  </span>
                )}
              </p>
              {dbStatus?.provider === 'local' && (
                <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/60 px-3 py-1.5 rounded-lg border border-amber-800/60">
                  💡 <strong>To persist data across Render redeploys:</strong> Add <code className="bg-stone-800 px-1 py-0.5 rounded text-amber-200">MONGODB_URI</code> or <code className="bg-stone-800 px-1 py-0.5 rounded text-amber-200">DATABASE_URL</code> in Render Environment Variables.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            {dbSyncMsg && (
              <span className="text-xs font-semibold text-emerald-400">{dbSyncMsg}</span>
            )}
            <button
              onClick={handleManualDbSync}
              disabled={isSyncingDb}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncingDb ? 'Syncing...' : 'Sync Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Total Registered Users</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{overview?.users_count ?? usersList.length}</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Farmers: {overview?.farmers_count ?? 0} • Customers: {overview?.customers_count ?? 0}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Active Marketplace Produce</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{overview?.active_products_count ?? 0}</span>
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Live listings across all mandis</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Total Orders Processed</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-stone-900">{overview?.orders_count ?? 0}</span>
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Direct farm-to-doorstep orders</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs">
          <p className="text-xs font-semibold text-stone-500 mb-1">Gross Merchandise Value (GMV)</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-800">₹{overview?.total_gmv ?? 0}</span>
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">
            Logistics fees: ₹{overview?.total_delivery_fees ?? 0}
          </p>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-1 border-b border-stone-200 mb-6 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
            activeView === 'overview' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Recent Activity & Orders ({allOrders.length})
        </button>
        <button
          onClick={() => setActiveView('requirements')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeView === 'requirements' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FilePlus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Customer Demands ({requirements.length})</span>
        </button>
        <button
          onClick={() => setActiveView('storage')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeView === 'storage' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Warehouse className="w-3.5 h-3.5 text-teal-600" />
          <span>Cold Storage Bookings ({storageBookings.length})</span>
        </button>
        <button
          onClick={() => setActiveView('users')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition shrink-0 ${
            activeView === 'users' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          User Accounts Directory ({usersList.length})
        </button>
        <button
          onClick={() => setActiveView('buyers')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeView === 'buyers' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Buyer Verification ({buyersList.filter(b => b.status === 'PENDING_VERIFICATION' || (!b.verified && b.status !== 'REJECTED')).length} Pending)</span>
        </button>
        <button
          onClick={() => setActiveView('disputes')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeView === 'disputes' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Grievance Desk ({disputes.length})</span>
        </button>
        <button
          onClick={() => setActiveView('escrow')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeView === 'escrow' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          <span>Contracts Escrow & Monetization</span>
          {contractsList.filter(c => c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status)).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white animate-pulse">
              {contractsList.filter(c => c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status)).length} Action
            </span>
          )}
        </button>
      </div>

      {/* VIEW 1: RECENT ORDERS WITH LIVE STATUS CONTROLS & GPS */}
      {activeView === 'overview' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Live Orders & Multi-Device Dispatch Stream</h3>
              <p className="text-[11px] text-stone-500">
                Admins can directly advance shipment stages or track live GPS driver coordinates.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-500 font-semibold text-[11px] mr-1">Filter:</span>
              {['ALL', 'ORDERED', 'ACCEPTED', 'PREPARING', 'TRANSIT', 'DELIVERED'].map(st => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    orderStatusFilter === st
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100/70 text-stone-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Produce & Qty</th>
                  <th className="px-4 py-3">Logistics Fee</th>
                  <th className="px-4 py-3">Grand Total</th>
                  <th className="px-4 py-3">Current Status</th>
                  <th className="px-4 py-3">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((o: any) => (
                    <tr key={o.id} className="hover:bg-stone-50 transition">
                      <td className="px-4 py-3 font-mono font-bold text-stone-800">#{o.id}</td>
                      <td className="px-4 py-3 text-stone-800 font-medium">
                        <div>{o.customer_name}</div>
                        <div className="text-[10px] text-stone-400 truncate max-w-[140px]">{o.delivery_address}</div>
                      </td>
                      <td className="px-4 py-3 text-stone-800 font-medium">{o.farmer_name}</td>
                      <td className="px-4 py-3 font-medium">
                        {o.quantity} {o.unit} {o.product_name}
                      </td>
                      <td className="px-4 py-3 text-stone-600">
                        <div>{o.distance_km} km</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">₹{o.delivery_charge} fee</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-800">₹{o.grand_total}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          o.status === 'TRANSIT' ? 'bg-blue-100 text-blue-800' :
                          o.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                          o.status === 'ACCEPTED' ? 'bg-teal-100 text-teal-800' :
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Live status selector */}
                          <select
                            value={o.status}
                            disabled={updatingOrderId === o.id}
                            onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                            className="px-2 py-1 border border-stone-300 rounded-lg text-[11px] font-semibold bg-white outline-none focus:border-stone-900 cursor-pointer"
                          >
                            <option value="ORDERED">ORDERED</option>
                            <option value="ACCEPTED">ACCEPTED</option>
                            <option value="PREPARING">PREPARING</option>
                            <option value="TRANSIT">TRANSIT</option>
                            <option value="DELIVERED">DELIVERED</option>
                          </select>

                          {/* Track GPS button */}
                          <button
                            onClick={() => setTrackingOrder(o)}
                            title="Inspect Live Truck GPS"
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                      No orders found under {orderStatusFilter} filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMER REQUIREMENTS / DEMAND POOL */}
      {activeView === 'requirements' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Direct Customer Demands & Procurement Pool</h3>
              <p className="text-[11px] text-stone-500">Track which crop requirements are pending or fulfilled by local farmers.</p>
            </div>
            <button
              onClick={() => fetchAdminData(false)}
              className="px-3 py-1 text-xs font-semibold rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100/70 text-stone-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Req ID</th>
                  <th className="px-4 py-3">Buyer Name</th>
                  <th className="px-4 py-3">Crop Needed</th>
                  <th className="px-4 py-3">Quantity & Unit</th>
                  <th className="px-4 py-3">Expected Rate</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Needed By</th>
                  <th className="px-4 py-3">Status / Assigned Farmer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {requirements.length > 0 ? (
                  requirements.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 font-mono font-bold text-stone-800">#{r.id}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">
                        <div>{r.customer_name}</div>
                        <div className="text-[10px] text-stone-400">{r.customer_phone}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-800">{r.crop_name}</td>
                      <td className="px-4 py-3 font-medium">{r.required_quantity} {r.unit}</td>
                      <td className="px-4 py-3 font-bold text-emerald-800">₹{r.expected_price} / {r.unit}</td>
                      <td className="px-4 py-3 text-stone-600 truncate max-w-[160px]">{r.delivery_address}</td>
                      <td className="px-4 py-3 text-stone-500 font-medium">{r.needed_by_date}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status === 'ACCEPTED' ? `Claimed by ${r.accepted_by_farmer_name || 'Farmer'}` : 'OPEN'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                      No customer demands recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: STORAGE & LOGISTICS BOOKINGS */}
      {activeView === 'storage' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-stone-900">National Cold Storage & Agro-Warehouse Reservations</h3>
              <p className="text-[11px] text-stone-500">Capacity reservations across 14+ audited pan-India facilities.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100/70 text-stone-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Reserved By</th>
                  <th className="px-4 py-3">Facility Name</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Produce Stored</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Total Cost</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {storageBookings.length > 0 ? (
                  storageBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 font-mono font-bold text-stone-800">#{b.id}</td>
                      <td className="px-4 py-3 font-semibold text-stone-900">{b.user_name}</td>
                      <td className="px-4 py-3 font-medium text-stone-800">{b.facility_name}</td>
                      <td className="px-4 py-3 text-stone-600">{b.location}</td>
                      <td className="px-4 py-3 font-bold text-stone-800">{b.produce_type}</td>
                      <td className="px-4 py-3">{b.quantity_quintal} quintal</td>
                      <td className="px-4 py-3">{b.duration_days} days (From {b.start_date})</td>
                      <td className="px-4 py-3 font-bold text-teal-800">₹{b.total_cost}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-stone-400">
                      No storage bookings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: USERS DIRECTORY */}
      {activeView === 'users' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100/70 text-stone-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">User Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">Location / Farm</th>
                  <th className="px-4 py-3">Registered At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50">
                    <td className="px-4 py-3 font-mono text-stone-500">#{u.id}</td>
                    <td className="px-4 py-3 font-bold text-stone-900">{u.full_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'farmer' ? 'bg-emerald-100 text-emerald-800' :
                        u.role === 'customer' ? 'bg-teal-100 text-teal-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      <div>{u.email}</div>
                      <div className="text-[10px] text-stone-400">{u.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-700">
                      {u.farm_name ? `${u.farm_name} (${u.location})` : u.location}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: BUYER VERIFICATION & ACCEPTANCE DESK */}
      {activeView === 'buyers' && (
        <div className="space-y-6 text-left">
          {buyerActionMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{buyerActionMsg}</span>
              </div>
              <button onClick={() => setBuyerActionMsg(null)} className="text-stone-400 hover:text-stone-700 cursor-pointer">✕</button>
            </div>
          )}

          {/* Desk Banner */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-bold text-stone-900 font-['Outfit']">
                  Institutional Buyer Verification & KYC Desk
                </h3>
              </div>
              <p className="text-xs text-stone-500 mt-1 max-w-2xl">
                When new corporate buyers or retail chains create accounts, they enter this verification queue. Verify GSTIN credentials and approve their account to allow them to bid and match with Farmer FPO produce lots.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl shrink-0 self-start md:self-auto">
              <button
                onClick={() => setBuyerFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  buyerFilter === 'ALL' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({buyersList.length})
              </button>
              <button
                onClick={() => setBuyerFilter('PENDING')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  buyerFilter === 'PENDING' ? 'bg-white text-amber-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Pending ({buyersList.filter(b => b.status === 'PENDING_VERIFICATION' || (!b.verified && b.status !== 'REJECTED')).length})
              </button>
              <button
                onClick={() => setBuyerFilter('VERIFIED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  buyerFilter === 'VERIFIED' ? 'bg-white text-emerald-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Verified ({buyersList.filter(b => b.status === 'VERIFIED' && b.verified).length})
              </button>
              <button
                onClick={() => setBuyerFilter('REJECTED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  buyerFilter === 'REJECTED' ? 'bg-white text-red-800 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Rejected ({buyersList.filter(b => b.status === 'REJECTED').length})
              </button>
            </div>
          </div>

          {/* Buyers Grid */}
          {(() => {
            const filteredBuyers = buyersList.filter(b => {
              if (buyerFilter === 'PENDING') return b.status === 'PENDING_VERIFICATION' || (!b.verified && b.status !== 'REJECTED');
              if (buyerFilter === 'VERIFIED') return b.verified && b.status === 'VERIFIED';
              if (buyerFilter === 'REJECTED') return b.status === 'REJECTED';
              return true;
            });

            if (filteredBuyers.length === 0) {
              return (
                <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
                  <ShieldCheck className="w-12 h-12 text-stone-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-stone-800">No buyer accounts in this filter view.</h4>
                  <p className="text-xs text-stone-500 mt-1">
                    When buyers register via the portal, their verification applications will appear here.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredBuyers.map((b) => {
                  const isPending = b.status === 'PENDING_VERIFICATION' || (!b.verified && b.status !== 'REJECTED');
                  const isVerified = b.verified && b.status === 'VERIFIED';
                  const isRejected = b.status === 'REJECTED';
                  const isProcessing = verifyingBuyerId === b.id;

                  return (
                    <div
                      key={b.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                        isPending 
                          ? 'border-amber-300 ring-2 ring-amber-100' 
                          : isVerified 
                            ? 'border-emerald-300' 
                            : 'border-stone-200'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-stone-800 shrink-0" />
                              <h4 className="text-base font-bold text-stone-900">{b.company_name}</h4>
                            </div>
                            <p className="text-xs text-stone-500 font-medium">{b.buyer_type}</p>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            isVerified 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                              : isPending 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {isVerified ? '✓ VERIFIED & APPROVED' : isPending ? '● PENDING VERIFICATION' : '✕ REJECTED'}
                          </span>
                        </div>

                        {/* Procurement Demands */}
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Demanded Crop:</span>
                            <span className="font-bold text-stone-900">{b.demand_crop} ({b.demand_grade})</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-500">Target Volume:</span>
                            <span className="font-bold text-stone-900">{b.target_volume_quintal} {b.unit}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                            <span className="text-stone-500">Procurement Budget:</span>
                            <span className="font-bold text-emerald-800">₹{b.procurement_price} / {b.unit}</span>
                          </div>
                        </div>

                        {/* Verification & Legal details */}
                        <div className="text-xs text-stone-600 space-y-1 pt-1">
                          <p className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-stone-400" /> Sourcing Manager: <strong className="text-stone-800">{b.contact_person}</strong>
                          </p>
                          {b.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-stone-400" /> {b.phone}
                            </p>
                          )}
                          {b.email && (
                            <p className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-stone-400" /> {b.email}
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" /> Logistics Hub: {b.location}
                          </p>
                          {b.gstin && (
                            <p className="font-mono text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                              GSTIN: <span className="font-bold text-stone-800">{b.gstin}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-4 mt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => handleRejectBuyer(b.id)}
                              disabled={isProcessing}
                              className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" /> Reject
                            </button>
                            <button
                              onClick={() => handleVerifyBuyer(b.id)}
                              disabled={isProcessing}
                              className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-stone-300"
                            >
                              <Check className="w-4 h-4" /> {isProcessing ? 'Verifying...' : 'Verify & Accept Buyer'}
                            </button>
                          </>
                        ) : isVerified ? (
                          <div className="w-full flex items-center justify-between text-xs">
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Active on FPO Marketplace
                            </span>
                            <button
                              onClick={() => handleRejectBuyer(b.id)}
                              disabled={isProcessing}
                              className="px-2.5 py-1 text-[11px] text-stone-400 hover:text-red-700 hover:underline cursor-pointer"
                            >
                              Revoke Verification
                            </button>
                          </div>
                        ) : (
                          <div className="w-full flex items-center justify-between text-xs">
                            <span className="text-red-600 font-medium">Application Rejected</span>
                            <button
                              onClick={() => handleVerifyBuyer(b.id)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 cursor-pointer"
                            >
                              Re-evaluate & Verify
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* VIEW 3: DISPUTES & GRIEVANCE DESK (FULLY INFORMED) */}
      {activeView === 'disputes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Grievance & Dispute Resolution Desk</h3>
              <p className="text-xs text-stone-500">
                Detailed complainant & counterparty profiles, contact numbers, order value, and wise escrow mediation
              </p>
            </div>
            <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
              {disputes.filter(d => d.status !== 'RESOLVED').length} Pending • {disputes.filter(d => d.status === 'RESOLVED').length} Settled
            </span>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-stone-800">No open customer or farmer grievances.</h3>
              <p className="text-xs text-stone-500 mt-1">Platform dispute rate is currently 0.0%.</p>
            </div>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4 hover:border-amber-300 transition">
                {/* Header Ticket Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-extrabold bg-stone-900 text-white px-2.5 py-1 rounded-lg">
                      Ticket #{d.id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                    }`}>
                      {d.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Category: {d.reason_category || 'Order Fulfillment & Quality'}
                    </span>
                    {d.order_id && (
                      <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md">
                        Order #{d.order_id}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-stone-400">
                    Filed on {new Date(d.created_at).toLocaleDateString()} at {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Complainant vs Counterparty Informed Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Complainant Card */}
                  <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-rose-200">
                      <span className="font-bold text-rose-950 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-rose-700" />
                        <span>Complainant (Filed Grievance)</span>
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-rose-200 text-rose-900">
                        {d.filed_by_role || 'Customer'}
                      </span>
                    </div>

                    <div className="space-y-1 text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Full Name:</span>
                        <strong className="text-stone-900">{d.filed_by_name}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Mobile Number:</span>
                        {d.filed_by_phone ? (
                          <a href={`tel:${d.filed_by_phone}`} className="font-bold text-emerald-800 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{d.filed_by_phone}</span>
                          </a>
                        ) : (
                          <span className="text-stone-400">Not recorded</span>
                        )}
                      </div>
                      {d.filed_by_email && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Email:</span>
                          <a href={`mailto:${d.filed_by_email}`} className="text-blue-700 hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3 text-blue-500" />
                            <span>{d.filed_by_email}</span>
                          </a>
                        </div>
                      )}
                      {d.filed_by_location && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Location / Address:</span>
                          <span className="text-stone-800 text-right truncate max-w-[200px]">{d.filed_by_location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Counterparty Card */}
                  <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-teal-200">
                      <span className="font-bold text-teal-950 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-teal-700" />
                        <span>Counterparty (Reported Party)</span>
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold uppercase bg-teal-200 text-teal-900">
                        {d.counterparty_role || (d.filed_by_role === 'customer' ? 'Farmer / Seller' : 'Customer')}
                      </span>
                    </div>

                    <div className="space-y-1 text-stone-700">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Name:</span>
                        <strong className="text-stone-900">{d.counterparty_name || 'Assigned Seller'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-stone-500">Mobile Number:</span>
                        {d.counterparty_phone ? (
                          <a href={`tel:${d.counterparty_phone}`} className="font-bold text-emerald-800 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{d.counterparty_phone}</span>
                          </a>
                        ) : (
                          <span className="text-stone-400">Available on Order Dispatch</span>
                        )}
                      </div>
                      {d.counterparty_location && (
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Farm / Location:</span>
                          <span className="text-stone-800 text-right truncate max-w-[200px]">{d.counterparty_location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linked Transaction / Order Summary */}
                {d.order_id && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-stone-500">Produce: </span>
                      <strong className="text-stone-900">{d.product_name || 'Farm Lot Item'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Order Amount: </span>
                      <strong className="text-emerald-800">₹{d.order_amount ?? 'Verified'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-500">Payment Channel: </span>
                      <strong className="text-stone-900">{d.payment_method || 'Escrow / UPI'}</strong>
                    </div>
                  </div>
                )}

                {/* Grievance Subject & Description */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <span>Issue:</span>
                    <span>{d.subject}</span>
                  </h4>
                  <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/80 p-3 rounded-xl border border-stone-200/80">
                    {d.description}
                  </p>
                </div>

                {/* Resolution Badge or Resolve Button */}
                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  {d.resolution ? (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex-1">
                      <strong>✓ Official Admin Resolution:</strong> {d.resolution}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => {
                          setSelectedDispute(d);
                          setResolutionNote('Full refund processed to customer via Escrow Desk. Farmer retained product return voucher.');
                        }}
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Resolve Grievance Wisely</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW 4: DIGITAL CONTRACTS ESCROW & MONETIZATION DESK */}
      {activeView === 'escrow' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-stone-900 font-['Outfit']">Digital Contracts Escrow & Monetization Desk</h3>
              </div>
              <p className="text-xs text-stone-500 mt-1">Review buyer escrow deposits, accept or reject escrow into vault, send money to farmers upon verified delivery, or issue refunds.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-stone-500">Live Contracts: {contractsList.length}</span>
            </div>
          </div>

          {/* Action Notification Banner */}
          {escrowActionMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{escrowActionMsg}</span>
              </div>
              <button onClick={() => setEscrowActionMsg(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">✕</button>
            </div>
          )}

          {/* Enhanced Escrow KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Awaiting Admin Approval */}
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                ⏳ Awaiting Review
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-amber-900">
                  {contractsList.filter(c => c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status)).length}
                </span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-[10px] text-amber-700 mt-1">Requires Admin Accept/Reject</p>
            </div>

            {/* Held in Vault */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-2xs">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">
                🔒 In Escrow Vault
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-blue-900">
                  {contractsList.filter(c => c.escrow_status === 'HELD_IN_ESCROW' && c.admin_approval_status === 'APPROVED').length}
                </span>
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-[10px] text-blue-700 mt-1">FPO payout guaranteed</p>
            </div>

            {/* Delivery Confirmed by Buyer */}
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 shadow-2xs">
              <span className="text-[10px] font-bold text-purple-900 uppercase tracking-wider block mb-1">
                📦 Buyer Confirmed
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-purple-900">
                  {contractsList.filter(c => c.buyer_confirmed_delivery && c.escrow_status !== 'RELEASED_TO_FARMER').length}
                </span>
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-[10px] text-purple-700 mt-1">Ready for Admin Payout</p>
            </div>

            {/* Settled to Farmer */}
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block mb-1">
                💰 Settled Payouts
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-emerald-900">
                  {contractsList.filter(c => c.escrow_status === 'RELEASED_TO_FARMER' || c.status === 'COMPLETED').length}
                </span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-[10px] text-emerald-700 mt-1">Remitted to Farmers</p>
            </div>

            {/* Refunded to Buyer */}
            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-2xs">
              <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block mb-1">
                ↩️ Refunded
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-rose-900">
                  {contractsList.filter(c => c.escrow_status === 'REFUNDED_TO_BUYER' || c.admin_approval_status === 'REJECTED').length}
                </span>
                <ArrowDownLeft className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-[10px] text-rose-700 mt-1">Returned to Buyers</p>
            </div>

            {/* 1.5% Platform Fee */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block mb-1">
                Platform Monetization
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-black text-purple-900">
                  ₹{monetization?.total_platform_fee_collected ?? monetization?.total_platform_monetization_earned ?? 0}
                </span>
                <IndianRupee className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">1.5% transaction commission</p>
            </div>
          </div>

          {/* Escrow Status Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-stone-500 font-semibold flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </span>
            {[
              { id: 'ALL', label: `All Contracts (${contractsList.length})` },
              { id: 'PENDING', label: `⏳ Awaiting Approval (${contractsList.filter(c => c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status)).length})` },
              { id: 'HELD', label: `🔒 Held in Vault (${contractsList.filter(c => c.escrow_status === 'HELD_IN_ESCROW' && c.admin_approval_status === 'APPROVED').length})` },
              { id: 'DELIVERY_CONFIRMED', label: `📦 Ready for Payout (${contractsList.filter(c => c.buyer_confirmed_delivery && c.escrow_status !== 'RELEASED_TO_FARMER').length})` },
              { id: 'RELEASED', label: `💰 Settled (${contractsList.filter(c => c.escrow_status === 'RELEASED_TO_FARMER' || c.status === 'COMPLETED').length})` },
              { id: 'REFUNDED', label: `↩️ Refunded (${contractsList.filter(c => c.escrow_status === 'REFUNDED_TO_BUYER' || c.admin_approval_status === 'REJECTED').length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEscrowFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition shrink-0 ${
                  escrowFilter === tab.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Contracts Escrow Breakdown Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
              <h4 className="text-sm font-bold text-stone-900">Digital Contracts Escrow Ledger & Execution Controls</h4>
              <span className="text-xs font-semibold text-stone-500">
                Displaying: {
                  contractsList.filter(c => {
                    if (escrowFilter === 'PENDING') return c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status);
                    if (escrowFilter === 'HELD') return c.escrow_status === 'HELD_IN_ESCROW' && c.admin_approval_status === 'APPROVED';
                    if (escrowFilter === 'DELIVERY_CONFIRMED') return c.buyer_confirmed_delivery && c.escrow_status !== 'RELEASED_TO_FARMER';
                    if (escrowFilter === 'RELEASED') return c.escrow_status === 'RELEASED_TO_FARMER' || c.status === 'COMPLETED';
                    if (escrowFilter === 'REFUNDED') return c.escrow_status === 'REFUNDED_TO_BUYER' || c.admin_approval_status === 'REJECTED';
                    return true;
                  }).length
                } contracts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Contract / Commodity</th>
                    <th className="py-3 px-4">Verified Buyer</th>
                    <th className="py-3 px-4">Assigned Farmer</th>
                    <th className="py-3 px-4">Escrow Deposit Details</th>
                    <th className="py-3 px-4">Financials (₹)</th>
                    <th className="py-3 px-4">Escrow Status</th>
                    <th className="py-3 px-4 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {contractsList
                    .filter(c => {
                      if (escrowFilter === 'PENDING') return c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status);
                      if (escrowFilter === 'HELD') return c.escrow_status === 'HELD_IN_ESCROW' && c.admin_approval_status === 'APPROVED';
                      if (escrowFilter === 'DELIVERY_CONFIRMED') return c.buyer_confirmed_delivery && c.escrow_status !== 'RELEASED_TO_FARMER';
                      if (escrowFilter === 'RELEASED') return c.escrow_status === 'RELEASED_TO_FARMER' || c.status === 'COMPLETED';
                      if (escrowFilter === 'REFUNDED') return c.escrow_status === 'REFUNDED_TO_BUYER' || c.admin_approval_status === 'REJECTED';
                      return true;
                    })
                    .length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-stone-400">
                        No contracts found for the selected filter.
                      </td>
                    </tr>
                  ) : (
                    contractsList
                      .filter(c => {
                        if (escrowFilter === 'PENDING') return c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status);
                        if (escrowFilter === 'HELD') return c.escrow_status === 'HELD_IN_ESCROW' && c.admin_approval_status === 'APPROVED';
                        if (escrowFilter === 'DELIVERY_CONFIRMED') return c.buyer_confirmed_delivery && c.escrow_status !== 'RELEASED_TO_FARMER';
                        if (escrowFilter === 'RELEASED') return c.escrow_status === 'RELEASED_TO_FARMER' || c.status === 'COMPLETED';
                        if (escrowFilter === 'REFUNDED') return c.escrow_status === 'REFUNDED_TO_BUYER' || c.admin_approval_status === 'REJECTED';
                        return true;
                      })
                      .map((c: any) => {
                        const totalVal = c.escrow_amount || Math.round((c.required_quantity || 10) * (c.offer_price || 30));
                        const adminFee = c.admin_monetization_fee || Math.round(totalVal * 0.015);
                        const netPayout = c.net_farmer_payout || (totalVal - adminFee);
                        const isPending = c.admin_approval_status === 'PENDING' || (c.escrow_funded && !c.admin_approval_status);
                        const isHeld = c.escrow_status === 'HELD_IN_ESCROW' && c.admin_approval_status === 'APPROVED';
                        const isBuyerConfirmed = c.buyer_confirmed_delivery;
                        const isReleased = c.escrow_status === 'RELEASED_TO_FARMER' || c.status === 'COMPLETED';
                        const isRefunded = c.escrow_status === 'REFUNDED_TO_BUYER' || c.admin_approval_status === 'REJECTED';

                        return (
                          <tr key={c.id} className="hover:bg-stone-50/60 transition">
                            {/* Contract / Commodity */}
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-stone-900 block">#{c.id}</span>
                              <span className="text-stone-800 font-semibold text-[11px] block">{c.crop_name}</span>
                              <span className="text-stone-400 text-[10px]">{c.required_quantity} {c.unit || 'kg'} • ₹{c.offer_price}/{c.unit || 'kg'}</span>
                            </td>

                            {/* Verified Buyer */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-stone-800 block">{c.buyer_name}</span>
                              <span className="text-[10px] text-stone-400 block">{c.buyer_company || 'Corporate Sourcing'}</span>
                              <span className="text-[10px] text-emerald-600 font-medium">✓ Verified Buyer</span>
                            </td>

                            {/* Assigned Farmer */}
                            <td className="py-3 px-4">
                              <span className="font-semibold text-stone-800 block">{c.assigned_farmer_name || 'Assigned Farmer'}</span>
                              <span className="text-[10px] text-stone-400 block">{c.assigned_farmer_phone || c.delivery_location || 'Location verified'}</span>
                              <span className="text-[10px] text-purple-700 font-mono">UPI: {c.assigned_farmer_upi || 'farmer@upi'}</span>
                            </td>

                            {/* Escrow Deposit Details */}
                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  c.escrow_payment_mode === 'SIMULATED_SANDBOX' ? 'bg-indigo-100 text-indigo-800' :
                                  c.escrow_payment_mode === 'UPI_QR' ? 'bg-emerald-100 text-emerald-800' :
                                  'bg-cyan-100 text-cyan-800'
                                }`}>
                                  {c.escrow_payment_mode === 'SIMULATED_SANDBOX' ? '🧪 Sandbox NPCI' :
                                   c.escrow_payment_mode === 'UPI_QR' ? '📱 UPI QR' : '🏦 Bank NEFT'}
                                </span>
                                <div className="text-[10px] font-mono text-stone-600">
                                  Ref: {c.escrow_utr || c.escrow_transaction_id || 'MOCK-UTR-849201'}
                                </div>
                                {c.escrow_deposited_at && (
                                  <div className="text-[9px] text-stone-400">
                                    {new Date(c.escrow_deposited_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Financials */}
                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <div className="font-bold text-stone-900">₹{totalVal.toLocaleString('en-IN')}</div>
                                <div className="text-[10px] text-purple-700 font-medium">Fee: ₹{adminFee.toLocaleString('en-IN')} (1.5%)</div>
                                <div className="text-[10px] text-emerald-700 font-semibold">Net: ₹{netPayout.toLocaleString('en-IN')}</div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pending Admin Review</span>
                                </span>
                              )}
                              {isHeld && !isBuyerConfirmed && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                  <Lock className="w-3 h-3 text-blue-600" />
                                  <span>Locked in Vault</span>
                                </span>
                              )}
                              {isBuyerConfirmed && !isReleased && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                  <CheckCircle className="w-3 h-3 text-purple-600" />
                                  <span>Order Received by Buyer</span>
                                </span>
                              )}
                              {isReleased && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Settled to Farmer</span>
                                </span>
                              )}
                              {isRefunded && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                  <ArrowDownLeft className="w-3 h-3 text-rose-600" />
                                  <span>Refunded to Buyer</span>
                                </span>
                              )}
                            </td>

                            {/* Admin Action */}
                            <td className="py-3 px-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleApproveEscrow(c.id)}
                                    disabled={escrowActionLoading === c.id}
                                    title="Accept escrow deposit into vault. Farmer will receive Escrow FPO Guarantee Popup!"
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer"
                                  >
                                    {escrowActionLoading === c.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenRejectModal(c)}
                                    disabled={escrowActionLoading === c.id}
                                    title="Reject deposit and refund money back to verified buyer."
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition disabled:opacity-50 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : isBuyerConfirmed && !isReleased ? (
                                <button
                                  onClick={() => handleReleasePayout(c.id)}
                                  disabled={escrowActionLoading === c.id}
                                  title="Buyer confirmed order delivery! Click to remit escrow payout to farmer."
                                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer ml-auto"
                                >
                                  {escrowActionLoading === c.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Send className="w-3 h-3" />
                                  )}
                                  <span>Send Money to Farmer</span>
                                </button>
                              ) : isHeld && !isBuyerConfirmed ? (
                                <div className="text-[10px] text-stone-400 italic text-right">
                                  Awaiting Buyer receipt confirmation
                                </div>
                              ) : isReleased ? (
                                <div className="text-[10px] text-emerald-700 font-mono text-right">
                                  Ref: {c.settlement_transaction_id || 'ESC-SETTLE'}
                                </div>
                              ) : isRefunded ? (
                                <div className="text-[10px] text-rose-700 font-mono text-right">
                                  Refund Ref: {c.refund_transaction_id || 'REF-SENT'}
                                </div>
                              ) : (
                                <span className="text-[10px] text-stone-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Judicious Settlement
                </span>
                <h3 className="text-base font-bold text-stone-900 mt-1">Resolve Grievance #{selectedDispute.id}</h3>
              </div>
              <button onClick={() => setSelectedDispute(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Complainant:</span>
                <strong className="text-stone-900">{selectedDispute.filed_by_name} ({selectedDispute.filed_by_phone || 'No phone'})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Counterparty:</span>
                <strong className="text-stone-900">{selectedDispute.counterparty_name || 'Farmer'} ({selectedDispute.counterparty_phone || 'No phone'})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Subject:</span>
                <span className="text-stone-800 font-medium">{selectedDispute.subject}</span>
              </div>
            </div>

            {/* Quick Presets for Informed Admin Resolution */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Select Settlement Preset:</label>
              <div className="space-y-1.5 text-xs">
                {[
                  'Full refund processed to customer via Escrow Desk. Seller issued return voucher.',
                  'Escrow payment released to farmer after quality re-inspection verified.',
                  '50% mutual discount and partial compensation agreed by both parties.',
                  'Grievance settled amicably after admin telephonic mediation with farmer & customer.'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setResolutionNote(preset)}
                    className="w-full text-left p-2 rounded-lg border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 transition cursor-pointer text-[11px] text-stone-700"
                  >
                    • {preset}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Official Resolution Ruling *</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                  placeholder="Enter detailed ruling for customer, farmer, and platform logs..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  {isResolving ? 'Submitting Ruling...' : 'Confirm & Close Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ESCROW REJECT & REFUND MODAL */}
      {rejectingContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <XCircle className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Reject Escrow & Issue Refund</h3>
                  <p className="text-xs text-stone-500">Contract #{rejectingContract.id} • {rejectingContract.buyer_name}</p>
                </div>
              </div>
              <button onClick={() => setRejectingContract(null)} className="text-stone-400 hover:text-stone-700 font-bold">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-1.5 text-rose-900">
              <p className="font-semibold">⚠️ Refund Policy & Guarantee:</p>
              <p>Rejecting will immediately refund <strong>₹{(rejectingContract.escrow_amount || Math.round((rejectingContract.required_quantity || 10) * (rejectingContract.offer_price || 30))).toLocaleString('en-IN')}</strong> back to verified buyer <em>"{rejectingContract.buyer_name}"</em>. A refund reference UTR will be issued.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full p-2.5 text-xs border border-stone-300 rounded-xl outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
                placeholder="Specify reason for rejecting escrow deposit..."
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  'UTR payment verification mismatch',
                  'Incorrect deposit amount transferred',
                  'Mutual cancellation requested by buyer'
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReasonInput(preset)}
                    className="text-[10px] px-2 py-0.5 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectingContract(null)}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectEscrow}
                disabled={escrowActionLoading === rejectingContract.id || !rejectReasonInput.trim()}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {escrowActionLoading === rejectingContract.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Refund Buyer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN LIVE TRACKING MODAL */}
      {trackingOrder && (
        <LiveTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  );
};
