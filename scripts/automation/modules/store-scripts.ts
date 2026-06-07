import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import type {AutomationModule, ModuleResult} from '../types.ts';

export const storeScriptsModule: AutomationModule = {
  id: 'store-scripts',
  name: 'Store tooling',
  tier: 0,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];

    const pkg = JSON.parse(
      readFileSync(join(ctx.cwd, 'package.json'), 'utf8'),
    ) as {scripts?: Record<string, string>};

    const setup = pkg.scripts?.['store:setup'] ?? '';
    if (setup.startsWith('shopify ') && !setup.includes('npm exec shopify')) {
      signals.push({
        module: 'store-scripts',
        key: 'store-setup-bare-cli',
        severity: 'warn',
        message:
          'store:setup uses bare shopify CLI — prefer npm exec shopify -- for Windows compatibility',
      });
    } else {
      signals.push({
        module: 'store-scripts',
        key: 'store-setup-ok',
        severity: 'info',
        message: 'store:setup uses npm exec shopify pattern',
      });
    }

    const predev = pkg.scripts?.predev ?? '';
    if (predev.includes('ensure-store-env')) {
      signals.push({
        module: 'store-scripts',
        key: 'predev-gate',
        severity: 'info',
        message: 'predev/prebuild env gate is wired',
      });
    }

    for (const signal of signals) bus.publish(signal);

    const hasWarn = signals.some((s) => s.severity === 'warn');
    return {
      id: 'store-scripts',
      name: 'Store tooling',
      status: hasWarn ? 'warn' : 'pass',
      durationMs: Date.now() - started,
      signals,
    };
  },
};
