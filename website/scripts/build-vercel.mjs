import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = path.join(root, 'public');
const selectorDir = path.join(root, 'selector');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const defaultSiteUrl = 'https://gcse-dashboard-server.vercel.app';

function canonicalSiteUrl() {
  const configured = String(process.env.APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  if (!configured) return defaultSiteUrl;

  try {
    const url = new URL(/^https?:\/\//i.test(configured) ? configured : `https://${configured}`);
    if (!['http:', 'https:'].includes(url.protocol) || ['localhost', '127.0.0.1', '::1'].includes(url.hostname)) return defaultSiteUrl;
    return url.origin;
  } catch {
    return defaultSiteUrl;
  }
}

function replaceSiteUrl(directory, siteUrl) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      replaceSiteUrl(file, siteUrl);
      continue;
    }
    if (!/\.(?:html|xml|txt|json|webmanifest|js)$/.test(entry.name)) continue;

    const source = readFileSync(file, 'utf8');
    if (source.includes(defaultSiteUrl)) writeFileSync(file, source.replaceAll(defaultSiteUrl, siteUrl));
  }
}

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

const siteUrl = canonicalSiteUrl();
replaceSiteUrl(publicDir, siteUrl);

console.log(`[vercel] static output assembled in ${publicDir} with canonical URL ${siteUrl}`);
