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
  const domain = value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain);
}

export function normalizeStoreDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
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

/**
 * Fills checkout-related env from the live store domain so Hydrogen never
 * defaults analytics/CSP checkout hosts to mock.shop.
 */
export function normalizeStoreEnv(env: Env): Env {
  const storeDomain = env.PUBLIC_STORE_DOMAIN?.trim();
  const checkoutDomain = env.PUBLIC_CHECKOUT_DOMAIN?.trim();

  if (!storeDomain) {
    return env;
  }

  if (checkoutDomain && !isMockDomain(checkoutDomain)) {
    return {
      ...env,
      PUBLIC_STORE_DOMAIN: normalizeStoreDomain(storeDomain),
    };
  }

  return {
    ...env,
    PUBLIC_STORE_DOMAIN: normalizeStoreDomain(storeDomain),
    PUBLIC_CHECKOUT_DOMAIN: normalizeStoreDomain(storeDomain),
  };
}

/**
 * Ensures the app never runs against mock.shop or without a linked live store.
 */
export function validateStoreEnv(env: Env) {
  const error = validateStoreEnvRecord(env as unknown as StoreEnvRecord);
  if (error) {
    throw error;
  }
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

export function storeEnvSetupHtml(error: StoreEnvError) {
  const missing = error.missingKeys.length
    ? `<li>Set in <code>.env</code>: ${error.missingKeys.map((k) => `<code>${k}</code>`).join(', ')}</li>`
    : '';
  const invalid = error.invalidKeys.length
    ? `<li>Fix invalid values: ${error.invalidKeys.map((k) => `<code>${k}</code>`).join(', ')}</li>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Connect your Shopify store — Lumen Atelier</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #faf8f5; color: #0c0a09; margin: 0; padding: 2rem; }
      main { max-width: 42rem; margin: 0 auto; background: #fff; border: 1px solid #e7e5e4; border-radius: 1rem; padding: 2rem; }
      h1 { font-size: 1.75rem; margin: 0 0 0.75rem; }
      p, li { line-height: 1.6; }
      code, pre { background: #f5f5f4; border-radius: 0.375rem; }
      code { padding: 0.1rem 0.35rem; }
      pre { padding: 1rem; overflow-x: auto; }
      ol { padding-left: 1.25rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>Live Shopify store required</h1>
      <p>This storefront does not use mock.shop. Link your production or development store before running the app.</p>
      <ol>
        ${missing}
        ${invalid}
        <li>Authenticate: <code>npm exec shopify -- auth login</code></li>
        <li>Link Hydrogen: <code>npm run store:link</code></li>
        <li>Pull env vars: <code>npm run store:env</code></li>
        <li>Restart: <code>npm run dev</code></li>
      </ol>
      <pre>npm exec shopify -- auth login
npm run store:link
npm run store:env
npm run dev</pre>
    </main>
  </body>
</html>`;
}
