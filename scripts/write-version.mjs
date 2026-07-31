/**
 * Post-build steps for the web export (runs after `expo export`):
 *  1. Writes dist/version.json so open clients can detect new deployments.
 *  2. Injects PWA head tags (manifest, apple-touch-icon, theme-color) into
 *     dist/index.html so "add to home screen" installs get the real Smit Gym
 *     icon and standalone behavior.
 */
import { writeFileSync, readFileSync, existsSync, copyFileSync } from 'node:fs';
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
const iconVersion = encodeURIComponent(commit || String(version.builtAt));

writeFileSync(join(distDir, 'version.json'), JSON.stringify(version));
console.log('write-version: dist/version.json =', JSON.stringify(version));

// ── Ensure PWA assets are present in dist (Expo copies public/, but copy
//    defensively in case that changes) ──────────────────────────────────────
const publicDir = join(root, 'public');
const manifestTemplatePath = join(publicDir, 'manifest.json');
if (existsSync(manifestTemplatePath)) {
  const manifest = readFileSync(manifestTemplatePath, 'utf8').replaceAll('__ICON_VERSION__', iconVersion);
  writeFileSync(join(distDir, 'manifest.json'), manifest);
  console.log(`write-version: versioned PWA icon URLs with ${iconVersion}`);
}

for (const f of ['manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'sw.js']) {
  const src = join(publicDir, f);
  const dest = join(distDir, f);
  if (existsSync(src) && !existsSync(dest)) {
    try { copyFileSync(src, dest); } catch {}
  }
}

// ── Inject PWA head tags into dist/index.html ────────────────────────────────
const indexPath = join(distDir, 'index.html');
if (existsSync(indexPath)) {
  let html = readFileSync(indexPath, 'utf8');
  const headTags = [
    `<link rel="manifest" href="/manifest.json?v=${iconVersion}" />`,
    `<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=${iconVersion}" />`,
    '<meta name="theme-color" content="#F2F2F7" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<meta name="apple-mobile-web-app-title" content="Smit Gym" />',
    // Registering a service worker is what makes the app installable —
    // Chrome only fires `beforeinstallprompt` when one is active.
    '<script>',
    '      if ("serviceWorker" in navigator) {',
    '        window.addEventListener("load", function () {',
    '          navigator.serviceWorker.register("/sw.js").catch(function () {});',
    '        });',
    '      }',
    '    </script>',
  ].join('\n    ');

  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', `    ${headTags}\n  </head>`);
    writeFileSync(indexPath, html);
    console.log('write-version: injected PWA head tags + SW registration');
  }
}
