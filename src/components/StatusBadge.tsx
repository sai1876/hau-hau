import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'cancelled' | 'paid' | 'active' | 'inactive';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let bgClass = 'bg-[#201f1f] text-[#e5e2e1] border-[#2e2e2e]';
  const text = status.toUpperCase();

  if (status === 'completed' || status === 'paid' || status === 'active') {
    bgClass = 'bg-[#152e1f] text-[#6bff8f] border-[#22c55e]/20';
  } else if (status === 'pending') {
    bgClass = 'bg-[#3a2f15] text-[#ffbc7c] border-[#ff9500]/20';
  } else if (status === 'cancelled' || status === 'inactive') {
    bgClass = 'bg-[#3b1212] text-[#ffdad6] border-[#ef4444]/20';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold border ${bgClass}`}>
      {text}
    </span>
  );
}
export default StatusBadge;
