'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import TableSelector from '@/components/TableSelector';
import MenuItemCard from '@/components/MenuItemCard';
import CartPanel from '@/components/CartPanel';
import StatusBadge from '@/components/StatusBadge';
import ProfileSection from '@/components/ProfileSection';
import TokenAccountForm from '@/components/TokenAccountForm';
import { TokenAccount } from '@/types';
import { TokenIcon } from '@/components/TokenIcon';
import { ForkKnife, CreditCard, ClipboardText, MagnifyingGlass, GearSix, BookOpen } from '@phosphor-icons/react';
import { Pagination } from '@/components/Pagination';
import { InfoTag } from '@/components/InfoTag';
import { DocsWorkspace } from '@/components/DocsWorkspace';

export default function StaffDashboardPage() {
  const router = useRouter();
  const { 
    currentUser, 
    logout, 
    menu, 
    orders, 
    activeTable, 
    tableCarts,
    tokens,
    tokenTransactions,
    staffList,
    sellTokens,
    settings
  } = useApp();

  const tokenValue = settings?.tokenValueInRupees || 30;

  const [activeWorkspace, setActiveWorkspace] = useState<'pos' | 'tokens' | 'history' | 'profile' | 'docs'>('pos');
  const [isIssuingNewCard, setIsIssuingNewCard] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyDateFilter, setHistoryDateFilter] = useState<'today' | 'all'>('today');
  const HISTORY_PER_PAGE = 8;

  // Token Hub states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<TokenAccount | null>(null);
  const [rechargeTokens, setRechargeTokens] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');

  // Dynamic category calculations
  const menuCategories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);
  const existingCategories = menuCategories.length > 0 ? menuCategories : ['Burgers', 'Sides', 'Drinks', 'Combo'];
  const categories = ['All', ...existingCategories];

  // Filter orders created by this staff — sorted newest first, supporting day-wise filtering
  const staffOrders = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return orders
      .filter(order => {
        if (order.staffId !== currentUser?.username) return false;
        if (historyDateFilter === 'today') {
          const orderDateStr = new Date(order.createdAt).toLocaleDateString('en-CA');
          return orderDateStr === todayStr;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, currentUser?.username, historyDateFilter]);

  // Filter shift sales summary (only for today to ensure fresh dashboard everyday)
  const shiftTransactions = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('en-CA');
    return tokenTransactions.filter(tx => {
      if (tx.soldBy !== currentUser?.username) return false;
      const txDateStr = new Date(tx.createdAt).toLocaleDateString('en-CA');
      return txDateStr === todayStr;
    });
  }, [tokenTransactions, currentUser?.username]);

  // Authenticate check
  useEffect(() => {
    const stored = localStorage.getItem('hau_hau_session');
    if (!stored && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'staff') {
    return (
      <div className="flex-1 flex items-center justify-center bg-background text-text-muted font-bold text-xs uppercase tracking-widest min-h-screen">
        Verifying Session...
      </div>
    );
  }

  // Filter menu items by category
  const filteredMenu = menu.filter(item => 
    activeCategory === 'All' ? true : item.category === activeCategory
  );

  const historyPageCount = Math.max(1, Math.ceil(staffOrders.length / HISTORY_PER_PAGE));
  const safeHistoryPage  = Math.min(historyPage, historyPageCount);
  const pagedHistory     = staffOrders.slice((safeHistoryPage - 1) * HISTORY_PER_PAGE, safeHistoryPage * HISTORY_PER_PAGE);

  // Mobile cart metadata
  const currentCart = activeTable ? tableCarts[activeTable] || [] : [];
  const cartItemsCount = currentCart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Token Hub handlers
  const handleStudentSearch = (queryVal: string) => {
    setStudentSearchQuery(queryVal);
  };

  const searchedStudents = studentSearchQuery
    ? tokens.filter(t => {
        const q = studentSearchQuery.toLowerCase();
        return t.name.toLowerCase().includes(q) || t.cardNo.toLowerCase().includes(q);
      })
    : [];

  const handleRechargeTokensChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    setRechargeTokens(cleanVal);
    const parsed = parseInt(cleanVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const rupees = parsed * tokenValue;
      setRechargeAmount(rupees.toString());
    } else {
      setRechargeAmount('');
    }
  };

  const handleRechargeAmountChange = (val: string) => {
    setRechargeAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const tokensVal = Math.floor(parsed / tokenValue);
      setRechargeTokens(tokensVal.toString());
    } else {
      setRechargeTokens('');
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !rechargeTokens || !rechargeAmount) return;

    const tkVal = parseInt(rechargeTokens, 10);
    const amtVal = parseFloat(rechargeAmount);

    if (isNaN(tkVal) || tkVal <= 0 || isNaN(amtVal) || amtVal <= 0) {
      alert('Please enter a valid positive token count.');
      return;
    }

    const success = await sellTokens(selectedStudent.id, tkVal, amtVal);
    if (success) {
      // Refresh the selected student object locally to show updated balance
      setSelectedStudent({
        ...selectedStudent,
        tokens: Math.round(selectedStudent.tokens + tkVal)
      });
      setRechargeTokens('');
      setRechargeAmount('');
    }
  };

  // Filter transactions for selected student
  const studentTransactions = selectedStudent
    ? tokenTransactions.filter(tx => tx.studentId === selectedStudent.id)
    : [];

  const shiftTokensSold = shiftTransactions.reduce((sum, tx) => sum + tx.tokens, 0);
  const shiftRupeesCollected = shiftTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Monthly purse calculation
  const staffProfile = staffList.find(s => s.username === currentUser.username);
  const monthlyLimit = staffProfile?.monthlyTokenLimit ?? 1000;
  const now = new Date();
  const currentMonthTxs = tokenTransactions.filter(tx => {
    if (tx.soldBy !== currentUser.username) return false;
    const d = new Date(tx.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTokensSold = currentMonthTxs.reduce((sum, tx) => sum + tx.tokens, 0);
  const monthlyRemaining = Math.max(0, monthlyLimit - monthTokensSold);
  const monthlyUsagePct = monthlyLimit > 0 ? Math.min(100, (monthTokensSold / monthlyLimit) * 100) : 0;
  const isPurseNearLimit = monthlyUsagePct >= 80;
  const isPurseOverLimit = monthlyUsagePct >= 100;

  return (
    <div className="flex-1 flex flex-col bg-background h-screen overflow-hidden pb-16 md:pb-0">
      
      {/* Header Bar */}
      <header className="bg-surface-header/90 backdrop-blur-md border-b border-border shrink-0 px-4 py-2.5 md:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-surface border border-border rounded-md flex items-center justify-center text-foreground font-bold text-sm shadow-xs">
              HH
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground leading-tight">Hau Hau</h1>
              <span className="text-xs text-text-muted font-medium block mt-0.5">Staff Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveWorkspace('profile')}
              className="text-right hidden sm:flex flex-col group cursor-pointer active:scale-95 transition-transform"
            >
              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-text-muted font-bold mt-0.5 flex items-center gap-1">
                Floor Staff <GearSix size={12} weight="duotone" className="inline text-text-muted/60 ml-0.5" />
              </span>
            </button>
            <button
              onClick={logout}
              className="minimal-btn-secondary px-4 py-1.5 h-10 min-h-0 text-xs font-bold rounded-lg cursor-pointer active:scale-95 transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
        
        {/* Workspace Nav Tabs */}
        <div className="flex border-b border-border shrink-0">
          {(['pos', 'tokens', 'history', 'docs'] as const).map((space) => {
            const isSelected = activeWorkspace === space;
            return (
              <button
                key={space}
                onClick={() => {
                  setActiveWorkspace(space as any);
                  // Reset states on toggle
                  setSelectedStudent(null);
                  setStudentSearchQuery('');
                  setIsIssuingNewCard(false);
                }}
                className={`px-6 py-3 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border-b-2 mb-[-2px] flex items-center gap-2 ${
                  isSelected
                    ? 'border-primary bg-surface/50 text-foreground font-bold'
                    : 'border-transparent text-text-muted hover:text-foreground hover:bg-surface/20'
                }`}
              >
                {space === 'pos' && <><ForkKnife size={16} weight="duotone" /><span>Order</span></>}
                {space === 'tokens' && <><CreditCard size={16} weight="duotone" /><span>Cards</span></>}
                {space === 'history' && <><ClipboardText size={16} weight="duotone" /><span>History</span></>}
                {space === 'docs' && <><BookOpen size={16} weight="duotone" /><span>Help & Docs</span></>}
              </button>
            );
          })}
        </div>

        {/* 1. POS TERMINAL WORKSPACE */}
        {activeWorkspace === 'pos' && (
          <div className="flex-1 flex flex-col gap-4 overflow-hidden animate-slide-in">
            {/* Table Selector (Top zone - dynamic height) */}
            <div className="shrink-0">
              <TableSelector />
            </div>

            {/* Bottom zone (fills remaining screen, split between menu and cart) */}
            <div className="flex-1 flex overflow-hidden gap-6 min-h-0">
              {/* Menu items column */}
              <div className="flex-1 flex flex-col overflow-hidden gap-3">
                {/* Categories & Filter Bar (shrink-0) */}
                <div className="shrink-0 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex gap-2.5 overflow-x-auto pb-1.5 flex-1">
                    {categories.map((cat) => {
                      const isSelected = activeCategory === cat;
                      const getCategoryLabel = (name: string) => {
                        const lower = name.toLowerCase();
                        if (lower === 'all') return 'All';
                        if (lower.includes('burger')) return 'Burgers';
                        if (lower.includes('snack') || lower.includes('side')) return 'Snacks';
                        if (lower.includes('drink') || lower.includes('beverage')) return 'Drinks';
                        if (lower.includes('combo')) return 'Combos';
                        return name;
                      };
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4.5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                            isSelected 
                              ? 'bg-primary border-transparent text-white shadow-[0_4px_12px_rgba(224,123,57,0.15)]'
                              : 'bg-surface border-border text-text-muted hover:text-foreground hover:border-text-muted/30'
                          }`}
                        >
                          {getCategoryLabel(cat)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Menu items list (internal scroll) */}
                <div className="flex-1 overflow-y-auto pr-1 pb-24 lg:pb-12">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMenu.map((item) => (
                      <MenuItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Cart Column (Desktop, always visible, full height) */}
              <div className="hidden lg:block w-80 xl:w-96 shrink-0 h-full overflow-hidden">
                <CartPanel />
              </div>
            </div>
          </div>
        )}

        {/* 2. TOKEN HUB WORKSPACE */}
        {activeWorkspace === 'tokens' && (
          <div className="flex-1 overflow-y-auto pr-1 pb-24 lg:pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-in">
              {/* Left Column: Search & Selected Student details (2/3 width) */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Monthly Quota Card */}
                <div className="minimal-card p-5 rounded-xl relative overflow-hidden bg-surface border border-border">
                  <div className="absolute -right-10 -top-10 w-28 h-28 bg-primary/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div>
                      <span className="text-xs text-foreground font-bold flex items-center">
                        Monthly Token Quota
                        <InfoTag text="Maximum number of tokens you can sell or issue to cards in the current calendar month. Set by the owner." position="top" />
                      </span>
                      <span className="text-xs text-text-muted mt-0.5 block">Token sales quota for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                      isPurseOverLimit ? 'bg-error/10 text-error border-error/20' : isPurseNearLimit ? 'bg-warning/10 text-warning border-warning/20' : 'bg-success/10 text-[#71d384] border-[#22c55e]/20'
                    }`}>
                      {isPurseOverLimit ? 'Limit Reached' : isPurseNearLimit ? 'Near Limit' : 'Available'}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
                    <div className="bg-surface-container/40 border border-border rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-xs text-text-muted font-bold">Remaining</span>
                      <span className={`text-2xl font-bold font-mono ${isPurseOverLimit ? 'text-error' : isPurseNearLimit ? 'text-warning' : 'text-primary'}`}>{monthlyRemaining.toFixed(0)}</span>
                      <span className="text-[10px] text-text-muted">tokens left</span>
                    </div>
                    <div className="bg-surface-container/40 border border-border rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-xs text-text-muted font-bold">Used</span>
                      <span className="text-2xl font-bold font-mono text-foreground">{monthTokensSold.toFixed(0)}</span>
                      <span className="text-[10px] text-text-muted">tokens sold</span>
                    </div>
                    <div className="bg-surface-container/40 border border-border rounded-xl p-3 flex flex-col gap-1">
                      <span className="text-xs text-text-muted font-bold">Monthly Cap</span>
                      <span className="text-2xl font-bold font-mono text-text-muted">{monthlyLimit}</span>
                      <span className="text-[10px] text-text-muted">token limit</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 relative z-10">
                    <div className="flex justify-between">
                      <span className="text-xs text-text-muted font-bold">Usage</span>
                      <span className={`text-xs font-mono font-bold ${isPurseOverLimit ? 'text-error' : isPurseNearLimit ? 'text-warning' : 'text-text-muted'}`}>{monthlyUsagePct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-border">
                      <div
                        style={{ width: `${monthlyUsagePct}%` }}
                        className={`h-full rounded-full transition-all duration-700 ${
                          isPurseOverLimit ? 'bg-error' : isPurseNearLimit ? 'bg-warning' : 'bg-primary'
                        }`}
                      />
                    </div>
                    {isPurseOverLimit && <p className="text-xs text-error font-semibold mt-1">&#9888; Monthly limit reached. Token sales are blocked until next month or the owner raises your limit.</p>}
                    {isPurseNearLimit && !isPurseOverLimit && <p className="text-xs text-warning font-semibold mt-1">&#9888; You are close to your monthly limit. Contact the owner to increase it if needed.</p>}
                  </div>
                </div>

                {/* Search Card Panel (Autocomplete) */}
                <div className="minimal-card p-5 rounded-xl flex flex-col gap-4 bg-surface border border-border relative z-30">
                  <h3 className="text-xs text-foreground font-bold flex items-center">
                    Search Card
                    <InfoTag text="Search student passes by name or Card ID to recharge their tokens or view card history." position="top" />
                  </h3>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name or 3-digit card number..."
                      value={studentSearchQuery}
                      onChange={(e) => handleStudentSearch(e.target.value)}
                      className="minimal-input pl-10 pr-4 py-3 text-xs text-white placeholder-text-muted/50 w-full font-semibold"
                    />
                    <MagnifyingGlass size={16} weight="duotone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    
                    {/* Autocomplete Results Dropdown */}
                    {studentSearchQuery && searchedStudents.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 border border-border rounded-lg bg-surface divide-y divide-border max-h-48 overflow-y-auto shadow-2xl animate-fade-in z-30">
                        {searchedStudents.map(student => (
                          <button
                            key={student.id}
                            type="button"
                            onClick={() => {
                              setSelectedStudent(student);
                              setStudentSearchQuery('');
                              setRechargeTokens('');
                              setRechargeAmount('');
                              setIsIssuingNewCard(false);
                            }}
                            className="w-full text-left px-4.5 py-3 hover:bg-surface-container/30 transition-colors flex justify-between items-center text-xs cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{student.name}</span>
                              <span className="text-[10px] font-mono text-text-muted font-bold bg-surface border border-border px-1.5 py-0.2 rounded">
                                #{student.cardNo}
                              </span>
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 font-bold text-[10px] font-mono flex items-center">
                                {student.tokens} <TokenIcon className="ml-1 w-3 h-3 text-blue-400" />
                              </span>
                              {student.balanceRupees ? (
                                <span className="text-[9px] font-mono text-success font-bold">
                                  +₹{student.balanceRupees.toFixed(2)} credit
                                </span>
                              ) : null}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {studentSearchQuery && searchedStudents.length === 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 border border-border rounded-lg bg-surface p-4 text-center text-xs text-text-muted font-medium z-30 shadow-2xl">
                        No matching cards found
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Student Details (Persistent if selected) */}
                {selectedStudent ? (
                  <div className="minimal-card rounded-xl overflow-hidden flex flex-col bg-surface border border-border">
                    <div className="bg-surface-header/80 px-5 py-4 border-b border-border flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-text-muted">Student Profile</span>
                        <span className="text-sm font-bold text-foreground mt-0.5">{selectedStudent.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-primary">Card #{selectedStudent.cardNo}</span>
                        <button
                          onClick={() => setSelectedStudent(null)}
                          className="text-[10px] text-text-muted hover:text-primary font-bold cursor-pointer transition-colors"
                        >
                          Clear Selection
                        </button>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col gap-6">
                      {/* Current Balance */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-surface-container/40 border border-border p-4 rounded-lg flex flex-col justify-center">
                          <span className="text-[9px] text-text-muted font-bold">Tokens Balance</span>
                          <span className="text-lg font-bold text-primary font-mono mt-1">
                            {selectedStudent.tokens} tokens
                          </span>
                        </div>
                        <div className="bg-surface-container/40 border border-border p-4 rounded-lg flex flex-col justify-center">
                          <span className="text-[9px] text-text-muted font-bold">Store Credit</span>
                          <span className="text-lg font-bold text-success font-mono mt-1">
                            ₹{(selectedStudent.balanceRupees || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="bg-surface-container/40 border border-border p-4 rounded-lg flex flex-col justify-center col-span-3 sm:col-span-1">
                          <span className="text-[9px] text-text-muted font-bold">Total Card Value</span>
                          <span className="text-lg font-bold text-[#71d384] font-mono mt-1">
                            ₹{((selectedStudent.tokens * tokenValue) + (selectedStudent.balanceRupees || 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Tokens Taken / Recharge History */}
                      <div className="flex flex-col gap-3">
                        <h4 className="text-[10px] font-bold text-foreground">
                          Recharge History
                        </h4>
                        
                        <div className="border border-border rounded-lg overflow-hidden">
                          {studentTransactions.length === 0 ? (
                            <div className="p-6 text-center text-text-muted italic font-semibold text-xs bg-surface-container/10">
                              No recharge history found for this card
                            </div>
                          ) : (
                            <div className="max-h-60 overflow-y-auto">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-border bg-surface-header/60 text-text-muted">
                                      <th className="p-2.5 font-bold">Date & Time</th>
                                      <th className="p-2.5 font-bold">Tokens</th>
                                      <th className="p-2.5 font-bold">Amount</th>
                                      <th className="p-2.5 font-bold">Operator</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border bg-surface-container/10">
                                    {studentTransactions.map((tx) => (
                                      <tr key={tx.id} className="hover:bg-surface-container/20 transition-colors">
                                        <td className="p-2.5 text-text-muted font-medium">
                                          {new Date(tx.createdAt).toLocaleString([], {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
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
                    </div>
                  </div>
                ) : (
                  <div className="minimal-card p-8 rounded-xl text-center opacity-75 flex flex-col items-center justify-center bg-surface border border-border">
                    <span className="text-foreground font-bold text-sm">No Card Selected</span>
                    <span className="text-xs text-text-muted mt-1 max-w-xs mx-auto">Search and select a card above to recharge or view recharge logs.</span>
                  </div>
                )}
              </div>

              {/* Right Column: Sell Tokens Form OR Option to Issue Card (1/3 width) */}
              <div className="flex flex-col gap-6">
                
                {selectedStudent ? (
                  /* Sell Tokens Form */
                  <div className="minimal-card rounded-xl overflow-hidden flex flex-col bg-surface border border-border">
                    <div className="bg-surface-header/80 px-4 py-3 border-b border-border">
                      <h3 className="text-xs font-bold text-foreground">
                        Sell Tokens (Recharge Card)
                      </h3>
                    </div>

                    <form onSubmit={handleSellSubmit} className="p-5 flex flex-col gap-4 text-xs">
                      {/* Bidirectional Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-muted font-bold">
                            Tokens to Add
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.01"
                              required
                              min="0.01"
                              placeholder="e.g. 10"
                              value={rechargeTokens}
                              onChange={(e) => handleRechargeTokensChange(e.target.value)}
                              className="minimal-input pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-text-muted/30 font-mono w-full"
                            />
                            <span className="absolute right-2.5 flex items-center select-none pointer-events-none">
                              <TokenIcon className="w-3.5 h-3.5 text-text-muted" />
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-text-muted font-bold">
                            Amount (₹)
                          </label>
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs text-text-muted font-bold pointer-events-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              required
                              min="0.3"
                              placeholder="e.g. 300"
                              value={rechargeAmount}
                              onChange={(e) => handleRechargeAmountChange(e.target.value)}
                              className="minimal-input pl-6 pr-3.5 py-2.5 text-xs text-white placeholder-text-muted/30 font-mono w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-text-muted font-semibold">
                        Exchange rate: 1 Token = ₹30.00. Updates card balance instantly.
                      </span>

                      <button
                        type="submit"
                        className="minimal-btn-primary w-full text-white font-bold py-2.5 rounded-lg transition-all active:scale-[0.98] text-xs h-11 flex items-center justify-center cursor-pointer mt-2"
                      >
                        Sell & Recharge Card
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Issue New Card Area */
                  <div className="flex flex-col gap-4">
                    {!isIssuingNewCard ? (
                      <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col items-center justify-center text-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-surface-container border border-border flex items-center justify-center">
                          <CreditCard size={20} weight="duotone" className="text-primary" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Need a new card?</h4>
                          <p className="text-[10px] text-text-muted mt-1">Register a student and issue a physical loyalty card pass.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsIssuingNewCard(true)}
                          className="minimal-btn-primary w-full font-bold text-xs h-10 mt-1 cursor-pointer flex items-center justify-center"
                        >
                          + Issue New Card
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <TokenAccountForm
                          editingToken={null}
                          onCancelEdit={() => setIsIssuingNewCard(false)}
                        />
                        <button
                          type="button"
                          onClick={() => setIsIssuingNewCard(false)}
                          className="absolute top-3.5 right-4 text-xs font-bold text-text-muted hover:text-foreground cursor-pointer z-10"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Shift Token Sales Summary */}
                <div className="minimal-card rounded-xl flex flex-col bg-surface border border-border">
                  <div className="bg-surface-header/80 px-4 py-3 border-b border-border rounded-t-xl">
                    <h3 className="text-xs font-bold text-foreground flex items-center">
                      Your Shift Token Sales
                      <InfoTag text="Summary of token sales and cash collected by you today. Resets daily." position="bottom" />
                    </h3>
                  </div>
                  <div className="p-5 flex flex-col gap-4">
                    <div className="bg-surface-container/40 border border-border p-3.5 rounded-lg flex justify-between items-center">
                      <span className="text-xs text-text-muted font-bold">Tokens Sold</span>
                      <span className="font-mono font-bold text-sm text-primary">
                        {shiftTokensSold} tokens
                      </span>
                    </div>
                    <div className="bg-surface-container/40 border border-border p-3.5 rounded-lg flex justify-between items-center">
                      <span className="text-xs text-text-muted font-bold">Rupees Collected</span>
                      <span className="font-mono font-bold text-sm text-[#71d384]">
                        ₹{shiftRupeesCollected.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. HISTORY WORKSPACE */}
        {activeWorkspace === 'history' && (
          <div className="flex-1 overflow-y-auto pr-1 pb-24 lg:pb-12 animate-slide-in max-w-4xl mx-auto w-full">
            <div className="minimal-card p-6 rounded-xl bg-surface border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 mb-4 gap-3">
                <div>
                  <h2 className="text-sm text-foreground font-bold">
                    {historyDateFilter === 'today' ? "Today's Placed Orders" : "All Placed Orders"}
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {historyDateFilter === 'today' ? "Recent orders placed during today's shift" : "All historical orders placed by you"}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex bg-surface-header border border-border p-0.5 rounded-lg text-xs font-bold">
                    {(['today', 'all'] as const).map((filter) => {
                      const isSelected = historyDateFilter === filter;
                      return (
                        <button
                          key={filter}
                          onClick={() => {
                            setHistoryDateFilter(filter);
                            setHistoryPage(1);
                          }}
                          className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white font-bold'
                              : 'text-text-muted hover:text-foreground'
                          }`}
                        >
                          {filter === 'today' ? 'Today' : 'All Time'}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-xs font-mono text-text-muted font-bold bg-surface-header border border-border px-3 py-1.5 rounded-lg">
                    Total: {staffOrders.length}
                  </span>
                </div>
              </div>
              
              {staffOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-text-muted font-medium">
                  {historyDateFilter === 'today' 
                    ? "No orders placed today yet" 
                    : "No orders found in history"}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {pagedHistory.map((order) => (
                    <div 
                      key={order.id} 
                      className="bg-surface-container/20 border border-border px-4 py-3.5 rounded-lg flex items-center justify-between text-xs hover:border-text-muted/30 transition-colors"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">Order #{order.id.replace('HH-', '')}</span>
                          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono font-bold">
                            {order.tableNumber}
                          </span>
                        </div>
                        <span className="text-xs text-text-muted font-semibold">
                          {order.items.map(i => `${i.name} (${i.quantity})`).join(', ')}
                        </span>
                        <span className="text-[10px] text-text-muted font-medium">
                          Placed at {new Date(order.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-foreground font-mono text-sm">₹{order.total.toFixed(2)}</span>
                        <StatusBadge status={order.orderStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {staffOrders.length > HISTORY_PER_PAGE && (
                <div className="-mx-6 mt-4 border-t border-border">
                  <Pagination
                    currentPage={safeHistoryPage}
                    totalPages={historyPageCount}
                    onPageChange={setHistoryPage}
                    totalItems={staffOrders.length}
                    itemsPerPage={HISTORY_PER_PAGE}
                    label="orders"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. PROFILE WORKSPACE */}
        {activeWorkspace === 'profile' && (
          <div className="flex-1 overflow-y-auto">
            <ProfileSection />
          </div>
        )}

        {/* 5. HELP & DOCS WORKSPACE */}
        {activeWorkspace === 'docs' && (
          <div className="flex-1 overflow-y-auto">
            <DocsWorkspace />
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {activeWorkspace === 'pos' && activeTable && cartItemsCount > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border p-3.5 flex justify-between items-center z-45">
          <div className="flex flex-col">
            <span className="text-[10px] text-text-muted font-bold">{activeTable}</span>
            <span className="text-xs font-bold text-foreground">
              {cartItemsCount} {cartItemsCount === 1 ? 'Item' : 'Items'} • ₹{cartTotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            View Order
          </button>
        </div>
      )}

      {/* Mobile Cart Drawer Overlay */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex flex-col justify-end">
          <div className="bg-surface max-h-[85vh] rounded-t-xl overflow-hidden flex flex-col animate-slide-in">
            <div className="h-full flex-1">
              <CartPanel onClose={() => setIsMobileCartOpen(false)} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
