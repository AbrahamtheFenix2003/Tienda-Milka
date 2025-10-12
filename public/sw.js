// Service Worker "Kamikaze" - se autodestruye y limpia la caché.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Limpiar todas las cachés existentes.
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));

    // Desregistrar el Service Worker.
    await self.registration.unregister();

    // Forzar la recarga de todas las pestañas abiertas del sitio.
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map(client => client.navigate(client.url)));
  })());
});