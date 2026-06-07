const REQUIRED_STORE_ENV_KEYS = [
  'SESSION_SECRET',
  'PUBLIC_STORE_DOMAIN',
  'PUBLIC_STOREFRONT_API_TOKEN',
] as const;

const PLACEHOLDER_PATTERNS = [
  /^replace-with/i,
  /^your-/i,
  /^optional$/i,
  /^changeme$/i,
];

export class StoreEnvError extends Error {
  readonly missingKeys: string[];
  readonly invalidKeys: string[];

  constructor(missingKeys: string[], invalidKeys: string[] = []) {
    const parts: string[] = [];
    if (missingKeys.length) {
      parts.push(`missing: ${missingKeys.join(', ')}`);
    }
    if (invalidKeys.length) {
      parts.push(`invalid: ${invalidKeys.join(', ')}`);
    }

    super(
      `Live Shopify store configuration required (${parts.join('; ')}). ` +
        'Run: npm exec shopify -- auth login && npm run store:link && npm run store:env',
    );
    this.name = 'StoreEnvError';
    this.missingKeys = missingKeys;
    this.invalidKeys = invalidKeys;
  }
}

export function isPlaceholder(value: string) {
  const trimmed = value.trim();
  return !trimmed || PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function isMockDomain(value: string) {
  return value.trim().toLowerCase().includes('mock.shop');
}

/** Storefront API host must be the *.myshopify.com admin domain. */
export function isValidStoreDomain(value: string) {
  const domain = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain);
}

export function normalizeStoreDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

export type StoreEnvRecord = Record<string, string | undefined>;

export function validateStoreEnvRecord(env: StoreEnvRecord) {
  const missingKeys: string[] = [];
  const invalidKeys: string[] = [];

  for (const key of REQUIRED_STORE_ENV_KEYS) {
    const value = env[key];
    if (!value || isPlaceholder(value)) {
      missingKeys.push(key);
      continue;
    }

    if (key === 'PUBLIC_STORE_DOMAIN') {
      if (isMockDomain(value)) {
        invalidKeys.push(`${key} (mock.shop is disabled)`);
      } else if (!isValidStoreDomain(value)) {
        invalidKeys.push(`${key} (expected your-store.myshopify.com)`);
      }
    }

    if (key === 'PUBLIC_STOREFRONT_API_TOKEN' && value.length < 16) {
      invalidKeys.push(`${key} (token looks invalid)`);
    }
  }

  const checkoutDomain = env.PUBLIC_CHECKOUT_DOMAIN?.trim();
  if (checkoutDomain && isMockDomain(checkoutDomain)) {
    invalidKeys.push('PUBLIC_CHECKOUT_DOMAIN (mock.shop is disabled)');
  }

  if (missingKeys.length || invalidKeys.length) {
    return new StoreEnvError(missingKeys, invalidKeys);
  }

  return null;
}

export function parseEnvFile(content: string): StoreEnvRecord {
  const env: StoreEnvRecord = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) {
      env[trimmed] = '';
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}
