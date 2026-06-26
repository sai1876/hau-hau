# Hau-Hau POS — Security Posture & Hardening Guide

> **Status:** Development-stage application with Firebase Auth and client-side role enforcement.
> See the sections below for what is currently protected, what is a known limitation, and the recommended hardening path.

---

## ✅ What Is Currently Protected

| Control | How |
|---------|-----|
| Authentication | Firebase Authentication (email/password) — sessions managed by Firebase SDK, not localStorage in Firebase mode |
| Route protection | `owner/page.tsx` and `staff/page.tsx` both check `currentUser.role` before rendering; redirect to `/login` if not authenticated |
| Staff deactivation | Inactive staff accounts are rejected at login; the `onAuthStateChanged` handler checks `profile.status` and signs out inactive users |
| Destructive action confirmations | All delete/cancel operations use a branded confirmation modal |
| Environment secrets | Firebase config is in `.env.local` which is `.gitignore`'d; `.env.example` contains no real values |
| Token sale monthly limits | Staff monthly token sale caps are enforced in `AppContext.sellTokens()` and `createNewToken()` before any write |
| Unique card numbers | Checked client-side before creating or updating a token account |
| Firestore Security Rules | `firestore.rules` file added — provides server-enforced role-based access control |

---

## ⚠ Known Limitations (Client-Side Only)

### 1. Role Checks Are Client-Side

**Current state:** Roles (`owner` / `staff`) are stored in the `staff` Firestore document and read client-side after login. A malicious user who can write their own Firestore document could change their role.

**Mitigation in place:** `firestore.rules` restricts who can update the `role` field. Staff cannot update their own role via normal rules.

**Recommended fix:**
```
Firebase Admin SDK (server-side) → Set Custom Claims on the Firebase Auth token
  → Use request.auth.token.role in Firestore rules (tamper-proof)
```

**Implementation path:**
1. Create `src/app/api/admin/` Next.js API routes
2. Install `firebase-admin` as a server-only dependency
3. Store Firebase Admin service account key as a **server-side only** env var (no `NEXT_PUBLIC_` prefix)
4. After staff creation, call `admin.auth().setCustomUserClaims(uid, { role: 'staff' })`
5. Update `firestore.rules` to use `request.auth.token.role` instead of the document read

### 2. Plaintext Passwords in Firestore

**Current state:** The `password` field is stored in plaintext in the `staff` Firestore document. This is a holdover from the localStorage development fallback.

**Risk:** If Firestore rules are misconfigured or there is a data leak, passwords are exposed.

**Fix:**
- Remove the `password` field from all Firestore `staff` documents in production
- Passwords are managed entirely by Firebase Authentication — there is no need to store them in Firestore
- The `password` field in `StaffAccount` type is needed only for the localStorage dev fallback

**Action required:** After seeding, delete the `password` field from all Firestore `staff` documents, or modify the seed script to not write it.

### 3. Token Balance Updates Are Not Atomic

**Current state:** `sellTokens()` reads the current balance from React state, adds tokens, and calls `updateDoc()`. Two simultaneous recharge operations could cause a race condition where one overwrites the other.

**Risk:** Token balance may be incorrect if two staff members recharge the same account simultaneously.

**Recommended fix:**
```javascript
// Use Firestore transactions for atomic balance updates
import { runTransaction } from 'firebase/firestore';

await runTransaction(firestore, async (transaction) => {
  const tokenRef = doc(firestore, 'tokens', studentId);
  const tokenDoc = await transaction.get(tokenRef);
  const currentBalance = tokenDoc.data().tokens;
  if (currentBalance + tokensToAdd < 0) throw new Error('Insufficient balance');
  transaction.update(tokenRef, { tokens: currentBalance + tokensToAdd });
});
```

### 4. Staff Account Creation on Client

**Current state:** Creating a new staff account initializes a secondary Firebase app on the client to call `createUserWithEmailAndPassword()`. This works but is not ideal for several reasons:
- The owner's main auth session is not used for the Admin operation
- Firebase Admin SDK (`firebase-admin`) cannot run in the browser

**Recommended fix:**
```
POST /api/admin/create-staff → Firebase Admin SDK → createUser() + setCustomClaims()
```
This keeps staff creation server-side, allows setting custom claims immediately, and does not expose the Firebase config in the browser beyond what's already public.

### 5. No Audit Log Collection

**Current state:** There is no `auditLogs` Firestore collection. Changes to orders, staff accounts, and token balances are not centrally logged.

**Recommended future collection:**
```typescript
interface AuditLog {
  id: string;
  action: 'order_cancelled' | 'staff_deactivated' | 'token_balance_adjusted' | string;
  performedBy: string; // Firebase Auth UID
  targetId: string;    // Affected document ID
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  createdAt: string;
}
```

---

## 🔐 Production Deployment Checklist

Before going live with real customers and real money:

- [ ] **Deploy Firestore Security Rules** — `firebase deploy --only firestore:rules`
- [ ] **Remove `password` field from Firestore staff documents**
- [ ] **Set Firebase Auth password policy** (minimum 8 characters) in Firebase Console
- [ ] **Enable Firebase App Check** to prevent API abuse
- [ ] **Restrict Firebase API key** in Google Cloud Console to your domain only
- [ ] **Set up Firebase Backup** for Firestore
- [ ] **Change seed passwords** — never use `owner123` / `staff123` in production
- [ ] **Enable Firebase Auth rate limiting** (already on by default)
- [ ] **Implement Firestore atomic transactions** for token balance updates
- [ ] **Add server-side staff creation** via Firebase Admin SDK API route
- [ ] **Add Custom Claims** for tamper-proof role enforcement

---

## 🔑 Secrets Management

| Secret | Location | Status |
|--------|----------|--------|
| Firebase Client Config | `NEXT_PUBLIC_FIREBASE_*` env vars | ✅ Safe — client config is intentionally public |
| Firebase Admin Service Account | Not implemented yet | ⚠ Required for Admin SDK — must be server-only, never `NEXT_PUBLIC_` |
| Firestore rules | `firestore.rules` | ✅ Safe to commit — no secrets |
| `.env.local` | Git-ignored | ✅ |
| `.env.example` | Committed, no real values | ✅ |

---

## 📐 Data Model Reference

### `staff` (Firestore)
```typescript
{
  id: string;           // Firebase Auth UID
  name: string;
  emailOrPhone: string; // Used as Firebase Auth email
  username: string;     // Display username for the POS
  role: 'staff' | 'owner';
  status: 'active' | 'inactive';
  monthlyTokenLimit?: number;
  // TODO: Remove 'password' field from all production documents
  password?: string;    // DEV ONLY — not used when Firebase Auth is active
}
```

### `orders` (Firestore)
```typescript
{
  id: string;           // e.g. "HH-4821"
  tableNumber: string;
  items: CartItem[];
  total: number;
  paymentMode: 'cash' | 'online' | 'tokens';
  paymentStatus: 'pending' | 'paid';
  orderStatus: 'pending' | 'completed' | 'cancelled';
  staffId: string;      // TODO: Migrate to Firebase Auth UID (currently username)
  staffName: string;
  createdAt: string;    // ISO 8601
  completedAt?: string;
  tokenCardNo?: string; // Set for token payments
  tokensDeducted?: number;
}
```

### `tokens` (Firestore)
```typescript
{
  id: string;
  name: string;         // Student/customer name
  cardNo: string;       // 3–6 digit unique card number (owner decides max length)
  tokens: number;       // Current balance (1 token = ₹30)
  createdAt: string;
}
```

### `token_transactions` (Firestore)
```typescript
{
  id: string;
  type: 'recharge' | 'deduction' | 'refund' | 'adjustment'; // Added for clarity
  studentId: string;
  studentName: string;
  cardNo: string;
  tokens: number;       // Positive = added tokens; convention documented in types/index.ts
  amount: number;       // Rupee equivalent
  soldBy: string;       // Staff username
  createdAt: string;
}
```

### `menu` (Firestore)
```typescript
{
  id: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  description?: string;
  prepTime?: string;
  tags?: ('spicy' | 'veg' | 'popular' | 'new')[];
}
```

### Future Collections (Recommended)
- `auditLogs` — immutable log of sensitive actions
- `settings` — outlet-level config (token rate, outlet name, tax rates)
- `outlets` — for future multi-branch support
- `categories` — if display order of menu categories is needed
