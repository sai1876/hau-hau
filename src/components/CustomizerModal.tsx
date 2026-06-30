import React, { useState } from 'react';
import { MenuItem } from '../types';
import { X, Check } from '@phosphor-icons/react';

interface CustomizerModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (customization: {
    spiceLevel?: string;
    addons?: { name: string; price: number }[];
    notes?: string;
  }) => void;
}

export function CustomizerModal({ item, onClose, onConfirm }: CustomizerModalProps) {
  const [selectedSpice, setSelectedSpice] = useState<string | undefined>(
    item.customizationOptions?.spices && item.customizationOptions.spices.length > 0
      ? item.customizationOptions.spices[0]
      : undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<{ name: string; price: number }[]>([]);
  const [notes, setNotes] = useState('');

  const handleAddonClick = (addon: { name: string; price: number }) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      if (exists) {
        return prev.filter((a) => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const getSpicePrice = (spice: string | undefined): number => {
    if (!spice) return 0;
    const match = spice.match(/\+\s*₹?\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  const calculateTotalPrice = () => {
    const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const spicePrice = getSpicePrice(selectedSpice);
    return item.price + addonsTotal + spicePrice;
  };

  const handleAdd = () => {
    onConfirm({
      spiceLevel: selectedSpice,
      addons: selectedAddons,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-surface border border-border w-full max-w-md max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Customize Item</span>
            <span className="text-sm font-bold text-foreground mt-0.5">{item.name}</span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-border bg-surface-container/50 hover:bg-surface-container flex items-center justify-center text-text-muted hover:text-foreground transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
          {item.description && (
            <p className="text-text-muted leading-relaxed font-semibold bg-surface-container/30 p-3 rounded-lg border border-border/60">
              {item.description}
            </p>
          )}

          {/* Spice Options */}
          {item.customizationOptions?.spices && item.customizationOptions.spices.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Select Spice Level</span>
              <div className="grid grid-cols-3 gap-2">
                {item.customizationOptions.spices.map((spice) => {
                  const isSelected = selectedSpice === spice;
                  return (
                    <button
                      key={spice}
                      type="button"
                      onClick={() => setSelectedSpice(spice)}
                      className={`py-2.5 px-2 rounded-lg border text-center font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-surface-container/30 text-text-muted hover:text-foreground hover:bg-surface-container/50'
                      }`}
                    >
                      {spice}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons */}
          {item.customizationOptions?.addons && item.customizationOptions.addons.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Choose Add-ons</span>
              <div className="flex flex-col gap-2">
                {item.customizationOptions.addons.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.name === addon.name);
                  return (
                    <button
                      key={addon.name}
                      type="button"
                      onClick={() => handleAddonClick(addon)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-success bg-success/5'
                          : 'border-border bg-surface-container/30 hover:bg-surface-container/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-success border-transparent text-white' : 'border-border bg-surface'
                        }`}>
                          {isSelected && <Check size={10} weight="bold" />}
                        </div>
                        <span className={`font-bold text-xs ${isSelected ? 'text-foreground' : 'text-text-muted'}`}>
                          {addon.name}
                        </span>
                      </div>
                      <span className={`font-mono text-xs font-bold ${isSelected ? 'text-success-text' : 'text-text-muted'}`}>
                        +₹{addon.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Special Instructions</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g., No onions, extra crispy, spicy mayo on the side..."
              rows={2}
              className="w-full bg-surface-container/30 border border-border rounded-lg p-3 text-foreground placeholder:text-text-muted/65 outline-hidden focus:border-primary/50 focus:bg-surface-container/50 transition-all font-semibold resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-surface-header/40 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-border hover:bg-surface-container text-text-muted hover:text-foreground font-bold py-2.5 rounded-lg transition-colors text-xs cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAdd}
            className="flex-2 bg-primary hover:bg-primary-hover text-white font-bold py-2.5 rounded-lg transition-colors text-xs cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span>Add to Cart</span>
            <span className="opacity-40">•</span>
            <span className="font-mono">₹{calculateTotalPrice().toFixed(0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomizerModal;
