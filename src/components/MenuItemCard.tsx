import React from 'react';
import { MenuItem } from '../types';
import { useApp } from '../context/AppContext';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { addToCart } = useApp();

  const handleAdd = () => {
    addToCart(item);
  };

  // Render tag micro badges
  const renderTags = () => {
    if (!item.tags || item.tags.length === 0) return null;
    return (
      <div className="flex gap-1 flex-wrap mt-2">
        {item.tags.map((tag) => {
          let tagStyle = 'bg-zinc-900 text-zinc-400 border border-zinc-800';
          let label = tag.toUpperCase();
          
          if (tag === 'spicy') {
            tagStyle = 'bg-red-500/[0.06] text-red-400 border border-red-500/10';
            label = '🔥 SPICY';
          } else if (tag === 'veg') {
            tagStyle = 'bg-emerald-500/[0.06] text-emerald-400 border border-emerald-500/10';
            label = '🌱 VEG';
          } else if (tag === 'popular') {
            tagStyle = 'bg-amber-500/[0.06] text-amber-400 border border-amber-500/10';
            label = '⭐ POPULAR';
          } else if (tag === 'new') {
            tagStyle = 'bg-blue-500/[0.06] text-blue-400 border border-blue-500/10';
            label = '✨ NEW';
          }

          return (
            <span key={tag} className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm tracking-wider ${tagStyle}`}>
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      onClick={item.available ? handleAdd : undefined}
      className={`minimal-card rounded-md p-4 flex flex-col justify-between h-44 transition-all duration-300 relative group overflow-hidden ${
        item.available 
          ? 'cursor-pointer hover:border-zinc-800/80 shadow-sm' 
          : 'opacity-30 cursor-not-allowed'
      }`}
    >
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">
          {item.category}
        </span>
        
        {item.available ? (
          <span className="text-zinc-500 group-hover:text-orange-500 transition-colors p-1 bg-white/2 rounded-sm border border-white/3 group-hover:border-orange-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
        ) : (
          <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 border border-red-500/10 rounded-sm">
            OUT
          </span>
        )}
      </div>

      {/* Mid Info */}
      <div className="flex flex-col mt-2 flex-1">
        <span className="font-bold text-zinc-100 text-sm leading-snug tracking-tight group-hover:text-white transition-colors">
          {item.name}
        </span>
        {item.description && (
          <span className="text-[10px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed font-medium">
            {item.description}
          </span>
        )}
        {renderTags()}
      </div>

      {/* Footer Info */}
      <div className="flex items-end justify-between mt-3 pt-2 border-t border-white/3">
        {/* Prep Time */}
        <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 font-medium">
          <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {item.prepTime || '5 mins'}
        </span>
        
        {/* Price */}
        <span className="text-zinc-100 group-hover:text-orange-500 font-bold tracking-tight text-sm transition-colors">
          ₹{item.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
export default MenuItemCard;
