import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  color?: 'primary' | 'success' | 'warning' | 'default';
  iconType?: 'order' | 'pending' | 'completed' | 'cash' | 'online' | 'token';
}

export function StatCard({ title, value, subtext, color = 'default', iconType }: StatCardProps) {
  let valueColor = 'text-foreground';

  if (color === 'primary') {
    valueColor = 'text-primary';
  }

  // Pre-configured flat minimalist SVG icons
  const renderIcon = () => {
    const props = { className: "h-4 w-4 text-zinc-500", stroke: "currentColor", strokeWidth: 2, fill: "none" };
    switch (iconType) {
      case 'order':
        return (
          <svg {...props} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'pending':
        return (
          <svg {...props} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'completed':
        return (
          <svg {...props} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'cash':
        return (
          <svg {...props} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.879c.97.97 2.63.97 3.6 0 1.18-1.18 1.18-3.1 0-4.282L10.5 10.18c-1.18-1.18-1.18-3.1 0-4.282.97-.97 2.63-.97 3.6 0l.88.88m-6.364 0h12" />
          </svg>
        );
      case 'online':
        return (
          <svg {...props} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
          </svg>
        );
      case 'token':
        return (
          <svg {...props} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.75M15 9.75M9 14.25c.5-1.5 2.5-1.5 3 0" strokeWidth={2} />
          </svg>
        );
      default:
        return null;
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
