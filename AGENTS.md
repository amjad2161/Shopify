# AGENTS.md

## Project status

This repository is currently a **placeholder** only. It contains:

- `README.md` (title: "Shopify")
- GitHub issue templates under `.github/ISSUE_TEMPLATE/`

There is **no application source code**, dependency manifest, Dockerfile, CI config, or documented dev commands yet.

## Cursor Cloud specific instructions

### Services

No local services are defined. Nothing needs to be started for lint, test, build, or dev-server workflows until an app is added to the repo.

### When application code is added

After the first real implementation lands, update this section with:

- Required vs optional services (e.g. web app, API, database, Redis)
- Non-obvious startup caveats (env files, ports, migrations, Docker)
- Pointers to the canonical commands in `README.md`, `package.json`, `Makefile`, etc.

Do **not** duplicate obvious install steps here; keep the VM update script limited to dependency refresh only.

### Git

- Default branch: `main`
- Remote: `origin` → `github.com/amjad2161/Shopify`

### Verification today

Until code exists, "environment ready" means: git checkout works and the workspace matches the repo (README + issue templates). There are no lint, test, or run targets to execute.
