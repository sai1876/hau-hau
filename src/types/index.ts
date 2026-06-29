// =============================================================================
// Hau-Hau POS — TypeScript Type Definitions
// =============================================================================

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
  outletId?: string;
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
  /**
   * TODO (security): staffId currently stores the username string.
   * Migrate to Firebase Auth UID so it can be validated by Firestore rules
   * (request.resource.data.staffId == request.auth.uid).
   */
  staffId: string;
  staffName: string;
  createdAt: string;
  completedAt?: string;
  tokenCardNo?: string;
  studentName?: string;
  tokensDeducted?: number;
  creditApplied?: number;
  creditReturned?: number;
  outletId?: string;
  isDemo?: boolean;
}

export interface StaffAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  username: string;
  /**
   * TODO (security): The `password` field should NOT be stored in Firestore in production.
   * Firebase Authentication manages passwords. This field is retained ONLY for the
   * localStorage development fallback mode. Remove it from all Firestore documents
   * before going live with real users.
   */
  password: string;
  status: 'active' | 'inactive';
  role?: 'staff' | 'owner';
  monthlyTokenLimit?: number;
  outletId?: string;
  isDemo?: boolean;
}

export interface TokenAccount {
  id: string;
  name: string;
  /**
   * Unique card identifier. The owner can decide the length: 3 to 6 digits.
   * Must be numeric and unique across all token accounts.
   * Example: "001", "10042", "123456"
   * Cards that have been deleted must never have their card number reused.
   */
  cardNo: string;
  /**
   * Current token balance. 1 Token = ₹30.
   * Must never go below 0. Balance updates should be performed using
   * Firestore atomic transactions to prevent race conditions.
   * TODO: Migrate balance updates to a Cloud Function for atomicity.
   */
  tokens: number;
  /** Stores overpayment credit (change) in Rupees for physical token payments. */
  balanceRupees?: number;
  createdAt: string;
  /** Timestamp of the last balance update, set on every recharge or deduction. */
  updatedAt?: string;
  outletId?: string;
  isDemo?: boolean;
}

/**
 * Represents a single token ledger entry.
 *
 * Convention for the `tokens` field:
 *   - `recharge`: positive value — tokens were added to the account
 *   - `deduction`: positive value — tokens were deducted for a payment (record the magnitude)
 *   - `refund`: positive value — tokens were returned due to order cancellation
 *   - `adjustment`: positive or negative (owner manual correction)
 *
 * Use the `type` field, not the sign of `tokens`, to determine the direction of the change.
 * This makes the ledger easy to query and audit.
 */
export interface TokenTransaction {
  id: string;
  /**
   * Transaction type for auditability.
   * - `recharge` — tokens sold/added by staff (monthly limit applies)
   * - `deduction` — tokens used for a POS order payment
   * - `refund` — tokens returned when a token-paid order is cancelled
   * - `adjustment` — manual correction by owner
   */
  type: 'recharge' | 'deduction' | 'refund' | 'adjustment';
  studentId: string;
  studentName: string;
  cardNo: string;
  /** Magnitude of tokens involved (always positive — see type field for direction). */
  tokens: number;
  /** Rupee equivalent: tokens * 30 for recharges; order total for deductions. */
  amount: number;
  /** Username or name of the staff member who performed the action. */
  soldBy: string;
  /** Related order ID for deduction/refund transactions. */
  orderId?: string;
  createdAt: string;
  outletId?: string;
  isDemo?: boolean;
}

export interface AuditLog {
  id: string;
  action:
    | 'staffCreated'
    | 'staffDeactivated'
    | 'staffRemoved'
    | 'orderCreated'
    | 'orderCompleted'
    | 'orderCancelled'
    | 'menuItemCreated'
    | 'menuItemUpdated'
    | 'menuItemDeleted'
    | 'tokenRecharged'
    | 'tokenDeducted'
    | 'tokenRefunded'
    | 'tokenAdjusted'
    | 'monthlyLimitChanged'
    | 'settingsUpdated';
  actorUid: string;
  actorRole: 'staff' | 'owner' | 'system';
  targetId: string;
  outletId?: string;
  timestamp: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  isDemo?: boolean;
}

export interface Settings {
  id: string;
  outletId: string;
  outletName: string;
  tokenValueInRupees: number;
  manualUpiEnabled: boolean;
  taxEnabled: boolean;
  currency: string;
  receiptFooter: string;
  monthlyTokenLimitDefaults: number;
  orderStatusFlow: string[];
  updatedAt?: string;
}
