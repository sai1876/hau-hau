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
    <div className="minimal-card p-5 rounded-md flex flex-col gap-4 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" />
            Table Dispatcher
          </h2>
          <p className="text-[10px] text-zinc-500 mt-0.5">Select a table to assign and map orders</p>
        </div>
        
        {/* Custom Input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="TABLE #"
            value={customTable}
            onChange={(e) => setCustomTable(e.target.value)}
            className="minimal-input px-3 py-1.5 text-xs text-white focus:outline-none placeholder-zinc-700 w-24 tracking-wider uppercase font-medium"
          />
          <button
            type="submit"
            className="minimal-btn-primary text-white px-3.5 py-1.5 rounded-sm font-bold text-[10px] uppercase tracking-wider transition-transform active:scale-95 cursor-pointer"
          >
            Dispatch
          </button>
        </form>
      </div>

      {/* Grid of quick tables */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {quickTables.map((table) => {
          const isActive = activeTable === table;
          const cart = tableCarts[table] || [];
          const hasItems = cart.length > 0;
          
          let borderClass = 'border-zinc-800 bg-zinc-900/20 hover:border-zinc-700 hover:bg-zinc-900/40';
          let textClass = 'text-zinc-400';
          let statusLight = 'bg-zinc-800';

          if (isActive) {
            borderClass = 'border-orange-500/50 bg-orange-500/[0.03]';
            textClass = 'text-white font-bold';
            statusLight = 'bg-orange-500';
          } else if (hasItems) {
            borderClass = 'border-amber-500/30 bg-amber-500/[0.02] hover:border-amber-500/50';
            textClass = 'text-amber-400 font-semibold';
            statusLight = 'bg-amber-500';
          }

          return (
            <button
              key={table}
              onClick={() => selectActiveTable(table)}
              className={`h-10 flex items-center justify-between px-3.5 rounded-sm border text-[11px] font-mono transition-all relative cursor-pointer ${borderClass} ${textClass}`}
            >
              <span>#{table.split(' ')[1] || table}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${statusLight} transition-colors`} />
            </button>
          );
        })}
      </div>
      
      {/* Active Selection Display */}
      {activeTable && (
        <div className="flex items-center justify-between bg-zinc-950 px-4 py-2.5 border border-zinc-900 rounded-sm animate-slide-in">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
            Active Selection: <span className="text-white font-bold ml-1">{activeTable}</span>
          </span>
          <button
            onClick={() => selectActiveTable(null)}
            className="text-[10px] text-orange-500 font-bold hover:text-orange-400 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
export default TableSelector;
