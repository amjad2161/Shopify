import {createAutomationBus} from './bus.ts';
import {isBlocked, isDeployReady, synthesizeDecisions} from './decision-engine.ts';
import {brandModule} from './modules/brand.ts';
import {codegenModule} from './modules/codegen.ts';
import {deployModule} from './modules/deploy.ts';
import {envModule, readEnvContext} from './modules/env.ts';
import {qualityModule} from './modules/quality.ts';
import {securityModule} from './modules/security.ts';
import {storeScriptsModule} from './modules/store-scripts.ts';
import {formatConsoleReport, summarizeModules, writeReport} from './report.ts';
import type {
  AutomationContext,
  AutomationMode,
  AutomationModule,
  AutomationReport,
} from './types.ts';

const ALL_MODULES: AutomationModule[] = [
  envModule,
  brandModule,
  securityModule,
  codegenModule,
  storeScriptsModule,
  qualityModule,
  deployModule,
];

async function runTier(
  modules: AutomationModule[],
  tier: number,
  ctx: AutomationContext,
  bus: ReturnType<typeof createAutomationBus>,
) {
  const batch = modules.filter((m) => m.tier === tier);
  const results = await Promise.all(batch.map((module) => module.run(ctx, bus)));
  for (const result of results) {
    bus.setModuleResult(result);
  }
  return results;
}

export async function runAutomation(options: {
  cwd?: string;
  mode?: AutomationMode;
  productionGate?: boolean;
}) {
  const cwd = options.cwd ?? process.cwd();
  const mode = options.mode ?? 'local';
  const envCtx = readEnvContext({cwd, mode, hasEnvFile: false, envValid: false, isProductionGate: false});

  const ctx: AutomationContext = {
    mode,
    cwd,
    hasEnvFile: envCtx.hasEnvFile,
    envValid: envCtx.envValid,
    isProductionGate: options.productionGate ?? mode === 'full',
  };

  const bus = createAutomationBus();
  const tiers = [...new Set(ALL_MODULES.map((m) => m.tier))].sort((a, b) => a - b);

  const moduleResults = [];
  for (const tier of tiers) {
    const results = await runTier(ALL_MODULES, tier, ctx, bus);
    moduleResults.push(...results);

    // Refresh env context after tier 0 (env module may have run)
    if (tier === 0) {
      const refreshed = readEnvContext(ctx);
      ctx.hasEnvFile = refreshed.hasEnvFile;
      ctx.envValid = refreshed.envValid;
    }

    // Stop before deploy/build if quality already failed
    if (tier === 1) {
      const qualityFailed = bus
        .getModuleResults()
        .some((m) => m.id === 'quality' && m.status === 'fail');
      if (qualityFailed && mode === 'full') {
        const deploy = await deployModule.run(
          {...ctx, envValid: false},
          bus,
        );
        deploy.status = 'skip';
        deploy.signals = [
          {
            module: 'deploy',
            key: 'skipped-quality',
            severity: 'warn',
            message: 'Build skipped because quality gate failed',
          },
        ];
        bus.setModuleResult(deploy);
        moduleResults.push(deploy);
        break;
      }
    }
  }

  const decisions = synthesizeDecisions(ctx, bus);
  const counts = summarizeModules(moduleResults);

  const report: AutomationReport = {
    version: 1,
    generatedAt: new Date().toISOString(),
    mode,
    context: {
      hasEnvFile: ctx.hasEnvFile,
      envValid: ctx.envValid,
      isProductionGate: ctx.isProductionGate,
    },
    modules: moduleResults,
    decisions,
    summary: {
      ...counts,
      blocked: isBlocked(decisions),
      deployReady: isDeployReady(ctx, decisions),
    },
  };

  writeReport(cwd, report);
  console.log(formatConsoleReport(report));

  return report;
}
