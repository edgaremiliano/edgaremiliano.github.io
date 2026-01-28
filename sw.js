const CACHE_NAME = 'cysar-birds-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/login.html',
    '/cursos.html',
    '/css/video-section.css',
    '/css/login.css',
    '/css/cursos.css',
    '/css/clase-detalle.css',
    '/js/auth.js',
    '/js/cursos.js',
    '/js/clase-detalle.js',
    '/js/session-check.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {
            console.log('Cacheando recursos esenciales...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Estrategia: Network First (intentar red, si falla usar caché)
    // Ideal para contenido que cambia frecuentemente (progreso)
    event.respondWith(
        fetch(event.request)
        .catch(() => {
            return caches.match(event.request);
        })
    );
});