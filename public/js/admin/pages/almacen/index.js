import { getInventoryStatus } from './data.js';
import {
  renderAlmacenUI,
  updateInventoryView,
  renderInventoryError,
} from './ui.js';

function renderAccessDenied(container) {
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600 text-lg">No tienes permisos para gestionar el almacen</p>
    </div>
  `;
}

export async function loadAlmacenPage() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    console.error('No se encontro el contenedor principal para la seccion de almacen.');
    return;
  }

  const currentUser = window.currentUser;
  const isAdminUser =
    typeof window.isAdmin === 'function' && window.isAdmin(currentUser?.email);

  if (!currentUser || !isAdminUser) {
    renderAccessDenied(contentArea);
    return;
  }

  renderAlmacenUI();

  try {
    const { products, categories } = await getInventoryStatus();
    updateInventoryView({ products, categories });
  } catch (error) {
    console.error('Error cargando datos del almacen:', error);
    renderInventoryError(error.message || 'No se pudieron obtener los datos del almacen.');
  }
}
