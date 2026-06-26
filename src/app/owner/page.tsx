'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import StaffList from '@/components/StaffList';
import StaffAccountForm from '@/components/StaffAccountForm';
import TokenList from '@/components/TokenList';
import TokenAccountForm from '@/components/TokenAccountForm';
import { Order, MenuItem, TokenAccount } from '@/types';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { 
    currentUser, 
    logout, 
    orders, 
    updateOrderStatus,
    menu,
    toggleMenuItem,
    removeMenuItem,
    createNewMenuItem,
    updateMenuItem,
    confirmAction,
    tokenTransactions,
    staffList
  } = useApp();

  // Navigation Tabs for Command Center
  const [activeWorkspace, setActiveWorkspace] = useState<'orders' | 'menu' | 'staff' | 'tokens'>('orders');
  const [activeOrderTab, setActiveOrderTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingToken, setEditingToken] = useState<TokenAccount | null>(null);
  const [historyToken, setHistoryToken] = useState<TokenAccount | null>(null);

  // Form state for creating menu item
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemCategory, setItemCategory] = useState('Burgers');
  const [customCategory, setCustomCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrepTime, setItemPrepTime] = useState('5 mins');
  const [itemTags, setItemTags] = useState<{ spicy: boolean; veg: boolean; popular: boolean }>({
    spicy: false,
    veg: false,
    popular: false
  });

  // State for editing menu item
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCategory, setEditCustomCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrepTime, setEditPrepTime] = useState('');
  const [editTags, setEditTags] = useState({ spicy: false, veg: false, popular: false });

  // Authenticate check
  useEffect(() => {
    const stored = localStorage.getItem('hau_hau_session');
    if (!stored && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'owner') {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 text-zinc-500 font-bold text-xs uppercase tracking-widest min-h-screen">
        Verifying Session...
      </div>
    );
  }

  // Calculations for Metrics
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  const completedOrders = orders.filter(o => o.orderStatus === 'completed').length;

  const cashCollection = orders
    .filter(o => o.paymentMode === 'cash' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const onlineCollection = orders
    .filter(o => o.paymentMode === 'online' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const tokenCollection = orders
    .filter(o => o.paymentMode === 'tokens' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalCollections = cashCollection + onlineCollection + tokenCollection;

  // Filter orders by active sub-tab
  const filteredOrders = orders.filter(order => {
    if (activeOrderTab === 'all') return true;
    return order.orderStatus === activeOrderTab;
  });

  const handleCancelOrder = (orderId: string) => {
    confirmAction(
      `Are you sure you want to CANCEL order ${orderId}? This cannot be undone.`,
      () => updateOrderStatus(orderId, 'cancelled')
    );
  };

  const handleStatusChange = (orderId: string, status: 'completed' | 'pending') => {
    let msg = `Mark order ${orderId} as ${status.toUpperCase()}?`;
    if (status === 'completed') msg = `Complete order ${orderId}?`;
    confirmAction(msg, () => updateOrderStatus(orderId, status));
  };

  const menuCategories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);
  const existingCategories = menuCategories.length > 0 ? menuCategories : ['Burgers', 'Sides', 'Drinks', 'Combo'];

  // Menu Creation Form Submit
  const handleCreateMenuItem = (e: React.FormEvent) => {
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
    tags.push('new'); // automatically tag new items

    createNewMenuItem({
      name: itemName,
      price: parsedPrice,
      category: finalCategory,
      description: itemDescription || '',
      prepTime: itemPrepTime || '5 mins',
      tags
    });

    // Reset Form
    setItemName('');
    setItemPrice('');
    setItemCategory(existingCategories[0] || 'Burgers');
    setCustomCategory('');
    setItemDescription('');
    setItemPrepTime('5 mins');
    setItemTags({ spicy: false, veg: false, popular: false });
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditCategory(item.category);
    setEditCustomCategory('');
    setEditDescription(item.description || '');
    setEditPrepTime(item.prepTime || '');
    setEditTags({
      spicy: item.tags?.includes('spicy') || false,
      veg: item.tags?.includes('veg') || false,
      popular: item.tags?.includes('popular') || false
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName || !editPrice) return;

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    const finalCategory = editCategory === '__custom__' ? editCustomCategory.trim() : editCategory;
    if (!finalCategory) {
      alert('Please enter or select a category.');
      return;
    }

    const tags: ('spicy' | 'veg' | 'popular' | 'new')[] = [];
    if (editTags.spicy) tags.push('spicy');
    if (editTags.veg) tags.push('veg');
    if (editTags.popular) tags.push('popular');
    if (editingItem.tags?.includes('new')) tags.push('new');

    const success = await updateMenuItem(editingItem.id, {
      name: editName,
      price: parsedPrice,
      category: finalCategory,
      description: editDescription,
      prepTime: editPrepTime,
      tags
    });

    if (success) {
      setEditingItem(null);
    }
  };

  const handleDeleteMenuItem = (itemId: string, name: string) => {
    confirmAction(
      `Are you sure you want to delete "${name}" from the menu?`,
      () => removeMenuItem(itemId)
    );
  };

  // Render Collection Distribution Chart
  const renderDistributionChart = () => {
    if (totalCollections === 0) return null;
    const cashPct = (cashCollection / totalCollections) * 100;
    const onlinePct = (onlineCollection / totalCollections) * 100;
    const tokenPct = (tokenCollection / totalCollections) * 100;

    return (
      <div className="minimal-card p-5 rounded-md flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">
            Revenue Split Distribution
          </span>
          <span className="text-[10px] font-mono font-bold text-zinc-400">
            Total Yield: ₹{totalCollections.toFixed(2)}
          </span>
        </div>

        {/* Stacked distribution bar */}
        <div className="h-3 w-full bg-zinc-950 rounded-sm overflow-hidden flex border border-white/3">
          {cashCollection > 0 && (
            <div 
              style={{ width: `${cashPct}%` }} 
              className="bg-amber-500 h-full transition-all duration-500" 
              title={`Cash: ${cashPct.toFixed(1)}%`}
            />
          )}
          {onlineCollection > 0 && (
            <div 
              style={{ width: `${onlinePct}%` }} 
              className="bg-emerald-500 h-full transition-all duration-500" 
              title={`Online: ${onlinePct.toFixed(1)}%`}
            />
          )}
          {tokenCollection > 0 && (
            <div 
              style={{ width: `${tokenPct}%` }} 
              className="bg-blue-500 h-full transition-all duration-500" 
              title={`Tokens: ${tokenPct.toFixed(1)}%`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-3 gap-2 mt-1 text-[10px]">
          <div className="flex items-center gap-1.5 font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Cash: {cashPct.toFixed(0)}% (₹{cashCollection.toFixed(2)})</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Online: {onlinePct.toFixed(0)}% (₹{onlineCollection.toFixed(2)})</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>Tokens: {tokenPct.toFixed(0)}% (₹{tokenCollection.toFixed(2)})</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-zinc-950 min-h-screen">
      
      {/* Top Bar */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-white/3 sticky top-0 z-40 px-4 py-3.5 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-zinc-900 border border-white/8 rounded-md flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
              HH
            </div>
            <div>
              <h1 className="font-bold text-xs uppercase tracking-wider text-white">Hau Hau</h1>
              <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-widest block mt-0.5">Control Center</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:flex flex-col">
              <span className="text-xs font-semibold text-zinc-200">Sarah</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold mt-0.5">Owner</span>
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

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col gap-6">
        
        {/* Overview cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard title="Total Volume" value={totalOrders} color="default" iconType="order" />
          <StatCard title="Pending Queue" value={pendingOrders} color="warning" iconType="pending" />
          <StatCard title="Dispatched" value={completedOrders} color="success" iconType="completed" />
          <StatCard title="Cash Pool" value={`₹${cashCollection.toFixed(2)}`} color="primary" iconType="cash" />
          <StatCard title="Online Pool" value={`₹${onlineCollection.toFixed(2)}`} color="primary" iconType="online" />
          <StatCard title="Tokens Pool" value={`₹${tokenCollection.toFixed(2)}`} color="primary" iconType="token" />
        </section>

        {/* Global Workspace Nav Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['orders', 'menu', 'staff', 'tokens'] as const).map((space) => {
            const isSelected = activeWorkspace === space;
            return (
              <button
                key={space}
                onClick={() => setActiveWorkspace(space)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white border-white text-zinc-950 font-bold'
                    : 'bg-zinc-900/20 border-white/3 text-zinc-400 hover:text-zinc-200 hover:border-white/8'
                }`}
              >
                {space === 'orders' && 'Orders Registry'}
                {space === 'menu' && 'Menu Inventory'}
                {space === 'staff' && 'Staff Accounts'}
                {space === 'tokens' && 'Token Cards'}
              </button>
            );
          })}
        </div>

        {/* Workspace Panels */}
        <div className="flex-1 flex flex-col gap-6 animate-slide-in">
          
          {/* 1. ORDERS WORKSPACE */}
          {activeWorkspace === 'orders' && (
            <div className="flex flex-col gap-6">
              {renderDistributionChart()}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/3 pb-3">
                <div>
                  <h2 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Incoming Orders</h2>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Filter and complete active POS transactions</p>
                </div>

                {/* Sub-tabs for orders status filtering */}
                <div className="flex gap-2">
                  {(['pending', 'completed', 'all'] as const).map((tab) => {
                    const isSelected = activeOrderTab === tab;
                    let count = 0;
                    if (tab === 'pending') count = pendingOrders;
                    if (tab === 'completed') count = completedOrders;
                    if (tab === 'all') count = totalOrders;

                    return (
                      <button
                        key={tab}
                        onClick={() => setActiveOrderTab(tab)}
                        className={`px-3.5 py-1.5 rounded-full text-[9px] font-bold uppercase border transition-all flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/6 border-orange-500/30 text-orange-400 font-bold'
                            : 'bg-zinc-900/10 border-white/3 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span>{tab}</span>
                        <span className="bg-zinc-950 text-zinc-500 text-[9px] px-1.5 py-0.2 rounded-full border border-white/3 font-bold">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orders table */}
              <div className="minimal-card rounded-md overflow-hidden shadow-sm">
                {filteredOrders.length === 0 ? (
                  <div className="p-8 text-center opacity-65">
                    <span className="text-xs font-semibold uppercase tracking-wider block text-zinc-400">No {activeOrderTab} records</span>
                    <span className="text-[10px] text-zinc-600 mt-1 block">Staff-transmitted transactions will reflect here</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/3 bg-zinc-950/40 text-zinc-500">
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Order ID</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Table</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Load</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Total</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Billing</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Fulfillment</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Operator</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Timestamp</th>
                          <th className="p-3 font-semibold uppercase tracking-wider text-[9px] text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/2 bg-zinc-950/10">
                        {filteredOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-white/1 transition-colors">
                            <td className="p-3 font-bold text-zinc-200 font-mono">{order.id}</td>
                            <td className="p-3 font-bold text-orange-500 font-mono">{order.tableNumber}</td>
                            <td className="p-3 text-zinc-400">
                              {order.items.reduce((sum, i) => sum + i.quantity, 0)} units
                            </td>
                            <td className="p-3 font-bold text-zinc-100 font-mono">₹{order.total.toFixed(2)}</td>
                            <td className="p-3 uppercase">
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-300 font-bold font-mono text-[10px]">{order.paymentMode}</span>
                                <StatusBadge status={order.paymentStatus} />
                              </div>
                            </td>
                            <td className="p-3">
                              <StatusBadge status={order.orderStatus} />
                            </td>
                            <td className="p-3 text-zinc-400">{order.staffName}</td>
                            <td className="p-3 text-zinc-500 font-mono">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-3 text-right flex justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="minimal-btn-secondary px-2.5 py-1 rounded-sm text-[9px] uppercase font-bold cursor-pointer active:scale-95 transition-transform"
                              >
                                Details
                              </button>
                              
                              {order.orderStatus === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(order.id, 'completed')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase cursor-pointer active:scale-95 transition-transform"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleCancelOrder(order.id)}
                                    className="border border-red-500/20 hover:bg-red-500/5 text-red-400 px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase cursor-pointer active:scale-95 transition-transform"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                              {order.orderStatus === 'completed' && (
                                <button
                                  onClick={() => handleStatusChange(order.id, 'pending')}
                                  className="border border-amber-500/20 hover:bg-amber-500/5 text-amber-400 px-2.5 py-1 rounded-sm text-[9px] font-bold uppercase cursor-pointer active:scale-95 transition-transform"
                                  title="Revert to Pending"
                                >
                                  Revert
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. MENU REGISTRY WORKSPACE */}
          {activeWorkspace === 'menu' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Menu Registry Table */}
              <div className="lg:col-span-2 minimal-card rounded-md overflow-hidden flex flex-col">
                <div className="bg-zinc-950/85 px-4 py-3 border-b border-white/3 flex justify-between items-center">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Inventory Directory</h3>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold">{menu.length} items</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/3 bg-zinc-950/40 text-zinc-500">
                        <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Item Details</th>
                        <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Category</th>
                        <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Price</th>
                        <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Prep Estimate</th>
                        <th className="p-3 font-semibold uppercase tracking-wider text-[9px]">Availability</th>
                        <th className="p-3 font-semibold uppercase tracking-wider text-[9px] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/2 bg-zinc-950/10">
                      {menu.map((item) => (
                        <tr key={item.id} className="hover:bg-white/1 transition-colors">
                          <td className="p-3">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-zinc-200 text-xs">{item.name}</span>
                              <span className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">{item.description}</span>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1.5 mt-1.5">
                                  {item.tags.map(t => (
                                    <span key={t} className="text-[8px] bg-zinc-900 text-zinc-500 px-1.5 py-0.2 border border-zinc-800 rounded-sm font-bold uppercase tracking-wider">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-zinc-500">{item.category}</td>
                          <td className="p-3 font-bold text-zinc-200 font-mono">₹{item.price.toFixed(2)}</td>
                          <td className="p-3 font-mono text-zinc-500">{item.prepTime || '5 mins'}</td>
                          <td className="p-3">
                            <StatusBadge status={item.available ? 'active' : 'inactive'} />
                          </td>
                          <td className="p-3 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => toggleMenuItem(item.id)}
                              className={`px-2.5 py-1 rounded-sm text-[9px] uppercase font-bold border transition-colors cursor-pointer active:scale-95 ${
                                item.available
                                  ? 'border-amber-500/20 text-amber-400 hover:bg-amber-500/5'
                                  : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5'
                              }`}
                            >
                              {item.available ? 'Deactivate' : 'Activate'}
                            </button>
                             <button
                              onClick={() => handleStartEdit(item)}
                              className="px-2.5 py-1 border border-zinc-800 rounded-sm text-[9px] uppercase font-bold text-zinc-300 hover:bg-white/2 transition-colors cursor-pointer active:scale-95"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id, item.name)}
                              className="px-2.5 py-1 border border-red-500/20 rounded-sm text-[9px] uppercase font-bold text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer active:scale-95"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Create Menu Item Form */}
              <div className="lg:col-span-1 minimal-card rounded-md overflow-hidden">
                <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Register Food Item</h3>
                </div>
                
                <form onSubmit={handleCreateMenuItem} className="p-4 flex flex-col gap-4 text-xs">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Item Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chili Fries"
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
                      placeholder="250"
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
                      placeholder="Ingredients, preparation details... (optional)"
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

                  {/* Submit */}
                  <button
                    type="submit"
                    className="minimal-btn-primary text-white font-bold py-2.5 rounded-sm uppercase tracking-wider transition-transform active:scale-[0.98] mt-2 text-[10px] h-10 flex items-center justify-center cursor-pointer shadow-sm"
                  >
                    Register Item
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* 3. STAFF ACCOUNTS WORKSPACE */}
          {activeWorkspace === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Staff List */}
              <div className="lg:col-span-2">
                <StaffList />
              </div>

              {/* Create Staff Form */}
              <div className="lg:col-span-1">
                <StaffAccountForm />
              </div>
            </div>
          )}

          {/* 4. TOKEN CARDS WORKSPACE */}
          {activeWorkspace === 'tokens' && (
            <div className="flex flex-col gap-6 animate-slide-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Token Cards List */}
                <div className="lg:col-span-2">
                  <TokenList onStartEdit={setEditingToken} onViewHistory={setHistoryToken} />
                </div>

                {/* Create/Edit Token Card Form */}
                <div className="lg:col-span-1">
                  <TokenAccountForm
                    editingToken={editingToken}
                    onCancelEdit={() => setEditingToken(null)}
                  />
                </div>
              </div>

              {/* Token Sales Summary Table */}
              <div className="minimal-card rounded-md overflow-hidden">
                <div className="bg-zinc-950/85 px-4 py-3 border-b border-white/3 flex justify-between items-center">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                    Token Sales Summary by Staff Member
                  </h3>
                </div>
                <div className="p-4">
                  {staffList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-zinc-600 font-bold uppercase">
                      No staff accounts registered
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {staffList.map((staff) => {
                        const staffTxs = tokenTransactions.filter(tx => tx.soldBy === staff.username);
                        const tokensSold = staffTxs.reduce((sum, tx) => sum + tx.tokens, 0);
                        const amountCollected = staffTxs.reduce((sum, tx) => sum + tx.amount, 0);

                        return (
                          <div key={staff.id} className="bg-zinc-900/10 border border-white/2 p-4 rounded-sm flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-200">{staff.name}</span>
                              <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider mt-0.5">@{staff.username}</span>
                            </div>
                            <div className="text-right">
                              <span className="block font-mono font-bold text-xs text-blue-400">{tokensSold.toFixed(2)} TK</span>
                              <span className="block font-mono text-[10px] text-emerald-500 font-bold mt-0.5">₹{amountCollected.toFixed(2)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Order Details Modal popup */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {/* Edit Food Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in" onClick={() => setEditingItem(null)}>
          <div 
            className="bg-[#141416] border border-white/4 w-full max-w-md max-h-[90vh] rounded-md overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/3 flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Inventory Management</span>
                <span className="text-sm font-bold text-white mt-0.5">Edit Menu Item</span>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
              {/* Scrollable fields area */}
              <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chili Fries"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
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
                    placeholder="250"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-mono"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-orange-500/40 bg-zinc-950"
                  >
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__custom__">+ Create Custom Category...</option>
                  </select>
                  {editCategory === '__custom__' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom category"
                      value={editCustomCategory}
                      onChange={(e) => setEditCustomCategory(e.target.value)}
                      className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-zinc-700 mt-1.5 animate-slide-in"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-500 uppercase font-bold tracking-widest text-[9px]">Description</label>
                  <textarea
                    placeholder="Ingredients, preparation details... (optional)"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
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
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(e.target.value)}
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
                        checked={editTags.spicy}
                        onChange={(e) => setEditTags(prev => ({ ...prev, spicy: e.target.checked }))}
                        className="accent-orange-500 cursor-pointer"
                      />
                      <span>🔥 Spicy Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editTags.veg}
                        onChange={(e) => setEditTags(prev => ({ ...prev, veg: e.target.checked }))}
                        className="accent-emerald-500 cursor-pointer"
                      />
                      <span>🌱 Vegetarian Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-300">
                      <input
                        type="checkbox"
                        checked={editTags.popular}
                        onChange={(e) => setEditTags(prev => ({ ...prev, popular: e.target.checked }))}
                        className="accent-amber-500 cursor-pointer"
                      />
                      <span>⭐ Best Seller / Popular</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="bg-zinc-950/80 px-5 py-3.5 border-t border-white/3 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="minimal-btn-secondary px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-sm cursor-pointer active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="minimal-btn-primary px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-white rounded-sm cursor-pointer active:scale-95 transition-transform"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal popup */}
      {historyToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-fade-in" onClick={() => setHistoryToken(null)}>
          <div 
            className="bg-[#141416] border border-white/4 w-full max-w-2xl max-h-[90vh] rounded-md overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/3 flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Student Card Ledger</span>
                <span className="text-sm font-bold text-white mt-0.5">Recharge History: {historyToken.name} (Card #{historyToken.cardNo})</span>
              </div>
              <button 
                onClick={() => setHistoryToken(null)}
                className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold tracking-wider cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
              
              {/* Card Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900/20 border border-white/2 p-3 rounded-sm">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Remaining Balance</span>
                  <span className="text-xs font-bold text-blue-400 font-mono block mt-1">{historyToken.tokens} tokens</span>
                </div>
                <div className="bg-zinc-900/20 border border-white/2 p-3 rounded-sm">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Equivalent Value</span>
                  <span className="text-xs font-bold text-emerald-500 font-mono block mt-1">₹{(historyToken.tokens * 30).toFixed(2)}</span>
                </div>
                <div className="bg-zinc-900/20 border border-white/2 p-3 rounded-sm">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Total Recharges</span>
                  <span className="text-xs font-bold text-zinc-200 font-mono block mt-1">
                    {tokenTransactions.filter(tx => tx.studentId === historyToken.id).length}
                  </span>
                </div>
                <div className="bg-zinc-900/20 border border-white/2 p-3 rounded-sm">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider block">Total Tokens Taken</span>
                  <span className="text-xs font-bold text-orange-400 font-mono block mt-1">
                    {tokenTransactions
                      .filter(tx => tx.studentId === historyToken.id)
                      .reduce((sum, tx) => sum + tx.tokens, 0)
                      .toFixed(2)} tokens
                  </span>
                </div>
              </div>

              {/* Recharges List Table */}
              <div className="border border-white/3 rounded-sm overflow-hidden mt-2">
                {tokenTransactions.filter(tx => tx.studentId === historyToken.id).length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 italic bg-zinc-950/20 font-semibold uppercase tracking-wider text-[10px]">
                    No recharge records found for this card
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b border-white/3 bg-zinc-950/60 text-zinc-500">
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Transaction ID</th>
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Date & Time</th>
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Tokens Added</th>
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Amount Paid</th>
                          <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Operator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/2 bg-zinc-950/10">
                        {tokenTransactions
                          .filter(tx => tx.studentId === historyToken.id)
                          .map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/1 transition-colors">
                              <td className="p-2.5 font-bold text-zinc-300 font-mono">{tx.id}</td>
                              <td className="p-2.5 text-zinc-500 font-medium">
                                {new Date(tx.createdAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="p-2.5 text-blue-400 font-mono font-bold">
                                +{tx.tokens} tokens
                              </td>
                              <td className="p-2.5 text-emerald-400 font-mono font-bold">₹{tx.amount.toFixed(2)}</td>
                              <td className="p-2.5 text-zinc-400 font-semibold">{tx.soldBy}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-zinc-950/80 px-5 py-3.5 border-t border-white/3 flex justify-end shrink-0">
              <button 
                onClick={() => setHistoryToken(null)}
                className="minimal-btn-secondary px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
