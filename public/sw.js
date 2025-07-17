// public/sw.js

// Un nombre único para la caché. Es buena práctica cambiar la versión (v4, v5, etc.)
// cada vez que hagas cambios importantes en los archivos que se cachean.
const CACHE_NAME = 'braholet-store-cache-v4';

// Lista de archivos esenciales para que la aplicación funcione offline.
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/reportes.html',
  '/login.html',
  '/login-cliente.html',
  '/js/common.js'
  // No es necesario cachear producto.html porque se genera desde el servidor.
];

/**
 * Evento 'install': Se dispara cuando se instala un nuevo Service Worker.
 * Aquí guardamos los archivos base en la caché.
 */
self.addEventListener('install', event => {
  console.log('SW: Instalando nueva versión...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cache abierta, guardando archivos base.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Esta línea es crucial: le dice al nuevo Service Worker que se active
        // inmediatamente en lugar de esperar a que se cierren las pestañas antiguas.
        console.log('SW: Instalación completa, activando inmediatamente.');
        return self.skipWaiting();
      })
  );
});

/**
 * Evento 'activate': Se dispara cuando el nuevo Service Worker toma el control.
 * Es el mejor momento para limpiar las cachés antiguas.
 */
self.addEventListener('activate', event => {
  console.log('SW: Activando y limpiando cachés antiguas...');
  const cacheWhitelist = [CACHE_NAME]; // Solo la caché actual debe sobrevivir.
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`SW: Eliminando caché antigua: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Esta línea toma el control de todas las pestañas abiertas para
      // que usen este nuevo Service Worker de inmediato.
      console.log('SW: Reclamando control de los clientes.');
      return self.clients.claim();
    })
  );
});

/**
 * Evento 'fetch': Se dispara cada vez que la página pide un recurso (HTML, JS, CSS, etc.).
 * Aquí interceptamos la petición y decidimos qué hacer.
 */
self.addEventListener('fetch', event => {
  const { request } = event;

  // Estrategia: Network First (Primero la Red) para las páginas HTML.
  // Esto soluciona el problema de tener que refrescar con Ctrl+Shift+R.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Si la red funciona, guardamos una copia en la caché y devolvemos la respuesta.
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Si la red falla (estamos offline), intentamos servir desde la caché.
          return caches.match(request);
        })
    );
    return;
  }

  // Estrategia: Cache First (Primero la Caché) para todo lo demás (JS, CSS, fuentes, etc.).
  // Es más rápido porque estos archivos no cambian tan a menudo.
  event.respondWith(
    caches.match(request).then(response => {
      // Si está en la caché, lo devolvemos. Si no, lo buscamos en la red.
      return response || fetch(request).then(fetchResponse => {
        // Y guardamos la nueva respuesta en caché para la próxima vez.
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });
        return fetchResponse;
      });
    })
  );
});
