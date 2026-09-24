# MASTER BUILD PROMPT — Pesticide Shop Management SaaS
### (Give this entire document to Google Antigravity as one instruction)

---

## 0. What You Are Building

A **multi-tenant, multi-branch SaaS platform** for pesticide/agri-input shops in Pakistan, sold to many shop owners as a subscription product (not a one-off build for a single shop). Every shop that signs up is a **tenant**. A tenant may run **one or many branches**. Each branch deals in products from **many pesticide companies at once** (Bayer, Syngenta, FMC, local brands, etc.).

This must be a **complete, real, working point-of-sale and business management system** — not a demo. The shop owner should be able to:

- Run daily counter sales (POS) and print/share a proper receipt ("parchi") for every sale
- See exactly how much was sold **today**, **this month**, and any custom date range
- Track every rupee owed to him by farmers (credit/udhaar) and every rupee he owes suppliers
- Know exactly what stock he has, in which branch, from which company, and when it expires
- Do all of this across multiple branches, with staff logins that only see what they're allowed to see

Build it to be **powerful and genuinely useful in a real shop tomorrow**, not a toy CRUD app.

---

## 1. Tech Stack — Full Detail (set this up first, properly, before writing feature code)

### 1.1 Framework & Language
- **Next.js 15+ (App Router only — no Pages Router)**, using the **latest stable release** at build time. Check the current latest version before scaffolding; do not assume an old version from training data.
- **TypeScript in strict mode** (`"strict": true` in `tsconfig.json`). No `any` types except where absolutely unavoidable, and even then, flag with a comment.
- Use **Server Components by default**; only mark a component `"use client"` when it genuinely needs interactivity (forms, state, event handlers).
- Use **Server Actions** for mutations (creating a sale, adding stock, recording a payment) instead of building a separate REST API layer, unless a public API is explicitly needed later.

### 1.2 Project Scaffolding Steps (do these in order)
1. `npx create-next-app@latest` with: TypeScript = yes, ESLint = yes, Tailwind CSS = yes, `src/` directory = yes, App Router = yes, import alias `@/*` = yes.
2. Initialize **shadcn/ui**: `npx shadcn@latest init`, using the neutral/slate base theme as a starting point (we will customize colors later — see Section 8).
3. Install core dependencies at their latest stable versions:
   - `@supabase/supabase-js` and `@supabase/ssr` (for proper server-side/browser Supabase client handling in App Router — do NOT use the deprecated auth-helpers packages)
   - `react-hook-form` + `zod` + `@hookform/resolvers`
   - `@tanstack/react-query` (for client-side data that needs polling/refetching, e.g. live stock counts)
   - `date-fns` (date handling — expiry dates, credit due dates, report ranges)
   - `recharts` (dashboard charts — sales trends, company-wise breakdown)
   - `lucide-react` (icons)
   - A PDF/receipt generation approach — use `@react-pdf/renderer` OR a simple print-optimized HTML+CSS receipt view (see Section 5.2) — implement the print-CSS approach as primary since it's free and works instantly with any printer, and add PDF export as a secondary option.
4. Set up **environment variables** (`.env.local`, and document a `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client — used for admin/super_admin operations like tenant provisioning)
5. Set up **three Supabase client helpers** properly, as separate files:
   - `lib/supabase/client.ts` — browser client for Client Components
   - `lib/supabase/server.ts` — server client for Server Components/Actions, using cookies from `next/headers`
   - `lib/supabase/middleware.ts` — used inside `middleware.ts` to refresh the auth session on every request
6. Set up `middleware.ts` at the project root to refresh Supabase sessions and redirect unauthenticated users away from protected routes.
7. Folder structure (App Router route groups):
   ```
   src/
     app/
       (auth)/login/
       (auth)/signup/            # tenant owner self-signup for the SaaS
       (dashboard)/dashboard/
       (dashboard)/pos/           # billing/checkout screen
       (dashboard)/inventory/
       (dashboard)/inventory/[productId]/
       (dashboard)/purchases/
       (dashboard)/suppliers/
       (dashboard)/customers/
       (dashboard)/customers/[customerId]/
       (dashboard)/credit/        # udhaar ledger views
       (dashboard)/branches/
       (dashboard)/reports/
       (dashboard)/reports/daily/
       (dashboard)/reports/monthly/
       (dashboard)/settings/
       (dashboard)/settings/users/
       (dashboard)/settings/companies/
       (super-admin)/tenants/     # platform owner's view across all tenants
     components/
       ui/                        # shadcn components
       pos/
       inventory/
       reports/
       shared/
     lib/
       supabase/
       validations/               # zod schemas
       utils/
     actions/                     # server actions grouped by domain: sales.ts, inventory.ts, credit.ts, purchases.ts
   ```
8. Set up ESLint + Prettier with sensible defaults (no unused vars, consistent formatting) so Antigravity's generated code stays clean as the app grows.

### 1.3 Explain-Before-Build Requirement
Before generating the database schema or any feature code, Antigravity should first summarize back its understanding of: (a) the tenant/branch/role model, (b) the full data model it's about to create, and (c) the POS-to-receipt flow — in plain language — so we can confirm before code generation begins.

---

## 2. Multi-Tenancy, Branches & Roles

- **`tenants`** table = one row per shop business (the paying customer).
- **`branches`** table = one row per physical location, `tenant_id` foreign key. A tenant has 1..N branches.
- **Roles**, assignable per user per tenant:
  - `super_admin` — platform operator (you). Can see/manage all tenants, used for support and onboarding.
  - `owner` — full control of their tenant, all branches. Can switch between **consolidated view** (all branches combined) and **single-branch view**. Can create/manage branches, staff, companies, and see every report.
  - `branch_manager` — full control, scoped to their assigned branch(es) only. Can manage stock, purchases, staff at their branch, but not other branches.
  - `salesman` — POS/billing only. Can create sales, look up stock and customer balances, print receipts. Cannot edit prices, cannot see cost prices/margins, cannot delete/edit past sales without manager approval (a "void sale" request flow that a manager must approve).
- Every table with tenant data carries `tenant_id`, and branch-scoped tables also carry `branch_id`. Enforce isolation with **Supabase Row Level Security** on every table — write and test policies for each role, not just `owner`.
- **Cross-branch stock transfer**: a proper request → approve → receive workflow (see Section 6).
- Owner can configure, per tenant, whether branches report independently or fully consolidated — this should be a toggle in Settings, not hardcoded.

---

## 3. Full Database Schema (design migrations around this — expand fields as sensible, but don't drop any of these)

- **tenants**: id, business_name, owner_name, phone, city, dealer_license_number, license_expiry_date, created_at, subscription_status (enum: trial/active/suspended — no billing logic yet, just the field), settings (jsonb: branch_mode = independent/consolidated/hybrid)
- **branches**: id, tenant_id, name, address, phone, is_active
- **profiles**: id (matches Supabase auth user id), tenant_id, full_name, phone, role, is_active
- **user_branches**: user_id, branch_id — many-to-many, for staff assigned to multiple branches
- **companies**: id, tenant_id, name, contact_person, phone, notes (this is the *brand catalog* — Bayer, Syngenta, etc.)
- **products**: id, tenant_id, company_id, name, active_ingredient, formulation_type (enum: EC, WP, SL, SC, granules, powder, other), pack_size, pack_unit (ml/L/g/kg), crop_tags (text[]), pest_tags (text[]), reorder_level
- **batches**: id, product_id, branch_id, batch_number, manufacture_date, expiry_date, cost_price, sale_price, quantity_received, quantity_current
- **stock_transfers**: id, tenant_id, from_branch_id, to_branch_id, status (enum: pending/in_transit/received/cancelled), requested_by, received_by, created_at, received_at
- **stock_transfer_items**: transfer_id, batch_id, quantity
- **customers**: id, tenant_id, branch_id, name, phone, address, land_size, crop_type, credit_limit, is_active
- **sales**: id, tenant_id, branch_id, sale_number (human-readable sequential per branch, e.g. `MUL-0001`), customer_id (nullable for walk-in), sold_by (user_id), payment_type (cash/credit/partial), subtotal, discount_total, grand_total, amount_paid, status (enum: completed/void/returned), created_at
- **sale_items**: id, sale_id, batch_id, product_name_snapshot, quantity, unit_price, discount, line_total *(store a name/price snapshot so historical receipts stay accurate even if the product record changes later)*
- **sale_returns**: id, sale_id, reason, refunded_amount, restocked (bool), created_by, created_at
- **credit_ledger**: id, tenant_id, customer_id, sale_id (nullable), type (enum: sale_credit/payment/adjustment), amount, running_balance, created_at, note
- **payments**: id, tenant_id, customer_id, amount, method (cash/bank_transfer/other), received_by, created_at, note
- **suppliers**: id, tenant_id, name, contact_person, phone, address (who the shop buys from — may or may not be same as a `companies` row; link if applicable)
- **purchases**: id, tenant_id, branch_id, supplier_id, purchase_number, status (enum: ordered/received/partially_received), total_amount, created_at
- **purchase_items**: id, purchase_id, product_id, batch_number, expiry_date, quantity_ordered, quantity_received, cost_price
- **supplier_ledger**: id, tenant_id, supplier_id, purchase_id (nullable), type (enum: purchase/payment/adjustment), amount, running_balance, created_at
- **schemes**: id, tenant_id, company_id, description, target_quantity, bonus_description, valid_from, valid_to
- **day_closings**: id, tenant_id, branch_id, closing_date, opening_cash, total_cash_sales, total_credit_sales, total_payments_received, closing_cash_expected, closing_cash_actual, difference, closed_by, notes *(the end-of-day cash reconciliation a shop owner does every night — see Section 5.4)*
- **audit_log**: id, tenant_id, user_id, action, table_name, record_id, before_data (jsonb), after_data (jsonb), created_at

Every table: proper foreign keys, `created_at`/`updated_at` timestamps, indexes on `tenant_id` and `branch_id`. Write RLS policies per table per role — this is not optional, test it.

---

## 4. Full POS / Billing Flow — This Is the Heart of the App

### 4.1 Checkout Screen
- Large, fast product search (by name, company, or barcode-style SKU field) with keyboard shortcuts — a salesman should be able to complete a sale in seconds without touching the mouse much.
- Shows available batches for a selected product with expiry dates visible; if multiple batches exist, sell from the **nearest-expiry batch first (FEFO — first-expiry-first-out)** by default, with the ability to override.
- Add multiple line items, adjust quantity, apply per-line or whole-bill discount (role-gated — salesman may have a max discount % without manager override).
- Choose customer: walk-in (no record) or existing customer (search by name/phone) or add a new customer inline without leaving the screen.
- Choose payment type: **Cash (full)**, **Credit (full — added to customer's udhaar balance)**, or **Partial (some cash now, rest added to credit)**.
- On submit: create `sales` + `sale_items` rows, deduct `batches.quantity_current`, and if any credit portion exists, create a `credit_ledger` entry and update the customer's running balance — all inside a single database transaction so partial failures never leave stock/ledger out of sync.
- Block or warn (tenant-configurable) if selling an expired batch.
- Warn at checkout if a credit sale would push the customer over their `credit_limit`, but allow owner/manager to override.

### 4.2 Receipt ("Parchi") — Must Match Real Shop Needs
- Every completed sale immediately generates a **printable receipt**, formatted for an **80mm thermal receipt printer** (the standard in Pakistani shops) using print-optimized CSS (`@media print` with a fixed narrow width) — this must work with a normal browser print dialog with zero extra setup.
- Receipt content: shop name/logo, branch name & phone, sale number, date/time, salesman name, each line item (product, quantity, unit price, line total), subtotal, discount, grand total, amount paid, remaining balance if credit, and the shop's dealer license number if the owner wants it shown.
- Also generate a **downloadable PDF version** of the same receipt (for emailing or WhatsApp-sharing) as a secondary format.
- Add a **"Share on WhatsApp"** button that opens `wa.me` with a pre-filled text summary + link/attachment where feasible.
- Support **re-printing any past receipt** from sale history without re-creating the sale.

### 4.3 Sales Return / Void
- A manager-approved flow to return items from a completed sale (full or partial), which restocks the batch (if the tenant wants restocking) and reverses the credit ledger or refunds cash.
- A separate **void sale** flow for genuine mistakes, fully logged in `audit_log` with the reason.

### 4.4 Day-End Cash Closing
- At end of day, a "Close Day" screen per branch: system shows total cash sales, total credit sales, total payments received in cash, and asks the user to enter actual cash counted in the drawer. Calculates and stores any difference. Saves to `day_closings`. This is a real daily ritual shop owners do — build it as a proper guided flow, not an afterthought.

---

## 5. Daily & Monthly Record-Keeping (Owner's Core Need)

- **Daily Sales Report**: total sales (cash/credit split), number of transactions, top-selling products, sales by salesman, comparison to same day last week/last month — filterable by branch or consolidated.
- **Monthly Sales Report**: month-over-month trend, company-wise sales breakdown (how much of Bayer vs Syngenta vs local brands sold), profit margin (sale price vs cost price from batches), seasonal comparison.
- **Custom date range report** for any period the owner wants (e.g. "cotton season so far").
- All reports must be **exportable** (CSV at minimum, PDF as a bonus) so the owner can hand a printout to an accountant or keep for tax purposes.
- A **dashboard home screen** on login showing, at a glance: today's sales so far, this month's sales so far, low-stock alerts, expiring-soon batches, and outstanding credit total — this is what the owner should see first every time they open the app.

---

## 6. Inventory, Purchasing & Cross-Branch Transfers

- Full company/product/batch management as described in Section 3.
- Purchase flow: create a purchase order against a supplier → mark items received (partial receipt supported) → stock automatically added to the correct branch's batches → supplier ledger updated.
- **Stock transfer between branches**: branch A requests or sends stock to branch B; status moves pending → in_transit → received; stock is deducted from the sending branch and only added to the receiving branch once marked received (never double-counted).
- Low-stock alerts based on each product's `reorder_level`.
- Expiry alerts: a dashboard widget and a dedicated "Expiring Soon" report showing batches expiring within a configurable window (e.g. 30/60/90 days).

---

## 7. Customer (Udhaar) & Supplier Ledgers

- Every customer has a running balance visible at a glance, full transaction history (every credit sale and every payment), and a printable statement.
- Recording a payment against a customer's balance should be a two-click action from the customer's profile or directly from the POS/credit screen.
- Same structure mirrored for suppliers: what the shop owes each supplier, payment history, printable statement.

---

## 8. Design & UX

- Load and follow the frontend-design guidance available in this environment before building UI — the app should look **distinctive and professional**, not like a generic admin template. Avoid default shadcn look with zero customization; pick a real color identity (something that reads as trustworthy/agricultural — deep green, earth tones — is a reasonable direction, but make an intentional choice, don't just default).
- Fully responsive: the POS screen especially must work well on a phone/tablet at the counter, not just desktop.
- Fast: the POS/checkout path should feel instant — optimistic UI updates where safe, no unnecessary loading spinners on the critical sale path.
- Dashboard should prioritize urgency: overdue credit, expiring stock, and low inventory should be visually prominent, not buried.

---

## 9. What Makes This Unique (build these in, don't skip)

1. **FEFO batch selling** (first-expiry-first-out) built into the POS by default — most competing shop software just does flat inventory, this doesn't.
2. **Credit-limit-aware POS** — warns in real time at checkout, not after the fact.
3. **Day-end cash reconciliation** built as a real guided flow, matching what shop owners already do on paper.
4. **Cross-branch stock transfer with proper approval flow**, not just a manual stock edit.
5. **Company-wise and scheme/bonus tracking** — a feature almost no generic POS software has, but pesticide shops specifically need because of supplier bonus schemes.
6. **Consolidated vs per-branch owner view**, switchable, tenant-configurable — most shop software is single-location only.

---

## 10. Non-Functional Requirements

- Every table isolated by `tenant_id` via RLS — test that one tenant can never see another tenant's data under any role, including via direct API calls.
- Wrap every multi-step operation (sale creation, purchase receipt, stock transfer receipt, day closing) in a database transaction so nothing is left half-updated.
- Centralize permission checks (a single helper used everywhere), not duplicated per page/action.
- Seed script: create one demo tenant with 2 branches, 5+ companies, 20+ products with batches at varied expiry dates, 10+ customers with mixed credit histories, and a week of sample sales — so the whole app is testable immediately.
- Leave clear TODO markers for: subscription/payment billing (not built yet), SMS/WhatsApp automated sending (stub the function so it's easy to wire a real provider later).

---

## 11. Performance Requirements — Non-Negotiable, Build These In From Day One

Performance is not an optimization pass to do later — it must be designed in from the first line of code. The target user is a shopkeeper standing at a counter with a customer waiting; anything slow directly costs the business money and trust.

### 11.1 Hard Speed Targets
- **Tab/page navigation (switching between Dashboard, POS, Inventory, Reports, etc.)**: under 300–500ms, should feel instant
- **POS checkout — button press to confirmation**: under 500ms, this is the single most important number in the whole app
- **Product/customer search or autocomplete inside POS**: under 200ms, must feel real-time as the user types
- **Dashboard first load**: under 1 second
- **Report generation (daily/monthly/custom range)**: 1–2 seconds is acceptable given aggregation work, but must show a loading state, never a frozen screen
- **Any raw database query**: simple indexed query 10–50ms, joined query 50–150ms, heavy aggregation query up to 300–400ms — anything beyond that means something is misconfigured and must be fixed before shipping, not after
- Treat anything at or above 1 second on a navigation/interaction path as a bug to fix immediately, not a known limitation to accept.

### 11.2 Required Architecture Decisions to Hit These Targets

1. **Fetch data in Server Components, not client-side `useEffect`.** Every page's initial data must be fetched server-side during render, not after mount via a client-side waterfall. Client-side fetching (via TanStack Query) is only for data that must update after the page has already loaded (e.g. live stock count refreshing, polling).
2. **Index every column used in a `WHERE`, `JOIN`, or `ORDER BY` clause** — this means `tenant_id`, `branch_id`, all foreign keys (`product_id`, `customer_id`, `supplier_id`, `batch_id`, etc.), and any date columns used for report filtering (`created_at`, `expiry_date`). Add these indexes in the initial migration, not retroactively.
3. **Write RLS policies so `auth.uid()` and any other function calls are wrapped to evaluate once per query, not once per row** — e.g. wrap as `(select auth.uid())` inside the policy rather than calling it bare, so Postgres caches the result instead of re-running it for every row scanned. This single detail is responsible for a large share of real-world Supabase slowdowns in production apps.
4. **Never use `select('*')`.** Every query must explicitly list only the columns that specific screen actually needs. This reduces payload size and query cost on every single call.
5. **Avoid N+1 query patterns entirely.** Never fetch a list and then loop over it firing one query per row for related data (e.g. fetching 20 products then 20 separate calls for each one's company name). Use a single query with a proper join/nested select instead.
6. **Set the Supabase project region to the closest available region to Pakistan** (e.g. Singapore or Mumbai, whichever Supabase offers) at project creation time — do not default to a US/EU region, since that alone adds hundreds of milliseconds of network latency to every request.
7. **Use Supabase's connection pooler (Supavisor) in transaction mode** for all serverless/Vercel-deployed connections, not a direct database connection — this avoids connection exhaustion and the latency/errors that come with it under concurrent load.
8. **Cache client-side data with TanStack Query** wherever the same data is displayed across multiple views or re-visited frequently (e.g. product list, customer list), so switching tabs doesn't always trigger a fresh database round-trip when the data hasn't changed. Invalidate the cache precisely on the actions that change that data (a new sale invalidates stock/customer balance, not the entire cache).
9. **Paginate every list view** (sales history, product list, customer list) — never load an unbounded result set into a single query or render. Default to a sensible page size (e.g. 25–50 rows) with server-side pagination.
10. **Batch multi-step writes into a single database transaction** (as already required in Section 10) — this is also a performance matter, since it avoids multiple sequential round-trips for what should be one atomic operation.

### 11.3 Verification Requirement
Before considering any module "done," check its real query performance using Supabase's Query Performance view (Dashboard → Database → Query Performance) rather than assuming it's fast because it feels fast on a small seed dataset. Test critical paths (POS checkout, dashboard load, report generation) against a seed dataset large enough to be realistic (thousands of sales/batches, not a handful), so performance problems surface during development, not after a real shop's data has grown.

---

## 12. Deliverable

Set up the complete Next.js + Supabase project exactly as specified in Section 1, generate and run the full database schema and RLS policies from Section 3 (with indexes and RLS performance patterns from Section 11 applied from the start, not retrofitted), and build every module in Sections 4–7 as fully working pages connected to real Supabase data — not static mockups. Confirm the understanding summary from Section 1.3 before writing schema/code. Prioritize the POS → receipt → daily/monthly report pipeline first since it's the core daily-use loop, then build outward to purchasing, transfers, and settings. Treat Section 11's speed targets as acceptance criteria for every module, not a final-polish step.