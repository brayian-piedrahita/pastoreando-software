/**
 * Service worker de Pastoreando.
 * Guarda en cache la estructura de la aplicacion (HTML, CSS, JS, iconos) para
 * que la pantalla abra aunque no haya senal en el potrero. Las consultas a la
 * API siempre van a la red: los datos nunca se sirven desde un cache viejo.
 */
const NOMBRE_CACHE = 'pastoreando-v1';
const ARCHIVOS = [
  '/',
  '/index.html',
  '/panel.html',
  '/manifest.webmanifest',
  '/css/style.css',
  '/js/api.js',
  '/js/login.js',
  '/js/panel.js',
  '/vendor/materialize.min.css',
  '/vendor/materialize.min.js',
  '/vendor/material-icons.css',
  '/vendor/material-icons.woff2',
  '/img/logo.png',
  '/img/icono-192.png',
  '/img/icono-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(ARCHIVOS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres.filter((n) => n !== NOMBRE_CACHE).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  const url = new URL(evento.request.url);
  if (evento.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }
  evento.respondWith(
    caches.match(evento.request).then((guardado) => guardado || fetch(evento.request))
  );
});
