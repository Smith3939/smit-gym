/**
 * Writes dist/version.json after every web build.
 * Runs as part of `npm run build`, so every Vercel deployment gets a fresh
 * build id. The app polls this file to detect new deployments and prompt
 * already-open clients to refresh.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = join(root, 'dist');

if (!existsSync(distDir)) {
  console.error('write-version: dist/ not found - run expo export first');
  process.exit(1);
}

let commit = process.env.VERCEL_GIT_COMMIT_SHA || '';
if (!commit) {
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
  } catch {
    commit = 'unknown';
  }
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const version = {
  version: pkg.version || '1.0.0',
  commit,
  builtAt: Date.now(),
};

writeFileSync(join(distDir, 'version.json'), JSON.stringify(version));
console.log('write-version: dist/version.json =', JSON.stringify(version));
