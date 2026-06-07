import type {AutomationBus, AutomationContext, AutomationDecision} from './types.ts';
import {worstSeverity} from './bus.ts';

/**
 * Cross-module decision layer: reads signals from every automation module
 * and synthesizes deploy / build gates.
 */
export function synthesizeDecisions(
  ctx: AutomationContext,
  bus: AutomationBus,
): AutomationDecision[] {
  const decisions: AutomationDecision[] = [];
  const errors = bus.getSignals({severity: 'error'});
  const warns = bus.getSignals({severity: 'warn'});

  const moduleFails = bus
    .getModuleResults()
    .filter((module) => module.status === 'fail');

  if (moduleFails.length > 0) {
    decisions.push({
      id: 'quality-gate',
      severity: 'error',
      action: 'block',
      reason: `Failed modules: ${moduleFails.map((m) => m.id).join(', ')}`,
      sources: moduleFails.map((m) => m.id),
    });
  }

  const envErrors = errors.filter((s) => s.module === 'env');
  if (envErrors.length > 0) {
    const action = ctx.mode === 'ci' ? 'warn' : 'block';
    decisions.push({
      id: 'store-env',
      severity: action === 'block' ? 'error' : 'warn',
      action,
      reason:
        action === 'warn'
          ? 'CI run without valid linked store — env checks deferred to local/full pipeline'
          : 'Live Shopify store env is invalid or missing',
      sources: ['env'],
    });
  }

  const brandWarns = warns.filter((s) => s.module === 'brand');
  if (brandWarns.length > 0 && ctx.isProductionGate) {
    decisions.push({
      id: 'brand-seo',
      severity: 'warn',
      action: 'warn',
      reason: 'Production SEO / brand URL recommendations not satisfied',
      sources: ['brand'],
    });
  }

  const securityWarns = warns.filter((s) => s.module === 'security');
  if (securityWarns.length > 0) {
    decisions.push({
      id: 'security-hardening',
      severity: 'warn',
      action: 'warn',
      reason: 'Security hardening gaps detected — review before high-traffic launch',
      sources: ['security'],
    });
  }

  const codegenErrors = errors.filter((s) => s.module === 'codegen');
  if (codegenErrors.length > 0) {
    decisions.push({
      id: 'codegen-sync',
      severity: 'warn',
      action: 'warn',
      reason: 'GraphQL types may be out of sync — run npm run codegen after store link',
      sources: ['codegen'],
    });
  }

  const catalogErrors = errors.filter((s) =>
    ['supplier-env', 'catalog-health'].includes(s.module),
  );
  if (catalogErrors.length > 0 && ctx.mode !== 'ci') {
    decisions.push({
      id: 'catalog-pipeline',
      severity: 'error',
      action: 'block',
      reason: 'Catalog sync is misconfigured — fix Admin API token or supplier credentials',
      sources: ['supplier-env', 'catalog-health'],
    });
  }

  const catalogWarns = warns.filter((s) =>
    ['catalog-config', 'catalog-health', 'supplier-env'].includes(s.module),
  );
  if (catalogWarns.length > 0) {
    decisions.push({
      id: 'catalog-compliance',
      severity: 'warn',
      action: 'warn',
      reason:
        'Catalog automation warnings — review age-restricted verticals and supplier setup before live import',
      sources: [...new Set(catalogWarns.map((s) => s.module))],
    });
  }

  const canBuild =
    ctx.envValid &&
    moduleFails.length === 0 &&
    !envErrors.some(() => ctx.mode !== 'ci' || ctx.hasEnvFile);

  if (ctx.mode === 'full' && !canBuild) {
    decisions.push({
      id: 'build-gate',
      severity: 'error',
      action: 'block',
      reason: 'Full pipeline cannot run production build until env and quality gates pass',
      sources: ['env', 'quality', 'deploy'],
    });
  }

  if (decisions.length === 0) {
    const overall = worstSeverity([...errors, ...warns]);
    decisions.push({
      id: 'all-clear',
      severity: overall ?? 'info',
      action: 'allow',
      reason: 'All automation layers passed or only informational signals remain',
      sources: bus.getModuleResults().map((m) => m.id),
    });
  }

  return decisions;
}

export function isBlocked(decisions: AutomationDecision[]) {
  return decisions.some((d) => d.action === 'block');
}

export function isDeployReady(
  ctx: AutomationContext,
  decisions: AutomationDecision[],
) {
  if (isBlocked(decisions)) return false;
  if (!ctx.envValid && ctx.mode !== 'ci') return false;
  return !decisions.some((d) => d.id === 'quality-gate');
}
