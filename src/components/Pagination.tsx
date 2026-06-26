'use client';

import React from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  label?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  label = 'records',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const endItem   = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface-header/40">
      {/* Record info */}
      <span className="text-[10px] text-text-muted font-semibold">
        {startItem && endItem && totalItems
          ? `${startItem}–${endItem} of ${totalItems} ${label}`
          : `Page ${currentPage} of ${totalPages}`}
      </span>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-foreground hover:bg-surface-container/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <CaretLeft size={12} weight="bold" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-[11px] text-text-muted">
              ···
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`w-7 h-7 flex items-center justify-center rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                currentPage === p
                  ? 'bg-primary text-white shadow-[0_0_10px_rgba(224,123,57,0.25)]'
                  : 'border border-border text-text-muted hover:text-foreground hover:bg-surface-container/50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-border text-text-muted hover:text-foreground hover:bg-surface-container/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <CaretRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
