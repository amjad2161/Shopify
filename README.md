# Lumen Atelier — Shopify Hydrogen Storefront

Premium headless commerce storefront built with **Shopify Hydrogen** (2026.4), **React Router 7**, **TypeScript**, and **Tailwind CSS v4**. The shop runs against **mock.shop** in development so you can browse, add to cart, and test flows without a live store.

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Hydrogen 2026.4 + React Router 7 |
| Styling | Tailwind v4 + custom `app.css` |
| Runtime | Node.js 22+, Vite 8, Mini Oxygen |
| Catalog (dev) | [mock.shop](https://mock.shop) demo data |

## Quick start

```bash
git clone https://github.com/amjad2161/Shopify.git
cd Shopify
npm install
cp .env.example .env
# Set SESSION_SECRET in .env to any long random string (required for local dev)
npm run dev
```

Open **http://localhost:3000/** — you should see the **Lumen Atelier** homepage, product grid, and working cart.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server + GraphQL codegen |
| `npm run build` | Production client + worker bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | React Router typegen + `tsc` |

## Link your real Shopify store

1. Create a [Shopify Partner](https://partners.shopify.com) account and a development store.
2. Install Shopify CLI globally (or use the project devDependency):
   ```bash
   npm install -g @shopify/cli@latest
   shopify auth login
   ```
3. Link Hydrogen to your store:
   ```bash
   npx shopify hydrogen link
   ```
4. Copy env vars from `.env.example` (if present) or the CLI output into `.env`:
   - `PUBLIC_STORE_DOMAIN`
   - `PUBLIC_STOREFRONT_API_TOKEN`
   - `SESSION_SECRET` (random string)
5. Restart `npm run dev` and remove or hide the mock-shop notice in production.

## Brand customization

Central brand tokens live in `app/lib/brand.ts`. Global typography and colors are in `app/styles/tailwind.css` and `app/styles/app.css`. The favicon is `app/assets/favicon.svg`.

## Deploy

Hydrogen deploys to **Shopify Oxygen** (recommended):

```bash
npm run build
npx shopify hydrogen deploy
```

See [Hydrogen deployment docs](https://shopify.dev/docs/custom-storefronts/hydrogen/deployment).

## Repository

This project is the canonical Shopify storefront for [github.com/amjad2161/Shopify](https://github.com/amjad2161/Shopify.git).
