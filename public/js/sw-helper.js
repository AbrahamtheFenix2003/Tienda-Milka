// sw-helper.js - Funciones helper para el Service Worker

// Funciones globales para gestión de caché (disponibles en consola del navegador)
window.swHelper = {
  // Limpiar toda la caché
  clearCache: function() {
    if ('serviceWorker' in navigator) {
      return new Promise((resolve, reject) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
          if (event.data.success) {
            console.log('✅ Caché limpiada:', event.data.message);
            resolve(event.data);
          } else {
            console.error('❌ Error limpiando caché:', event.data.error);
            reject(event.data);
          }
        };
        
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE'
        }, [channel.port2]);
      });
    } else {
      console.log('Service Worker no disponible');
      return Promise.reject('Service Worker no disponible');
    }
  },
  
  // Forzar actualización del Service Worker
  forceUpdate: function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        registrations.forEach(function(registration) {
          console.log('🔄 Actualizando Service Worker...');
          registration.update();
        });
      });
    }
  },
  
  // Desregistrar Service Worker (útil para debugging)
  unregister: function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        registrations.forEach(function(registration) {
          console.log('🗑️ Desregistrando Service Worker...');
          registration.unregister();
        });
      });
    }
  },
  
  // Mostrar información del estado del Service Worker
  status: function() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        console.log('📊 Estado del Service Worker:');
        console.log('Registros encontrados:', registrations.length);
        
        registrations.forEach((reg, index) => {
          console.log(`Registro ${index + 1}:`, {
            scope: reg.scope,
            active: reg.active ? 'Activo' : 'Inactivo',
            installing: reg.installing ? 'Instalando' : 'No',
            waiting: reg.waiting ? 'Esperando' : 'No'
          });
        });
        
        if (navigator.serviceWorker.controller) {
          console.log('Controller activo:', navigator.serviceWorker.controller.scriptURL);
        } else {
          console.log('No hay controller activo');
        }
      });
      
      // Mostrar cachés disponibles
      caches.keys().then(cacheNames => {
        console.log('💾 Cachés disponibles:', cacheNames);
      });
    } else {
      console.log('Service Worker no soportado en este navegador');
    }
  },
  
  // Recargar con caché fresca
  hardReload: function() {
    console.log('🔄 Recarga completa con caché fresca...');
    this.clearCache().then(() => {
      window.location.reload(true);
    }).catch(() => {
      // Si falla, hacer recarga normal
      window.location.reload(true);
    });
  },
  
  // Solucionar problemas con iconos/recursos externos
  fixIcons: function() {
    console.log('🔧 Solucionando problemas con iconos...');
    this.clearCache().then(() => {
      // Forzar recarga de Font Awesome
      const fontAwesome = document.querySelector('link[href*="font-awesome"]');
      if (fontAwesome) {
        const newLink = document.createElement('link');
        newLink.rel = 'stylesheet';
        newLink.href = fontAwesome.href + '?v=' + Date.now();
        document.head.removeChild(fontAwesome);
        document.head.appendChild(newLink);
      }
      
      // Recargar página después de un momento
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    });
  }
};

// Registro automático del Service Worker con manejo de actualizaciones
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js')
      .then(function(registration) {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Manejar actualizaciones del Service Worker
        registration.addEventListener('updatefound', function() {
          const newWorker = registration.installing;
          console.log('🆕 Nueva versión del Service Worker encontrada');
          
          newWorker.addEventListener('statechange', function() {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 Nueva versión disponible. Recarga la página para usar la versión actualizada.');
                
                // Opcional: mostrar notificación al usuario
                if (window.confirm('Nueva versión disponible. ¿Quieres recargar la página?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              } else {
                console.log('✅ Service Worker listo para usar offline');
              }
            }
          });
        });
      })
      .catch(function(error) {
        console.error('❌ Error registrando Service Worker:', error);
      });
      
    // Escuchar cuando el Service Worker toma control
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      console.log('🔄 Service Worker actualizado, recargando página...');
      window.location.reload();
    });
  });
}

// Funciones de conveniencia para la consola
console.log(`
🛠️ SW Helper cargado. Funciones disponibles:
- swHelper.clearCache() - Limpiar toda la caché
- swHelper.forceUpdate() - Forzar actualización del SW
- swHelper.unregister() - Desregistrar SW
- swHelper.status() - Ver estado del SW
- swHelper.hardReload() - Recarga completa con caché fresca
- swHelper.fixIcons() - Solucionar problemas con iconos
`);
