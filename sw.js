const CACHE = 'somatic-__VERSION__';

const V = '__VERSION__';

const ASSETS = [
  './',
  `./index.html?v=${V}`,
  `./styles.css?v=${V}`,
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg',
  `./js/app.js?v=${V}`,
  `./js/screens/home.js?v=${V}`,
  `./js/screens/card.js?v=${V}`,
  `./js/screens/settings.js?v=${V}`,
  `./js/ui/slider.js?v=${V}`,
  `./js/ui/grid.js?v=${V}`,
  `./js/ui/dialog.js?v=${V}`,
  `./js/data/config.js?v=${V}`,
  `./js/data/themes.js?v=${V}`,
  `./js/data/icons.js?v=${V}`,
  `./js/data/icons-all.js?v=${V}`,
  `./js/utils/theme.js?v=${V}`,
  `./js/utils/contrast.js?v=${V}`,
  `./js/utils/serialize.js?v=${V}`,
  './vendor/fontawesome/all.min.css',
  './vendor/fontawesome/fa-solid-900.woff2',
  './vendor/fontawesome/fa-regular-400.woff2',
  './vendor/fontawesome/fa-light-300.woff2',
  './vendor/fontawesome/fa-duotone-900.woff2',
  './vendor/fontawesome/fa-brands-400.woff2',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() =>
        self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
          .then(cs => cs.forEach(c => c.postMessage({ type: 'SW_UPDATED', version: V })))
      )
  );
});

const FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Google Fonts — stale-while-revalidate so they work offline after first load
  if (FONT_ORIGINS.some(o => url.startsWith(o))) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        const fetchPromise = fetch(e.request).then(response => {
          if (response.ok) cache.put(e.request, response.clone());
          return response;
        }).catch(() => null);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // version.json — always fetch from network so update checks are accurate
  if (url.endsWith('/version.json') || url.includes('/version.json?')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // Same-origin assets — cache-first
  if (!url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
