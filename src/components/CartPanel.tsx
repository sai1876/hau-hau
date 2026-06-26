import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TokenIcon } from './TokenIcon';
import { Trash, Money, CreditCard, Coins, ArrowCircleUp } from '@phosphor-icons/react';

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
      <div className="minimal-card p-6 rounded-xl h-full flex flex-col items-center justify-center text-center relative overflow-hidden bg-surface border border-border">
        <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center text-primary mb-4 shadow-inner animate-bounce">
                  <ArrowCircleUp size={28} weight="duotone" className="text-primary" />
        </div>
        <span className="text-foreground font-bold text-sm">Select a table to start</span>
        <p className="text-xs text-text-muted mt-2 max-w-[180px] mx-auto leading-relaxed">Choose a table from the grid above to begin taking an order</p>
      </div>
    );
  }

  return (
    <div className="minimal-card rounded-xl h-full flex flex-col justify-between overflow-hidden relative bg-surface border border-border">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="bg-surface-header px-4 py-4 border-b border-border flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-ring" />
          <span className="text-xs text-foreground font-bold">
            Order — {activeTable}
          </span>
        </div>
        
        {onClose && (
          <button 
            onClick={onClose}
            className="text-xs text-primary hover:text-primary-hover font-semibold cursor-pointer"
          >
            Close
          </button>
        )}
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col relative z-10">
        
        {/* Cart Items List */}
        <div className="p-4 flex flex-col gap-2 shrink-0">
          {cartItems.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
              <span className="text-xs font-bold text-text-muted">Order cart is empty</span>
              <p className="text-xs text-text-muted mt-1">Select items from the menu</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div 
                key={item.menuItemId} 
                className="flex items-center justify-between bg-surface-container/30 p-3 border border-border rounded-lg hover:border-text-muted/30 transition-colors duration-200"
              >
                <div className="flex flex-col pr-2 flex-1">
                  <span className="font-bold text-xs text-foreground leading-tight">
                    {item.name}
                  </span>
                  <span className="text-[11px] text-text-muted font-mono mt-1">
                    ₹{item.price.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Steppers */}
                  <div className="flex items-center bg-surface-container border border-border rounded-md overflow-hidden h-8 shadow-xs">
                    <button 
                      onClick={() => updateCartQuantity(item.menuItemId, -1)}
                      className="w-7 h-full flex items-center justify-center text-sm text-text-muted hover:text-foreground hover:bg-surface/40 transition-colors font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-mono font-bold text-xs text-foreground">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateCartQuantity(item.menuItemId, 1)}
                      className="w-7 h-full flex items-center justify-center text-sm text-text-muted hover:text-foreground hover:bg-surface/40 transition-colors font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Trash */}
                  <button 
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="text-text-muted/60 hover:text-error hover:bg-error/10 p-1.5 rounded-md border border-transparent hover:border-error/20 transition-all cursor-pointer"
                    title="Remove item"
                  >
                                        <Trash size={15} weight="duotone" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment & Validation details */}
        <div className="bg-surface-header/55 p-4 border-t border-border flex flex-col gap-4.5 shrink-0">
          <div className="receipt-line" />
          
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-text-muted font-semibold">Total</span>
            <span className="text-lg font-bold text-foreground font-mono">₹{subtotal.toFixed(2)}</span>
          </div>

          {/* Payment selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-muted font-bold mb-0.5">Payment Mode</span>
            <div className="grid grid-cols-3 gap-2.5">
              {(['cash', 'online', 'tokens'] as const).map((mode) => {
                const active = paymentMode === mode;
                let borderClass = 'border-border text-text-muted bg-surface/30 hover:bg-surface/50 hover:text-foreground';
                let icon = null;

                if (mode === 'cash') {
                  icon = <Money size={17} weight="duotone" />;
                  if (active) borderClass = 'border-primary text-primary bg-primary/5 font-bold shadow-[0_0_12px_rgba(224,123,57,0.06)]';
                } else if (mode === 'online') {
                  icon = <CreditCard size={17} weight="duotone" />;
                  if (active) borderClass = 'border-success text-[#71d384] bg-success/5 font-bold shadow-[0_0_12px_rgba(46,125,50,0.06)]';
                } else if (mode === 'tokens') {
                  icon = <Coins size={17} weight="duotone" />;
                  if (active) borderClass = 'border-blue-500/40 text-blue-400 bg-blue-500/5 font-bold shadow-[0_0_12px_rgba(59,130,246,0.06)]';
                }

                const displayLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handlePaymentModeChange(mode)}
                    disabled={cartItems.length === 0}
                    className={`py-3 px-1 text-xs border rounded-lg transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${borderClass}`}
                  >
                    {icon}
                    <span>{displayLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {paymentMode === 'tokens' && (
            <div className="flex flex-col gap-2 bg-blue-500/5 border border-blue-500/20 p-3 rounded-lg animate-fade-in mt-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                <span>Deduction Estimate</span>
                <span className="font-mono text-text-muted">Rate: ₹30/token</span>
              </div>
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-text-muted font-sans text-[11px]">Tokens Required:</span>
                <span className="text-blue-400 font-bold text-sm">{requiredTokens} <TokenIcon className="ml-1 w-3.5 h-3.5 text-blue-400" /></span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Sticky Action buttons Footer */}
      <div className="bg-surface-header p-4 border-t border-border flex flex-col gap-2 shrink-0 z-10 relative">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full minimal-btn-primary disabled:bg-surface-container/60 disabled:text-text-muted disabled:border-transparent text-white font-bold text-xs py-3.5 rounded-lg active:scale-[0.98] transition-all disabled:cursor-not-allowed touch-target flex items-center justify-center cursor-pointer shadow-md"
        >
          Place Order
        </button>
        
        {cartItems.length > 0 && (
          <button
            onClick={handleClear}
            className="w-full bg-transparent hover:bg-error/5 text-xs text-error/70 hover:text-error py-2 transition-all font-semibold cursor-pointer rounded-md"
          >
            Clear Order
          </button>
        )}
      </div>
    </div>
  );
}

export default CartPanel;
