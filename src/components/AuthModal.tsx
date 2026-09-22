import React, { useState } from 'react';
import { X, Sprout, ShoppingBag, Lock, Mail, Phone, MapPin, Building, Home, Shield, AlertCircle, CheckCircle, Navigation, Compass, Loader2, Sparkles, Hash, Eye, EyeOff, ArrowLeft, Copy, Key, MessageSquare, IndianRupee } from 'lucide-react';
import { User, UserRole, LanguageCode } from '../types';
import { api, setAuthToken, setStoredUser } from '../api';
import { translations } from '../translations';
import { LocationPickerModal } from './LocationPickerModal';

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
  const [showPassword, setShowPassword] = useState(false);
  const [farmName, setFarmName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [buyerType, setBuyerType] = useState('Retail Chain');
  const [demandCrop, setDemandCrop] = useState('Tomato');
  const [targetVolumeQuintal, setTargetVolumeQuintal] = useState('100');
  const [procurementPrice, setProcurementPrice] = useState('3600');
  const [gstin, setGstin] = useState('27AAACR1234F1Z1');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password & Recovery states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotResult, setForgotResult] = useState<{
    email: string;
    phone: string;
    full_name: string;
    role: string;
    password: string;
    whatsapp_url: string;
  } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Auto-detect GPS location
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGpsStatus('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
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
            const postCode = addr.postcode || '';
            const formatted = [road, locality, cityName].filter(Boolean).join(', ');

            if (role === 'customer') {
              setDeliveryAddress(formatted || data.display_name || 'My Delivery Location');
            } else {
              setLocation(formatted || data.display_name || 'My Farm Location');
            }
            if (postCode) setPincode(postCode);
            setGpsStatus(`✓ Pinned: ${cityName} (PIN: ${postCode || 'Auto'})`);
          }
        } catch {
          setGpsStatus(`✓ GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setGpsStatus('GPS signal timed out. Please enter address or select on map.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email address or mobile number.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    setForgotResult(null);
    setResetSuccess(null);

    try {
      const res = await api.forgotPassword({ identifier: forgotIdentifier.trim() });
      setForgotResult(res);
    } catch (err: any) {
      setForgotError(err.message || 'Could not find account. Please verify your details.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotResult) return;
    if (!newResetPassword.trim() || newResetPassword.trim().length < 4) {
      setForgotError('New password must be at least 4 characters long.');
      return;
    }
    setResetLoading(true);
    setForgotError(null);
    try {
      await api.resetPassword({
        identifier: forgotResult.email,
        new_password: newResetPassword.trim(),
      });
      setResetSuccess('✓ Password updated successfully! You can now log in.');
      setPassword(newResetPassword.trim());
      setForgotResult({
        ...forgotResult,
        password: newResetPassword.trim(),
      });
      setNewResetPassword('');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to update password.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (!forgotResult?.password) return;
    navigator.clipboard.writeText(forgotResult.password);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const resolvedAddress = (role === 'customer' ? deliveryAddress.trim() : location.trim()) || 'Maharashtra';
        const payload: any = {
          full_name: fullName,
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          role,
          location: resolvedAddress,
          delivery_address: resolvedAddress,
          pincode: pincode.trim() || undefined,
          latitude: coords?.lat,
          longitude: coords?.lng,
        };

        if (role === 'farmer') {
          payload.farm_name = farmName.trim() || 'Sahyadri Organic Farms';
          payload.upi_id = upiId.trim() || undefined;
          payload.upi_name = fullName.trim();
        } else if (role === 'customer') {
          payload.delivery_address = resolvedAddress;
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
        const cleanIdent = email.trim().toLowerCase();
        const res = await api.login({
          identifier: cleanIdent,
          email: cleanIdent,
          password,
          role,
        });
        setAuthToken(res.access_token);
        setStoredUser(res.user);
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      const rawMsg: string = err.message || '';
      setError(rawMsg || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-5 sm:p-6 text-white text-left relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-xs ring-1 ring-white/40 bg-emerald-950 shrink-0">
              <img src="/farmiq-logo.png" alt="FarmiQ Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight">FarmiQ</span>
          </div>
          <h2 className="text-lg font-bold">
            {isForgotPassword
              ? 'Password Recovery'
              : (mode === 'login' ? 'Sign In to Your Account' : 'Join the Direct Marketplace')}
          </h2>
          <p className="text-xs text-emerald-100/90 mt-0.5">
            {isForgotPassword
              ? 'Retrieve your password or send alert to WhatsApp'
              : (mode === 'login' ? 'Access your direct orders & listings' : 'Zero middlemen. Fair farm-gate realization.')}
          </p>
        </div>

        {/* Mode Switcher Tabs (hidden during password recovery) */}
        {!isForgotPassword && (
          <div className="flex border-b border-stone-200 shrink-0">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${mode === 'login' ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50' : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
            >
              {t.login}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition ${mode === 'register' ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50' : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
            >
              {t.createAccount}
            </button>
          </div>
        )}

        {/* Form Body or Forgot Password Screen */}
        {isForgotPassword ? (
          <div className="p-5 sm:p-6 space-y-4 text-left overflow-y-auto flex-1">
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setForgotError(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600">
              <p className="font-semibold text-stone-800 mb-1">🔍 Find & Retrieve Your Password</p>
              <p>Enter your registered <strong>Email Address</strong> or <strong>Mobile Number</strong> below. FarmiQ will retrieve your account password and provide a direct WhatsApp / SMS alert link.</p>
            </div>

            {forgotError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {!forgotResult ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Registered Email or Phone Number *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      placeholder="e.g. user123@gmail.com or 9800000000"
                      className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition disabled:bg-stone-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Searching Account...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" /> Retrieve My Password
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* Account Details Box */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <div>
                      <div className="text-stone-500 text-[11px]">Account Holder</div>
                      <div className="font-bold text-emerald-950 text-sm">{forgotResult.full_name}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {forgotResult.role}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600">
                    <div>
                      <span className="text-stone-400">Email:</span> <strong className="text-stone-800">{forgotResult.email}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400">Phone:</span> <strong className="text-stone-800">{forgotResult.phone}</strong>
                    </div>
                  </div>

                  {/* Password Card */}
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-300">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-bold text-stone-500">Your Account Password</div>
                      <div className="font-mono text-base font-black text-emerald-900 tracking-wider">
                        {forgotResult.password}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedPassword ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* WhatsApp Notification Button */}
                <a
                  href={forgotResult.whatsapp_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow-md shadow-green-200 transition flex items-center justify-center gap-2 cursor-pointer no-underline"
                >
                  <MessageSquare className="w-4 h-4" /> 📲 Send Password Alert to WhatsApp / SMS
                </a>

                {/* Pre-fill into Login Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEmail(forgotResult.email);
                    setPassword(forgotResult.password);
                    setIsForgotPassword(false);
                    setError(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign In with this Password
                </button>

                {/* Inline Reset Form */}
                <div className="pt-2 border-t border-stone-200">
                  <div className="text-xs font-bold text-stone-700 mb-2">Want to change your password now?</div>
                  <form onSubmit={handleResetPassword} className="flex gap-2">
                    <input
                      type="text"
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="flex-1 px-3 py-1.5 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg transition disabled:bg-stone-400 cursor-pointer shrink-0"
                    >
                      {resetLoading ? 'Saving...' : 'Set New'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-left overflow-y-auto flex-1">
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
                  className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition ${role === 'farmer' ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20' : 'border-stone-200 text-stone-700 hover:border-stone-300'
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
                  className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition ${role === 'customer' ? 'border-teal-600 bg-teal-50/80 text-teal-900 ring-2 ring-teal-500/20' : 'border-stone-200 text-stone-700 hover:border-stone-300'
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
                  className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition ${role === 'buyer' ? 'border-amber-600 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20' : 'border-stone-200 text-stone-700 hover:border-stone-300'
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

          {/* Email or Phone for Login */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              {mode === 'login' ? 'Email Address or Mobile Number *' : 'Email Address *'}
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
              <input
                type={mode === 'login' ? 'text' : 'email'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'login' ? 'e.g. user123@gmail.com or 9133144324' : 'name@domain.com'}
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
                  placeholder="e.g. 9800000000"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Farm Name (Farmer only) */}
          {mode === 'register' && role === 'farmer' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Farm Name / Brand</label>
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

          {/* Farmer Payment UPI ID (Farmer only) */}
          {mode === 'register' && role === 'farmer' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">Farmer Bank UPI ID (Direct Payout)</label>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Direct Payout
                </span>
              </div>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. yourname@oksbi or 9876543210@upi (optional)"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-1">
                Enter your UPI ID so customer and institutional payments deposit directly to your bank account.
              </p>
            </div>
          )}

          {/* Address & PIN Section for Customer and Farmer */}
          {mode === 'register' && (role === 'customer' || role === 'farmer') && (
            <div className="space-y-2.5 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  {role === 'farmer' ? 'Farm Location & Address (Map & PIN)' : 'Delivery Address & Location (Map & PIN)'}
                </span>
                {coords && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded-full font-semibold">
                    GPS Pinned
                  </span>
                )}
              </div>

              {/* Fast GPS & Map Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="py-1.5 px-2 bg-white hover:bg-emerald-100/70 border border-emerald-300 rounded-lg text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLocating ? (
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                  ) : (
                    <Navigation className="w-3 h-3 text-emerald-600" />
                  )}
                  <span>{isLocating ? 'Detecting GPS...' : 'Detect My GPS'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <MapPin className="w-3 h-3" />
                  <span>Select on Map</span>
                </button>
              </div>

              {gpsStatus && (
                <p className="text-[11px] text-emerald-800 font-medium bg-emerald-100/60 px-2 py-1 rounded">
                  {gpsStatus}
                </p>
              )}

              {/* Full Address Input */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {role === 'farmer' ? 'Farm / Pickup Address *' : 'Delivery Address (House/Plot, Street, Area) *'}
                </label>
                <div className="relative">
                  <Home className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    required
                    value={role === 'customer' ? deliveryAddress : location}
                    onChange={(e) => {
                      if (role === 'customer') {
                        setDeliveryAddress(e.target.value);
                      } else {
                        setLocation(e.target.value);
                      }
                    }}
                    placeholder={role === 'farmer' ? 'e.g. Survey No. 42, Lasalgaon Road, Nashik' : 'e.g. Flat 402, Green Meadows, Kothrud, Pune'}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* PIN Code & District/State */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Postal PIN Code *
                  </label>
                  <div className="relative">
                    <Hash className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 422306"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    District / Region *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Nashik, Maharashtra"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
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

          {/* Location for Buyer */}
          {mode === 'register' && role === 'buyer' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Location / District *</label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Navi Mumbai, Maharashtra"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700">Password *</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true);
                    setForgotIdentifier(email || phone || '');
                    setError(null);
                    setForgotError(null);
                    setForgotResult(null);
                    setResetSuccess(null);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs border border-stone-300 rounded-lg outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 focus:outline-none p-0.5 cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
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
        )}
      </div>

      {/* Interactive Map Picker Modal */}
      {isMapOpen && (
        <LocationPickerModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          user={null}
          defaultAddress={role === 'customer' ? deliveryAddress : location}
          onAddressSaved={(newAddr, newCoords, newPin) => {
            if (role === 'customer') {
              setDeliveryAddress(newAddr);
            } else {
              setLocation(newAddr);
            }
            if (newPin) setPincode(newPin);
            setCoords(newCoords);
            setGpsStatus(`✓ Map pinned: ${newAddr.slice(0, 30)}...`);
            setIsMapOpen(false);
          }}
        />
      )}
    </div>
  );
};
