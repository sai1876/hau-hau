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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in">
      <div 
        className="bg-[#141416] border border-white/4 w-full max-w-lg max-h-[90vh] rounded-md overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/3 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Order Information</span>
            <span className="text-base font-bold text-white mt-0.5">ID: {order.id}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
          >
            ✕ Close
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-5">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-4 border border-white/2 rounded-sm">
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Table</span>
              <span className="text-sm font-bold text-white mt-0.5">{order.tableNumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Created By</span>
              <span className="text-sm font-bold text-white mt-0.5">{order.staffName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Payment Mode</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-zinc-300 uppercase font-mono">{order.paymentMode}</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentMode === 'tokens' && order.studentName && (
                <div className="mt-2 p-2 bg-blue-500/5 border border-blue-500/10 rounded-sm text-[9px] text-blue-400 font-mono flex flex-col gap-0.5 leading-snug">
                  <span>Student: <strong>{order.studentName}</strong></span>
                  <span>Card: <strong>#{order.tokenCardNo}</strong></span>
                  <span>Deducted: <strong>{order.tokensDeducted} tokens</strong></span>
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Order Status</span>
              <div className="mt-1">
                <StatusBadge status={order.orderStatus} />
              </div>
            </div>
          </div>

          {/* Itemized list */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Ordered Items</span>
            <div className="border border-white/3 rounded-sm overflow-hidden flex flex-col">
              <div className="max-h-[200px] overflow-y-auto divide-y divide-white/2">
                {order.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center p-3.5 bg-zinc-900/10">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-zinc-200">{item.name}</span>
                      <span className="text-[9px] text-zinc-500 font-mono mt-0.5">₹{item.price.toFixed(2)} each</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] text-zinc-500">Qty: <strong className="text-zinc-200 font-bold">{item.quantity}</strong></span>
                      <span className="text-xs font-bold text-zinc-200 font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              <div className="flex justify-between items-center p-3 bg-zinc-950 font-bold border-t border-white/3">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500">Total Amount</span>
                <span className="text-base text-orange-500 font-bold font-mono">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Activity Log</span>
            <div className="flex flex-col gap-3 pl-3.5 border-l border-white/4 py-1">
              <div className="flex flex-col relative">
                <span className="absolute left-[-19.5px] top-1 w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-xs font-bold text-zinc-200">Order Submitted</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              
              {order.completedAt && (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-19.5px] top-1 w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-zinc-200">Order Completed</span>
                  <span className="text-[9px] text-zinc-500 mt-0.5">{new Date(order.completedAt).toLocaleString()}</span>
                </div>
              )}
              
              {order.orderStatus === 'cancelled' && (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-19.5px] top-1 w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-bold text-zinc-200">Order Cancelled</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer actions */}
        <div className="bg-zinc-950/80 px-5 py-3.5 border-t border-white/3 flex justify-end">
          <button 
            onClick={onClose}
            className="minimal-btn-secondary px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
export default OrderDetailsModal;
