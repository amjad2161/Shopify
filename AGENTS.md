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
npm exec shopify -- auth login
npm run store:link
npm run store:env
```

Or one-shot: `npm run store:setup`.

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

### Automation (orchestrated pipeline)

Every layer runs its own automation module; results sync to `.automation/reports/latest.json` and a cross-module decision engine gates build/deploy.

```bash
npm run automate       # local: env + brand + security + codegen + quality
npm run automate:ci    # CI: quality always; env optional (warn if missing)
npm run automate:full  # local + production build when .env is valid
npm run ci             # alias for automate:ci
```

GitHub Actions workflow `.github/workflows/automation.yml` runs `automate:ci` on push/PR.

### Verify changes (manual)

```bash
npm run lint
npm run test
npm run typecheck
npm run build   # requires live store env in .env
```

Hello-world E2E (live catalog): home → pick any in-stock product → add to cart → `/cart` shows line item.

### Gotchas

- Use `http://localhost:3000` (not `127.0.0.1`) if IPv6 binding causes curl issues.
- `scripts/ensure-store-env.ts` runs before `dev` and `build` — no mock fallback.
- Optional env: `PUBLIC_BRAND_URL`, `FEATURED_COLLECTION_HANDLE` (see `.env.example`).
- Newsletter signup: `POST /newsletter` → Storefront API `customerCreate` with `acceptsMarketing: true`.
- `npm run build` may warn about Hydrogen bundle analyzer / Rolldown — build still succeeds.
- Do not commit `.env`.

### Repository

This is the canonical **Lumen Atelier** storefront at [github.com/amjad2161/Shopify](https://github.com/amjad2161/Shopify.git).

### Related repos

| Repo | Purpose |
|------|---------|
| [amjad2161/Shopify](https://github.com/amjad2161/Shopify) | **This storefront** (canonical codebase) |
| [amjad2161/Work](https://github.com/amjad2161/Work) | Original development repo |
