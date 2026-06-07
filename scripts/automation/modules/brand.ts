import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {isPlaceholder, parseEnvFile} from '../../../app/lib/store-env.ts';
import type {AutomationModule, ModuleResult} from '../types.ts';

export const brandModule: AutomationModule = {
  id: 'brand',
  name: 'Brand & SEO',
  tier: 0,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];
    const envPath = join(ctx.cwd, '.env');

    if (!existsSync(envPath)) {
      signals.push({
        module: 'brand',
        key: 'no-env',
        severity: 'info',
        message: 'Brand checks skipped — no .env',
      });
      for (const signal of signals) bus.publish(signal);
      return {
        id: 'brand',
        name: 'Brand & SEO',
        status: 'skip',
        durationMs: Date.now() - started,
        signals,
      };
    }

    const env = parseEnvFile(readFileSync(envPath, 'utf8'));
    const brandUrl = env.PUBLIC_BRAND_URL?.trim();

    if (!brandUrl || isPlaceholder(brandUrl)) {
      signals.push({
        module: 'brand',
        key: 'missing-brand-url',
        severity: ctx.isProductionGate ? 'warn' : 'info',
        message:
          'PUBLIC_BRAND_URL not set — canonical/og URLs will use *.myshopify.com',
      });
    } else if (!/^https:\/\//i.test(brandUrl)) {
      signals.push({
        module: 'brand',
        key: 'brand-url-http',
        severity: 'warn',
        message: 'PUBLIC_BRAND_URL should use https:// for production SEO',
      });
    } else {
      signals.push({
        module: 'brand',
        key: 'brand-url-ok',
        severity: 'info',
        message: `PUBLIC_BRAND_URL configured: ${brandUrl}`,
      });
    }

    const featured = env.FEATURED_COLLECTION_HANDLE?.trim() || 'frontpage';
    signals.push({
      module: 'brand',
      key: 'featured-collection',
      severity: 'info',
      message: `Featured collection handle: ${featured}`,
      data: {handle: featured},
    });

    for (const signal of signals) bus.publish(signal);

    const hasWarn = signals.some((s) => s.severity === 'warn');
    return {
      id: 'brand',
      name: 'Brand & SEO',
      status: hasWarn ? 'warn' : 'pass',
      durationMs: Date.now() - started,
      signals,
    };
  },
};
