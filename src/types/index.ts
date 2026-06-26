export interface User {
  id: string;
  name: string;
  role: 'staff' | 'owner';
  status: 'active' | 'inactive';
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  description?: string;
  prepTime?: string;
  tags?: ('spicy' | 'veg' | 'popular' | 'new')[];
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: CartItem[];
  total: number;
  paymentMode: 'cash' | 'online' | 'tokens';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'completed' | 'cancelled';
  staffId: string;
  staffName: string;
  createdAt: string;
  completedAt?: string;
  tokenCardNo?: string;
  studentName?: string;
  tokensDeducted?: number;
}

export interface StaffAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  username: string;
  password: string;
  status: 'active' | 'inactive';
  role?: 'staff' | 'owner';
  monthlyTokenLimit?: number;
}

export interface TokenAccount {
  id: string;
  name: string;
  cardNo: string; // 3 digit card number
  tokens: number; // Balance of tokens (1 token = ₹30)
  createdAt: string;
}

export interface TokenTransaction {
  id: string;
  studentId: string;
  studentName: string;
  cardNo: string;
  tokens: number; // Tokens added (positive)
  amount: number; // Rupees paid (tokens * 30)
  soldBy: string; // Username/name of the staff who sold it
  createdAt: string;
}

