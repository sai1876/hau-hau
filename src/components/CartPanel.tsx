import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface CartPanelProps {
  onClose?: () => void;
}

export function CartPanel({ onClose }: CartPanelProps) {
  const { 
    activeTable, 
    tableCarts, 
    updateCartQuantity, 
    removeFromCart, 
    clearTableCart, 
    confirmOrder,
    confirmAction
  } = useApp();

  const [paymentMode, setPaymentMode] = useState<'cash' | 'online' | 'tokens' | null>(null);

  const cartItems = activeTable ? tableCarts[activeTable] || [] : [];
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const requiredTokens = Math.round((subtotal / 30) * 100) / 100;

  const isValid = 
    activeTable !== null && 
    cartItems.length > 0 && 
    paymentMode !== null;

  const handlePaymentModeChange = (mode: 'cash' | 'online' | 'tokens' | null) => {
    setPaymentMode(mode);
  };

  const handleConfirm = () => {
    if (!isValid || !paymentMode) return;
    const success = confirmOrder(paymentMode);
    if (success) {
      setPaymentMode(null);
      if (onClose) onClose();
    }
  };

  const handleClear = () => {
    if (!activeTable) return;
    confirmAction(
      `Are you sure you want to clear the cart for ${activeTable}?`,
      () => clearTableCart(activeTable)
    );
  };

  if (!activeTable) {
    return (
      <div className="minimal-card p-6 rounded-xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-zinc-800/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <span className="text-zinc-400 font-extrabold text-[10px] uppercase tracking-widest">Cart Inactive</span>
        <p className="text-[10px] text-zinc-500 mt-2 max-w-[170px] mx-auto leading-relaxed font-semibold">Select a table port to initialize order stream and checkout</p>
      </div>
    );
  }

  return (
    <div className="minimal-card rounded-xl h-full flex flex-col justify-between overflow-hidden relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="bg-zinc-950/90 px-4 py-4 border-b border-white/5 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse-ring" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-white font-black">
            CART: {activeTable}
          </span>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-[10px] text-orange-400 hover:text-orange-300 uppercase font-extrabold tracking-widest cursor-pointer"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col relative z-10">
        
        {/* Cart Items List */}
        <div className="p-4 flex flex-col gap-2 shrink-0">
          {cartItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
              <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Order cart is empty</span>
              <p className="text-[10px] text-zinc-600 mt-1 font-semibold">Select items from the left menu</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.menuItemId} 
                className="flex items-center justify-between bg-zinc-950/40 p-3 border border-white/3 rounded-lg hover:border-white/8 transition-colors duration-200"
              >
                <div className="flex flex-col pr-2 flex-1">
                  <span className="font-extrabold text-xs text-zinc-200 leading-tight">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1 font-semibold">
                    ₹{item.price.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Steppers */}
                  <div className="flex items-center bg-zinc-950 border border-white/5 rounded-md overflow-hidden h-8 shadow-xs">
                    <button 
                      onClick={() => updateCartQuantity(item.menuItemId, -1)}
                      className="w-7 h-full flex items-center justify-center text-sm text-zinc-500 hover:text-white hover:bg-white/3 transition-colors font-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-black text-xs text-zinc-100">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateCartQuantity(item.menuItemId, 1)}
                      className="w-7 h-full flex items-center justify-center text-sm text-zinc-500 hover:text-white hover:bg-white/3 transition-colors font-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Trash */}
                  <button 
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="text-zinc-600 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-md border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Validation details */}
        <div className="bg-zinc-950/50 p-4 border-t border-white/5 flex flex-col gap-4.5 shrink-0">
          <div className="receipt-line" />
          
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400">Total Subtotal</span>
            <span className="text-lg font-black text-white font-mono">₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Payment selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-500 mb-0.5">Payment Billing Mode</span>
            <div className="grid grid-cols-3 gap-2.5">
              {(['cash', 'online', 'tokens'] as const).map((mode) => {
                const active = paymentMode === mode;
                let borderClass = 'border-white/3 text-zinc-500 bg-zinc-900/10 hover:bg-white/2 hover:text-zinc-400';
                let icon = null;

                if (mode === 'cash') {
                  icon = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.879c.97.97 2.63.97 3.6 0 1.18-1.18 1.18-3.1 0-4.282L10.5 10.18" />
                    </svg>
                  );
                  if (active) borderClass = 'border-orange-500/40 text-orange-400 bg-orange-500/[0.04] font-extrabold shadow-[0_0_12px_rgba(249,115,22,0.06)]';
                } else if (mode === 'online') {
                  icon = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6" />
                    </svg>
                  );
                  if (active) borderClass = 'border-emerald-500/40 text-emerald-400 bg-emerald-500/[0.04] font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.06)]';
                } else if (mode === 'tokens') {
                  icon = (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                  if (active) borderClass = 'border-blue-500/40 text-blue-400 bg-blue-500/[0.04] font-extrabold shadow-[0_0_12px_rgba(59,130,246,0.06)]';
                }

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handlePaymentModeChange(mode)}
                    disabled={cartItems.length === 0}
                    className={`py-3 px-1 text-[9px] uppercase tracking-widest border rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${borderClass}`}
                  >
                    {icon}
                    <span>{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMode === 'tokens' && (
            <div className="flex flex-col gap-2 bg-blue-500/[0.02] border border-blue-500/20 p-3 rounded-lg animate-fade-in mt-1">
              <div className="flex justify-between items-center text-[9px] font-extrabold text-blue-400 uppercase tracking-widest">
                <span>Deduction Estimate</span>
                <span className="font-mono text-zinc-500 font-semibold">Rate: ₹30/token</span>
              </div>
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-zinc-400 font-sans font-semibold text-[10px] uppercase">Tokens Required:</span>
                <span className="text-blue-400 font-black text-sm">{requiredTokens} TK</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Sticky Action buttons Footer */}
      <div className="bg-zinc-950/90 p-4 border-t border-white/5 flex flex-col gap-2 shrink-0 z-10 relative">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full minimal-btn-primary disabled:bg-zinc-900/50 disabled:text-zinc-600 disabled:border-transparent text-white font-extrabold text-xs uppercase tracking-wider py-3.5 rounded-lg active:scale-[0.98] transition-all disabled:cursor-not-allowed touch-target flex items-center justify-center cursor-pointer shadow-md"
        >
          Dispatch Order Stream
        </button>
        
        {cartItems.length > 0 && (
          <button
            onClick={handleClear}
            className="w-full bg-transparent hover:bg-red-500/5 text-[9px] font-extrabold text-red-400/50 hover:text-red-400 py-2 transition-all uppercase tracking-widest cursor-pointer rounded-md"
          >
            Clear Active Cart
          </button>
        )}
      </div>
    </div>
  );
}

export default CartPanel;
