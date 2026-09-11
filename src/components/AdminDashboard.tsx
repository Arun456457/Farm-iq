import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Users, Package, ShoppingBag, IndianRupee, Warehouse, 
  FileText, AlertTriangle, CheckCircle, RefreshCw, Eye, Truck, FilePlus, Filter,
  ShieldCheck, Building2, Check, X, Phone, Mail, MapPin, CheckCircle2, XCircle
} from 'lucide-react';
import { User, Product, Order, Dispute, LanguageCode, CustomerRequirement, StorageBooking, VerifiedBuyer } from '../types';
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
  const [activeView, setActiveView] = useState<'overview' | 'requirements' | 'storage' | 'users' | 'buyers' | 'disputes'>('overview');
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [requirements, setRequirements] = useState<CustomerRequirement[]>([]);
  const [storageBookings, setStorageBookings] = useState<StorageBooking[]>([]);
  const [buyersList, setBuyersList] = useState<VerifiedBuyer[]>([]);
  const [buyerFilter, setBuyerFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [verifyingBuyerId, setVerifyingBuyerId] = useState<string | null>(null);
  const [buyerActionMsg, setBuyerActionMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      const [over, uList, dList, rList, sList, bList] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getDisputes(),
        api.getRequirements(),
        api.getStorageBookings(),
        api.getAdminBuyers().catch(() => [])
      ]);
      setOverview(over);
      setUsersList(uList.users || []);
      setDisputes(dList || []);
      setRequirements(rList || []);
      setStorageBookings(sList || []);
      setBuyersList(bList || []);
    } catch (err) {
      console.error("Admin sync error:", err);
    } finally {
      if (isFirstLoad) setLoading(false);
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
      setBuyerActionMsg(`✓ Buyer "${res.buyer.company_name}" successfully verified and approved for FPO matching!`);
      await fetchAdminData(false);
    } catch (err: any) {
      setBuyerActionMsg(`⚠️ ${err.message || 'Failed to verify buyer'}`);
      await fetchAdminData(false);
    } finally {
      setVerifyingBuyerId(null);
    }
  };

  const handleRejectBuyer = async (buyerId: string) => {
    setVerifyingBuyerId(buyerId);
    setBuyerActionMsg(null);
    // Optimistic UI state update
    setBuyersList(prev => prev.map(b => b.id === buyerId ? { ...b, verified: false, status: 'REJECTED' } : b));
    try {
      const res = await api.rejectBuyer(buyerId);
      setBuyerActionMsg(`✕ Buyer "${res.buyer.company_name}" status set to REJECTED.`);
      await fetchAdminData(false);
    } catch (err: any) {
      setBuyerActionMsg(`⚠️ ${err.message || 'Failed to reject buyer'}`);
      await fetchAdminData(false);
    } finally {
      setVerifyingBuyerId(null);
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
          onClick={fetchAdminData}
          className="px-4 py-2.5 rounded-xl bg-stone-700 hover:bg-stone-600 text-white font-bold text-xs flex items-center gap-2 transition self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Metrics</span>
        </button>
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
            Logistics fees: ₹{overview?.total_delivery_fees ?? 0} (@ ₹2/km)
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
          <span>Buyer Verification ({buyersList.filter(b => b.status === 'PENDING_VERIFICATION' || !b.verified).length} Pending)</span>
        </button>
        <button
          onClick={() => setActiveView('disputes')}
          className={`px-3 sm:px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            activeView === 'disputes' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Disputes Desk ({disputes.length})</span>
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
                  <th className="px-4 py-3">Logistics (₹2/km)</th>
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
                Pending ({buyersList.filter(b => b.status === 'PENDING_VERIFICATION' || !b.verified).length})
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

      {/* VIEW 3: DISPUTES DESK */}
      {activeView === 'disputes' && (
        <div className="space-y-4">
          {disputes.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-stone-300">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-stone-800">No open customer or farmer grievances.</h3>
              <p className="text-xs text-stone-500 mt-1">Platform dispute rate is currently 0.0%.</p>
            </div>
          ) : (
            disputes.map((d) => (
              <div key={d.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-stone-800">Ticket #{d.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {d.status}
                    </span>
                    {d.order_id && <span className="text-xs text-stone-500">Related Order: #{d.order_id}</span>}
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">{d.subject}</h4>
                  <p className="text-xs text-stone-600">{d.description}</p>
                  <p className="text-[11px] text-stone-400">
                    Filed by: {d.filed_by_name} ({d.filed_by_role})
                  </p>
                  {d.resolution && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium mt-2">
                      Resolution: {d.resolution}
                    </div>
                  )}
                </div>

                {d.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      setSelectedDispute(d);
                      setResolutionNote('Full refund processed to customer account via Escrow.');
                    }}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs transition shrink-0"
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* RESOLUTION MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-stone-200 text-left">
            <h3 className="text-base font-bold text-stone-900 mb-2">Resolve Grievance #{selectedDispute.id}</h3>
            <p className="text-xs text-stone-600 mb-4">{selectedDispute.subject}</p>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Resolution Action *</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-stone-900"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-2 text-xs font-bold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition"
                >
                  {isResolving ? 'Submitting...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
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
