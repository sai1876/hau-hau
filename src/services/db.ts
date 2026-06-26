import { firestore } from './firebase';
import { MenuItem, Order, StaffAccount, TokenAccount, TokenTransaction } from '../types';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

const MENU_KEY = 'hau_hau_menu';
const STAFF_KEY = 'hau_hau_staff';
const ORDERS_KEY = 'hau_hau_orders';
const TOKENS_KEY = 'hau_hau_tokens';
const TRANSACTIONS_KEY = 'hau_hau_transactions';

let firebaseBlocked = false;

// Check if Firebase is actually configured with environment variables
export const isFirebaseConfigured = () => {
  if (firebaseBlocked) return false;
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'undefined' &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'undefined'
  );
};

export const markFirebaseBlocked = () => {
  if (!firebaseBlocked) {
    console.warn("Firebase/Firestore was blocked or failed to load. Falling back to LocalStorage mode.");
    firebaseBlocked = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firebase-fallback'));
    }
  }
};

const DEFAULT_MENU: MenuItem[] = [
  { 
    id: 'm1', 
    name: 'Veg Kurkure Momos', 
    category: 'Momos', 
    price: 80.00, 
    available: true,
    description: 'Crispy crunchy momos stuffed with spiced vegetables, coated in Kurkure crumbs',
    prepTime: '8-10 mins',
    tags: ['veg', 'popular']
  },
  { 
    id: 'm2', 
    name: 'French Fries', 
    category: 'Sides', 
    price: 60.00, 
    available: true,
    description: 'Crispy golden salted potato fries served with dip',
    prepTime: '4-5 mins',
    tags: ['veg']
  },
  { 
    id: 'm3', 
    name: 'Chicken Popcorn', 
    category: 'Snacks', 
    price: 90.00, 
    available: true,
    description: 'Bite-sized tender chicken pieces, marinated and deep fried to golden perfection',
    prepTime: '6-8 mins',
    tags: ['popular']
  },
  { 
    id: 'm4', 
    name: 'Chicken Leg Piece', 
    category: 'Snacks', 
    price: 100.00, 
    available: true,
    description: 'Juicy chicken drumsticks seasoned with Indian spices and deep fried',
    prepTime: '10-12 mins',
    tags: ['popular']
  },
  { 
    id: 'm5', 
    name: 'Veg Fingers', 
    category: 'Snacks', 
    price: 80.00, 
    available: true,
    description: 'Crispy crumb-coated vegetable fingers made with carrots, peas, and potatoes',
    prepTime: '5-6 mins',
    tags: ['veg']
  },
  { 
    id: 'm6', 
    name: 'Veg Nuggets', 
    category: 'Snacks', 
    price: 70.00, 
    available: true,
    description: 'Bite-sized crispy vegetable nuggets seasoned with herbs and spices',
    prepTime: '5-6 mins',
    tags: ['veg']
  },
  { 
    id: 'm7', 
    name: 'Plane Chocolate Milk Shake', 
    category: 'Drinks', 
    price: 79.00, 
    available: true,
    description: 'Classic thick and creamy milkshake blended with rich chocolate syrup',
    prepTime: '3-4 mins',
    tags: []
  },
  { 
    id: 'm8', 
    name: 'Oreo and Kitkat', 
    category: 'Drinks', 
    price: 89.00, 
    available: true,
    description: 'Indulgent thick shake loaded with crushed Oreo cookies and KitKat bars',
    prepTime: '4-5 mins',
    tags: ['popular']
  }
];

const DEFAULT_STAFF: StaffAccount[] = [
  {
    id: 's1',
    name: 'Alex Johnson',
    emailOrPhone: 'alex@hauhau.com',
    username: 'staff',
    password: '1562206543da764123c21bd524674f0a8aaf49c8a89744c97352fe677f7e4006', // SHA-256 for 'staff'
    status: 'active',
    role: 'staff',
    monthlyTokenLimit: 1000
  },
  {
    id: 'owner_default',
    name: 'Sarah (Owner)',
    emailOrPhone: 'owner@hauhau.com',
    username: 'owner',
    password: '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9', // SHA-256 for 'owner123'
    status: 'active',
    role: 'owner'
  }
];

export const db = {
  isFirebaseConfigured,
  markFirebaseBlocked,
  // Initialize Database (for LocalStorage mode)
  init(): void {
    if (typeof window === 'undefined') return;

    // Check if the current items in LocalStorage are the old mock items, if so reset to DEFAULT_MENU
    const existingMenu = localStorage.getItem(MENU_KEY);
    if (existingMenu) {
      try {
        const parsed = JSON.parse(existingMenu) as MenuItem[];
        const hasOldItem = parsed.some(item => item.name === 'Burger' || item.name === 'Cheese Burger');
        if (hasOldItem) {
          localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU));
        }
      } catch {
        localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU));
      }
    } else {
      localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU));
    }

    if (!localStorage.getItem(STAFF_KEY)) {
      localStorage.setItem(STAFF_KEY, JSON.stringify(DEFAULT_STAFF));
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(TOKENS_KEY)) {
      localStorage.setItem(TOKENS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(TRANSACTIONS_KEY)) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    }
  },

  // --- LocalStorage Subscriptions Helpers ---
  subscribeLocalStorageMenu(callback: (menu: MenuItem[]) => void): () => void {
    this.init();
    const load = () => {
      const menu = localStorage.getItem(MENU_KEY);
      callback(menu ? JSON.parse(menu) : DEFAULT_MENU);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  },

  subscribeLocalStorageOrders(callback: (orders: Order[]) => void): () => void {
    this.init();
    const load = () => {
      const orders = localStorage.getItem(ORDERS_KEY);
      callback(orders ? JSON.parse(orders) : []);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  },

  subscribeLocalStorageStaff(callback: (staff: StaffAccount[]) => void): () => void {
    this.init();
    const load = () => {
      const staff = localStorage.getItem(STAFF_KEY);
      callback(staff ? JSON.parse(staff) : DEFAULT_STAFF);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  },

  subscribeLocalStorageTokens(callback: (tokens: TokenAccount[]) => void): () => void {
    this.init();
    const load = () => {
      const tokens = localStorage.getItem(TOKENS_KEY);
      callback(tokens ? JSON.parse(tokens) : []);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  },

  subscribeLocalStorageTransactions(callback: (txs: TokenTransaction[]) => void): () => void {
    this.init();
    const load = () => {
      const txs = localStorage.getItem(TRANSACTIONS_KEY);
      callback(txs ? JSON.parse(txs) : []);
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  },

  // --- Real-time subscriptions ---
  subscribeMenu(callback: (menu: MenuItem[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const menuCol = collection(firestore, 'menu');
      let isUnsubscribed = false;
      let localUnsub = () => {};
      const firestoreUnsub = onSnapshot(menuCol, (snapshot) => {
        if (isUnsubscribed) return;
        if (snapshot.empty) {
          // Auto-seed Firestore if empty
          DEFAULT_MENU.forEach((item) => {
            setDoc(doc(firestore, 'menu', item.id), item).catch(() => {});
          });
          callback(DEFAULT_MENU);
        } else {
          const menuItems: MenuItem[] = [];
          snapshot.forEach((doc) => {
            menuItems.push(doc.data() as MenuItem);
          });
          callback(menuItems);
        }
      }, (error) => {
        console.warn("Firestore menu subscription failed/blocked. Falling back to LocalStorage.", error);
        this.markFirebaseBlocked();
        if (!isUnsubscribed) {
          localUnsub = this.subscribeLocalStorageMenu(callback);
        }
      });
      return () => {
        isUnsubscribed = true;
        firestoreUnsub();
        localUnsub();
      };
    } else {
      return this.subscribeLocalStorageMenu(callback);
    }
  },

  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const ordersCol = collection(firestore, 'orders');
      const ordersQuery = query(ordersCol, orderBy('createdAt', 'desc'));
      let isUnsubscribed = false;
      let localUnsub = () => {};
      const firestoreUnsub = onSnapshot(ordersQuery, (snapshot) => {
        if (isUnsubscribed) return;
        const ordersList: Order[] = [];
        snapshot.forEach((doc) => {
          ordersList.push(doc.data() as Order);
        });
        callback(ordersList);
      }, (error) => {
        console.warn("Firestore orders subscription failed/blocked. Falling back to LocalStorage.", error);
        this.markFirebaseBlocked();
        if (!isUnsubscribed) {
          localUnsub = this.subscribeLocalStorageOrders(callback);
        }
      });
      return () => {
        isUnsubscribed = true;
        firestoreUnsub();
        localUnsub();
      };
    } else {
      return this.subscribeLocalStorageOrders(callback);
    }
  },

  subscribeStaff(callback: (staff: StaffAccount[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const staffCol = collection(firestore, 'staff');
      let isUnsubscribed = false;
      let localUnsub = () => {};
      const firestoreUnsub = onSnapshot(staffCol, (snapshot) => {
        if (isUnsubscribed) return;
        if (snapshot.empty) {
          // Auto-seed
          DEFAULT_STAFF.forEach((member) => {
            setDoc(doc(firestore, 'staff', member.id), member).catch(() => {});
          });
          callback(DEFAULT_STAFF);
        } else {
          const staffList: StaffAccount[] = [];
          snapshot.forEach((doc) => {
            staffList.push(doc.data() as StaffAccount);
          });
          callback(staffList);
        }
      }, (error) => {
        console.warn("Firestore staff subscription failed/blocked. Falling back to LocalStorage.", error);
        this.markFirebaseBlocked();
        if (!isUnsubscribed) {
          localUnsub = this.subscribeLocalStorageStaff(callback);
        }
      });
      return () => {
        isUnsubscribed = true;
        firestoreUnsub();
        localUnsub();
      };
    } else {
      return this.subscribeLocalStorageStaff(callback);
    }
  },
  
  subscribeTokens(callback: (tokens: TokenAccount[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const tokensCol = collection(firestore, 'tokens');
      let isUnsubscribed = false;
      let localUnsub = () => {};
      const firestoreUnsub = onSnapshot(tokensCol, (snapshot) => {
        if (isUnsubscribed) return;
        const tokensList: TokenAccount[] = [];
        snapshot.forEach((doc) => {
          tokensList.push(doc.data() as TokenAccount);
        });
        callback(tokensList);
      }, (error) => {
        console.warn("Firestore tokens subscription failed/blocked. Falling back to LocalStorage.", error);
        this.markFirebaseBlocked();
        if (!isUnsubscribed) {
          localUnsub = this.subscribeLocalStorageTokens(callback);
        }
      });
      return () => {
        isUnsubscribed = true;
        firestoreUnsub();
        localUnsub();
      };
    } else {
      return this.subscribeLocalStorageTokens(callback);
    }
  },

  subscribeTokenTransactions(callback: (txs: TokenTransaction[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const txsCol = collection(firestore, 'token_transactions');
      const txsQuery = query(txsCol, orderBy('createdAt', 'desc'));
      let isUnsubscribed = false;
      let localUnsub = () => {};
      const firestoreUnsub = onSnapshot(txsQuery, (snapshot) => {
        if (isUnsubscribed) return;
        const txsList: TokenTransaction[] = [];
        snapshot.forEach((doc) => {
          txsList.push(doc.data() as TokenTransaction);
        });
        callback(txsList);
      }, (error) => {
        console.warn("Firestore transactions subscription failed/blocked. Falling back to LocalStorage.", error);
        this.markFirebaseBlocked();
        if (!isUnsubscribed) {
          localUnsub = this.subscribeLocalStorageTransactions(callback);
        }
      });
      return () => {
        isUnsubscribed = true;
        firestoreUnsub();
        localUnsub();
      };
    } else {
      return this.subscribeLocalStorageTransactions(callback);
    }
  },

  async addTokenTransaction(tx: Omit<TokenTransaction, 'id' | 'createdAt'>): Promise<TokenTransaction> {
    const newTx: TokenTransaction = {
      ...tx,
      id: 'tx_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(firestore, 'token_transactions', newTx.id), newTx);
      } catch (error) {
        console.error("Firestore addTokenTransaction failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const txs = localStorage.getItem(TRANSACTIONS_KEY);
      const list: TokenTransaction[] = txs ? JSON.parse(txs) : [];
      list.unshift(newTx);
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newTx;
  },

  // --- Menu Write Operations ---
  async addMenuItem(item: Omit<MenuItem, 'id' | 'available'>): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      available: true
    };

    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(firestore, 'menu', newItem.id), newItem);
      } catch (error) {
        console.error("Firestore addMenuItem failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const menu = localStorage.getItem(MENU_KEY);
      const list = menu ? JSON.parse(menu) : DEFAULT_MENU;
      list.push(newItem);
      localStorage.setItem(MENU_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newItem;
  },

  async toggleMenuAvailability(itemId: string): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        const menuCol = collection(firestore, 'menu');
        const snapshot = await getDocs(menuCol);
        let currentItem: MenuItem | null = null;
        snapshot.forEach((doc) => {
          if (doc.id === itemId) {
            currentItem = doc.data() as MenuItem;
          }
        });
        if (currentItem) {
          await updateDoc(doc(firestore, 'menu', itemId), {
            available: !(currentItem as MenuItem).available
          });
        }
      } catch (error) {
        console.error("Firestore toggleMenuAvailability failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const menu = localStorage.getItem(MENU_KEY);
      const list: MenuItem[] = menu ? JSON.parse(menu) : DEFAULT_MENU;
      const updated = list.map(item => 
        item.id === itemId ? { ...item, available: !item.available } : item
      );
      localStorage.setItem(MENU_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(firestore, 'menu', itemId));
      } catch (error) {
        console.error("Firestore deleteMenuItem failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const menu = localStorage.getItem(MENU_KEY);
      const list: MenuItem[] = menu ? JSON.parse(menu) : DEFAULT_MENU;
      const updated = list.filter(item => item.id !== itemId);
      localStorage.setItem(MENU_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async updateMenuItem(itemId: string, updatedFields: Partial<Omit<MenuItem, 'id'>>): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(firestore, 'menu', itemId), updatedFields);
      } catch (error) {
        console.error("Firestore updateMenuItem failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const menu = localStorage.getItem(MENU_KEY);
      const list: MenuItem[] = menu ? JSON.parse(menu) : DEFAULT_MENU;
      const updated = list.map(item => 
        item.id === itemId ? { ...item, ...updatedFields } : item
      );
      localStorage.setItem(MENU_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // --- Staff Write Operations ---
  async addStaff(account: Omit<StaffAccount, 'id'>): Promise<StaffAccount> {
    const newAccount: StaffAccount = {
      ...account,
      id: 's_' + Math.random().toString(36).substr(2, 9)
    };

    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(firestore, 'staff', newAccount.id), newAccount);
      } catch (error) {
        console.error("Firestore addStaff failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const staff = localStorage.getItem(STAFF_KEY);
      const list: StaffAccount[] = staff ? JSON.parse(staff) : DEFAULT_STAFF;
      list.push(newAccount);
      localStorage.setItem(STAFF_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newAccount;
  },

  async addStaffWithId(id: string, account: Omit<StaffAccount, 'id'>): Promise<StaffAccount> {
    const newAccount: StaffAccount = {
      ...account,
      id
    };

    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(firestore, 'staff', id), newAccount);
      } catch (error) {
        console.error("Firestore addStaffWithId failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const staff = localStorage.getItem(STAFF_KEY);
      const list: StaffAccount[] = staff ? JSON.parse(staff) : DEFAULT_STAFF;
      list.push(newAccount);
      localStorage.setItem(STAFF_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newAccount;
  },

  async toggleStaffStatus(staffId: string): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        const staffCol = collection(firestore, 'staff');
        const snapshot = await getDocs(staffCol);
        let currentStaff: StaffAccount | null = null;
        snapshot.forEach((doc) => {
          if (doc.id === staffId) {
            currentStaff = doc.data() as StaffAccount;
          }
        });
        if (currentStaff) {
          await updateDoc(doc(firestore, 'staff', staffId), {
            status: (currentStaff as StaffAccount).status === 'active' ? 'inactive' : 'active'
          });
        }
      } catch (error) {
        console.error("Firestore toggleStaffStatus failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const staff = localStorage.getItem(STAFF_KEY);
      const list: StaffAccount[] = staff ? JSON.parse(staff) : DEFAULT_STAFF;
      const updated = list.map(s => 
        s.id === staffId ? { ...s, status: s.status === 'active' ? 'inactive' as const : 'active' as const } : s
      );
      localStorage.setItem(STAFF_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async deleteStaff(staffId: string): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(firestore, 'staff', staffId));
      } catch (error) {
        console.error("Firestore deleteStaff failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const staff = localStorage.getItem(STAFF_KEY);
      const list: StaffAccount[] = staff ? JSON.parse(staff) : DEFAULT_STAFF;
      const updated = list.filter(s => s.id !== staffId);
      localStorage.setItem(STAFF_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async updateStaffAccount(staffId: string, updatedFields: Partial<Omit<StaffAccount, 'id'>>): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(firestore, 'staff', staffId), updatedFields);
      } catch (error) {
        console.error("Firestore updateStaffAccount failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const staff = localStorage.getItem(STAFF_KEY);
      const list: StaffAccount[] = staff ? JSON.parse(staff) : DEFAULT_STAFF;
      const updated = list.map(s => 
        s.id === staffId ? { ...s, ...updatedFields } : s
      );
      localStorage.setItem(STAFF_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // --- Orders Write Operations ---
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'orderStatus' | 'paymentStatus'>): Promise<Order> {
    const newOrder: Order = {
      ...orderData,
      id: 'HH-' + Math.floor(1000 + Math.random() * 9000),
      orderStatus: 'pending',
      paymentStatus: orderData.paymentMode === 'tokens' ? 'paid' : 'pending',
      createdAt: new Date().toISOString()
    };

    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(firestore, 'orders', newOrder.id), newOrder);
      } catch (error) {
        console.error("Firestore createOrder failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const orders = localStorage.getItem(ORDERS_KEY);
      const list: Order[] = orders ? JSON.parse(orders) : [];
      list.unshift(newOrder);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        const completedAt = status === 'completed' ? new Date().toISOString() : null;
        const paymentStatus = status === 'completed' ? 'paid' : 'pending';
        
        const updateData: Partial<Order> = {
          orderStatus: status,
          paymentStatus
        };
        if (completedAt) {
          updateData.completedAt = completedAt;
        }
        
        await updateDoc(doc(firestore, 'orders', orderId), updateData);
      } catch (error) {
        console.error("Firestore updateOrderStatus failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const orders = localStorage.getItem(ORDERS_KEY);
      const list: Order[] = orders ? JSON.parse(orders) : [];
      const updated = list.map(order => {
        if (order.id === orderId) {
          const completedAt = status === 'completed' ? new Date().toISOString() : order.completedAt;
          const paymentStatus = status === 'completed' ? 'paid' as const : order.paymentStatus;
          return { ...order, orderStatus: status, completedAt, paymentStatus };
        }
        return order;
      });
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  // --- Tokens Write Operations ---
  async addTokenAccount(account: Omit<TokenAccount, 'id' | 'createdAt'>): Promise<TokenAccount> {
    const newAccount: TokenAccount = {
      ...account,
      id: 't_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await setDoc(doc(firestore, 'tokens', newAccount.id), newAccount);
      } catch (error) {
        console.error("Firestore addTokenAccount failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const tokens = localStorage.getItem(TOKENS_KEY);
      const list: TokenAccount[] = tokens ? JSON.parse(tokens) : [];
      list.push(newAccount);
      localStorage.setItem(TOKENS_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newAccount;
  },

  async updateTokenAccount(tokenId: string, updatedFields: Partial<Omit<TokenAccount, 'id'>>): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await updateDoc(doc(firestore, 'tokens', tokenId), updatedFields);
      } catch (error) {
        console.error("Firestore updateTokenAccount failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const tokens = localStorage.getItem(TOKENS_KEY);
      const list: TokenAccount[] = tokens ? JSON.parse(tokens) : [];
      const updated = list.map(t => t.id === tokenId ? { ...t, ...updatedFields } : t);
      localStorage.setItem(TOKENS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async deleteTokenAccount(tokenId: string): Promise<void> {
    let useLocal = !isFirebaseConfigured();
    if (isFirebaseConfigured()) {
      try {
        await deleteDoc(doc(firestore, 'tokens', tokenId));
      } catch (error) {
        console.error("Firestore deleteTokenAccount failed, falling back to LocalStorage:", error);
        this.markFirebaseBlocked();
        useLocal = true;
      }
    }

    if (useLocal) {
      const tokens = localStorage.getItem(TOKENS_KEY);
      const list: TokenAccount[] = tokens ? JSON.parse(tokens) : [];
      const updated = list.filter(t => t.id !== tokenId);
      localStorage.setItem(TOKENS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  }
};
