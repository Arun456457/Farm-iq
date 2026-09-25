import React, { useState, useEffect } from 'react';
import { 
  X, User as UserIcon, Phone, Mail, MapPin, IndianRupee, 
  Building2, CheckCircle, AlertCircle, Loader2, Navigation, 
  ShieldCheck, Sparkles, Check
} from 'lucide-react';
import { User } from '../types';
import { api, setStoredUser } from '../api';
import { tr, LanguageCode } from '../translations';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (updatedUser: User) => void;
  onOpenLocationPicker?: () => void;
  language?: LanguageCode;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onOpenLocationPicker,
  language = 'en',
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [farmName, setFarmName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [pincode, setPincode] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setLocation(user.location || '');
      setDeliveryAddress(user.delivery_address || user.location || '');
      setFarmName(user.farm_name || '');
      setCompanyName((user as any).company_name || '');
      setUpiId(user.upi_id || '');
      setPincode((user as any).pincode || '');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordsStr = `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        if (!location) {
          setLocation(coordsStr);
        }
        if (user.role === 'customer' && !deliveryAddress) {
          setDeliveryAddress(coordsStr);
        }
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        setErrorMsg('Could not detect exact GPS coordinates. Please type your location.');
      },
      { timeout: 8000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Email address cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        location: location.trim(),
        delivery_address: deliveryAddress.trim() || location.trim(),
        upi_id: upiId.trim(),
        pincode: pincode.trim(),
      };

      if (user.role === 'farmer') {
        payload.farm_name = farmName.trim() || `${fullName.trim()}'s Farm`;
      }
      if (user.role === 'buyer') {
        payload.company_name = companyName.trim();
      }

      const res = await api.updateProfile(payload);
      const updated = res.user;

      // Update storage and parent state immediately
      setStoredUser(updated);
      onUserUpdated(updated);

      setSuccessMsg('✓ Profile changes saved! FarmiQ is now using your updated profile.');

      // Auto-close modal smoothly after 1.2s
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white ring-2 ring-white/20 shadow-xs shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Outfit'] text-white">{tr('Edit Profile', language)}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-emerald-100 border border-white/20">
                  {tr(user.role, language)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100">{tr('Update your account information & direct details', language)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Status Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold text-xs">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 shadow-2xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-xs">{successMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {tr('Full Name', language)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <UserIcon className="w-4 h-4 absolute left-3 text-stone-400 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tr('Full Name', language)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Phone Number (Used for WhatsApp alerts) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-stone-700">
                {tr('Phone Number (WhatsApp Active)', language)} <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold">📲 {tr('For WhatsApp alerts', language)}</span>
            </div>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 absolute left-3 text-stone-400 pointer-events-none" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {tr('Email Address', language)} <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-stone-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Role specific: Farmer Farm Name */}
          {user.role === 'farmer' && (
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                {tr('Farm / Orchard Name', language)}
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 absolute left-3 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="e.g. Gera Organic Farm, Nashik"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
                />
              </div>
            </div>
          )}

          {/* Role specific: Buyer Company Name */}
          {user.role === 'buyer' && (
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                {tr('Company / Organization Name', language)}
              </label>
              <div className="relative flex items-center">
                <Building2 className="w-4 h-4 absolute left-3 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Sahyadri Agro Retails Ltd."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
                />
              </div>
            </div>
          )}

          {/* Location / Village / City */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-stone-700">
                {user.role === 'farmer' ? tr('Farm Location (Village / Mandi Area)', language) : tr('Primary City / Location', language)}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={detectingGps}
                  className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Navigation className={`w-3 h-3 ${detectingGps ? 'animate-spin' : ''}`} />
                  <span>{detectingGps ? tr('Detecting...', language) : tr('Auto GPS', language)}</span>
                </button>
                {onOpenLocationPicker && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLocationPicker();
                    }}
                    className="text-[10px] text-teal-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>{tr('Pick on Map', language)}</span>
                  </button>
                )}
              </div>
            </div>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 absolute left-3 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lasalgaon, Nashik, Maharashtra"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
              />
            </div>
          </div>

          {/* Customer Delivery Address */}
          {user.role === 'customer' && (
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                {tr('Default Doorstep Delivery Address', language)}
              </label>
              <textarea
                rows={2}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Flat No., Building Name, Street, Landmark, Pune"
                className="w-full p-3 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-medium"
              />
            </div>
          )}

          {/* UPI ID (for Payouts / Payments) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-stone-700">
                {tr('UPI ID', language)}
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold">{tr('Instant UPI Payouts', language)}</span>
            </div>
            <div className="relative flex items-center">
              <IndianRupee className="w-4 h-4 absolute left-3 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. 9133144324@ybl or yourname@oksbi"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition font-mono font-medium"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs hover:bg-stone-50 transition cursor-pointer"
            >
              {tr('Cancel', language)}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{tr('Saving Changes...', language)}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{tr('Save Changes', language)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
