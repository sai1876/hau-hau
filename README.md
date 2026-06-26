# 🍔 Hau-Hau — Restaurant POS & Management System

A modern, full-stack **Point-of-Sale (POS) and restaurant management platform** built with **Next.js 16**, **React 19**, **Firebase**, and **Tailwind CSS v4**. Designed for **student-focused food outlets, campus canteens, and compact Quick Service Restaurant (QSR) operations**, Hau-Hau provides a dual-role interface for **Owners** and **Staff** with real-time order management, a digital token payment system, and a sleek dark-mode UI.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/postcss`) |
| Backend / Database | Firebase Firestore (real-time) |
| Authentication | Firebase Authentication (email/password) |
| Language | TypeScript |
| Deployment | Vercel |

---

## 📁 Project Structure

```
hau-hau/
├── src/
│   ├── app/
│   │   ├── login/          # Login page (shared for both roles)
│   │   ├── owner/          # Owner Command Center dashboard
│   │   ├── staff/          # Staff POS dashboard
│   │   ├── layout.tsx      # Root layout with AppProvider
│   │   ├── globals.css     # Tailwind v4 + design tokens
│   │   └── page.tsx        # Root redirect → /login
│   ├── components/         # Shared UI components
│   ├── context/
│   │   └── AppContext.tsx  # Global state & all app actions
│   ├── services/
│   │   ├── db.ts           # Firebase Firestore data layer (with dev fallback)
│   │   └── firebase.ts     # Firebase app initialization
│   └── types/
│       └── index.ts        # All TypeScript interfaces
├── firestore.rules          # Firestore security rules (deploy separately)
├── seed-db.mjs             # One-time database seed script (dev/demo)
├── .env.example            # Environment variable template (no secrets)
└── SECURITY.md             # Security posture & hardening guide
```

---

## ✨ Features Overview

### 🔐 Authentication
- Role-based login for **Owner** and **Staff** accounts
- Firebase Authentication (email/password) with server-managed session persistence
- Automatic redirect based on role after login
- Inactive staff accounts are rejected at the auth layer — they cannot access the dashboard
- Secure profile update (name, password, contact info)

> **Note:** Session persistence is handled by **Firebase Authentication's built-in session management**, not localStorage. The app includes a development-only localStorage fallback that activates when Firebase is not configured; this fallback **must not** be used in production.

---

### 👨‍🍳 Staff Dashboard — POS Interface

#### 🛒 Point of Sale (POS)
- **Table Selector** — Visually select from multiple tables; each table has its own independent cart
- **Menu Browsing** — Browse all available menu items with category filtering tabs
- **Dynamic Category Tabs** — Auto-generated from live menu categories
- **Menu Item Cards** — Display name, price, description, prep time, and tags (🌶 Spicy, 🥗 Veg, ⭐ Popular, 🆕 New)
- **Cart Panel** — Sidebar/bottom-sheet cart showing items, quantities, and running total
- **Multi-table Cart Isolation** — Each table maintains its own cart; switching tables doesn't lose data
- **Payment Modes** — Place orders with **Cash**, **Manual UPI/Online**, or **Tokens**
- **Token Payment** — Search by student name or card number; deduct tokens from balance on order confirmation
- **Mobile Cart Drawer** — Floating cart button with item count badge; opens full-screen cart on mobile

#### 🪙 Token Hub (Staff)
- **Recharge Token Accounts** — Search for a student and top up their balance
- **Token ↔ Rupee Conversion** — 1 Token = ₹30; auto-calculates rupee equivalent
- **Issue New Token Cards** — Create a new token account with a unique 3–6 digit card number
- **Recharge Confirmation** — Preview details before confirming the transaction
- **Monthly Staff Limit** — Enforced cap on how many tokens a staff member can sell per month

#### 📋 Order History (Staff)
- View all orders created by the currently logged-in staff member
- Status badges: **Pending**, **Completed**, **Cancelled**
- Payment mode badge on each order

#### 👤 Profile (Staff)
- View and edit personal profile information
- Change name and password via Firebase Auth

---

### 👑 Owner Dashboard — Command Center

#### 📊 Overview
- **Live Metrics** — Total Orders, Pending Orders, Completed Orders, Total Revenue
- **Revenue Breakdown** — Separate collection totals for Cash, Online, and Token payments
- **Top Selling Items** — Ranked list of best-selling menu items
- **Active Staff Monitor** — See which staff accounts are currently active

#### 📦 Orders Management
- Filter by status (**Pending**, **Completed**, **All**) and payment mode
- Mark orders as Complete / Pending or Cancel them
- Order Detail Modal — full item list, staff name, table, payment info, timestamps

#### 🍽️ Menu Management
- Toggle item availability (hides from staff POS)
- Add, edit, and delete menu items with confirmation
- Auto-tag newly created items as 🆕 New

#### 👥 Staff Management
- Create staff accounts (Firebase Auth + Firestore profile)
- Toggle staff active/inactive status
- Set and update per-staff monthly token sale limits
- Remove staff accounts with confirmation

#### 🎫 Token Management (Owner)
- View all student token accounts with card number, name, and balance
- Create, edit, and delete token accounts (3–6 digit card numbers, owner decides length)
- Transaction history per account — full recharge/deduction/refund log

#### 👤 Profile (Owner)
- View and edit owner profile details
- Change name, password, and contact information

---

## 💾 Data Layer

### Firebase Firestore Collections

| Collection | Description |
|---|---|
| `menu` | All menu items with availability, tags, price, prep time |
| `orders` | All placed orders with items, payment info, status, and staff attribution |
| `staff` | Staff account records (name, username, role, status, token limit) |
| `tokens` | Student token accounts (card number, balance) |
| `token_transactions` | Immutable ledger of recharge, deduction, refund, and adjustment records |

> **Note:** The `tokenTransactions` collection is named `token_transactions` in Firestore. Each transaction record includes a `type` field (`recharge`, `deduction`, `refund`, `adjustment`) for full auditability.

### Development-Only LocalStorage Fallback
The app includes a graceful fallback to in-memory/localStorage storage when Firebase is not configured. **This fallback is strictly for local development and testing.** It must never be active in production. If Firebase environment variables are missing or misconfigured in production, the app will not function correctly.

---

## 💳 Payment Methods

| Method | How It Works |
|---|---|
| **Cash** | Order recorded as cash payment; marked paid when owner marks complete |
| **Manual UPI/Online** | Staff manually records that the customer paid via UPI or online transfer. **There is no payment gateway integration.** No automatic verification occurs. |
| **Tokens** | Deducted from the student's token balance at the time of order placement |

> **UPI/Online Note:** UPI and online payments are recorded manually by staff. There is no integration with a payment gateway (e.g., Razorpay, Cashfree). For automatic payment verification, a payment gateway must be integrated separately.

---

## 🔐 Security Architecture

### Current State
- **Firebase Authentication** handles all login sessions and password management
- **Firestore Security Rules** (`firestore.rules`) provide server-enforced role-based access control
- **Client-side role checks** on every protected page provide a UX-layer guard
- **Destructive actions** require confirmation dialogs before execution
- **Inactive staff** are rejected at the Firebase Auth layer during login

### Known Limitations (See `SECURITY.md`)
- Role checks rely on a Firestore document field — a tamper-proof alternative requires Firebase Custom Claims
- Token balance updates are not atomic — concurrent recharges may have a race condition
- Staff creation uses a secondary Firebase app on the client — server-side Admin SDK is the recommended path
- Plaintext passwords are stored in Firestore for the dev fallback — must be removed from production documents

See **[SECURITY.md](./SECURITY.md)** for the full security posture, known gaps, and the exact recommended hardening steps.

---

## 🏗️ Getting Started

### Prerequisites
- **Node.js 20.9 or later** (required by Next.js 16)
- A Firebase project with **Firestore** and **Authentication** enabled (email/password sign-in method)

### 1. Clone the Repository

```bash
git clone https://github.com/sai1876/hau-hau.git
cd hau-hau
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set all six variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

> Find these values in the [Firebase Console](https://console.firebase.google.com) → Project Settings → Your apps → Web app → SDK setup and configuration.

> ⚠ **The app will not function correctly in production if these values are missing.**

### 3. Seed the Database (First Run Only)

Populate Firebase Auth and Firestore with default accounts and menu items:

```bash
node seed-db.mjs
```

This creates:
- **Owner account:** `owner@hauhau.com` / `owner123`
- **Staff account:** `staff@hauhau.com` / `staff123`
- All default menu items

> ⚠ **Change the default passwords immediately after your first login.**

### 4. Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase use your-project-id
firebase deploy --only firestore:rules
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for Production

```bash
npm run build
npm run start
```

---

## 🚢 Deployment on Vercel

1. Push your code to GitHub (`.env.local` is git-ignored — never commit it)
2. Import the repository in the [Vercel dashboard](https://vercel.com/new)
3. In **Settings → Environment Variables**, add all six `NEXT_PUBLIC_FIREBASE_*` variables
4. Deploy — Vercel auto-detects Next.js and configures the build

> **Important:** The Vercel build will succeed without Firebase env vars, but the app will fall back to localStorage mode in production. Always verify your environment variables are set before going live.

---

## 🔑 Default Credentials

| Role | Email | Password | Notes |
|---|---|---|---|
| Owner | `owner@hauhau.com` | `owner123` | Created by seed script |
| Staff | `staff@hauhau.com` | `staff123` | Created by seed script |

> ⚠ **Change both passwords immediately after seeding. Never use default credentials in production.**

---

## 🌿 Tailwind CSS v4 Setup

This project uses **Tailwind CSS v4** via the `@tailwindcss/postcss` plugin — the recommended setup for Tailwind v4 with Next.js. Configuration is in `postcss.config.mjs` and design tokens are defined directly in `src/app/globals.css` using the `@theme` directive.

No separate `tailwind.config.js` file is needed with v4.

---

## 📐 Data Model

For the complete data model including field descriptions, security notes, and future collection recommendations, see **[SECURITY.md → Data Model Reference](./SECURITY.md)**.

---

## 📄 License

This project is private and proprietary. All rights reserved.
