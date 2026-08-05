// App-shell service worker for the Pluriversal Land Use PWA.
//
// Strategy:
// - HTML (navigation requests / index.html): NETWORK-FIRST. Always tries to fetch
//   the latest version first, only falling back to the cached copy if offline.
//   This is what makes future deploys show up immediately instead of getting
//   stuck on a stale cached version.
// - Static assets (manifest, icons): CACHE-FIRST, since these rarely change and
//   cache-first makes the app open instantly.
// - Everything cross-origin (the storage API, researchmap, Semantic Scholar,
//   OpenAlex, Crossref, CiNii, Firebase, etc.) is never intercepted — always live.

const CACHE_NAME = 'pluriverse-shell-v2';
const STATIC_FILES = [
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES))
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
  const url = new URL(req.url);

  // Never intercept cross-origin requests — those must always hit the network live.
  if (url.origin !== self.location.origin) return;

  const isHtml = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHtml) {
    // Network-first: always try to get the latest deploy; fall back to cache only if offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Static assets: cache-first for instant loads, fall back to network.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok && req.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      });
    })
  );
});
