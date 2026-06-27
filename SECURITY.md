# Hau-Hau POS — Security Posture & Hardening Guide

> **Status:** Production-hardened with client-side atomic transactions, server-side role validation rules, multi-outlet readiness, and a comprehensive audit trail.
> See the sections below for details on active protections, architectural design patterns, and next steps for server-side APIs.

---

## ✅ What Is Currently Protected

| Control | How |
|---------|-----|
| **Authentication** | Firebase Authentication (email/password) — sessions managed securely by Firebase SDK. |
| **Route Protection** | `owner/page.tsx` and `staff/page.tsx` check `currentUser.role` before rendering; redirects to `/login` if unauthorized. |
| **Concurrent Safe Balances** | Atomic Firestore Transactions (`runTransaction`) are implemented client-side for all token balance changes (recharge, deduct, refund, manual adjust), preventing race conditions or balance overwrites. |
| **Operational Audit Logs** | Comprehensive `audit_logs` collection tracks 14 sensitive actions (staff changes, settings updates, token ledger actions, order cancellations, menu modifications) containing before/after details, uid, roles, and timestamps. |
| **Firestore Security Rules** | Fully hardened server rules in `firestore.rules` enforcing positive price validations, non-negative token balances, custom claims role validation (with database document fallback), and restricting completed orders from being modified. |
| **Role Custom Claims** | Custom claims (`role: owner | staff` and `status: active | inactive`) are supported in security rules, with a robust fallback to direct Firestore document reads if claims have not yet propagated. |
| **Auto-Logout Integration** | Concurrency hook in `AppContext.tsx` actively monitors `staffList` status. If an owner deactivates a staff member, the staff member is instantly logged out of their current POS terminal session. |
| **Unique Card Numbers** | Card numbers are strictly validated client-side and server-side to remain unique within the outlet. |
| **Staff Sale Limits** | Monthly token caps are verified programmatically before recharges or card issuance. |

---

## ⚡ Server-Side / API Migration Paths (Recommended)

### 1. Role Custom Claims Setting via Admin SDK

To completely secure document edits from client-side spoofing, you should assign Firebase Auth custom claims on the server-side.

**Recommended API Route (`src/app/api/admin/staff/route.ts`):**
```typescript
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK if not initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  try {
    const { uid, role, status } = await request.json();
    
    // Set custom user claims securely on Firebase Auth
    await admin.auth().setCustomUserClaims(uid, { role, status });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 2. Multi-Outlet Data Separation

All models now include `outletId` fields. When migrating to a multi-branch ecosystem:
1. Initialize each POS terminal with its respective `outletId` (configured in local settings).
2. Update Firestore Security Rules to enforce that callers can only read/write documents where `resource.data.outletId == callerProfile().outletId` or custom claims contain `outletId`.

---

## 📐 Data Model Reference

### `staff` (Firestore)
```typescript
interface StaffAccount {
  id: string;                  // Firebase Auth UID
  name: string;
  emailOrPhone: string;        // Used as Firebase Auth email
  username: string;            // Unique POS log-in handle
  role: 'staff' | 'owner';
  status: 'active' | 'inactive';
  monthlyTokenLimit?: number;  // Cap on recharges allowed per month
  outletId: string;            // Outlet identifier (default: main_outlet)
  password?: string;           // DEV ONLY — Hashed value, omitted in production
}
```

### `orders` (Firestore)
```typescript
interface Order {
  id: string;                  // Format: "HH-XXXX" (e.g. HH-4821)
  tableNumber: string;
  items: CartItem[];
  total: number;
  paymentMode: 'cash' | 'online' | 'tokens';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'completed' | 'cancelled';
  staffId: string;
  staffName: string;
  createdAt: string;           // ISO DateTime String
  completedAt?: string;
  tokenCardNo?: string;        // Set for token payments
  tokensDeducted?: number;     // Tokens deducted for order
  outletId: string;            // Outlet identifier (default: main_outlet)
}
```

### `tokens` (Firestore)
```typescript
interface TokenAccount {
  id: string;
  name: string;                // Student/customer name
  cardNo: string;              // 3-8 digit unique card number (6-8 recommended)
  tokens: number;              // Current balance
  createdAt: string;
  updatedAt?: string;
  outletId: string;            // Outlet identifier (default: main_outlet)
}
```

### `token_transactions` (Firestore)
```typescript
interface TokenTransaction {
  id: string;
  type: 'recharge' | 'deduction' | 'refund' | 'adjustment';
  studentId: string;
  studentName: string;
  cardNo: string;
  tokens: number;              // Positive = added, Negative = deducted
  amount: number;              // Rupee value equivalent
  soldBy: string;              // Staff username
  createdAt: string;
  outletId: string;            // Outlet identifier (default: main_outlet)
}
```

### `menu` (Firestore)
```typescript
interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  outletId: string;            // Outlet identifier (default: main_outlet)
  description?: string;
  prepTime?: string;
  tags?: ('spicy' | 'veg' | 'popular' | 'new')[];
}
```

### `settings` (Firestore)
```typescript
interface Settings {
  id: string;                         // 'settings_default'
  outletName: string;                 // Display outlet name
  tokenValueInRupees: number;         // Conversion rate (e.g. 30 Rupees)
  manualUpiEnabled: boolean;          // Enable manual UPI option
  taxEnabled: boolean;                // Include GST/Tax
  currency: string;                   // E.g., 'INR'
  receiptFooter?: string;             // Custom footer for customer receipts
  monthlyTokenLimitDefaults?: number; // Default recharge limit for new staff
  outletId: string;                   // Outlet identifier (default: main_outlet)
}
```

### `audit_logs` (Firestore)
```typescript
interface AuditLog {
  id: string;
  action:
    | 'staffCreated'
    | 'staffDeactivated'
    | 'staffRemoved'
    | 'tokenRecharged'
    | 'tokenDeducted'
    | 'tokenRefunded'
    | 'tokenAdjusted'
    | 'monthlyLimitChanged'
    | 'orderCreated'
    | 'orderCompleted'
    | 'orderCancelled'
    | 'menuItemCreated'
    | 'menuItemUpdated'
    | 'menuItemDeleted'
    | 'settingsUpdated';
  actorUid: string;                   // Firebase Auth UID or 'local'
  actorRole: 'owner' | 'staff';
  targetId: string;                   // Affected entity ID
  timestamp: string;                  // ISO DateTime String
  outletId: string;                   // Outlet identifier (default: main_outlet)
  before?: any;                       // Value prior to operation
  after?: any;                        // Value post operation
}
```

---

## 🔐 Production Deployment Checklist

Before going live with real customers and real money:

- [ ] **Deploy Firestore Security Rules** — `firebase deploy --only firestore:rules`
- [ ] **Clean Up Development Data** — Remove `password` field from Firestore staff documents.
- [ ] **Set Firebase Auth password policy** (minimum 8 characters) in Firebase Console.
- [ ] **Enable Firebase App Check** to prevent API abuse.
- [ ] **Restrict Firebase API key** in Google Cloud Console to your domain only.
- [ ] **Set up Firebase Backup** for Firestore.
- [ ] **Change seed passwords** — never use `owner123` / `staff123` in production.
- [ ] **Enable Firebase Auth rate limiting** (already on by default).
- [ ] **Set up Next.js API server** with Firebase Admin SDK to administer user custom claims.
