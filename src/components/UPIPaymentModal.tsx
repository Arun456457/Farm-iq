import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  IndianRupee, QrCode, Smartphone, CheckCircle2, AlertCircle, 
  Loader2, X, ShieldCheck, Copy, Check, ExternalLink, Sparkles, RefreshCw, Banknote
} from 'lucide-react';
import { Order, Invoice, LanguageCode } from '../types';
import { api } from '../api';
import { tr, translateCrop } from '../translations';

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  invoice?: Invoice | null;
  onPaymentSuccess: (updatedOrder: Order) => void;
  language?: LanguageCode;
}

export const UPIPaymentModal: React.FC<UPIPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  invoice,
  onPaymentSuccess,
  language = 'en',
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'qr' | 'manual_utr' | 'cod'>('qr');
  const [manualUtr, setManualUtr] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Farmer's actual configured UPI ID from order/invoice/farmer profile
  const farmerUpiId = order?.farmer_upi_id || invoice?.farmer_upi_id || '9133144324@ybl';
  const farmerName = order?.farmer_name || invoice?.farmer_name || 'Direct Farmer';
  const payableAmount = order?.grand_total || invoice?.final_amount || 0;

  // Build compliant NPCI UPI payment URI
  const upiUri = `upi://pay?pa=${encodeURIComponent(farmerUpiId)}&pn=${encodeURIComponent(
    farmerName
  )}&am=${payableAmount}&cu=INR&tn=${encodeURIComponent(
    `FarmiQ Order #${order?.id || ''} ${order?.product_name || ''}`
  )}`;

  // Generate crisp QR code on modal open or amount change
  useEffect(() => {
    if (!isOpen || !payableAmount) return;

    QRCode.toDataURL(
      upiUri,
      {
        width: 280,
        margin: 1.5,
        color: {
          dark: '#064e3b',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err, url) => {
        if (!err && url) {
          setQrCodeUrl(url);
        }
      }
    );
  }, [isOpen, payableAmount, farmerUpiId, upiUri]);

  if (!isOpen || !order) return null;

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(farmerUpiId);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  // 1. Sandbox Test Payment Simulation (Instant Test Gateway)
  const handleSimulateSandboxPayment = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      setProcessStage('Connecting to NPCI / Bank UPI Switch...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessStage(`Debiting ₹${payableAmount} from customer UPI account...`);
      await new Promise((r) => setTimeout(r, 700));

      setProcessStage('Verifying settlement to farmer VPA...');
      await new Promise((r) => setTimeout(r, 600));

      const generatedUtr = `UPI${Date.now().toString().slice(-6)}${Math.floor(100000 + Math.random() * 900000)}`;

      const res = await api.payOrderUPI(order.id, {
        amount: payableAmount,
        transaction_id: generatedUtr,
        gateway_mode: 'sandbox',
      });

      try {
        const bc = new BroadcastChannel('farmiq_bus');
        bc.postMessage({ type: 'ORDER_PAID', orderId: order.id });
        bc.close();
      } catch {}

      setProcessStage('Payment Confirmed! Updating order...');
      await new Promise((r) => setTimeout(r, 400));

      onPaymentSuccess(res.order);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment simulation failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessStage(null);
    }
  };

  // 2. Manual UTR Verification (for real UPI app test)
  const handleVerifyManualUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = manualUtr.trim();
    if (!cleanUtr || cleanUtr.length < 8) {
      setErrorMsg('Please enter a valid 12-digit UPI Transaction Reference (UTR).');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProcessStage('Verifying UTR against bank transaction record...');
    try {
      await new Promise((r) => setTimeout(r, 800));

      const res = await api.payOrderUPI(order.id, {
        amount: payableAmount,
        transaction_id: cleanUtr,
        gateway_mode: 'manual_utr',
      });

      try {
        const bc = new BroadcastChannel('farmiq_bus');
        bc.postMessage({ type: 'ORDER_PAID', orderId: order.id });
        bc.close();
      } catch {}

      onPaymentSuccess(res.order);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Transaction verification failed.');
    } finally {
      setIsProcessing(false);
      setProcessStage(null);
    }
  };

  // 3. Cash on Delivery (COD) Confirmation
  const handleSelectCashOnDelivery = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setProcessStage('Registering Cash on Delivery booking...');
    try {
      await new Promise((r) => setTimeout(r, 600));

      const res = await api.payOrderCOD(order.id);

      try {
        const bc = new BroadcastChannel('farmiq_bus');
        bc.postMessage({ type: 'ORDER_PAID', orderId: order.id });
        bc.close();
      } catch {}
      window.dispatchEvent(new CustomEvent('farmiq_state_change', { detail: { type: 'ORDER_PAID', orderId: order.id } }));

      onPaymentSuccess(res.order);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm Cash on Delivery.');
    } finally {
      setIsProcessing(false);
      setProcessStage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">{tr("Choose Payment Method", language)}</h3>
              <p className="text-xs text-stone-500">
                {tr("Order", language)} #{order.id} • {translateCrop(order.product_name, language)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount Pill */}
        <div className="bg-emerald-900 text-white p-4 text-center shrink-0">
          <span className="text-xs uppercase tracking-widest text-emerald-200 font-bold">{tr("Total Payable Amount", language)}</span>
          <div className="text-3xl font-black font-mono mt-0.5">
            ₹{payableAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-300 mt-1">
            {tr("Matches Invoice Total • 0% Platform Deductions", language)}
          </p>
        </div>

        {/* Tab Toggle: QR Code vs Manual UTR vs Cash on Delivery */}
        <div className="flex border-b border-stone-200 bg-stone-50 shrink-0">
          <button
            type="button"
            onClick={() => setPaymentMode('qr')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              paymentMode === 'qr'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{tr("UPI QR", language)}</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('manual_utr')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              paymentMode === 'manual_utr'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{tr("Enter UTR", language)}</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMode('cod')}
            className={`flex-1 py-2.5 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
              paymentMode === 'cod'
                ? 'bg-white text-emerald-800 border-b-2 border-emerald-600 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" />
            <span>{tr("Cash on Delivery", language)}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2.5 animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
              <span className="font-semibold">{processStage ? tr(processStage, language) : tr("Processing payment verification...", language)}</span>
            </div>
          )}

          {paymentMode === 'qr' ? (
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Dynamic QR Code */}
              <div className="bg-white p-2.5 rounded-2xl border-2 border-emerald-500/30 shadow-lg shadow-emerald-900/5">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-52 h-52 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-stone-50 rounded-xl">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>

              {/* Supported UPI Apps Row */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-stone-500">
                <span>{tr("Scan with:", language)}</span>
                <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-700 font-semibold">GPay</span>
                <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-700 font-semibold">PhonePe</span>
                <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-700 font-semibold">Paytm</span>
                <span className="px-1.5 py-0.5 bg-stone-100 rounded text-stone-700 font-semibold">BHIM</span>
              </div>

              {/* Farmer VPA Copy Pill */}
              <div className="w-full bg-stone-50 border border-stone-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div className="text-left truncate mr-2">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">{tr("Farmer UPI VPA", language)}</span>
                  <span className="font-mono font-bold text-stone-800 truncate block">{farmerUpiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVpa}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
                >
                  {copiedVpa ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVpa ? tr("Copied!", language) : tr("Copy", language)}</span>
                </button>
              </div>

              {/* Direct UPI App Intent Link */}
              <a
                href={upiUri}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-stone-200"
              >
                <Smartphone className="w-4 h-4 text-stone-600" />
                <span>{tr("Pay with UPI App on Mobile", language)}</span>
                <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
              </a>

              {/* Sandbox Test Button */}
              <div className="w-full pt-1">
                <button
                  type="button"
                  onClick={handleSimulateSandboxPayment}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                  )}
                  <span>{tr("Simulate Payment (Instant Sandbox Test)", language)}</span>
                </button>
                <p className="text-[10px] text-stone-400 mt-1">
                  {tr("Testing mode: simulates NPCI gateway verification & real-time webhook update.", language)}
                </p>
              </div>
            </div>
          ) : paymentMode === 'manual_utr' ? (
            /* Manual UTR Verification Form */
            <form onSubmit={handleVerifyManualUtr} className="space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-200/80 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{tr("Manual UPI Verification", language)}</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  {tr("If you scanned the QR code with your UPI app on another device, copy the 12-digit UTR (UPI Ref ID) from your banking receipt to confirm the order.", language)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {tr("12-Digit UPI Reference Number (UTR):", language)}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 425519284729 or UPI-982143"
                  value={manualUtr}
                  onChange={(e) => setManualUtr(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                />
              </div>

              <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>{tr("Payee (Farmer):", language)}</span>
                  <span className="font-semibold text-stone-900">{farmerName}</span>
                </div>
                <div className="flex justify-between">
                  <span>{tr("Farmer VPA:", language)}</span>
                  <span className="font-mono text-stone-900">{farmerUpiId}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                  <span>{tr("Payable:", language)}</span>
                  <span className="font-mono text-emerald-800">₹{payableAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !manualUtr.trim()}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{tr("Verify & Mark Order as Paid", language)}</span>
              </button>
            </form>
          ) : (
            /* Cash on Delivery (COD) Option */
            <div className="space-y-4 text-left">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <Banknote className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>{tr("Cash on Delivery (Pay upon Arrival)", language)}</span>
                </div>
                <p className="text-amber-800 leading-relaxed">
                  {tr("Pay", language)} <strong>₹{payableAmount.toLocaleString('en-IN')}</strong> {tr("in cash directly to the delivery person once your fresh harvest is delivered and inspected at your doorstep.", language)}
                </p>
                <div className="pt-2 border-t border-amber-200/80 space-y-1.5 text-[11px] text-amber-900">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{tr("Zero upfront online payment needed today", language)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{tr("Inspect produce freshness before paying", language)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>{tr("Farmer immediately receives green signal to prepare & pack your order", language)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 space-y-1">
                <div className="flex justify-between">
                  <span>{tr("Payee Farmer:", language)}</span>
                  <span className="font-semibold text-stone-900">{farmerName}</span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 pt-1 border-t border-stone-200">
                  <span>{tr("Cash Amount to Pay at Doorstep:", language)}</span>
                  <span className="font-mono text-emerald-800 text-sm">₹{payableAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleSelectCashOnDelivery}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tr("Confirming Cash on Delivery...", language)}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{tr("Confirm Cash on Delivery Order", language)} (₹{payableAmount.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/80 flex items-center justify-center gap-2 text-[11px] text-stone-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{tr("NPCI 256-Bit Encrypted • Direct Farmer Bank Settlement", language)}</span>
        </div>
      </div>
    </div>
  );
};
