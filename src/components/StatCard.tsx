import React from 'react';
import {
  ClipboardText,
  ClockCountdown,
  CheckCircle,
  Money,
  CreditCard,
  Coins,
} from '@phosphor-icons/react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  color?: 'primary' | 'success' | 'warning' | 'default';
  iconType?: 'order' | 'pending' | 'completed' | 'cash' | 'online' | 'token';
}

export function StatCard({ title, value, subtext, color = 'default', iconType }: StatCardProps) {
  let valueColor = 'text-foreground';
  if (color === 'primary') valueColor = 'text-primary';

  const renderIcon = () => {
    const props = { size: 18, weight: 'duotone' as const, className: 'text-zinc-500' };
    switch (iconType) {
      case 'order':     return <ClipboardText  {...props} />;
      case 'pending':   return <ClockCountdown {...props} />;
      case 'completed': return <CheckCircle    {...props} />;
      case 'cash':      return <Money          {...props} />;
      case 'online':    return <CreditCard     {...props} />;
      case 'token':     return <Coins          {...props} />;
      default:          return null;
    }
  };

  return (
    <div className="minimal-card p-4.5 rounded-xl flex flex-col justify-between shadow-sm">
      <div className="flex justify-between items-center">
        <span className="text-text-muted text-xs font-semibold">{title}</span>
        {renderIcon()}
      </div>
      <div className="mt-3.5 flex flex-col">
        <span className={`text-xl font-bold tracking-tight ${valueColor} font-mono`}>{value}</span>
        {subtext && <span className="text-[10px] text-zinc-500 mt-1 font-medium">{subtext}</span>}
      </div>
    </div>
  );
}

export default StatCard;
