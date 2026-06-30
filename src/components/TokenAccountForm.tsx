'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TokenAccount } from '../types';
import { TokenIcon } from './TokenIcon';
import { InfoTag } from './InfoTag';

interface TokenAccountFormProps {
  editingToken: TokenAccount | null;
  onCancelEdit: () => void;
}

export function TokenAccountForm({ editingToken, onCancelEdit }: TokenAccountFormProps) {
  const { tokens, createNewToken, updateToken, settings, addToast } = useApp();
  const tokenValue = settings?.tokenValueInRupees || 30;

  const [name, setName] = useState(() => editingToken?.name ?? '');
  const [cardNo, setCardNo] = useState(() => editingToken?.cardNo ?? '');
  const [tokensInput, setTokensInput] = useState(() => editingToken ? editingToken.tokens.toString() : '');
  const [rupeesInput, setRupeesInput] = useState(() => editingToken ? (editingToken.tokens * tokenValue).toString() : '');
  const [showGenerator, setShowGenerator] = useState(false);
  const [digitsCount, setDigitsCount] = useState(6);

  // Validation States
  const [nameError, setNameError] = useState(false);
  const [cardNoError, setCardNoError] = useState(false);
  const [shakeName, setShakeName] = useState(false);
  const [shakeCardNo, setShakeCardNo] = useState(false);
  const [showVerifiedStamp, setShowVerifiedStamp] = useState(false);
  const [nameErrorMessage, setNameErrorMessage] = useState('');
  const [cardNoErrorMessage, setCardNoErrorMessage] = useState('');

  // Track the last seen editingToken.id to detect when the edit target changes
  const [lastEditId, setLastEditId] = useState<string | null>(() => editingToken?.id ?? null);

  const currentEditId = editingToken?.id ?? null;
  if (currentEditId !== lastEditId) {
    setLastEditId(currentEditId);
    setName(editingToken?.name ?? '');
    setCardNo(editingToken?.cardNo ?? '');
    setTokensInput(editingToken ? editingToken.tokens.toString() : '');
    setRupeesInput(editingToken ? (editingToken.tokens * tokenValue).toString() : '');
    setNameError(false);
    setCardNoError(false);
    setNameErrorMessage('');
    setCardNoErrorMessage('');
  }

  const handleGenerateUniqueCardNo = () => {
    let attempts = 0;
    let generated = '';
    const existingCardNos = new Set(tokens.map(t => t.cardNo));
    
    while (attempts < 1000) {
      const minVal = Math.pow(10, digitsCount - 1);
      const maxVal = Math.pow(10, digitsCount) - 1;
      const num = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      generated = num.toString();
      
      if (!existingCardNos.has(generated)) {
        break;
      }
      attempts++;
    }
    
    setCardNo(generated);
    setCardNoError(false);
    addToast(`Generated unique card number #${generated}!`, 'success');
  };

  const handleTokensChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    setTokensInput(cleanVal);
    const parsed = parseInt(cleanVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const rupees = parsed * tokenValue;
      setRupeesInput(rupees.toString());
    } else {
      setRupeesInput('');
    }
  };

  const handleRupeesChange = (val: string) => {
    setRupeesInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const tokens = Math.floor(parsed / tokenValue);
      setTokensInput(tokens.toString());
    } else {
      setTokensInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Neglect beginning and ending spaces by trimming first
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(true);
      setShakeName(true);
      setTimeout(() => setShakeName(false), 300);
      setNameErrorMessage('Student name cannot be empty.');
      return;
    }

    // Validate student name: letters and spaces only
    const namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(trimmedName)) {
      setNameError(true);
      setShakeName(true);
      setTimeout(() => setShakeName(false), 300);
      setNameErrorMessage('Student name can only contain letters and spaces.');
      return;
    }

    // Name uniqueness check (case-insensitive)
    const nameExists = tokens.some(t => {
      if (editingToken && t.id === editingToken.id) return false;
      return t.name.toLowerCase() === trimmedName.toLowerCase();
    });
    if (nameExists) {
      setNameError(true);
      setShakeName(true);
      setTimeout(() => setShakeName(false), 300);
      setNameErrorMessage(`The student name "${trimmedName}" is already registered. Name must be unique.`);
      return;
    }

    // Validate card number: must be 3 to 8 numeric digits
    const cardNoPattern = /^\d{3,8}$/;
    if (!cardNoPattern.test(cardNo.trim())) {
      setCardNoError(true);
      setShakeCardNo(true);
      setTimeout(() => setShakeCardNo(false), 300);
      setCardNoErrorMessage('Card number must be 3 to 8 digits (e.g. 005, 10042, 12345678).');
      return;
    }

    // Card ID uniqueness check
    const cardNoExists = tokens.some(t => {
      if (editingToken && t.id === editingToken.id) return false;
      return t.cardNo === cardNo.trim();
    });
    if (cardNoExists) {
      setCardNoError(true);
      setShakeCardNo(true);
      setTimeout(() => setShakeCardNo(false), 300);
      setCardNoErrorMessage(`The card ID #${cardNo.trim()} is already assigned to another student.`);
      return;
    }

    const numericTokens = parseInt(tokensInput, 10);
    if (isNaN(numericTokens) || numericTokens < 0) {
      addToast('Please enter a valid positive token count.', 'error');
      return;
    }

    // All validations passed! Show paperstamp animation and proceed
    setShowVerifiedStamp(true);
    setTimeout(async () => {
      if (editingToken) {
        const success = await updateToken(editingToken.id, {
          name: name.trim(),
          cardNo: cardNo.trim(),
          tokens: Math.round(numericTokens)
        });
        if (success) {
          onCancelEdit();
        }
      } else {
        const success = await createNewToken({
          name: name.trim(),
          cardNo: cardNo.trim(),
          tokens: Math.round(numericTokens)
        });
        if (success) {
          setName('');
          setCardNo('');
          setTokensInput('');
          setRupeesInput('');
        }
      }
      setShowVerifiedStamp(false);
    }, 1100);
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
        <div className="nfc-card w-full h-40 rounded-xl p-4.5 flex flex-col justify-between text-white relative overflow-hidden">
          {showVerifiedStamp && (
            <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none">
              <div className="border-4 border-dashed border-emerald-400 text-emerald-400 px-5 py-2.5 rounded-xl font-bold tracking-widest text-base uppercase bg-surface/95 shadow-2xl animate-paperstamp flex flex-col items-center justify-center gap-1">
                <svg className="w-6 h-6 shrink-0 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>VERIFIED</span>
              </div>
            </div>
          )}
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
            <div className="flex items-baseline justify-between w-full">
              <span className="text-xl font-mono font-bold text-blue-300 flex items-center">
                {parseInt(tokensInput, 10) || 0} <TokenIcon className="ml-1 w-4 h-4 text-blue-300" />
              </span>
              {editingToken && (editingToken.balanceRupees ?? 0) > 0 && (
                <span className="text-[9px] font-mono text-[#71d384] font-bold">
                  Credit: ₹{editingToken.balanceRupees?.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[9px] font-mono text-white/50 mt-0.5">
              Rupee equivalent: ₹{(parseInt(tokensInput, 10) || 0) * tokenValue}
            </span>
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
            onChange={(e) => {
              setName(e.target.value);
              setNameError(false);
              setNameErrorMessage('');
            }}
            className={`minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-semibold transition-all duration-200 ${
              nameError ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' : ''
            } ${shakeName ? 'animate-shake' : ''}`}
          />
          {nameErrorMessage && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              ⚠ {nameErrorMessage}
            </span>
          )}
        </div>

        {/* Card Number */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-text-muted font-bold flex items-center">
            Card Number (3–8 Digits)
            <InfoTag text="Unique identifier mapping to the student's physical NFC card (numeric, 3 to 8 digits long)." position="top" />
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. 100042 or 12345678"
              value={cardNo}
              onChange={(e) => {
                setCardNo(e.target.value.replace(/\D/g, ''));
                setCardNoError(false);
                setCardNoErrorMessage('');
              }}
              className={`minimal-input pl-3.5 pr-18 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono tracking-widest font-semibold w-full transition-all duration-200 ${
                cardNoError ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20 bg-red-500/5' : ''
              } ${shakeCardNo ? 'animate-shake' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowGenerator(!showGenerator)}
              className="absolute right-2 px-2.5 py-1 bg-surface-container border border-border text-[9px] rounded-md font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              {showGenerator ? 'Close Gen' : 'Generate'}
            </button>
          </div>

          {showGenerator && (
            <div className="flex flex-col gap-2.5 p-3 rounded-lg border border-border/80 bg-surface-container/20 mt-1 animate-slide-in">
              <div className="flex justify-between items-center text-[10px] text-text-muted font-bold">
                <span>Digits: {digitsCount}</span>
                <span>Range: 3 to 8</span>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={digitsCount}
                onChange={(e) => setDigitsCount(parseInt(e.target.value))}
                className="w-full accent-primary cursor-pointer h-1 bg-surface-container border border-border rounded-lg"
              />
              <button
                type="button"
                onClick={handleGenerateUniqueCardNo}
                className="minimal-btn-primary py-2 text-[10px] font-bold rounded-md cursor-pointer transition-all active:scale-98"
              >
                Generate Unique ID
              </button>
            </div>
          )}

          {cardNoErrorMessage && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              ⚠ {cardNoErrorMessage}
            </span>
          )}

          <span className="text-[10px] text-text-muted font-medium leading-relaxed">
            Numeric only, 3–8 digits. 
            {cardNo.length > 0 && cardNo.length < 6 && (
              <span className="text-warning font-bold block mt-1">
                ⚠ Card numbers under 6 digits are weak. 6–8 digits, QR ID, or RFID-style is recommended for production.
              </span>
            )}
          </span>
        </div>

        {/* Tokens & Rupees Dual Input */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tokens Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-bold flex items-center">
              Tokens
              <InfoTag text="Balance loaded onto the card in whole units. Recharges cannot be fractional." position="bottom-left" />
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.01"
                required
                min="0"
                placeholder="e.g. 10"
                value={tokensInput}
                disabled={!!editingToken}
                onChange={(e) => handleTokensChange(e.target.value)}
                className="minimal-input pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-container/20"
              />
              <span className="absolute right-2.5 flex items-center select-none pointer-events-none">
                <TokenIcon className="w-3.5 h-3.5 text-text-muted" />
              </span>
            </div>
          </div>

          {/* Rupees Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-muted font-bold flex items-center">
              Amount (₹)
              <InfoTag text="Equivalent value in Rupees based on the conversion rate. Adjusting this will compute the corresponding number of whole tokens." position="bottom-right" />
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
                disabled={!!editingToken}
                onChange={(e) => handleRupeesChange(e.target.value)}
                className="minimal-input pl-6 pr-3.5 py-2.5 text-xs text-white placeholder-text-muted/50 font-mono w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-container/20"
              />
            </div>
          </div>
        </div>

        {editingToken && (
          <div className="text-[10px] text-text-muted/90 bg-surface-container/30 border border-border/60 p-2.5 rounded-lg leading-relaxed flex gap-1.5 items-start">
            <span className="mt-0.5">ℹ</span>
            <span>Token balance cannot be modified here. Use the <strong>Recharge</strong> action in the card list to load balance.</span>
          </div>
        )}

        <span className="text-[10px] text-text-muted font-medium text-center">
          1 Token = ₹{tokenValue.toFixed(2)} exchange rate.
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
