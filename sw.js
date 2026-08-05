// Minimal app-shell service worker for the Pluriversal Land Use PWA.
// Caches the static shell (HTML/manifest/icons) so the app opens instantly and
// works offline for navigation; all live data (storage API, literature searches)
// still requires a network connection and is never cached here.

const CACHE_NAME = 'pluriverse-shell-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Never intercept cross-origin requests (storage API, researchmap, Semantic Scholar,
  // OpenAlex, Crossref, CiNii, etc.) — those must always hit the network live.
  if (new URL(req.url).origin !== self.location.origin) return;

  // App-shell files: cache-first, so the app opens instantly and works offline.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && req.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
