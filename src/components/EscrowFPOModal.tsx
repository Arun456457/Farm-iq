import React from 'react';
import { 
  X, ShieldCheck, CheckCircle2, PackageCheck, IndianRupee, 
  Truck, ArrowRight, Calendar, MapPin, Building2, Lock 
} from 'lucide-react';
import { DigitalContract, LanguageCode } from '../types';
import { tr } from '../translations';

interface EscrowFPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: DigitalContract | null;
  onDispatchProduce?: (contractId: string) => void;
  language?: LanguageCode;
}

export const EscrowFPOModal: React.FC<EscrowFPOModalProps> = ({
  isOpen,
  onClose,
  contract,
  onDispatchProduce,
  language = 'en',
}) => {
  if (!isOpen || !contract) return null;

  const totalAmount = contract.escrow_amount || Math.round(contract.required_quantity * contract.offer_price);
  const platformFee = contract.admin_monetization_fee || Math.round(totalAmount * 0.015);
  const netFarmerPayout = contract.net_farmer_payout || (totalAmount - platformFee);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/65 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-emerald-300 max-w-lg w-full overflow-hidden flex flex-col text-left animate-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-stone-900 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 inline-block mb-1">
                  Escrow FPO Guarantee
                </span>
                <h2 className="text-xl font-bold font-['Outfit'] tracking-tight">Escrow Approved by Admin!</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-emerald-100 mt-3 relative z-10 leading-relaxed">
            FarmiQ Admin has verified the institutional buyer's deposit. 100% of your payout is safely locked in the escrow vault. Zero payment risk!
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Main Payout Highlight */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Guaranteed Payout to Farmer Account
              </span>
              <span className="text-2xl font-black text-emerald-950">
                ₹{netFarmerPayout.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-emerald-700 block mt-0.5">
                (Total Escrow: ₹{totalAmount.toLocaleString('en-IN')} • 1.5% platform fee deducted)
              </span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>

          {/* Contract Details Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-stone-700">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200">
              <span className="text-stone-500 font-medium">Contract Ref & Crop:</span>
              <span className="font-bold text-stone-900">#{contract.id} • {contract.crop_name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Verified Buyer:</span>
              <span className="font-semibold text-stone-900 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-700" />
                <span>{contract.buyer_name} {contract.buyer_company && `(${contract.buyer_company})`}</span>
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Committed Quantity:</span>
              <span className="font-bold text-stone-900">{contract.required_quantity} {contract.unit}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Agreed Rate:</span>
              <span className="font-bold text-purple-900">₹{contract.offer_price} / {contract.unit}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Delivery Destination:</span>
              <span className="font-medium text-stone-800 truncate max-w-[220px]">{contract.delivery_location}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-stone-500">Target Deadline:</span>
              <span className="font-semibold text-amber-800">{contract.delivery_deadline}</span>
            </div>

            {contract.escrow_utr && (
              <div className="flex justify-between items-center pt-1 border-t border-stone-200 text-[11px]">
                <span className="text-stone-500">Escrow Vault Ref (UTR):</span>
                <span className="font-mono font-bold text-purple-900">{contract.escrow_utr}</span>
              </div>
            )}
          </div>

          {/* Admin Verification Note */}
          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 text-[11px] text-purple-950 flex items-start gap-2">
            <Lock className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <strong>Admin Escrow Desk Verified:</strong> The buyer's money cannot be withdrawn or canceled. Once you dispatch and the buyer confirms receipt at the warehouse, the payout is automatically remitted to your bank/UPI.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 transition cursor-pointer text-center"
            >
              Acknowledge & Prepare Harvest
            </button>

            {onDispatchProduce && (
              <button
                type="button"
                onClick={() => {
                  onDispatchProduce(contract.id);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Dispatch Produce</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
