const CACHE_NAME = 'agenda-papa-v5';
const FILES = [
  '/dev/app-rapelle/',
  '/dev/app-rapelle/index.html',
  '/dev/app-rapelle/style.css',
  '/dev/app-rapelle/app.js',
  '/dev/app-rapelle/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});