'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { X as XIcon } from '@phosphor-icons/react';
import { db } from '../services/db';
import { MenuItem, Order, StaffAccount, CartItem, TokenAccount, TokenTransaction, AuditLog, Settings } from '../types';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '@/services/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged,
  updatePassword
} from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { hashPassword } from '../utils/crypto';

interface AppContextType {
  menu: MenuItem[];
  orders: Order[];
  staffList: StaffAccount[];
  tokens: TokenAccount[];
  tokenTransactions: TokenTransaction[];
  currentUser: { name: string; role: 'staff' | 'owner'; username: string } | null;
  activeTable: string | null;
  tableCarts: Record<string, CartItem[]>; // tableNumber -> CartItem[]
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>;
  
  // Auth actions
  login: (username: string, password?: string, bypassAuth?: boolean) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedFields: { name?: string; password?: string; emailOrPhone?: string }) => Promise<boolean>;
  
  // Staff actions
  selectActiveTable: (table: string | null) => void;
  addToCart: (item: MenuItem) => void;
  updateCartQuantity: (itemId: string, change: number) => void;
  removeFromCart: (itemId: string) => void;
  clearTableCart: (table: string) => void;
  confirmOrder: (paymentMode: 'cash' | 'online' | 'tokens', tokenCardNo?: string) => Promise<boolean>;
  
  // Owner actions
  toggleMenuItem: (itemId: string) => void;
  updateOrderStatus: (orderId: string, status: 'pending' | 'completed' | 'cancelled') => void;
  createNewStaff: (account: Omit<StaffAccount, 'id' | 'status'>) => Promise<boolean>;
  toggleStaff: (staffId: string) => void;
  removeStaff: (staffId: string) => void;
  updateStaffLimit: (staffId: string, limit: number) => Promise<boolean>;
  
  // Menu Item Management
  createNewMenuItem: (item: Omit<MenuItem, 'id' | 'available'>) => Promise<MenuItem | null>;
  removeMenuItem: (itemId: string) => void;
  updateMenuItem: (itemId: string, updatedFields: Partial<Omit<MenuItem, 'id'>>) => Promise<boolean>;

  // Token Management
  createNewToken: (account: Omit<TokenAccount, 'id' | 'createdAt'>) => Promise<boolean>;
  updateToken: (tokenId: string, updatedFields: Partial<Omit<TokenAccount, 'id'>>) => Promise<boolean>;
  removeToken: (tokenId: string) => Promise<boolean>;
  sellTokens: (studentId: string, tokens: number, amount: number) => Promise<boolean>;
  adjustTokens: (studentId: string, targetTokens: number, reason: string) => Promise<boolean>;
  
  // Settings & Audit Logs
  settings: Settings;
  auditLogs: AuditLog[];
  updateSettings: (updatedFields: Partial<Settings>) => Promise<boolean>;
  usingFirebase: boolean;
  syncDataToCloud: () => Promise<boolean>;
  
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
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [settings, setSettings] = useState<Settings>({
    id: 'settings_default',
    outletId: 'main_outlet',
    outletName: 'Hau-Hau Outlet 1',
    tokenValueInRupees: 30,
    manualUpiEnabled: true,
    taxEnabled: false,
    currency: 'INR',
    receiptFooter: 'Thank you for dining with Hau-Hau!',
    monthlyTokenLimitDefaults: 1000,
    orderStatusFlow: ['pending', 'completed', 'cancelled']
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<AppContextType['currentUser']>(null);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [tableCarts, setTableCarts] = useState<Record<string, CartItem[]>>({});
  const [toasts, setToasts] = useState<AppContextType['toasts']>([]);
  const toastIdRef = useRef(0);
  const [usingFirebase, setUsingFirebase] = useState(db.isFirebaseConfigured());
  const isDemoSession = currentUser?.username === 'owner-demo' || currentUser?.username === 'staff-demo';

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
  // 1. Listen to Auth State
  useEffect(() => {
    if (!usingFirebase) {
      const savedUser = localStorage.getItem('hau_hau_session');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
      }
      const savedCarts = localStorage.getItem('hau_hau_table_carts');
      if (savedCarts) {
        setTableCarts(JSON.parse(savedCarts));
      }
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email;
        const isOwnerEmail = email === 'cherukuridakshithsai@gmail.com' ||
                             email === 'owner-demo@hauhau.com' ||
                             email === 'tharun@gmail.com' ||
                             email === 'tharun@gamil.com';
        try {
          const docRef = doc(firestore, 'staff', firebaseUser.uid);
          let docSnap;
          try {
            docSnap = await getDoc(docRef);
          } catch (readErr) {
            // If it's an owner email and read failed (likely due to missing document causing rule violation),
            // we will create the profile document. Otherwise, we rethrow the read error.
            if (isOwnerEmail) {
              console.log("Owner profile missing or unreadable. Self-healing...");
              const ownerProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || email?.split('@')[0] || 'Owner',
                emailOrPhone: email || '',
                username: email?.split('@')[0] || 'owner',
                role: 'owner',
                status: 'active',
                outletId: 'main_outlet',
                isDemo: email?.includes('demo') || false
              };
              await setDoc(docRef, ownerProfile);
              docSnap = await getDoc(docRef);
            } else {
              throw readErr;
            }
          }

          if (docSnap && docSnap.exists()) {
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
          } else {
            // Profile snap exists but is empty, and it is an owner email
            if (isOwnerEmail) {
              const ownerProfile = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || email?.split('@')[0] || 'Owner',
                emailOrPhone: email || '',
                username: email?.split('@')[0] || 'owner',
                role: 'owner',
                status: 'active',
                outletId: 'main_outlet',
                isDemo: email?.includes('demo') || false
              };
              await setDoc(docRef, ownerProfile);
              
              setCurrentUser({
                name: ownerProfile.name,
                role: 'owner',
                username: ownerProfile.username
              });

              if (window.location.pathname === '/login') {
                router.push('/owner');
              }
            } else {
              addToast('Access denied: Staff profile not found in database.', 'error');
              await signOut(auth);
              setCurrentUser(null);
            }
          }
        } catch (e) {
          console.warn('Error fetching auth user profile:', e);
          addToast('Access denied: Failed to load profile or permissions missing.', 'error');
          await signOut(auth);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    }, (error) => {
      console.warn("Auth state changed error/blocked. Triggering LocalStorage fallback:", error);
      db.markFirebaseBlocked();
    });

    const savedCarts = localStorage.getItem('hau_hau_table_carts');
    if (savedCarts) {
      setTableCarts(JSON.parse(savedCarts));
    }

    return () => {
      unsubAuth();
    };
  }, [usingFirebase, router, addToast]);

  // 2. Initialize data subscriptions
  useEffect(() => {
    // Only subscribe to Firestore if we are in LocalStorage mode,
    // or if we are in Firebase mode and the current user is authenticated.
    if (usingFirebase && !currentUser) {
      return;
    }

    // Subscribe to Menu
    const unsubMenu = db.subscribeMenu((updatedMenu) => {
      setMenu(updatedMenu);
    });

    // Subscribe to Orders
    const unsubOrders = db.subscribeOrders((updatedOrders) => {
      const isDemoUser = currentUser?.username === 'owner-demo' || currentUser?.username === 'staff-demo';
      const filtered = isDemoUser 
        ? updatedOrders 
        : updatedOrders.filter(o => !o.isDemo);
      setOrders(filtered);
    });

    // Subscribe to Staff Accounts
    const unsubStaff = db.subscribeStaff((updatedStaff) => {
      const isDemoUser = currentUser?.username === 'owner-demo' || currentUser?.username === 'staff-demo';
      const filtered = isDemoUser 
        ? updatedStaff 
        : updatedStaff.filter(s => !s.isDemo && s.username !== 'owner-demo' && s.username !== 'staff-demo');
      setStaffList(filtered);
    });

    // Subscribe to Token Accounts
    const unsubTokens = db.subscribeTokens((updatedTokens) => {
      const isDemoUser = currentUser?.username === 'owner-demo' || currentUser?.username === 'staff-demo';
      const filtered = isDemoUser 
        ? updatedTokens 
        : updatedTokens.filter(t => !t.isDemo);
      setTokens(filtered);
    });

    // Subscribe to Token Transactions
    const unsubTransactions = db.subscribeTokenTransactions((updatedTxs) => {
      const isDemoUser = currentUser?.username === 'owner-demo' || currentUser?.username === 'staff-demo';
      const filtered = isDemoUser 
        ? updatedTxs 
        : updatedTxs.filter(tx => !tx.isDemo);
      setTokenTransactions(filtered);
    });

    // Subscribe to Settings
    const unsubSettings = db.subscribeSettings((updatedSettings) => {
      setSettings(updatedSettings);
    });

    // Subscribe to Audit Logs (Only for Owner or LocalStorage mode)
    let unsubAuditLogs = () => {};
    if (!usingFirebase || currentUser?.role === 'owner') {
      unsubAuditLogs = db.subscribeAuditLogs((updatedLogs) => {
        const isDemoUser = currentUser?.username === 'owner-demo' || currentUser?.username === 'staff-demo';
        const filtered = isDemoUser 
          ? updatedLogs 
          : updatedLogs.filter(log => !log.isDemo);
        setAuditLogs(filtered);
      });
    }

    return () => {
      unsubMenu();
      unsubOrders();
      unsubStaff();
      unsubTokens();
      unsubTransactions();
      unsubSettings();
      unsubAuditLogs();
    };
  }, [usingFirebase, currentUser]);

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
    if (username === 'owner' || username === 'admin') {
      email = process.env.NEXT_PUBLIC_PRODUCTION_OWNER_EMAIL || 'cherukuridakshithsai@gmail.com';
    } else if (username === 'owner-demo') {
      email = 'owner-demo@hauhau.com';
    } else if (username === 'staff') {
      email = 'staff@hauhau.com';
    } else if (username === 'staff-demo') {
      email = 'staff-demo@hauhau.com';
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
        const credential = await signInWithEmailAndPassword(auth, email, password);
        addToast('Verifying credentials...', 'info');

        // Self-healing password migration in Firestore
        try {
          const userDocRef = doc(firestore, 'staff', credential.user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const profile = docSnap.data() as StaffAccount;
            if (profile.password && !/^[a-f0-9]{64}$/i.test(profile.password)) {
              const hashedPasswordValue = await hashPassword(password);
              await updateDoc(userDocRef, { password: hashedPasswordValue });
              console.log(`Auto-migrated plaintext password to SHA-256 hash for UID: ${credential.user.uid}`);
            }
          }
        } catch (migrationErr) {
          console.warn("Self-healing password migration failed:", migrationErr);
        }

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
      const inputHash = password ? await hashPassword(password) : '';
      
      const isOwnerBypass = bypassAuth || 
        password === 'owner' || 
        password === 'owner123' ||
        password === 'demo123' ||
        password === 'Sai@011325' ||
        inputHash === '4c1029697ee358715d3a14a2add817c4b01651440de808371f78165ac90dc581' || // 'owner'
        inputHash === '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9' || // 'owner123'
        inputHash === '01e084a4d6bc824806aa4c473a367f0d4ad73f5baf452ab2c4c6845265900440' || // 'Sai@011325'
        inputHash === 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791';  // 'demo123'

      if ((username === 'owner' || username === 'admin' || username === 'owner-demo') && isOwnerBypass) {
        const user = { 
          name: username === 'owner-demo' ? 'Investor (Owner Demo)' : 'cherukuri dakshith sai', 
          role: 'owner' as const, 
          username 
        };
        setCurrentUser(user);
        localStorage.setItem('hau_hau_session', JSON.stringify(user));
        addToast(`Welcome back, ${user.name}!`, 'success');
        router.push('/owner');
        return true;
      }

      const foundStaff = staffList.find(s => 
        s.username === username && 
        (
          bypassAuth || 
          s.password === inputHash || 
          s.password === password || 
          s.password === '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6' || // 'staff123'
          s.password === 'staff123' ||
          s.password === 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791' // 'demo123'
        )
      );
      if (foundStaff) {
        if (foundStaff.status === 'inactive') {
          addToast('This account is currently disabled. Please contact the owner.', 'error');
          return false;
        }

        // Self-healing password migration in LocalStorage
        if (password && !bypassAuth && !/^[a-f0-9]{64}$/i.test(foundStaff.password)) {
          try {
            await db.updateStaffAccount(foundStaff.id, { password: inputHash });
            console.log(`Auto-migrated plaintext password to SHA-256 hash for local user: ${foundStaff.username}`);
          } catch (migrationErr) {
            console.warn("Self-healing local password migration failed:", migrationErr);
          }
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

  // Auto-logout deactivated staff
  useEffect(() => {
    if (currentUser && currentUser.role === 'staff') {
      const currentProfile = staffList.find(s => s.username === currentUser.username);
      if (currentProfile && currentProfile.status === 'inactive') {
        addToast('Your account has been deactivated.', 'error');
        logout();
      }
    }
  }, [currentUser, staffList, addToast]);

  const updateProfile = async (updatedFields: { name?: string; password?: string; emailOrPhone?: string }): Promise<boolean> => {
    if (!currentUser) {
      addToast('No user logged in.', 'error');
      return false;
    }

    if (db.isFirebaseConfigured()) {
      try {
        const firebaseUser = auth.currentUser;
        if (!firebaseUser) {
          addToast('Firebase authentication session not found.', 'error');
          return false;
        }

        if (updatedFields.password) {
          try {
            await updatePassword(firebaseUser, updatedFields.password);
          } catch (passErr: unknown) {
            console.error("Firebase Auth password update failed:", passErr);
            const firebasePassErr = passErr as { code?: string; message?: string };
            if (firebasePassErr.code === 'auth/requires-recent-login') {
              addToast('Security check: please re-login to change password.', 'error');
            } else {
              addToast(firebasePassErr.message || 'Failed to update password in auth system.', 'error');
            }
            return false;
          }
        }

        const userDocRef = doc(firestore, 'staff', firebaseUser.uid);
        const firestoreFields: Record<string, string> = {};
        if (updatedFields.name) firestoreFields.name = updatedFields.name;
        if (updatedFields.emailOrPhone) firestoreFields.emailOrPhone = updatedFields.emailOrPhone;
        if (process.env.NODE_ENV !== 'production' && updatedFields.password) {
          firestoreFields.password = await hashPassword(updatedFields.password);
        }

        await updateDoc(userDocRef, firestoreFields);

        setCurrentUser(prev => prev ? {
          ...prev,
          name: updatedFields.name || prev.name
        } : null);

        addToast('Profile updated successfully!', 'success');
        return true;
      } catch (err: unknown) {
        console.error("Profile update failed:", err);
        const profileErr = err as { message?: string };
        addToast(profileErr.message || 'Failed to update profile.', 'error');
        return false;
      }
    } else {
      const dbUser = staffList.find(s => s.username === currentUser.username);
      if (!dbUser) {
        addToast('Profile account not found in database.', 'error');
        return false;
      }

      const hashedPass = updatedFields.password ? await hashPassword(updatedFields.password) : undefined;
      await db.updateStaffAccount(dbUser.id, {
        name: updatedFields.name,
        emailOrPhone: updatedFields.emailOrPhone,
        password: hashedPass
      });

      setCurrentUser(prev => prev ? {
        ...prev,
        name: updatedFields.name || prev.name
      } : null);

      const saved = localStorage.getItem('hau_hau_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.name = updatedFields.name || parsed.name;
        localStorage.setItem('hau_hau_session', JSON.stringify(parsed));
      }

      addToast('Profile updated successfully!', 'success');
      return true;
    }
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

    addToast(`Added ${item.name} to ${activeTable === 'Self' ? 'Self Service' : `Table ${activeTable}`}`, 'success');
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
    
    addToast(`Cart cleared for ${table === 'Self' ? 'Self Service' : `Table ${table}`}`, 'info');
  };

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const confirmOrder = async (paymentMode: 'cash' | 'online' | 'tokens', tokenCardNo?: string): Promise<boolean> => {
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

    if (isSubmittingOrder) {
      return false;
    }

    setIsSubmittingOrder(true);

    try {
      const subtotal = currentCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const orderTotal = settings?.taxEnabled ? subtotal * 1.05 : subtotal;
      let extraOrderFields: Partial<Order> = {};

      if (paymentMode === 'tokens') {
        if (!tokenCardNo) {
          addToast('Token card number is required for token payment.', 'error');
          setIsSubmittingOrder(false);
          return false;
        }

        const studentCard = tokens.find(t => t.cardNo === tokenCardNo);
        if (!studentCard) {
          addToast('Student card not found with that card number.', 'error');
          setIsSubmittingOrder(false);
          return false;
        }

        const balanceRupees = studentCard.balanceRupees || 0;
        const amountPayable = Math.max(0, orderTotal - balanceRupees);
        const tokensRequired = Math.ceil(amountPayable / settings.tokenValueInRupees);

        if (studentCard.tokens < tokensRequired) {
          addToast(`Insufficient tokens! Card has ${studentCard.tokens}, required: ${tokensRequired}`, 'error');
          setIsSubmittingOrder(false);
          return false;
        }

        const orderId = 'HH-' + Math.floor(1000 + Math.random() * 9000);

        // Deduct tokens atomically
        const result = await db.deductTokensTransaction(
          studentCard.id,
          orderTotal,
          orderId,
          currentUser?.username || 'unknown',
          auth.currentUser?.uid || 'local',
          currentUser?.role || 'staff'
        );

        extraOrderFields = {
          id: orderId,
          tokenCardNo,
          studentName: studentCard.name,
          tokensDeducted: result.tokensDeducted,
          creditApplied: result.creditApplied,
          creditReturned: result.creditReceived
        };
      }

      const createdOrder = await db.createOrder({
        tableNumber: activeTable,
        items: currentCart,
        total: orderTotal,
        paymentMode,
        staffId: currentUser?.username || 'unknown',
        staffName: currentUser?.name || 'unknown',
        outletId: settings.outletId || 'main_outlet',
        ...extraOrderFields
      });

      // Write audit log for order created
      await db.addAuditLog({
        action: 'orderCreated',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: currentUser?.role || 'staff',
        targetId: createdOrder.id,
        outletId: settings.outletId || 'main_outlet',
        after: { total: orderTotal, paymentMode, tableNumber: activeTable }
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

      addToast(`Order sent successfully for ${activeTable === 'Self' ? 'Self Service' : `Table ${activeTable}`}!`, 'success');
      setIsSubmittingOrder(false);
      return true;
    } catch (err: any) {
      console.error("Confirm order failed:", err);
      addToast(err.message || 'Failed to place order.', 'error');
      setIsSubmittingOrder(false);
      return false;
    }
  };

  // Owner Operations
  const toggleMenuItem = async (itemId: string) => {
    if (isDemoSession) {
      addToast('Demo Mode: Toggling menu item availability is restricted in the preview sandbox.', 'warning');
      return;
    }
    try {
      await db.toggleMenuAvailability(itemId);
      addToast('Menu item availability updated', 'success');
    } catch {
      addToast('Failed to update availability', 'error');
    }
  };

  const updateOrderStatus = async (orderId: string, status: 'pending' | 'completed' | 'cancelled') => {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      addToast('Order not found.', 'error');
      return;
    }

    if (order.orderStatus === 'cancelled') {
      addToast('Cancelled orders cannot be completed or modified.', 'error');
      return;
    }

    try {
      if (status === 'cancelled' && order.paymentMode === 'tokens' && order.tokenCardNo && order.tokensDeducted) {
        const studentCard = tokens.find(t => t.cardNo === order.tokenCardNo);
        if (studentCard) {
          await db.refundTokensTransaction(
            studentCard.id,
            order.tokensDeducted,
            order.total,
            orderId,
            auth.currentUser?.uid || 'local',
            currentUser?.role || 'owner'
          );
        } else {
          console.warn(`Card ${order.tokenCardNo} not found for refund. Proceeding with cancellation.`);
        }
      }

      await db.updateOrderStatus(orderId, status);

      await db.addAuditLog({
        action: status === 'completed' ? 'orderCompleted' : status === 'cancelled' ? 'orderCancelled' : 'orderCreated',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: currentUser?.role || 'owner',
        targetId: orderId,
        outletId: settings.outletId || 'main_outlet',
        before: { orderStatus: order.orderStatus },
        after: { orderStatus: status }
      });

      addToast(`Order ${orderId} marked as ${status}`, 'success');
    } catch (err: any) {
      console.error("Failed to update order status:", err);
      addToast(err.message || 'Failed to update order status.', 'error');
    }
  };

  const createNewStaff = async (account: Omit<StaffAccount, 'id' | 'status'>): Promise<boolean> => {
    if (isDemoSession) {
      addToast('Demo Mode: Creating new staff profiles is restricted in the preview sandbox.', 'warning');
      return false;
    }
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
        const staffDocData: any = {
          name: account.name,
          emailOrPhone: account.emailOrPhone,
          username: account.username.trim().toLowerCase(),
          status: 'active',
          outletId: settings.outletId || 'main_outlet'
        };
        if (process.env.NODE_ENV !== 'production') {
          staffDocData.password = await hashPassword(account.password);
        }

        const createdStaff = await db.addStaffWithId(cred.user.uid, staffDocData);

        // Write audit log for staff created
        await db.addAuditLog({
          action: 'staffCreated',
          actorUid: auth.currentUser?.uid || 'local',
          actorRole: 'owner',
          targetId: createdStaff.id,
          outletId: settings.outletId || 'main_outlet',
          after: { username: account.username, name: account.name }
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
      const hashedPass = await hashPassword(account.password);
      const createdStaff = await db.addStaff({
        ...account,
        password: hashedPass,
        status: 'active',
        outletId: settings.outletId || 'main_outlet'
      });

      // Write audit log for staff created
      await db.addAuditLog({
        action: 'staffCreated',
        actorUid: 'local',
        actorRole: 'owner',
        targetId: createdStaff.id,
        outletId: settings.outletId || 'main_outlet',
        after: { username: account.username, name: account.name }
      });

      addToast(`Staff account for ${account.name} created!`, 'success');
      return true;
    }
  };

  const toggleStaff = async (staffId: string) => {
    if (isDemoSession) {
      addToast('Demo Mode: Modifying staff profiles is restricted in the preview sandbox.', 'warning');
      return;
    }
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return;
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await db.toggleStaffStatus(staffId);
      
      await db.addAuditLog({
        action: newStatus === 'inactive' ? 'staffDeactivated' : 'staffCreated',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: staffId,
        outletId: settings.outletId || 'main_outlet',
        before: { status: staff.status },
        after: { status: newStatus }
      });

      addToast('Staff status changed', 'success');
    } catch {
      addToast('Failed to update staff status', 'error');
    }
  };

  const removeStaff = async (staffId: string) => {
    if (isDemoSession) {
      addToast('Demo Mode: Deleting staff profiles is restricted in the preview sandbox.', 'warning');
      return;
    }
    try {
      await db.deleteStaff(staffId);

      await db.addAuditLog({
        action: 'staffRemoved',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: staffId,
        outletId: settings.outletId || 'main_outlet'
      });

      addToast('Staff account deleted', 'success');
    } catch {
      addToast('Failed to delete staff account', 'error');
    }
  };

  // Menu Management Operations
  const createNewMenuItem = async (item: Omit<MenuItem, 'id' | 'available'>): Promise<MenuItem | null> => {
    if (isDemoSession) {
      addToast('Demo Mode: Creating new menu items is restricted in the preview sandbox.', 'warning');
      return null;
    }
    try {
      const newItem = await db.addMenuItem({
        ...item,
        outletId: settings.outletId || 'main_outlet'
      });

      await db.addAuditLog({
        action: 'menuItemCreated',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: newItem.id,
        outletId: settings.outletId || 'main_outlet',
        after: { name: newItem.name, price: newItem.price }
      });

      addToast(`Menu item "${item.name}" created successfully!`, 'success');
      return newItem;
    } catch {
      addToast('Failed to create menu item', 'error');
      return null;
    }
  };

  const removeMenuItem = async (itemId: string) => {
    if (isDemoSession) {
      addToast('Demo Mode: Deleting menu items is restricted in the preview sandbox.', 'warning');
      return;
    }
    try {
      await db.deleteMenuItem(itemId);

      await db.addAuditLog({
        action: 'menuItemDeleted',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: itemId,
        outletId: settings.outletId || 'main_outlet'
      });

      addToast('Menu item deleted successfully', 'success');
    } catch {
      addToast('Failed to delete menu item', 'error');
    }
  };

  const updateMenuItem = async (itemId: string, updatedFields: Partial<Omit<MenuItem, 'id'>>): Promise<boolean> => {
    if (isDemoSession) {
      addToast('Demo Mode: Modifying menu items is restricted in the preview sandbox.', 'warning');
      return false;
    }
    try {
      const itemBefore = menu.find(m => m.id === itemId);
      await db.updateMenuItem(itemId, updatedFields);

      await db.addAuditLog({
        action: 'menuItemUpdated',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: itemId,
        outletId: settings.outletId || 'main_outlet',
        before: itemBefore ? { price: itemBefore.price, available: itemBefore.available } : null,
        after: updatedFields
      });

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

    // Staff monthly limit check
    if (currentUser?.role === 'staff') {
      const staffProfile = staffList.find(s => s.username === currentUser.username);
      const limit = staffProfile?.monthlyTokenLimit ?? 1005; // default fallback if missing
      
      const now = new Date();
      const currentMonthTxs = tokenTransactions.filter(tx => {
        if (tx.soldBy !== currentUser.username) return false;
        if (tx.type !== 'recharge') return false;
        const txDate = new Date(tx.createdAt);
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      });
      const currentMonthTokensSold = currentMonthTxs.reduce((sum, tx) => sum + tx.tokens, 0);

      if (currentMonthTokensSold + account.tokens > limit) {
        addToast(`Provision exceeds monthly limit! Allowed remaining: ${(limit - currentMonthTokensSold).toFixed(0)} tokens`, 'error');
        return false;
      }
    }

    try {
      const createdCard = await db.addTokenAccount({
        ...account,
        outletId: settings.outletId || 'main_outlet'
      });
      
      // Log transaction if card was initialized with tokens
      if (account.tokens > 0) {
        await db.addTokenTransaction({
          type: 'recharge',
          studentId: createdCard.id,
          studentName: createdCard.name,
          cardNo: createdCard.cardNo,
          tokens: account.tokens,
          amount: account.tokens * settings.tokenValueInRupees,
          soldBy: currentUser?.username || 'unknown',
          outletId: settings.outletId || 'main_outlet'
        });

        // Audit Log for token recharged on create
        await db.addAuditLog({
          action: 'tokenRecharged',
          actorUid: auth.currentUser?.uid || 'local',
          actorRole: currentUser?.role || 'owner',
          targetId: createdCard.id,
          outletId: settings.outletId || 'main_outlet',
          after: { tokens: account.tokens }
        });
      }
      addToast(`Token card for ${account.name} created!`, 'success');
      return true;
    } catch {
      addToast('Failed to create token card.', 'error');
      return false;
    }
  };

  const updateToken = async (tokenId: string, updatedFields: Partial<Omit<TokenAccount, 'id'>>): Promise<boolean> => {
    if (isDemoSession) {
      addToast('Demo Mode: Modifying token card configurations is restricted in the preview sandbox.', 'warning');
      return false;
    }
    // SECURITY: Only the owner can directly update a token account.
    // Staff must go through sellTokens() which enforces monthly limits.
    if (currentUser?.role !== 'owner') {
      addToast('Permission denied: only the owner can edit token accounts directly.', 'error');
      return false;
    }

    // If card number is being changed, ensure it remains unique
    if (updatedFields.cardNo) {
      const exists = tokens.some(t => t.id !== tokenId && t.cardNo === updatedFields.cardNo);
      if (exists) {
        addToast(`Token card number #${updatedFields.cardNo} already exists.`, 'error');
        return false;
      }
    }

    try {
      const tokenBefore = tokens.find(t => t.id === tokenId);
      await db.updateTokenAccount(tokenId, { ...updatedFields, updatedAt: new Date().toISOString() });
      
      await db.addAuditLog({
        action: 'tokenAdjusted',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: tokenId,
        outletId: settings.outletId || 'main_outlet',
        before: tokenBefore ? { tokens: tokenBefore.tokens, cardNo: tokenBefore.cardNo } : null,
        after: updatedFields
      });

      addToast('Token card updated successfully!', 'success');
      return true;
    } catch {
      addToast('Failed to update token card.', 'error');
      return false;
    }
  };

  const removeToken = async (tokenId: string): Promise<boolean> => {
    if (isDemoSession) {
      addToast('Demo Mode: Deleting token accounts is restricted in the preview sandbox.', 'warning');
      return false;
    }
    try {
      await db.deleteTokenAccount(tokenId);
      addToast('Token card deleted successfully.', 'success');
      return true;
    } catch {
      addToast('Failed to delete token card.', 'error');
      return false;
    }
  };

  const sellTokens = async (studentId: string, tokensToAdd: number, amountPaid: number): Promise<boolean> => {
    // Staff monthly limit check
    if (currentUser?.role === 'staff') {
      const staffProfile = staffList.find(s => s.username === currentUser.username);
      const limit = staffProfile?.monthlyTokenLimit ?? 1000;
      
      const now = new Date();
      const currentMonthTxs = tokenTransactions.filter(tx => {
        if (tx.soldBy !== currentUser.username) return false;
        if (tx.type !== 'recharge') return false;
        const txDate = new Date(tx.createdAt);
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      });
      const currentMonthTokensSold = currentMonthTxs.reduce((sum, tx) => sum + tx.tokens, 0);

      if (currentMonthTokensSold + tokensToAdd > limit) {
        addToast(`Sale exceeds monthly limit! Allowed remaining: ${(limit - currentMonthTokensSold).toFixed(0)} tokens`, 'error');
        return false;
      }
    }

    try {
      const studentCard = tokens.find(t => t.id === studentId);
      if (!studentCard) {
        addToast('Student card not found.', 'error');
        return false;
      }

      await db.rechargeTokensTransaction(
        studentId,
        tokensToAdd,
        amountPaid,
        currentUser?.username || 'unknown',
        auth.currentUser?.uid || 'local',
        currentUser?.role || 'staff'
      );

      addToast(`Successfully sold ${tokensToAdd} tokens to ${studentCard.name}!`, 'success');
      return true;
    } catch (error: any) {
      console.error("Failed to sell tokens:", error);
      addToast(error.message || 'Failed to complete token sale.', 'error');
      return false;
    }
  };

  const updateStaffLimit = async (staffId: string, limit: number): Promise<boolean> => {
    if (isDemoSession) {
      addToast('Demo Mode: Modifying staff token limits is restricted in the preview sandbox.', 'warning');
      return false;
    }
    // SECURITY: Only the owner can change staff token limits.
    if (currentUser?.role !== 'owner') {
      addToast('Permission denied: only the owner can update staff limits.', 'error');
      return false;
    }
    try {
      const staffBefore = staffList.find(s => s.id === staffId);
      await db.updateStaffAccount(staffId, { monthlyTokenLimit: limit });

      await db.addAuditLog({
        action: 'monthlyLimitChanged',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: staffId,
        outletId: settings.outletId || 'main_outlet',
        before: { monthlyTokenLimit: staffBefore?.monthlyTokenLimit },
        after: { monthlyTokenLimit: limit }
      });

      addToast('Staff monthly token limit updated successfully!', 'success');
      return true;
    } catch (err) {
      console.error("Failed to update staff limit:", err);
      addToast('Failed to update staff limit.', 'error');
      return false;
    }
  };

  const adjustTokens = async (studentId: string, targetTokens: number, reason: string): Promise<boolean> => {
    if (isDemoSession) {
      addToast('Demo Mode: Direct manual token balance adjustments are restricted in the preview sandbox.', 'warning');
      return false;
    }
    if (currentUser?.role !== 'owner') {
      addToast('Permission denied: only the owner can adjust balances manually.', 'error');
      return false;
    }
    try {
      const studentCard = tokens.find(t => t.id === studentId);
      if (!studentCard) {
        addToast('Student card not found.', 'error');
        return false;
      }

      await db.adjustTokensTransaction(
        studentId,
        targetTokens,
        studentCard.balanceRupees || 0,
        reason,
        auth.currentUser?.uid || 'local',
        'owner'
      );
      addToast('Token balance adjusted successfully!', 'success');
      return true;
    } catch (err: any) {
      console.error("Failed to adjust tokens:", err);
      addToast(err.message || 'Failed to adjust tokens.', 'error');
      return false;
    }
  };

  const updateSettings = async (updatedFields: Partial<Settings>): Promise<boolean> => {
    if (isDemoSession) {
      addToast('Demo Mode: Modifying global settings is restricted in the preview sandbox.', 'warning');
      return false;
    }
    if (currentUser?.role !== 'owner') {
      addToast('Permission denied: only the owner can update settings.', 'error');
      return false;
    }
    try {
      const originalSettings = { ...settings };
      await db.updateSettings(updatedFields);

      // Audit Log settings update
      await db.addAuditLog({
        action: 'settingsUpdated',
        actorUid: auth.currentUser?.uid || 'local',
        actorRole: 'owner',
        targetId: 'settings_default',
        outletId: settings.outletId || 'main_outlet',
        before: originalSettings,
        after: { ...originalSettings, ...updatedFields }
      });

      addToast('Settings updated successfully!', 'success');
      return true;
    } catch (err: any) {
      console.error("Failed to update settings:", err);
      addToast(err.message || 'Failed to update settings.', 'error');
      return false;
    }
  };

  const syncDataToCloud = async (): Promise<boolean> => {
    db.resetFirebaseBlocked();
    const isConfigured = db.isFirebaseConfigured();
    setUsingFirebase(isConfigured);

    if (!isConfigured) {
      addToast('Cannot sync: Firebase is not configured in environment variables.', 'error');
      return false;
    }

    addToast('Starting database synchronization...', 'info');

    try {
      const stats = await db.syncLocalStorageToFirestore();
      
      let summaryMsg = 'Sync complete: ';
      const parts = [];
      if (stats.settings > 0) parts.push(`${stats.settings} settings`);
      if (stats.menu > 0) parts.push(`${stats.menu} menu items`);
      if (stats.staff > 0) parts.push(`${stats.staff} staff`);
      if (stats.tokens > 0) parts.push(`${stats.tokens} tokens`);
      if (stats.transactions > 0) parts.push(`${stats.transactions} transactions`);
      if (stats.orders > 0) parts.push(`${stats.orders} orders`);
      if (stats.auditLogs > 0) parts.push(`${stats.auditLogs} audit logs`);
      
      if (parts.length > 0) {
        summaryMsg += parts.join(', ');
      } else {
        summaryMsg += 'database is already up to date.';
      }

      if (stats.errors.length > 0) {
        addToast(`${summaryMsg} (with some write restrictions)`, 'warning');
      } else {
        addToast(summaryMsg, 'success');
      }
      return true;
    } catch (err: any) {
      console.error("Sync data failed:", err);
      addToast(err.message || 'Synchronization failed.', 'error');
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
        tokenTransactions,
        settings,
        auditLogs,
        usingFirebase,
        syncDataToCloud,
        currentUser,
        activeTable,
        tableCarts,
        toasts,
        login,
        logout,
        updateProfile,
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
        updateStaffLimit,
        createNewMenuItem,
        removeMenuItem,
        updateMenuItem,
        createNewToken,
        updateToken,
        removeToken,
        sellTokens,
        adjustTokens,
        updateSettings,
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
                                <XIcon size={14} weight="bold" />
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
