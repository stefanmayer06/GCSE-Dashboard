import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = path.join(root, 'public');
const selectorDir = path.join(root, 'selector');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function runClientBuild(workspace, base, outputDir) {
  const result = spawnSync(
    npm,
    [
      'run',
      'build',
      '--workspace',
      workspace,
      '--',
      '--base',
      base,
      '--outDir',
      outputDir,
      '--emptyOutDir',
    ],
    { cwd: root, stdio: 'inherit' },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${workspace} build failed with exit code ${result.status ?? 'unknown'}`);
  }
}

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });

for (const entry of readdirSync(selectorDir, { withFileTypes: true })) {
  cpSync(
    path.join(selectorDir, entry.name),
    path.join(publicDir, entry.name),
    { recursive: entry.isDirectory() },
  );
}

runClientBuild('clients/maths', '/maths/', path.join(publicDir, 'maths'));
runClientBuild('clients/maths', '/maths-higher/', path.join(publicDir, 'maths-higher'));
runClientBuild('clients/english', '/english/', path.join(publicDir, 'english'));

console.log(`[vercel] static output assembled in ${publicDir}`);
