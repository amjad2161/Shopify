import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {parseEnvFile} from '../../../app/lib/store-env.ts';
import {getConfiguredAdapters} from '../../catalog/suppliers/registry.ts';
import type {CatalogEnv} from '../../catalog/types.ts';
import {
  hasAdminCredentials,
  isCatalogSyncEnabled,
  readCatalogEnv,
} from '../../catalog/lib/parse-env.ts';
import type {AutomationModule, ModuleResult} from '../types.ts';

export const supplierEnvModule: AutomationModule = {
  id: 'supplier-env',
  name: 'Supplier & catalog env',
  tier: 0,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];
    const envPath = join(ctx.cwd, '.env');

    if (!existsSync(envPath)) {
      signals.push({
        module: 'supplier-env',
        key: 'no-env',
        severity: 'info',
        message: 'Supplier checks skipped — no .env',
      });
      for (const signal of signals) bus.publish(signal);
      return {
        id: 'supplier-env',
        name: 'Supplier & catalog env',
        status: 'skip',
        durationMs: Date.now() - started,
        signals,
      };
    }

    const env = readCatalogEnv(ctx.cwd) as CatalogEnv;
    const configured = getConfiguredAdapters(env);

    if (isCatalogSyncEnabled(env)) {
      signals.push({
        module: 'supplier-env',
        key: 'sync-enabled',
        severity: 'info',
        message: 'CATALOG_SYNC_ENABLED is on',
      });
    } else {
      signals.push({
        module: 'supplier-env',
        key: 'sync-disabled',
        severity: 'info',
        message: 'Catalog sync disabled — set CATALOG_SYNC_ENABLED=1 to run live imports',
      });
    }

    if (hasAdminCredentials(env)) {
      signals.push({
        module: 'supplier-env',
        key: 'admin-ready',
        severity: 'info',
        message: 'Shopify Admin API token present',
      });
    } else if (isCatalogSyncEnabled(env)) {
      signals.push({
        module: 'supplier-env',
        key: 'missing-admin',
        severity: ctx.mode === 'ci' ? 'warn' : 'error',
        message:
          'SHOPIFY_ADMIN_ACCESS_TOKEN required for catalog sync — create a custom app with write_products + write_collections',
      });
    }

    if (configured.length === 0) {
      signals.push({
        module: 'supplier-env',
        key: 'no-suppliers',
        severity: 'warn',
        message:
          'No supplier adapters configured — set CATALOG_SUPPLIER_CSV_PATH or marketplace API keys',
      });
    } else {
      signals.push({
        module: 'supplier-env',
        key: 'suppliers-ready',
        severity: 'info',
        message: `Configured suppliers: ${configured.map((a) => a.id).join(', ')}`,
        data: {adapters: configured.map((a) => a.id)},
      });
    }

    const raw = parseEnvFile(readFileSync(envPath, 'utf8'));
    if (raw.FEATURED_COLLECTION_HANDLES?.trim()) {
      signals.push({
        module: 'supplier-env',
        key: 'featured-collections',
        severity: 'info',
        message: `Homepage collections: ${raw.FEATURED_COLLECTION_HANDLES}`,
      });
    }

    for (const signal of signals) bus.publish(signal);

    const hasError = signals.some((s) => s.severity === 'error');
    const hasWarn = signals.some((s) => s.severity === 'warn');

    return {
      id: 'supplier-env',
      name: 'Supplier & catalog env',
      status: hasError ? 'fail' : hasWarn ? 'warn' : 'pass',
      durationMs: Date.now() - started,
      signals,
      artifacts: {
        configuredSuppliers: configured.map((a) => a.id),
        adminReady: hasAdminCredentials(env),
      },
    };
  },
};
