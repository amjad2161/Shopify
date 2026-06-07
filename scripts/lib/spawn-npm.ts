import {spawnSync} from 'node:child_process';

const isWindows = process.platform === 'win32';

/** Resolve npm executable for cross-platform spawn (Windows needs npm.cmd). */
export function npmCommand(): string {
  return isWindows ? 'npm.cmd' : 'npm';
}

export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  inherit = false,
) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: isWindows,
    stdio: inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  });
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
}

export function runNpm(
  script: string,
  cwd: string,
  extraArgs: string[] = [],
  inherit = false,
) {
  return runCommand(npmCommand(), ['run', script, ...extraArgs], cwd, inherit);
}
