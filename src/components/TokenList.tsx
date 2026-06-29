'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TokenAccount } from '../types';
import { TokenIcon } from './TokenIcon';
import { InfoTag } from './InfoTag';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Pagination } from './Pagination';

interface TokenListProps {
  onStartEdit: (token: TokenAccount) => void;
  onViewHistory: (token: TokenAccount) => void;
}

const ITEMS_PER_PAGE = 8;

export function TokenList({ onStartEdit, onViewHistory }: TokenListProps) {
  const { tokens, removeToken, confirmAction } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredTokens.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTokens = filteredTokens.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1); // reset to page 1 on search
  };

  return (
    <div className="minimal-card rounded-xl flex flex-col overflow-hidden relative bg-surface border border-border">
      <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

      {/* Header Panel */}
      <div className="bg-surface-header px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <h3 className="text-xs text-foreground font-bold flex items-center gap-2">
          Active Cards
          <span className="text-[10px] bg-surface-container border border-border text-text-muted px-2 py-0.5 rounded-full font-bold">{filteredTokens.length}</span>
        </h3>
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search student or card number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="minimal-input pl-9 pr-4 py-2 text-xs text-white placeholder-text-muted/50 w-full sm:w-64"
          />
          <MagnifyingGlass size={14} weight="duotone" className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {filteredTokens.length === 0 ? (
        <div className="p-12 text-center opacity-65 relative z-10">
          <span className="text-xs font-bold block text-text-muted">
            No pass records found
          </span>
          <span className="text-xs text-text-muted mt-1.5 block font-semibold">
            {searchTerm ? 'Verify card credentials and try again' : 'Issue a new student NFC pass from the creation console'}
          </span>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-header/40 text-text-muted">
                  <th className="p-3.5 pl-5 text-xs font-semibold">Card No</th>
                  <th className="p-3.5 text-xs font-semibold">Student Name</th>
                  <th className="p-3.5 text-xs font-semibold">
                    <span className="flex items-center gap-1">
                      Token Balance
                      <InfoTag text="Physical pass units loaded onto the card. Always represented as whole integers." position="bottom" />
                    </span>
                  </th>
                  <th className="p-3.5 text-xs font-semibold">
                    <span className="flex items-center">
                      Store Credit
                      <InfoTag text="Digital change in Rupees accumulated from overpaying in whole tokens. Applied automatically on the next checkout." position="bottom" />
                    </span>
                  </th>
                  <th className="p-3.5 text-xs font-semibold">Provision Date</th>
                  <th className="p-3.5 pr-5 text-xs font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface/10">
                {pagedTokens.map((token) => (
                  <tr key={token.id} className="hover:bg-surface-container/20 transition-colors duration-250">
                    <td className="p-3.5 pl-5 font-mono font-bold text-blue-400">
                      <span className="bg-blue-500/5 px-2.5 py-1 rounded-md border border-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.04)]">
                        #{token.cardNo}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-foreground">{token.name}</td>
                    <td className="p-3.5 text-foreground font-mono">
                      <span className="inline-flex items-center bg-blue-500/10 text-blue-450 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-bold text-[10px] whitespace-nowrap">
                        {token.tokens} <TokenIcon className="ml-1 w-3.5 h-3.5 text-amber-550 shrink-0" />
                      </span>
                    </td>
                    <td className="p-3.5 text-foreground font-mono">
                      <span className="bg-success/10 text-success px-2.5 py-0.5 rounded-full border border-success/20 font-bold text-[10px]">
                        ₹{(token.balanceRupees || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-3.5 text-text-muted font-mono">
                      {new Date(token.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onViewHistory(token)}
                          className="px-3 py-1.5 h-8 min-h-0 border border-border rounded-lg text-[11px] font-bold text-text-muted hover:text-foreground hover:bg-surface-container/30 transition-colors cursor-pointer"
                        >
                          History
                        </button>
                        <button
                          onClick={() => onStartEdit(token)}
                          className="px-3 py-1.5 h-8 min-h-0 border border-primary/20 rounded-lg text-[11px] font-bold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                        >
                          Recharge
                        </button>
                        <button
                          onClick={() => handleDelete(token.id, token.name, token.cardNo)}
                          className="px-3 py-1.5 h-8 min-h-0 border border-error/20 rounded-lg text-[11px] font-bold text-error hover:bg-error/5 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTokens.length}
            itemsPerPage={ITEMS_PER_PAGE}
            label="cards"
          />
        </>
      )}
    </div>
  );
}

export default TokenList;
