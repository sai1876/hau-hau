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
  const isValid = activeTable !== null && cartItems.length > 0 && paymentMode !== null;

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
      <div className="minimal-card p-6 rounded-md h-full flex flex-col items-center justify-center text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-widest">Cart Standby</span>
        <p className="text-[10px] text-zinc-600 mt-1 max-w-[150px] mx-auto leading-relaxed">Select a table port to initialize order stream</p>
      </div>
    );
  }

  return (
    <div className="minimal-card rounded-md h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300 font-bold">
            CART: {activeTable}
          </span>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-[9px] text-orange-500 hover:text-orange-400 uppercase font-bold tracking-widest cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 min-h-[160px]">
        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Cart is empty</span>
            <p className="text-[9px] text-zinc-600 mt-0.5">Add menu items</p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div 
              key={item.menuItemId} 
              className="flex items-center justify-between bg-zinc-900/10 p-2.5 border border-white/2 rounded-sm"
            >
              <div className="flex flex-col pr-2 flex-1">
                <span className="font-bold text-xs text-zinc-200 leading-tight">
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 font-medium">
                  ₹{item.price.toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Steppers */}
                <div className="flex items-center bg-zinc-950 border border-white/4 rounded-sm overflow-hidden h-7">
                  <button 
                    onClick={() => updateCartQuantity(item.menuItemId, -1)}
                    className="w-6 h-full flex items-center justify-center text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/2 transition-colors font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-xs text-white">
                    {item.quantity}
                  </span>
                  <button 
                    onClick={() => updateCartQuantity(item.menuItemId, 1)}
                    className="w-6 h-full flex items-center justify-center text-xs text-zinc-500 hover:text-zinc-300 hover:bg-white/2 transition-colors font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Remove Trash */}
                <button 
                  onClick={() => removeFromCart(item.menuItemId)}
                  className="text-zinc-600 hover:text-red-400 transition-colors p-1 cursor-pointer"
                  title="Remove item"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment details */}
      <div className="bg-zinc-950/80 p-4 border-t border-white/3 flex flex-col gap-4">
        <div className="receipt-line" />
        
        <div className="flex justify-between items-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Subtotal</span>
          <span className="text-base font-bold text-white font-mono">₹{subtotal.toFixed(2)}</span>
        </div>

        {/* Payment selector */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 mb-0.5">Billing Mode</span>
          <div className="grid grid-cols-3 gap-2">
            {(['cash', 'online', 'tokens'] as const).map((mode) => {
              const active = paymentMode === mode;
              let borderClass = 'border-white/[0.03] text-zinc-500 bg-zinc-900/10 hover:bg-white/[0.01] hover:text-zinc-400';
              let icon = null;

              if (mode === 'cash') {
                icon = (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.879c.97.97 2.63.97 3.6 0 1.18-1.18 1.18-3.1 0-4.282L10.5 10.18" />
                  </svg>
                );
                if (active) borderClass = 'border-orange-500/40 text-orange-400 bg-orange-500/[0.03] font-bold';
              } else if (mode === 'online') {
                icon = (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6" />
                  </svg>
                );
                if (active) borderClass = 'border-emerald-500/40 text-emerald-400 bg-emerald-500/[0.03] font-bold';
              } else if (mode === 'tokens') {
                icon = (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                );
                if (active) borderClass = 'border-blue-500/40 text-blue-400 bg-blue-500/[0.03] font-bold';
              }

              return (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  disabled={cartItems.length === 0}
                  className={`py-2 px-1 text-[9px] uppercase tracking-wider border rounded-sm transition-all flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${borderClass}`}
                >
                  {icon}
                  <span>{mode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={handleConfirm}
            disabled={!isValid}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-900 disabled:text-zinc-600 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-sm active:scale-[0.98] transition-transform disabled:cursor-not-allowed touch-target flex items-center justify-center cursor-pointer shadow-sm"
          >
            Dispatch Order
          </button>
          
          {cartItems.length > 0 && (
            <button
              onClick={handleClear}
              className="w-full bg-transparent hover:bg-red-500/5 text-[9px] font-bold text-red-400/60 hover:text-red-400 py-1.5 transition-colors uppercase tracking-widest cursor-pointer"
            >
              Clear Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default CartPanel;
