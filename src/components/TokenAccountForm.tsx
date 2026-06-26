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
      // 1 Token = 30 Rupees
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
      // Convert rupees to tokens
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
    <div className="minimal-card rounded-md flex flex-col overflow-hidden relative">
      {/* Decorative top border if in edit mode */}
      {editingToken && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500" />
      )}

      <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3 flex justify-between items-center">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
          {editingToken ? 'Edit Student Card' : 'Provision Token Card'}
        </h3>
        {editingToken && (
          <button
            onClick={onCancelEdit}
            className="text-[9px] text-zinc-500 hover:text-white uppercase font-bold tracking-widest cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 text-xs">
        {/* Student Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
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
          <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
            Card Number (3 Digits)
          </label>
          <input
            type="text"
            required
            maxLength={3}
            placeholder="e.g. 001"
            value={cardNo}
            onChange={(e) => setCardNo(e.target.value.replace(/\D/g, ''))} // only allow digits
            className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-mono"
          />
          <span className="text-[8px] text-zinc-600 font-medium">
            Must be numeric, unique, and exactly 3 digits.
          </span>
        </div>

        {/* Tokens & Rupees Dual Input */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tokens Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
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
            <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
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

        <span className="text-[8px] text-zinc-600 font-medium">
          Entering either field automatically converts the other (1 Token = ₹30.00).
        </span>

        {/* Submit */}
        <div className="flex gap-2 pt-2">
          {editingToken && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="minimal-btn-secondary flex-1 text-white font-bold py-2.5 rounded-sm uppercase tracking-wider transition-transform active:scale-[0.98] text-[10px] h-10 flex items-center justify-center cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="minimal-btn-primary flex-1 text-white font-bold py-2.5 rounded-sm uppercase tracking-wider transition-transform active:scale-[0.98] text-[10px] h-10 flex items-center justify-center cursor-pointer"
          >
            {editingToken ? 'Save Changes' : 'Create Card'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TokenAccountForm;
