# AGENTS.md

## Cursor Cloud specific instructions

### Product

**Lumen Atelier** — Hydrogen headless storefront in this repo (`lumen-atelier` in `package.json`). **Live Shopify store required** — mock.shop is disabled; missing credentials fail fast with setup instructions.

### Prerequisites

- **Node.js** 22+ (see `engines` in `package.json`)
- **Shopify CLI** on PATH: `export PATH="$HOME/.local/bin:$PATH"` or use project devDependency via `npx shopify`
- Linked store credentials in `.env` (`PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, `SESSION_SECRET`)

### Store setup (required before dev/build)

```bash
shopify auth login
npx shopify hydrogen link
npx shopify hydrogen env pull --force
```

Or use npm scripts: `npm run store:link` then `npm run store:env`.

### Dependency refresh (automatic)

On VM startup, run from repo root:

```bash
npm ci
```

If `package-lock.json` is missing, use `npm install` instead.

### Run locally (manual — do not put in update script)

```bash
export PATH="$HOME/.local/bin:$PATH"
cd /workspace
npm run dev
```

Dev server: **http://localhost:3000/** (GraphiQL at `/graphiql`).

Use **tmux** for long-running dev servers, e.g. session `hydrogen-dev`.

### Verify changes

```bash
npm run lint
npm run typecheck
npm run build   # requires live store env in .env
```

Hello-world E2E (live catalog): home → pick any in-stock product → add to cart → `/cart` shows line item.

### Gotchas

- Use `http://localhost:3000` (not `127.0.0.1`) if IPv6 binding causes curl issues.
- `scripts/ensure-store-env.mjs` runs before `dev` and `build` — no mock fallback.
- `npm run build` may warn about Hydrogen bundle analyzer / Rolldown — build still succeeds.
- Do not commit `.env`.

### Repository

This is the canonical **Lumen Atelier** storefront at [github.com/amjad2161/Shopify](https://github.com/amjad2161/Shopify.git).

### Related repos

| Repo | Purpose |
|------|---------|
| [amjad2161/Shopify](https://github.com/amjad2161/Shopify) | **This storefront** (canonical codebase) |
| [amjad2161/Work](https://github.com/amjad2161/Work) | Original development repo |
