import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import type {AutomationModule, ModuleResult} from '../types.ts';

export const securityModule: AutomationModule = {
  id: 'security',
  name: 'Security posture',
  tier: 0,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];

    const newsletterPath = join(
      ctx.cwd,
      'app/routes/($locale).newsletter.tsx',
    );
    if (existsSync(newsletterPath)) {
      const newsletter = readFileSync(newsletterPath, 'utf8');

      const hasHoneypot =
        newsletter.includes('honeypot') || newsletter.includes('website');
      const hasRateLimit =
        newsletter.includes('rate') ||
        newsletter.includes('throttle') ||
        newsletter.includes('limit');

      if (!hasHoneypot) {
        signals.push({
          module: 'security',
          key: 'newsletter-no-honeypot',
          severity: 'warn',
          message:
            'Newsletter route has no honeypot field — consider bot protection',
        });
      }

      if (!hasRateLimit) {
        signals.push({
          module: 'security',
          key: 'newsletter-no-rate-limit',
          severity: 'warn',
          message:
            'Newsletter route has no rate limiting — add edge/worker throttle before launch',
        });
      }
    }

    const gitignorePath = join(ctx.cwd, '.gitignore');
    if (existsSync(gitignorePath)) {
      const gitignore = readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('.env')) {
        signals.push({
          module: 'security',
          key: 'env-not-gitignored',
          severity: 'error',
          message: '.env must be listed in .gitignore',
        });
      } else {
        signals.push({
          module: 'security',
          key: 'env-gitignored',
          severity: 'info',
          message: '.env is gitignored',
        });
      }
    }

    const rootPath = join(ctx.cwd, 'app/root.tsx');
    if (existsSync(rootPath)) {
      const root = readFileSync(rootPath, 'utf8');
      if (root.includes('import.meta.env.DEV')) {
        signals.push({
          module: 'security',
          key: 'dev-error-boundary',
          severity: 'info',
          message: 'ErrorBoundary gates raw errors behind DEV flag',
        });
      }
    }

    for (const signal of signals) bus.publish(signal);

    const hasError = signals.some((s) => s.severity === 'error');
    const hasWarn = signals.some((s) => s.severity === 'warn');

    return {
      id: 'security',
      name: 'Security posture',
      status: hasError ? 'fail' : hasWarn ? 'warn' : 'pass',
      durationMs: Date.now() - started,
      signals,
    };
  },
};
