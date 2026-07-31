/**
 * Smit Gym — minimal service worker.
 *
 * Its ONLY job is to make the app installable: Chrome/Edge require a service
 * worker with a fetch handler before it will fire `beforeinstallprompt`.
 *
 * Deliberately NO caching. The app already handles updates via
 * /version.json + the in-app UpdateChecker banner, and a caching SW would
 * fight that (serving a stale shell after a deploy). Everything is passed
 * straight through to the network.
 */

const VERSION = 'smit-gym-sw-v1';

self.addEventListener('install', () => {
  // Take over immediately so a fresh deploy isn't stuck behind an old worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop anything a previous (caching) version of this SW left behind.
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  // Pass-through. Present so the app qualifies as installable.
  event.respondWith(fetch(event.request));
});
