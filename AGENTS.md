# AGENTS.md

## Cursor Cloud specific instructions

### Product

**Lumen Atelier** — Hydrogen headless storefront in this repo (`lumen-atelier` in `package.json`). Development uses **mock.shop** (no live Shopify credentials required for browse/cart flows).

### Prerequisites

- **Node.js** 22+ (see `engines` in `package.json`)
- **Shopify CLI** on PATH: `export PATH="$HOME/.local/bin:$PATH"` (installed globally in this VM via npm)

### Dependency refresh (automatic)

On VM startup, run from repo root:

```bash
npm ci
```

If `package-lock.json` is missing, use `npm install` instead.

### Run locally (manual — do not put in update script)

```bash
export PATH="$HOME/.local/bin:$PATH"
cd /agent/repos/Work
npm run dev
```

Dev server: **http://localhost:3000/** (GraphiQL at `/graphiql`).

Use **tmux** for long-running dev servers, e.g. session `hydrogen-dev`.

### Verify changes

```bash
npm run lint
npm run typecheck
npm run build
```

Hello-world E2E (mock catalog): home → `/products/gray-runners` → POST add-to-cart → `/cart` shows line item and cart count `1`.

### Linking a real store

Requires user/partner credentials outside the VM:

```bash
shopify auth login
npx shopify hydrogen link
```

Set `.env` with `PUBLIC_STORE_DOMAIN`, `PUBLIC_STOREFRONT_API_TOKEN`, and `SESSION_SECRET`. Do not commit `.env`.

### Gotchas

- Use `http://localhost:3000` (not `127.0.0.1`) if IPv6 binding causes curl issues.
- Some mock.shop variants are `availableForSale: false` (e.g. Clear Sunnies); use Gray Runners for cart tests.
- `npm run build` may warn about Hydrogen bundle analyzer / Rolldown — build still succeeds.

### Pushing to `amjad2161/Shopify`

The storefront lives in **this repo** (`Work`). To mirror it to `Shopify.git`, the cloud agent needs **write** access to that repository (the integration user `cursor[bot]` must be a collaborator with push permission, or a PAT with `repo` scope must be available in the environment).

Until push works from the VM, land code via the **Work** PR and mirror locally:

```bash
git clone https://github.com/amjad2161/Work.git
cd Work
git checkout cursor/lumen-atelier-shopify-bbe7   # or main after merge
git remote add shopify https://github.com/amjad2161/Shopify.git
git push shopify HEAD:main
```

### Related repos in workspace

| Path | Purpose |
|------|---------|
| `/agent/repos/Work` | **This storefront** (canonical codebase; mirror to `Shopify.git`) |
| `/agent/repos/amjad2161` | Separate BRAINIAC Python project — not the shop |
