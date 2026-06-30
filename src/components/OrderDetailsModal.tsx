import React from 'react';
import { Order } from '../types';
import { StatusBadge } from './StatusBadge';
import { X } from '@phosphor-icons/react';

import { useApp } from '../context/AppContext';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
  const { settings } = useApp();
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
                        <X size={14} weight="bold" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6 relative z-10">
          {/* Metadata & Token Info */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 bg-surface-container/30 p-4.5 border border-border rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Table</span>
                <span className="text-sm font-bold mt-1.5 font-mono text-primary">{order.tableNumber}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Staff</span>
                <span className="text-sm font-semibold text-foreground mt-1.5">{order.staffName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Payment</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-sm font-bold text-foreground capitalize font-mono leading-none">{order.paymentMode}</span>
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Order Status</span>
                <div className="mt-1.5">
                  <StatusBadge status={order.orderStatus} />
                </div>
              </div>
            </div>

            {order.paymentMode === 'tokens' && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl text-xs text-blue-400 font-mono flex flex-col gap-2.5 leading-snug shadow-sm">
                <div className="flex justify-between border-b border-blue-500/10 pb-2 mb-1">
                  <span className="text-[10px] text-blue-400/70 font-bold uppercase tracking-wider">Token Details</span>
                  <span className="text-[10px] font-bold text-blue-400 font-mono">Deduction Info</span>
                </div>
                {order.studentName && (
                  <div className="flex justify-between">
                    <span className="text-blue-400/80">Student Name:</span>
                    <strong className="text-foreground font-semibold">{order.studentName}</strong>
                  </div>
                )}
                {order.tokenCardNo && (
                  <div className="flex justify-between">
                    <span className="text-blue-400/80">Card Number:</span>
                    <strong className="text-foreground font-semibold">#{order.tokenCardNo}</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-blue-400/80">Tokens Deducted:</span>
                  <strong className="text-foreground font-semibold">
                    {order.tokensDeducted !== undefined ? order.tokensDeducted : Math.ceil(order.total / 30)} tokens
                  </strong>
                </div>
                {order.creditApplied !== undefined && order.creditApplied > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-400/80">Credit Used:</span>
                    <strong className="text-foreground font-semibold">₹{order.creditApplied.toFixed(2)}</strong>
                  </div>
                )}
                {order.creditReturned !== undefined && order.creditReturned > 0 && (
                  <div className="flex justify-between">
                    <span className="text-blue-400/80">Credit Saved:</span>
                    <strong className="text-foreground font-semibold">₹{order.creditReturned.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Itemized list */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Items Ordered</h4>
            <div className="border border-border rounded-xl overflow-hidden flex flex-col bg-surface-container/10">
              <div className="divide-y divide-border">
                {order.items.map((item, index) => (
                  <div key={item.customId || `${item.menuItemId}-${index}`} className="flex justify-between items-start p-4 hover:bg-surface-container/5 transition-colors duration-200">
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <span className="text-sm font-bold text-foreground leading-tight">{item.name}</span>
                      {item.customization && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <span className="text-[10px] text-primary/90 font-bold">
                            {[
                              item.customization.spiceLevel,
                              ...(item.customization.addons?.map(a => a.name) || [])
                            ].filter(Boolean).join(', ')}
                          </span>
                          {item.customization.notes && (
                            <span className="text-[10px] text-text-muted italic font-medium">
                              "{item.customization.notes}"
                            </span>
                          )}
                        </div>
                      )}
                      <span className="text-[10px] text-text-muted font-mono mt-0.5">₹{item.price.toFixed(2)} each</span>
                    </div>
                    <div className="flex items-center gap-6 self-center">
                      <span className="text-xs text-text-muted font-semibold">
                        Qty: <strong className="text-foreground font-bold">{item.quantity}</strong>
                      </span>
                      <span className="text-sm font-bold text-foreground font-mono">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total Summary */}
              <div className="flex justify-between items-center px-4.5 py-4 bg-surface-header/80 font-bold border-t border-border">
                <span className="text-xs text-text-muted uppercase tracking-wider">Grand Total</span>
                <span className="text-lg text-primary font-bold font-mono">₹{order.total.toFixed(2)}</span>
              </div>
            </div>
            {settings?.receiptFooter && (
              <div className="text-center text-[10px] text-text-muted italic mt-2.5 leading-normal bg-surface-header/30 py-2 border border-dashed border-border rounded-lg px-3">
                {settings.receiptFooter}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">Order Timeline</h4>
            <div className="flex flex-col gap-5 pl-4 border-l-2 border-border/85 py-1 ml-2">
              
              {/* Placed step */}
              <div className="flex flex-col relative">
                <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20" />
                <span className="text-xs font-bold text-foreground">Order Placed</span>
                <span className="text-[10px] text-text-muted font-mono mt-0.5 font-medium">
                  {new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              
              {/* Fulfillment step */}
              {order.orderStatus === 'completed' && order.completedAt ? (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-success ring-4 ring-success/20" />
                  <span className="text-xs font-bold text-success">Order Completed & Cleared</span>
                  <span className="text-[10px] text-text-muted font-mono mt-0.5 font-medium">
                    {new Date(order.completedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ) : order.orderStatus === 'cancelled' ? (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-error ring-4 ring-error/20" />
                  <span className="text-xs font-bold text-error">Order Cancelled</span>
                  <span className="text-[10px] text-text-muted font-mono mt-0.5 font-medium">Fulfillment interrupted</span>
                </div>
              ) : (
                <div className="flex flex-col relative">
                  <span className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="text-xs font-bold text-text-muted">In Preparation</span>
                  <span className="text-[10px] text-text-muted/60 font-mono mt-0.5 font-semibold">Awaiting operator fulfillment</span>
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
