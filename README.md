# Serva Boutique

Build a production-ready, bilingual (Arabic + French) cash-on-delivery (COD) e-commerce store for a women's handbag brand called Serva, targeting the Moroccan market. It is not a full cart/checkout store — it is a high-conversion single-product-style landing page where the customer submits their contact + delivery info via an order form (COD, no online payment), plus a secure admin dashboard to manage incoming orders.
Deploy target: Vercel. Backend/DB: Supabase.
TECH STACK (use exactly this)

* Next.js (latest, App Router) + TypeScript + React Server Components
* Tailwind CSS + shadcn/ui for components
* next-intl for i18n — locale-based routing under `/[locale]`, Arabic (`ar`, RTL) + French (`fr`, LTR), French as default. Set `dir="rtl"` on `<html>` for Arabic and use CSS logical properties (`margin-inline-start`, `padding-inline-end`, etc.) everywhere so the layout mirrors correctly. Never hardcode left/right.
* Supabase via `@supabase/ssr` — create separate browser and server client utilities. Enable Row Level Security (RLS) on every table. The `service_role` key is server-only, never in a `NEXT_PUBLIC_` variable or any client component.
* Server Actions for the order submission (no exposed public API route needed for writing orders).
* react-hook-form + Zod for form state and validation.
* Fonts: an elegant serif for headings (e.g. Cormorant / Playfair Display) + clean sans for Latin body (e.g. Manrope / Inter), and a proper Arabic font (e.g. Tajawal or IBM Plex Sans Arabic) applied when locale is `ar`. Load via `next/font`.

BRAND & DESIGN DIRECTION — "Serva"
Serva is an elegant, modern, feminine women's-bag brand. The design must look like a real boutique, not a template dropship page. Aim for premium, trustworthy, and clean.

* Palette: warm neutral base (cream / sand / soft beige), deep sophisticated accent (choose one: burgundy `#6E2B3A`, terracotta, or muted rose), charcoal `#1C1C1C` for text, subtle gold/brass for premium touches. Put these in Tailwind theme tokens so they're easy to tweak.
* Feel: generous whitespace, large high-quality product imagery, refined serif headings, smooth micro-interactions, mobile-first (most Moroccan traffic is mobile). Fast (optimize images via `next/image`, lazy-load below the fold).
* Provide clean placeholder images/sections so it looks finished before real photos are added.
* Include a small language switcher (AR ⇄ FR) in the header that preserves the current page.

PAGES & SECTIONS
1. Landing page — `/[locale]` (the conversion machine)
Build these sections top-to-bottom (all text pulled from translation files, both AR + FR):

1. Sticky header — Serva logo, language switcher, a "Order now" button that scrolls to the form.
2. Hero — large lifestyle image, strong headline (who it's for + the offer) + one supporting line + primary CTA. RTL-aware layout.
3. Product gallery — main image with zoom + 3–4 thumbnails (angles) + 1–2 lifestyle shots.
4. Value / confidence block — material, dimensions, "what fits inside", quality points. Icon + text rows.
5. COD reassurance strip — display prominently: paiement à la livraison / الدفع عند الاستلام, free or low-cost delivery, easy return/satisfaction guarantee, delivery time. Trust badges.
6. Social proof — customer reviews/testimonials (with star ratings), space for real order screenshots / an unboxing video embed.
7. Offer / pricing — price, optional crossed-out "compare-at" price, bundle option ("Buy 2 – free delivery"), urgency element (limited stock / offer ending).
8. Order form — the core conversion element (see below).
9. FAQ — accordion answering COD objections (delivery time, payment, returns, sizing/colors).
10. Footer — brand blurb, contact (WhatsApp link), social links, policies.

2. Order form (COD — the most important component)
A single, low-friction form. Keep fields minimal:

* Full name (required)
* Phone (required, validate Moroccan format, e.g. `06/07XXXXXXXX` or `+212`)
* City (required — dropdown of major Moroccan cities + free text fallback)
* Address (required, textarea)
* Product / variant (color/model select if applicable)
* Quantity (default 1)
* Auto-captured hidden fields: selected `locale`, `total_price`, timestamp

Behavior:

* Validate with Zod; show inline errors in the active language.
* Submit via a Server Action that inserts into Supabase `orders` with status `pending`.
* On success: show a localized thank-you state ("We'll call you shortly to confirm — الدفع عند الاستلام").
* Handle errors gracefully (retry, no lost data).
* Bonus: fire a WhatsApp/notification hook on new order (leave a clearly-marked TODO stub if not wired).

3. Admin dashboard — `/[locale]/admin` (auth-protected)

* Login page using Supabase Auth (email + password). Protect all `/admin` routes via middleware — unauthenticated users are redirected to login.
* Orders table with: customer name, phone (click-to-call + click-to-WhatsApp), city, address, product, qty, total, status, created date.
* Status workflow (COD lifecycle): `pending → confirmed → shipped → delivered → returned / cancelled`. Editable via a dropdown per row; updates persist to Supabase.
* Filters: by status, by city, by date range. Search by name/phone.
* Metrics cards at the top: total orders, confirmation rate, delivery rate, return rate, revenue from delivered orders, today's orders. (These are the numbers that decide a COD business — make them prominent.)
* Optional: Supabase Realtime subscription so new orders appear live.
* Export orders to CSV.

DATABASE (Supabase / Postgres)
Create this schema via SQL migration. Enable RLS on both tables.
sql

```sql
-- PRODUCTS (optional but recommended for multi-SKU later)
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_fr text not null,
  name_ar text not null,
  description_fr text,
  description_ar text,
  price numeric not null,
  compare_at_price numeric,
  images jsonb default '[]',
  variants jsonb default '[]',   -- e.g. colors
  active boolean default true,
  created_at timestamptz default now()
);

-- ORDERS (COD)
create table orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  product_id uuid references products(id),
  product_name text,             -- snapshot at order time
  variant text,                  -- selected color/model
  quantity int not null default 1,
  customer_name text not null,
  phone text not null,
  city text not null,
  address text not null,
  total_price numeric not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','returned','cancelled')),
  locale text default 'fr',
  notes text,                    -- admin notes
  source text                    -- e.g. 'facebook','tiktok','instagram'
);

alter table products enable row level security;
alter table orders enable row level security;

-- RLS: public can INSERT orders (place an order) but NOT read them.
create policy "public can create orders"
  on orders for insert
  to anon
  with check (true);

-- RLS: only authenticated (admin) users can read/update orders.
create policy "admins can read orders"
  on orders for select
  to authenticated
  using (true);

create policy "admins can update orders"
  on orders for update
  to authenticated
  using (true);

-- RLS: products readable by everyone, writable only by authenticated.
create policy "products public read"
  on products for select
  to anon, authenticated
  using (active = true);

create policy "products admin write"
  on products for all
  to authenticated
  using (true) with check (true);
```

Note: the order form uses the anon key with the insert-only policy, so no service-role key is exposed to the browser. Reading/managing orders happens only in the authenticated admin area (server-side).
ENV VARS (document in `.env.example`)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=       # publishable/anon key — safe on client with RLS
SUPABASE_SERVICE_ROLE_KEY=           # SERVER ONLY — never NEXT_PUBLIC
NEXT_PUBLIC_SITE_URL=
```

PROJECT STRUCTURE (suggested)

```
app/
  [locale]/
    layout.tsx            # sets <html lang dir>, fonts, NextIntlClientProvider
    page.tsx              # landing page (composes sections)
    admin/
      layout.tsx          # auth guard
      page.tsx            # orders dashboard
      login/page.tsx
  auth/confirm/route.ts   # supabase auth callback
components/
  sections/               # Hero, Gallery, ValueBlock, CodStrip, SocialProof, Offer, Faq, Footer
  order-form/
  admin/                  # OrdersTable, MetricsCards, StatusSelect, Filters
  ui/                     # shadcn
lib/
  supabase/{client.ts,server.ts,middleware.ts}
  validation/order.ts     # Zod schema
i18n/
  messages/{fr.json,ar.json}
  request.ts, routing.ts
middleware.ts             # next-intl + supabase session refresh + admin guard
```

i18n REQUIREMENTS

* All user-facing strings in `messages/fr.json` and `messages/ar.json` — no hardcoded text in components.
* `<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>`.
* Use logical CSS properties so RTL mirrors automatically; verify hero, form, and admin table all look correct in Arabic.
* Localize numbers/prices (MAD) and dates per locale.
* Add `hreflang` alternate tags for SEO.

BUILD ORDER (do it in this sequence)

1. Scaffold Next.js + TS + Tailwind + shadcn/ui; init git.
2. Wire next-intl (`[locale]` routing, middleware, fr/ar messages, RTL).
3. Set up Supabase clients (`@supabase/ssr`), run the SQL migration, enable RLS.
4. Build the landing page sections with the Serva design system + placeholder content (both languages).
5. Build the order form → Zod validation → Server Action → insert into `orders` → thank-you state.
6. Build Supabase Auth + protected `/admin` (login, middleware guard).
7. Build the orders dashboard (table, status workflow, filters, metrics cards, CSV export, optional realtime).
8. Polish: responsive/mobile pass, RTL QA, image optimization, loading/error states, SEO metadata + Open Graph, favicon.
9. Add `README.md` (setup, env, deploy to Vercel + Supabase steps) and `.env.example`.

ACCEPTANCE CRITERIA

* Site works fully in both French and Arabic; Arabic renders correctly RTL with no broken layout.
* A visitor can place a COD order; it lands in Supabase with status `pending`; the anon user cannot read any orders (RLS verified).
* Admin can log in, see all orders, change status through the full COD lifecycle, filter/search, and see the metrics cards.
* The `service_role` key never appears client-side.
* Mobile-first, fast, and visually premium — looks like a boutique, not a template.
* Deploys cleanly to Vercel with the documented env vars.

NICE-TO-HAVE (add as TODO stubs if time-limited)

* WhatsApp/SMS notification to admin on new order.
* Facebook Pixel + TikTok Pixel slots (env-configurable) for ad tracking + conversion events on order submit.
* Multiple products via the `products` table + dynamic `/[locale]/p/[slug]` pages.
* Basic rate-limiting / honeypot on the order form to reduce fake orders.

Start now. Build incrementally, keep components clean and typed, and show me the running landing page first before wiring the admin.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/55e3298d-b8c6-4999-8570-056c8add4c5f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
