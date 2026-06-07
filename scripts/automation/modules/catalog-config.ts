import {CATALOG_VERTICALS, getAgeRestrictedVerticals} from '../../catalog/config/categories.ts';
import type {AutomationModule, ModuleResult} from '../types.ts';

export const catalogConfigModule: AutomationModule = {
  id: 'catalog-config',
  name: 'Catalog taxonomy',
  tier: 0,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];
    const ageRestricted = getAgeRestrictedVerticals();

    signals.push({
      module: 'catalog-config',
      key: 'vertical-count',
      severity: 'info',
      message: `${CATALOG_VERTICALS.length} commerce verticals defined`,
      data: {handles: CATALOG_VERTICALS.map((v) => v.handle)},
    });

    if (ageRestricted.length > 0) {
      signals.push({
        module: 'catalog-config',
        key: 'age-restricted',
        severity: 'warn',
        message: `Age-restricted verticals require compliance before publish: ${ageRestricted.map((v) => v.handle).join(', ')}`,
      });
    }

    for (const signal of signals) bus.publish(signal);

    const hasWarn = signals.some((s) => s.severity === 'warn');
    return {
      id: 'catalog-config',
      name: 'Catalog taxonomy',
      status: hasWarn ? 'warn' : 'pass',
      durationMs: Date.now() - started,
      signals,
      artifacts: {verticalCount: CATALOG_VERTICALS.length},
    };
  },
};
