import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {parseEnvFile, validateStoreEnvRecord} from '../../../app/lib/store-env.ts';
import type {AutomationContext, AutomationModule, ModuleResult} from '../types.ts';

export const envModule: AutomationModule = {
  id: 'env',
  name: 'Store environment',
  tier: 0,
  async run(ctx, bus) {
    const started = Date.now();
    const envPath = join(ctx.cwd, '.env');
    const signals: ModuleResult['signals'] = [];

    if (!existsSync(envPath)) {
      signals.push({
        module: 'env',
        key: 'missing-env-file',
        severity: ctx.mode === 'ci' ? 'warn' : 'error',
        message: 'No .env file — run npm run store:env after linking',
      });

      for (const signal of signals) bus.publish(signal);

      return {
        id: 'env',
        name: 'Store environment',
        status: ctx.mode === 'ci' ? 'skip' : 'fail',
        durationMs: Date.now() - started,
        signals,
        artifacts: {hasEnvFile: false, envValid: false},
      };
    }

    const env = parseEnvFile(readFileSync(envPath, 'utf8'));
    const error = validateStoreEnvRecord(env);

    if (error) {
      for (const key of error.missingKeys) {
        signals.push({
          module: 'env',
          key: `missing-${key}`,
          severity: 'error',
          message: `${key} is missing or placeholder`,
        });
      }
      for (const invalid of error.invalidKeys) {
        signals.push({
          module: 'env',
          key: 'invalid-env',
          severity: 'error',
          message: invalid,
        });
      }
    } else {
      signals.push({
        module: 'env',
        key: 'env-valid',
        severity: 'info',
        message: `Store domain: ${env.PUBLIC_STORE_DOMAIN}`,
      });
    }

    for (const signal of signals) bus.publish(signal);

    const envValid = !error;
    return {
      id: 'env',
      name: 'Store environment',
      status: error ? (ctx.mode === 'ci' ? 'warn' : 'fail') : 'pass',
      durationMs: Date.now() - started,
      signals,
      artifacts: {hasEnvFile: true, envValid},
    };
  },
};

export function readEnvContext(ctx: AutomationContext): {
  hasEnvFile: boolean;
  envValid: boolean;
} {
  const envPath = join(ctx.cwd, '.env');
  if (!existsSync(envPath)) {
    return {hasEnvFile: false, envValid: false};
  }
  const env = parseEnvFile(readFileSync(envPath, 'utf8'));
  return {
    hasEnvFile: true,
    envValid: validateStoreEnvRecord(env) === null,
  };
}
