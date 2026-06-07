/**
 * OneClick Hub — master install & bootstrap script.
 * Runs dependencies, env, store link (optional), automation, catalog, and verification.
 *
 * Usage:
 *   npm run setup:all
 *   npm run setup:all -- --link-store
 *   npm run setup:all -- --catalog-dry-run --skip-build
 */
import {copyFileSync, existsSync, readFileSync, writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {join} from 'node:path';
import {
  isPlaceholder,
  parseEnvFile,
  validateStoreEnvRecord,
} from '../shared/store-env-core.ts';
import {npmCommand, runCommand, runNpm} from './lib/spawn-npm';

type InstallOptions = {
  skipInstall: boolean;
  skipStore: boolean;
  linkStore: boolean;
  skipAutomation: boolean;
  skipCatalog: boolean;
  skipBuild: boolean;
  catalogDryRun: boolean;
  ciOnly: boolean;
};

const BRAND_DEFAULTS: Record<string, string> = {
  PUBLIC_BRAND_NAME: 'OneClick Hub',
  PUBLIC_BRAND_TAGLINE: 'Discover. Tap. Own.',
  PUBLIC_BRAND_DESCRIPTION: 'Immersive 3D Shopify storefront — Pixar-style discovery',
  PUBLIC_3D_EXPERIENCE: '1',
  CATALOG_SUPPLIER_CSV_PATH: 'scripts/catalog/feeds/example-products.csv',
  FEATURED_COLLECTION_HANDLES:
    'trending-now,beauty-grooming,technology,gaming',
};

function parseArgs(argv: string[]): InstallOptions {
  return {
    skipInstall: argv.includes('--skip-install'),
    skipStore: argv.includes('--skip-store'),
    linkStore: argv.includes('--link-store'),
    skipAutomation: argv.includes('--skip-automation'),
    skipCatalog: argv.includes('--skip-catalog'),
    skipBuild: argv.includes('--skip-build'),
    catalogDryRun: argv.includes('--catalog-dry-run'),
    ciOnly: argv.includes('--ci-only'),
  };
}

function printHelp() {
  console.log(`OneClick Hub — setup:all (single install script)

Usage:
  npm run setup:all
  npm run setup:all -- [options]

Options:
  --link-store       Run interactive Shopify login + link + env pull
  --skip-store       Never run store:setup (default unless --link-store)
  --skip-install     Skip npm install
  --skip-automation  Skip automation pipeline
  --skip-catalog     Skip catalog plan/sync
  --skip-build       Use automate (no production build)
  --catalog-dry-run  Catalog sync in dry-run mode
  --ci-only          automate:ci only (no store required)
  --help, -h         Show this help

What runs (in order):
  1. Node.js preflight
  2. npm install --legacy-peer-deps
  3. .env bootstrap (OneClick Hub + 3D experience defaults)
  4. store:setup (only with --link-store)
  5. npm run codegen (when store env is valid)
  6. npm run automate:full | automate:ci | automate
  7. catalog plan + smart-sync (when Admin API configured)
  8. Summary + architecture diagram + doc links

Docs:
  docs/oneclick-hub-3d-master-design.md
  docs/oneclick-hub-3d-spec.md
`);
}

function log(phase: string, message: string) {
  console.log(`\n[setup:${phase}] ${message}`);
}

function logStep(message: string) {
  console.log(`  → ${message}`);
}

function assertNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 22) {
    console.error(
      `Node.js 22+ required (found ${process.versions.node}). Install from https://nodejs.org/`,
    );
    process.exit(1);
  }
  log('preflight', `Node ${process.versions.node} OK`);
}

function assertProjectRoot(cwd: string) {
  const packageJson = join(cwd, 'package.json');
  if (existsSync(packageJson)) {
    log('preflight', `Project root OK (${cwd})`);
    return;
  }
  console.error(`
[setup:preflight] package.json not found in: ${cwd}

You are not in the OneClick Hub / Shopify project folder.
npm must be run from the directory that contains package.json.

Windows (PowerShell):
  cd $HOME
  git clone https://github.com/amjad2161/Shopify.git
  cd Shopify
  .\\setup.ps1 --link-store

macOS / Linux:
  git clone https://github.com/amjad2161/Shopify.git
  cd Shopify
  npm run setup:all -- --link-store
`);
  process.exit(1);
}

function uncommentEnvKey(content: string, key: string): string {
  const commented = new RegExp(`^#\\s*(${key}=.*)$`, 'm');
  return content.replace(commented, '$1');
}

function setEnvLine(
  content: string,
  key: string,
  value: string,
  onlyIfEmpty = true,
): string {
  content = uncommentEnvKey(content, key);
  const regex = new RegExp(`^(${key}=)(.*)$`, 'm');
  const match = content.match(regex);
  if (!match) {
    return `${content.trimEnd()}\n${key}=${value}\n`;
  }
  const current = match[2]?.trim() ?? '';
  if (onlyIfEmpty && current && !isPlaceholder(current)) {
    return content;
  }
  return content.replace(regex, `$1${value}`);
}

function bootstrapEnv(cwd: string) {
  const envPath = join(cwd, '.env');
  const examplePath = join(cwd, '.env.example');

  if (!existsSync(envPath)) {
    if (!existsSync(examplePath)) {
      throw new Error('Missing .env.example — cannot bootstrap environment');
    }
    copyFileSync(examplePath, envPath);
    logStep('Created .env from .env.example');
  }

  let content = readFileSync(envPath, 'utf8');

  const sessionMatch = content.match(/^SESSION_SECRET=(.*)$/m);
  const sessionValue = sessionMatch?.[1]?.trim() ?? '';
  if (!sessionValue || isPlaceholder(sessionValue)) {
    const secret = randomBytes(32).toString('hex');
    content = setEnvLine(content, 'SESSION_SECRET', secret, false);
    logStep('Generated SESSION_SECRET');
  }

  for (const [key, value] of Object.entries(BRAND_DEFAULTS)) {
    content = setEnvLine(content, key, value);
  }

  writeFileSync(envPath, content);
  log('env', 'OneClick Hub defaults applied (3D experience enabled)');
}

function readEnv(cwd: string) {
  const envPath = join(cwd, '.env');
  if (!existsSync(envPath)) return {};
  return parseEnvFile(readFileSync(envPath, 'utf8'));
}

function isStoreEnvValid(cwd: string) {
  return validateStoreEnvRecord(readEnv(cwd)) === null;
}

function isCatalogSyncReady(cwd: string) {
  const env = readEnv(cwd);
  const enabled = ['1', 'true', 'yes'].includes(
    (env.CATALOG_SYNC_ENABLED ?? '').trim().toLowerCase(),
  );
  const domain = env.PUBLIC_STORE_DOMAIN?.trim();
  const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  return Boolean(enabled && domain && token && token.length > 10);
}

function printArchitectureDiagram() {
  console.log(`
┌─────────────────────────────────────────────────────────────────────────┐
│                    OneClick Hub — system map                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Browser                                                                │
│    ├─ Immersive 3D home (R3F + GSAP + Zustand)  PUBLIC_3D_EXPERIENCE=1  │
│    ├─ Product rail / orb focus / PDP / cart                             │
│    └─ i18n (en / he / fr)                                               │
│                                                                         │
│  Hydrogen worker (React Router 7)                                       │
│    ├─ Storefront API  ← PUBLIC_STOREFRONT_API_TOKEN                     │
│    └─ Analytics (3d_orb_focus, 3d_orb_click, …)                         │
│                                                                         │
│  Automation (npm run automate)                                          │
│    env → brand → catalog-config → security → codegen → quality → build  │
│                                                                         │
│  Catalog (npm run catalog:*)                                            │
│    CSV/API suppliers → AI scoring → collections → product import        │
│                                                                         │
│  Design docs                                                            │
│    docs/oneclick-hub-3d-master-design.md                                │
│    docs/oneclick-hub-3d-spec.md                                         │
└─────────────────────────────────────────────────────────────────────────┘
`);
}

function printNextSteps(opts: InstallOptions, cwd: string) {
  const storeReady = isStoreEnvValid(cwd);
  const catalogReady = isCatalogSyncReady(cwd);

  console.log('\n── Next steps ──────────────────────────────────────────────\n');

  if (!storeReady) {
    console.log('  Store not linked yet. Run ONE of:\n');
    console.log('    npm run setup:all -- --link-store');
    console.log('    npm run store:setup\n');
    console.log('  Or set manually in .env:');
    console.log('    PUBLIC_STORE_DOMAIN=your-store.myshopify.com');
    console.log('    PUBLIC_STOREFRONT_API_TOKEN=...\n');
  } else {
    console.log('  Start the 3D storefront:\n');
    console.log('    npm run dev\n');
    console.log('  Open http://localhost:3000/\n');
  }

  if (!catalogReady) {
    console.log('  Optional — product import from suppliers:\n');
    console.log('    Set SHOPIFY_ADMIN_ACCESS_TOKEN and CATALOG_SYNC_ENABLED=1 in .env');
    console.log('    npm run catalog:plan');
    console.log('    npm run catalog:smart-sync\n');
  }

  console.log('  Re-run full pipeline anytime:\n');
  console.log('    npm run setup:all\n');

  if (opts.skipBuild && storeReady) {
    console.log('  Production build (requires valid .env):\n');
    console.log('    npm run build\n');
  }

  printArchitectureDiagram();
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return;
  }

  const opts = parseArgs(argv);
  const cwd = process.cwd();
  let exitCode = 0;

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  OneClick Hub — complete setup (install + automate + catalog) ║
╚══════════════════════════════════════════════════════════════╝
`);

  assertNodeVersion();
  assertProjectRoot(cwd);

  if (!opts.skipInstall) {
    log('install', 'Installing npm dependencies…');
    const install = runCommand(
      npmCommand(),
      ['install', '--legacy-peer-deps'],
      cwd,
      true,
    );
    if (!install.ok) {
      console.error('[setup:install] npm install failed');
      process.exit(install.status);
    }
  } else {
    log('install', 'Skipped (--skip-install)');
  }

  try {
    bootstrapEnv(cwd);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[setup:env] ${message}`);
    process.exit(1);
  }

  if (opts.linkStore && !opts.skipStore) {
    log('store', 'Interactive Shopify link (browser may open)…');
    const store = runNpm('store:setup', cwd, [], true);
    if (!store.ok) {
      console.warn('[setup:store] store:setup failed — fix credentials and re-run with --link-store');
      exitCode = 1;
    }
  } else if (!opts.skipStore && !isStoreEnvValid(cwd)) {
    log('store', 'Skipped (pass --link-store to authenticate and pull .env)');
  } else {
    log('store', 'Store credentials present in .env');
  }

  if (isStoreEnvValid(cwd)) {
    log('codegen', 'Running GraphQL codegen…');
    const codegen = runNpm('codegen', cwd, [], true);
    if (!codegen.ok) {
      console.warn('[setup:codegen] codegen failed — run npm run codegen after fixing .env');
      exitCode = 1;
    }
  } else {
    log('codegen', 'Skipped (store env not valid)');
  }

  if (!opts.skipAutomation) {
    let automateScript: string;
    if (opts.ciOnly || !isStoreEnvValid(cwd)) {
      automateScript = 'automate:ci';
    } else if (opts.skipBuild) {
      automateScript = 'automate';
    } else {
      automateScript = 'automate:full';
    }
    log('automate', `Running npm run ${automateScript}…`);
    const automate = runNpm(automateScript, cwd, [], true);
    if (!automate.ok) {
      console.warn('[setup:automate] Automation pipeline reported failures');
      exitCode = 1;
    }
  } else {
    log('automate', 'Skipped (--skip-automation)');
  }

  if (!opts.skipCatalog) {
    log('catalog', 'Catalog plan…');
    const plan = runNpm('catalog:plan', cwd, [], true);
    if (!plan.ok) {
      console.warn('[setup:catalog] catalog:plan failed');
      exitCode = 1;
    }

    if (isCatalogSyncReady(cwd)) {
      const syncArgs = opts.catalogDryRun ? ['--', '--dry-run'] : [];
      log(
        'catalog',
        opts.catalogDryRun ? 'Smart sync (dry-run)…' : 'Smart sync…',
      );
      const sync = runNpm('catalog:smart-sync', cwd, syncArgs, true);
      if (!sync.ok) {
        console.warn('[setup:catalog] catalog:smart-sync failed');
        exitCode = 1;
      }
    } else {
      log(
        'catalog',
        'Sync skipped — set CATALOG_SYNC_ENABLED=1 and SHOPIFY_ADMIN_ACCESS_TOKEN for live import',
      );
      logStep(`Example feed: ${BRAND_DEFAULTS.CATALOG_SUPPLIER_CSV_PATH}`);
    }
  } else {
    log('catalog', 'Skipped (--skip-catalog)');
  }

  printNextSteps(opts, cwd);

  if (exitCode !== 0) {
    console.log('\n[setup:all] Completed with warnings — see messages above.\n');
    process.exit(exitCode);
  }

  console.log('\n[setup:all] Done.\n');
}

main();
