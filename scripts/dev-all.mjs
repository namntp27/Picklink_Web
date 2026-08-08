import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viteBin = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const reset = '[0m';
const targets = [
  { name: 'player', port: 3000, color: '[36m' },
  { name: 'owner', port: 3001, color: '[35m' },
  { name: 'admin', port: 3002, color: '[33m' },
];

let stopping = false;
const stopAll = () => {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
};

const children = targets.map(({ name, color }) => {
  const child = spawn(
    process.execPath,
    [viteBin, '--host=0.0.0.0', `--config=vite.${name}.config.ts`, '--configLoader', 'runner'],
    { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const prefix = `${color}[${name}]${reset} `;
  const forward = (stream, output) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      for (const line of chunk.replace(/\s+$/, '').split('\n')) output.write(`${prefix}${line}\n`);
    });
  };
  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);

  child.on('exit', (code) => {
    process.stdout.write(`${prefix}dev server stopped (exit code ${code ?? 0})\n`);
    process.exitCode = code ?? 0;
    stopAll();
  });

  return child;
});

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    process.exitCode = 0;
    stopAll();
  });
}

for (const { name, port, color } of targets) {
  process.stdout.write(`${color}[${name}]${reset} http://localhost:${port}\n`);
}
