export {
  StoreEnvError,
  isPlaceholder,
  isMockDomain,
  isValidStoreDomain,
  normalizeStoreDomain,
  validateStoreEnvRecord,
  parseEnvFile,
  type StoreEnvRecord,
} from '../../shared/store-env-core.ts';

import {
  isMockDomain,
  isPlaceholder,
  normalizeStoreDomain,
  StoreEnvError,
  validateStoreEnvRecord,
  type StoreEnvRecord,
} from '../../shared/store-env-core.ts';

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
    <title>Connect your Shopify store — OneClick Hub</title>
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
