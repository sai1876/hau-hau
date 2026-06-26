import { firestore } from './firebase';
import { MenuItem, Order, StaffAccount } from '../types';
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

// Check if Firebase is actually configured with environment variables
export const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'undefined' &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'undefined'
  );
};

const DEFAULT_MENU: MenuItem[] = [
  { 
    id: 'm1', 
    name: 'Burger', 
    category: 'Burgers', 
    price: 8.00, 
    available: true,
    description: 'Classic flame-grilled beef patty, lettuce, tomato, house sauce',
    prepTime: '6-8 mins',
    tags: ['popular']
  },
  { 
    id: 'm2', 
    name: 'Cheese Burger', 
    category: 'Burgers', 
    price: 9.50, 
    available: true,
    description: 'Juicy beef patty, melted double cheddar, pickles, mustard, glaze',
    prepTime: '6-8 mins',
    tags: ['popular']
  },
  { 
    id: 'm3', 
    name: 'Veg Burger', 
    category: 'Burgers', 
    price: 7.50, 
    available: true,
    description: 'Handcrafted spiced lentil & veggie patty, avocado spread, arugula',
    prepTime: '8-10 mins',
    tags: ['veg']
  },
  { 
    id: 'm4', 
    name: 'Fries', 
    category: 'Sides', 
    price: 3.00, 
    available: true,
    description: 'Crispy golden sea-salted skin-on potatoes',
    prepTime: '4-5 mins',
    tags: ['veg']
  },
  { 
    id: 'm5', 
    name: 'Masala Fries', 
    category: 'Sides', 
    price: 4.00, 
    available: true,
    description: 'Golden fries tossed in a spicy dry rub of aromatic Indian spices',
    prepTime: '4-5 mins',
    tags: ['spicy', 'veg']
  },
  { 
    id: 'm6', 
    name: 'Cold Coffee', 
    category: 'Drinks', 
    price: 4.50, 
    available: true,
    description: 'Chilled robust espresso blend whipped with creamy whole milk',
    prepTime: '2-3 mins',
    tags: []
  },
  { 
    id: 'm7', 
    name: 'Water Bottle', 
    category: 'Drinks', 
    price: 1.50, 
    available: true,
    description: 'Purified mineral spring water, chilled',
    prepTime: '1 min',
    tags: ['veg']
  },
  { 
    id: 'm8', 
    name: 'Combo Meal', 
    category: 'Combo', 
    price: 12.00, 
    available: true,
    description: 'Classic Burger, salted fries, and a chilled drink of choice',
    prepTime: '8-10 mins',
    tags: ['popular']
  }
];

const DEFAULT_STAFF: StaffAccount[] = [
  {
    id: 's1',
    name: 'Alex Johnson',
    emailOrPhone: 'alex@hauhau.com',
    username: 'staff',
    password: 'staff',
    status: 'active'
  }
];

export const db = {
  isFirebaseConfigured,
  // Initialize Database (for LocalStorage mode)
  init(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(MENU_KEY)) {
      localStorage.setItem(MENU_KEY, JSON.stringify(DEFAULT_MENU));
    }
    if (!localStorage.getItem(STAFF_KEY)) {
      localStorage.setItem(STAFF_KEY, JSON.stringify(DEFAULT_STAFF));
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
      localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
    }
  },

  // --- Real-time subscriptions ---
  subscribeMenu(callback: (menu: MenuItem[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const menuCol = collection(firestore, 'menu');
      return onSnapshot(menuCol, (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed Firestore if empty
          DEFAULT_MENU.forEach((item) => {
            setDoc(doc(firestore, 'menu', item.id), item);
          });
          callback(DEFAULT_MENU);
        } else {
          const menuItems: MenuItem[] = [];
          snapshot.forEach((doc) => {
            menuItems.push(doc.data() as MenuItem);
          });
          callback(menuItems);
        }
      });
    } else {
      // LocalStorage mode
      this.init();
      const load = () => {
        const menu = localStorage.getItem(MENU_KEY);
        callback(menu ? JSON.parse(menu) : DEFAULT_MENU);
      };
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }
  },

  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const ordersCol = collection(firestore, 'orders');
      const ordersQuery = query(ordersCol, orderBy('createdAt', 'desc'));
      return onSnapshot(ordersQuery, (snapshot) => {
        const ordersList: Order[] = [];
        snapshot.forEach((doc) => {
          ordersList.push(doc.data() as Order);
        });
        callback(ordersList);
      });
    } else {
      // LocalStorage mode
      this.init();
      const load = () => {
        const orders = localStorage.getItem(ORDERS_KEY);
        callback(orders ? JSON.parse(orders) : []);
      };
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }
  },

  subscribeStaff(callback: (staff: StaffAccount[]) => void): () => void {
    if (isFirebaseConfigured()) {
      const staffCol = collection(firestore, 'staff');
      return onSnapshot(staffCol, (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed
          DEFAULT_STAFF.forEach((member) => {
            setDoc(doc(firestore, 'staff', member.id), member);
          });
          callback(DEFAULT_STAFF);
        } else {
          const staffList: StaffAccount[] = [];
          snapshot.forEach((doc) => {
            staffList.push(doc.data() as StaffAccount);
          });
          callback(staffList);
        }
      });
    } else {
      // LocalStorage mode
      this.init();
      const load = () => {
        const staff = localStorage.getItem(STAFF_KEY);
        callback(staff ? JSON.parse(staff) : DEFAULT_STAFF);
      };
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }
  },

  // --- Menu Write Operations ---
  async addMenuItem(item: Omit<MenuItem, 'id' | 'available'>): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: 'm_' + Math.random().toString(36).substr(2, 9),
      available: true
    };

    if (isFirebaseConfigured()) {
      await setDoc(doc(firestore, 'menu', newItem.id), newItem);
    } else {
      const menu = localStorage.getItem(MENU_KEY);
      const list = menu ? JSON.parse(menu) : DEFAULT_MENU;
      list.push(newItem);
      localStorage.setItem(MENU_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newItem;
  },

  async toggleMenuAvailability(itemId: string): Promise<void> {
    if (isFirebaseConfigured()) {
      const menuCol = collection(firestore, 'menu');
      // Fetch item first to get current availability
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
    } else {
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
    if (isFirebaseConfigured()) {
      await deleteDoc(doc(firestore, 'menu', itemId));
    } else {
      const menu = localStorage.getItem(MENU_KEY);
      const list: MenuItem[] = menu ? JSON.parse(menu) : DEFAULT_MENU;
      const updated = list.filter(item => item.id !== itemId);
      localStorage.setItem(MENU_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    }
  },

  async updateMenuItem(itemId: string, updatedFields: Partial<Omit<MenuItem, 'id'>>): Promise<void> {
    if (isFirebaseConfigured()) {
      await updateDoc(doc(firestore, 'menu', itemId), updatedFields);
    } else {
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

    if (isFirebaseConfigured()) {
      await setDoc(doc(firestore, 'staff', newAccount.id), newAccount);
    } else {
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

    if (isFirebaseConfigured()) {
      await setDoc(doc(firestore, 'staff', id), newAccount);
    } else {
      const staff = localStorage.getItem(STAFF_KEY);
      const list: StaffAccount[] = staff ? JSON.parse(staff) : DEFAULT_STAFF;
      list.push(newAccount);
      localStorage.setItem(STAFF_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newAccount;
  },

  async toggleStaffStatus(staffId: string): Promise<void> {
    if (isFirebaseConfigured()) {
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
    } else {
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
    if (isFirebaseConfigured()) {
      await deleteDoc(doc(firestore, 'staff', staffId));
    } else {
      const staff = localStorage.getItem(STAFF_KEY);
      const list: StaffAccount[] = staff ? JSON.parse(staff) : DEFAULT_STAFF;
      const updated = list.filter(s => s.id !== staffId);
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

    if (isFirebaseConfigured()) {
      await setDoc(doc(firestore, 'orders', newOrder.id), newOrder);
    } else {
      const orders = localStorage.getItem(ORDERS_KEY);
      const list: Order[] = orders ? JSON.parse(orders) : [];
      list.unshift(newOrder);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('storage'));
    }
    return newOrder;
  },

  async updateOrderStatus(orderId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<void> {
    if (isFirebaseConfigured()) {
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
    } else {
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
  }
};
