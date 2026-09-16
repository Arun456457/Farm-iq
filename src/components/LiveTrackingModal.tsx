import React, { useState, useEffect } from 'react';
import { 
  X, Truck, MapPin, Phone, User, CheckCircle2, Clock, ShieldCheck, 
  ThermometerSnowflake, Navigation, Check, PackageCheck, FileText, Sparkles, HelpCircle
} from 'lucide-react';
import { Order } from '../types';
import { api } from '../api';

interface LiveTrackingModalProps {
  order: Order | null;
  onClose: () => void;
  onOpenInvoice?: (order: Order) => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({ order, onClose, onOpenInvoice }) => {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!order) return;
    setLoading(true);
    api.getOrderTracking(order.id)
      .then(data => {
        setTrackingData(data);
      })
      .catch(() => {
        // Fallback tracking details
        const isDelivered = order.status === 'DELIVERED';
        setTrackingData({
          order_id: order.id,
          status: order.status,
          delivered_at: isDelivered ? (order.delivered_at || new Date().toISOString()) : null,
          driver_name: order.driver_name || "Vikram Patil (FarmiQ Logistics)",
          driver_phone: order.driver_phone || "+91 94231 88910",
          vehicle_number: order.vehicle_number || "MH-14-AG-4492",
          distance_km: order.distance_km || 12,
          eta_minutes: isDelivered ? 0 : Math.max(8, Math.round((order.distance_km || 12) * 2.2)),
          current_location: isDelivered ? "Delivered at Destination" : "Near Tollway Junction, Farm-to-City Expressway",
          temperature_controlled: true,
          checkpoints: [
            { title: "Direct Produce Harvest & Loading at Farm", time: "Completed", completed: true },
            { title: "Quality Verification & Mandi Digital Seal", time: "Completed", completed: ["ACCEPTED", "PREPARING", "TRANSIT", "DELIVERED"].includes(order.status) },
            { title: "Dispatched via ₹2/km Logistics Fleet", time: "Completed", completed: ["PREPARING", "TRANSIT", "DELIVERED"].includes(order.status) },
            { title: "Live Transit via Direct Highway Corridor", time: isDelivered ? "Completed" : "In Progress", completed: ["TRANSIT", "DELIVERED"].includes(order.status) },
            { title: "Delivered to Customer Doorstep", time: isDelivered ? "Delivered" : "Estimated", completed: isDelivered }
          ]
        });
      })
      .finally(() => setLoading(false));
  }, [order]);

  if (!order) return null;

  const currentStatus = trackingData?.status || order.status;
  const isDelivered = currentStatus === 'DELIVERED';

  const formatDeliveredTime = (dateStr?: string) => {
    if (!dateStr) return 'Recently Delivered';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 text-left animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-6 text-white relative ${
          isDelivered 
            ? 'bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-700'
            : 'bg-gradient-to-r from-emerald-800 to-teal-700'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-2 mb-1.5">
            {isDelivered ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-bold border border-emerald-300/40 flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-300" />
                DELIVERED TO DOORSTEP
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-300 animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Live Farm Logistics Tracking
                </span>
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold font-['Outfit']">
            Order #{order.id}: {order.product_name}
          </h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            {isDelivered 
              ? `Directly fulfilled from ${order.farmer_name}'s Farm` 
              : `From ${order.farmer_name}'s Farm to ${order.delivery_address}`}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* DELIVERED STATE HERO CARD */}
          {isDelivered ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/50 border-2 border-emerald-300 shadow-xs space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-emerald-950 font-['Outfit']">
                      Delivered Successfully!
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      Verified ✓
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your fresh farm produce was safely handed over at your doorstep.
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-semibold text-emerald-900 bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200/80 w-fit">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Delivered on: {formatDeliveredTime(trackingData?.delivered_at || order.delivered_at)}</span>
                  </div>
                </div>
              </div>

              {/* Produce Receipt Capsule */}
              <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-stone-500 font-medium block">Item & Quantity</span>
                  <span className="font-bold text-stone-900">{order.quantity} {order.unit || 'kg'} {order.product_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-medium block">Total Paid (UPI)</span>
                  <span className="font-bold text-emerald-700">₹{order.grand_total} (Delivery included)</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-stone-100">
                  <span className="text-[10px] text-stone-500 font-medium block">Destination Address</span>
                  <span className="font-semibold text-stone-800 text-[11px] truncate block">
                    {order.delivery_address}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE IN-TRANSIT ROUTE SIMULATION */
            <div className="relative h-44 w-full bg-stone-900 rounded-xl overflow-hidden shadow-inner border border-stone-800 flex flex-col justify-between p-4">
              {/* Background grid simulation */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 flex items-center justify-between text-xs">
                <span className="px-2 py-1 rounded bg-black/70 text-emerald-400 font-mono flex items-center gap-1.5">
                  <Navigation className="w-3 h-3 animate-spin" /> GPS Live: 18.5204° N, 73.8567° E
                </span>
                <span className="px-2 py-1 rounded bg-emerald-900/80 text-emerald-200 font-bold text-[11px] flex items-center gap-1">
                  <ThermometerSnowflake className="w-3 h-3 text-cyan-300" /> Cold-Chain 4°C
                </span>
              </div>

              {/* Visual Route Line */}
              <div className="relative z-10 my-auto">
                <div className="h-1.5 w-full bg-stone-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-1000"
                    style={{
                      width: order.status === 'TRANSIT' ? '68%' :
                             order.status === 'PREPARING' ? '35%' :
                             order.status === 'ACCEPTED' ? '18%' : '5%'
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-stone-400 mt-2">
                  <span>Farm Gate (Origin)</span>
                  <span className="text-emerald-400 font-semibold">{order.distance_km || 12} km direct corridor</span>
                  <span>Customer Doorstep</span>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-xs bg-black/60 backdrop-blur-xs p-2 rounded-lg text-white">
                <div>
                  <p className="text-[10px] text-stone-400">Current Status</p>
                  <p className="font-bold text-emerald-300">{order.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-stone-400">Estimated Arrival</p>
                  <p className="font-bold text-amber-300">
                    ~{trackingData?.eta_minutes || 25} mins remaining
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Route Completion Bar for Delivered */}
          {isDelivered && (
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
                <span className="flex items-center gap-1 text-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Direct Highway Farm Corridor ({order.distance_km || 12} km)
                </span>
                <span className="text-emerald-700 font-bold">100% Completed</span>
              </div>
              <div className="h-2 w-full bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full w-full bg-emerald-600 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 mt-1.5 font-medium">
                <span>Nashik / Farm Gate</span>
                <span>Mandi Sealed</span>
                <span>Pune Doorstep</span>
              </div>
            </div>
          )}

          {/* Logistics & Driver Details */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-stone-900">{trackingData?.driver_name || "Vikram Patil (FarmiQ Fleet)"}</p>
                <p className="text-[11px] text-stone-500">Vehicle: {trackingData?.vehicle_number || "MH-14-AG-4492"} • ₹2/km Fleet</p>
              </div>
            </div>
            
            {isDelivered ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                <Check className="w-3 h-3" /> Handed Over
              </span>
            ) : (
              <a 
                href={`tel:${trackingData?.driver_phone || "+919423188910"}`}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold flex items-center gap-1.5 hover:bg-emerald-800 transition cursor-pointer text-xs"
              >
                <Phone className="w-3.5 h-3.5" /> Call Driver
              </a>
            )}
          </div>

          {/* Checkpoints / Timeline */}
          <div>
            <h4 className="text-xs font-bold text-stone-800 mb-3 uppercase tracking-wider flex items-center justify-between">
              <span>{isDelivered ? 'Delivery Journey Milestones' : 'Transit Milestones'}</span>
              {isDelivered && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  5/5 Completed
                </span>
              )}
            </h4>
            <div className="space-y-3 text-xs">
              {trackingData?.checkpoints?.map((cp: any, idx: number) => {
                const completed = isDelivered ? true : Boolean(cp.completed);
                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      completed ? 'bg-emerald-600 text-white shadow-xs' : 'bg-stone-200 text-stone-400'
                    }`}>
                      {completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />}
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className={completed ? 'font-bold text-stone-900' : 'text-stone-500'}>
                        {cp.title}
                      </span>
                      <span className={`text-[11px] font-mono ${completed ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
                        {cp.time}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            {onOpenInvoice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInvoice(order);
                }}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-800 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                <span>View Tax Invoice</span>
              </button>
            )}
            <button
              onClick={onClose}
              className={`py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                onOpenInvoice 
                  ? 'flex-1 bg-stone-900 hover:bg-stone-800 text-white' 
                  : 'w-full bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
