const CACHE_NAME = 'xoara-store-cache-v2'; // Incrementa la versión si haces cambios aquí
const urlsToCache = [
  '/',
  '/index.html',
  '/producto.html',
  '/login-cliente.html',
  '/admin.html',
  '/reportes.html'
];

// Instala el Service Worker y guarda el "cascarón" de la aplicación en la caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta y archivos base guardados');
        return cache.addAll(urlsToCache);
      })
  );
});

// Estrategia "Stale-While-Revalidate"
// Responde con la caché inmediatamente para velocidad, y luego actualiza la caché con la versión de la red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Si obtenemos una respuesta válida de la red, la guardamos en caché para la próxima vez
          if (networkResponse) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Devuelve la respuesta de la caché si existe, si no, espera a la respuesta de la red.
        return response || fetchPromise;
      });
    })
  );
});


// Limpia las cachés antiguas para no ocupar espacio innecesario
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
