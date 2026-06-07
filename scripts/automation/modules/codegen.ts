import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import type {AutomationModule, ModuleResult} from '../types.ts';

const TRACKED_OPERATIONS = [
  'NewsletterCustomerCreate',
  'FeaturedCollectionByHandle',
] as const;

export const codegenModule: AutomationModule = {
  id: 'codegen',
  name: 'GraphQL codegen',
  tier: 0,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];

    const generatedPath = join(
      ctx.cwd,
      'storefrontapi.generated.d.ts',
    );

    if (!existsSync(generatedPath)) {
      signals.push({
        module: 'codegen',
        key: 'missing-generated',
        severity: 'warn',
        message: 'storefrontapi.generated.d.ts not found — run npm run codegen after store link',
      });
      for (const signal of signals) bus.publish(signal);
      return {
        id: 'codegen',
        name: 'GraphQL codegen',
        status: 'warn',
        durationMs: Date.now() - started,
        signals,
      };
    }

    const generated = readFileSync(generatedPath, 'utf8');
    const missingOps: string[] = [];

    for (const op of TRACKED_OPERATIONS) {
      if (!generated.includes(op)) {
        missingOps.push(op);
      }
    }

    if (missingOps.length > 0) {
      signals.push({
        module: 'codegen',
        key: 'stale-codegen',
        severity: 'warn',
        message: `Generated types missing operations: ${missingOps.join(', ')}`,
        data: {missingOps},
      });
    } else {
      signals.push({
        module: 'codegen',
        key: 'codegen-synced',
        severity: 'info',
        message: 'Tracked GraphQL operations present in generated types',
      });
    }

    for (const signal of signals) bus.publish(signal);

    return {
      id: 'codegen',
      name: 'GraphQL codegen',
      status: missingOps.length > 0 ? 'warn' : 'pass',
      durationMs: Date.now() - started,
      signals,
    };
  },
};
