// Service worker: de app werkt volledig offline na het eerste bezoek.
// Verhoog VERSION bij elke release, dan haalt iedereen de nieuwe bestanden op.
// Een nieuwe versie wacht netjes tot Ruby op "verversen" tikt (zie ui.js).
const VERSION = 'v14';
const CACHE = `rubys-sudoku-${VERSION}`;
const NETWORK_TIMEOUT = 3000;

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
  'js/themes.js',
  'js/feedback.js',
  'js/worker.js',
  'fonts/fraunces-latin.woff2',
  'fonts/nunito-latin.woff2',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png',
  'hand/digit-1.svg',
  'hand/digit-2.svg',
  'hand/digit-3.svg',
  'hand/digit-4.svg',
  'hand/digit-5.svg',
  'hand/digit-6.svg',
  'hand/digit-7.svg',
  'hand/digit-8.svg',
  'hand/digit-9.svg',
  'hand/logo.svg',
  'hand/hart-1.svg',
  'hand/hart-2.svg',
  'hand/goed-zo.svg',
  'hand/ik-vind-je-heel-leuk.svg',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' slaat de HTTP-cache over, zodat we echt de nieuwe bestanden krijgen.
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      // Eenmalig: versies t/m v6 kennen het "verversen"-kaartje nog niet, dus daar nemen we het meteen over.
      .then(() => caches.keys())
      .then((keys) => { if (keys.some((k) => /^rubys-sudoku-v[1-6]$/.test(k))) self.skipWaiting(); }),
  );
});

// De pagina vraagt hierom als Ruby op "verversen" tikt.
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('rubys-sudoku') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const cacheable = (res) => res && res.ok && res.type === 'basic';

// Pagina zelf: eerst het netwerk (zo zie je updates), maar na ~3 seconden
// of zonder internet gewoon de bewaarde versie.
function networkFirst(request) {
  return new Promise((resolve) => {
    let done = false;
    const fallback = () => caches.match('index.html').then((hit) => hit || caches.match('./'));
    const finish = (p) => { if (!done) { done = true; resolve(p); } };
    const timer = setTimeout(() => fallback().then((hit) => { if (hit) finish(hit); }), NETWORK_TIMEOUT);
    fetch(request)
      .then((res) => {
        clearTimeout(timer);
        if (cacheable(res)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('index.html', copy));
        }
        finish(res);
      })
      .catch(() => {
        clearTimeout(timer);
        fallback().then((hit) => finish(hit || Response.error()));
      });
  });
}

// Overige app-bestanden: meteen uit de cache, en op de achtergrond verversen.
function staleWhileRevalidate(event) {
  const { request } = event;
  return caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(request);
    const fresh = fetch(request)
      .then((res) => { if (cacheable(res)) cache.put(request, res.clone()); return res; })
      .catch(() => hit || Response.error());
    if (hit) { event.waitUntil(fresh.catch(() => {})); return hit; }
    return fresh;
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const scope = new URL(self.registration.scope);
  const isPage = request.mode === 'navigate' || url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`;
  event.respondWith(isPage ? networkFirst(request) : staleWhileRevalidate(event));
});
