// Service worker: de app werkt volledig offline na het eerste bezoek.
// Verhoog VERSION bij elke release, dan haalt iedereen de nieuwe bestanden op.
const VERSION = 'v4';
const CACHE = `rubys-sudoku-${VERSION}`;
const FONT_CACHE = 'rubys-sudoku-fonts';

const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/style.css',
  'js/ui.js',
  'js/game.js',
  'js/solver.js',
  'js/techniques.js',
  'js/generator.js',
  'js/bank.js',
  'js/hints.js',
  'js/storage.js',
  'js/messages.js',
  'js/feedback.js',
  'js/worker.js',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Google Fonts: eerst uit de cache, op de achtergrond verversen.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        const fresh = fetch(request).then((res) => { cache.put(request, res.clone()); return res; }).catch(() => hit);
        return hit || fresh;
      }),
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // App-bestanden: cache eerst (snel en offline), anders netwerk.
  event.respondWith(
    caches.match(request, { ignoreSearch: request.mode === 'navigate' }).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    }).catch(() => (request.mode === 'navigate' ? caches.match('index.html') : Response.error()))),
  );
});
