import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {parseEnvFile} from '../../../app/lib/store-env.ts';
import type {CatalogEnv} from '../types.ts';

export function readCatalogEnv(cwd: string): CatalogEnv {
  const envPath = join(cwd, '.env');
  if (!existsSync(envPath)) return {};
  return parseEnvFile(readFileSync(envPath, 'utf8')) as CatalogEnv;
}

export function isCatalogSyncEnabled(env: CatalogEnv) {
  const flag = env.CATALOG_SYNC_ENABLED?.trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export function isDryRun(env: CatalogEnv, cliDryRun?: boolean) {
  if (cliDryRun) return true;
  const flag = env.CATALOG_DRY_RUN?.trim().toLowerCase();
  return flag === '1' || flag === 'true' || flag === 'yes';
}

export function hasAdminCredentials(env: CatalogEnv) {
  const domain = env.PUBLIC_STORE_DOMAIN?.trim();
  const token = env.SHOPIFY_ADMIN_ACCESS_TOKEN?.trim();
  return Boolean(domain && token && token.length > 10);
}

export function defaultMarginPercent(env: CatalogEnv, verticalMargin: number) {
  const override = env.CATALOG_MARGIN_PERCENT?.trim();
  if (override) {
    const n = Number(override);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return verticalMargin;
}
