import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle, ShieldCheck, MapPin, Calendar, IndianRupee, AlertCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { User, DigitalContract, LanguageCode } from '../types';
import { api } from '../api';
import { translations } from '../translations';

interface DigitalContractsProps {
  user: User | null;
  language: LanguageCode;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const DigitalContracts: React.FC<DigitalContractsProps> = ({
  user,
  language,
  onOpenAuth,
}) => {
  const t = translations[language];
  const [contracts, setContracts] = useState<DigitalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Contract form
  const [title, setTitle] = useState('Bulk Procurement: Grade-A Tomato');
  const [cropName, setCropName] = useState('Tomato');
  const [requiredQuantity, setRequiredQuantity] = useState<number>(500);
  const [unit, setUnit] = useState('kg');
  const [offerPrice, setOfferPrice] = useState<number>(38);
  const [qualityGrade, setQualityGrade] = useState('Grade-A Uniform Color & Firmness');
  const [deliveryLocation, setDeliveryLocation] = useState('Pune Wholesale Mandi Gate 2');
  const [deliveryDeadline, setDeliveryDeadline] = useState(new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
  const [terms, setTerms] = useState('Payment in escrow released within 24 hours of weighment and Brix test approval.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contractToAccept, setContractToAccept] = useState<DigitalContract | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchContracts = async () => {
    try {
      const data = await api.getContracts();
      setContracts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createContract({
        title,
        crop_name: cropName,
        required_quantity: requiredQuantity,
        unit,
        offer_price: offerPrice,
        quality_grade: qualityGrade,
        delivery_location: deliveryLocation,
        delivery_deadline: deliveryDeadline,
        terms,
      });
      setShowCreateModal(false);
      setStatusMessage({
        type: 'success',
        text: `Digital Contract for ${requiredQuantity} ${unit} ${cropName} successfully posted and backed by escrow!`
      });
      fetchContracts();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create contract'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAcceptModal = (c: DigitalContract) => {
    setStatusMessage(null);
    if (!user) {
      onOpenAuth('login', 'farmer');
      return;
    }
    setContractToAccept(c);
  };

  const handleConfirmAccept = async () => {
    if (!contractToAccept) return;
    setIsAccepting(true);
    try {
      await api.acceptContract(contractToAccept.id);
      setStatusMessage({
        type: 'success',
        text: `Contract successfully accepted! Funds are locked in ICICI Bank Escrow Desk and dispatch voucher issued.`
      });
      setContractToAccept(null);
      fetchContracts();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to accept contract'
      });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-left">
      {/* Inline Status Message */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold ${
          statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' :
          statusMessage.type === 'error' ? 'bg-rose-50 text-rose-900 border border-rose-200' :
          'bg-blue-50 text-blue-900 border border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-stone-400 hover:text-stone-700 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      )}
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold mb-2">
            <FileText className="w-3.5 h-3.5 text-purple-700" />
            <span>Pre-Harvest Agreements & Institutional Escrow</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-['Outfit']">
            {t.digitalContracts}
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            Lock in guaranteed purchase prices before harvest. Backed by bank escrow and legal digital signatures.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              onOpenAuth('login');
            } else {
              setShowCreateModal(true);
            }
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Post Purchase Requirement</span>
        </button>
      </div>

      {/* List of Active Contracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contracts.map((c) => {
          const isOpen = c.status === 'OPEN';
          const totalVal = Math.round(c.required_quantity * c.offer_price);

          return (
            <div key={c.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {isOpen ? 'Open for Bidding' : c.status}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 mt-1">{c.title}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-purple-900">₹{c.offer_price}</span>
                    <span className="text-xs text-stone-500">/{c.unit}</span>
                  </div>
                </div>

                <p className="text-xs text-stone-600 mb-4">
                  Buyer: <strong className="text-stone-900">{c.buyer_name}</strong> {c.buyer_company && `(${c.buyer_company})`}
                </p>

                <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Required Quantity:</span>
                    <span className="font-bold text-stone-800">{c.required_quantity} {c.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Contract Value:</span>
                    <span className="font-bold text-emerald-800">₹{totalVal} in Escrow</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Quality Spec:</span>
                    <span className="font-medium text-stone-800">{c.quality_grade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Delivery Deadline:</span>
                    <span className="font-medium text-stone-800">{c.delivery_deadline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Destination:</span>
                    <span className="font-medium text-stone-800">{c.delivery_location}</span>
                  </div>
                </div>

                {c.assigned_farmer_name && (
                  <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-xs font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Locked by Farmer: {c.assigned_farmer_name}</span>
                  </div>
                )}
              </div>

              {/* Action */}
              <div>
                {isOpen ? (
                  <button
                    onClick={() => handleOpenAcceptModal(c)}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Accept & Lock Contract in Escrow</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="w-full py-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 text-center font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span>Contract Locked in Escrow</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ACCEPT CONTRACT CONFIRMATION MODAL */}
      {contractToAccept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 text-left">
            <div className="bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-700 p-6 text-white flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-300" />
                  <span>Escrow-Protected Digital Agreement</span>
                </div>
                <h2 className="text-xl font-bold font-['Outfit']">Confirm Acceptance & Escrow Lock</h2>
                <p className="text-xs text-emerald-100 mt-0.5">ICICI Bank Agri-Escrow Desk Guarantee</p>
              </div>
              <button
                onClick={() => setContractToAccept(null)}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                  <span className="text-stone-500 font-medium">Contract Title</span>
                  <span className="font-bold text-stone-900">{contractToAccept.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Produce & Quantity</span>
                  <span className="font-bold text-stone-900">{contractToAccept.required_quantity} {contractToAccept.unit} of {contractToAccept.crop_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Agreed Price</span>
                  <span className="font-bold text-purple-900">₹{contractToAccept.offer_price} / {contractToAccept.unit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Total Guaranteed Payout</span>
                  <span className="text-sm font-extrabold text-emerald-800">
                    ₹{Math.round(contractToAccept.required_quantity * contractToAccept.offer_price).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Quality Spec</span>
                  <span className="font-medium text-stone-800">{contractToAccept.quality_grade}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Delivery Destination</span>
                  <span className="font-medium text-stone-800">{contractToAccept.delivery_location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Delivery Deadline</span>
                  <span className="font-bold text-amber-800">{contractToAccept.delivery_deadline}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Escrow Security Assurance:</strong> The buyer's funds will be frozen into the neutral FarmiQ Escrow account immediately. Payout is automatically remitted to your bank account upon delivery weighment.
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContractToAccept(null)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAccept}
                  disabled={isAccepting}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 disabled:bg-stone-300 cursor-pointer"
                >
                  {isAccepting ? (
                    <span>Locking Escrow...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Lock & Accept in Escrow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE CONTRACT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 text-left">
            <div className="bg-gradient-to-r from-purple-900 to-indigo-800 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Outfit']">Post Procurement Contract</h2>
                <p className="text-xs text-purple-200 mt-0.5">Connect directly with verified farmers</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Contract Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Crop Name *</label>
                  <input
                    type="text"
                    required
                    value={cropName}
                    onChange={(e) => setCropName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Required Quantity & Unit *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      value={requiredQuantity}
                      onChange={(e) => setRequiredQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-purple-600"
                    />
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="px-2 py-2 border border-stone-300 rounded-lg bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Offered Price (₹ / unit) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Delivery Deadline *</label>
                  <input
                    type="date"
                    required
                    value={deliveryDeadline}
                    onChange={(e) => setDeliveryDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Quality Specifications *</label>
                <input
                  type="text"
                  required
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Delivery Hub / Destination *</label>
                <input
                  type="text"
                  required
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold transition disabled:bg-stone-300 cursor-pointer"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Contract to Farmers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
