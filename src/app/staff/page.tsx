'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import TableSelector from '@/components/TableSelector';
import MenuItemCard from '@/components/MenuItemCard';
import CartPanel from '@/components/CartPanel';
import StatusBadge from '@/components/StatusBadge';
import { TokenAccount } from '@/types';

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
    sellTokens
  } = useApp();

  const [activeWorkspace, setActiveWorkspace] = useState<'pos' | 'tokens'>('pos');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // Token Hub states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<TokenAccount | null>(null);
  const [rechargeTokens, setRechargeTokens] = useState('');
  const [rechargeAmount, setRechargeAmount] = useState('');

  // Dynamic category calculations
  const menuCategories = Array.from(new Set(menu.map(item => item.category))).filter(Boolean);
  const existingCategories = menuCategories.length > 0 ? menuCategories : ['Burgers', 'Sides', 'Drinks', 'Combo'];
  const categories = ['All', ...existingCategories];

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
    setRechargeTokens(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const rupees = Math.round(parsed * 30 * 100) / 100;
      setRechargeAmount(rupees.toString());
    } else {
      setRechargeAmount('');
    }
  };

  const handleRechargeAmountChange = (val: string) => {
    setRechargeAmount(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0) {
      const tokensVal = Math.round((parsed / 30) * 100) / 100;
      setRechargeTokens(tokensVal.toString());
    } else {
      setRechargeTokens('');
    }
  };

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !rechargeTokens || !rechargeAmount) return;

    const tkVal = parseFloat(rechargeTokens);
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
        tokens: Math.round((selectedStudent.tokens + tkVal) * 100) / 100
      });
      setRechargeTokens('');
      setRechargeAmount('');
    }
  };

  // Filter transactions for selected student
  const studentTransactions = selectedStudent
    ? tokenTransactions.filter(tx => tx.studentId === selectedStudent.id)
    : [];

  // Filter shift sales summary
  const shiftTransactions = tokenTransactions.filter(
    tx => tx.soldBy === currentUser.username
  );
  const shiftTokensSold = shiftTransactions.reduce((sum, tx) => sum + tx.tokens, 0);
  const shiftRupeesCollected = shiftTransactions.reduce((sum, tx) => sum + tx.amount, 0);

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

      {/* Main Workspace */}
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 flex-1 flex flex-col gap-6">
        
        {/* Workspace Nav Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 border-b border-white/3">
          {(['pos', 'tokens'] as const).map((space) => {
            const isSelected = activeWorkspace === space;
            return (
              <button
                key={space}
                onClick={() => {
                  setActiveWorkspace(space);
                  // Reset states on toggle
                  setSelectedStudent(null);
                  setStudentSearchQuery('');
                }}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase border transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-white border-white text-zinc-950 font-bold'
                    : 'bg-zinc-900/20 border-white/3 text-zinc-400 hover:text-zinc-200 hover:border-white/8'
                }`}
              >
                {space === 'pos' ? 'POS Terminal' : 'Token Hub'}
              </button>
            );
          })}
        </div>

        {/* 1. POS TERMINAL WORKSPACE */}
        {activeWorkspace === 'pos' && (
          <div className="flex flex-col gap-6 animate-slide-in">
            {/* Table Selector */}
            <TableSelector />

            {/* Column Splits */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Menu Column */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {/* Categories & Add Item Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/3 pb-3">
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
          </div>
        )}

        {/* 2. TOKEN HUB WORKSPACE */}
        {activeWorkspace === 'tokens' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-in">
            {/* Left Column: Search & Profile & Transactions */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Search Panel */}
              <div className="minimal-card p-5 rounded-md flex flex-col gap-4">
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                  Search Student Card
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter student name or 3-digit card number..."
                    value={studentSearchQuery}
                    onChange={(e) => handleStudentSearch(e.target.value)}
                    className="minimal-input pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-700 w-full"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-bold select-none pointer-events-none">🔍</span>
                </div>

                {/* Search Results Dropdown/List */}
                {studentSearchQuery && searchedStudents.length > 0 && (
                  <div className="border border-white/5 rounded-sm bg-zinc-950/60 divide-y divide-white/2 max-h-48 overflow-y-auto mt-2">
                    {searchedStudents.map(student => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudentSearchQuery('');
                          setRechargeTokens('');
                          setRechargeAmount('');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex justify-between items-center text-xs cursor-pointer"
                      >
                        <div>
                          <span className="font-bold text-zinc-200">{student.name}</span>
                          <span className="text-[10px] text-zinc-500 ml-2">Card: #{student.cardNo}</span>
                        </div>
                        <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-sm border border-blue-500/20 font-bold text-[10px]">
                          {student.tokens} tokens
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {studentSearchQuery && searchedStudents.length === 0 && (
                  <div className="p-4 text-center text-xs text-zinc-600 font-bold uppercase mt-2">
                    No matching student cards found
                  </div>
                )}
              </div>

              {/* Selected Student Profile */}
              {selectedStudent ? (
                <div className="minimal-card rounded-md overflow-hidden flex flex-col">
                  <div className="bg-zinc-950/80 px-5 py-4 border-b border-white/3 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Student Profile</span>
                      <span className="text-sm font-bold text-white mt-0.5">{selectedStudent.name}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-blue-400">Card #{selectedStudent.cardNo}</span>
                  </div>

                  <div className="p-5 flex flex-col gap-6">
                    {/* Current Balance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-900/30 border border-white/2 p-4 rounded-sm flex flex-col justify-center">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Current Balance</span>
                        <span className="text-lg font-black text-blue-400 font-mono mt-1">
                          {selectedStudent.tokens} tokens
                        </span>
                      </div>
                      <div className="bg-zinc-900/30 border border-white/2 p-4 rounded-sm flex flex-col justify-center">
                        <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider">Equivalent Value</span>
                        <span className="text-lg font-black text-emerald-400 font-mono mt-1">
                          ₹{(selectedStudent.tokens * 30).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Tokens Taken / Recharge History */}
                    <div className="flex flex-col gap-3">
                      <h4 className="text-[9px] uppercase font-bold tracking-widest text-zinc-400">
                        Tokens Taken (Recharge History)
                      </h4>
                      
                      <div className="border border-white/3 rounded-sm overflow-hidden">
                        {studentTransactions.length === 0 ? (
                          <div className="p-6 text-center text-zinc-600 italic font-bold uppercase tracking-wider text-[9px] bg-zinc-950/10">
                            No recharge history found for this card
                          </div>
                        ) : (
                          <div className="max-h-60 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-[10px]">
                              <thead>
                                  <tr className="border-b border-white/3 bg-zinc-950/60 text-zinc-500">
                                    <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Date & Time</th>
                                    <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Tokens Added</th>
                                    <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Amount Paid</th>
                                    <th className="p-2.5 font-bold uppercase tracking-wider text-[8px]">Operator</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/2 bg-zinc-950/10">
                                  {studentTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/1 transition-colors">
                                      <td className="p-2.5 text-zinc-500 font-medium">
                                        {new Date(tx.createdAt).toLocaleString([], {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </td>
                                      <td className="p-2.5 text-blue-400 font-mono font-bold">+{tx.tokens} tokens</td>
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
                  </div>
                </div>
              ) : (
                <div className="minimal-card p-8 rounded-md text-center opacity-65 flex flex-col items-center justify-center">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No Student Selected</span>
                  <span className="text-[9px] text-zinc-600 mt-1">Search and select a student card above to recharge or view recharge logs.</span>
                </div>
              )}
            </div>

            {/* Right Column: Sell Tokens Form & Shift Sales Summary */}
            <div className="flex flex-col gap-6">
              {/* Sell Tokens Form */}
              {selectedStudent && (
                <div className="minimal-card rounded-md overflow-hidden flex flex-col">
                  <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3">
                    <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                      Sell Tokens (Recharge Card)
                    </h3>
                  </div>

                  <form onSubmit={handleSellSubmit} className="p-5 flex flex-col gap-4 text-xs">
                    {/* Bidirectional Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
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
                            className="minimal-input pl-3.5 pr-8 py-2.5 text-xs text-white placeholder-zinc-700 font-mono w-full"
                          />
                          <span className="absolute right-2.5 text-[9px] text-zinc-500 font-bold uppercase select-none pointer-events-none">
                            TK
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
                          Amount (₹)
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-[10px] text-zinc-500 font-bold pointer-events-none">
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
                            className="minimal-input pl-6 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-700 font-mono w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <span className="text-[8px] text-zinc-600 font-semibold">
                      Exchange rate: 1 Token = ₹30.00. Updates card balance instantly.
                    </span>

                    <button
                      type="submit"
                      className="minimal-btn-primary w-full text-white font-bold py-2.5 rounded-sm uppercase tracking-wider transition-transform active:scale-[0.98] text-[10px] h-10 flex items-center justify-center cursor-pointer mt-2"
                    >
                      ⚡ Sell & Recharge Card
                    </button>
                  </form>
                </div>
              )}

              {/* Shift Token Sales Summary */}
              <div className="minimal-card rounded-md overflow-hidden flex flex-col">
                <div className="bg-zinc-950/80 px-4 py-3 border-b border-white/3">
                  <h3 className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">
                    Your Shift Token Sales
                  </h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="bg-[#141416] border border-white/3 p-3.5 rounded-sm flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Tokens Sold</span>
                    <span className="font-mono font-bold text-xs text-blue-400">
                      {shiftTokensSold.toFixed(2)} tokens
                    </span>
                  </div>
                  <div className="bg-[#141416] border border-white/3 p-3.5 rounded-sm flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Rupees Collected</span>
                    <span className="font-mono font-bold text-xs text-emerald-400">
                      ₹{shiftRupeesCollected.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar for Mobile */}
      {activeWorkspace === 'pos' && activeTable && cartItemsCount > 0 && (
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

    </div>
  );
}
