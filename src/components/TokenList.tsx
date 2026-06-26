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
    <div className="minimal-card rounded-md flex flex-col overflow-hidden">
      <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
          Student Token Cards
        </h3>
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by student name or card no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="minimal-input pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-600 w-full sm:w-64"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5 text-zinc-600 absolute left-2.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
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
        <div className="p-8 text-center opacity-65">
          <span className="text-xs font-semibold uppercase tracking-wider block text-zinc-400">
            No Token Cards Found
          </span>
          <span className="text-[10px] text-zinc-600 mt-1 block">
            {searchTerm ? 'Try adjusting your search criteria' : 'Create cards using the provisioning panel on the right'}
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/3 bg-zinc-950/40 text-zinc-500">
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Card No</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Student Name</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Balance</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Equivalent Value</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Created At</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[9px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/2 bg-zinc-950/10">
              {filteredTokens.map((token) => (
                <tr key={token.id} className="hover:bg-white/1 transition-colors">
                  <td className="p-3 font-mono font-bold text-blue-400">
                    #{token.cardNo}
                  </td>
                  <td className="p-3 font-bold text-zinc-200">{token.name}</td>
                  <td className="p-3 text-zinc-300 font-mono">
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-sm border border-blue-500/20 font-bold text-[10px]">
                      {token.tokens} tokens
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-mono font-bold">
                    ₹{(token.tokens * 30).toFixed(2)}
                  </td>
                  <td className="p-3 text-zinc-600">
                    {new Date(token.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="p-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => onViewHistory(token)}
                      className="px-2.5 py-1 border border-blue-500/25 hover:border-blue-500/50 rounded-sm text-[9px] uppercase font-bold text-blue-400 hover:bg-blue-500/5 transition-colors cursor-pointer active:scale-95"
                    >
                      History
                    </button>
                    <button
                      onClick={() => onStartEdit(token)}
                      className="px-2.5 py-1 border border-zinc-700 hover:border-zinc-500 rounded-sm text-[9px] uppercase font-bold text-zinc-300 transition-colors cursor-pointer active:scale-95"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(token.id, token.name, token.cardNo)}
                      className="px-2.5 py-1 border border-red-500/20 rounded-sm text-[9px] uppercase font-bold text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer active:scale-95"
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
