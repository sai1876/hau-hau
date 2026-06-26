import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export function TableSelector() {
  const { activeTable, selectActiveTable, tableCarts } = useApp();
  const [customTable, setCustomTable] = useState('');

  const quickTables = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8'];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTable.trim()) {
      const formattedTable = customTable.toLowerCase().startsWith('table') 
        ? customTable.trim()
        : `Table ${customTable.trim()}`;
      
      selectActiveTable(formattedTable);
      setCustomTable('');
    }
  };

  return (
    <div className="minimal-card p-5 rounded-xl flex flex-col gap-4.5 relative overflow-hidden">
      {/* Decorative background glow spot */}
      <div className="absolute -left-12 -top-12 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <h2 className="text-base text-foreground font-bold">Select a Table</h2>
          <p className="text-xs text-text-muted mt-1">Tap a table to start taking an order</p>
        </div>
        
        {/* Custom Input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter table number manually"
            value={customTable}
            onChange={(e) => setCustomTable(e.target.value)}
            className="minimal-input px-3 py-2 text-xs text-white focus:outline-none placeholder-text-muted/50 w-52 font-semibold text-left"
          />
          <button
            type="submit"
            className="minimal-btn-primary text-white px-4 py-2 rounded-md font-bold text-xs transition-all cursor-pointer h-9 flex items-center"
          >
            Open Table
          </button>
        </form>
      </div>

      {/* Grid of quick tables */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative z-10">
        {quickTables.map((table) => {
          const isActive = activeTable === table;
          const cart = tableCarts[table] || [];
          const hasItems = cart.length > 0;
          const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
          const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
          
          let borderClass = 'border-border bg-surface/20 hover:border-text-muted/30 hover:bg-surface/40';
          let textClass = 'text-text-muted';
          let statusLight = 'bg-border';

          if (isActive) {
            borderClass = 'border-primary bg-primary/5 shadow-[0_4px_20px_rgba(224,123,57,0.08)]';
            textClass = 'text-foreground font-bold';
            statusLight = 'bg-primary animate-pulse-ring';
          } else if (hasItems) {
            borderClass = 'border-primary/30 bg-primary/[0.02] hover:border-primary/50 hover:bg-primary/[0.04]';
            textClass = 'text-primary font-bold';
            statusLight = 'bg-primary';
          }

          return (
            <button
              key={table}
              onClick={() => selectActiveTable(table)}
              className={`h-16 min-w-[80px] flex flex-col justify-between p-3 rounded-lg border text-left transition-all duration-300 relative cursor-pointer group ${borderClass} ${textClass}`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-semibold text-xs leading-none group-hover:text-foreground transition-colors">
                  {table}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${statusLight} transition-all duration-300`} />
              </div>
              
              <div className="text-[9px] font-bold">
                {isActive ? (
                  <div className="flex items-center justify-between">
                    <span className="text-[#71d384] font-mono">
                      {hasItems ? `₹${cartTotal.toFixed(0)} · ${cartItemsCount} item${cartItemsCount !== 1 ? 's' : ''}` : 'Ready'}
                    </span>
                    <span className="bg-[#1b3821] text-[#71d384] text-[8px] px-1 py-0.2 rounded border border-[#2e7d32]/20 font-bold scale-90 origin-right">Active</span>
                  </div>
                ) : hasItems ? (
                  <span className="text-primary font-mono">₹{cartTotal.toFixed(0)} · {cartItemsCount} item{cartItemsCount !== 1 ? 's' : ''}</span>
                ) : (
                  <span className="text-text-muted/65">Ready</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Active Selection Display */}
      {activeTable && (
        <div className="flex items-center justify-between bg-[#1b3821]/20 px-4 py-3 border border-[#2e7d32]/30 rounded-lg animate-slide-in relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#71d384] animate-pulse-ring-emerald" />
            <span className="text-xs text-[#71d384] font-semibold">
              Active Session: <span className="font-bold ml-1">{activeTable}</span>
            </span>
          </div>
          <button
            onClick={() => selectActiveTable(null)}
            className="text-xs text-text-muted hover:text-error transition-colors cursor-pointer font-bold"
          >
            Close Table
          </button>
        </div>
      )}
    </div>
  );
}

export default TableSelector;
