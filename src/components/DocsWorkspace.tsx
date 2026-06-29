'use client';

import React, { useState } from 'react';
import { ForkKnife, CreditCard, ShieldCheckered, Gear, BookOpen, Question } from '@phosphor-icons/react';

type Section = 'getting-started' | 'pos-checkout' | 'nfc-passes' | 'security-limits' | 'faq';

export function DocsWorkspace() {
  const [activeSection, setActiveSection] = useState<Section>('getting-started');

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: <BookOpen size={16} weight="duotone" /> },
    { id: 'pos-checkout', label: 'POS Terminal & Billing', icon: <ForkKnife size={16} weight="duotone" /> },
    { id: 'nfc-passes', label: 'NFC Pass Cards', icon: <CreditCard size={16} weight="duotone" /> },
    { id: 'security-limits', label: 'Security & Shift Auditing', icon: <ShieldCheckered size={16} weight="duotone" /> },
    { id: 'faq', label: 'Frequently Asked Questions', icon: <Question size={16} weight="duotone" /> }
  ] as const;

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0 animate-fade-in pr-1">
      {/* Sidebar Nav within Docs */}
      <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2.5 md:pb-0 border-b md:border-b-0 md:border-r border-border/60 pr-0 md:pr-4">
        {sections.map((sect) => (
          <button
            key={sect.id}
            onClick={() => setActiveSection(sect.id)}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2.5 shrink-0 text-left ${
              activeSection === sect.id
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-xs'
                : 'text-text-muted hover:text-foreground hover:bg-surface-container/50 border border-transparent'
            }`}
          >
            {sect.icon}
            {sect.label}
          </button>
        ))}
      </div>

      {/* Docs Content Zone */}
      <div className="flex-1 overflow-y-auto pr-1 pb-12 flex flex-col gap-6">
        {activeSection === 'getting-started' && (
          <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col gap-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Getting Started with Hau-Hau POS
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Welcome to the Hau-Hau POS operations guide. This portal is designed to manage order placement, student card checkouts, staff security limits, and outlet metrics in one secure interface.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-surface-container/30 border border-border/50 p-4 rounded-lg flex flex-col gap-2">
                <span className="text-xs font-bold text-foreground">For Floor Staff</span>
                <span className="text-[11px] text-text-muted leading-relaxed">
                  Use the **POS Terminal** to choose tables, add menu items to the cart, scan student NFC cards, and deduct whole physical tokens. You can also recharge passes and view shift history.
                </span>
              </div>
              <div className="bg-surface-container/30 border border-border/50 p-4 rounded-lg flex flex-col gap-2">
                <span className="text-xs font-bold text-foreground">For Outlet Owners</span>
                <span className="text-[11px] text-text-muted leading-relaxed">
                  Use the **Owner Dashboard** to view daily revenue pools, edit menu items, configure the dynamic token rate, monitor staff limits, and audit operations through the immutable audit logs.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'pos-checkout' && (
          <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col gap-5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              POS Terminal & Billing Workflows
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-bold text-foreground">1. Creating Orders</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Select an active table number, add food items to the cart, adjust quantities, and pick a payment method.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3.5">
                <h3 className="text-xs font-bold text-foreground">2. Payment Modes</h3>
                <ul className="list-disc pl-4 text-xs text-text-muted flex flex-col gap-1">
                  <li><strong>Cash Pool:</strong> Handled physically. Registers direct billing on checkout.</li>
                  <li><strong>Online Pool:</strong> Registers external card/UPI gateway receipts.</li>
                  <li><strong>Tokens (NFC Cards):</strong> Debits from the student's physical token card balance.</li>
                </ul>
              </div>
              <div className="flex flex-col gap-2 border-t border-border/40 pt-3.5 bg-blue-500/5 p-4.5 rounded-lg border border-blue-500/10">
                <h3 className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <CreditCard size={15} />
                  Token Billing & Store Credit Math (Change Wallet)
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Since tokens are physical entities, students pay in whole tokens. If the order total is not a multiple of the token rate, the student overpays in tokens, and the change is digitally credited back to their card as store credit.
                </p>
                <div className="font-mono text-[10px] text-blue-300 bg-surface/50 p-3 rounded border border-blue-500/10 flex flex-col gap-1 leading-normal">
                  <div>1. Amount Payable = Order Total - Existing Card Store Credit</div>
                  <div>2. Tokens Required = Math.ceil(Amount Payable / Token Rate)</div>
                  <div>3. New Card Credit = (Tokens Required * Token Rate) - Amount Payable</div>
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed mt-1">
                  <strong>Example:</strong> A student has ₹10 store credit and ₹50 order. The amount payable is ₹40. At ₹30/token, they pay 2 tokens (worth ₹60). The remaining ₹20 change is saved to their card credit wallet for their next order.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'nfc-passes' && (
          <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col gap-5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              NFC Pass Card Operations
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-bold text-foreground">1. Card Provisioning</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  To issue a card, enter the student's name, a unique Card Number (3 to 8 digits matching their physical card), and initial tokens. Staff cannot issue tokens exceeding their monthly limit.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3.5">
                <h3 className="text-xs font-bold text-foreground">2. Recharging Passes</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Recharging must occur in whole physical tokens. You can enter the tokens to recharge, or input the cash paid to automatically compute the whole number of tokens (using `Math.floor` to avoid fractional tokens).
                </p>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3.5">
                <h3 className="text-xs font-bold text-foreground">3. Card Cancellation / Refunds</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  If an order paid by tokens is cancelled, the system automatically refunds the exact tokens deducted and reverts the store credit adjustments.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security-limits' && (
          <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col gap-5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Security Safeguards & Auditing
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-xs font-bold text-foreground">1. Staff Monthly Limits</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  To prevent unauthorized selling, each staff account has a monthly token sales limit (configured by the owner). When a sale or provision exceeds this limit, the system blocks the transaction.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3.5">
                <h3 className="text-xs font-bold text-foreground">2. Shift Tracking</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Staff dashboards monitor active shift sales, listing tokens sold and cash collected during the day. This data resets daily.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 border-t border-border/40 pt-3.5">
                <h3 className="text-xs font-bold text-foreground">3. Immutable Audit Trail</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  All critical operations (recharges, card creations, checkouts, refunds, profile updates, menu modifications, and manual adjustments) register in the central Audit Log. Logs are read-only and visible only to the owner.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'faq' && (
          <div className="minimal-card p-6 rounded-xl bg-surface border border-border flex flex-col gap-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Frequently Asked Questions (FAQ)
            </h2>
            <div className="flex flex-col gap-4 text-xs divide-y divide-border/40">
              <div className="flex flex-col gap-1.5 pt-0">
                <span className="font-bold text-foreground">Q: Why can't I type decimals in the recharge box?</span>
                <span className="text-text-muted leading-relaxed">
                  A: Tokens are physical entities. They cannot be sold or stored as fractions (e.g. 1.5 tokens). The system strictly enforces integers, and all checkout change is saved in Rupees store credit instead.
                </span>
              </div>
              <div className="flex flex-col gap-1.5 pt-3.5">
                <span className="font-bold text-foreground">Q: Can I complete an order after it has been cancelled?</span>
                <span className="text-text-muted leading-relaxed">
                  A: No. Once an order is cancelled, its inventory and token deductions are reverted. The system blocks changing a cancelled order's status to prevent compliance loops.
                </span>
              </div>
              <div className="flex flex-col gap-1.5 pt-3.5">
                <span className="font-bold text-foreground">Q: How do we change the value of a token?</span>
                <span className="text-text-muted leading-relaxed">
                  A: The owner can configure the conversion rate in **Outlet Settings** (default is ₹30/token). The POS checkout, pass creation, and recharges dynamically compute rupee equivalence using this configured rate.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocsWorkspace;
