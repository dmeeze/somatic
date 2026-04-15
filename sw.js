const CACHE = 'somatic-__VERSION__';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon.svg',
  './icon-maskable.svg',
  './js/app.js',
  './js/screens/home.js',
  './js/screens/card.js',
  './js/screens/settings.js',
  './js/ui/slider.js',
  './js/ui/grid.js',
  './js/ui/dialog.js',
  './js/data/config.js',
  './js/data/themes.js',
  './js/data/icons.js',
  './js/data/icons-all.js',
  './js/utils/theme.js',
  './js/utils/contrast.js',
  './js/utils/serialize.js',
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
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Only cache same-origin requests; let Google Fonts and other CDNs pass through
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
