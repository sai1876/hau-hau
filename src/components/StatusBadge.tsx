import React from 'react';

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'cancelled' | 'paid' | 'active' | 'inactive';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let bgClass = 'bg-[#18181b] text-[#a1a1aa] border-[#2d2d30]';
  const text = status.charAt(0).toUpperCase() + status.slice(1);

  if (status === 'completed' || status === 'paid' || status === 'active') {
    bgClass = 'bg-[#142918] text-[#71d384] border-[#2e7d32]/35';
  } else if (status === 'pending') {
    bgClass = 'bg-[#2a1b0c] text-[#f59e0b] border-[#e07b39]/35';
  } else if (status === 'cancelled' || status === 'inactive') {
    bgClass = 'bg-[#2c1313] text-[#f39c90] border-[#c0392b]/35';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-sm text-xs font-bold border ${bgClass}`}>
      {text}
    </span>
  );
}
export default StatusBadge;
