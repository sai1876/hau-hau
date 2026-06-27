'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import StaffList from '@/components/StaffList';
import StaffAccountForm from '@/components/StaffAccountForm';
import TokenList from '@/components/TokenList';
import TokenAccountForm from '@/components/TokenAccountForm';
import ProfileSection from '@/components/ProfileSection';
import { Order, MenuItem, TokenAccount, StaffAccount } from '@/types';
import { TokenIcon } from '@/components/TokenIcon';
import { Pagination } from '@/components/Pagination';
import {
  SquaresFour,
  ClipboardText,
  ForkKnife,
  Users,
  CreditCard,
  UserCircle,
  SignOut,
  UsersThree,
  Fire,
  Leaf,
  Star,
  X,
  ShieldCheckered,
  Gear,
} from '@phosphor-icons/react';

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
    staffList,
    updateStaffLimit,
    settings,
    auditLogs,
    updateSettings
  } = useApp();

  // Navigation Tabs for Command Center
  const [activeWorkspace, setActiveWorkspace] = useState<'overview' | 'orders' | 'menu' | 'staff' | 'tokens' | 'audit' | 'settings' | 'profile'>('overview');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'all' | 'cash' | 'online' | 'tokens'>('all');
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingToken, setEditingToken] = useState<TokenAccount | null>(null);
  const [historyToken, setHistoryToken] = useState<TokenAccount | null>(null);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<StaffAccount | null>(null);
  const [editingLimitValue, setEditingLimitValue] = useState<string>('');

  // Settings form states
  const [outletName, setOutletName] = useState('');
  const [tokenValueInRupees, setTokenValueInRupees] = useState('');
  const [manualUpiEnabled, setManualUpiEnabled] = useState(true);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [monthlyTokenLimitDefaults, setMonthlyTokenLimitDefaults] = useState('');

  // Audit search & filter state
  const [auditQuery, setAuditQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('all');

  // Sync settings values
  useEffect(() => {
    if (settings) {
      setOutletName(settings.outletName ?? '');
      setTokenValueInRupees(String(settings.tokenValueInRupees ?? 30));
      setManualUpiEnabled(settings.manualUpiEnabled ?? true);
      setTaxEnabled(settings.taxEnabled ?? false);
      setCurrency(settings.currency ?? 'INR');
      setReceiptFooter(settings.receiptFooter ?? '');
      setMonthlyTokenLimitDefaults(String(settings.monthlyTokenLimitDefaults ?? 1000));
    }
  }, [settings]);

  // Date filtering state for day-wise reporting
  const [dateFilterType, setDateFilterType] = useState<'today' | 'yesterday' | 'last7days' | 'custom' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toLocaleDateString('en-CA'));

  // Memoized date filtered orders list
  const filteredByDateOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    return orders.filter(order => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      const orderDateStr = orderDate.toLocaleDateString('en-CA');
      
      switch (dateFilterType) {
        case 'today':
          return orderDateStr === todayStr;
        case 'yesterday':
          return orderDateStr === yesterdayStr;
        case 'last7days': {
          const diffTime = Math.abs(now.getTime() - orderDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 7;
        }
        case 'custom':
          return orderDateStr === customDate;
        case 'all':
        default:
          return true;
      }
    });
  }, [orders, dateFilterType, customDate]);

  // Pagination state
  const ORDERS_PER_PAGE = 10;
  const MENU_PER_PAGE   = 10;
  const [ordersPage, setOrdersPage] = useState(1);
  const [menuPage,   setMenuPage]   = useState(1);

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
      <div className="flex-1 flex items-center justify-center bg-background text-text-muted font-bold text-xs uppercase tracking-widest min-h-screen">
        Verifying Session...
      </div>
    );
  }

  // Calculations for Metrics
  const totalOrders = filteredByDateOrders.length;
  const pendingOrders = filteredByDateOrders.filter(o => o.orderStatus === 'pending').length;
  const completedOrders = filteredByDateOrders.filter(o => o.orderStatus === 'completed').length;

  const cashCollection = filteredByDateOrders
    .filter(o => o.paymentMode === 'cash' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const onlineCollection = filteredByDateOrders
    .filter(o => o.paymentMode === 'online' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const tokenCollection = filteredByDateOrders
    .filter(o => o.paymentMode === 'tokens' && o.orderStatus !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalCollections = cashCollection + onlineCollection + tokenCollection;

  // Filter orders by active sub-tab AND active payment mode filter
  // Sort newest-first then apply status/payment filters
  const sortedOrders = [...filteredByDateOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const filteredOrders = sortedOrders.filter((order) => {
    const matchesStatus = activeOrderTab === 'all' ? true : order.orderStatus === activeOrderTab;
    const matchesPayment = paymentModeFilter === 'all' ? true : order.paymentMode === paymentModeFilter;
    return matchesStatus && matchesPayment;
  });
  const ordersPageCount  = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE));
  const safeOrdersPage   = Math.min(ordersPage, ordersPageCount);
  const pagedOrders      = filteredOrders.slice((safeOrdersPage - 1) * ORDERS_PER_PAGE, safeOrdersPage * ORDERS_PER_PAGE);

  // Top Selling Items calculations
  const itemSalesMap: Record<string, { name: string; quantity: number; total: number }> = {};
  filteredByDateOrders.forEach(order => {
    if (order.orderStatus === 'completed') {
      order.items.forEach(item => {
        if (!itemSalesMap[item.menuItemId]) {
          itemSalesMap[item.menuItemId] = { name: item.name, quantity: 0, total: 0 };
        }
        itemSalesMap[item.menuItemId].quantity += item.quantity;
        itemSalesMap[item.menuItemId].total += item.price * item.quantity;
      });
    }
  });
  const topSellingItems = Object.values(itemSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const getFilterLabel = () => {
    switch (dateFilterType) {
      case 'today': return "Today's";
      case 'yesterday': return "Yesterday's";
      case 'last7days': return "Last 7 Days";
      case 'custom': return customDate;
      case 'all': return "All-Time";
      default: return "Today's";
    }
  };

  // Active staff list — limit to 5 for overview
  const activeStaffList    = staffList.filter(s => s.status === 'active');
  const activeStaffPreview = activeStaffList.slice(0, 5);

  // Menu pagination
  const menuPageCount = Math.max(1, Math.ceil(menu.length / MENU_PER_PAGE));
  const safeMenuPage  = Math.min(menuPage, menuPageCount);
  const pagedMenu     = menu.slice((safeMenuPage - 1) * MENU_PER_PAGE, safeMenuPage * MENU_PER_PAGE);

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
      <div className="minimal-card p-5.5 rounded-xl flex flex-col gap-4 relative overflow-hidden bg-surface border border-border">
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex justify-between items-center relative z-10">
          <span className="text-xs font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Revenue Breakdown
          </span>
          <span className="text-xs font-mono font-bold text-foreground bg-surface-header px-3 py-1 rounded-lg border border-border">
            Total Revenue: <span className="text-primary ml-1">₹{totalCollections.toFixed(2)}</span>
          </span>
        </div>

        {/* Stacked distribution bar */}
        <div className="h-5 w-full bg-surface-container rounded-full overflow-hidden flex border border-border p-px shadow-inner relative z-10">
          {cashCollection > 0 && (
            <button 
              type="button"
              onClick={() => {
                setPaymentModeFilter(paymentModeFilter === 'cash' ? 'all' : 'cash');
                if (activeWorkspace !== 'orders') setActiveWorkspace('orders');
              }}
              style={{ width: `${cashPct}%` }} 
              className={`bg-primary h-full transition-all duration-350 cursor-pointer ${
                paymentModeFilter === 'cash' ? 'ring-2 ring-white scale-y-110 z-10' : 'opacity-85 hover:opacity-100 hover:scale-y-105'
              }`}
              title={`Cash: ₹${cashCollection.toFixed(2)} (${cashPct.toFixed(1)}% of total) - Click to filter`}
            />
          )}
          {onlineCollection > 0 && (
            <button 
              type="button"
              onClick={() => {
                setPaymentModeFilter(paymentModeFilter === 'online' ? 'all' : 'online');
                if (activeWorkspace !== 'orders') setActiveWorkspace('orders');
              }}
              style={{ width: `${onlinePct}%` }} 
              className={`bg-success h-full transition-all duration-350 cursor-pointer ${
                paymentModeFilter === 'online' ? 'ring-2 ring-white scale-y-110 z-10' : 'opacity-85 hover:opacity-100 hover:scale-y-105'
              }`}
              title={`Online: ₹${onlineCollection.toFixed(2)} (${onlinePct.toFixed(1)}% of total) - Click to filter`}
            />
          )}
          {tokenCollection > 0 && (
            <button 
              type="button"
              onClick={() => {
                setPaymentModeFilter(paymentModeFilter === 'tokens' ? 'all' : 'tokens');
                if (activeWorkspace !== 'orders') setActiveWorkspace('orders');
              }}
              style={{ width: `${tokenPct}%` }} 
              className={`bg-indigo-650 h-full rounded-r-full transition-all duration-350 cursor-pointer ${
                paymentModeFilter === 'tokens' ? 'ring-2 ring-white scale-y-110 z-10' : 'opacity-85 hover:opacity-100 hover:scale-y-105'
              }`}
              title={`Tokens: ₹${tokenCollection.toFixed(2)} (${tokenPct.toFixed(1)}% of total) - Click to filter`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-1 text-xs relative z-10">
          <button 
            type="button"
            onClick={() => {
              setPaymentModeFilter(paymentModeFilter === 'cash' ? 'all' : 'cash');
              if (activeWorkspace !== 'orders') setActiveWorkspace('orders');
            }}
            className={`flex items-center justify-between p-2.5 border rounded-lg transition-all cursor-pointer text-left ${
              paymentModeFilter === 'cash' 
                ? 'bg-primary/10 border-primary shadow-xs' 
                : 'bg-surface-container/20 border-border hover:border-primary/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-primary" />
              <span className="font-bold text-text-muted">Cash Pool</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-primary font-bold">₹{cashCollection.toFixed(2)}</span>
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full border border-primary/20 font-bold">
                {cashPct.toFixed(0)}%
              </span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              setPaymentModeFilter(paymentModeFilter === 'online' ? 'all' : 'online');
              if (activeWorkspace !== 'orders') setActiveWorkspace('orders');
            }}
            className={`flex items-center justify-between p-2.5 border rounded-lg transition-all cursor-pointer text-left ${
              paymentModeFilter === 'online' 
                ? 'bg-success/10 border-success shadow-xs' 
                : 'bg-surface-container/20 border-border hover:border-success/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-success" />
              <span className="font-bold text-text-muted">Online Pool</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-success font-bold">₹{onlineCollection.toFixed(2)}</span>
              <span className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-full border border-success/20 font-bold">
                {onlinePct.toFixed(0)}%
              </span>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              setPaymentModeFilter(paymentModeFilter === 'tokens' ? 'all' : 'tokens');
              if (activeWorkspace !== 'orders') setActiveWorkspace('orders');
            }}
            className={`flex items-center justify-between p-2.5 border rounded-lg transition-all cursor-pointer text-left ${
              paymentModeFilter === 'tokens' 
                ? 'bg-indigo-950/10 border-indigo-500 shadow-xs' 
                : 'bg-surface-container/20 border-border hover:border-indigo-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-xs" />
              <span className="font-bold text-text-muted">Tokens Pool</span>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-indigo-400 font-bold">₹{tokenCollection.toFixed(2)}</span>
              <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/20 font-bold">
                {tokenPct.toFixed(0)}%
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-background min-h-screen">
      
      {/* Mobile Top Header */}
      <header className="md:hidden bg-surface-header/90 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-surface border border-border rounded-md flex items-center justify-center text-foreground font-bold text-sm">
            HH
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground leading-tight">Hau Hau</h1>
            <span className="text-xs text-text-muted font-medium block mt-0.5">Owner Dashboard</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="minimal-btn-secondary px-3 py-1.5 h-9 min-h-0 text-[10px] font-bold rounded-md"
        >
          Log Out
        </button>
      </header>

      {/* Mobile Nav Menu */}
      <nav className="md:hidden flex overflow-x-auto border-b border-border bg-surface-header/40 p-2 shrink-0 gap-1.5">
        {(['overview', 'orders', 'menu', 'staff', 'tokens', 'audit', 'settings', 'profile'] as const).map((space) => {
          const isSelected = activeWorkspace === space;
          const mobileIcons: Record<string, React.ReactNode> = {
            overview: <SquaresFour  size={15} weight="duotone" />,
            orders:   <ClipboardText size={15} weight="duotone" />,
            menu:     <ForkKnife    size={15} weight="duotone" />,
            staff:    <Users        size={15} weight="duotone" />,
            tokens:   <CreditCard   size={15} weight="duotone" />,
            audit:    <ShieldCheckered size={15} weight="duotone" />,
            settings: <Gear          size={15} weight="duotone" />,
            profile:  <UserCircle   size={15} weight="duotone" />,
          };
          const mobileLabels: Record<string, string> = {
            overview: 'Overview',
            orders: 'Orders',
            menu: 'Menu',
            staff: 'Staff',
            tokens: 'Tokens',
            audit: 'Audits',
            settings: 'Settings',
            profile: 'Profile'
          };
          return (
            <button
              key={space}
              onClick={() => setActiveWorkspace(space)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-white font-bold'
                  : 'text-text-muted hover:text-foreground hover:bg-surface-container/50'
              }`}
            >
              {mobileIcons[space]}
              {mobileLabels[space]}
            </button>
          );
        })}
      </nav>

      {/* Desktop Left Sidebar Container (keeps the spacer for the main content) */}
      <div className="hidden md:block relative w-[72px] shrink-0 h-screen z-50">
        <aside className="group absolute top-0 left-0 h-full w-[72px] hover:w-64 transition-all duration-300 ease-in-out bg-surface-header border-r border-border flex flex-col justify-between py-6 px-3.5 overflow-hidden hover:shadow-[8px_0_24px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3">
              <div className="w-8 h-8 shrink-0 bg-surface border border-border rounded-md flex items-center justify-center text-foreground font-bold text-sm">
                HH
              </div>
              <div className="hidden group-hover:block whitespace-nowrap overflow-hidden">
                <h1 className="font-bold text-sm text-foreground leading-tight">Hau Hau</h1>
                <span className="text-xs text-text-muted font-medium block mt-0.5">Control Center</span>
              </div>
            </div>
            
            <hr className="border-border" />
            
            <nav className="flex flex-col gap-1.5">
              {(['overview', 'orders', 'menu', 'staff', 'tokens', 'audit', 'settings', 'profile'] as const).map((space) => {
                const isSelected = activeWorkspace === space;
                const sidebarLabels: Record<string, { icon: React.ReactNode; text: string }> = {
                  overview: { icon: <SquaresFour  size={17} weight="duotone" />, text: 'Overview' },
                  orders:   { icon: <ClipboardText size={17} weight="duotone" />, text: 'Orders' },
                  menu:     { icon: <ForkKnife    size={17} weight="duotone" />, text: 'Menu' },
                  staff:    { icon: <Users        size={17} weight="duotone" />, text: 'Staff' },
                  tokens:   { icon: <CreditCard   size={17} weight="duotone" />, text: 'Token Cards' },
                  audit:    { icon: <ShieldCheckered size={17} weight="duotone" />, text: 'Audit Logs' },
                  settings: { icon: <Gear          size={17} weight="duotone" />, text: 'Outlet Settings' },
                  profile:  { icon: <UserCircle   size={17} weight="duotone" />, text: 'Profile' },
                };
                return (
                  <button
                    key={space}
                    onClick={() => setActiveWorkspace(space)}
                    className={`w-full h-10 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center group-hover:justify-start px-2 group-hover:px-3.5 gap-0 group-hover:gap-3.5 ${
                      isSelected
                        ? 'bg-primary text-white font-bold shadow-[0_4px_12px_rgba(224,123,57,0.15)]'
                        : 'text-text-muted hover:text-foreground hover:bg-surface-container/50'
                    }`}
                  >
                    <span className="shrink-0 w-5 flex items-center justify-center">{sidebarLabels[space].icon}</span>
                    <span className="hidden group-hover:inline-block whitespace-nowrap overflow-hidden">
                      {sidebarLabels[space].text}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex flex-col gap-4 mt-6">
            <hr className="border-border" />
            <div className="flex items-center justify-center group-hover:justify-start gap-0 group-hover:gap-3">
              <div className="w-8 h-8 shrink-0 rounded-full bg-surface-container border border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                {currentUser?.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'S'}
              </div>
              <div className="hidden group-hover:flex flex-col whitespace-nowrap overflow-hidden">
                <span className="text-xs font-bold text-foreground">{currentUser?.name || 'Sarah'}</span>
                <span className="text-[9px] text-text-muted">Restaurant Owner</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="minimal-btn-secondary w-full h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all flex items-center justify-center group-hover:justify-start px-2 group-hover:px-3.5 gap-0 group-hover:gap-3"
            >
                            <span className="shrink-0 w-5 flex items-center justify-center"><SignOut size={17} weight="duotone" /></span>
              <span className="hidden group-hover:inline-block whitespace-nowrap overflow-hidden">
                Log Out
              </span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main content scroll container */}
      <main className="flex-1 px-4 pt-4 md:px-6 md:pt-6 lg:px-8 lg:pt-8 pb-24 md:pb-32 flex flex-col gap-6 overflow-y-auto h-screen min-w-0">
        
        {/* Workspace Title Header */}
        <header className="flex justify-between items-center border-b border-border pb-4 shrink-0">
          <div>
            <h1 className="text-lg font-bold text-foreground capitalize">
              {activeWorkspace === 'tokens' ? 'Token Cards' : activeWorkspace === 'profile' ? 'Profile & Settings' : activeWorkspace}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">Welcome back, {currentUser?.name || 'Sarah'}. Here is your operations status.</p>
          </div>
          <div className="text-xs font-mono font-bold text-text-muted bg-surface-header border border-border px-3 py-1.5 rounded-lg hidden sm:block">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {(activeWorkspace === 'overview' || activeWorkspace === 'orders') && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface border border-border p-4.5 rounded-xl shrink-0 shadow-xs">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-foreground">Operating Period</span>
              <span className="text-[10px] text-text-muted">Recalculate analytics, revenue pools, and transactions</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(['today', 'yesterday', 'last7days', 'all', 'custom'] as const).map((type) => {
                const labelMap = {
                  today: 'Today',
                  yesterday: 'Yesterday',
                  last7days: 'Last 7 Days',
                  all: 'All Time',
                  custom: 'Custom Date'
                };
                const isSelected = dateFilterType === type;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setDateFilterType(type);
                      setOrdersPage(1);
                    }}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary border-primary text-white scale-95 shadow-sm'
                        : 'bg-surface-header border-border text-text-muted hover:text-foreground hover:bg-surface-container/20'
                    }`}
                  >
                    {labelMap[type]}
                  </button>
                );
              })}
              {dateFilterType === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setOrdersPage(1);
                  }}
                  className="bg-surface-header border border-border px-3 py-1.5 text-xs font-mono font-bold rounded-lg text-foreground focus:outline-none focus:border-primary w-40"
                />
              )}
            </div>
          </div>
        )}

        {/* Workspace content sections */}
        <div className="flex-1 flex flex-col gap-6 animate-slide-in min-h-0">
          
          {/* A. OVERVIEW WORKSPACE */}
          {activeWorkspace === 'overview' && (
            <div className="flex flex-col gap-6">
              
              {/* KPI Cards in 3+3 Grid */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Total Orders" value={totalOrders} color="default" iconType="order" />
                  <StatCard title="Pending Queue" value={pendingOrders} color="warning" iconType="pending" />
                  <StatCard title="Completed" value={completedOrders} color="success" iconType="completed" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Cash Revenue" value={`₹${cashCollection.toFixed(2)}`} color="primary" iconType="cash" />
                  <StatCard title="Online Revenue" value={`₹${onlineCollection.toFixed(2)}`} color="primary" iconType="online" />
                  <StatCard title="Token Revenue" value={`₹${tokenCollection.toFixed(2)}`} color="primary" iconType="token" />
                </div>
              </div>

              {/* Chart and Revenue Snapshot Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  {renderDistributionChart()}
                </div>
                
                {/* Total Revenue Big Card */}
                <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-44 h-44 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                  <div>
                    <span className="text-[10px] text-text-muted font-bold block uppercase tracking-wider">{getFilterLabel()} Revenue</span>
                    <span className="text-4xl font-extrabold text-foreground font-mono mt-3 block leading-tight">
                      ₹{totalCollections.toFixed(2)}
                    </span>
                    <p className="text-xs text-text-muted mt-2 leading-relaxed">Combined cash, online, and token card transactions logged for this period.</p>
                  </div>
                  <div className="border-t border-border pt-4 mt-6 flex justify-between items-center text-xs">
                    <span className="text-text-muted font-semibold">{getFilterLabel()} Total Orders</span>
                    <span className="font-bold text-foreground font-mono">{totalOrders} orders</span>
                  </div>
                </div>
              </div>

              {/* Items & Operators quick view */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top selling items */}
                <div className="minimal-card p-5 rounded-xl bg-surface border border-border flex flex-col gap-4">
                  <h3 className="text-xs text-foreground font-bold uppercase tracking-wider flex items-center gap-2">
                    <ForkKnife size={14} weight="duotone" className="text-primary" /> Top Selling Items ({getFilterLabel()})
                  </h3>
                  <div className="flex flex-col gap-2">
                    {topSellingItems.length === 0 ? (
                      <div className="py-6 text-center text-xs text-text-muted font-medium">No sales logged yet</div>
                    ) : (
                      topSellingItems.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-surface-container/20 border border-border rounded-lg text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-full bg-surface-header border border-border flex items-center justify-center font-bold text-text-muted text-[10px]">{idx + 1}</span>
                            <span className="font-bold text-foreground">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-text-muted font-semibold">{item.quantity} sold</span>
                            <span className="font-bold text-foreground font-mono">₹{item.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active operators */}
                <div className="minimal-card p-5 rounded-xl bg-surface border border-border flex flex-col gap-4">
                  <h3 className="text-xs text-foreground font-bold uppercase tracking-wider flex items-center gap-2">
                    <UsersThree size={14} weight="duotone" className="text-primary" /> Active Staff Operators
                  </h3>
                  <div className="flex flex-col gap-2">
                    {activeStaffList.length === 0 ? (
                      <p className="text-xs text-text-muted font-semibold text-center py-4">No active staff right now</p>
                    ) : (
                      activeStaffPreview.map((staff) => {
                        const staffOrdersCount = filteredByDateOrders.filter(o => o.staffId === staff.username).length;
                        return (
                          <div key={staff.id} className="flex items-center justify-between p-3 bg-surface-container/20 border border-border rounded-lg text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-surface-header border border-border flex items-center justify-center text-[10px] font-bold text-text-muted">
                                {staff.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold text-foreground">{staff.name}</span>
                                <span className="text-[10px] text-text-muted block">@{staff.username}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3.5">
                              <span className="bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded text-[10px] font-bold">Active</span>
                              <span className="font-mono text-text-muted font-bold">{staffOrdersCount} orders</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* B. ORDERS WORKSPACE */}
          {activeWorkspace === 'orders' && (
            <div className="flex flex-col gap-6">
              {renderDistributionChart()}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-4 border-b border-border pb-1">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-sm font-bold text-foreground">Incoming Orders</h2>
                      <p className="text-xs text-text-muted mt-0.5">Filter and complete active POS transactions</p>
                    </div>
                    {paymentModeFilter !== 'all' && (
                      <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg text-xs text-primary font-semibold animate-slide-in">
                        <span>Payment Filter: <strong className="capitalize">{paymentModeFilter}</strong></span>
                        <button 
                          onClick={() => setPaymentModeFilter('all')} 
                          className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded hover:bg-primary-hover transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Sub-tabs left aligned directly above the table */}
                  <div className="flex gap-2 border-b border-border w-full">
                    {(['pending', 'completed', 'all'] as const).map((tab) => {
                      const isSelected = activeOrderTab === tab;
                      let count = 0;
                      if (tab === 'pending') count = pendingOrders;
                      if (tab === 'completed') count = completedOrders;
                      if (tab === 'all') count = totalOrders;

                      return (
                        <button
                          key={tab}
                          onClick={() => {
                          setActiveOrderTab(tab);
                          setOrdersPage(1); // reset on tab change
                        }}
                          className={`px-6 py-3 text-xs font-semibold transition-all cursor-pointer border-b-2 mb-[-2px] flex items-center gap-2 ${
                            isSelected
                              ? 'border-primary bg-surface/50 text-foreground font-bold'
                              : 'border-transparent text-text-muted hover:text-foreground hover:bg-surface/20'
                          }`}
                        >
                          <span className="capitalize">{tab}</span>
                          <span className="bg-surface-header text-text-muted text-[10px] px-2 py-0.5 rounded-full border border-border font-bold">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6-column Clickable Table */}
                <div className="minimal-card rounded-xl overflow-hidden bg-surface border border-border shadow-sm">
                  {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center opacity-75">
                      <span className="text-sm font-bold block text-foreground">No {activeOrderTab} records</span>
                      <span className="text-xs text-text-muted mt-1 block">Staff-transmitted transactions will reflect here</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-surface-header/60 text-text-muted">
                            <th className="p-3.5 pl-5 font-semibold">Order</th>
                            <th className="p-3.5 font-semibold">Table</th>
                            <th className="p-3.5 font-semibold">Items</th>
                            <th className="p-3.5 font-semibold">Total</th>
                            <th className="p-3.5 font-semibold">Status</th>
                            <th className="p-3.5 pr-5 font-semibold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-surface-container/10">
                          {(() => {
                            let lastDateHeader = '';
                            return pagedOrders.map((order) => {
                              const orderDate = new Date(order.createdAt);
                              const dateHeaderStr = orderDate.toLocaleDateString(undefined, { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              });
                              const showHeader = dateHeaderStr !== lastDateHeader;
                              if (showHeader) {
                                lastDateHeader = dateHeaderStr;
                              }
                              return (
                                <React.Fragment key={order.id}>
                                  {showHeader && (
                                    <tr className="bg-surface-header/60 border-y border-border select-none pointer-events-none">
                                      <td colSpan={6} className="p-3 pl-5 font-bold text-foreground text-[11px] tracking-wide">
                                        <span className="flex items-center gap-2">
                                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                          {dateHeaderStr}
                                        </span>
                                      </td>
                                    </tr>
                                  )}
                                  <tr 
                                    onClick={() => setSelectedOrder(order)}
                                    className="hover:bg-surface-container/20 transition-colors cursor-pointer"
                                  >
                                    <td className="p-3.5 pl-5 font-bold text-foreground font-mono">#{order.id.replace('HH-', '')}</td>
                                    <td className="p-3.5 font-bold text-primary font-mono">{order.tableNumber}</td>
                                    <td className="p-3.5 text-text-muted">
                                      {order.items.reduce((sum, i) => sum + i.quantity, 0)} units
                                    </td>
                                    <td className="p-3.5 font-bold text-foreground font-mono">₹{order.total.toFixed(2)}</td>
                                    <td className="p-3.5">
                                      <StatusBadge status={order.orderStatus} />
                                    </td>
                                    <td className="p-3.5 pr-5 text-right flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="minimal-btn-secondary px-3 py-1.5 h-9 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                                      >
                                        Details
                                      </button>
                                      
                                      {order.orderStatus === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleStatusChange(order.id, 'completed')}
                                            className="bg-success hover:bg-[#235e26] text-white px-3 py-1.5 h-9 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                                          >
                                            Complete
                                          </button>
                                          <button
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="border border-error/20 hover:bg-error/5 text-error px-3 py-1.5 h-9 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                                          >
                                            Cancel
                                          </button>
                                        </>
                                      )}

                                      {order.orderStatus === 'completed' && (
                                        <button
                                          onClick={() => handleStatusChange(order.id, 'pending')}
                                          className="border border-primary/20 hover:bg-primary/5 text-primary px-3 py-1.5 h-9 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                                          title="Revert to Pending"
                                        >
                                          Revert
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                </React.Fragment>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <Pagination
                    currentPage={safeOrdersPage}
                    totalPages={ordersPageCount}
                    onPageChange={setOrdersPage}
                    totalItems={filteredOrders.length}
                    itemsPerPage={ORDERS_PER_PAGE}
                    label="orders"
                  />
                </div>
              </div>
            </div>
          )}

          {/* C. MENU INVENTORY WORKSPACE */}
          {activeWorkspace === 'menu' && (
            <div className="flex flex-col gap-6">
              
              {/* Full Width Menu Items Table */}
              <div className="w-full minimal-card rounded-xl overflow-hidden flex flex-col bg-surface border border-border">
                <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Menu Items</h3>
                    <p className="text-[10px] text-text-muted mt-0.5">Manage food items availability and information</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddingMenuItem(true);
                    }}
                    className="minimal-btn-primary px-4 py-2 h-9 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                  >
                    + Add Item
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-surface-header/60 text-text-muted">
                        <th className="p-3.5 pl-5 font-semibold">Item Details</th>
                        <th className="p-3.5 font-semibold">Category</th>
                        <th className="p-3.5 font-semibold">Price</th>
                        <th className="p-3.5 font-semibold">Prep Estimate</th>
                        <th className="p-3.5 font-semibold">Availability</th>
                        <th className="p-3.5 pr-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-surface-container/10">
                      {pagedMenu.map((item) => (
                        <tr key={item.id} className="hover:bg-surface-container/20 transition-colors">
                          <td className="p-3.5 pl-5">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-foreground text-xs">{item.name}</span>
                              <span className="text-[10px] text-text-muted line-clamp-1 mt-0.5">{item.description}</span>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex gap-1.5 mt-1.5">
                                  {item.tags.map(t => (
                                    <span key={t} className="text-[9px] bg-surface-header text-text-muted px-1.5 py-0.2 border border-border rounded font-bold capitalize">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 font-semibold text-text-muted">{item.category}</td>
                          <td className="p-3.5 font-bold text-foreground font-mono">₹{item.price.toFixed(2)}</td>
                          <td className="p-3.5 font-mono text-text-muted">{item.prepTime || '5 mins'}</td>
                          <td className="p-3.5">
                            <StatusBadge status={item.available ? 'active' : 'inactive'} />
                          </td>
                          <td className="p-3.5 pr-5 text-right flex justify-end gap-1.5">
                            <button
                              onClick={() => toggleMenuItem(item.id)}
                              className={`px-3 py-1.5 h-9 min-h-0 text-xs font-bold border rounded-lg transition-colors cursor-pointer active:scale-95 ${
                                item.available
                                  ? 'border-primary/20 text-primary hover:bg-primary/5'
                                  : 'border-success/20 text-success hover:bg-success/5'
                              }`}
                            >
                              {item.available ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="px-3 py-1.5 h-9 min-h-0 border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface-container/30 transition-colors cursor-pointer active:scale-95"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMenuItem(item.id, item.name)}
                              className="px-3 py-1.5 h-9 min-h-0 border border-error/20 rounded-lg text-xs font-bold text-error hover:bg-error/5 transition-colors cursor-pointer active:scale-95"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={safeMenuPage}
                  totalPages={menuPageCount}
                  onPageChange={setMenuPage}
                  totalItems={menu.length}
                  itemsPerPage={MENU_PER_PAGE}
                  label="items"
                />
              </div>
            </div>
          )}

          {/* D. STAFF ACCOUNTS WORKSPACE */}
          {activeWorkspace === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-in">
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

          {/* E. TOKEN CARDS WORKSPACE */}
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
              <div className="minimal-card rounded-xl overflow-hidden bg-surface border border-border shadow-sm">
                <div className="bg-surface-header/80 px-4 py-3 border-b border-border flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-xs font-bold text-foreground">
                      Token Sales Summary by Staff Member
                    </h3>
                    <p className="text-[10px] text-text-muted">Click a staff card to manage limits and view history</p>
                  </div>
                  <span className="text-xs text-text-muted font-mono font-bold">{staffList.length} operators</span>
                </div>
                <div className="p-4">
                  {staffList.length === 0 ? (
                    <div className="p-8 text-center text-xs text-text-muted font-bold flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-surface-container border border-border flex items-center justify-center opacity-40">
                        <UsersThree size={20} weight="duotone" />
                      </div>
                      <span>No staff accounts registered</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {staffList.map((staff) => {
                        const now = new Date();
                        const staffTxs = tokenTransactions.filter(tx => tx.soldBy === staff.username);
                        const currentMonthTxs = staffTxs.filter(tx => {
                          const d = new Date(tx.createdAt);
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        });
                        const tokensSoldThisMonth = currentMonthTxs.reduce((sum, tx) => sum + tx.tokens, 0);
                        const tokensSoldAllTime = staffTxs.reduce((sum, tx) => sum + tx.tokens, 0);
                        const amountCollected = staffTxs.reduce((sum, tx) => sum + tx.amount, 0);
                        const limit = staff.monthlyTokenLimit ?? 1000;
                        const remaining = Math.max(0, limit - tokensSoldThisMonth);
                        const usagePct = limit > 0 ? Math.min(100, (tokensSoldThisMonth / limit) * 100) : 0;
                        const isNearLimit = usagePct >= 80;
                        const isOverLimit = usagePct >= 100;

                        return (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => {
                              setSelectedStaffDetail(staff);
                              setEditingLimitValue(String(staff.monthlyTokenLimit ?? 1000));
                            }}
                            className="bg-surface-container/20 border border-border p-4 rounded-xl flex flex-col gap-3 text-left hover:border-primary/20 hover:bg-surface-container/40 transition-all cursor-pointer active:scale-[0.98] group relative overflow-hidden"
                          >
                            {/* Glow decoration */}
                            <div className="absolute -right-6 -top-6 w-16 h-16 bg-primary/5 rounded-full blur-xl pointer-events-none group-hover:bg-primary/8 transition-colors" />

                            {/* Staff name + status */}
                            <div className="flex items-center justify-between relative z-10">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-surface-header border border-border flex items-center justify-center text-xs font-bold text-foreground">
                                  {staff.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{staff.name}</div>
                                  <div className="text-[10px] text-text-muted">@{staff.username}</div>
                                </div>
                              </div>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border uppercase ${
                                staff.status === 'active'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : 'bg-error/10 text-error border-error/20'
                              }`}>
                                {staff.status}
                              </span>
                            </div>

                            {/* Monthly usage bar */}
                            <div className="flex flex-col gap-1.5 relative z-10">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-text-muted font-bold">Monthly Usage</span>
                                <span className={`text-xs font-mono font-bold ${
                                  isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-foreground'
                                }`}>{tokensSoldThisMonth.toFixed(0)} / {limit} <TokenIcon className="ml-1 w-3.5 h-3.5" /></span>
                              </div>
                              <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-border">
                                <div
                                  style={{ width: `${usagePct}%` }}
                                  className={`h-full rounded-full transition-all ${
                                    isOverLimit ? 'bg-error' : isNearLimit ? 'bg-warning' : 'bg-primary'
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Stats grid */}
                            <div className="grid grid-cols-2 gap-2 relative z-10">
                              <div className="bg-surface-container/40 border border-border rounded-lg p-2.5 flex flex-col gap-0.5">
                                <span className="text-[9px] text-text-muted font-bold">Remaining</span>
                                <span className={`text-sm font-bold font-mono ${
                                  isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-[#71d384]'
                                }`}>{remaining.toFixed(0)}</span>
                                <span className="text-[9px] text-text-muted">tokens left</span>
                              </div>
                              <div className="bg-surface-container/40 border border-border rounded-lg p-2.5 flex flex-col gap-0.5">
                                <span className="text-[9px] text-text-muted font-bold">All-Time</span>
                                <span className="text-sm font-bold font-mono text-primary">{tokensSoldAllTime.toFixed(0)}</span>
                                <span className="text-[9px] text-text-muted font-medium">tokens sold</span>
                              </div>
                            </div>

                            {/* Revenue */}
                            <div className="flex items-center justify-between border-t border-border pt-2.5 relative z-10">
                              <span className="text-[10px] text-text-muted font-bold">Total Revenue Collected</span>
                              <span className="font-mono font-bold text-xs text-[#71d384]">₹{amountCollected.toFixed(2)}</span>
                            </div>

                            {/* Click hint */}
                            <div className="text-[9px] text-text-muted font-bold uppercase tracking-wider text-center opacity-0 group-hover:opacity-100 transition-opacity relative z-10 mt-1">
                              Click to manage &rarr;
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* F. AUDIT LOGS WORKSPACE */}
          {activeWorkspace === 'audit' && (() => {
            const filteredLogs = auditLogs.filter(log => {
              const actionMatch = auditActionFilter === 'all' || log.action === auditActionFilter;
              const searchMatch = !auditQuery.trim() || 
                log.action.toLowerCase().includes(auditQuery.toLowerCase()) ||
                log.actorUid.toLowerCase().includes(auditQuery.toLowerCase()) ||
                log.targetId.toLowerCase().includes(auditQuery.toLowerCase()) ||
                (log.actorRole && log.actorRole.toLowerCase().includes(auditQuery.toLowerCase()));
              return actionMatch && searchMatch;
            });

            return (
              <div className="flex flex-col gap-6 animate-slide-in">
                {/* Search & Filter Header */}
                <div className="bg-surface border border-border p-4.5 rounded-xl flex flex-col sm:flex-row items-center gap-3.5 shadow-xs">
                  <div className="flex-1 w-full flex flex-col gap-1">
                    <label className="text-[10px] text-text-muted font-bold uppercase">Search Logs</label>
                    <input
                      type="text"
                      placeholder="Search by action, ID, role..."
                      value={auditQuery}
                      onChange={(e) => setAuditQuery(e.target.value)}
                      className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/40 w-full"
                    />
                  </div>
                  <div className="w-full sm:w-56 flex flex-col gap-1">
                    <label className="text-[10px] text-text-muted font-bold uppercase">Action Filter</label>
                    <select
                      value={auditActionFilter}
                      onChange={(e) => setAuditActionFilter(e.target.value)}
                      className="minimal-input px-3 py-2 text-xs text-zinc-300 focus:outline-none bg-surface-header"
                    >
                      <option value="all">All Actions</option>
                      <option value="staffCreated">Staff Registered</option>
                      <option value="staffDeactivated">Staff Deactivated</option>
                      <option value="staffRemoved">Staff Removed</option>
                      <option value="orderCreated">Order Placed</option>
                      <option value="orderCompleted">Order Completed</option>
                      <option value="orderCancelled">Order Cancelled</option>
                      <option value="menuItemCreated">Menu Item Created</option>
                      <option value="menuItemUpdated">Menu Item Updated</option>
                      <option value="menuItemDeleted">Menu Item Deleted</option>
                      <option value="tokenRecharged">Token Recharged</option>
                      <option value="tokenDeducted">Token Deducted</option>
                      <option value="tokenRefunded">Token Refunded</option>
                      <option value="tokenAdjusted">Token Adjusted</option>
                      <option value="monthlyLimitChanged">Limit Changed</option>
                      <option value="settingsUpdated">Settings Updated</option>
                    </select>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <div className="minimal-card rounded-xl overflow-hidden bg-surface border border-border shadow-sm">
                  <div className="bg-surface-header/80 px-4 py-3 border-b border-border flex justify-between items-center">
                    <h3 className="text-xs font-bold text-foreground">Operational Audit Log</h3>
                    <span className="text-xs text-text-muted font-mono font-bold">{filteredLogs.length} events logged</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {filteredLogs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-text-muted font-bold">
                        No audit logs matching search filters
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-surface-header/40 border-b border-border text-text-muted font-bold">
                            <th className="p-3.5 pl-5 w-40">Timestamp</th>
                            <th className="p-3.5 w-36">Action</th>
                            <th className="p-3.5 w-32">Actor</th>
                            <th className="p-3.5 w-28">Target ID</th>
                            <th className="p-3.5">Details / Changes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredLogs.map(log => {
                            let actionLabel = log.action;
                            let actionColor = 'text-foreground bg-surface-container';
                            
                            if (log.action.includes('Created')) {
                              actionColor = 'text-success bg-success/5 border border-success/15';
                            } else if (log.action.includes('Deactivated') || log.action.includes('Removed') || log.action.includes('Cancelled')) {
                              actionColor = 'text-error bg-error/5 border border-error/15';
                            } else if (log.action.includes('Deducted')) {
                              actionColor = 'text-blue-400 bg-blue-500/5 border border-blue-500/10';
                            } else if (log.action.includes('Recharged') || log.action.includes('Refunded')) {
                              actionColor = 'text-primary bg-primary/5 border border-primary/10';
                            }

                            let details = '';
                            if (log.action === 'tokenRecharged' && log.after) {
                              details = `Recharged +${log.after.tokens} tokens`;
                            } else if (log.action === 'tokenDeducted' && log.after) {
                              details = `Deducted -${log.after.tokens} tokens for Order #${log.after.orderId}`;
                            } else if (log.action === 'tokenRefunded' && log.after) {
                              details = `Refunded +${log.after.tokens} tokens for Cancelled Order #${log.after.orderId}`;
                            } else if (log.action === 'tokenAdjusted' && log.before && log.after) {
                              details = `Manual correction: ${log.before.tokens} -> ${log.after.tokens}`;
                            } else if (log.action === 'orderCreated' && log.after) {
                              details = `Placed order for Table ${log.after.tableNumber} (Total: ₹${log.after.total})`;
                            } else if (log.action === 'monthlyLimitChanged' && log.before && log.after) {
                              details = `Limit adjusted: ${log.before.monthlyTokenLimit} -> ${log.after.monthlyTokenLimit} tokens`;
                            } else if (log.action === 'settingsUpdated' && log.after) {
                              details = `Outlet properties or conversion rates modified`;
                            } else if (log.before || log.after) {
                              details = JSON.stringify(log.after || log.before);
                            } else {
                              details = 'N/A';
                            }

                            return (
                              <tr key={log.id} className="hover:bg-surface-container/10 transition-colors">
                                <td className="p-3.5 pl-5 font-mono text-text-muted">
                                  {new Date(log.timestamp).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${actionColor}`}>
                                    {actionLabel}
                                  </span>
                                </td>
                                <td className="p-3.5 font-semibold text-foreground">
                                  <div className="flex flex-col">
                                    <span>{log.actorRole === 'owner' ? 'Sarah (Owner)' : 'Staff Member'}</span>
                                    <span className="text-[9px] text-text-muted font-mono">{log.actorUid}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 font-mono text-text-muted">#{log.targetId}</td>
                                <td className="p-3.5 font-semibold text-text-muted italic">{details}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* G. OUTLET SETTINGS WORKSPACE */}
          {activeWorkspace === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-in">
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const val = parseFloat(tokenValueInRupees);
                  const limit = parseInt(monthlyTokenLimitDefaults);
                  if (isNaN(val) || val <= 0) {
                    alert('Token conversion rate must be positive.');
                    return;
                  }
                  if (isNaN(limit) || limit < 0) {
                    alert('Default monthly token limit must be positive.');
                    return;
                  }
                  await updateSettings({
                    outletName: outletName.trim(),
                    tokenValueInRupees: val,
                    manualUpiEnabled,
                    taxEnabled,
                    currency,
                    receiptFooter: receiptFooter.trim(),
                    monthlyTokenLimitDefaults: limit
                  });
                }}
                className="lg:col-span-2 minimal-card rounded-xl bg-surface border border-border p-5 flex flex-col gap-4 text-xs shadow-sm"
              >
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-foreground">POS Terminal & Outlet Configuration</h3>
                  <button
                    type="submit"
                    className="minimal-btn-primary px-4 py-2 h-9 min-h-0 text-xs font-bold rounded-lg text-white cursor-pointer"
                  >
                    Save Configuration
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Outlet Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-muted font-bold">Outlet Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hau-Hau Outlet 1"
                      value={outletName}
                      onChange={(e) => setOutletName(e.target.value)}
                      className="minimal-input px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>

                  {/* Token Rate */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-muted font-bold">Token Value (in Rupees)</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-text-muted font-bold">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="30"
                        value={tokenValueInRupees}
                        onChange={(e) => setTokenValueInRupees(e.target.value)}
                        className="minimal-input pl-7 pr-3.5 py-2.5 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Default Monthly Limit */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-muted font-bold">Default Staff Monthly Token Limit</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="1000"
                      value={monthlyTokenLimitDefaults}
                      onChange={(e) => setMonthlyTokenLimitDefaults(e.target.value)}
                      className="minimal-input px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                  </div>

                  {/* Currency */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-text-muted font-bold">Currency Code</label>
                    <input
                      type="text"
                      required
                      placeholder="INR"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="minimal-input px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Text Footer */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Receipt Footer Message</label>
                  <textarea
                    rows={2}
                    placeholder="Footer printed on customer receipts..."
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white resize-none"
                  />
                </div>

                {/* Option Toggles */}
                <div className="flex flex-col gap-2.5 bg-surface-container/20 border border-border rounded-xl p-4">
                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-text-muted select-none">
                    <input
                      type="checkbox"
                      checked={manualUpiEnabled}
                      onChange={(e) => setManualUpiEnabled(e.target.checked)}
                      className="accent-primary cursor-pointer w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">Manual UPI Payment Mode</span>
                      <span className="text-[10px] text-text-muted">Display UPI barcode option during checkout</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-text-muted select-none border-t border-border pt-2.5 mt-1">
                    <input
                      type="checkbox"
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      className="accent-primary cursor-pointer w-4 h-4"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground">Include Service Tax / GST</span>
                      <span className="text-[10px] text-text-muted">Apply tax calculation rules on orders</span>
                    </div>
                  </label>
                </div>
              </form>

              <div className="lg:col-span-1 flex flex-col gap-4">
                <div className="minimal-card rounded-xl bg-surface border border-border p-4.5 text-xs shadow-sm flex flex-col gap-3">
                  <h4 className="font-bold text-foreground">Configuration Rules</h4>
                  <p className="text-text-muted leading-relaxed">
                    Changes made here affect all POS terminals under this outlet. Changing the token exchange value updates the price conversion in real-time.
                  </p>
                  <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg text-primary text-[11px] leading-relaxed">
                    <strong>Exchange Rate Note:</strong> Student cards and checkout will use 1 Token = ₹{tokenValueInRupees || '0.00'} as the baseline value.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* H. PROFILE WORKSPACE */}
          {activeWorkspace === 'profile' && (
            <ProfileSection />
          )}

        </div>
      </main>

      {/* 1. Add Food Item Modal Popup */}
      {isAddingMenuItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setIsAddingMenuItem(false)}>
          <div 
            className="bg-surface border border-border w-full max-w-md max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted">Inventory Management</span>
                <span className="text-sm font-bold text-foreground mt-0.5">Register Food Item</span>
              </div>
              <button 
                onClick={() => setIsAddingMenuItem(false)}
                className="text-[11px] text-text-muted hover:text-foreground font-bold transition-colors cursor-pointer"
              >
                                <X size={14} weight="bold" /> Close
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                handleCreateMenuItem(e);
                setIsAddingMenuItem(false);
              }} 
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chili Fries"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30"
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="250"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30 font-mono"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Category</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-border-focus bg-surface-header"
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
                      className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30 mt-1.5 animate-slide-in"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Description</label>
                  <textarea
                    placeholder="Ingredients, preparation details... (optional)"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    rows={2}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30 resize-none"
                  />
                </div>

                {/* Prep Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Prep Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 mins (optional)"
                    value={itemPrepTime}
                    onChange={(e) => setItemPrepTime(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30"
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-text-muted font-bold">Item Flags</label>
                  <div className="flex flex-col gap-2 bg-surface-container/30 p-3 border border-border rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-text-muted">
                      <input
                        type="checkbox"
                        checked={itemTags.spicy}
                        onChange={(e) => setItemTags(prev => ({ ...prev, spicy: e.target.checked }))}
                        className="accent-primary cursor-pointer"
                      />
                      <Fire size={14} weight="duotone" className="text-orange-400" />
                      <span>Spicy Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-text-muted">
                      <input
                        type="checkbox"
                        checked={itemTags.veg}
                        onChange={(e) => setItemTags(prev => ({ ...prev, veg: e.target.checked }))}
                        className="accent-success cursor-pointer"
                      />
                      <Leaf size={14} weight="duotone" className="text-green-400" />
                      <span>Vegetarian Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-text-muted">
                      <input
                        type="checkbox"
                        checked={itemTags.popular}
                        onChange={(e) => setItemTags(prev => ({ ...prev, popular: e.target.checked }))}
                        className="accent-primary cursor-pointer"
                      />
                      <Star size={14} weight="duotone" className="text-yellow-400" />
                      <span>Best Seller / Popular</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="bg-surface-header/80 px-5 py-3.5 border-t border-border flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddingMenuItem(false)}
                  className="minimal-btn-secondary px-4 py-2.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="minimal-btn-primary px-5 py-2.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all text-white"
                >
                  Register Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Order Details Modal popup */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {/* 3. Manage Staff Limits Modal popup */}
      {selectedStaffDetail && (() => {
        const now = new Date();
        const staffTxs = tokenTransactions.filter(tx => tx.soldBy === selectedStaffDetail.username);
        const currentMonthTxs = staffTxs.filter(tx => {
          const d = new Date(tx.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const tokensSoldThisMonth = currentMonthTxs.reduce((sum, tx) => sum + tx.tokens, 0);
        const amountCollected = staffTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const limit = selectedStaffDetail.monthlyTokenLimit ?? 1000;
        const remaining = Math.max(0, limit - tokensSoldThisMonth);
        const usagePct = limit > 0 ? Math.min(100, (tokensSoldThisMonth / limit) * 100) : 0;
        const isNearLimit = usagePct >= 80;
        const isOverLimit = usagePct >= 100;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setSelectedStaffDetail(null)}>
            <div className="bg-surface border border-border w-full max-w-lg max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-foreground shadow-inner">
                    {selectedStaffDetail.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{selectedStaffDetail.name}</div>
                    <div className="text-xs text-text-muted mt-0.5">@{selectedStaffDetail.username} &middot; Token Operator</div>
                  </div>
                </div>
                <button onClick={() => setSelectedStaffDetail(null)} className="text-[11px] text-text-muted hover:text-foreground font-bold transition-colors cursor-pointer">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto flex flex-col gap-5 p-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-container/40 border border-border rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] text-text-muted font-bold">This Month</span>
                    <span className="text-xl font-bold font-mono text-primary">{tokensSoldThisMonth.toFixed(0)}</span>
                    <span className="text-[10px] text-text-muted">tokens sold</span>
                  </div>
                  <div className={`bg-surface-container/40 border rounded-xl p-3 flex flex-col gap-1 ${isOverLimit ? 'border-error/30' : isNearLimit ? 'border-warning/30' : 'border-border'}`}>
                    <span className="text-[10px] text-text-muted font-bold">Remaining</span>
                    <span className={`text-xl font-bold font-mono ${isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-[#71d384]'}`}>{remaining.toFixed(0)}</span>
                    <span className="text-[10px] text-text-muted">tokens left</span>
                  </div>
                  <div className="bg-surface-container/40 border border-border rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[10px] text-text-muted font-bold">Revenue</span>
                    <span className="text-xl font-bold font-mono text-[#71d384]">₹{amountCollected.toFixed(0)}</span>
                    <span className="text-[10px] text-text-muted">all-time</span>
                  </div>
                </div>
                <div className="bg-surface-container/40 border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-text-muted font-bold">Monthly Usage</span>
                    <span className={`text-xs font-mono font-bold flex items-center gap-1 ${isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-foreground'}`}>{tokensSoldThisMonth.toFixed(0)} / {limit} <TokenIcon className="w-3.5 h-3.5" /> ({usagePct.toFixed(0)}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-surface-container rounded-full overflow-hidden border border-border">
                    <div style={{ width: `${usagePct}%` }} className={`h-full rounded-full transition-all duration-700 ${isOverLimit ? 'bg-error' : isNearLimit ? 'bg-warning' : 'bg-primary'}`} />
                  </div>
                  {isOverLimit && <p className="text-[10px] text-error font-bold">&#9888; Monthly limit exceeded. New token sales are blocked.</p>}
                  {isNearLimit && !isOverLimit && <p className="text-[10px] text-warning font-bold">&#9888; Approaching monthly limit. Consider raising the cap.</p>}
                </div>
                <div className="bg-surface-container/40 border border-border rounded-xl p-4 flex flex-col gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Set Monthly Token Limit</h4>
                    <p className="text-[10px] text-text-muted mt-0.5">Restrict how many tokens this operator can sell per calendar month.</p>
                  </div>
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-[9px] text-text-muted font-bold">Limit (tokens / month)</label>
                      <div className="relative flex items-center">
                        <input type="number" min="0" value={editingLimitValue} onChange={(e) => setEditingLimitValue(e.target.value)} className="minimal-input w-full px-3.5 py-2.5 text-sm font-mono text-white pr-10 focus:border-border-focus" />
                        <span className="absolute right-3 flex items-center select-none pointer-events-none"><TokenIcon className="w-3.5 h-3.5 text-text-muted" /></span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const newLimit = parseInt(editingLimitValue) || 0;
                        await updateStaffLimit(selectedStaffDetail.id, newLimit);
                        setSelectedStaffDetail(prev => prev ? { ...prev, monthlyTokenLimit: newLimit } : null);
                      }}
                      className="minimal-btn-primary px-4 py-2.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all whitespace-nowrap animate-slide-in"
                    >
                      Save Limit
                    </button>
                  </div>
                  <div className="text-[10px] text-text-muted font-semibold flex items-center gap-1">Current: <span className="font-mono font-bold text-foreground inline-flex items-center gap-1">{limit} <TokenIcon className="w-3 h-3" />/month</span> &middot; ≈ ₹{(limit * 30).toFixed(0)} cap</div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-foreground">Transaction History</h4>
                    <span className="text-xs text-text-muted font-mono font-bold">{staffTxs.length} total</span>
                  </div>
                  {staffTxs.length === 0 ? (
                    <div className="bg-surface-container/20 border border-border rounded-xl p-6 text-center text-xs text-text-muted">
                      <span>No transactions recorded yet</span>
                    </div>
                  ) : (
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0">
                            <tr className="border-b border-border bg-surface-header text-text-muted">
                              <th className="p-2.5 font-bold">Date</th>
                              <th className="p-2.5 font-bold">Student</th>
                              <th className="p-2.5 font-bold">Tokens</th>
                              <th className="p-2.5 font-bold text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-surface-container/20">
                            {[...staffTxs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((tx) => (
                              <tr key={tx.id} className="hover:bg-surface-container/10 transition-colors">
                                <td className="p-2.5 text-text-muted font-mono font-medium">{new Date(tx.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="p-2.5">
                                  <div className="font-bold text-foreground">{tx.studentName}</div>
                                  <div className="text-[10px] text-text-muted font-mono">#{tx.cardNo}</div>
                                </td>
                                <td className={`p-2.5 font-mono font-bold ${tx.tokens < 0 ? 'text-error' : 'text-primary'}`}>
                                  {tx.tokens > 0 ? '+' : ''}{tx.tokens}
                                </td>
                                <td className={`p-2.5 font-mono font-bold text-right ${tx.amount < 0 ? 'text-error' : 'text-success'}`}>
                                  {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 4. Edit Food Item Modal Popup */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setEditingItem(null)}>
          <div 
            className="bg-surface border border-border w-full max-w-md max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted">Inventory Management</span>
                <span className="text-sm font-bold text-foreground mt-0.5">Edit Menu Item</span>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-[11px] text-text-muted hover:text-foreground font-bold transition-colors cursor-pointer"
              >
                                <X size={14} weight="bold" /> Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chili Fries"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30"
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="250"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30 font-mono"
                  />
                </div>

                {/* Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-border-focus bg-surface-header"
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
                      className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30 mt-1.5 animate-slide-in"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Description</label>
                  <textarea
                    placeholder="Ingredients, preparation details... (optional)"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30 resize-none"
                  />
                </div>

                {/* Prep Time */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-text-muted font-bold">Prep Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g. 5 mins (optional)"
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(e.target.value)}
                    className="minimal-input px-3.5 py-2.5 text-xs text-white placeholder-text-muted/30"
                  />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-text-muted font-bold">Item Flags</label>
                  <div className="flex flex-col gap-2 bg-surface-container/30 p-3 border border-border rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-text-muted">
                      <input
                        type="checkbox"
                        checked={editTags.spicy}
                        onChange={(e) => setEditTags(prev => ({ ...prev, spicy: e.target.checked }))}
                        className="accent-primary cursor-pointer"
                      />
                      <Fire size={14} weight="duotone" className="text-orange-400" />
                      <span>Spicy Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-text-muted">
                      <input
                        type="checkbox"
                        checked={editTags.veg}
                        onChange={(e) => setEditTags(prev => ({ ...prev, veg: e.target.checked }))}
                        className="accent-success cursor-pointer"
                      />
                      <Leaf size={14} weight="duotone" className="text-green-400" />
                      <span>Vegetarian Item</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-text-muted">
                      <input
                        type="checkbox"
                        checked={editTags.popular}
                        onChange={(e) => setEditTags(prev => ({ ...prev, popular: e.target.checked }))}
                        className="accent-primary cursor-pointer"
                      />
                      <Star size={14} weight="duotone" className="text-yellow-400" />
                      <span>Best Seller / Popular</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-surface-header/80 px-5 py-3.5 border-t border-border flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="minimal-btn-secondary px-4 py-2.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="minimal-btn-primary px-5 py-2.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all text-white"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Transaction History Ledger Modal popup */}
      {historyToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setHistoryToken(null)}>
          <div 
            className="bg-surface border border-border w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted">Student Card Ledger</span>
                <span className="text-sm font-bold text-foreground mt-0.5">Recharge History: {historyToken.name} (Card #{historyToken.cardNo})</span>
              </div>
              <button 
                onClick={() => setHistoryToken(null)}
                className="text-[11px] text-text-muted hover:text-foreground font-bold transition-colors cursor-pointer"
              >
                                <X size={14} weight="bold" /> Close
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
              {/* Card Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-surface-container/40 border border-border p-3 rounded-lg">
                  <span className="text-[10px] text-text-muted font-bold block">Remaining Balance</span>
                  <span className="text-xs font-bold text-primary font-mono block mt-1">{historyToken.tokens} tokens</span>
                </div>
                <div className="bg-surface-container/40 border border-border p-3 rounded-lg">
                  <span className="text-[10px] text-text-muted font-bold block">Equivalent Value</span>
                  <span className="text-xs font-bold text-[#71d384] font-mono block mt-1">₹{(historyToken.tokens * 30).toFixed(2)}</span>
                </div>
                <div className="bg-surface-container/40 border border-border p-3 rounded-lg">
                  <span className="text-[10px] text-text-muted font-bold block">Total Recharges</span>
                  <span className="text-xs font-bold text-foreground font-mono block mt-1">
                    {tokenTransactions.filter(tx => tx.studentId === historyToken.id).length}
                  </span>
                </div>
                <div className="bg-surface-container/40 border border-border p-3 rounded-lg">
                  <span className="text-[10px] text-text-muted font-bold block">Total Recharge Value</span>
                  <span className="text-xs font-bold text-[#71d384] font-mono block mt-1">
                    ₹{tokenTransactions
                      .filter(tx => tx.studentId === historyToken.id)
                      .reduce((sum, tx) => sum + tx.amount, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Recharges List Table */}
              <div className="border border-border rounded-lg overflow-hidden mt-2">
                {tokenTransactions.filter(tx => tx.studentId === historyToken.id).length === 0 ? (
                  <div className="p-8 text-center text-text-muted italic bg-surface-container/10 font-bold text-xs">
                    No recharge records found for this card
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border bg-surface-header/60 text-text-muted">
                          <th className="p-2.5 font-bold">Transaction ID</th>
                          <th className="p-2.5 font-bold">Date & Time</th>
                          <th className="p-2.5 font-bold">Tokens</th>
                          <th className="p-2.5 font-bold">Amount</th>
                          <th className="p-2.5 font-bold">Operator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-surface-container/10">
                        {tokenTransactions
                          .filter(tx => tx.studentId === historyToken.id)
                          .map((tx) => (
                            <tr key={tx.id} className="hover:bg-surface-container/20 transition-colors">
                              <td className="p-2.5 font-bold text-foreground font-mono">{tx.id}</td>
                              <td className="p-2.5 text-text-muted font-medium">
                                {new Date(tx.createdAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className={`p-2.5 font-mono font-bold ${tx.tokens < 0 ? 'text-error' : 'text-primary'}`}>
                                {tx.tokens > 0 ? '+' : ''}{tx.tokens} tokens
                              </td>
                              <td className={`p-2.5 font-mono font-bold ${tx.amount < 0 ? 'text-error' : 'text-success'}`}>
                                {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-foreground font-semibold">{tx.soldBy}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-header/80 px-5 py-3.5 border-t border-border flex justify-end shrink-0">
              <button 
                onClick={() => setHistoryToken(null)}
                className="minimal-btn-secondary px-4 py-2.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
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
