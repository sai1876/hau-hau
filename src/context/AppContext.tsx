'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../services/db';
import { MenuItem, Order, StaffAccount, CartItem, TokenAccount } from '../types';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '@/services/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

interface AppContextType {
  menu: MenuItem[];
  orders: Order[];
  staffList: StaffAccount[];
  tokens: TokenAccount[];
  currentUser: { name: string; role: 'staff' | 'owner'; username: string } | null;
  activeTable: string | null;
  tableCarts: Record<string, CartItem[]>; // tableNumber -> CartItem[]
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>;
  
  // Auth actions
  login: (username: string, password?: string, bypassAuth?: boolean) => Promise<boolean>;
  logout: () => void;
  
  // Staff actions
  selectActiveTable: (table: string | null) => void;
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, change: number) => void;
  removeFromCart: (itemId: string) => void;
  clearTableCart: (table: string) => void;
  confirmOrder: (paymentMode: 'cash' | 'online' | 'tokens', tokenCardId?: string, tokensDeducted?: number) => boolean;
  
  // Owner actions
  toggleMenuItem: (itemId: string) => void;
  updateOrderStatus: (orderId: string, status: 'pending' | 'completed' | 'cancelled') => void;
  createNewStaff: (account: Omit<StaffAccount, 'id' | 'status'>) => Promise<boolean>;
  toggleStaff: (staffId: string) => void;
  removeStaff: (staffId: string) => void;
  
  // Menu Item Management
  createNewMenuItem: (item: Omit<MenuItem, 'id' | 'available'>) => Promise<MenuItem | null>;
  removeMenuItem: (itemId: string) => void;
  updateMenuItem: (itemId: string, updatedFields: Partial<Omit<MenuItem, 'id'>>) => Promise<boolean>;

  // Token Management
  createNewToken: (account: Omit<TokenAccount, 'id' | 'createdAt'>) => Promise<boolean>;
  updateToken: (tokenId: string, updatedFields: Partial<Omit<TokenAccount, 'id'>>) => Promise<boolean>;
  removeToken: (tokenId: string) => Promise<boolean>;
  
  // Toasts
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Custom Confirm Dialog
  confirmAction: (message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  
  // States
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staffList, setStaffList] = useState<StaffAccount[]>([]);
  const [tokens, setTokens] = useState<TokenAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<AppContextType['currentUser']>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [tableCarts, setTableCarts] = useState<Record<string, CartItem[]>>({});
  const [toasts, setToasts] = useState<AppContextType['toasts']>([]);
  const toastIdRef = useRef(0);
  const [usingFirebase, setUsingFirebase] = useState(db.isFirebaseConfigured());

  // Custom Confirm Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
  });

  const confirmAction = useCallback((message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  }, []);

  // Toast Helpers
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    toastIdRef.current += 1;
    const id = `toast-${toastIdRef.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  // Listen to fallback events (e.g. adblocker blocking firestore)
  useEffect(() => {
    const handleFallback = () => {
      setUsingFirebase(false);
      addToast('Firestore connection blocked. Switched to LocalStorage mode.', 'warning');
    };
    window.addEventListener('firebase-fallback', handleFallback);
    return () => {
      window.removeEventListener('firebase-fallback', handleFallback);
    };
  }, [addToast]);

  // Initialize data subscriptions on mount
  useEffect(() => {
    // 1. Subscribe to Menu
    const unsubMenu = db.subscribeMenu((updatedMenu) => {
      setMenu(updatedMenu);
    });

    // 2. Subscribe to Orders
    const unsubOrders = db.subscribeOrders((updatedOrders) => {
      setOrders(updatedOrders);
    });

    // 3. Subscribe to Staff Accounts
    const unsubStaff = db.subscribeStaff((updatedStaff) => {
      setStaffList(updatedStaff);
    });

    // 4. Subscribe to Token Accounts
    const unsubTokens = db.subscribeTokens((updatedTokens) => {
      setTokens(updatedTokens);
    });

    // Defer state updates to prevent synchronous setState inside useEffect
    let unsubAuth = () => {};
    const timer = setTimeout(() => {
      if (usingFirebase) {
        unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const docRef = doc(firestore, 'staff', firebaseUser.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const profile = docSnap.data() as StaffAccount;
                const role = (profile.role || (profile.username === 'owner' ? 'owner' : 'staff')) as 'staff' | 'owner';
                
                if (profile.status === 'inactive') {
                  addToast('This account is disabled.', 'error');
                  await signOut(auth);
                  setCurrentUser(null);
                  return;
                }

                setCurrentUser({
                  name: profile.name,
                  role,
                  username: profile.username
                });

                // Redirect based on role on login screen
                if (window.location.pathname === '/login') {
                  if (role === 'owner') {
                    router.push('/owner');
                  } else {
                    router.push('/staff');
                  }
                }
              }
            } catch (e) {
              console.warn('Error fetching auth user profile:', e);
            }
          } else {
            setCurrentUser(null);
          }
        }, (error) => {
          console.warn("Auth state changed error/blocked. Triggering LocalStorage fallback:", error);
          db.markFirebaseBlocked();
        });
      } else {
        const savedUser = localStorage.getItem('hau_hau_session');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
      }

      const savedCarts = localStorage.getItem('hau_hau_table_carts');
      if (savedCarts) {
        setTableCarts(JSON.parse(savedCarts));
      }
    }, 0);

    return () => {
      unsubMenu();
      unsubOrders();
      unsubStaff();
      unsubTokens();
      unsubAuth();
      clearTimeout(timer);
    };
  }, [router, addToast, usingFirebase]);

  // Save carts when they change
  useEffect(() => {
    if (Object.keys(tableCarts).length > 0) {
      localStorage.setItem('hau_hau_table_carts', JSON.stringify(tableCarts));
    }
  }, [tableCarts]);

  // Auth Operations
  const login = async (username: string, password?: string, bypassAuth = false): Promise<boolean> => {
    let email = username;

    // Map usernames to emails for Firebase Auth
    if (username === 'owner') {
      email = 'owner@hauhau.com';
    } else if (username === 'staff') {
      email = 'staff@hauhau.com';
    } else {
      // Find staff by username to get their email
      const profile = staffList.find(s => s.username.toLowerCase() === username.toLowerCase());
      if (profile) {
        email = profile.emailOrPhone;
      }
    }

    if (db.isFirebaseConfigured() && !bypassAuth) {
      try {
        if (!password) {
          addToast('Password is required.', 'error');
          return false;
        }
        await signInWithEmailAndPassword(auth, email, password);
        addToast('Verifying credentials...', 'info');
        return true;
      } catch (err) {
        console.warn('Auth Error:', err);
        let errMsg = 'Invalid username or password.';
        const firebaseError = err as { code?: string };
        if (firebaseError.code === 'auth/invalid-email') {
          errMsg = 'Invalid email address format.';
        } else if (firebaseError.code === 'auth/user-disabled') {
          errMsg = 'This account has been disabled.';
        }
        addToast(errMsg, 'error');
        return false;
      }
    } else {
      // LocalStorage fallback mode
      if (username === 'owner' && (bypassAuth || password === 'owner' || password === 'owner123')) {
        const user = { name: 'Sarah (Owner)', role: 'owner' as const, username };
        setCurrentUser(user);
        localStorage.setItem('hau_hau_session', JSON.stringify(user));
        addToast('Welcome back, Sarah!', 'success');
        router.push('/owner');
        return true;
      }

      const foundStaff = staffList.find(s => s.username === username && (bypassAuth || s.password === password || s.password === 'staff123'));
      if (foundStaff) {
        if (foundStaff.status === 'inactive') {
          addToast('This account is currently disabled. Please contact the owner.', 'error');
          return false;
        }
        const user = { name: foundStaff.name, role: 'staff' as const, username };
        setCurrentUser(user);
        localStorage.setItem('hau_hau_session', JSON.stringify(user));
        addToast(`Welcome on shift, ${foundStaff.name}!`, 'success');
        router.push('/staff');
        return true;
      }

      addToast('Invalid username or password.', 'error');
      return false;
    }
  };

  const logout = async () => {
    if (db.isFirebaseConfigured()) {
      await signOut(auth);
    }
    setCurrentUser(null);
    localStorage.removeItem('hau_hau_session');
    setActiveTable(null);
    addToast('Logged out successfully.', 'info');
    router.push('/login');
  };

  // Cart Operations
  const selectActiveTable = (table: string | null) => {
    setActiveTable(table);
  };

  const addToCart = (item: MenuItem) => {
    if (!activeTable) {
      addToast('Select a table first before adding food items!', 'warning');
      return;
    }

    setTableCarts(prev => {
      const currentCart = prev[activeTable] || [];
      const existingItem = currentCart.find(i => i.menuItemId === item.id);
      
      let updatedCart;
      if (existingItem) {
        updatedCart = currentCart.map(i => 
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        updatedCart = [...currentCart, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
      }

      return {
        ...prev,
        [activeTable]: updatedCart
      };
    });

    addToast(`Added ${item.name} to Table ${activeTable}`, 'success');
  };

  const updateCartQuantity = (itemId: string, change: number) => {
    if (!activeTable) return;

    setTableCarts(prev => {
      const currentCart = prev[activeTable] || [];
      const updatedCart = currentCart.map(i => {
        if (i.menuItemId === itemId) {
          const newQty = i.quantity + change;
          return newQty > 0 ? { ...i, quantity: newQty } : i;
        }
        return i;
      }).filter(i => i.quantity > 0);

      return {
        ...prev,
        [activeTable]: updatedCart
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    if (!activeTable) return;

    setTableCarts(prev => {
      const currentCart = prev[activeTable] || [];
      const updatedCart = currentCart.filter(i => i.menuItemId !== itemId);
      return {
        ...prev,
        [activeTable]: updatedCart
      };
    });

    addToast('Item removed from cart', 'info');
  };

  const clearTableCart = (table: string) => {
    setTableCarts(prev => {
      const copy = { ...prev };
      delete copy[table];
      return copy;
    });
    
    // Clear in localStorage
    const savedCarts = localStorage.getItem('hau_hau_table_carts');
    if (savedCarts) {
      const parsed = JSON.parse(savedCarts);
      delete parsed[table];
      localStorage.setItem('hau_hau_table_carts', JSON.stringify(parsed));
    }
    
    addToast(`Cart cleared for Table ${table}`, 'info');
  };

  const confirmOrder = (paymentMode: 'cash' | 'online' | 'tokens', tokenCardId?: string, tokensDeducted?: number): boolean => {
    if (!activeTable) {
      addToast('Table number is required.', 'error');
      return false;
    }

    const currentCart = tableCarts[activeTable] || [];
    if (currentCart.length === 0) {
      addToast('Cart is empty. Add items first.', 'error');
      return false;
    }

    if (!paymentMode) {
      addToast('Please select a payment mode.', 'error');
      return false;
    }

    const subtotal = currentCart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    let extraOrderFields = {};

    if (paymentMode === 'tokens') {
      if (!tokenCardId || tokensDeducted === undefined) {
        addToast('Please select a valid student token card.', 'error');
        return false;
      }

      const tokenCard = tokens.find(t => t.id === tokenCardId);
      if (!tokenCard) {
        addToast('Selected token card not found in database.', 'error');
        return false;
      }

      if (tokenCard.tokens < tokensDeducted) {
        addToast(`Insufficient balance on card (Has: ${tokenCard.tokens} tokens, Requires: ${tokensDeducted} tokens).`, 'error');
        return false;
      }

      // Deduct balance
      const newBalance = Math.round((tokenCard.tokens - tokensDeducted) * 100) / 100;
      db.updateTokenAccount(tokenCardId, { tokens: newBalance });

      extraOrderFields = {
        tokenCardNo: tokenCard.cardNo,
        studentName: tokenCard.name,
        tokensDeducted: tokensDeducted
      };
    }

    db.createOrder({
      tableNumber: activeTable,
      items: currentCart,
      total: subtotal,
      paymentMode,
      staffId: currentUser?.username || 's1',
      staffName: currentUser?.name || 'Alex Johnson',
      ...extraOrderFields
    });

    // Clear cart for this table
    setTableCarts(prev => {
      const copy = { ...prev };
      delete copy[activeTable];
      return copy;
    });
    
    // Clear in localStorage
    const savedCarts = localStorage.getItem('hau_hau_table_carts');
    if (savedCarts) {
      const parsed = JSON.parse(savedCarts);
      delete parsed[activeTable];
      localStorage.setItem('hau_hau_table_carts', JSON.stringify(parsed));
    }

    addToast(`Order sent successfully for Table ${activeTable}!`, 'success');
    return true;
  };

  // Owner Operations
  const toggleMenuItem = async (itemId: string) => {
    try {
      await db.toggleMenuAvailability(itemId);
      addToast('Menu item availability updated', 'success');
    } catch {
      addToast('Failed to update availability', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
      await db.updateOrderStatus(orderId, status);
      addToast(`Order ${orderId} marked as ${status}`, 'success');
    } catch {
      addToast('Failed to update order status', 'error');
    }
  };

  const createNewStaff = async (account: Omit<StaffAccount, 'id' | 'status'>): Promise<boolean> => {
    const exists = staffList.some(s => s.username.toLowerCase() === account.username.toLowerCase());
    if (exists) {
      addToast('Username already exists.', 'error');
      return false;
    }

    if (db.isFirebaseConfigured()) {
      try {
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        };

        const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
        const secondaryAuth = getAuth(secondaryApp);

        // Sign up user in secondary Auth
        const cred = await createUserWithEmailAndPassword(
          secondaryAuth,
          account.emailOrPhone, // email input
          account.password
        );

        await secondaryAuth.signOut();
        await deleteApp(secondaryApp);

        // Save doc in firestore
        await db.addStaffWithId(cred.user.uid, {
          name: account.name,
          emailOrPhone: account.emailOrPhone,
          username: account.username.trim().toLowerCase(),
          password: account.password,
          status: 'active'
        });

        addToast(`Staff account for ${account.name} created!`, 'success');
        return true;
      } catch (err) {
        console.warn('Create Staff Auth Error:', err);
        let errMsg = 'Failed to create staff account.';
        const firebaseError = err as { code?: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          errMsg = 'Email already in use.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errMsg = 'Password must be at least 6 characters.';
        } else if (firebaseError.code === 'auth/invalid-email') {
          errMsg = 'Invalid email format.';
        }
        addToast(errMsg, 'error');
        return false;
      }
    } else {
      // LocalStorage mode
      db.addStaff({
        ...account,
        status: 'active'
      });
      addToast(`Staff account for ${account.name} created!`, 'success');
      return true;
    }
  };

  const toggleStaff = async (staffId: string) => {
    try {
      await db.toggleStaffStatus(staffId);
      addToast('Staff status changed', 'success');
    } catch {
      addToast('Failed to update staff status', 'error');
    }
  };

  const removeStaff = async (staffId: string) => {
    try {
      await db.deleteStaff(staffId);
      addToast('Staff account deleted', 'success');
    } catch {
      addToast('Failed to delete staff account', 'error');
    }
  };

  // Menu Management Operations
  const createNewMenuItem = async (item: Omit<MenuItem, 'id' | 'available'>): Promise<MenuItem | null> => {
    try {
      const newItem = await db.addMenuItem(item);
      addToast(`Menu item "${item.name}" created successfully!`, 'success');
      return newItem;
    } catch {
      addToast('Failed to create menu item', 'error');
      return null;
    }
  };

  const removeMenuItem = async (itemId: string) => {
    try {
      await db.deleteMenuItem(itemId);
      addToast('Menu item deleted successfully', 'success');
    } catch {
      addToast('Failed to delete menu item', 'error');
    }
  };

  const updateMenuItem = async (itemId: string, updatedFields: Partial<Omit<MenuItem, 'id'>>): Promise<boolean> => {
    try {
      await db.updateMenuItem(itemId, updatedFields);
      addToast('Menu item updated successfully!', 'success');
      return true;
    } catch {
      addToast('Failed to update menu item', 'error');
      return false;
    }
  };

  // Token Management Operations
  const createNewToken = async (account: Omit<TokenAccount, 'id' | 'createdAt'>): Promise<boolean> => {
    // Validate card number uniqueness
    const exists = tokens.some(t => t.cardNo === account.cardNo);
    if (exists) {
      addToast(`Token card number #${account.cardNo} already exists.`, 'error');
      return false;
    }

    try {
      await db.addTokenAccount(account);
      addToast(`Token card for ${account.name} created!`, 'success');
      return true;
    } catch {
      addToast('Failed to create token card.', 'error');
      return false;
    }
  };

  const updateToken = async (tokenId: string, updatedFields: Partial<Omit<TokenAccount, 'id'>>): Promise<boolean> => {
    // If card number is being changed, ensure it remains unique
    if (updatedFields.cardNo) {
      const exists = tokens.some(t => t.id !== tokenId && t.cardNo === updatedFields.cardNo);
      if (exists) {
        addToast(`Token card number #${updatedFields.cardNo} already exists.`, 'error');
        return false;
      }
    }

    try {
      await db.updateTokenAccount(tokenId, updatedFields);
      addToast('Token card updated successfully!', 'success');
      return true;
    } catch {
      addToast('Failed to update token card.', 'error');
      return false;
    }
  };

  const removeToken = async (tokenId: string): Promise<boolean> => {
    try {
      await db.deleteTokenAccount(tokenId);
      addToast('Token card deleted successfully.', 'success');
      return true;
    } catch {
      addToast('Failed to delete token card.', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        menu,
        orders,
        staffList,
        tokens,
        currentUser,
        activeTable,
        tableCarts,
        toasts,
        login,
        logout,
        selectActiveTable,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearTableCart,
        confirmOrder,
        toggleMenuItem,
        updateOrderStatus,
        createNewStaff,
        toggleStaff,
        removeStaff,
        createNewMenuItem,
        removeMenuItem,
        updateMenuItem,
        createNewToken,
        updateToken,
        removeToken,
        addToast,
        removeToast,
        confirmAction
      }}
    >
      {children}

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div className="bg-[#1c1b1b] border border-white/10 w-full max-w-sm rounded-sm p-6 shadow-2xl flex flex-col gap-5 relative animate-slide-in">
            {/* Glowing top line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-transparent via-[#ff4d00] to-transparent" />
            
            {/* Title / Icon */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#ff4d00]/10 border border-[#ff4d00]/30 rounded-sm flex items-center justify-center text-[#ff4d00] font-black text-sm">
                ⚠
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">System Confirmation</h3>
            </div>

            {/* Message */}
            <p className="text-xs text-[#e5e2e1] leading-relaxed font-semibold">
              {confirmModal.message}
            </p>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={confirmModal.onCancel}
                className="bg-[#2e2e2e] hover:bg-[#3d3d3d] text-white px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95 touch-target cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="bg-[#ff4d00] hover:bg-[#e04300] text-white px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-wider transition-colors active:scale-95 touch-target shadow-lg shadow-[#ff4d00]/10 cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Toast Notification Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => {
          let bgClass = 'bg-[#1c1b1b] border-[#2e2e2e] text-[#e5e2e1]';
          let borderLeft = 'border-l-4 border-l-[#ff4d00]';
          
          if (toast.type === 'success') {
            bgClass = 'bg-[#152e1f] border-[#2e2e2e] text-[#6bff8f]';
            borderLeft = 'border-l-4 border-l-[#22c55e]';
          } else if (toast.type === 'error') {
            bgClass = 'bg-[#3b1212] border-[#2e2e2e] text-[#ffdad6]';
            borderLeft = 'border-l-4 border-l-[#ff4d00]';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-[#3a2f15] border-[#2e2e2e] text-[#ffdcbf]';
            borderLeft = 'border-l-4 border-l-[#ff9500]';
          }

          return (
            <div
              key={toast.id}
              className={`p-4 rounded-sm flex justify-between items-center shadow-lg border pointer-events-auto ${bgClass} ${borderLeft} animate-slide-in`}
              style={{ minWidth: '280px' }}
            >
              <span className="font-semibold text-sm mr-4">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-xs hover:text-white opacity-60 hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
