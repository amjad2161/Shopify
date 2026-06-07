# Lumen Atelier — Shopify Hydrogen Storefront

Premium headless commerce storefront built with **Shopify Hydrogen** (2026.4), **React Router 7**, **TypeScript**, and **Tailwind CSS v4**. This project is **production-only**: it requires a linked live Shopify store and never falls back to mock.shop.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Hydrogen 2026.4 + React Router 7 |
| Styling | Tailwind v4 + custom `app.css` |
| Runtime | Node.js 22+, Vite 8, Mini Oxygen |
| Catalog | Your linked Shopify store (Storefront API) |

## Quick start (live store)

**Run every command inside the project folder** (the folder that contains `package.json`).  
If you see `fatal: not a git repository` or `Could not read package.json`, you are in the wrong directory.

### macOS / Linux

```bash
git clone https://github.com/amjad2161/Shopify.git
cd Shopify
npm install
cp .env.example .env

# One-time: authenticate and link your Shopify store (from project folder)
npm run store:setup

npm run dev
```

### Windows (PowerShell)

**Important:** Run all commands from inside the `Shopify` project folder (where `package.json` lives).  
If you see `ENOENT: no such file or directory, open '...\package.json'`, you are in the wrong directory (for example `C:\Users\Mobar`).

```powershell
# 1) Clone (skip if you already have the folder)
cd $HOME
git clone https://github.com/amjad2161/Shopify.git
cd Shopify

# 2) Install dependencies — required before ANY shopify command
npm install

# 3) Create .env from template
Copy-Item .env.example .env

# 4) One-time store link (run each line; browser opens for login)
npm exec shopify -- auth login
npm exec shopify -- hydrogen link
npm run store:env

# 5) Start dev server
npm run dev
```

**Do not run `npx shopify` from `C:\Users\Mobar`** — that installs the wrong npm package (`shopify@4.1.0`). Always `cd` into `Shopify` first and use `npm exec shopify` or `npm run store:*` scripts (they use `@shopify/cli` from this project).

**Node.js:** Install [Node.js 22+](https://nodejs.org/) if `node -v` fails.

Open **http://localhost:3000/** — the storefront loads products, collections, and checkout from your real store.

If store credentials are missing, the app shows a setup page instead of mock data.

### One command — install everything

Runs dependencies, `.env` bootstrap (OneClick Hub + 3D), automation, catalog plan/sync, and prints the architecture map.

```bash
npm run setup:all
```

Link your Shopify store during setup (opens browser):

```bash
npm run setup:all -- --link-store
```

Windows PowerShell (from the `Shopify` folder):

```powershell
.\setup.ps1 --link-store
# or: .\scripts\install-oneclick-hub.ps1 --link-store
```

Useful flags: `--catalog-dry-run`, `--skip-build`, `--ci-only`, `--skip-catalog`. Run `npm run setup:all -- --help` for the full list.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (requires linked store in `.env`) |
| `npm run build` | Production client + worker bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (store env, brand, catalog taxonomy, fulfillment) |
| `npm run typecheck` | React Router typegen + `tsc` |
| `npm run store:link` | Link Hydrogen to a storefront |
| `npm run store:env` | Pull Storefront API env vars into `.env` |
| `npm run store:setup` | Login, link store, and pull env (one-time) |
| `npm run setup:all` | **Master install** — deps, env, automate, catalog, verification |
| `npm run automate` | Full local automation pipeline (all layers + decision bus) |
| `npm run automate:ci` | CI-safe pipeline (lint, test, typecheck; env optional) |
| `npm run automate:full` | Local pipeline + production build when `.env` is valid |
| `npm run ci` | Alias for `automate:ci` |
| `npm run catalog:plan` | Preview catalog taxonomy, suppliers, and sync readiness |
| `npm run catalog:sync` | Sync collections + import products (Admin API) |
| `npm run catalog:categories` | Create/update Shopify collections only |

## Automation architecture

Each process layer has a dedicated module that publishes signals to a shared bus; a decision engine cross-references them for build/deploy gates.

| Module | Layer | What it checks |
|--------|-------|----------------|
| `env` | Store | `.env` presence, live domain, no mock.shop |
| `brand` | SEO | `PUBLIC_BRAND_URL`, featured collection handle |
| `catalog-config` | Catalog | Commerce vertical taxonomy (13 categories) |
| `supplier-env` | Catalog | Supplier CSV/API credential checks |
| `catalog-health` | Catalog | Sync readiness, age-restricted compliance warnings |
| `security` | Hardening | `.gitignore`, newsletter protections, error boundary |
| `codegen` | GraphQL | Generated types vs route operations |
| `store-scripts` | Tooling | `npm exec shopify` patterns, predev gates |
| `quality` | Code | lint → test → typecheck |
| `deploy` | Release | Production build (`automate:full` only) |

Reports: `.automation/reports/latest.json` (also uploaded as a CI artifact).

## Required environment variables

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Random string for cookie sessions |
| `PUBLIC_STORE_DOMAIN` | `your-store.myshopify.com` |
| `PUBLIC_STOREFRONT_API_TOKEN` | Storefront API public token |

Run `npm run store:env` after linking to populate these automatically.

### Optional environment variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_BRAND_URL` | Canonical public URL for SEO / Open Graph (defaults to `https://{PUBLIC_STORE_DOMAIN}`) |
| `FEATURED_COLLECTION_HANDLE` | Collection handle for the homepage hero feature (default: `frontpage`) |
| `FEATURED_COLLECTION_HANDLES` | Comma-separated handles for homepage featured collections |
| `SHOPIFY_ADMIN_ACCESS_TOKEN` | Admin API token (`write_products`, `write_collections`) for catalog sync |
| `CATALOG_SYNC_ENABLED` | Set to `1` to allow live catalog import (default off) |
| `CATALOG_DRY_RUN` | Set to `1` to preview sync without Admin writes |
| `CATALOG_SUPPLIER_CSV_PATH` | Path to CSV product feed (see `scripts/catalog/feeds/example-products.csv`) |

## Catalog & dropship automation

Automated pipeline under `scripts/catalog/` builds **13 high-demand verticals** (beauty, women, tech, gaming, baby, kids, apparel, underwear, lingerie, adults-only, home, fitness, trending) as Shopify collections and imports products from external suppliers.

**Fulfillment model:** `source_seller` — each imported product stores `lumen_dropship.*` metafields (`source_platform`, `source_seller_id`, `source_product_id`). On order, line items route back to the original seller for shipping; tracking syncs to Shopify. See `scripts/catalog/fulfillment/routing.ts`.

```bash
# Preview plan (no Admin API required)
npm run catalog:plan

# Dry-run with example CSV feed
CATALOG_SUPPLIER_CSV_PATH=scripts/catalog/feeds/example-products.csv npm run catalog:sync

# Live sync (requires Admin token + CATALOG_SYNC_ENABLED=1)
CATALOG_SYNC_ENABLED=1 npm run catalog:sync
```

Age-restricted verticals (`lingerie-intimates`, `adults-only`) import as **DRAFT** with `age-18-plus` tags — enable age gates and confirm Shopify Acceptable Use Policy before publishing.

Supplier adapters: `csv_feed` (ready), plus stubs for CJ, Spocket, AliExpress, Amazon, Etsy, Temu, Printful, eBay, and generic REST APIs. Wire credentials in `.env` per platform.

Reports: `.catalog/reports/latest.json`

## Shopify admin checklist

Before launch, confirm in your linked Shopify admin:

1. **Navigation** — Online Store → Navigation: menus with handles `main-menu` (header) and `footer` (footer), or update handles in `app/root.tsx`.
2. **Featured collection** — Create or publish a collection and set `FEATURED_COLLECTION_HANDLE` in `.env` (or use Shopify’s default `frontpage` collection).
3. **Catalog** — Publish products so the homepage “Pieces we return to” grid and collection pages are populated.
4. **Newsletter** — The footer signup posts to `/newsletter` and creates a customer with `acceptsMarketing: true` via the Storefront API. Configure marketing consent and privacy copy in admin as needed.
5. **Policies** — Shipping, returns, and checkout policies in Shopify flow through to checkout; editorial copy on the homepage does not hard-code policy terms.

## Brand customization

Central brand tokens live in `app/lib/brand.ts`. Global typography and colors are in `app/styles/tailwind.css` and `app/styles/app.css`. The favicon is `app/assets/favicon.svg`.

## Deploy

Hydrogen deploys to **Shopify Oxygen**:

```bash
npm run build
npm exec shopify -- hydrogen deploy
```

See [Hydrogen deployment docs](https://shopify.dev/docs/custom-storefronts/hydrogen/deployment).

## Repository

This project is the canonical Shopify storefront for [github.com/amjad2161/Shopify](https://github.com/amjad2161/Shopify.git).
