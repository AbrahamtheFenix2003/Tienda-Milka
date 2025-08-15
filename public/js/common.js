import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';

export async function initFirebase() {
  const response = await fetch('/__/firebase/init.json');
  const config = await response.json();
  return initializeApp(config);
}

export function setupNavigation() {
  const backBtn = document.getElementById('back-button');
  if (backBtn) backBtn.addEventListener('click', () => window.history.back());
  const forwardBtn = document.getElementById('forward-button');
  if (forwardBtn) forwardBtn.addEventListener('click', () => window.history.forward());
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('SW registrado:', reg);
          
          // Manejar actualizaciones del Service Worker
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('SW: Nueva versión encontrada, instalando...');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('SW: Nueva versión disponible, recargando...');
                  // Hay una nueva versión, recargar la página
                  window.location.reload();
                } else {
                  console.log('SW: Instalado por primera vez');
                }
              }
            });
          });
          
          // Forzar actualización del Service Worker si hay uno esperando
          if (reg.waiting) {
            console.log('SW: Hay una versión esperando, activando...');
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch(err => console.log('Error de registro de SW:', err));
        
      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'SW_UPDATED') {
          console.log('SW: Service Worker actualizado, recargando página...');
          window.location.reload();
        }
      });
    });
  }
}

// Función para limpiar caché de productos desde la aplicación
export function clearProductCache() {
  return new Promise((resolve) => {
    if (!('serviceWorker' in navigator)) {
      resolve({ success: false, error: 'Service Worker no soportado' });
      return;
    }
    
    if (!navigator.serviceWorker.controller) {
      console.log('Service Worker aún no está activo, saltando limpieza de caché');
      resolve({ success: false, error: 'Service Worker no activo aún' });
      return;
    }
    
    try {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      // Timeout para evitar que se cuelgue
      setTimeout(() => {
        resolve({ success: false, error: 'Timeout' });
      }, 5000);
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_PRODUCT_CACHE' },
        [messageChannel.port2]
      );
    } catch (error) {
      resolve({ success: false, error: error.message });
    }
  });
}
