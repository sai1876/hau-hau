'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import TableSelector from '@/components/TableSelector';
import MenuItemCard from '@/components/MenuItemCard';
import CartPanel from '@/components/CartPanel';
import StatusBadge from '@/components/StatusBadge';

export default function StaffDashboardPage() {
  const router = useRouter();
  const { 
    currentUser, 
    logout, 
    menu, 
    orders, 
    activeTable, 
    tableCarts,
    createNewMenuItem,
    addToCart
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  // Dynamic category calculations
  const menuCategories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);
  const existingCategories = menuCategories.length > 0 ? menuCategories : ['Burgers', 'Sides', 'Drinks', 'Combo'];
  const categories = ['All', ...existingCategories];

  // Form states for creating menu item
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Burgers');
  const [customCategory, setCustomCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrepTime, setItemPrepTime] = useState('');
  const [itemTags, setItemTags] = useState({ spicy: false, veg: false, popular: false });
  const [autoAddCurrentCart, setAutoAddCurrentCart] = useState(true);

  // Authenticate check
  useEffect(() => {
    const stored = localStorage.getItem('hau_hau_session');
    if (!stored && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'staff') {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500 font-bold text-xs uppercase tracking-widest min-h-screen">
        Verifying Session...
      </div>
    );
  }

  // Filter menu items by category
  const filteredMenu = menu.filter(item => 
    activeCategory === 'All' ? true : item.category === activeCategory
  );

  // Filter orders created by this staff
  const staffOrders = orders
    .filter(order => order.staffId === currentUser.username)
    .slice(0, 5); // Limit to last 5

  // Mobile cart metadata
  const currentCart = activeTable ? tableCarts[activeTable] || [] : [];
  const cartItemsCount = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;

    const parsedPrice = parseFloat(itemPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    const finalCategory = itemCategory === '__custom__' ? customCategory.trim() : itemCategory;
    if (!finalCategory) {
      alert('Please enter or select a category.');
      return;
    }

    const tags: ('spicy' | 'veg' | 'popular' | 'new')[] = [];
    if (itemTags.spicy) tags.push('spicy');
    if (itemTags.veg) tags.push('veg');
    if (itemTags.popular) tags.push('popular');
    tags.push('new');

    const createdItem = await createNewMenuItem({
      name: itemName,
      price: parsedPrice,
      category: finalCategory,
      description: itemDescription || '',
      prepTime: itemPrepTime || '5 mins',
      tags
    });

    if (createdItem) {
      // Auto-add to cart
      if (activeTable && autoAddCurrentCart) {
        addToCart(createdItem);
      }
      setIsRegisterOpen(false);
      
      // Reset Form
      setItemName('');
      setItemPrice('');
      setItemCategory(existingCategories[0] || 'Burgers');
      setCustomCategory('');
      setItemDescription('');
      setItemPrepTime('');
      setItemTags({ spicy: false, veg: false, popular: false });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-screen pb-16 md:pb-0">
      
      {/* Header Bar */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-white/3 sticky top-0 z-40 px-4 py-3.5 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-zinc-900 border border-white/8 rounded-md flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
              HH
            </div>
            <div>
              <h1 className="font-bold text-xs uppercase tracking-wider text-white">Hau Hau</h1>
              <span className="text-[9px] text-orange-500 uppercase font-bold tracking-widest block mt-0.5">Staff POS</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-zinc-200">{currentUser.name}</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mt-0.5">Floor Staff</span>
            </div>
            <button
              onClick={logout}
              className="minimal-btn-secondary text-[10px] uppercase font-bold px-3 py-1.5 rounded-sm cursor-pointer active:scale-95 transition-transform"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col gap-6">
        
        {/* Table Selector */}
        <TableSelector />

        {/* Column Splits */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Menu Column */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            
            {/* Categories & Add Item Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/3 pb-3">
              {/* Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
                {categories.map((cat) => {
                  const isSelected = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border transition-all cursor-pointer whitespace-nowrap ${
                        isSelected 
                          ? 'bg-white border-white text-zinc-950 font-bold'
                          : 'bg-zinc-900/20 border-white/3 text-zinc-400 hover:text-zinc-200 hover:border-white/8'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Register Item Button */}
              <button
                onClick={() => {
                  setItemCategory(existingCategories[0] || 'Burgers');
                  setIsRegisterOpen(true);
                }}
                className="minimal-btn-secondary px-3.5 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto active:scale-95 transition-transform"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Register Item
              </button>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredMenu.map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>

            {/* Recent Orders area */}
            <div className="minimal-card p-5 rounded-md mt-4">
              <h2 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-3">
                Shift Activity
              </h2>
              
              {staffOrders.length === 0 ? (
                <p className="text-[10px] text-zinc-600 font-bold py-2 uppercase">No orders placed during this shift</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {staffOrders.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-zinc-900/10 border border-white/2 px-4 py-3 rounded-sm flex items-center justify-between text-xs"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-200">{order.id}</span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">
                          {order.tableNumber} • {order.items.length} items • {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-zinc-100 font-mono">₹{order.total.toFixed(2)}</span>
                        <StatusBadge status={order.orderStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Cart Column (Desktop) */}
          <div className="hidden lg:block lg:col-span-1 h-full">
            <div className="sticky top-24 h-[calc(100vh-140px)]">
              <CartPanel />
            </div>
          </div>

        </div>
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {activeTable && cartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-white/3 p-3.5 flex justify-between items-center z-40">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">{activeTable}</span>
            <span className="text-xs font-bold text-white">
              {cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'} • ₹{cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-sm font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            View Order
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer Overlay */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex flex-col justify-end">
          <div className="bg-[#1c1b1b] max-h-[85vh] rounded-t-lg overflow-hidden flex flex-col animate-slide-in">
            <div className="h-full flex-1">
              <CartPanel onClose={() => setIsMobileCartOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Register Item Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in" onClick={() => setIsRegisterOpen(false)}>
          <div 
            className="bg-[#141416] border border-white/4 w-full max-w-md max-h-[90vh] rounded-md overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/3 flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Quick Registration</span>
                <span className="text-sm font-bold text-white mt-0.5">Register Food Item</span>
              </div>
              <button 
                onClick={() => setIsRegisterOpen(false)}
                className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleRegisterSubmit} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable fields area */}
              <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Garlic Bread"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="120"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-mono"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/40 bg-zinc-950"
                  >
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom__">+ Create Custom Category...</option>
                  </select>
                  {itemCategory === '__custom__' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 mt-1.5 animate-slide-in"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Description</label>
                  <textarea
                    placeholder="Ingredients, prep notes... (optional)"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={2}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 resize-none"
                  />
                </div>

                {/* Prep Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Prep Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 mins (optional)"
                    value={itemPrepTime}
                    onChange={(e) => setItemPrepTime(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700"
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Item Flags</label>
                  <div className="flex flex-col gap-2 bg-zinc-900/10 p-3 border border-white/2 rounded-sm">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={itemTags.spicy}
                        onChange={(e) => setItemTags(prev => ({ ...prev, spicy: e.target.checked }))}
                        className="accent-orange-500 cursor-pointer"
                      />
                      <span>🔥 Spicy Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={itemTags.veg}
                        onChange={(e) => setItemTags(prev => ({ ...prev, veg: e.target.checked }))}
                        className="accent-emerald-500 cursor-pointer"
                      />
                      <span>🌱 Vegetarian Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={itemTags.popular}
                        onChange={(e) => setItemTags(prev => ({ ...prev, popular: e.target.checked }))}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <span>⭐ Best Seller / Popular</span>
                    </label>
                  </div>
                </div>

                {/* Auto-Add Toggle (only when table is active) */}
                {activeTable && (
                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-zinc-300 border border-white/3 bg-zinc-900/10 p-3 rounded-sm active:scale-[0.98] transition-all">
                    <input
                      type="checkbox"
                      checked={autoAddCurrentCart}
                      onChange={(e) => setAutoAddCurrentCart(e.target.checked)}
                      className="accent-orange-500 cursor-pointer h-3.5 w-3.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-200">Auto-add to active cart</span>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-wider mt-0.5">Will be added to Table: {activeTable}</span>
                    </div>
                  </label>
                )}
              </div>

              {/* Buttons */}
              <div className="bg-zinc-950/80 px-5 py-3.5 border-t border-white/3 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="minimal-btn-secondary px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="minimal-btn-primary px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-white rounded-sm cursor-pointer active:scale-95 transition-transform"
                >
                  Register Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
