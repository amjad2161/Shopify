import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import type {AutomationReport, ModuleResult} from './types.ts';

export function summarizeModules(modules: ModuleResult[]) {
  return modules.reduce(
    (acc, module) => {
      acc[module.status] += 1;
      return acc;
    },
    {pass: 0, warn: 0, fail: 0, skip: 0},
  );
}

export function writeReport(cwd: string, report: AutomationReport) {
  const dir = join(cwd, '.automation', 'reports');
  mkdirSync(dir, {recursive: true});

  const stamp = report.generatedAt.replace(/[:.]/g, '-');
  const paths = {
    latest: join(dir, 'latest.json'),
    stamped: join(dir, `${stamp}.json`),
  };

  const payload = JSON.stringify(report, null, 2);
  writeFileSync(paths.latest, payload);
  writeFileSync(paths.stamped, payload);

  return paths;
}

export function formatConsoleReport(report: AutomationReport) {
  const lines: string[] = [
    '',
    '═'.repeat(60),
    `  Lumen Atelier automation — mode: ${report.mode}`,
    '═'.repeat(60),
    '',
  ];

  for (const module of report.modules) {
    const icon =
      module.status === 'pass'
        ? '✓'
        : module.status === 'warn'
          ? '⚠'
          : module.status === 'skip'
            ? '○'
            : '✗';
    lines.push(
      `  ${icon} ${module.name} (${module.durationMs}ms) — ${module.status}`,
    );
    for (const signal of module.signals) {
      if (signal.severity === 'info') continue;
      lines.push(`      [${signal.severity}] ${signal.message}`);
    }
  }

  lines.push('', '  Decisions', '  ─────────');

  for (const decision of report.decisions) {
    lines.push(
      `  • [${decision.action}] ${decision.id}: ${decision.reason}`,
    );
  }

  lines.push(
    '',
    `  Summary: ${report.summary.pass} pass, ${report.summary.warn} warn, ${report.summary.fail} fail, ${report.summary.skip} skip`,
    `  Deploy ready: ${report.summary.deployReady ? 'yes' : 'no'}`,
    `  Blocked: ${report.summary.blocked ? 'yes' : 'no'}`,
    `  Report: .automation/reports/latest.json`,
    '',
  );

  return lines.join('\n');
}
