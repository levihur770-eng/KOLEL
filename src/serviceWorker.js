/**
 * The Kolel Register's service worker: a helper the
 * browser keeps, which stores a copy of the whole app, so it opens and works
 * without internet and can be installed. Not used by `npm run dev`.
 *
 * `vite.config.ts` fills in FILES (every file of the built app) and VERSION
 * (changes whenever a file changes) and writes this file as `sw.js`. A new
 * version is downloaded in the background and waits; the app shows "New
 * version ready" and, when Reload is clicked, sends "skipWaiting".
 */
const FILES = self.__FILES__;
const CACHE = `kolel-${self.__VERSION__}`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kolel-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Opening the app (any address on this site): the stored page.
  // ignoreVary: the copy is used whatever "Vary" header the server sent with
  // it (a server that sends "Vary: Origin" otherwise makes the copy unusable
  // offline). Safe, because each app version has its own cache.
  const key = req.mode === 'navigate' ? '/index.html' : req;
  event.respondWith(caches.open(CACHE).then((cache) => cache.match(key, { ignoreSearch: req.mode === 'navigate', ignoreVary: true }).then((hit) => hit ?? fetch(req))));
});
