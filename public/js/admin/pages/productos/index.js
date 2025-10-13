import { fetchAllProducts, fetchCategories } from './data.js';
import { renderProductosUI, setProducts, setCategories, showProductosError } from './ui.js';

function renderAccessDenied() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    return;
  }

  contentArea.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
      <p class="text-gray-600 text-lg">No tienes permisos para gestionar productos</p>
    </div>
  `;
}

export async function loadProductosPage() {
  const contentArea = document.getElementById('content-area');
  const currentUser = window.currentUser;

  if (!currentUser || !window.hasAccessToSales?.(currentUser.email)) {
    renderAccessDenied();
    return;
  }

  const isVendedor = window.isVendedor?.(currentUser.email) ?? false;

  renderProductosUI({ isVendedor });

  try {
    const [products, categories] = await Promise.all([
      fetchAllProducts(),
      fetchCategories(),
    ]);

    setCategories(categories);
    setProducts(products);
  } catch (error) {
    console.error('Error cargando la página de productos:', error);
    if (typeof showProductosError === 'function') {
      showProductosError('No se pudieron cargar los productos. Intenta nuevamente.');
    } else if (contentArea) {
      contentArea.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p class="text-red-600 text-lg font-semibold">Error al cargar la gestión de productos</p>
          <p class="text-gray-500 mt-2">${error.message || 'Revisa tu conexión e inténtalo otra vez.'}</p>
        </div>
      `;
    }
  }
}
