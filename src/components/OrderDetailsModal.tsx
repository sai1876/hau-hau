import React from 'react';
import { Order } from '../types';
import { StatusBadge } from './StatusBadge';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-[#0b0b10]/95 border border-white/5 w-full max-w-lg max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -left-12 -top-12 w-28 h-28 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="bg-zinc-950/80 px-6 py-4 border-b border-white/5 flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-500">POS Order Registry</span>
            <span className="text-sm font-black text-white mt-0.5 font-mono">ID: #{order.id}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-[10px] text-zinc-400 hover:text-white uppercase font-extrabold tracking-widest cursor-pointer w-7 h-7 bg-white/2 hover:bg-white/8 rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6 relative z-10">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-4 border border-white/3 rounded-lg">
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">Table Station</span>
              <span className="text-sm font-black text-white mt-1 font-mono text-orange-400">{order.tableNumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">Floor Operator</span>
              <span className="text-xs font-bold text-zinc-200 mt-1">{order.staffName}</span>
            </div>
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">Billing mode</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-zinc-300 uppercase font-mono">{order.paymentMode}</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentMode === 'tokens' && (
                <div className="mt-2.5 p-2.5 bg-blue-500/[0.02] border border-blue-500/10 rounded-md text-[9px] text-blue-400 font-mono flex flex-col gap-1 leading-snug">
                  {order.studentName && <span>Student: <strong className="text-white font-semibold">{order.studentName}</strong></span>}
                  {order.tokenCardNo && <span>Card: <strong className="text-white font-semibold">#{order.tokenCardNo}</strong></span>}
                  <span>Deducted: <strong className="text-white font-semibold">{order.tokensDeducted || Math.round((order.total / 30) * 100) / 100} tokens</strong></span>
                </div>
              )}
            </div>
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">Fulfillment Status</span>
              <div className="mt-1">
                <StatusBadge status={order.orderStatus} />
              </div>
            </div>
          </div>

          {/* Itemized list */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">Itemized Receipt</span>
            <div className="border border-white/3 rounded-lg overflow-hidden flex flex-col">
              <div className="max-h-[180px] overflow-y-auto divide-y divide-white/2">
                {order.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center p-3.5 bg-zinc-950/20">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-200">{item.name}</span>
                      <span className="text-[9px] text-zinc-500 font-mono mt-0.5">₹{item.price.toFixed(2)} each</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] text-zinc-500 font-semibold">Qty: <strong className="text-zinc-200 font-bold">{item.quantity}</strong></span>
                      <span className="text-xs font-extrabold text-zinc-200 font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              <div className="flex justify-between items-center p-4 bg-zinc-950 font-bold border-t border-white/3">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">Grand Total</span>
                <span className="text-base text-orange-400 font-black font-mono">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-3">
            <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">Order Lifecycle Tracker</span>
            <div className="flex flex-col gap-4 pl-4 border-l border-white/5 py-1.5 ml-2.5">
              
              {/* Submitted step */}
              <div className="flex flex-col relative">
                <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse-ring" />
                <span className="text-xs font-bold text-zinc-200">Order Placed & Logged</span>
                <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                  {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              
              {/* Fulfillment step */}
              {order.orderStatus === 'completed' && order.completedAt ? (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-ring-emerald" />
                  <span className="text-xs font-bold text-emerald-400">Order Completed & Cleared</span>
                  <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                    {new Date(order.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ) : order.orderStatus === 'cancelled' ? (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-red-400">Order Cancelled & Voided</span>
                  <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Fulfillment interrupted</span>
                </div>
              ) : (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="text-xs font-bold text-zinc-500">Order Queue / In Prep</span>
                  <span className="text-[9px] text-zinc-600 font-mono mt-0.5">Awaiting operator verification</span>
                </div>
              )}

            </div>
          </div>
        </div>
        
        {/* Footer actions */}
        <div className="bg-zinc-950/80 px-6 py-4 border-t border-white/5 flex justify-end relative z-10">
          <button 
            onClick={onClose}
            className="minimal-btn-secondary px-5 py-2 rounded-md text-[10px] font-extrabold uppercase tracking-wider cursor-pointer"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
