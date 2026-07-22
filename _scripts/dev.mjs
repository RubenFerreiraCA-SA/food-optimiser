import { spawn } from 'node:child_process';

const mode = process.argv[2] ?? 'full';

const taskSets = {
  fe: [
    {
      name: 'emulators',
      command: 'firebase',
      args: ['emulators:start', '--only', 'firestore,ui'],
    },
    {
      name: 'fe',
      command: 'ng',
      args: ['serve', '--configuration', 'development'],
    },
  ],
  full: [
    {
      name: 'emulators',
      command: 'firebase',
      args: ['emulators:start', '--only', 'firestore,ui'],
    },
    {
      name: 'fe',
      command: 'ng',
      args: ['serve', '--configuration', 'development'],
    },
    {
      name: 'be',
      command: 'dotnet',
      args: ['run', '--project', 'backend/MealOptimiser.Api'],
    },
  ],
};

const tasks = taskSets[mode];

if (!tasks) {
  console.error(`Unknown dev mode: ${mode}`);
  process.exit(1);
}

const children = new Map();
let shuttingDown = false;

function writePrefixed(name, chunk, write) {
  const lines = chunk
    .toString()
    .replace(/\r/g, '')
    .split('\n');

  for (const line of lines) {
    if (line.length === 0) continue;
    write(`[${name}] ${line}\n`);
  }
}

function terminate(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children.values()) {
    child.kill('SIGINT');
  }

  setTimeout(() => {
    for (const child of children.values()) {
      if (!child.killed) child.kill('SIGTERM');
    }
  }, 3000);

  setTimeout(() => process.exit(code), 5000);
}

for (const task of tasks) {
  const child = spawn(task.command, task.args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: process.env,
  });

  children.set(task.name, child);

  child.stdout.on('data', (chunk) =>
    writePrefixed(task.name, chunk, (line) => process.stdout.write(line)),
  );
  child.stderr.on('data', (chunk) =>
    writePrefixed(task.name, chunk, (line) => process.stderr.write(line)),
  );

  child.on('exit', (code, signal) => {
    children.delete(task.name);

    if (shuttingDown) return;

    const exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
    console.error(`[${task.name}] exited with ${signal ? `signal ${signal}` : `code ${code}`}`);
    terminate(exitCode);
  });
}

process.on('SIGINT', () => terminate(0));
process.on('SIGTERM', () => terminate(0));
