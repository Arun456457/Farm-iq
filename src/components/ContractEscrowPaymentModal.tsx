import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, CheckCircle, AlertCircle, Copy, Check, 
  IndianRupee, Sparkles, Building2, QrCode as QrIcon, 
  CreditCard, ArrowRight, Lock, Loader2, RefreshCw 
} from 'lucide-react';
import QRCode from 'qrcode';
import { DigitalContract, LanguageCode } from '../types';
import { api } from '../api';
import { tr } from '../translations';

interface ContractEscrowPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: DigitalContract | null;
  language?: LanguageCode;
  onPaymentSuccess: (updatedContract: DigitalContract) => void;
}

export const ContractEscrowPaymentModal: React.FC<ContractEscrowPaymentModalProps> = ({
  isOpen,
  onClose,
  contract,
  language = 'en',
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'SANDBOX' | 'UPI_QR' | 'NEFT'>('SANDBOX');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [utrInput, setUtrInput] = useState<string>('');
  const [copiedVpa, setCopiedVpa] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const ESCROW_VPA = 'farmiq.escrow@icici';
  const ESCROW_ACCOUNT_NUMBER = '9133144324001';
  const ESCROW_IFSC = 'ICIC0000001';
  const ESCROW_BANK_NAME = 'ICICI Bank Ltd (Agri-Escrow Branch)';

  const totalAmount = contract?.escrow_amount || (contract ? Math.round(contract.required_quantity * contract.offer_price) : 0);
  const platformFee = contract?.admin_monetization_fee || Math.round(totalAmount * 0.015);
  const netFarmerPayout = contract?.net_farmer_payout || (totalAmount - platformFee);

  // Generate dynamic UPI QR Code
  useEffect(() => {
    if (contract && isOpen) {
      const upiUrl = `upi://pay?pa=${ESCROW_VPA}&pn=FarmiQ%20Agri%20Escrow%20Vault&am=${totalAmount}&cu=INR&tn=Escrow%20Hold%20Contract%20${contract.id}`;
      QRCode.toDataURL(upiUrl, { width: 220, margin: 1, color: { dark: '#1e1b4b', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error('Failed to generate Escrow QR', err));
      
      setUtrInput(`UTR${Date.now().toString().slice(-8)}`);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [contract, isOpen, totalAmount]);

  if (!isOpen || !contract) return null;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(ESCROW_VPA);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const handleCopyBank = () => {
    const text = `A/C: ${ESCROW_ACCOUNT_NUMBER}\nIFSC: ${ESCROW_IFSC}\nBank: ${ESCROW_BANK_NAME}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleSimulateSandboxPayment = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const mockTxnId = `ESC-SANDBOX-${Date.now().toString().slice(-6)}`;
      const mockUtr = `UTR${Math.floor(10000000 + Math.random() * 90000000)}`;

      const res = await api.depositContractEscrow(contract.id, {
        payment_mode: 'SIMULATED_SANDBOX',
        transaction_id: mockTxnId,
        utr: mockUtr,
        amount: totalAmount
      });

      setSuccessMsg(`✓ Simulated Escrow Deposit Successful! ₹${totalAmount.toLocaleString('en-IN')} held in FarmiQ Vault. Status: Awaiting Admin Verification.`);
      
      setTimeout(() => {
        onPaymentSuccess(res.contract);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to deposit escrow funds');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitManualUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrInput.trim()) {
      setErrorMsg('Please enter a valid 12-digit UPI/NEFT UTR reference number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const txnId = `ESC-${activeTab}-${Date.now().toString().slice(-6)}`;
      const res = await api.depositContractEscrow(contract.id, {
        payment_mode: activeTab,
        transaction_id: txnId,
        utr: utrInput.trim(),
        amount: totalAmount
      });

      setSuccessMsg(`✓ Escrow Payment Submitted! Reference #${utrInput.trim()} registered. Admin has been notified to verify and lock the escrow vault.`);
      
      setTimeout(() => {
        onPaymentSuccess(res.contract);
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit escrow payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh] text-left animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white ring-2 ring-white/20 shadow-xs shrink-0">
              <Lock className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Outfit'] text-white">FarmiQ Escrow Vault Deposit</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  Secured Desk
                </span>
              </div>
              <p className="text-[11px] text-purple-200">ICICI Bank Agri-Escrow Desk • Funds Held Until Admin Approval</p>
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

        {/* Contract Summary Bar */}
        <div className="px-5 py-3 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between text-xs shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Contract Ref</span>
            <span className="font-mono font-bold text-stone-900">#{contract.id} • {contract.crop_name}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">Total Escrow Amount</span>
            <span className="text-base font-black text-purple-950">₹{totalAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Status Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-2 shadow-xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Breakdown Box */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2 text-stone-600">
            <div className="flex justify-between items-center text-xs">
              <span>Required Volume:</span>
              <strong className="text-stone-900">{contract.required_quantity} {contract.unit} @ ₹{contract.offer_price}/{contract.unit}</strong>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>Platform Monetization Fee (1.5%):</span>
              <span className="text-purple-900 font-semibold">- ₹{platformFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-stone-200 text-xs font-bold">
              <span className="text-emerald-900">Guaranteed Farmer Payout:</span>
              <span className="text-emerald-900">₹{netFarmerPayout.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Mode Selector Tabs */}
          <div>
            <label className="block font-bold text-stone-700 mb-1.5 uppercase text-[11px] tracking-wide">
              Select Escrow Deposit Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('SANDBOX')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  activeTab === 'SANDBOX'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-[11px]">Instant Sandbox</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('UPI_QR')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  activeTab === 'UPI_QR'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <QrIcon className="w-4 h-4 text-purple-600" />
                <span className="text-[11px]">UPI QR Code</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('NEFT')}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  activeTab === 'NEFT'
                    ? 'border-purple-600 bg-purple-50/70 text-purple-900 font-bold shadow-xs'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px]">Bank NEFT/RTGS</span>
              </button>
            </div>
          </div>

          {/* TAB 1: INSTANT SIMULATED SANDBOX */}
          {activeTab === 'SANDBOX' && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-purple-50/60 border border-amber-200/80 space-y-3 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Zero-Friction Sandbox Simulator</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed max-w-sm mx-auto">
                Instantly simulate bank transfer of <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> into the FarmiQ Escrow Vault. Tests live NPCI webhook callbacks and marks the contract ready for Admin Approval.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSimulateSandboxPayment}
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold text-xs shadow-md shadow-purple-700/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Simulating Bank Escrow Deposit...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Simulate Escrow Deposit (₹{totalAmount.toLocaleString('en-IN')})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: UPI QR CODE */}
          {activeTab === 'UPI_QR' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col items-center text-center space-y-3">
                {qrCodeUrl ? (
                  <div className="p-2 bg-white rounded-2xl shadow-sm border border-stone-200">
                    <img src={qrCodeUrl} alt="Escrow UPI QR" className="w-44 h-44 rounded-xl" />
                  </div>
                ) : (
                  <div className="w-44 h-44 bg-stone-200 animate-pulse rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[11px] text-stone-500 block">Scan with any UPI App: GPay, PhonePe, Paytm, BHIM</span>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="font-mono font-bold text-purple-950 text-xs">{ESCROW_VPA}</span>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="px-2 py-0.5 rounded-md bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedVpa ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedVpa ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitManualUtr} className="space-y-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Enter 12-Digit UPI Reference Number (UTR) *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="e.g. 408912345678"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Verify UPI Deposit & Hold in Escrow</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: BANK NEFT / RTGS */}
          {activeTab === 'NEFT' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                  <span className="font-bold text-stone-700">Beneficiary Name</span>
                  <span className="font-semibold text-stone-900">FarmiQ Escrow Desk Ltd</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                  <span className="font-bold text-stone-700">Account Number</span>
                  <span className="font-mono font-bold text-purple-950">{ESCROW_ACCOUNT_NUMBER}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-stone-200">
                  <span className="font-bold text-stone-700">IFSC Code</span>
                  <span className="font-mono font-bold text-purple-950">{ESCROW_IFSC}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-700">Bank & Branch</span>
                  <span className="text-stone-800 font-medium">{ESCROW_BANK_NAME}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyBank}
                  className="w-full py-1.5 rounded-lg bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBank ? 'Bank Details Copied!' : 'Copy Bank Account Details'}</span>
                </button>
              </div>

              <form onSubmit={handleSubmitManualUtr} className="space-y-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Enter Bank Transaction UTR / Ref Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={utrInput}
                    onChange={(e) => setUtrInput(e.target.value)}
                    placeholder="e.g. ICICR520240925000001"
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 font-mono text-xs outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  <span>Submit Bank Transfer & Notify Admin</span>
                </button>
              </form>
            </div>
          )}

          {/* Escrow Legal Notice */}
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-[11px] text-purple-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <strong>FarmiQ Escrow Guarantee:</strong> Once deposited, funds are safely frozen. FarmiQ Admin reviews and approves the escrow vault. The farmer is guaranteed 100% payment upon delivery, and if admin rejects, your deposit is instantly refunded to your source account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
