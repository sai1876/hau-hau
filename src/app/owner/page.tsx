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
  PresentationChart,
  BookOpen,
} from '@phosphor-icons/react';
import { InfoTag } from '@/components/InfoTag';
import { DocsWorkspace } from '@/components/DocsWorkspace';

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
    updateSettings,
    usingFirebase,
    syncDataToCloud
  } = useApp();

  // Navigation Tabs for Command Center
  const [activeWorkspace, setActiveWorkspace] = useState<'overview' | 'orders' | 'menu' | 'staff' | 'tokens' | 'audit' | 'settings' | 'profile' | 'docs'>('overview');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'all' | 'cash' | 'online' | 'tokens'>('all');
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [activeOrderTab, setActiveOrderTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingToken, setEditingToken] = useState<TokenAccount | null>(null);
  const [historyToken, setHistoryToken] = useState<TokenAccount | null>(null);
  const [selectedStaffDetail, setSelectedStaffDetail] = useState<StaffAccount | null>(null);
  const [editingLimitValue, setEditingLimitValue] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Settings form states
  const [outletName, setOutletName] = useState('');
  const [tokenValueInRupees, setTokenValueInRupees] = useState('');
  const [manualUpiEnabled, setManualUpiEnabled] = useState(true);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [currency, setCurrency] = useState('INR');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [monthlyTokenLimitDefaults, setMonthlyTokenLimitDefaults] = useState('');
  const [grokApiKey, setGrokApiKey] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGrokApiKey(localStorage.getItem('hau_hau_grok_api_key') || '');
    }
  }, []);

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

  // AI Feature States & Operations
  const [forecastData, setForecastData] = useState<any>(null);
  const [isForecasting, setIsForecasting] = useState(false);
  const [menuPricingData, setMenuPricingData] = useState<any>(null);
  const [isAnalyzingMenu, setIsAnalyzingMenu] = useState(false);

  const handleGenerateForecast = async () => {
    setIsForecasting(true);
    try {
      const summaryData = orders.slice(0, 80).map(o => ({
        date: o.createdAt?.split('T')[0],
        total: o.total,
        itemsCount: o.items.reduce((s, i) => s + i.quantity, 0),
        paymentMode: o.paymentMode,
      }));

      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-grok-api-key': grokApiKey,
        },
        body: JSON.stringify({
          action: 'forecast',
          data: summaryData,
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch forecast');
      const data = await res.json();
      setForecastData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsForecasting(false);
    }
  };

  const handleAnalyzeMenu = async () => {
    setIsAnalyzingMenu(true);
    try {
      const salesCount: Record<string, number> = {};
      orders.forEach(o => {
        if (o.orderStatus !== 'cancelled') {
          o.items.forEach(i => {
            salesCount[i.menuItemId] = (salesCount[i.menuItemId] || 0) + i.quantity;
          });
        }
      });

      const menuSummary = menu.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        price: m.price,
        salesCount: salesCount[m.id] || 0,
      }));

      const res = await fetch('/api/grok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-grok-api-key': grokApiKey,
        },
        body: JSON.stringify({
          action: 'menu-pricing',
          data: menuSummary,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze menu');
      const data = await res.json();
      setMenuPricingData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingMenu(false);
    }
  };

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
    .reduce((sum, o) => {
      const tokenValue = settings?.tokenValueInRupees || 30;
      const val = o.tokensDeducted !== undefined ? (o.tokensDeducted * tokenValue) : o.total;
      return sum + val;
    }, 0);

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
      <div className="minimal-card p-5.5 rounded-xl flex flex-col gap-4 relative bg-surface border border-border">
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none" />

        <div className="flex justify-between items-center relative z-10">
          <span className="text-xs font-bold text-foreground flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Revenue Breakdown
            <InfoTag text="Daily sales pool totals. Note: Token revenue represents physical token values received (tokens * conversion rate)." position="bottom" />
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
    <div className="flex-1 flex flex-col bg-background min-h-screen">
      {/* Demo Banner */}
      {(currentUser?.username === 'owner-demo' || currentUser?.username === 'staff-demo') && (
        <div className="bg-gradient-to-r from-red-700 via-rose-600 to-red-700 text-white text-center py-2 px-4 text-[10px] sm:text-xs font-bold tracking-wider uppercase border-b border-red-800 shadow-md relative z-50 flex items-center justify-center gap-2 shrink-0 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
          <span>This is a demo fake page. Access to original accounts cannot be provided for college verification.</span>
        </div>
      )}
      
      <div className="flex-1 flex flex-col md:flex-row">
      
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
        {(['overview', 'orders', 'menu', 'staff', 'tokens', 'audit', 'settings', 'docs', 'profile'] as const).map((space) => {
          const isSelected = activeWorkspace === space;
          const mobileIcons: Record<string, React.ReactNode> = {
            overview: <SquaresFour  size={15} weight="duotone" />,
            orders:   <ClipboardText size={15} weight="duotone" />,
            menu:     <ForkKnife    size={15} weight="duotone" />,
            staff:    <Users        size={15} weight="duotone" />,
            tokens:   <CreditCard   size={15} weight="duotone" />,
            audit:    <ShieldCheckered size={15} weight="duotone" />,
            settings: <Gear          size={15} weight="duotone" />,
            docs:     <BookOpen      size={15} weight="duotone" />,
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
            docs: 'Help',
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
        <aside className="group absolute top-0 left-0 h-full w-[72px] hover:w-64 sidebar-container bg-surface-header border-r border-border flex flex-col justify-between py-6 px-3.5 overflow-hidden hover:shadow-[8px_0_24px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col gap-6 overflow-hidden flex-1">
            <div className="flex items-center justify-start pl-1.5 shrink-0">
              <div className="w-8 h-8 shrink-0 bg-surface border border-border rounded-md flex items-center justify-center text-foreground font-bold text-sm">
                HH
              </div>
              <div className="sidebar-label flex flex-col">
                <h1 className="font-bold text-sm text-foreground leading-tight">Hau Hau</h1>
                <span className="text-xs text-text-muted font-medium block mt-0.5">Control Center</span>
              </div>
            </div>
            
            <hr className="border-border shrink-0" />
            
            <nav className="flex flex-col gap-1.5 overflow-y-auto flex-1 pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {(['overview', 'orders', 'menu', 'staff', 'tokens', 'audit', 'settings', 'docs', 'profile'] as const).map((space) => {
                const isSelected = activeWorkspace === space;
                const sidebarLabels: Record<string, { icon: React.ReactNode; text: string }> = {
                  overview: { icon: <SquaresFour  size={17} weight="duotone" />, text: 'Overview' },
                  orders:   { icon: <ClipboardText size={17} weight="duotone" />, text: 'Orders' },
                  menu:     { icon: <ForkKnife    size={17} weight="duotone" />, text: 'Menu' },
                  staff:    { icon: <Users        size={17} weight="duotone" />, text: 'Staff' },
                  tokens:   { icon: <CreditCard   size={17} weight="duotone" />, text: 'Token Cards' },
                  audit:    { icon: <ShieldCheckered size={17} weight="duotone" />, text: 'Audit Logs' },
                  settings: { icon: <Gear          size={17} weight="duotone" />, text: 'Outlet Settings' },
                  docs:     { icon: <BookOpen      size={17} weight="duotone" />, text: 'Help & Docs' },
                  profile:  { icon: <UserCircle   size={17} weight="duotone" />, text: 'My Profile' },
                };
                return (
                  <button
                    key={space}
                    onClick={() => setActiveWorkspace(space)}
                    className={`w-full h-10 rounded-lg text-xs font-semibold cursor-pointer flex items-center justify-start px-3 transition-all duration-350 ${
                      isSelected
                        ? 'bg-primary text-white font-bold shadow-[0_4px_12px_rgba(224,123,57,0.15)]'
                        : 'text-text-muted hover:text-foreground hover:bg-surface-container/50'
                    }`}
                  >
                    <span className="shrink-0 w-5 flex items-center justify-center">{sidebarLabels[space].icon}</span>
                    <span className="sidebar-label">
                      {sidebarLabels[space].text}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          <div className="flex flex-col gap-4 mt-6 shrink-0">
            <hr className="border-border" />
            <div className="flex items-center justify-start pl-1.5">
              <div className="w-8 h-8 shrink-0 rounded-full bg-surface-container border border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                {currentUser?.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) || 'S'}
              </div>
              <div className="sidebar-label flex flex-col">
                <span className="text-xs font-bold text-foreground">{currentUser?.name || 'Sarah'}</span>
                <span className="text-[9px] text-text-muted">Restaurant Owner</span>
              </div>
            </div>
            <button
              onClick={logout}
              className="minimal-btn-secondary w-full h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all flex items-center justify-start px-3"
            >
              <span className="shrink-0 w-5 flex items-center justify-center"><SignOut size={17} weight="duotone" /></span>
              <span className="sidebar-label">
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
              {activeWorkspace === 'tokens' ? 'Token Cards' : activeWorkspace === 'profile' ? 'Profile & Settings' : activeWorkspace === 'docs' ? 'Help & Documentation' : activeWorkspace}
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
              {activeWorkspace === 'orders' && (
                <button
                  type="button"
                  onClick={() => setIsRevenueModalOpen(true)}
                  className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <PresentationChart size={15} weight="duotone" />
                  Revenue Breakdown
                </button>
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

              {/* AI COMMAND: SALES FORECASTING */}
              <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col gap-5 relative overflow-hidden mt-2">
                <div className="absolute right-0 top-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                      <PresentationChart size={20} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        AI Sales & Demand Forecasting
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase">Grok Powered</span>
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">Analyze historical campus sales and generate predictive staffing/prep insights</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateForecast}
                    disabled={isForecasting}
                    className="minimal-btn-primary px-4 py-2 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start sm:self-center"
                  >
                    {isForecasting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Generate Forecast"
                    )}
                  </button>
                </div>

                {!forecastData && !isForecasting && (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <PresentationChart size={40} weight="thin" className="text-text-muted/40 mb-3" />
                    <span className="text-xs font-bold text-text-muted">No forecast generated yet</span>
                    <p className="text-[11px] text-text-muted mt-1 max-w-[280px]">Click the button above to run real-time machine learning predictions on your outlet logs.</p>
                  </div>
                )}

                {isForecasting && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3 animate-pulse">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-primary font-bold">Consulting Grok AI Engine...</span>
                    <p className="text-[10px] text-text-muted max-w-[220px]">Compressing transaction histories and evaluating day-wise ordering patterns.</p>
                  </div>
                )}

                {forecastData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in">
                    {/* Left Column: Forecast chart */}
                    <div className="flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">7-Day Projected Sales (INR)</h4>
                      <div className="flex flex-col gap-3.5 bg-surface-container/20 border border-border p-4 rounded-xl">
                        {forecastData.revenueForecast?.map((item: any) => {
                          const dateObj = new Date(item.date);
                          const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                          const maxVal = Math.max(...forecastData.revenueForecast.map((x: any) => x.forecastedRevenue));
                          const percentWidth = maxVal > 0 ? (item.forecastedRevenue / maxVal) * 100 : 0;
                          return (
                            <div key={item.date} className="flex flex-col gap-1">
                              <div className="flex justify-between text-xs font-semibold">
                                <span className="text-foreground">{dayLabel}</span>
                                <span className="font-mono text-foreground">₹{item.forecastedRevenue.toFixed(0)} <span className="text-[10px] text-text-muted font-normal">({item.confidence}% confidence)</span></span>
                              </div>
                              <div className="w-full h-2 bg-surface border border-border rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500" 
                                  style={{ width: `${percentWidth}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Dynamic insights & recommendations */}
                    <div className="flex flex-col gap-5">
                      {/* Peak Busy Periods */}
                      <div className="flex flex-col gap-2">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Projected Peak Intervals</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {forecastData.peakHours?.map((hour: any, idx: number) => (
                            <div key={idx} className="p-3 bg-warning/5 border border-warning/20 rounded-xl flex flex-col gap-1 text-xs">
                              <span className="font-bold text-warning-text flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                                {hour.timeOfDay}
                              </span>
                              <p className="text-[11px] text-text-muted leading-relaxed mt-0.5">{hour.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Staff & Prep suggestions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4.5 border-t border-border pt-4">
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-success" />
                            Staff Scheduling Tips
                          </h4>
                          <ul className="flex flex-col gap-2 text-[11px] text-text-muted list-disc pl-4 leading-relaxed font-semibold">
                            {forecastData.staffingSuggestions?.map((tip: string, idx: number) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            Kitchen Prep Targets
                          </h4>
                          <ul className="flex flex-col gap-2 text-[11px] text-text-muted list-disc pl-4 leading-relaxed font-semibold">
                            {forecastData.prepRecommendations?.map((rec: string, idx: number) => (
                              <li key={idx}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* B. ORDERS WORKSPACE */}
          {activeWorkspace === 'orders' && (
            <div className="flex flex-col gap-6">
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
                            <th className="p-3.5 font-semibold">
                              <span className="flex items-center gap-1">
                                Status
                                <InfoTag text="Pending: order in preparation. Completed: finalized order. Cancelled: refunded order (cannot be completed again)." position="bottom" />
                              </span>
                            </th>
                            <th className="p-3.5 pr-5 font-semibold text-right">
                              <span className="flex items-center justify-end gap-1">
                                Actions
                                <InfoTag text="Complete: finalize order. Cancel: cancel order and refund tokens/credit. Revert: change a completed order back to pending (allowed within 1 hour)." position="bottom-right" />
                              </span>
                            </th>
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
                                    <td className="p-3.5 pr-5 text-right" onClick={(e) => e.stopPropagation()}>
                                      <div className="flex justify-end gap-1.5">
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

                                        {order.orderStatus === 'completed' && (() => {
                                           const completedTime = (order.completedAt ? new Date(order.completedAt) : new Date(order.createdAt)).getTime();
                                           const now = new Date().getTime();
                                           const diffHours = (now - completedTime) / (1000 * 60 * 60);
                                           const isRevertable = diffHours <= 1;

                                           if (!isRevertable) return null;

                                           return (
                                             <button
                                               onClick={() => handleStatusChange(order.id, 'pending')}
                                               className="border border-primary/20 hover:bg-primary/5 text-primary px-3 py-1.5 h-9 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
                                               title="Revert to Pending"
                                             >
                                               Revert
                                             </button>
                                           );
                                         })()}
                                      </div>
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
                          <td className="p-3.5 pr-5 text-right">
                            <div className="flex justify-end gap-1.5">
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
                            </div>
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

              {/* AI COMMAND: MENU OPTIMIZATION */}
              <div className="w-full minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col gap-5 relative overflow-hidden mt-6 animate-slide-in">
                <div className="absolute right-0 top-0 w-36 h-36 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                      <BookOpen size={20} weight="duotone" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        AI Menu Engineering & Pricing Advisor
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold uppercase">Grok Analysis</span>
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">Categorize your menu items and get suggestions on dynamic pricing / combo promotions</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeMenu}
                    disabled={isAnalyzingMenu}
                    className="minimal-btn-primary px-4 py-2 text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-2 self-start sm:self-center"
                  >
                    {isAnalyzingMenu ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Run Menu Analysis"
                    )}
                  </button>
                </div>

                {!menuPricingData && !isAnalyzingMenu && (
                  <div className="py-8 flex flex-col items-center justify-center text-center">
                    <BookOpen size={40} weight="thin" className="text-text-muted/40 mb-3" />
                    <span className="text-xs font-bold text-text-muted">No menu analysis available</span>
                    <p className="text-[11px] text-text-muted mt-1 max-w-[280px]">Run a menu BCG engineering analysis to optimize your prices and item promotions.</p>
                  </div>
                )}

                {isAnalyzingMenu && (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3 animate-pulse">
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-primary font-bold">Classifying menu with BCG Matrix...</span>
                    <p className="text-[10px] text-text-muted max-w-[220px]">Calculating item transaction volume relative to catalog price distributions.</p>
                  </div>
                )}

                {menuPricingData && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
                    {/* Item BCG Classification (2 cols) */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Menu BCG Classification</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {menuPricingData.categorization?.map((item: any) => {
                          const originalItem = menu.find(m => m.id === item.itemId);
                          const itemName = originalItem ? originalItem.name : "Unknown Item";
                          
                          let badgeBg = "bg-primary/10 text-primary border-primary/20";
                          if (item.class === "Star") badgeBg = "bg-success/15 text-[#71d384] border-[#2e7d32]/25";
                          if (item.class === "Plowhorse") badgeBg = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                          if (item.class === "Dog") badgeBg = "bg-error/10 text-error border-error/20";

                          return (
                            <div key={item.itemId} className="p-3.5 bg-surface-container/20 border border-border rounded-xl flex flex-col gap-1.5">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-foreground line-clamp-1">{itemName}</span>
                                <span className={`text-[9px] font-bold px-2 py-0.5 border rounded uppercase shrink-0 ${badgeBg}`}>
                                  {item.class}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-muted leading-relaxed font-semibold mt-0.5">{item.explanation}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Combos list */}
                      <div className="flex flex-col gap-3 mt-4 border-t border-border pt-4">
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Recommended Combos & Bundles</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {menuPricingData.combos?.map((combo: any, idx: number) => (
                            <div key={idx} className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl flex flex-col justify-between gap-2.5">
                              <div className="flex flex-col gap-1">
                                <div className="flex justify-between items-start gap-1">
                                  <span className="font-bold text-xs text-foreground">{combo.title}</span>
                                  <span className="font-bold text-primary text-xs font-mono shrink-0">₹{combo.price}</span>
                                </div>
                                <span className="text-[10px] text-text-muted font-bold block mt-1">Includes: {combo.items?.join(', ')}</span>
                              </div>
                              <p className="text-[10px] text-text-muted leading-relaxed font-semibold">{combo.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Pricing suggestions (1 col) */}
                    <div className="lg:col-span-1 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Pricing Suggestions</h4>
                      <div className="flex flex-col gap-3.5">
                        {menuPricingData.pricingSuggestions?.map((sug: any) => {
                          const orig = menu.find(m => m.id === sug.itemId);
                          const name = orig ? orig.name : sug.name || "Unknown Item";
                          const curPrice = orig ? orig.price : sug.currentPrice;

                          return (
                            <div key={sug.itemId} className="p-3.5 bg-surface-container/20 border border-border rounded-xl flex flex-col gap-2">
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-bold text-xs text-foreground line-clamp-1">{name}</span>
                                <div className="flex items-center gap-1.5 shrink-0 text-xs font-mono font-bold">
                                  <span className="text-text-muted line-through">₹{curPrice}</span>
                                  <span className="text-success">₹{sug.suggestedPrice}</span>
                                </div>
                              </div>
                              <p className="text-[10px] text-text-muted leading-relaxed font-semibold">{sug.rationale}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeWorkspace === 'staff' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-in">
              {/* Staff List */}
              <div className="lg:col-span-2 min-w-0">
                <StaffList />
              </div>

              {/* Create Staff Form */}
              <div className="lg:col-span-1 min-w-0">
                <StaffAccountForm />
              </div>
            </div>
          )}

          {/* E. TOKEN CARDS WORKSPACE */}
          {activeWorkspace === 'tokens' && (
            <div className="flex flex-col gap-6 animate-slide-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Token Cards List */}
                <div className="lg:col-span-2 min-w-0">
                  <TokenList onStartEdit={setEditingToken} onViewHistory={setHistoryToken} />
                </div>

                {/* Create/Edit Token Card Form */}
                <div className="lg:col-span-1 min-w-0">
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
                        const staffRecharges = staffTxs.filter(tx => tx.type === 'recharge');
                        const currentMonthTxs = staffRecharges.filter(tx => {
                          const d = new Date(tx.createdAt);
                          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                        });
                        const tokensSoldThisMonth = currentMonthTxs.reduce((sum, tx) => sum + tx.tokens, 0);
                        const tokensSoldAllTime = staffRecharges.reduce((sum, tx) => sum + tx.tokens, 0);
                        const amountCollected = staffRecharges.reduce((sum, tx) => sum + tx.amount, 0);
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
                            <th className="p-3.5 border-none">
                              <span className="flex items-center gap-1">
                                Details / Changes
                                <InfoTag text="Immutable changelog showing recharged tokens, deducted order tokens, cancelled order reversals, or manual balance corrections." position="bottom" />
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredLogs.map(log => {
                            const getActionDisplay = (action: string) => {
                              const mapping: Record<string, string> = {
                                staffCreated: 'Staff Registered',
                                staffDeactivated: 'Staff Deactivated',
                                staffRemoved: 'Staff Removed',
                                orderCreated: 'Order Placed',
                                orderCompleted: 'Order Completed',
                                orderCancelled: 'Order Cancelled',
                                menuItemCreated: 'Menu Item Created',
                                menuItemUpdated: 'Menu Item Updated',
                                menuItemDeleted: 'Menu Item Deleted',
                                tokenRecharged: 'Token Recharged',
                                tokenDeducted: 'Token Deducted',
                                tokenRefunded: 'Token Refunded',
                                tokenAdjusted: 'Token Adjusted',
                                monthlyLimitChanged: 'Limit Changed',
                                settingsUpdated: 'Settings Updated',
                              };
                              return mapping[action] || action;
                            };

                            const formatTableNumber = (tableNum: any) => {
                              if (!tableNum) return 'N/A';
                              const str = String(tableNum);
                              if (str.toLowerCase() === 'self') return 'Self-Service';
                              if (str.toLowerCase().startsWith('table')) {
                                return str;
                              }
                              return `Table ${str}`;
                            };

                            let actionLabel = getActionDisplay(log.action).toUpperCase();
                            let actionColor = 'text-foreground bg-surface-container border border-border';
                            
                            switch (log.action) {
                              case 'orderCompleted':
                              case 'orderCreated':
                                actionColor = 'text-success bg-success/10 border border-success/20';
                                break;
                              case 'staffCreated':
                              case 'menuItemCreated':
                                actionColor = 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
                                break;
                              case 'tokenRefunded':
                                actionColor = 'text-teal-400 bg-teal-500/10 border border-teal-500/20';
                                break;
                              case 'orderCancelled':
                              case 'staffDeactivated':
                                actionColor = 'text-error bg-error/10 border border-error/20';
                                break;
                              case 'staffRemoved':
                              case 'menuItemDeleted':
                                actionColor = 'text-red-400 bg-red-500/10 border border-red-500/20';
                                break;
                              case 'tokenRecharged':
                                actionColor = 'text-primary bg-primary/10 border border-primary/20';
                                break;
                              case 'tokenDeducted':
                                actionColor = 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
                                break;
                              case 'tokenAdjusted':
                                actionColor = 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
                                break;
                              case 'monthlyLimitChanged':
                                actionColor = 'text-purple-400 bg-purple-500/10 border border-purple-500/20';
                                break;
                              case 'menuItemUpdated':
                                actionColor = 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20';
                                break;
                              case 'settingsUpdated':
                                actionColor = 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20';
                                break;
                            }

                            let details = '';
                            if (log.action === 'tokenRecharged' && log.before != null && log.after != null) {
                              const recharged = Math.round(log.after.tokens - log.before.tokens);
                              details = `Recharged +${recharged} tokens (Balance: ${log.before.tokens} → ${log.after.tokens})`;
                            } else if (log.action === 'tokenRecharged' && log.after) {
                              details = `Recharged +${log.after.tokens} tokens`;
                            } else if (log.action === 'tokenDeducted' && log.before != null && log.after != null) {
                              const deducted = Math.round(log.before.tokens - log.after.tokens);
                              details = `Deducted ${deducted} tokens for Order #${log.after.orderId || log.before.orderId}`;
                            } else if (log.action === 'tokenRefunded' && log.before != null && log.after != null) {
                              const refunded = Math.round(log.after.tokens - log.before.tokens);
                              details = `Refunded +${refunded} tokens for Cancelled Order #${log.after.orderId || log.before.orderId}`;
                            } else if (log.action === 'tokenAdjusted' && log.before && log.after) {
                              const tokensBefore = log.before.tokens;
                              const tokensAfter = log.after.tokens;
                              const creditBefore = log.before.balanceRupees || 0;
                              const creditAfter = log.after.balanceRupees || 0;
                              details = `Manual balance correction: ${tokensBefore} → ${tokensAfter} tokens, ₹${creditBefore} → ₹${creditAfter} credit${log.after.reason ? ` (${log.after.reason})` : ''}`;
                            } else if (log.action === 'orderCreated' && log.after) {
                              details = `Placed order for ${formatTableNumber(log.after.tableNumber)} · ₹${log.after.total} via ${log.after.paymentMode || 'cash'}`;
                            } else if (log.action === 'orderCompleted' && log.before) {
                              details = `Order completed successfully`;
                            } else if (log.action === 'orderCancelled' && log.before) {
                              details = `Order cancelled (previous status: ${log.before.orderStatus})`;
                            } else if (log.action === 'staffCreated' && log.after) {
                              details = `Registered new staff account: @${log.after.username || ''} (${log.after.name || ''})`;
                            } else if (log.action === 'staffDeactivated' && log.before) {
                              details = `Deactivated staff account: @${log.before.username || ''} (${log.before.name || ''})`;
                            } else if (log.action === 'staffRemoved') {
                              details = `Staff account permanently removed`;
                            } else if (log.action === 'menuItemCreated' && log.after) {
                              details = `Added "${log.after.name}" at ₹${log.after.price}`;
                            } else if (log.action === 'menuItemUpdated' && log.before && log.after) {
                              const changes: string[] = [];
                              if (log.after.name && log.after.name !== log.before.name) changes.push(`Name: ${log.before.name} → ${log.after.name}`);
                              if (log.after.price !== undefined && log.after.price !== log.before.price) changes.push(`Price: ₹${log.before.price} → ₹${log.after.price}`);
                              if (log.after.available !== undefined && log.after.available !== log.before.available) changes.push(`${log.after.available ? 'Set available' : 'Set unavailable'}`);
                              if (log.after.category && log.after.category !== log.before.category) changes.push(`Category: ${log.before.category} → ${log.after.category}`);
                              details = changes.length > 0 ? changes.join(' · ') : 'Menu item updated';
                            } else if (log.action === 'menuItemDeleted') {
                              details = `Menu item removed`;
                            } else if (log.action === 'monthlyLimitChanged' && log.before && log.after) {
                              details = `Monthly token limit: ${log.before.monthlyTokenLimit} → ${log.after.monthlyTokenLimit} tokens`;
                            } else if (log.action === 'settingsUpdated') {
                              details = `Outlet properties or conversion rates modified`;
                            } else {
                              details = 'N/A';
                            }

                            const getActorName = () => {
                              if (log.actorUid === 'local') return 'Local System';
                              const found = staffList.find(s => s.id === log.actorUid);
                              if (found) return found.name;
                              if (currentUser && (currentUser.id === log.actorUid || currentUser.uid === log.actorUid)) {
                                return currentUser.name;
                              }
                              return log.actorRole === 'owner' ? 'Owner' : 'Staff Member';
                            };
                            
                            const getActorRoleLabel = () => {
                              if (log.actorUid === 'local') return 'system';
                              const found = staffList.find(s => s.id === log.actorUid);
                              if (found) return found.role || 'staff';
                              if (currentUser && (currentUser.id === log.actorUid || currentUser.uid === log.actorUid)) {
                                return currentUser.role;
                              }
                              return log.actorRole || 'staff';
                            };

                            const actorName = getActorName();
                            const actorRole = getActorRoleLabel();

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
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${actionColor}`}>
                                    {actionLabel}
                                  </span>
                                </td>
                                <td className="p-3.5 font-semibold text-foreground">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                                      {actorName}
                                      <span className={`text-[9px] px-1.5 py-0.2 border rounded-sm font-bold uppercase ${
                                        actorRole === 'owner'
                                          ? 'bg-primary/10 border-primary/20 text-primary'
                                          : actorRole === 'system'
                                            ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                      }`}>
                                        {actorRole === 'owner' ? 'Owner' : actorRole === 'system' ? 'System' : 'Staff'}
                                      </span>
                                    </span>
                                    <span className="text-[9px] text-text-muted font-mono">{log.actorUid}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 font-mono text-text-muted">#{log.targetId}</td>
                                <td className="p-3.5 font-medium text-text-muted">{details}</td>
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

                <div className="minimal-card rounded-xl bg-surface border border-border p-4.5 text-xs shadow-sm flex flex-col gap-3">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Grok AI Configuration
                  </h4>
                  <p className="text-text-muted leading-relaxed">
                    Provide your xAI Grok API Key to enable demand forecasting, menu pricing recommendations, and real-time kitchen pacing.
                  </p>
                  <div className="flex flex-col gap-1.5 mt-1">
                    <label className="text-[10px] text-text-muted font-bold uppercase">Grok API Key</label>
                    <input
                      type="password"
                      placeholder="xai-..."
                      value={grokApiKey}
                      onChange={(e) => {
                        setGrokApiKey(e.target.value);
                        localStorage.setItem('hau_hau_grok_api_key', e.target.value);
                      }}
                      className="minimal-input px-3.5 py-2.5 text-xs text-white font-mono"
                    />
                    <span className="text-[10px] text-text-muted leading-relaxed">
                      For testing without an API key, leave blank or enter <code className="font-mono text-primary bg-primary/5 px-1 py-0.5 rounded">grok-mock</code> to run in Demo mode.
                    </span>
                  </div>
                </div>

                <div className="minimal-card rounded-xl bg-surface border border-border p-4.5 text-xs shadow-sm flex flex-col gap-3">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${usingFirebase ? 'bg-success animate-pulse' : 'bg-warning animate-pulse'}`} />
                    Database Sync & Mode
                  </h4>
                  <p className="text-text-muted leading-relaxed">
                    Hau-Hau POS operates in two modes: Cloud Sync (live Firebase) or Local Fallback (offline mode using LocalStorage).
                  </p>
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="flex justify-between items-center bg-[#1c1b1b]/50 border border-border p-2.5 rounded-lg">
                      <span className="text-text-muted">Connection Mode:</span>
                      <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 border rounded ${usingFirebase ? 'bg-success/15 text-[#71d384] border-[#2e7d32]/25' : 'bg-warning/10 text-warning border-warning/20'}`}>
                        {usingFirebase ? 'Firebase Active' : 'LocalStorage Fallback'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsSyncing(true);
                        await syncDataToCloud();
                        setIsSyncing(false);
                      }}
                      disabled={isSyncing}
                      className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-black uppercase tracking-wider py-2.5 rounded-lg text-[10px] transition-colors cursor-pointer w-full text-center"
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Local Data to Cloud'}
                    </button>
                    
                    <span className="text-[10px] text-text-muted leading-relaxed">
                      Click sync to force-check your connection and upload any offline orders, tokens, or audit logs stored in this browser to the live database.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* H. PROFILE WORKSPACE */}
          {activeWorkspace === 'profile' && (
            <ProfileSection />
          )}

          {/* I. HELP & DOCS WORKSPACE */}
          {activeWorkspace === 'docs' && (
            <DocsWorkspace />
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

      {/* Revenue Breakdown Modal popup */}
      {isRevenueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in" onClick={() => setIsRevenueModalOpen(false)}>
          <div 
            className="bg-surface border border-border w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-text-muted">Analytics Ledger</span>
                <span className="text-sm font-bold text-foreground mt-0.5">Revenue Breakdown</span>
              </div>
              <button 
                onClick={() => setIsRevenueModalOpen(false)}
                className="text-[11px] text-text-muted hover:text-foreground font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <X size={14} weight="bold" /> Close
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
              {renderDistributionChart()}
            </div>
            
            <div className="bg-surface-header/80 px-5 py-3.5 border-t border-border flex justify-end shrink-0">
              <button 
                onClick={() => setIsRevenueModalOpen(false)}
                className="minimal-btn-secondary px-4 py-2.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
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
        const staffRecharges = staffTxs.filter(tx => tx.type === 'recharge');
        const currentMonthTxs = staffRecharges.filter(tx => {
          const d = new Date(tx.createdAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const tokensSoldThisMonth = currentMonthTxs.reduce((sum, tx) => sum + tx.tokens, 0);
        const amountCollected = staffRecharges.reduce((sum, tx) => sum + tx.amount, 0);
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
                    <h4 className="text-xs font-bold text-foreground flex items-center">
                      Set Monthly Token Limit
                      <InfoTag text="Sets the maximum number of tokens this operator can sell or issue in a calendar month." position="top" />
                    </h4>
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
    </div>
  );
}
