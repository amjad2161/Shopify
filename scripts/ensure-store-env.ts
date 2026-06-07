import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {parseEnvFile, validateStoreEnvRecord} from '../app/lib/store-env';

const envPath = resolve(process.cwd(), '.env');

if (!existsSync(envPath)) {
  console.error(`
Live Shopify store required — no .env file found.

  cp .env.example .env
  npm exec shopify -- auth login
  npm run store:link
  npm run store:env
`);
  process.exit(1);
}

const env = parseEnvFile(readFileSync(envPath, 'utf8'));
const error = validateStoreEnvRecord(env);

if (error) {
  const problems = [
    ...error.missingKeys.map((key) => `${key} is missing or still a placeholder`),
    ...error.invalidKeys,
  ];

  console.error(`
Live Shopify store required — fix .env before starting:

${problems.map((problem) => `  • ${problem}`).join('\n')}

Connect your store:

  npm exec shopify -- auth login
  npm run store:link
  npm run store:env
  npm run dev
`);
  process.exit(1);
}
