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
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-400 font-extrabold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block animate-pulse-ring" />
            Live Table Dispatcher
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 font-semibold">Map order streams to floor stations or guest tables</p>
        </div>
        
        {/* Custom Input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="TABLE #"
            value={customTable}
            onChange={(e) => setCustomTable(e.target.value)}
            className="minimal-input px-3.5 py-2 text-xs text-white focus:outline-none placeholder-zinc-700 w-28 tracking-widest uppercase font-bold text-center"
          />
          <button
            type="submit"
            className="minimal-btn-primary text-white px-4 py-2 rounded-md font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer h-9 flex items-center"
          >
            Dispatch Port
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
          
          let borderClass = 'border-zinc-800/80 bg-zinc-900/10 hover:border-zinc-700/80 hover:bg-zinc-900/30';
          let textClass = 'text-zinc-500';
          let statusLight = 'bg-zinc-800';

          if (isActive) {
            borderClass = 'border-orange-500/40 bg-orange-500/[0.04] shadow-[0_4px_20px_rgba(249,115,22,0.06)]';
            textClass = 'text-white font-extrabold';
            statusLight = 'bg-orange-500 animate-pulse-ring';
          } else if (hasItems) {
            borderClass = 'border-amber-500/30 bg-amber-500/[0.03] hover:border-amber-500/50 hover:bg-amber-500/[0.05]';
            textClass = 'text-amber-400 font-extrabold';
            statusLight = 'bg-amber-500';
          }

          return (
            <button
              key={table}
              onClick={() => selectActiveTable(table)}
              className={`h-16 flex flex-col justify-between p-3 rounded-lg border text-left transition-all duration-300 relative cursor-pointer group ${borderClass} ${textClass}`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-mono font-black text-sm tracking-tight group-hover:text-white transition-colors">
                  T{table.split(' ')[1] || table}
                </span>
                <span className={`w-2 h-2 rounded-full ${statusLight} transition-all duration-300`} />
              </div>
              
              <div className="text-[8px] font-bold uppercase tracking-wider">
                {isActive ? (
                  <span className="text-orange-400 font-extrabold">Active</span>
                ) : hasItems ? (
                  <span className="text-amber-500 font-mono">₹{cartTotal.toFixed(0)} ({cartItemsCount})</span>
                ) : (
                  <span className="text-zinc-600">Ready</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Active Selection Display */}
      {activeTable && (
        <div className="flex items-center justify-between bg-zinc-950/80 px-4 py-3 border border-white/3 rounded-lg animate-slide-in relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse-ring" />
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold">
              Active Session Link: <span className="text-orange-400 font-extrabold ml-1.5 font-mono">#{activeTable.toUpperCase()}</span>
            </span>
          </div>
          <button
            onClick={() => selectActiveTable(null)}
            className="text-[9px] text-zinc-500 font-extrabold hover:text-red-400 uppercase tracking-widest transition-colors cursor-pointer"
          >
            ✕ Release Station
          </button>
        </div>
      )}
    </div>
  );
}

export default TableSelector;
