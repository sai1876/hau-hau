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
      <div className="flex gap-1.5 flex-wrap mt-2.5">
        {item.tags.map((tag) => {
          let tagStyle = 'bg-zinc-900/60 text-zinc-400 border border-zinc-800';
          let label = tag.toUpperCase();
          
          if (tag === 'spicy') {
            tagStyle = 'bg-red-950/40 text-red-400 border border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]';
            label = '🔥 SPICY';
          } else if (tag === 'veg') {
            tagStyle = 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.05)]';
            label = '🌱 VEG';
          } else if (tag === 'popular') {
            tagStyle = 'bg-amber-950/40 text-amber-300 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]';
            label = '⭐ BESTSELLER';
          } else if (tag === 'new') {
            tagStyle = 'bg-blue-950/40 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.05)]';
            label = '✨ NEW';
          }

          return (
            <span key={tag} className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full tracking-wider ${tagStyle}`}>
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
      className={`minimal-card rounded-xl p-4.5 flex flex-col justify-between h-48 transition-all duration-300 relative group overflow-hidden ${
        item.available 
          ? 'cursor-pointer hover:border-orange-500/30 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(249,115,22,0.06)]' 
          : 'opacity-25 cursor-not-allowed'
      }`}
    >
      {/* Decorative ambient hover gradient blob */}
      {item.available && (
        <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-linear-to-br from-orange-500/5 to-rose-500/5 blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center relative z-10">
        <span className="text-[9px] uppercase font-extrabold tracking-widest text-zinc-500 group-hover:text-orange-400 transition-colors">
          {item.category}
        </span>
        
        {item.available ? (
          <span className="text-zinc-400 group-hover:text-white group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-rose-500 group-hover:border-transparent transition-all p-1.5 bg-white/2 rounded-md border border-white/4 flex items-center justify-center shadow-xs">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" strokeWidth={3.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </span>
        ) : (
          <span className="text-[8px] font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 border border-red-500/10 rounded-full">
            UNAVAILABLE
          </span>
        )}
      </div>

      {/* Mid Info */}
      <div className="flex flex-col mt-2.5 flex-1 relative z-10">
        <span className="font-extrabold text-zinc-100 text-sm leading-tight tracking-tight group-hover:text-white transition-colors">
          {item.name}
        </span>
        {item.description && (
          <span className="text-[10px] text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed font-semibold">
            {item.description}
          </span>
        )}
        {renderTags()}
      </div>

      {/* Footer Info */}
      <div className="flex items-end justify-between mt-4 pt-2.5 border-t border-white/4 relative z-10">
        {/* Prep Time */}
        <span className="text-[9px] font-mono text-zinc-500 flex items-center gap-1.5 font-bold">
          <svg className="h-3.5 w-3.5 text-zinc-500 group-hover:text-orange-400/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {item.prepTime || '5 mins'}
        </span>
        
        {/* Price Tag */}
        <span className="text-zinc-100 group-hover:text-orange-400 font-extrabold tracking-tight text-sm font-mono transition-colors">
          ₹{item.price.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export default MenuItemCard;
