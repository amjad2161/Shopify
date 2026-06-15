import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  parseEnvFile,
  validateStoreEnvRecord,
} from '../../app/lib/store-env';

/** True when .env has a valid live Shopify storefront configuration. */
export function hasLiveStoreEnv(): boolean {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return false;

  try {
    const env = parseEnvFile(readFileSync(envPath, 'utf8'));
    return validateStoreEnvRecord(env) === null;
  } catch {
    return false;
  }
}
