'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TokenAccount } from '../types';

interface TokenListProps {
  onStartEdit: (token: TokenAccount) => void;
  onViewHistory: (token: TokenAccount) => void;
}

export function TokenList({ onStartEdit, onViewHistory }: TokenListProps) {
  const { tokens, removeToken, confirmAction } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string, name: string, cardNo: string) => {
    confirmAction(
      `Are you sure you want to delete the token card #${cardNo} for "${name}"?`,
      () => removeToken(id)
    );
  };

  // Filter based on search input (name or card number)
  const filteredTokens = tokens.filter((token) => {
    const term = searchTerm.toLowerCase();
    return (
      token.name.toLowerCase().includes(term) ||
      token.cardNo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative">
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

      {/* Header Panel */}
      <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse-ring" />
          Active Student passes
        </h3>
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search student or card number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="minimal-input pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-650 w-full sm:w-64"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-zinc-550 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {filteredTokens.length === 0 ? (
        <div className="p-12 text-center opacity-65 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest block text-zinc-500">
            No Pass Records Found
          </span>
          <span className="text-[10px] text-zinc-600 mt-1.5 block font-semibold">
            {searchTerm ? 'Verify student credentials and try again' : 'Provision a new student NFC pass from the creation console'}
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-zinc-950/40 text-zinc-500">
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px] pl-5">Card No</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Student Name</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Token Balance</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Rupee Value</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px]">Provision Date</th>
                <th className="p-3.5 font-bold uppercase tracking-widest text-[8px] pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2 bg-zinc-950/10">
              {filteredTokens.map((token) => (
                <tr key={token.id} className="hover:bg-white/1.5 transition-colors duration-250">
                  <td className="p-3.5 pl-5 font-mono font-black text-blue-400">
                    <span className="bg-blue-500/5 px-2.5 py-1 rounded-md border border-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.04)]">
                      #{token.cardNo}
                    </span>
                  </td>
                  <td className="p-3.5 font-extrabold text-zinc-200">{token.name}</td>
                  <td className="p-3.5 text-zinc-300 font-mono">
                    <span className="bg-blue-500/10 text-blue-450 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-black text-[9px]">
                      {token.tokens.toFixed(2)} TK
                    </span>
                  </td>
                  <td className="p-3.5 text-emerald-400 font-mono font-black">
                    ₹{(token.tokens * 30).toFixed(2)}
                  </td>
                  <td className="p-3.5 text-zinc-500 font-semibold font-mono">
                    {new Date(token.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-3.5 pr-5 text-right flex justify-end gap-2 shrink-0">
                    <button
                      onClick={() => onViewHistory(token)}
                      className="px-2.5 py-1 border border-blue-500/20 hover:border-blue-500/50 rounded-md text-[9px] uppercase font-extrabold text-blue-400 hover:bg-blue-500/5 transition-all cursor-pointer active:scale-95 shadow-xs"
                    >
                      Ledger
                    </button>
                    <button
                      onClick={() => onStartEdit(token)}
                      className="px-2.5 py-1 border border-zinc-800 hover:border-zinc-500 rounded-md text-[9px] uppercase font-extrabold text-zinc-350 hover:bg-white/3 transition-all cursor-pointer active:scale-95"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(token.id, token.name, token.cardNo)}
                      className="px-2.5 py-1 border border-red-500/20 rounded-md text-[9px] uppercase font-extrabold text-red-400 hover:bg-red-500/5 transition-all cursor-pointer active:scale-95"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TokenList;
