import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TokenIcon } from './TokenIcon';
import { Trash, Money, CreditCard, Coins, ArrowCircleUp, Sparkle } from '@phosphor-icons/react';
import { InfoTag } from './InfoTag';

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
    confirmAction,
    tokens,
    tokenTransactions,
    settings
  } = useApp();

  const [paymentMode, setPaymentMode] = useState<'cash' | 'online' | 'tokens' | null>(null);
  const [tokenCardInput, setTokenCardInput] = useState('');

  // Grok AI States
  const [grokApiKey, setGrokApiKey] = useState('');
  const [isAnalyzingSpend, setIsAnalyzingSpend] = useState(false);
  const [spendInsights, setSpendInsights] = useState<any>(null);
  const [showSpendInsights, setShowSpendInsights] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGrokApiKey(localStorage.getItem('hau_hau_grok_api_key') || '');
    }
  }, []);

  // Reset insights when card input changes
  useEffect(() => {
    setSpendInsights(null);
    setShowSpendInsights(false);
  }, [tokenCardInput]);

  const handleGetSpendInsights = async () => {
    const card = tokens.find(t => t.cardNo === tokenCardInput.trim());
    if (!card) return;
    setIsAnalyzingSpend(true);
    try {
      const studentTxs = tokenTransactions.filter(tx => tx.cardNo === card.cardNo);
      const summary = {
        name: card.name,
        cardNo: card.cardNo,
        tokens: card.tokens,
        txCount: studentTxs.length,
        transactions: studentTxs.slice(0, 10).map(t => ({
          type: t.type,
          tokens: t.tokens,
          amount: t.amount,
          date: t.createdAt?.split('T')[0],
        })),
      };

      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-grok-api-key': grokApiKey,
        },
        body: JSON.stringify({
          action: 'spending-insights',
          data: summary,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch insights');
      const result = await res.json();
      setSpendInsights(result);
      setShowSpendInsights(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingSpend(false);
    }
  };

  const cartItems = activeTable ? tableCarts[activeTable] || [] : [];
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tokenValue = settings?.tokenValueInRupees || 30;
  const total = settings?.taxEnabled ? subtotal * 1.05 : subtotal;

  const studentCard = tokens.find(t => t.cardNo === tokenCardInput.trim());
  const balanceRupees = studentCard?.balanceRupees || 0;
  const amountPayable = Math.max(0, total - balanceRupees);
  const requiredTokens = Math.ceil(amountPayable / tokenValue);
  const hasSufficientTokens = studentCard ? studentCard.tokens >= requiredTokens : false;

  const isValid = 
    activeTable !== null && 
    cartItems.length > 0 && 
    paymentMode !== null &&
    (paymentMode !== 'tokens' || (tokenCardInput.trim() !== '' && studentCard !== undefined && hasSufficientTokens));

  const handlePaymentModeChange = (mode: 'cash' | 'online' | 'tokens' | null) => {
    setPaymentMode(mode);
    setTokenCardInput('');
  };

  const handleConfirm = async () => {
    if (!isValid || !paymentMode) return;
    const success = await confirmOrder(paymentMode, paymentMode === 'tokens' ? tokenCardInput.trim() : undefined);
    if (success) {
      setPaymentMode(null);
      setTokenCardInput('');
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
          
          {settings?.taxEnabled && (
            <div className="flex flex-col gap-1 px-1 font-mono text-[10px] leading-relaxed text-text-muted mb-1.5 border-b border-border/20 pb-2">
              <div className="flex justify-between">
                <span>Subtotal (Net):</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-warning/90">
                <span>Service Tax / GST (5%):</span>
                <span>₹{(subtotal * 0.05).toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-text-muted font-semibold">Total Amount</span>
            <span className="text-lg font-bold text-foreground font-mono">₹{total.toFixed(2)}</span>
          </div>

          {/* Payment selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-text-muted font-bold mb-0.5 flex items-center">
              Payment Mode
              <InfoTag text="Cash: direct physical payment. Online: external UPI/Card gateway. Tokens: deducts whole physical passes from student NFC cards." position="top" />
            </span>
            <div className={`grid ${settings?.manualUpiEnabled ?? true ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
              {(['cash', 'online', 'tokens'] as const).filter(mode => mode !== 'online' || (settings?.manualUpiEnabled ?? true)).map((mode) => {
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
            <div className="flex flex-col gap-3 bg-blue-500/5 border border-blue-500/20 p-3.5 rounded-lg animate-fade-in mt-1">
              <div className="flex justify-between items-center text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                <span className="flex items-center">
                  Token Payment Details
                  <InfoTag text="Deducts whole physical tokens. Any remaining change from order overpayment is saved back to the student's card as digital Rupees credit." position="top" />
                </span>
                <span className="font-mono text-text-muted">Rate: ₹{tokenValue}/token</span>
              </div>
              
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] text-text-muted font-bold uppercase">Student Card Number</label>
                <input
                  type="text"
                  placeholder="Enter card number (e.g. 001)"
                  value={tokenCardInput}
                  onChange={(e) => setTokenCardInput(e.target.value.replace(/\D/g, ''))}
                  className="minimal-input px-3 py-2 text-xs font-mono font-bold tracking-widest text-white placeholder-text-muted/40 w-full"
                />
              </div>

              {tokenCardInput.trim() !== '' && (
                <div className="text-[11px] font-semibold flex flex-col gap-1.5 border-t border-blue-500/10 pt-2.5 mt-1">
                   {!studentCard ? (
                     <span className="text-error font-bold flex items-center gap-1">⚠ Card not found</span>
                   ) : (
                     <>
                       <div className="flex justify-between text-success">
                         <span className="font-bold">✓ Verified: {studentCard.name}</span>
                         <span className="font-bold">{studentCard.tokens} tokens</span>
                       </div>

                       {/* Client-side low-token alert & AI Spend Insights */}
                       {(() => {
                         const studentTxs = tokenTransactions ? tokenTransactions.filter(tx => tx.cardNo === studentCard.cardNo && tx.type === 'deduction') : [];
                         const txsByDate: Record<string, number> = {};
                         studentTxs.forEach(tx => {
                           const dStr = tx.createdAt?.split('T')[0];
                           if (dStr) txsByDate[dStr] = (txsByDate[dStr] || 0) + tx.tokens;
                         });
                         const dates = Object.keys(txsByDate);
                         const avgTokensPerDay = dates.length >= 2 
                           ? Object.values(txsByDate).reduce((s, v) => s + v, 0) / dates.length 
                           : 1.5;

                         const remainingTokens = studentCard.tokens - requiredTokens;
                         const isDepletedSoon = remainingTokens <= avgTokensPerDay * 3;

                         return (
                           <div className="flex flex-col gap-2 mt-1.5 border-t border-blue-500/10 pt-2 shrink-0">
                             {isDepletedSoon && (
                               <div className="bg-warning/10 border border-warning/30 p-2 rounded-lg text-warning flex flex-col gap-1">
                                 <span className="font-bold flex items-center gap-1 text-[10px]">
                                   ⚠️ AI Smart Warning
                                 </span>
                                 <p className="text-[9px] text-text-muted leading-normal font-semibold">
                                   {studentCard.name} consumes ~{avgTokensPerDay.toFixed(1)} tokens/day. Balance after checkout ({remainingTokens} tokens) will run out in approx. {Math.max(0, remainingTokens / avgTokensPerDay).toFixed(1)} days.
                                 </p>
                               </div>
                             )}

                             <div className="flex justify-between items-center mt-0.5">
                               <span className="text-[10px] text-text-muted font-bold uppercase">AI Insights</span>
                               <button
                                 type="button"
                                 onClick={handleGetSpendInsights}
                                 disabled={isAnalyzingSpend}
                                 className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer disabled:opacity-50"
                               >
                                 {isAnalyzingSpend ? "Analyzing..." : "Generate AI Insights"}
                               </button>
                             </div>

                             {showSpendInsights && spendInsights && (
                               <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg flex flex-col gap-1.5 text-[10px] text-text-muted animate-slide-in relative">
                                 <button
                                   type="button"
                                   onClick={() => setShowSpendInsights(false)}
                                   className="absolute top-1 right-2 hover:text-white font-bold"
                                 >
                                   ×
                                 </button>
                                 <div className="font-semibold">
                                   <span className="text-blue-400 font-bold block">Rate: {spendInsights.consumptionRate}</span>
                                   <span className="block mt-1"><strong className="text-foreground">Habits:</strong> {spendInsights.spendingHabits}</span>
                                   <span className="block mt-1 text-[#71d384] font-bold">Suggested Recharge: {spendInsights.rechargeRecommendation} tokens</span>
                                   <span className="block text-[9px] opacity-75 mt-0.5">{spendInsights.explanation}</span>
                                 </div>
                               </div>
                             )}
                           </div>
                         );
                       })()}
                       <div className="flex flex-col gap-1 bg-surface-container/20 p-2 rounded border border-border/50 mt-1 font-mono text-[10px] leading-relaxed text-text-muted">
                          {settings?.taxEnabled ? (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal (Net):</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-warning/80">
                                <span>GST / Service Tax (5%):</span>
                                <span>₹{(subtotal * 0.05).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t border-border/30 pt-1 mt-0.5">
                                <span>Order Total (Gross):</span>
                                <span className="text-foreground font-semibold">₹{total.toFixed(2)}</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between">
                              <span>Order Total:</span>
                              <span className="text-foreground font-semibold">₹{subtotal.toFixed(2)}</span>
                            </div>
                          )}
                          {balanceRupees > 0 && (
                           <div className="flex justify-between text-[#71d384]">
                             <span>Card Store Credit:</span>
                             <span>-₹{Math.min(subtotal, balanceRupees).toFixed(2)}</span>
                           </div>
                         )}
                         <div className="flex justify-between border-t border-border/30 pt-1 mt-0.5">
                           <span>Amount Payable:</span>
                           <span className="text-foreground font-bold">₹{amountPayable.toFixed(2)}</span>
                         </div>
                         {!hasSufficientTokens ? (
                           <div className="text-error font-bold mt-1 text-[10px] font-sans">
                             ⚠ Insufficient card tokens! Required: {requiredTokens}, Card has: {studentCard.tokens}
                           </div>
                         ) : (
                           requiredTokens > 0 && (
                             <div className="flex justify-between text-blue-400 font-bold border-t border-border/30 pt-1 mt-0.5">
                               <span>New Change Saved:</span>
                               <span>+₹{((requiredTokens * tokenValue) - amountPayable).toFixed(2)}</span>
                             </div>
                           )
                         )}
                       </div>
                     </>
                   )}
                </div>
              )}

              <div className="flex justify-between items-center font-mono text-xs border-t border-blue-500/10 pt-2 mt-1">
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
