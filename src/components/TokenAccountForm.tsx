'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TokenAccount } from '../types';
import { TokenIcon } from './TokenIcon';

interface TokenAccountFormProps {
  editingToken: TokenAccount | null;
  onCancelEdit: () => void;
}

export function TokenAccountForm({ editingToken, onCancelEdit }: TokenAccountFormProps) {
  const { createNewToken, updateToken } = useApp();

  const [name, setName] = useState(() => editingToken?.name ?? '');
  const [cardNo, setCardNo] = useState(() => editingToken?.cardNo ?? '');
  const [tokensInput, setTokensInput] = useState(() => editingToken ? editingToken.tokens.toString() : '');
  const [rupeesInput, setRupeesInput] = useState(() => editingToken ? (editingToken.tokens * 30).toString() : '');

  // Track the last seen editingToken.id to detect when the edit target changes
  const [lastEditId, setLastEditId] = useState<string | null>(() => editingToken?.id ?? null);

  const currentEditId = editingToken?.id ?? null;
  if (currentEditId !== lastEditId) {
    setLastEditId(currentEditId);
    setName(editingToken?.name ?? '');
    setCardNo(editingToken?.cardNo ?? '');
    setTokensInput(editingToken ? editingToken.tokens.toString() : '');
    setRupeesInput(editingToken ? (editingToken.tokens * 30).toString() : '');
  }

  const handleTokensChange = (val: string) => {
    setTokensInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const rupees = Math.round(parsed * 30 * 100) / 100;
      setRupeesInput(rupees.toString());
    } else {
      setRupeesInput('');
    }
  };

  const handleRupeesChange = (val: string) => {
    setRupeesInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const tokens = Math.round((parsed / 30) * 100) / 100;
      setTokensInput(tokens.toString());
    } else {
      setTokensInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cardNo || !tokensInput) return;

    // Validate card number: must be 3 to 6 numeric digits
    const cardNoPattern = /^\d{3,6}$/;
    if (!cardNoPattern.test(cardNo.trim())) {
      alert('Card number must be 3 to 6 digits (e.g. 005, 10042, 123456).');
      return;
    }

    const numericTokens = parseFloat(tokensInput);
    if (isNaN(numericTokens) || numericTokens < 0) {
      alert('Please enter a valid positive token count.');
      return;
    }

    if (editingToken) {
      const success = await updateToken(editingToken.id, {
        name: name.trim(),
        cardNo: cardNo.trim(),
        tokens: Math.round(numericTokens * 100) / 100
      });
      if (success) {
        onCancelEdit();
      }
    } else {
      const success = await createNewToken({
        name: name.trim(),
        cardNo: cardNo.trim(),
        tokens: Math.round(numericTokens * 100) / 100
      });
      if (success) {
        setName('');
        setCardNo('');
        setTokensInput('');
        setRupeesInput('');
      }
    }
  };

  return (
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative bg-surface border border-border">
      {/* Decorative top border glow if in edit mode */}
      {editingToken && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-primary" />
      )}

      {/* Header */}
      <div className="bg-surface-header px-4 py-3.5 border-b border-border flex justify-between items-center">
        <h3 className="text-xs text-foreground font-bold">
          {editingToken ? 'Modify Card' : 'Issue New Card'}
        </h3>
        {editingToken && (
          <button
            onClick={onCancelEdit}
            className="text-xs text-text-muted hover:text-foreground font-semibold cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {/* NFC Plastic Card Live Preview */}
      <div className="p-4.5 border-b border-border bg-surface-container/20">
        <div className="text-xs text-text-muted font-semibold mb-3 text-center">Card Preview</div>
        <div className="nfc-card w-full h-40 rounded-xl p-4.5 flex flex-col justify-between text-white relative">
          {/* Card branding */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex flex-col">
              <span className="text-[8px] tracking-wider uppercase font-bold text-white/50">HAU HAU PORTAL</span>
              <span className="text-[10px] font-bold tracking-wider text-foreground mt-0.5">STUDENT PASS</span>
            </div>
            <div className="nfc-card-chip" />
          </div>

          {/* Tokens & value display */}
          <div className="flex flex-col mt-1.5 relative z-10">
            <span className="text-[8px] uppercase tracking-wider text-white/50 font-bold">Balance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-bold text-blue-300">
                {parseFloat(tokensInput) ? parseFloat(tokensInput).toFixed(2) : '0.00'} <TokenIcon className="ml-1 w-3.5 h-3.5 text-blue-300" />
              </span>
              <span className="text-[10px] font-mono text-[#71d384] font-bold">
                ≈ ₹{parseFloat(rupeesInput) ? parseFloat(rupeesInput).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Cardholder details */}
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/5 relative z-10">
            <div className="flex flex-col pr-4 flex-1">
              <span className="text-[8px] uppercase tracking-wider text-white/50 font-bold">Holder</span>
              <span className={`text-xs font-bold truncate ${!name.trim() ? 'text-text-muted/65 italic font-normal' : 'text-foreground'}`}>
                {name.trim() || 'Enter name below'}
              </span>
            </div>
            <div className="flex flex-col text-right shrink-0">
              <span className="text-[8px] uppercase tracking-wider text-white/50 font-bold">Card ID</span>
              <span className="text-xs font-mono font-bold text-blue-300">
                #{cardNo ? cardNo.padStart(cardNo.length >= 4 ? cardNo.length : 3, '0') : '000'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="p-4.5 flex flex-col gap-4 text-xs">
        {/* Student Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold">
            Student Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Alice Cooper"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold"
          />
        </div>

        {/* Card Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold">
            Card Number (3–6 Digits)
          </label>
          <input
            type="text"
            required
            maxLength={6}
            placeholder="e.g. 001 or 10042"
            value={cardNo}
            onChange={(e) => setCardNo(e.target.value.replace(/\D/g, ''))} // only allow digits
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono text-center tracking-widest font-semibold"
          />
          <span className="text-[10px] text-text-muted font-medium">
            Numeric only, 3–6 digits. Owner decides the card length for this outlet.
          </span>
        </div>

        {/* Tokens & Rupees Dual Input */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tokens Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-bold">
              Tokens
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.01"
                required
                min="0"
                placeholder="e.g. 10"
                value={tokensInput}
                onChange={(e) => handleTokensChange(e.target.value)}
                className="minimal-input pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono w-full font-semibold"
              />
              <span className="absolute right-2.5 flex items-center select-none pointer-events-none">
                <TokenIcon className="w-3.5 h-3.5 text-text-muted" />
              </span>
            </div>
          </div>

          {/* Rupees Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-bold">
              Amount (₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-text-muted font-bold pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                placeholder="e.g. 300"
                value={rupeesInput}
                onChange={(e) => handleRupeesChange(e.target.value)}
                className="minimal-input pl-6 pr-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono w-full font-semibold"
              />
            </div>
          </div>
        </div>

        <span className="text-[10px] text-text-muted font-medium text-center">
          1 Token = ₹30.00 exchange rate.
        </span>

        {/* Submit */}
        <div className="flex gap-2.5 pt-1.5">
          {editingToken && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="minimal-btn-secondary flex-1 text-white font-bold py-2.5 rounded-lg transition-transform active:scale-[0.98] text-xs h-10 flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="minimal-btn-primary flex-1 text-white font-bold py-2.5 rounded-lg transition-transform active:scale-[0.98] text-xs h-10 flex items-center justify-center cursor-pointer shadow-sm"
          >
            {editingToken ? 'Save Card' : 'Issue Card'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TokenAccountForm;
