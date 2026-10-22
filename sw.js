// Service worker: de app werkt volledig offline na het eerste bezoek.
// Een release maak je met `npm run release`: dat verhoogt VERSION en zet de
// SHELL-HASH hieronder. De tests falen als de app-bestanden veranderd zijn
// zonder nieuwe release, zodat een update nooit vergeten wordt.
// Een nieuwe versie wacht netjes tot Ruby op "verversen" tikt (zie ui.js).
const VERSION = 'v22';
// SHELL-HASH: d887b4c7472cba05
const CACHE = `rubys-sudoku-${VERSION}`;

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
  'js/guitar.js',
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

// Alles komt uit de cache van déze versie: nieuwe bestanden komen alleen
// binnen met een nieuwe VERSION (een nieuwe service worker), en die wacht tot
// Ruby op het kaartje tikt. Zo draait er nooit een mengsel van oud en nieuw.
// Alleen als iets niet in de cache staat, vragen we het netwerk.
function fromCache(request, key = request) {
  return caches.open(CACHE)
    .then((c) => c.match(key, { ignoreSearch: true }))
    .then((hit) => hit || fetch(request));
}

// Een andere pagina binnen de app-map (bijvoorbeeld scripts/gitaar.html):
// gewoon van het netwerk, en nooit in de plaats van de app bewaren.
function otherPage(request) {
  return fetch(request).catch(() => caches.match('index.html', { cacheName: CACHE }).then((hit) => hit || Response.error()));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const scope = new URL(self.registration.scope);
  const isApp = url.pathname === scope.pathname || url.pathname === `${scope.pathname}index.html`;
  if (isApp) event.respondWith(fromCache(request, 'index.html'));
  else if (request.mode === 'navigate') event.respondWith(otherPage(request));
  else event.respondWith(fromCache(request));
});
