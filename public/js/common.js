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


// Roles de usuario
export const SUPER_ADMIN_EMAILS = ['elinquisidor09@gmail.com', 'milkavv.2001@gmail.com'];
export const SUPER_VENDEDOR_EMAILS = ['garyvv.1993@gmail.com', 'abrahamjimenez092003@gmail.com'];
export const VENDEDOR_EMAILS = ['amvf280194@gmail.com', 'noeatlas28@gmail.com'];

export function isSuperAdmin(email) {
    return SUPER_ADMIN_EMAILS.includes(email);
}

export function isSuperVendedor(email) {
    return SUPER_VENDEDOR_EMAILS.includes(email);
}

export function isVendedor(email) {
    return VENDEDOR_EMAILS.includes(email);
}

export function isAdmin(email) {
    return isSuperAdmin(email) || isSuperVendedor(email);
}

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrado para autodestrucción:', reg))
        .catch(err => console.log('Error registrando SW para autodestrucción:', err));
    });
  }
}
