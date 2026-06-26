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
}

export interface StaffAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  username: string;
  password: string;
  status: 'active' | 'inactive';
  role?: 'staff' | 'owner';
}
