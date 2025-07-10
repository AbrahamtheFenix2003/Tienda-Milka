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
        .then(reg => console.log('SW registrado:', reg))
        .catch(err => console.log('Error de registro de SW:', err));
    });
  }
}
