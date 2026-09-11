import React, { useState } from 'react';
import { X, Sprout, ShoppingBag, Lock, Mail, Phone, MapPin, Building, Home, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { User, UserRole, LanguageCode } from '../types';
import { api, setAuthToken, setStoredUser } from '../api';
import { translations } from '../translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  initialRole?: UserRole;
  onAuthSuccess: (user: User) => void;
  language: LanguageCode;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  initialRole = 'customer',
  onAuthSuccess,
  language,
}) => {
  const t = translations[language];
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<UserRole>(initialRole);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [buyerType, setBuyerType] = useState('Retail Chain');
  const [demandCrop, setDemandCrop] = useState('Tomato');
  const [targetVolumeQuintal, setTargetVolumeQuintal] = useState('100');
  const [procurementPrice, setProcurementPrice] = useState('3600');
  const [gstin, setGstin] = useState('27AAACR1234F1Z1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const payload: any = {
          full_name: fullName,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role,
          location: location.trim() || 'Nashik, Maharashtra',
        };

        if (role === 'farmer') {
          payload.farm_name = farmName.trim() || 'Sahyadri Organic Farms';
        } else if (role === 'customer') {
          payload.delivery_address = deliveryAddress.trim() || 'Flat 402, Green Meadows, Pune';
        } else if (role === 'buyer') {
          payload.company_name = companyName.trim() || fullName;
          payload.buyer_type = buyerType;
          payload.demand_crop = demandCrop.trim() || 'Tomato';
          payload.target_volume_quintal = Number(targetVolumeQuintal) || 50;
          payload.procurement_price = Number(procurementPrice) || 3500;
          payload.gstin = gstin.trim() || '27AABCF1234F1Z5';
        }

        const res = await api.register(payload);
        setAuthToken(res.access_token);
        setStoredUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      } else {
        const res = await api.login({
          email: email.trim().toLowerCase(),
          password,
        });
        setAuthToken(res.access_token);
        setStoredUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoData = (targetRole: UserRole) => {
    setRole(targetRole);
    if (targetRole === 'farmer') {
      setFullName('Suresh Patil');
      setEmail('farmer.patil@farmiq.in');
      setPhone('+91 98220 54321');
      setPassword('farmer123');
      setFarmName('Patil Agro Orchards');
      setLocation('Lasalgaon, Nashik (Maharashtra)');
    } else if (targetRole === 'customer') {
      setFullName('Priya Sharma');
      setEmail('priya.sharma@gmail.com');
      setPhone('+91 98901 88765');
      setPassword('customer123');
      setLocation('Kothrud, Pune');
      setDeliveryAddress('B-12, Orchid Residency, Kothrud, Pune - 411038');
    } else if (targetRole === 'buyer') {
      setFullName('Vikram Malhotra');
      setEmail('buyer.malhotra@reliancefresh.com');
      setPhone('+91 98111 22334');
      setPassword('buyer123');
      setCompanyName('Reliance Fresh Direct Sourcing');
      setBuyerType('Retail Chain');
      setDemandCrop('Tomato');
      setTargetVolumeQuintal('150');
      setProcurementPrice('3800');
      setGstin('27AAACR1234F1Z1');
      setLocation('Navi Mumbai APMC Terminal');
    } else {
      setFullName('FarmiQ Chief Administrator');
      setEmail('admin@farmiq.in');
      setPhone('+91 99000 11223');
      setPassword('admin123');
      setLocation('Central Control, Mumbai APMC');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white text-left relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <Sprout className="w-6 h-6 text-emerald-300" />
            <span className="text-xl font-bold tracking-tight">FarmiQ</span>
          </div>
          <h2 className="text-lg font-bold">
            {mode === 'login' ? 'Sign In to Your Account' : 'Join the Direct Marketplace'}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            {mode === 'login' ? 'Access your direct orders & listings' : 'Zero middlemen. Fair farm-gate realization.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              mode === 'login' ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${
              mode === 'register' ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.createAccount}
          </button>
        </div>

        {/* Quick Demo Pre-fill Bar */}
        <div className="p-3 bg-amber-50/80 border-b border-amber-200/70 text-xs flex items-center justify-between">
          <span className="font-semibold text-amber-900">Quick Test:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fillDemoData('farmer')}
              className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold hover:bg-emerald-200 transition"
            >
              Demo Farmer
            </button>
            <button
              type="button"
              onClick={() => fillDemoData('customer')}
              className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-semibold hover:bg-teal-200 transition"
            >
              Demo Customer
            </button>
            <button
              type="button"
              onClick={() => fillDemoData('buyer')}
              className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200 transition"
            >
              Demo Buyer
            </button>
            <button
              type="button"
              onClick={() => fillDemoData('admin')}
              className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold hover:bg-purple-200 transition"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-left">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selector (if Registering) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Select Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition ${
                    role === 'farmer' ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20' : 'border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${role === 'farmer' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    <Sprout className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-center">{t.roleFarmer}</p>
                  <p className="text-[9px] text-stone-500 text-center">Sell Direct</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('customer')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition ${
                    role === 'customer' ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-500/20' : 'border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${role === 'customer' ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-center">{t.roleCustomer}</p>
                  <p className="text-[9px] text-stone-500 text-center">Buy Fresh</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition ${
                    role === 'buyer' ? 'border-amber-600 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20' : 'border-stone-200 text-stone-700 hover:border-stone-300'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${role === 'buyer' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <p className="text-[11px] font-bold text-center">Verified Buyer</p>
                  <p className="text-[9px] text-stone-500 text-center">Admin Verified</p>
                </button>
              </div>
            </div>
          )}

          {/* Full Name */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Email Address *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Phone (Register only) */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98000 00000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Farm Name (Farmer only) */}
          {mode === 'register' && role === 'farmer' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Farm / Orchard Name *</label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Kisan Sahyadri Agro Farm"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Delivery Address (Customer only) */}
          {mode === 'register' && role === 'customer' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Delivery Address *</label>
              <div className="relative">
                <Home className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Flat 304, Green Heights, Pune"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Buyer Specific Form Fields (Buyer only) */}
          {mode === 'register' && role === 'buyer' && (
            <div className="space-y-3 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Institutional Buyer Registration & Verification</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                Your account will be submitted to the FarmiQ Admin for verification. Once approved, you can purchase FPO lots and contract farmers.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">Company / Enterprise Name *</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Reliance Fresh, BigBasket, Mother Dairy"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Buyer Type</label>
                  <select
                    value={buyerType}
                    onChange={(e) => setBuyerType(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  >
                    <option value="Retail Chain">Retail Chain</option>
                    <option value="Wholesale Institutional">Wholesale Institutional</option>
                    <option value="Food Processing Unit">Food Processing Unit</option>
                    <option value="Agro-Exporter">Agro-Exporter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Target Crop Demand</label>
                  <input
                    type="text"
                    required
                    value={demandCrop}
                    onChange={(e) => setDemandCrop(e.target.value)}
                    placeholder="e.g. Tomato, Onion, Mango"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Procurement (Quintals)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetVolumeQuintal}
                    onChange={(e) => setTargetVolumeQuintal(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">Offer Price (₹/Quintal)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={procurementPrice}
                    onChange={(e) => setProcurementPrice(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">GSTIN / FSSAI License Number *</label>
                <input
                  type="text"
                  required
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="27AAACR1234F1Z1"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-amber-600 uppercase"
                />
              </div>
            </div>
          )}

          {/* Location */}
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Location / District *</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Nashik, Maharashtra"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition disabled:bg-stone-300 cursor-pointer"
          >
            {loading ? 'Processing...' : (mode === 'login' ? t.login : t.createAccount)}
          </button>
        </form>
      </div>
    </div>
  );
};
