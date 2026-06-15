import {runAutomation} from './orchestrator.ts';
import type {AutomationMode} from './types.ts';

function parseMode(argv: string[]): AutomationMode {
  const flag = argv.find((arg) => arg.startsWith('--mode='))?.split('=')[1];
  if (flag === 'ci' || flag === 'full' || flag === 'local') return flag;
  if (argv.includes('--ci')) return 'ci';
  if (argv.includes('--full')) return 'full';
  return 'local';
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const productionGate =
    process.argv.includes('--production') || mode === 'full';

  const report = await runAutomation({mode, productionGate});

  if (report.summary.blocked) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
