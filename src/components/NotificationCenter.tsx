import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bell, Check, Trash2, X, AlertCircle, CheckCircle2, IndianRupee, 
  Package, MapPin, Clock, Phone, User as UserIcon, ArrowRight, Sparkles,
  ShoppingBag, ShieldAlert, Loader2, Truck, FileText, MessageSquare, ExternalLink
} from 'lucide-react';
import { User, NotificationItem, Order } from '../types';
import { api } from '../api';

interface NotificationCenterProps {
  user: User | null;
  onOrderAccepted?: (orderId: number) => void;
  onOrderRejected?: (orderId: number) => void;
  onOpenInvoice?: (orderId: number) => void;
  onPayNow?: (orderId: number) => void;
  onTrackOrder?: (orderId: number) => void;
}

// Gentle Web Audio API synthesizer for instant pleasant chime
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio context may be restricted by browser policy before first user gesture
  }
}

function getDismissedPopupIds(): Set<string> {
  try {
    const raw = localStorage.getItem('farmiq_dismissed_popups');
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedPopupId(id: string) {
  try {
    const set = getDismissedPopupIds();
    set.add(id);
    localStorage.setItem('farmiq_dismissed_popups', JSON.stringify(Array.from(set)));
  } catch {}
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  user,
  onOrderAccepted,
  onOrderRejected,
  onOpenInvoice,
  onPayNow,
  onTrackOrder,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [paidOrderIds, setPaidOrderIds] = useState<Set<number>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [activePopupNotif, setActivePopupNotif] = useState<NotificationItem | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Multi-tab sync channel
  const channelRef = useRef<BroadcastChannel | null>(null);

  const handleDismissPopup = async (n: NotificationItem | null) => {
    if (!n) return;
    setActivePopupNotif(null);
    saveDismissedPopupId(n.id);
    try {
      await api.markNotificationRead(n.id);
    } catch {}
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, status: 'READ', requires_action: false } : item))
    );
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      let paidSet = paidOrderIds;
      if (user.role === 'customer') {
        try {
          const orders = await api.getCustomerOrders();
          if (Array.isArray(orders)) {
            const newPaid = new Set<number>();
            orders.forEach((o) => {
              if (
                o.payment_status === 'PAID' ||
                o.status === 'PAID' ||
                ['PREPARING', 'TRANSIT', 'DELIVERED'].includes(o.status)
              ) {
                newPaid.add(o.id);
              }
            });
            paidSet = newPaid;
            setPaidOrderIds(newPaid);
          }
        } catch {}
      }

      const data = await api.getNotifications();
      if (Array.isArray(data)) {
        const dismissedSet = getDismissedPopupIds();
        // Detect newly arrived unread notifications that require immediate popup
        data.forEach((n) => {
          const isPaid = n.order_id ? paidSet.has(n.order_id) : false;
          if (n.status === 'UNREAD' && !dismissedSet.has(n.id) && !seenIdsRef.current.has(n.id)) {
            seenIdsRef.current.add(n.id);

            // Trigger popup for urgent notification types only if not already paid
            if (
              (user.role === 'farmer' && n.type === 'NEW_ORDER') ||
              (user.role === 'customer' && n.type === 'ORDER_CONFIRMED' && n.requires_action && !isPaid) ||
              (user.role === 'customer' && n.type === 'ORDER_REJECTED') ||
              (user.role === 'farmer' && n.type === 'PAYMENT_RECEIVED') ||
              (user.role === 'farmer' && n.type === 'FPO_INVITATION')
            ) {
              setActivePopupNotif(n);
              playNotificationChime();
            }
          }
        });
        setNotifications(data);
      }
    } catch {
      // offline / momentary polling failure
    }
  };

  // Initialize SSE & BroadcastChannel
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    fetchNotifications();

    // BroadcastChannel for instant cross-tab sync
    try {
      const bc = new BroadcastChannel('farmiq_bus');
      bc.onmessage = (msg) => {
        if (msg.data && msg.data.type) {
          if (msg.data.type === 'ORDER_PAID' && msg.data.orderId) {
            setPaidOrderIds((prev) => new Set(prev).add(msg.data.orderId));
            setActivePopupNotif((curr) => (curr?.order_id === msg.data.orderId ? null : curr));
            setNotifications((prev) =>
              prev.map((n) =>
                n.order_id === msg.data.orderId ? { ...n, status: 'READ', requires_action: false } : n
              )
            );
          }
          fetchNotifications();
        }
      };
      channelRef.current = bc;
    } catch {
      // BroadcastChannel unsupported
    }

    // Server-Sent Events (SSE) Stream
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/notifications/stream');
      evtSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type) {
            fetchNotifications();
          }
        } catch {
          // heartbeat
        }
      };
    } catch {
      // SSE unsupported fallback
    }

    // Polling interval fallback
    const interval = setInterval(fetchNotifications, 4000);

    return () => {
      clearInterval(interval);
      if (evtSource) evtSource.close();
      if (channelRef.current) channelRef.current.close();
    };
  }, [user]);

  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' } : n))
      );
    } catch {
      // fallback
    }
  };

  // Farmer accepts order from popup or drawer
  const handleFarmerAccept = async (orderId: number) => {
    setIsActioning(true);
    try {
      await api.acceptOrder(orderId);
      if (activePopupNotif?.order_id === orderId) {
        setActivePopupNotif(null);
      }
      fetchNotifications();
      if (onOrderAccepted) onOrderAccepted(orderId);

      // Broadcast to other tabs
      channelRef.current?.postMessage({ type: 'ORDER_ACCEPTED', orderId });
    } catch (err: any) {
      alert(err.message || 'Failed to accept order.');
    } finally {
      setIsActioning(false);
    }
  };

  // Farmer rejects order
  const handleFarmerReject = async (orderId: number) => {
    const reason = window.prompt('Please enter a reason for rejecting this order (optional):', 'Out of fresh stock');
    if (reason === null) return; // user cancelled prompt

    setIsActioning(true);
    try {
      await api.rejectOrder(orderId, reason);
      if (activePopupNotif?.order_id === orderId) {
        setActivePopupNotif(null);
      }
      fetchNotifications();
      if (onOrderRejected) onOrderRejected(orderId);

      channelRef.current?.postMessage({ type: 'ORDER_REJECTED', orderId });
    } catch (err: any) {
      alert(err.message || 'Failed to reject order.');
    } finally {
      setIsActioning(false);
    }
  };

  // Farmer responds to FPO Collective invitation
  const handleFPOInviteRespond = async (collectiveId: string, action: 'accept' | 'decline') => {
    setIsActioning(true);
    try {
      const res = await api.respondToFPOInvite(collectiveId, action);
      alert(res.message);
      if (activePopupNotif?.collective_id === collectiveId) {
        setActivePopupNotif(null);
      }
      fetchNotifications();
      channelRef.current?.postMessage({ type: 'FPO_INVITE_RESPONDED', collectiveId, action });
    } catch (err: any) {
      alert(err.message || 'Failed to respond to FPO invitation.');
    } finally {
      setIsActioning(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Navbar Notification Bell */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
          title="Notifications & Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white font-black text-[10px] rounded-full flex items-center justify-center animate-bounce shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Drawer */}
        {isOpen && (
          <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden z-50 flex flex-col max-h-[85vh]">
            <div className="px-4 py-3 border-b border-stone-100 bg-stone-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-stone-900">Notifications ({notifications.length})</h4>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-stone-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-stone-400 text-xs">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition text-xs ${
                      n.status === 'UNREAD' ? 'bg-emerald-50/40' : 'bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-stone-900">
                        <span>{n.title}</span>
                        {n.status === 'UNREAD' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-stone-600 text-xs mt-1 leading-relaxed">{n.message}</p>

                    {/* Action buttons inside drawer if pending action */}
                    {n.requires_action && n.type === 'NEW_ORDER' && user.role === 'farmer' && n.order_id && (
                      <div className="mt-2 flex items-center gap-2 pt-2 border-t border-stone-200/60">
                        <button
                          type="button"
                          onClick={() => handleFarmerAccept(n.order_id!)}
                          disabled={isActioning}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFarmerReject(n.order_id!)}
                          disabled={isActioning}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {n.type === 'ORDER_CONFIRMED' && n.order_id && user.role === 'customer' && (() => {
                      const isPaid = (n.order_id ? paidOrderIds.has(n.order_id) : false) || n.requires_action === false;
                      return (
                        <div className="mt-2 flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60 flex-wrap">
                          {isPaid ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" /> Paid via UPI
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Payment Pending
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
                            {onTrackOrder && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  onTrackOrder(n.order_id!);
                                }}
                                className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 border border-teal-200"
                                title="Live Delivery Tracking"
                              >
                                <Truck className="w-3.5 h-3.5 text-teal-700" />
                                <span>Track</span>
                              </button>
                            )}
                            {onOpenInvoice && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  onOpenInvoice(n.order_id!);
                                }}
                                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                title="View Commercial Invoice"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Invoice</span>
                              </button>
                            )}
                            {!isPaid && onPayNow && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsOpen(false);
                                  onPayNow(n.order_id!);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Pay Farmer via UPI"
                              >
                                <IndianRupee className="w-3.5 h-3.5" />
                                <span>Pay Now</span>
                              </button>
                            )}
                            {n.whatsapp_url && (
                              <a
                                href={n.whatsapp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                                title="Open WhatsApp Accepted Alert"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {n.type === 'FPO_INVITATION' && n.collective_id && n.status === 'UNREAD' && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleFPOInviteRespond(n.collective_id!, 'decline')}
                          disabled={isActioning}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFPOInviteRespond(n.collective_id!, 'accept')}
                          disabled={isActioning}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Join FPO</span>
                        </button>
                      </div>
                    )}

                    {n.status === 'UNREAD' && (
                      <div className="mt-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleMarkRead(n.id)}
                          className="text-[10px] text-stone-400 hover:text-stone-700 transition cursor-pointer"
                        >
                          Mark read
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Real-time High-Priority Alert Modal Popup rendered via portal directly onto document.body */}
      {activePopupNotif &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in duration-200">
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center animate-pulse">
                  <Bell className="w-4 h-4 text-emerald-200" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-wide">{activePopupNotif.title}</h3>
                  <p className="text-[11px] text-emerald-200">
                    {new Date(activePopupNotif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDismissPopup(activePopupNotif)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* If NEW_ORDER (Farmer notification) */}
              {activePopupNotif.type === 'NEW_ORDER' ? (
                <>
                  <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-2.5 text-xs text-stone-800">
                    <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                      <span className="text-stone-500">Order ID:</span>
                      <span className="font-mono font-bold text-emerald-900">#{activePopupNotif.order_id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-stone-500 block text-[10px]">Customer Name:</span>
                        <span className="font-bold text-stone-900">{activePopupNotif.customer_name || 'Customer'}</span>
                      </div>
                    </div>
                    {activePopupNotif.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
                        <div>
                          <span className="text-stone-500 block text-[10px]">Customer Phone:</span>
                          <span className="font-semibold text-stone-900">{activePopupNotif.customer_phone}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <span className="text-stone-500 block text-[10px]">Ordered Produce:</span>
                        <span className="font-bold text-stone-900">{activePopupNotif.products_summary}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-stone-500 block text-[10px]">Delivery Address:</span>
                        <span className="font-semibold text-stone-800">{activePopupNotif.delivery_address}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-emerald-200/60">
                      <span className="font-bold text-stone-700">Order Total:</span>
                      <span className="text-lg font-black text-emerald-800 font-mono">
                        ₹{(activePopupNotif.order_total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 text-center">
                    Accept to automatically generate the commercial tax invoice and notify the customer.
                  </p>

                  {/* Real-time WhatsApp alert link for farmer */}
                  {activePopupNotif.whatsapp_url && (
                    <div className="pt-0.5">
                      <a
                        href={activePopupNotif.whatsapp_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-emerald-700" />
                        <span>📲 Open WhatsApp Order Alert</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFarmerReject(activePopupNotif.order_id!)}
                      disabled={isActioning}
                      className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Reject Order
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFarmerAccept(activePopupNotif.order_id!)}
                      disabled={isActioning}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isActioning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Accept Order</span>
                    </button>
                  </div>
                </>
              ) : activePopupNotif.type === 'ORDER_CONFIRMED' ? (
                /* Customer Order Confirmed Alert with Track Order, Pay, and Invoice options */
                <>
                  <div className="bg-emerald-50/80 border border-emerald-300 p-4 rounded-xl space-y-2.5 text-xs text-stone-800 shadow-2xs">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span className="text-sm">Order #{activePopupNotif.order_id} Accepted by Farmer!</span>
                    </div>
                    <p className="text-stone-700 leading-relaxed font-medium">{activePopupNotif.message}</p>
                    {activePopupNotif.invoice_number && (
                      <div className="pt-2 border-t border-emerald-200/80 flex justify-between text-xs items-center">
                        <span className="text-stone-500 font-semibold">Commercial Invoice:</span>
                        <span className="font-mono font-bold text-emerald-950 bg-white px-2 py-0.5 rounded border border-emerald-200">
                          #{activePopupNotif.invoice_number}
                        </span>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const isPaid = (activePopupNotif.order_id ? paidOrderIds.has(activePopupNotif.order_id) : false) || !activePopupNotif.requires_action;
                    const oid = activePopupNotif.order_id!;

                    return (
                      <div className="space-y-2 pt-1">
                        {/* 3 Main Action Options: Track Order, Pay, Invoice */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {onTrackOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                handleDismissPopup(activePopupNotif);
                                onTrackOrder(oid);
                              }}
                              className="py-2.5 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                            >
                              <Truck className="w-4 h-4" />
                              <span>Track Order</span>
                            </button>
                          )}

                          {!isPaid && onPayNow && (
                            <button
                              type="button"
                              onClick={() => {
                                handleDismissPopup(activePopupNotif);
                                onPayNow(oid);
                              }}
                              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 animate-pulse"
                            >
                              <IndianRupee className="w-4 h-4" />
                              <span>Pay via UPI</span>
                            </button>
                          )}

                          {onOpenInvoice && (
                            <button
                              type="button"
                              onClick={() => {
                                handleDismissPopup(activePopupNotif);
                                onOpenInvoice(oid);
                              }}
                              className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-stone-200 cursor-pointer active:scale-95"
                            >
                              <FileText className="w-4 h-4 text-emerald-700" />
                              <span>View Invoice</span>
                            </button>
                          )}
                        </div>

                        {/* WhatsApp Message Alert Link + Dismiss */}
                        <div className="flex items-center gap-2 pt-1">
                          {activePopupNotif.whatsapp_url && (
                            <a
                              href={activePopupNotif.whatsapp_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 text-emerald-700" />
                              <span>WhatsApp Confirmation</span>
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDismissPopup(activePopupNotif)}
                            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : activePopupNotif.type === 'FPO_INVITATION' ? (
                /* FPO Collective Invitation Alert */
                <>
                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-3 text-xs text-stone-800">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                      <span>FPO Collective Invitation</span>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-emerald-100 shadow-sm space-y-1.5">
                      <div className="font-bold text-stone-900 text-sm">{activePopupNotif.collective_name || 'Farmer Producer Collective'}</div>
                      <p className="text-stone-600 text-xs leading-relaxed">{activePopupNotif.message}</p>
                    </div>
                    <div className="text-[11px] text-stone-600 bg-amber-50 border border-amber-200/60 p-2.5 rounded-lg">
                      💡 Joining this collective allows you to pool produce quotas, assemble certified commercial lots together, and fulfill institutional bulk purchase orders.
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFPOInviteRespond(activePopupNotif.collective_id!, 'decline')}
                      disabled={isActioning}
                      className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFPOInviteRespond(activePopupNotif.collective_id!, 'accept')}
                      disabled={isActioning}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isActioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      <span>Accept & Join FPO</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Farmer Payment Received Alert */
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2 text-xs text-stone-800 text-center">
                    <span className="text-3xl">💰</span>
                    <h4 className="text-sm font-bold text-emerald-900">Payment Successfully Received!</h4>
                    <p className="text-stone-600">{activePopupNotif.message}</p>
                    {activePopupNotif.transaction_id && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 text-[11px] font-mono text-stone-600">
                        Ref UTR: {activePopupNotif.transaction_id}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismissPopup(activePopupNotif)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Dismiss
                  </button>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
