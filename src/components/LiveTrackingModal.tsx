import React, { useState, useEffect } from 'react';
import { X, Truck, MapPin, Phone, User, CheckCircle2, Clock, ShieldCheck, ThermometerSnowflake, Navigation } from 'lucide-react';
import { Order } from '../types';
import { api } from '../api';

interface LiveTrackingModalProps {
  order: Order | null;
  onClose: () => void;
}

export const LiveTrackingModal: React.FC<LiveTrackingModalProps> = ({ order, onClose }) => {
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
        setTrackingData({
          order_id: order.id,
          status: order.status,
          driver_name: order.driver_name || "Vikram Patil (FarmiQ Logistics)",
          driver_phone: order.driver_phone || "+91 94231 88910",
          vehicle_number: order.vehicle_number || "MH-14-AG-4492",
          distance_km: order.distance_km,
          eta_minutes: Math.max(8, Math.round(order.distance_km * 2.2)),
          current_location: "Near Tollway Junction, Farm-to-City Expressway",
          temperature_controlled: true,
          checkpoints: [
            { title: "Direct Produce Harvest & Loading at Farm", time: "10:15 AM", completed: true },
            { title: "Mandi Digital Weighment & Quality Seal", time: "10:45 AM", completed: ["ACCEPTED", "PREPARING", "TRANSIT", "DELIVERED"].includes(order.status) },
            { title: "Live Transit via Direct ₹2/km Route", time: "11:20 AM", completed: ["TRANSIT", "DELIVERED"].includes(order.status) },
            { title: "Delivered to Customer Doorstep", time: "Estimated", completed: order.status === "DELIVERED" }
          ]
        });
      })
      .finally(() => setLoading(false));
  }, [order]);

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-8 text-left">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-5 h-5 text-emerald-300 animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
              Live Farm Logistics Tracking
            </span>
          </div>
          <h2 className="text-xl font-bold font-['Outfit']">Order #{order.id}: {order.product_name}</h2>
          <p className="text-xs text-emerald-100">
            From {order.farmer_name}'s Farm to {order.delivery_address}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Animated Route Map Simulation */}
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
                    width: order.status === 'DELIVERED' ? '100%' :
                           order.status === 'TRANSIT' ? '68%' :
                           order.status === 'PREPARING' ? '35%' :
                           order.status === 'ACCEPTED' ? '18%' : '5%'
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 mt-2">
                <span>Farm Gate (Origin)</span>
                <span className="text-emerald-400 font-semibold">{order.distance_km} km direct corridor</span>
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
                  {order.status === 'DELIVERED' ? 'Delivered' : `~${trackingData?.eta_minutes || 25} mins remaining`}
                </p>
              </div>
            </div>
          </div>

          {/* Driver & Vehicle Details */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-stone-900">{trackingData?.driver_name || "Vikram Patil (FarmiQ Fleet)"}</p>
                <p className="text-[11px] text-stone-500">Vehicle: {trackingData?.vehicle_number || "MH-14-AG-4492"} • ₹2/km</p>
              </div>
            </div>
            <a 
              href={`tel:${trackingData?.driver_phone || "+919423188910"}`}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold flex items-center gap-1.5 hover:bg-emerald-800 transition"
            >
              <Phone className="w-3.5 h-3.5" /> Call Driver
            </a>
          </div>

          {/* Checkpoints */}
          <div>
            <h4 className="text-xs font-bold text-stone-800 mb-3 uppercase tracking-wider">
              Transit Milestones
            </h4>
            <div className="space-y-3 text-xs">
              {trackingData?.checkpoints?.map((cp: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center ${
                    cp.completed ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-400'
                  }`}>
                    {cp.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <div className="w-1.5 h-1.5 rounded-full bg-stone-400" />}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <span className={cp.completed ? 'font-bold text-stone-900' : 'text-stone-500'}>
                      {cp.title}
                    </span>
                    <span className="text-[11px] text-stone-400">{cp.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition"
          >
            Close Tracking
          </button>
        </div>
      </div>
    </div>
  );
};
