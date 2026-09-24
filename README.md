# Pesticide Shop Management SaaS (Multi-Tenant & Multi-Branch)

A complete, production-ready Point-of-Sale (POS) and business management platform designed for pesticide and agri-input shops in Pakistan.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (`"strict": true`)
- **Styling**: Tailwind CSS with custom agricultural theme palette
- **Database**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`) with full RLS multi-tenant security
- **State & UI**: TanStack Query, Lucide Icons, Date-Fns

## Environment Variables (`.env.example`)

Copy `.env.example` to `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run development server
npm run dev

# 3. Build for production
npm run build
```

## Key Modules & Unique Features
1. **FEFO POS Counter Terminal**: First-Expiry-First-Out automated batch selection and real-time farmer udhaar credit limit alerts.
2. **80mm Thermal Receipt ("Parchi") & WhatsApp Share**: Native thermal printing formatting (`@media print`), PDF export, and direct `wa.me` shortcut.
3. **Multi-Branch Stock Transfers**: Request -> Approval -> Receipt workflow preventing double counting.
4. **Day-End Cash Reconciliation ("Hisab Kitaab")**: Guided daily cash drawer closing screen matching drawer counts against cash sales & collections.
5. **Supplier Bonus Schemes & Brand Analytics**: Company-wise sales breakdown for Bayer, Syngenta, FMC, and local generic brands.
