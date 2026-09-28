CORE THEORY V10

V10 includes the current Core Theory website plus the final consistency changes:

PACKAGE FLOW
- Owner Add Package: Paid / Complimentary / Payment Pending.
- Client-selected packages are ALWAYS Payment Pending.
- Client cannot mark their own package Paid or Complimentary.
- Client can change or cancel their unpaid package request.
- Payment Pending does not activate the package and does not count as revenue.
- Collect Payment activates it through the existing settlement flow.

FINANCE
- Monthly Finance retained.
- Correct transaction retained.
- Full Refund added.
- Refund keeps audit history.
- Product stock is restored.
- Exact product variant stock is restored.
- Untouched packages can be refunded.
- If package sessions were already used, refund is BLOCKED rather than corrupting session history.

INVENTORY
- Color / Flavor / Style / Other = Name + Stock.
- Size = Name + Stock + Cost + Sell Price.
- POS asks which variant is sold.
- Receipts and payment history show the exact variant.

EXPENSES
- Quantity retained.
- Price per item + calculated total retained.

SCHEDULE
- Weekly Schedule retained.
- Paste Schedule retained.
- Clear Schedule retained.
- 1000+ class loading retained.
- Client weekly schedule direct-load fix retained.
- Class Hours assignment retained.

MONTH SELECTOR
Only on:
- Dashboard
- Finance
- Expenses
- Operations
- Team / Payroll
- Reports

OPERATIONS
Preserved:
- Alerts
- Events & Specials
- Announcements
- Promo Codes
- Birthdays
- Audit log
- Reports
- End-of-day reconciliation

SUBSTITUTES
V10 preserves the substitute-aware RPC workflow already used by the current app.

INSTALL
1. BACK UP your current app.js and Supabase first.
2. Run CORE_THEORY_V10_MIGRATION.sql once in Supabase SQL Editor.
3. Replace GitHub app.js with the V10 app.js.
4. Commit.
5. Wait for Vercel Ready.
6. Hard refresh.

FIRST TEST
Use a test client:
1. Client chooses package → should say Payment Pending.
2. Owner Finance → Pending Package Orders should show it.
3. Collect Payment → it should leave Pending and become a normal package.
4. Sell a product variant and print the receipt.
5. Refund the test product sale and check stock restores.
