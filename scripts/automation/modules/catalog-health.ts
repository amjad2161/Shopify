import {buildCatalogPlan} from '../../catalog/sync.ts';
import {readCatalogEnv} from '../../catalog/lib/parse-env.ts';
import type {AutomationModule, ModuleResult} from '../types.ts';

export const catalogHealthModule: AutomationModule = {
  id: 'catalog-health',
  name: 'Catalog health',
  tier: 1,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];
    const env = readCatalogEnv(ctx.cwd);
    const plan = buildCatalogPlan(env);

    if (plan.configuredSuppliers.length === 0) {
      signals.push({
        module: 'catalog-health',
        key: 'empty-pipeline',
        severity: 'warn',
        message:
          'Catalog import pipeline has no active supplier — add CSV feed or API credentials',
      });
    }

    if (plan.syncEnabled && !plan.adminReady) {
      signals.push({
        module: 'catalog-health',
        key: 'sync-blocked',
        severity: ctx.mode === 'ci' ? 'warn' : 'error',
        message: 'Catalog sync enabled but Admin API credentials missing',
      });
    }

    if (plan.ageRestrictedHandles.length > 0) {
      signals.push({
        module: 'catalog-health',
        key: 'compliance',
        severity: 'warn',
        message: `Review Shopify AUP + age gates for: ${plan.ageRestrictedHandles.join(', ')}`,
      });
    }

    signals.push({
      module: 'catalog-health',
      key: 'plan',
      severity: 'info',
      message: `${plan.verticalCount} verticals · ${plan.configuredSuppliers.length} active suppliers`,
      data: plan,
    });

    for (const signal of signals) bus.publish(signal);

    const hasError = signals.some((s) => s.severity === 'error');
    const hasWarn = signals.some((s) => s.severity === 'warn');

    return {
      id: 'catalog-health',
      name: 'Catalog health',
      status: hasError ? 'fail' : hasWarn ? 'warn' : 'pass',
      durationMs: Date.now() - started,
      signals,
      artifacts: plan,
    };
  },
};
