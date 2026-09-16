import React, { useRef } from 'react';
import { 
  FileText, Download, Printer, CheckCircle2, AlertCircle, X, 
  MapPin, Phone, Mail, IndianRupee, ShieldCheck, Truck, Sparkles, Building2, User as UserIcon
} from 'lucide-react';
import { Invoice, Order } from '../types';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  order?: Order | null;
  onPayNow?: () => void;
  isCustomer?: boolean;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  order,
  onPayNow,
  isCustomer = false,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const isPaid = invoice.payment_status === 'PAID' || order?.payment_status === 'PAID';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const content = `
============================================================
              FARMIQ DIRECT FARM-TO-FORK INVOICE
============================================================
Invoice Number : ${invoice.invoice_number}
Date & Time    : ${new Date(invoice.generated_at).toLocaleString('en-IN')}
Order Number   : #${invoice.order_id}
Status         : ${isPaid ? 'PAID (Verified)' : invoice.order_status || 'Confirmed'}
------------------------------------------------------------
PRODUCED & BILLED BY (FARMER):
Name    : ${invoice.farmer_name}
Phone   : ${invoice.farmer_phone}
Email   : ${invoice.farmer_email}
Address : ${invoice.farmer_address}
UPI VPA : ${invoice.farmer_upi_id || 'farmer@upi'}
------------------------------------------------------------
BILLED TO (CUSTOMER):
Name    : ${invoice.customer_name}
Phone   : ${invoice.customer_phone}
Email   : ${invoice.customer_email}
Delivery: ${invoice.customer_address}
------------------------------------------------------------
ITEMS PURCHASED:
${invoice.items
  .map(
    (item, i) =>
      `${i + 1}. ${item.product_name} | Qty: ${item.quantity} ${item.unit} @ ₹${item.unit_price}/${item.unit} = ₹${item.subtotal}`
  )
  .join('\n')}
------------------------------------------------------------
Subtotal        : ₹${invoice.product_subtotal.toLocaleString('en-IN')}
Delivery Charge : ₹${invoice.delivery_fee.toLocaleString('en-IN')} (${invoice.distance_km} km @ ₹2/km standard)
GST / Taxes     : ₹0.00 (Exempt under Section 11 CGST Act - Fresh Agri Produce)
Discounts       : ₹0.00
------------------------------------------------------------
FINAL PAYABLE   : ₹${invoice.final_amount.toLocaleString('en-IN')}
Payment Status  : ${isPaid ? 'PAID' : 'UNPAID'}
${invoice.transaction_id ? `UTR / Txn Ref   : ${invoice.transaction_id}` : ''}
${invoice.paid_at ? `Paid Timestamp  : ${new Date(invoice.paid_at).toLocaleString('en-IN')}` : ''}
============================================================
FarmiQ Platform • Direct Fair Trade • FSSAI & Agri-Verified
============================================================
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoice_number}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      {/* Print-specific stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #farmiq-printable-invoice, #farmiq-printable-invoice * {
            visibility: visible;
          }
          #farmiq-printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
            border: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header Controls (Hidden on Print) */}
        <div className="no-print px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                Official Tax Invoice • {invoice.invoice_number}
              </h3>
              <p className="text-[11px] text-stone-500">
                Linked to Order #{invoice.order_id} • Generated on {new Date(invoice.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={handleDownloadText}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Download text voucher"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document Body */}
        <div 
          id="farmiq-printable-invoice" 
          ref={printAreaRef}
          className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6 text-stone-900 bg-white font-['Inter']"
        >
          {/* Invoice Banner & Brand Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-stone-200 gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-emerald-300/60 bg-emerald-950 shrink-0">
                  <img src="/farmiq-logo.png" alt="FarmiQ Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-2xl font-black tracking-tight text-emerald-800 font-['Outfit',sans-serif]">FarmiQ</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Farm Direct
                </span>
              </div>
              <p className="text-xs text-stone-500">
                FarmiQ Agri-Logistics & Marketplace Network Ltd.
              </p>
              <p className="text-[11px] text-stone-400">
                Direct mandi & farm-to-consumer decentralized trading platform
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs uppercase tracking-widest text-stone-400 font-bold">COMMERCIAL INVOICE</span>
              <p className="text-xl font-black text-stone-900 font-mono mt-0.5">{invoice.invoice_number}</p>
              <div className="mt-1 flex sm:justify-end items-center gap-2">
                <span className="text-xs text-stone-500">Date:</span>
                <span className="text-xs font-semibold text-stone-700">
                  {new Date(invoice.generated_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="mt-1 flex sm:justify-end items-center gap-2">
                <span className="text-xs text-stone-500">Order Ref:</span>
                <span className="text-xs font-mono font-bold text-emerald-800">#{invoice.order_id}</span>
              </div>

              {/* Status Stamp */}
              <div className="mt-2 sm:flex sm:justify-end">
                {isPaid ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-black text-xs uppercase tracking-widest rounded-lg shadow-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PAID • VERIFIED</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border-2 border-amber-500 text-amber-800 font-black text-xs uppercase tracking-widest rounded-lg shadow-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>CONFIRMED • UNPAID</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Parties: Billed By (Farmer) & Billed To (Customer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-2">
            {/* Farmer / Seller Card */}
            <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Billed By (Farmer / Producer)</span>
              </div>
              <p className="text-sm font-bold text-stone-900">{invoice.farmer_name}</p>
              <div className="mt-1.5 space-y-1 text-xs text-stone-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>{invoice.farmer_address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{invoice.farmer_phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{invoice.farmer_email}</span>
                </div>
                {invoice.farmer_upi_id && (
                  <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500">Farmer UPI ID:</span>
                    <span className="font-mono font-bold text-stone-800 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {invoice.farmer_upi_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Customer / Consignee Card */}
            <div className="bg-stone-50/80 p-4 rounded-xl border border-stone-200/80">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 mb-2">
                <UserIcon className="w-3.5 h-3.5" />
                <span>Billed To (Customer / Consignee)</span>
              </div>
              <p className="text-sm font-bold text-stone-900">{invoice.customer_name}</p>
              <div className="mt-1.5 space-y-1 text-xs text-stone-600">
                <div className="flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>{invoice.customer_address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{invoice.customer_phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{invoice.customer_email}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-stone-500">Dispatched Via:</span>
                  <span className="font-semibold text-stone-700">FarmiQ Eco-Refrigerated Express</span>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-hidden border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100 text-stone-600 uppercase tracking-wider text-[10px] font-bold border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Description of Produce</th>
                  <th className="px-4 py-3 text-center">HSN / Category</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Rate / Unit</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-800">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/50">
                    <td className="px-4 py-3 text-stone-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-stone-900">
                      {item.product_name}
                      <span className="block text-[10px] text-stone-400 font-normal">
                        Naturally Farm-Grown • Direct Harvest
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-stone-500 font-mono text-[11px]">0702 (Agri)</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right">₹{item.unit_price.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-bold text-stone-900">
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Tax Exemption */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2">
            <div className="sm:col-span-7 space-y-3">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>GST Exemption Notification</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Raw, fresh agricultural produce (fruits, vegetables, cereals) is 100% exempt from Goods & Services Tax under Schedule 1 of Notification No. 2/2017-Central Tax (Rate).
                </p>
              </div>

              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3.5 text-xs text-stone-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-stone-800">
                  <Truck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>FarmiQ Transparent Logistics</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Delivery is charged strictly at ₹2 per km ({invoice.distance_km} km × ₹2 = ₹{invoice.delivery_fee}) directly supporting rural transport drivers.
                </p>
              </div>
            </div>

            <div className="sm:col-span-5 bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Produce Subtotal:</span>
                <span className="font-semibold text-stone-900">₹{invoice.product_subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee ({invoice.distance_km} km):</span>
                <span className="font-semibold text-stone-900">₹{invoice.delivery_fee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Applicable GST (0%):</span>
                <span className="font-semibold text-emerald-700">₹0.00 (Exempt)</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Special Discounts:</span>
                <span className="font-semibold text-stone-900">₹0.00</span>
              </div>

              <div className="pt-2 border-t border-stone-300 flex justify-between items-baseline">
                <span className="text-sm font-bold text-stone-900">Final Total:</span>
                <span className="text-lg font-black text-emerald-800 font-mono">
                  ₹{invoice.final_amount.toLocaleString('en-IN')}
                </span>
              </div>

              {invoice.transaction_id && (
                <div className="pt-2 border-t border-stone-200 text-[11px] text-stone-500">
                  <div className="flex justify-between">
                    <span>Payment Ref (UTR):</span>
                    <span className="font-mono font-bold text-stone-800">{invoice.transaction_id}</span>
                  </div>
                  {invoice.paid_at && (
                    <div className="flex justify-between mt-1">
                      <span>Paid Date:</span>
                      <span>{new Date(invoice.paid_at).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Authorized Signatory Footnote */}
          <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row justify-between items-end text-xs text-stone-400 gap-4">
            <div>
              <p className="font-semibold text-stone-600">Direct Farmer Settlement Voucher</p>
              <p className="text-[11px]">This is a computer-generated tax invoice verified on the FarmiQ digital ledger.</p>
            </div>
            <div className="text-right sm:text-right">
              <div className="border-b border-stone-300 w-36 mb-1 ml-auto"></div>
              <p className="font-bold text-stone-700 text-xs">FarmiQ Automated Escrow</p>
              <p className="text-[10px] text-stone-400">Authorized Digital Signature</p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div className="no-print px-6 py-4 border-t border-stone-100 bg-stone-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition cursor-pointer"
          >
            Close Invoice
          </button>

          <div className="flex items-center gap-2.5">
            {isCustomer && !isPaid && onPayNow && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPayNow();
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer"
              >
                <IndianRupee className="w-4 h-4" />
                <span>Pay Now via UPI (₹{invoice.final_amount.toLocaleString('en-IN')})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
