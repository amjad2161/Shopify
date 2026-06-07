import {spawnSync} from 'node:child_process';
import type {AutomationModule, ModuleResult} from '../types.ts';

function runNpmScript(script: string, cwd: string) {
  return spawnSync('npm', ['run', script], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export const qualityModule: AutomationModule = {
  id: 'quality',
  name: 'Code quality',
  tier: 1,
  async run(ctx, bus) {
    const started = Date.now();
    const signals: ModuleResult['signals'] = [];
    const steps = [
      {id: 'lint', script: 'lint'},
      {id: 'test', script: 'test'},
      {id: 'typecheck', script: 'typecheck'},
    ] as const;

    let failed = false;

    for (const step of steps) {
      const result = runNpmScript(step.script, ctx.cwd);
      if (result.status === 0) {
        signals.push({
          module: 'quality',
          key: `${step.id}-pass`,
          severity: 'info',
          message: `${step.script} passed`,
        });
      } else {
        failed = true;
        const tail = (result.stderr || result.stdout || '').trim().split('\n').slice(-8).join('\n');
        signals.push({
          module: 'quality',
          key: `${step.id}-fail`,
          severity: 'error',
          message: `npm run ${step.script} failed`,
          data: {exitCode: result.status, tail},
        });
      }
      bus.publish(signals[signals.length - 1]!);
    }

    return {
      id: 'quality',
      name: 'Code quality',
      status: failed ? 'fail' : 'pass',
      durationMs: Date.now() - started,
      signals,
    };
  },
};
