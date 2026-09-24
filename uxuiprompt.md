# UI/UX Restructuring Prompt — KisanDost POS

Give this to Antigravity to restructure the current UI into a proper, organized, easy-to-use software layout.

---

## 1. Move to a Sidebar Layout (replace the current top nav bar)

- Convert the current horizontal top navigation (Dashboard, POS Checkout, Inventory & FEFO, Purchases PO, Branch Transfers, Schemes & Bonuses, Farmers, Suppliers) into a **left sidebar**, collapsible (icon-only collapsed state + full expanded state, toggle button at the top of the sidebar).
- Keep a slim **top header bar** with only: shop/branch name, branch switcher dropdown, and the logged-in user's name/role — this stays visible regardless of sidebar state.
- Group sidebar items logically instead of one flat list:
  - **Overview**: Dashboard
  - **Sales**: POS Checkout, Sales History, Farmers (Udhaar)
  - **Inventory**: Inventory & FEFO, Purchases (PO), Suppliers
  - **Operations**: Branch Transfers, Schemes & Bonuses
  - **Reports**: Daily Report, Monthly Report, Custom Report
  - **Settings** (bottom of sidebar, visually separated): Users & Roles, Branches, Companies, Shop Profile
- Highlight the active section clearly (background fill + left accent bar, not just a text color change).
- On mobile/tablet width, the sidebar should collapse into a hamburger-triggered drawer, not squeeze itself into icons only — POS staff may use this on tablets at the counter.

## 2. Fix Visual Hierarchy & Consistency

- Establish a clear **typography scale** (page titles, section headers, card labels, body text, small metadata) and apply it consistently — right now card labels and page content look flat/same-weight.
- Standardize card design system-wide: same border-radius, same shadow/elevation, same internal padding across all stat cards, list cards, and alert cards.
- Give status/type badges (CASH, PARTIAL, CREDIT, Urgent, etc.) a consistent, limited color system — e.g. green family for completed/cash, amber for partial/pending, red only for genuinely urgent/overdue items — so color always means the same thing across the whole app.
- Add breadcrumbs or a page title header on every inner page (e.g. "Inventory & FEFO" as a clear page heading, not just a highlighted sidebar item) so the user always knows where they are.

## 3. Missing Pieces a Real SaaS Product Needs (add these)

- **Global search bar** in the top header — quickly find a product, customer, or sale by name/number without navigating through menus.
- **Notifications/alerts bell icon** in the header — surfaces low stock, expiring batches, and overdue credit as a persistent, dismissible list, not just dashboard cards the user might not scroll to.
- **User menu dropdown** (click on "Chaudhry Tariq Mehmood (Owner)") with: Profile, Switch Branch, Settings, Log Out — right now the name badge looks static/non-interactive.
- **Empty states** for every list/table — when a branch has zero sales, zero customers, etc., show a friendly message and a clear call-to-action instead of a blank area.
- **Loading skeletons** (not blank white flashes) for dashboard cards and tables while data fetches — reinforces the performance work already specified, and looks more polished.
- **Toast/confirmation feedback** on every action (sale completed, payment recorded, stock transferred) — a small success/error toast in the corner, so the user always gets clear confirmation something worked.
- **Consistent iconography** — audit that every sidebar item, card, and button icon comes from the same icon set (lucide-react, as already specified) at consistent sizes/weights.

## 4. Make the POS Screen Distinct From the Rest of the App

- The POS/Checkout screen should feel like a **focused work surface** — consider hiding the full sidebar (collapse to icon-only automatically) when POS Checkout is open, to maximize usable space for product search and the cart, since this is the highest-frequency, most time-sensitive screen in the whole app.
- Keep a persistent, always-visible "Total" and "Complete Sale" action area (sticky at the bottom or side) so the salesman never has to scroll to finish a transaction.

## 5. Settings Area (currently missing/underdeveloped)

- Build out a proper **Settings** section (as grouped in the sidebar above) covering: shop profile & license info, branch management, company/brand master list editing, user & role management, and the branch-mode toggle (independent/consolidated/hybrid) already specified in the master prompt.
- This should not be scattered — one place the owner always knows to go for configuration.

## 6. General Polish Requirements

- Ensure consistent spacing/margins across all pages (use a single spacing scale, e.g. Tailwind's default scale, applied consistently — no page should feel more "cramped" or "loose" than another).
- Verify color contrast is comfortable for long counter-use sessions — avoid overly saturated backgrounds in large areas; the current dark green header is fine as an accent/branding zone but shouldn't be overused elsewhere.
- Every interactive element (buttons, dropdowns, sidebar items) needs a visible hover and active/pressed state — right now some elements may look static.
- Confirm the whole app is responsive and usable at tablet width (768px–1024px) specifically, since that's realistic hardware for a shop counter, not just desktop and phone.

---

## Deliverable

Restructure the navigation into the sidebar layout described in Section 1, then apply the visual consistency, missing-piece additions, and polish items in Sections 2–6 across the entire app — not just the dashboard page. Keep all existing functionality and data connections intact; this is a layout/UX pass, not a feature or backend change. Show me the updated Dashboard and POS Checkout screens first for confirmation before applying the same system to every other page.