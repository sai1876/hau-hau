'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TokenAccount } from '../types';

interface TokenAccountFormProps {
  editingToken: TokenAccount | null;
  onCancelEdit: () => void;
}

export function TokenAccountForm({ editingToken, onCancelEdit }: TokenAccountFormProps) {
  const { createNewToken, updateToken } = useApp();

  const [name, setName] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [tokensInput, setTokensInput] = useState('');
  const [rupeesInput, setRupeesInput] = useState('');

  // Sync state with editingToken if we are in Edit Mode
  useEffect(() => {
    if (editingToken) {
      setName(editingToken.name);
      setCardNo(editingToken.cardNo);
      setTokensInput(editingToken.tokens.toString());
      setRupeesInput((editingToken.tokens * 30).toString());
    } else {
      setName('');
      setCardNo('');
      setTokensInput('');
      setRupeesInput('');
    }
  }, [editingToken]);

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

    // Validate card number: must be exactly 3 digits
    const cardNoPattern = /^\d{3}$/;
    if (!cardNoPattern.test(cardNo.trim())) {
      alert('Card number must be exactly 3 digits (e.g. 005, 123, 999).');
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
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative">
      {/* Decorative top border glow if in edit mode */}
      {editingToken && (
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 to-indigo-600" />
      )}

      {/* Header */}
      <div className="bg-zinc-950/80 px-4 py-3.5 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400">
          {editingToken ? 'Modify Student Card' : 'Provision Pass Card'}
        </h3>
        {editingToken && (
          <button
            onClick={onCancelEdit}
            className="text-[9px] text-zinc-500 hover:text-white uppercase font-extrabold tracking-widest cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      {/* NFC Plastic Card Live Preview */}
      <div className="p-4.5 border-b border-white/5 bg-zinc-950/40">
        <div className="text-[8px] uppercase tracking-widest text-zinc-500 font-extrabold mb-3 text-center">NFC Card Live Preview</div>
        <div className="nfc-card w-full h-40 rounded-xl p-4.5 flex flex-col justify-between text-white relative">
          {/* Card branding */}
          <div className="flex justify-between items-start relative z-10">
            <div className="flex flex-col">
              <span className="text-[8px] tracking-widest uppercase font-black text-white/45">HAU HAU PORTAL</span>
              <span className="text-[10px] font-black tracking-wider text-orange-400 mt-0.5">STUDENT PASS</span>
            </div>
            <div className="nfc-card-chip" />
          </div>

          {/* Tokens & value display */}
          <div className="flex flex-col mt-1.5 relative z-10">
            <span className="text-[8px] uppercase tracking-wider text-white/40 font-bold">BALANCE</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-black text-blue-300">
                {parseFloat(tokensInput) ? parseFloat(tokensInput).toFixed(2) : '0.00'} <span className="text-xs font-sans font-extrabold">TK</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                ≈ ₹{parseFloat(rupeesInput) ? parseFloat(rupeesInput).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>

          {/* Cardholder details */}
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-white/5 relative z-10">
            <div className="flex flex-col pr-4 flex-1">
              <span className="text-[7px] uppercase tracking-widest text-white/40 font-bold">HOLDER</span>
              <span className="text-xs font-extrabold tracking-wide uppercase truncate text-zinc-100">
                {name.trim() || 'Awaiting Name Input'}
              </span>
            </div>
            <div className="flex flex-col text-right shrink-0">
              <span className="text-[7px] uppercase tracking-widest text-white/40 font-bold">CARD ID</span>
              <span className="text-xs font-mono font-black text-blue-400">
                #{cardNo ? cardNo.padStart(3, '0') : '000'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="p-4.5 flex flex-col gap-4 text-xs">
        {/* Student Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">
            Student Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Alice Cooper"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
          />
        </div>

        {/* Card Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">
            Card Number (3 Digits)
          </label>
          <input
            type="text"
            required
            maxLength={3}
            placeholder="e.g. 001"
            value={cardNo}
            onChange={(e) => setCardNo(e.target.value.replace(/\D/g, ''))} // only allow digits
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-mono text-center tracking-widest"
          />
          <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-wider">
            Numeric, unique, and exactly 3 digits.
          </span>
        </div>

        {/* Tokens & Rupees Dual Input */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tokens Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">
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
                className="minimal-input pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-zinc-700 font-mono w-full"
              />
              <span className="absolute right-2.5 text-[9px] text-zinc-500 font-bold uppercase tracking-wider select-none pointer-events-none">
                TK
              </span>
            </div>
          </div>

          {/* Rupees Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-widest">
              Amount (₹)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-[10px] text-zinc-500 font-bold pointer-events-none">
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
                className="minimal-input pl-6 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-mono w-full"
              />
            </div>
          </div>
        </div>

        <span className="text-[8px] text-zinc-650 font-bold uppercase tracking-wider text-center">
          1 Token = ₹30.00 exchange rate.
        </span>

        {/* Submit */}
        <div className="flex gap-2.5 pt-1.5">
          {editingToken && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="minimal-btn-secondary flex-1 text-white font-extrabold py-2.5 rounded-lg uppercase tracking-wider transition-transform active:scale-[0.98] text-[10px] h-10 flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="minimal-btn-primary flex-1 text-white font-extrabold py-2.5 rounded-lg uppercase tracking-wider transition-transform active:scale-[0.98] text-[10px] h-10 flex items-center justify-center cursor-pointer shadow-sm"
          >
            {editingToken ? 'Save Card' : 'Provision Card'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TokenAccountForm;
