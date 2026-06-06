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

```bash
git clone https://github.com/amjad2161/Shopify.git
cd Shopify
npm install
cp .env.example .env

# One-time: authenticate and link your Shopify store
shopify auth login
npx shopify hydrogen link
npx shopify hydrogen env pull --force

npm run dev
```

Open **http://localhost:3000/** — the storefront loads products, collections, and checkout from your real store.

If store credentials are missing, the app shows a setup page instead of mock data.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server (requires linked store in `.env`) |
| `npm run build` | Production client + worker bundle |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | React Router typegen + `tsc` |
| `npm run store:link` | Link Hydrogen to a storefront |
| `npm run store:env` | Pull Storefront API env vars into `.env` |
| `npm run store:setup` | Login, link store, and pull env (one-time) |

## Required environment variables

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Random string for cookie sessions |
| `PUBLIC_STORE_DOMAIN` | `your-store.myshopify.com` |
| `PUBLIC_STOREFRONT_API_TOKEN` | Storefront API public token |

Run `npx shopify hydrogen env pull --force` after linking to populate these automatically.

## Brand customization

Central brand tokens live in `app/lib/brand.ts`. Global typography and colors are in `app/styles/tailwind.css` and `app/styles/app.css`. The favicon is `app/assets/favicon.svg`.

## Deploy

Hydrogen deploys to **Shopify Oxygen**:

```bash
npm run build
npx shopify hydrogen deploy
```

See [Hydrogen deployment docs](https://shopify.dev/docs/custom-storefronts/hydrogen/deployment).

## Repository

This project is the canonical Shopify storefront for [github.com/amjad2161/Shopify](https://github.com/amjad2161/Shopify.git).
