import {spawnSync} from 'node:child_process';
import type {AutomationContext, AutomationModule, ModuleResult} from '../types.ts';

export const deployModule: AutomationModule = {
  id: 'deploy',
  name: 'Deploy readiness',
  tier: 2,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];

    if (ctx.mode !== 'full') {
      signals.push({
        module: 'deploy',
        key: 'build-skipped',
        severity: 'info',
        message: `Production build skipped in ${ctx.mode} mode`,
      });
      for (const signal of signals) bus.publish(signal);
      return {
        id: 'deploy',
        name: 'Deploy readiness',
        status: 'skip',
        durationMs: Date.now() - started,
        signals,
      };
    }

    if (!ctx.envValid) {
      signals.push({
        module: 'deploy',
        key: 'no-env-build',
        severity: 'error',
        message: 'Cannot run production build without valid store env',
      });
      for (const signal of signals) bus.publish(signal);
      return {
        id: 'deploy',
        name: 'Deploy readiness',
        status: 'fail',
        durationMs: Date.now() - started,
        signals,
      };
    }

    const result = spawnSync('npm', ['run', 'build'], {
      cwd: ctx.cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status === 0) {
      signals.push({
        module: 'deploy',
        key: 'build-pass',
        severity: 'info',
        message: 'Production build succeeded',
      });
    } else {
      const tail = (result.stderr || result.stdout || '').trim().split('\n').slice(-12).join('\n');
      signals.push({
        module: 'deploy',
        key: 'build-fail',
        severity: 'error',
        message: 'Production build failed',
        data: {exitCode: result.status, tail},
      });
    }

    for (const signal of signals) bus.publish(signal);

    return {
      id: 'deploy',
      name: 'Deploy readiness',
      status: result.status === 0 ? 'pass' : 'fail',
      durationMs: Date.now() - started,
      signals,
    };
  },
};
