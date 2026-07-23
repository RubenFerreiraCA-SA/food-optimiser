import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const reportPath = resolve('coverage/meal-optimiser/index.html');

if (!existsSync(reportPath)) {
  console.error(`Coverage report not found: ${reportPath}`);
  process.exit(1);
}

const platform = process.platform;
const opener =
  platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
const args =
  platform === 'win32' ? ['/c', 'start', '', reportPath] : [reportPath];

const child = spawn(opener, args, {
  detached: true,
  stdio: 'ignore',
});

child.unref();
