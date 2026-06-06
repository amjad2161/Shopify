import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const envPath = resolve(process.cwd(), '.env');

if (!existsSync(envPath)) {
  console.error(`
Live Shopify store required — no .env file found.

  cp .env.example .env
  shopify auth login
  npx shopify hydrogen link
  npx shopify hydrogen env pull --force
`);
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      if (index === -1) return [line, ''];
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const required = [
  'SESSION_SECRET',
  'PUBLIC_STORE_DOMAIN',
  'PUBLIC_STOREFRONT_API_TOKEN',
];

const placeholder = /^(replace-with|your-|changeme|optional)/i;
const problems = [];

for (const key of required) {
  const value = env[key]?.trim();
  if (!value || placeholder.test(value)) {
    problems.push(`${key} is missing or still a placeholder`);
  }
}

if (env.PUBLIC_STORE_DOMAIN?.toLowerCase().includes('mock.shop')) {
  problems.push('PUBLIC_STORE_DOMAIN must be your live *.myshopify.com store (mock.shop is disabled)');
}

if (env.PUBLIC_CHECKOUT_DOMAIN?.toLowerCase().includes('mock.shop')) {
  problems.push('PUBLIC_CHECKOUT_DOMAIN must not be mock.shop');
}

if (problems.length) {
  console.error(`
Live Shopify store required — fix .env before starting:

${problems.map((problem) => `  • ${problem}`).join('\n')}

Connect your store:

  shopify auth login
  npx shopify hydrogen link
  npx shopify hydrogen env pull --force
  npm run dev
`);
  process.exit(1);
}
