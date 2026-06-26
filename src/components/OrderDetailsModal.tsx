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
        className="bg-surface border border-border w-full max-w-lg max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow accent */}
        <div className="absolute -left-12 -top-12 w-28 h-28 bg-primary/5 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="bg-surface-header px-6 py-4 border-b border-border flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <span className="text-xs text-text-muted font-semibold">Order Details</span>
            <span className="text-sm font-bold text-foreground mt-0.5 font-mono">Order #{order.id.replace('HH-', '')}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-xs text-text-muted hover:text-foreground cursor-pointer w-7 h-7 bg-surface-container hover:bg-border rounded-full flex items-center justify-center transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6 relative z-10">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-surface-container/30 p-4 border border-border rounded-lg">
            <div className="flex flex-col">
              <span className="text-xs text-text-muted font-semibold">Table</span>
              <span className="text-sm font-bold mt-1 font-mono text-primary">{order.tableNumber}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-text-muted font-semibold">Staff</span>
              <span className="text-xs font-bold text-foreground mt-1">{order.staffName}</span>
            </div>
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-xs text-text-muted font-semibold">Payment</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-foreground capitalize font-mono">{order.paymentMode}</span>
                <StatusBadge status={order.paymentStatus} />
              </div>
              {order.paymentMode === 'tokens' && (
                <div className="mt-2.5 p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-md text-[10px] text-blue-400 font-mono flex flex-col gap-1 leading-snug">
                  {order.studentName && <span>Student: <strong className="text-foreground font-semibold">{order.studentName}</strong></span>}
                  {order.tokenCardNo && <span>Card: <strong className="text-foreground font-semibold">#{order.tokenCardNo}</strong></span>}
                  <span>Deducted: <strong className="text-foreground font-semibold">{order.tokensDeducted || Math.round((order.total / 30) * 100) / 100} tokens</strong></span>
                </div>
              )}
            </div>
            <div className="flex flex-col col-span-2 sm:col-span-1">
              <span className="text-xs text-text-muted font-semibold">Status</span>
              <div className="mt-1">
                <StatusBadge status={order.orderStatus} />
              </div>
            </div>
          </div>

          {/* Itemized list */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-muted font-semibold">Items Ordered</span>
            <div className="border border-border rounded-lg overflow-hidden flex flex-col bg-surface-container/20">
              <div className="max-h-[180px] overflow-y-auto divide-y divide-border">
                {order.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between items-center p-3.5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{item.name}</span>
                      <span className="text-[10px] text-text-muted font-mono mt-0.5">₹{item.price.toFixed(2)} each</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] text-text-muted font-semibold">Qty: <strong className="text-foreground font-bold">{item.quantity}</strong></span>
                      <span className="text-xs font-bold text-foreground font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              <div className="flex justify-between items-center p-4 bg-surface-header font-bold border-t border-border">
                <span className="text-xs text-text-muted font-bold">Grand Total</span>
                <span className="text-base text-primary font-bold font-mono">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-3">
            <span className="text-xs text-text-muted font-semibold">Order Tracker</span>
            <div className="flex flex-col gap-4 pl-4 border-l border-border py-1.5 ml-2.5">
              
              {/* Submitted step */}
              <div className="flex flex-col relative">
                <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-primary animate-pulse-ring" />
                <span className="text-xs font-bold text-foreground">Order Placed & Logged</span>
                <span className="text-[10px] text-text-muted font-mono mt-0.5">
                  {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              
              {/* Fulfillment step */}
              {order.orderStatus === 'completed' && order.completedAt ? (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-[#71d384] animate-pulse-ring-emerald" />
                  <span className="text-xs font-bold text-[#71d384]">Order Completed & Cleared</span>
                  <span className="text-[10px] text-text-muted font-mono mt-0.5">
                    {new Date(order.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ) : order.orderStatus === 'cancelled' ? (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-error" />
                  <span className="text-xs font-bold text-error">Order Cancelled & Voided</span>
                  <span className="text-[10px] text-text-muted font-mono mt-0.5">Fulfillment interrupted</span>
                </div>
              ) : (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="text-xs font-bold text-text-muted">Order Queue / In Prep</span>
                  <span className="text-[10px] text-text-muted/60 font-mono mt-0.5 font-semibold">Awaiting operator verification</span>
                </div>
              )}

            </div>
          </div>
        </div>
        
        {/* Footer actions */}
        <div className="bg-surface-header px-6 py-4 border-t border-border flex justify-end relative z-10">
          <button 
            onClick={onClose}
            className="minimal-btn-secondary px-5 py-2 rounded-md text-xs font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal;
