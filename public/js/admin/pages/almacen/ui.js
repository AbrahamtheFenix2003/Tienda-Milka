let productsState = [];
let categoriesState = [];
let filteredProductsState = [];

const filterState = {
  nombre: '',
  categoria: 'todas',
  estado: 'todos',
};

let hasModalBackdropListener = false;

export function renderAlmacenUI() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    console.error('No se encontro el contenedor principal para la seccion Almacen.');
    return;
  }

  resetState();

  contentArea.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Gestion de Almacen</h2>
        <div class="flex space-x-3">
          <button id="export-detalles-btn" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
            <i class="fas fa-file-excel mr-2"></i>Exportar Detalles (Excel)
          </button>
          <button id="export-vista-btn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            <i class="fas fa-file-excel mr-2"></i>Exportar Vista Actual (Excel)
          </button>
        </div>
      </div>

      <!-- Resumen General -->
      <div class="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-800">
            <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
            Resumen General de Inventario
          </h3>
          <button id="toggle-resumen-detail" class="text-blue-600 hover:text-blue-800 text-sm">
            <i class="fas fa-expand-arrows-alt mr-1"></i>Ver detalles
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div class="bg-white rounded-lg shadow p-4 border">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                <i class="fas fa-boxes text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Total de Productos</p>
                <p class="text-3xl font-bold text-blue-600" id="total-productos-unicos">0</p>
                <p class="text-xs text-gray-500">Productos registrados</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-4 border">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 text-green-600">
                <i class="fas fa-cubes text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Stock Total Disponible</p>
                <p class="text-3xl font-bold text-green-600" id="total-stock-disponible">0</p>
                <p class="text-xs text-gray-500">Unidades en inventario</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-4 border">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                <i class="fas fa-calculator text-xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600">Valor Total del Inventario</p>
                <p class="text-3xl font-bold text-purple-600" id="valor-total-inventario">S/ 0.00</p>
                <p class="text-xs text-gray-500">Valor en precio de venta</p>
              </div>
            </div>
          </div>
        </div>

        <div id="resumen-productos-stock" class="hidden mt-4">
          <h4 class="text-lg font-semibold text-gray-700 mb-3">
            Detalle de Productos en Inventario
          </h4>
          <div class="overflow-x-auto bg-white rounded-lg shadow border">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Actual</th>
                </tr>
              </thead>
              <tbody id="lista-resumen-productos-detalle" class="bg-white divide-y divide-gray-200">
                <!-- Las filas de productos se insertarán aquí -->
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Indicadores -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-500">
              <i class="fas fa-check-circle text-xl"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Con Stock</p>
              <p class="text-2xl font-semibold text-gray-900" id="productos-con-stock">0</p>
            </div>
          </div>
        </div>


        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-red-100 text-red-500">
              <i class="fas fa-times-circle text-xl"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Sin Stock</p>
              <p class="text-2xl font-semibold text-gray-900" id="productos-sin-stock">0</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white p-4 rounded-lg shadow">
        <div class="flex flex-wrap gap-4 items-center">
          <div class="flex-grow min-w-48">
            <input
              type="text"
              id="filtro-nombre-almacen"
              placeholder="Buscar producto..."
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
          </div>

          <div class="flex-shrink-0">
            <select
              id="filtro-categoria-almacen"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="todas">Todas las categorias</option>
            </select>
          </div>

          <div class="flex-shrink-0">
            <select
              id="filtro-estado-stock"
              class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="todos">Todos</option>
              <option value="en-stock">En Stock</option>
              <option value="sin-stock">Sin Stock</option>
            </select>
          </div>

        </div>
      </div>

      <!-- Tabla de productos -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              </tr>
            </thead>
            <tbody id="productos-almacen-tbody" class="bg-white divide-y divide-gray-200">
              <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Cargando inventario...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  setupEventHandlers();
  closeAllModals();
  setupGlobalModalDismiss();
}
export function updateInventoryView({ products, categories }) {
  productsState = Array.isArray(products) ? [...products] : [];
  categoriesState = Array.isArray(categories) ? [...categories] : [];

  renderCategoryOptions();
  applyFilters();
  renderResumenProductosDetalle();
}

export function renderInventoryError(message) {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    return;
  }

  contentArea.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
      <p class="text-red-600 text-lg font-semibold">Error al cargar el almacen</p>
      <p class="text-gray-500 mt-2">${message || 'Intenta nuevamente en unos momentos.'}</p>
    </div>
  `;
}

function resetState() {
  productsState = [];
  categoriesState = [];
  filteredProductsState = [];
  filterState.nombre = '';
  filterState.categoria = 'todas';
  filterState.estado = 'todos';
}

function setupEventHandlers() {
  const nombreFiltro = document.getElementById('filtro-nombre-almacen');
  const categoriaFiltro = document.getElementById('filtro-categoria-almacen');
  const estadoFiltro = document.getElementById('filtro-estado-stock');
  const toggleResumenBtn = document.getElementById('toggle-resumen-detail');
  const exportDetallesBtn = document.getElementById('export-detalles-btn');
  const exportVistaBtn = document.getElementById('export-vista-btn');

  nombreFiltro?.addEventListener('input', () => {
    filterState.nombre = nombreFiltro.value.toLowerCase();
    applyFilters();
  });

  categoriaFiltro?.addEventListener('change', () => {
    filterState.categoria = categoriaFiltro.value;
    applyFilters();
  });

  estadoFiltro?.addEventListener('change', () => {
    filterState.estado = estadoFiltro.value;
    applyFilters();
  });

  toggleResumenBtn?.addEventListener('click', toggleResumenDetail);
  exportDetallesBtn?.addEventListener('click', exportarDetallesExcel);
  exportVistaBtn?.addEventListener('click', exportarVistaActualExcel);
}

function setupGlobalModalDismiss() {
  if (hasModalBackdropListener) {
    return;
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    if (event.target.classList.contains('modal')) {
      event.target.classList.remove('active');
    }
  });

  hasModalBackdropListener = true;
}

function renderCategoryOptions() {
  const select = document.getElementById('filtro-categoria-almacen');
  if (!select) {
    return;
  }

  const previousValue = select.value;
  const categoryNames = new Set();

  categoriesState.forEach((category) => {
    if (category?.name) {
      categoryNames.add(category.name);
    }
  });

  productsState.forEach((product) => {
    const categoryName = getCategoryName(product);
    if (categoryName) {
      categoryNames.add(categoryName);
    }
  });

  const options = ['<option value="todas">Todas las categorias</option>'];
  Array.from(categoryNames)
    .sort((a, b) => a.localeCompare(b))
    .forEach((categoryName) => {
      options.push(`<option value="${categoryName}">${categoryName}</option>`);
    });

  select.innerHTML = options.join('');
  select.value = categoryNames.has(previousValue) ? previousValue : 'todas';
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach((modal) => modal.classList.remove('active'));
}

function applyFilters() {
  const nombreFiltro = filterState.nombre;
  const categoriaFiltro = filterState.categoria;
  const estadoFiltro = filterState.estado;

  filteredProductsState = productsState.filter((product) => {
    if (nombreFiltro && !(product.name || '').toLowerCase().includes(nombreFiltro)) {
      return false;
    }

    if (categoriaFiltro !== 'todas') {
      const categoriaProducto = getCategoryName(product);
      if (!categoriaProducto || categoriaProducto.toLowerCase() !== categoriaFiltro.toLowerCase()) {
        return false;
      }
    }

    if (estadoFiltro !== 'todos') {
      const stock = Number(product.stock || 0);

      if (estadoFiltro === 'sin-stock') {
        if (stock !== 0) return false;
      } else if (estadoFiltro === 'en-stock') {
        if (stock === 0) return false;
      }
    }

    return true;
  });

  const listToRender = nombreFiltro || categoriaFiltro !== 'todas' || estadoFiltro !== 'todos'
    ? filteredProductsState
    : productsState;

  renderProductosAlmacen(listToRender);
  updateAlmacenSummary(listToRender);
}

function renderProductosAlmacen(productos) {
  const tbody = document.getElementById('productos-almacen-tbody');
  if (!tbody) {
    return;
  }

  if (!productos || productos.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-inbox text-2xl mb-3 block"></i>
          No hay productos para mostrar
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = productos
    .map((product) => {
      const stockActual = Number(product.stock || 0);
      const precio = Number(product.price || 0);
      const { badgeClass, label } = getStockStatus(stockActual);
      const categoria = getCategoryName(product) || 'Sin categoria';
      const productName = product.name || product.nombre || 'Producto sin nombre';

      const avatar = product.imageUrl
        ? `<img src="${product.imageUrl}" alt="${productName}" class="w-10 h-10 rounded-full mr-3 object-cover">`
        : `<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
            <i class="fas fa-box text-gray-400"></i>
          </div>`;

      const priceText = Number.isFinite(precio) ? precio.toFixed(2) : '0.00';

      return `
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              ${avatar}
              <div>
                <div class="text-sm font-medium text-gray-900">${productName}</div>
                <div class="text-xs text-gray-500">${product.id}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${categoria}</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${
            stockActual === 0 ? 'text-red-600' : 'text-gray-900'
          }">${stockActual}</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${badgeClass}">
              ${label}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">S/ ${priceText}</td>
        </tr>
      `;
    })
    .join('');
}

function updateAlmacenSummary(productos) {
  const lista = Array.isArray(productos) ? productos : productsState;

  const totalProductos = lista.length;
  let productosConStock = 0;
  let productosSinStock = 0;
  let totalStockDisponible = 0;
  let valorTotalInventario = 0;

  lista.forEach((product) => {
    const stock = Number(product.stock || 0);
    const precio = Number(product.price || 0);

    totalStockDisponible += stock;
    valorTotalInventario += stock * precio;

    if (stock === 0) {
      productosSinStock += 1;
    } else {
      productosConStock += 1;
    }
  });

  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  };

  setText('total-productos-unicos', totalProductos);
  setText('total-stock-disponible', totalStockDisponible.toLocaleString());
  setText('valor-total-inventario', `S/ ${valorTotalInventario.toFixed(2)}`);
  setText('productos-con-stock', productosConStock);
  setText('productos-sin-stock', productosSinStock);
}

function renderResumenProductosDetalle() {
  const tbody = document.getElementById('lista-resumen-productos-detalle');
  if (!tbody) {
    return;
  }

  const hasFilter = filterState.nombre || filterState.categoria !== 'todas' || filterState.estado !== 'todos';
  const sourceList = hasFilter ? filteredProductsState : productsState;
  const allProducts = Array.isArray(sourceList) ? [...sourceList] : [];

  if (allProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-4 py-6 text-center text-gray-500">
          <i class="fas fa-inbox text-2xl mb-2"></i>
          No hay productos para mostrar
        </td>
      </tr>
    `;
    return;
  }

  // Orden alfabético por nombre para facilitar la lectura
  allProducts.sort((a, b) => {
    const an = (a.name || a.nombre || '').toString().toLowerCase();
    const bn = (b.name || b.nombre || '').toString().toLowerCase();
    return an.localeCompare(bn);
  });

  tbody.innerHTML = allProducts
    .map((product) => {
      const stock = Number(product.stock || 0);
      const precio = Number(product.price || product.precio || 0);
      const valorActual = stock * precio;
      const name = product.name || product.nombre || 'Producto sin nombre';
      const displayName = name.length > 60 ? `${name.substring(0, 57)}...` : name;

      return `
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 text-sm font-medium text-gray-900">
              <div class="flex items-center">
                <div class="mr-3">
                  ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${displayName}" class="w-8 h-8 rounded-full object-cover">` : `<div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><i class="fas fa-box text-gray-400 text-sm"></i></div>`}
                </div>
                <div class="truncate">
                  <div class="text-sm font-medium text-gray-900">${displayName}</div>
                  <div class="text-xs text-gray-500">${product.id || ''}</div>
                </div>
              </div>
            </td>
            <td class="px-4 py-2 text-sm text-gray-800">${getCategoryName(product) || 'Sin categoria'}</td>
            <td class="px-4 py-2 text-sm text-gray-800">${stock}</td>
            <td class="px-4 py-2 text-sm font-semibold ${stock === 0 ? 'text-red-600' : 'text-green-600'}">${stock === 0 ? 'Sin Stock' : 'En Stock'}</td>
            <td class="px-4 py-2 text-sm text-gray-800">S/ ${Number.isFinite(precio) ? precio.toFixed(2) : '0.00'}</td>
            <td class="px-4 py-2 text-sm font-semibold text-gray-900">S/ ${Number.isFinite(valorActual) ? valorActual.toFixed(2) : '0.00'}</td>
          </tr>
        `;
    })
    .join('');
}

function toggleResumenDetail() {
  const resumenDetail = document.getElementById('resumen-productos-stock');
  const toggleBtn = document.getElementById('toggle-resumen-detail');

  if (!resumenDetail || !toggleBtn) {
    return;
  }

  const isHidden = resumenDetail.classList.contains('hidden');
  if (isHidden) {
    // Antes de mostrar, renderizamos con el estado actual de filtros
    renderResumenProductosDetalle();
    resumenDetail.classList.remove('hidden');
    toggleBtn.innerHTML = '<i class="fas fa-compress-arrows-alt mr-1"></i>Ocultar detalles';
  } else {
    resumenDetail.classList.add('hidden');
    toggleBtn.innerHTML = '<i class="fas fa-expand-arrows-alt mr-1"></i>Ver detalles';
  }
}

/* --- Helpers para exportar a Excel (SheetJS) --- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}

async function ensureXlsxLoaded() {
  if (window.XLSX) return;
  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
}

/**
 * Exporta el contenido del panel "Resumen de Productos" (lo que muestra el botón "Ver detalles")
 * Columnas: Producto, Categoria, Stock Actual, Estado, Precio Unitario, Valor Actual
 */
async function exportarDetallesExcel() {
  try {
    await ensureXlsxLoaded();
    const hasFilter = filterState.nombre || filterState.categoria !== 'todas' || filterState.estado !== 'todos';
    const sourceList = hasFilter ? filteredProductsState : productsState;

    const rows = [
      ['Producto', 'Categoria', 'Stock Actual', 'Estado', 'Precio Unitario', 'Valor Actual']
    ];

    (sourceList || []).forEach(p => {
      const nombre = p.name || p.nombre || 'Producto';
      const categoria = getCategoryName(p) || 'Sin categoria';
      const stock = Number(p.stock || 0);
      const estado = stock === 0 ? 'Sin Stock' : 'En Stock';
      const precio = Number(p.price ?? p.precio ?? 0);
      const valorActual = stock * precio;

      rows.push([
        nombre,
        categoria,
        stock,
        estado,
        Number(precio.toFixed ? precio.toFixed(2) : precio),
        Number(valorActual.toFixed ? valorActual.toFixed(2) : valorActual)
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalles');

    const filename = `inventario_detalles_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    showMessage('Detalles exportados a Excel.', 'success');
  } catch (err) {
    console.error('Error exportando detalles a Excel:', err);
    showMessage('No se pudo exportar Detalles a Excel.', 'error');
  }
}

/**
 * Exporta la vista actual de la tabla principal (productos mostrados)
 * Columnas: Producto, Categoria, Stock Actual, Estado, Precio
 */
async function exportarVistaActualExcel() {
  try {
    await ensureXlsxLoaded();
    const listToExport = filterState.nombre || filterState.categoria !== 'todas' || filterState.estado !== 'todos'
      ? filteredProductsState
      : productsState;

    const rows = [
      ['Producto', 'Categoria', 'Stock Actual', 'Estado', 'Precio']
    ];

    (listToExport || []).forEach(p => {
      const nombre = p.name || p.nombre || 'Producto';
      const categoria = getCategoryName(p) || 'Sin categoria';
      const stock = Number(p.stock || 0);
      const estado = stock === 0 ? 'Sin Stock' : 'En Stock';
      const precio = Number(p.price ?? p.precio ?? 0);

      rows.push([nombre, categoria, stock, estado, Number(precio.toFixed ? precio.toFixed(2) : precio)]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vista_Actual');

    const filename = `inventario_vista_actual_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    showMessage('Vista actual exportada a Excel.', 'success');
  } catch (err) {
    console.error('Error exportando vista actual a Excel:', err);
    showMessage('No se pudo exportar la Vista Actual a Excel.', 'error');
  }
}

/* --- Fin helpers Excel --- */

function exportarAlmacenPDF() {
  try {
    showMessage('Generando PDF del almacen...', 'info');

    let PDFConstructor;
    if (window.jsPDF && window.jsPDF.jsPDF) {
      PDFConstructor = window.jsPDF.jsPDF;
    } else if (window.jsPDF) {
      PDFConstructor = window.jsPDF;
    } else if (typeof jsPDF !== 'undefined') {
      PDFConstructor = jsPDF;
    } else {
      showMessage('Biblioteca PDF no disponible. Recarga la pagina.', 'error');
      return;
    }

    const doc = new PDFConstructor();
    const fecha = new Date().toLocaleString('es-PE');

    const productos = productsState;
    let totalStock = 0;
    let valorTotal = 0;
    let productosConStock = 0;
    let productosSinStock = 0;
 
    productos.forEach((product) => {
      const stock = Number(product.stock || 0);
      const precio = Number(product.price || 0);
 
      totalStock += stock;
      valorTotal += stock * precio;
 
      if (stock === 0) {
        productosSinStock += 1;
      } else {
        productosConStock += 1;
      }
    });

    doc.setFontSize(20);
    doc.text('Reporte de Inventario - Tienda Milka', 20, 20);

    doc.setFontSize(12);
    doc.text(`Generado el: ${fecha}`, 20, 30);
    doc.text(`Total de productos: ${productos.length}`, 20, 40);

    doc.setFontSize(14);
    doc.text('Resumen Ejecutivo:', 20, 55);

    doc.setFontSize(10);
    doc.text(`- Stock total disponible: ${totalStock} unidades`, 25, 65);
    doc.text(`- Valor total del inventario: S/ ${valorTotal.toFixed(2)}`, 25, 72);
    doc.text(`- Productos con stock: ${productosConStock}`, 25, 79);
    doc.text(`- Productos sin stock: ${productosSinStock}`, 25, 86);

    doc.line(20, 100, 190, 100);

    let yPos = 115;
    doc.setFontSize(14);
    doc.text('Detalle de Productos:', 20, yPos);
    yPos += 10;

    doc.setFontSize(8);
    doc.text('Producto', 20, yPos);
    doc.text('Categoria', 70, yPos);
    doc.text('Stock', 110, yPos);
    doc.text('Precio', 130, yPos);
    doc.text('Valor Total', 150, yPos);
    doc.text('Estado', 175, yPos);

    yPos += 5;
    doc.line(20, yPos, 190, yPos);
    yPos += 5;

    const productosOrdenados = [...productos].sort(
      (a, b) => Number(b.stock || 0) - Number(a.stock || 0)
    );

    productosOrdenados.forEach((product, index) => {
      const stock = Number(product.stock || 0);
      const precio = Number(product.price || 0);
      const valorProducto = stock * precio;
      const categoriaNombre = getCategoryName(product) || 'Sin categoria';
      const estado = stock === 0 ? 'Sin Stock' : 'En Stock';

      const nombreProducto =
        product.name && product.name.length > 25
          ? `${product.name.substring(0, 22)}...`
          : product.name || 'Producto';

      const nombreCategoria =
        categoriaNombre.length > 15
          ? `${categoriaNombre.substring(0, 12)}...`
          : categoriaNombre;

      doc.text(nombreProducto, 20, yPos);
      doc.text(nombreCategoria, 70, yPos);
      doc.text(stock.toString(), 110, yPos);
      doc.text(`S/ ${precio.toFixed(2)}`, 130, yPos);
      doc.text(`S/ ${valorProducto.toFixed(2)}`, 150, yPos);
      doc.text(estado, 175, yPos);

      yPos += 8;

      if (yPos > 280 && index !== productosOrdenados.length - 1) {
        doc.addPage();
        yPos = 20;
        doc.setFontSize(8);
        doc.text('Producto', 20, yPos);
        doc.text('Categoria', 70, yPos);
        doc.text('Stock', 110, yPos);
        doc.text('Precio', 130, yPos);
        doc.text('Valor Total', 150, yPos);
        doc.text('Estado', 175, yPos);
        yPos += 5;
        doc.line(20, yPos, 190, yPos);
        yPos += 5;
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    doc.setPage(pageCount);
    doc.setFontSize(8);
    doc.text(
      `Pagina ${pageCount} - Tienda Milka - ${new Date().getFullYear()}`,
      20,
      290
    );

    const fileName = `inventario_tienda_milka_${new Date()
      .toISOString()
      .split('T')[0]}.pdf`;
    doc.save(fileName);

    showMessage('PDF exportado correctamente.', 'success');
  } catch (error) {
    console.error('Error exportando PDF:', error);
    showMessage('Error al exportar el PDF del almacen.', 'error');
  }
}

function getCategoryName(product) {
  if (!product) {
    return '';
  }

  if (product.category) {
    return product.category;
  }

  if (product.categoria) {
    return product.categoria;
  }

  if (product.categoryName) {
    return product.categoryName;
  }

  if (categoriesState.length > 0 && product.categoryId) {
    const category = categoriesState.find((cat) => cat.id === product.categoryId);
    return category?.name || '';
  }

  return '';
}

function getStockStatus(stock) {
  if (stock === 0) {
    return { label: 'Sin Stock', badgeClass: 'bg-red-100 text-red-800' };
  }
  return { label: 'En Stock', badgeClass: 'bg-green-100 text-green-800' };
}

function showMessage(message, type = 'info') {
  const alertClasses = {
    success: 'bg-green-100 border-green-400 text-green-700',
    error: 'bg-red-100 border-red-400 text-red-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  };

  const alertDiv = document.createElement('div');
  alertDiv.className = `fixed top-4 right-4 z-50 ${alertClasses[type] || alertClasses.info} border px-4 py-3 rounded shadow-lg max-w-md`;
  alertDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${icons[type] || icons.info} mr-2"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

