// GCSE Study Desk service worker. It makes the installed app open quickly
// and survive a dropped connection on the way in:
// - Page loads go to the network first; the last copy of each subject's
//   page is kept so the app still opens offline.
// - Hashed build files and fonts never change, so they are served from the
//   cache once fetched.
// - /api is never touched: learner data always comes from the server.
const VERSION = 'study-desk-v1';
const SUBJECT_ROOTS = ['/maths-higher/', '/maths/', '/english/'];
const PRECACHE = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function shellKey(url) {
  return SUBJECT_ROOTS.find((root) => url.pathname === root.slice(0, -1) || url.pathname.startsWith(root)) || '/';
}

function isImmutableAsset(url) {
  return /\/assets\/[^/]+-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/.test(url.pathname) || url.pathname.startsWith('/fonts/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    const key = shellKey(url);
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(key, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => (await caches.match(key)) || (await caches.match('/')) || Response.error()),
    );
    return;
  }

  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })),
    );
  }
});
