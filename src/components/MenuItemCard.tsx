import React from 'react';
import { MenuItem } from '../types';
import { useApp } from '../context/AppContext';
import { Clock, Sparkle, TrendUp, Leaf, Fire } from '@phosphor-icons/react';

interface MenuItemCardProps {
  item: MenuItem;
}

export function MenuItemCard({ item }: MenuItemCardProps) {
  const { activeTable, tableCarts, addToCart, updateCartQuantity } = useApp();

  const currentCart = activeTable ? tableCarts[activeTable] || [] : [];
  const cartItem = currentCart.find((i) => i.menuItemId === item.id);
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    addToCart(item);
  };

  const getPriorityTag = () => {
    if (!item.tags || item.tags.length === 0) return null;
    if (item.tags.includes('new')) return 'new';
    if (item.tags.includes('popular')) return 'popular';
    if (item.tags.includes('veg')) return 'veg';
    if (item.tags.includes('spicy')) return 'spicy';
    return null;
  };

  const renderBadge = () => {
    const priorityTag = getPriorityTag();
    if (!priorityTag) return null;

    if (priorityTag === 'new') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-primary/15 text-primary border-primary/25 shrink-0 flex items-center gap-1">
          <Sparkle size={11} weight="duotone" /> New
        </span>
      );
    } else if (priorityTag === 'popular') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-primary/15 text-primary border-primary/25 shrink-0 flex items-center gap-1">
          <TrendUp size={11} weight="duotone" /> Bestseller
        </span>
      );
    } else if (priorityTag === 'veg') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-[#1b3821] text-[#71d384] border-[#2e7d32]/25 shrink-0 flex items-center gap-1">
          <Leaf size={11} weight="duotone" /> Veg
        </span>
      );
    } else if (priorityTag === 'spicy') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-[#3d1a16] text-[#f39c90] border-[#c0392b]/25 shrink-0 flex items-center gap-1">
          <Fire size={11} weight="duotone" /> Spicy
        </span>
      );
    }
    return null;
  };

  const formatPrice = (price: number) => {
    return price % 1 === 0 ? `₹${price.toFixed(0)}` : `₹${price.toFixed(2)}`;
  };

  return (
    <div 
      onClick={item.available && !quantity ? handleAdd : undefined}
      className={`minimal-card rounded-xl p-4 flex flex-col justify-between min-h-[160px] transition-all duration-300 relative group overflow-hidden ${
        item.available 
          ? 'cursor-pointer hover:border-primary/25 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(224,123,57,0.06)]' 
          : 'opacity-35 cursor-not-allowed'
      }`}
    >
      {/* Quantity badge in the top right corner */}
      {quantity > 0 && (
        <div className="absolute top-2 right-2 bg-success text-white font-bold font-mono text-[10px] px-2 py-0.5 rounded-full z-20 shadow-sm animate-scale-in">
          ×{quantity}
        </div>
      )}

      {/* Decorative ambient hover gradient blob */}
      {item.available && (
        <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-radial from-primary/5 to-transparent blur-xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />
      )}

      {/* Mid Info */}
      <div className="flex flex-col flex-1 relative z-10">
        <div className="flex justify-between items-start gap-1">
          <span className="font-bold text-foreground text-sm leading-tight group-hover:text-white transition-colors pr-6">
            {item.name}
          </span>
          {quantity === 0 && renderBadge()}
        </div>
        {item.description && (
          <span className="text-[11px] text-text-muted mt-1.5 line-clamp-2 leading-relaxed font-semibold">
            {item.description}
          </span>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col gap-3 mt-4 pt-2.5 border-t border-border relative z-10">
        <div className="flex items-center justify-between">
          {/* Prep Time */}
          <span className="text-[10px] font-mono text-text-muted flex items-center gap-1.5 font-semibold">
                        <Clock size={14} weight="duotone" className="text-text-muted group-hover:text-primary/70 transition-colors" />
            {item.prepTime || '5 mins'}
          </span>
          
          {/* Price Tag */}
          <span className="text-foreground group-hover:text-primary font-bold text-sm font-mono transition-colors">
            {formatPrice(item.price)}
          </span>
        </div>

        {item.available ? (
          quantity > 0 ? (
            <div className="w-full flex items-center justify-between bg-success/15 border border-success/25 rounded-lg overflow-hidden h-9 mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateCartQuantity(item.id, -1);
                }}
                className="w-12 h-full hover:bg-success/20 text-[#71d384] font-black text-sm transition-colors cursor-pointer flex items-center justify-center"
              >
                –
              </button>
              <span className="font-mono font-bold text-[#71d384] text-xs">
                {quantity}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateCartQuantity(item.id, 1);
                }}
                className="w-12 h-full hover:bg-success/20 text-[#71d384] font-black text-sm transition-colors cursor-pointer flex items-center justify-center"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
              className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm mt-1 h-9 cursor-pointer"
            >
              <span>+ Add</span>
            </button>
          )
        ) : (
          <div className="w-full bg-surface-container/50 border border-border text-text-muted text-xs font-bold py-2 rounded-lg flex items-center justify-center mt-1 h-9 select-none">
            Out of Stock
          </div>
        )}
      </div>
    </div>
  );
}

export default MenuItemCard;
