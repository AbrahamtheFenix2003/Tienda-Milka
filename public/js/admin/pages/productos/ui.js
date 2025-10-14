import * as data from './data.js';

let currentIsVendedor = false;

export function renderProductosUI({ isVendedor } = {}) {
    window.productsCache = window.productsCache || [];
    window.categoriesCache = window.categoriesCache || [];

    const resolvedIsVendedor = typeof isVendedor === 'boolean'
        ? isVendedor
        : (window.isVendedor && window.currentUser ? window.isVendedor(window.currentUser.email) : false);
    currentIsVendedor = Boolean(resolvedIsVendedor);

    console.log('Preparando interfaz de productos...');
    
    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                ${!currentIsVendedor ? `
                <button id="add-product-btn" class="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600">
                    <i class="fas fa-plus mr-2"></i>Agregar Producto
                </button>
                ` : ''}
            </div>

            <!-- Sección de Filtros -->
            <div id="filtros-container" class="bg-white p-4 rounded-lg shadow">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex-grow min-w-48">
                        <input type="text" id="filtro-nombre" placeholder="Buscar por nombre..." 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-categoria" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="todas">Todas las categorías</option>
                        </select>
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-stock" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="todos">Todo el stock</option>
                            <option value="sin-stock">Sin stock (0)</option>
                            <option value="con-stock">Con stock (>0)</option>
                            <option value="bajo-stock">Stock bajo (≤5)</option>
                        </select>
                    </div>
                    
                    <button id="btn-aplicar-filtros" class="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-md transition-colors">
                        <i class="fas fa-filter mr-1"></i>Aplicar filtros
                    </button>
                    
                    <button id="btn-limpiar-filtros" class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition-colors">
                        <i class="fas fa-times mr-1"></i>Limpiar
                    </button>
                </div>
                
                <!-- Contador de productos -->
                <div id="contador-productos" class="mt-3 text-sm text-gray-600"></div>
            </div>

            <!-- Lista de productos -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">Productos Registrados</h3>
                    <div id="products-list">
                        <div class="text-center py-8">
                            <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500">Cargando productos...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = content;
    
    // Cargar categorías para el filtro
    cargarCategoriasParaFiltro();
    
    // Cargar y mostrar productos
    displayProducts();
    
    // Configurar listeners para filtros
    configurarListenersParaFiltros();
    
    // Configurar eventos
    if (!currentIsVendedor) {
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', showAddProductModal);
        }
    }
}

export function setProducts(products = []) {
    window.productsCache = Array.isArray(products) ? [...products] : [];
    window.productsCache.sort((a, b) => {
        const nameA = (a.name || a.nombre || '').toString().toLowerCase();
        const nameB = (b.name || b.nombre || '').toString().toLowerCase();
        return nameA.localeCompare(nameB);
    });
    displayProducts();
    cargarCategoriasParaFiltro();
}

export function setCategories(categories = []) {
    window.categoriesCache = Array.isArray(categories) ? [...categories] : [];
    window.categoriesCache.sort((a, b) => {
        const nameA = (a?.name || '').toString().toLowerCase();
        const nameB = (b?.name || '').toString().toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

export function showProductosError(message) {
    showErrorMessage(message);
}



// Función auxiliar para calcular stock real de un producto
async function calcularStockRealProducto(productoId) {
    try {
        return await data.getRealProductStock(productoId);
    } catch (error) {
        console.log('Error calculando stock real para producto', productoId, ':', error);
        return null; // Retorna null si hay error
    }
}

function displayProducts(productos = null) {
    const productsList = document.getElementById('products-list');
    const productsToShow = productos || window.productsCache || [];
    
    // Actualizar contador
    actualizarContadorProductos(productsToShow.length, window.productsCache ? window.productsCache.length : 0);

    // Si el contenedor ya no existe (por ejemplo, al cambiar de módulo) salimos sin mostrar error
    if (!productsList) {
        console.warn('displayProducts: contenedor #products-list no encontrado; se omite render.');
        return;
    }
    
    if (productsToShow.length === 0) {
        const mensaje = productos === null ? 
            'No hay productos registrados' : 
            'No se encontraron productos con los filtros seleccionados';
        
        productsList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">${mensaje}</p>
            </div>
        `;
        return;
    }

    const productsHTML = productsToShow.map(product => {
        // Usar stock del producto como valor inicial
        const stock = parseInt(product.stock) || 0;
        let stockClass = 'bg-green-100 text-green-800';
        if (stock === 0) {
            stockClass = 'bg-red-100 text-red-800';
        } else if (stock <= 5) {
            stockClass = 'bg-yellow-100 text-yellow-800';
        }
        
        // Actualizar stock real en background
        setTimeout(() => {
            calcularStockRealProducto(product.id).then(stockReal => {
                if (stockReal !== null && stockReal !== stock) {
                    const stockElement = document.querySelector(`[data-product-stock="${product.id}"]`);
                    if (stockElement) {
                        // Actualizar texto
                        stockElement.innerHTML = `Stock: ${stockReal} <i class="fas fa-boxes text-xs ml-1"></i>`;
                        
                        // Actualizar clase de color
                        let nuevaClase = 'bg-green-100 text-green-800';
                        if (stockReal === 0) {
                            nuevaClase = 'bg-red-100 text-red-800';
                        } else if (stockReal <= 5) {
                            nuevaClase = 'bg-yellow-100 text-yellow-800';
                        }
                        stockElement.className = `${nuevaClase} px-2 py-1 rounded text-sm font-medium cursor-pointer`;
                        stockElement.title = `Stock real calculado desde lotes: ${stockReal}`;
                    }
                }
            });
        }, 100);
        
        // Determinar clase de stock

        
        // Crear galería de imágenes si hay múltiples
        const images = [
            product.imageUrl || product.imagen,
            product.imageUrl2,
            product.imageUrl3,
            product.imageUrl4
        ].filter(Boolean);
        
        const imageGallery = images.length > 0 ? `
            <div class="ml-4 flex-shrink-0">
                <div class="flex flex-wrap gap-1">
                    ${images.slice(0, 3).map((img, index) => `
                        <img src="${img}" alt="Imagen ${index + 1}" 
                             class="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80"
                             onclick="showImageModal('${img}', '${product.name || product.nombre}')">
                    `).join('')}
                    ${images.length > 3 ? `
                        <div class="w-16 h-16 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-600">
                            +${images.length - 3}
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : '';
        
        return `
            <div class="border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-semibold text-lg">${product.name || product.nombre || 'Sin nombre'}</h4>
                                ${product.sku ? `<p class="text-sm text-gray-500">SKU: ${product.sku}</p>` : ''}
                            </div>
                            ${!currentIsVendedor ? `
                            <div class="flex space-x-2 ml-4">
                                <button onclick="editarProducto('${product.id}')" class="text-blue-500 hover:text-blue-700 p-1" title="Editar">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="eliminarProducto('${product.id}', '${product.name || product.nombre}')" class="text-red-500 hover:text-red-700 p-1" title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                            ` : ''}
                        </div>
                        
                        ${(product.description || product.descripcion) ? `
                        <div class="text-gray-600 text-sm mb-3 prose prose-sm">
                            ${product.description || product.descripcion}
                        </div>
                        ` : ''}
                        
                        <div class="flex flex-wrap gap-2 mb-3">
                            <span class="${stockClass} px-2 py-1 rounded text-sm font-medium cursor-pointer" 
                                  data-product-stock="${product.id}"
                                  onclick="verStockPorLotes('${product.id}', '${product.name || product.nombre}')" 
                                  title="Ver stock por lotes">
                                Stock: ${stock} <i class="fas fa-boxes text-xs ml-1"></i>
                            </span>
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                                S/ ${product.price || product.precio || '0.00'}
                            </span>
                            ${product.originalPrice ? `
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                                Orig: S/ ${product.originalPrice}
                            </span>
                            ` : ''}
                            ${(product.acquisitionCost || product.cost) ? `
                            <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                                Costo: S/ ${product.acquisitionCost || product.cost}
                            </span>
                            ` : ''}
                            ${(product.category || product.categoria) ? `
                            <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                                ${product.category || product.categoria}
                            </span>
                            ` : ''}
                        </div>
                        
                        <!-- Acciones adicionales para gestión de lotes -->
                        <div class="flex flex-wrap gap-2 mb-2">
                            <button onclick="mostrarLotesProducto('${product.id}')" 
                                    class="text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-300 hover:bg-blue-50 text-xs"
                                    title="Gestionar lotes del producto">
                                <i class="fas fa-layer-group mr-1"></i>Ver Lotes
                            </button>
                            <button onclick="mostrarHistorialMovimientos('${product.id}')" 
                                    class="text-green-600 hover:text-green-800 px-2 py-1 rounded border border-green-300 hover:bg-green-50 text-xs"
                                    title="Ver historial de movimientos">
                                <i class="fas fa-history mr-1"></i>Historial
                            </button>
                            ${!currentIsVendedor ? `
                            <button onclick="ajustarStockProducto('${product.id}')" 
                                    class="text-orange-600 hover:text-orange-800 px-2 py-1 rounded border border-orange-300 hover:bg-orange-50 text-xs"
                                    title="Ajustar stock manualmente">
                                <i class="fas fa-edit mr-1"></i>Ajustar Stock
                            </button>
                            ` : ''}
                        </div>
                        
                        ${(product.acquisitionCost || product.cost) && product.price ? `
                        <div class="text-xs text-gray-500">
                            Margen: ${(((product.price - (product.acquisitionCost || product.cost)) / product.price) * 100).toFixed(1)}%
                        </div>
                        ` : ''}
                    </div>
                    ${imageGallery}
                </div>
            </div>
        `;
    });

    productsList.innerHTML = productsHTML.join('');
}

function showAddProductModal() {
    const modal = `
        <div id="product-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style="z-index: 1000;">
            <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">Añadir Nuevo Producto</h3>
                    <button onclick="closeProductModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="product-form" class="space-y-6">
                    <!-- Información básica -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                            <input type="text" id="product-name" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <div class="flex gap-2">
                                <select id="product-category" 
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                                    <option value="">-- Selecciona --</option>
                                </select>
                                <button type="button" onclick="showCategoryModal()" 
                                    class="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                                    Gestionar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio de Venta (S/) *</label>
                            <input type="number" id="product-price" required step="0.01" min="0"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio Original (S/)</label>
                            <input type="number" id="product-original-price" step="0.01" min="0"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Costo de Adquisición (S/)</label>
                            <input type="number" id="product-cost" step="0.01" min="0"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
                        <input type="text" id="product-sku"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    
                    <!-- Nota sobre stock -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            <div>
                                <p class="text-sm text-blue-700 font-medium">Sistema de Lotes</p>
                                <p class="text-xs text-blue-600">El stock se gestiona automáticamente a través del sistema de lotes. Una vez creado el producto, podrá agregar stock mediante compras que generarán lotes individuales.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imágenes -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Imagen Principal</label>
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <input type="file" id="product-image-main" accept="image/*" class="hidden" onchange="previewImage(this, 'main')">
                                <div id="preview-main" class="mb-2"></div>
                                <button type="button" onclick="document.getElementById('product-image-main').click()" 
                                    class="bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600">
                                    Seleccionar archivo
                                </button>
                                <p class="text-sm text-gray-500 mt-1">Sin archivos seleccionados</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Imagen 2</label>
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input type="file" id="product-image-2" accept="image/*" class="hidden" onchange="previewImage(this, '2')">
                                    <div id="preview-2" class="mb-2"></div>
                                    <button type="button" onclick="document.getElementById('product-image-2').click()" 
                                        class="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm">
                                        Seleccionar archivo
                                    </button>
                                    <p class="text-xs text-gray-500 mt-1">Sin archivos seleccionados</p>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Imagen 3</label>
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input type="file" id="product-image-3" accept="image/*" class="hidden" onchange="previewImage(this, '3')">
                                    <div id="preview-3" class="mb-2"></div>
                                    <button type="button" onclick="document.getElementById('product-image-3').click()" 
                                        class="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm">
                                        Seleccionar archivo
                                    </button>
                                    <p class="text-xs text-gray-500 mt-1">Sin archivos seleccionados</p>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Imagen 4</label>
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input type="file" id="product-image-4" accept="image/*" class="hidden" onchange="previewImage(this, '4')">
                                    <div id="preview-4" class="mb-2"></div>
                                    <button type="button" onclick="document.getElementById('product-image-4').click()" 
                                        class="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm">
                                        Seleccionar archivo
                                    </button>
                                    <p class="text-xs text-gray-500 mt-1">Sin archivos seleccionados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Descripción -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                        <div id="description-editor"></div>
                    </div>
                    
                    <!-- Botones -->
                    <div class="flex justify-end space-x-3 pt-6 border-t">
                        <button type="button" onclick="closeProductModal()" 
                            class="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" id="save-product-btn"
                            class="px-8 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <i class="fas fa-save mr-2"></i>Guardar Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Cargar categorías existentes
    cargarCategoriasParaModal();
    
    // Inicializar editor de texto rico
    initializeTinyMCE();
    
    // Configurar evento del formulario
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
}

// ============ FUNCIONES DE FILTRADO ============

function cargarCategoriasParaFiltro() {
    const selectCategoria = document.getElementById('filtro-categoria');
    
    if (!selectCategoria || !window.productsCache) return;
    
    // Limpiar opciones existentes excepto la primera
    while (selectCategoria.options.length > 1) {
        selectCategoria.remove(1);
    }
    
    // Obtener categorías únicas de los productos
    const categorias = new Set();
    window.productsCache.forEach(producto => {
        const categoria = producto.categoria || producto.category;
        if (categoria) {
            categorias.add(categoria);
        }
    });
    
    // Agregar opciones al select
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        selectCategoria.appendChild(option);
    });
}

function configurarListenersParaFiltros() {
    const btnAplicarFiltros = document.getElementById('btn-aplicar-filtros');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');
    const filtroNombre = document.getElementById('filtro-nombre');
    
    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener('click', aplicarFiltros);
    }
    
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }
    
    // Filtrar al presionar Enter en el campo de búsqueda
    if (filtroNombre) {
        filtroNombre.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                aplicarFiltros();
            }
        });
        
        // Filtrar en tiempo real mientras se escribe (con debounce)
        let timeout;
        filtroNombre.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(aplicarFiltros, 300);
        });
    }
}

function aplicarFiltros() {
    if (!window.productsCache) return;
    
    const filtroNombre = document.getElementById('filtro-nombre').value.toLowerCase().trim();
    const filtroCategoria = document.getElementById('filtro-categoria').value;
    const filtroStock = document.getElementById('filtro-stock').value;
    
    // Filtrar productos según los criterios
    const productosFiltrados = window.productsCache.filter(producto => {
        const nombre = (producto.nombre || producto.name || '').toLowerCase();
        const categoria = producto.categoria || producto.category || '';
        const stock = parseInt(producto.stock) || 0;
        
        // Filtro por nombre
        const pasaNombre = !filtroNombre || nombre.includes(filtroNombre);
        
        // Filtro por categoría
        const pasaCategoria = filtroCategoria === 'todas' || categoria === filtroCategoria;
        
        // Filtro por stock
        let pasaStock = true;
        if (filtroStock === 'sin-stock') {
            pasaStock = stock === 0;
        } else if (filtroStock === 'con-stock') {
            pasaStock = stock > 0;
        } else if (filtroStock === 'bajo-stock') {
            pasaStock = stock > 0 && stock <= 5;
        }
        
        return pasaNombre && pasaCategoria && pasaStock;
    });
    
    // Actualizar la visualización
    displayProducts(productosFiltrados);
}

function limpiarFiltros() {
    const filtroNombre = document.getElementById('filtro-nombre');
    const filtroCategoria = document.getElementById('filtro-categoria');
    const filtroStock = document.getElementById('filtro-stock');
    
    if (filtroNombre) filtroNombre.value = '';
    if (filtroCategoria) filtroCategoria.value = 'todas';
    if (filtroStock) filtroStock.value = 'todos';
    
    // Mostrar todos los productos nuevamente
    displayProducts();
}

function actualizarContadorProductos(mostrados, total) {
    const contador = document.getElementById('contador-productos');
    if (!contador) return;
    
    if (mostrados === total) {
        contador.innerHTML = `Mostrando <strong>${total}</strong> productos`;
    } else {
        contador.innerHTML = `Mostrando <strong>${mostrados}</strong> de <strong>${total}</strong> productos`;
    }
}

// ============ FUNCIONES DE GESTIÓN (placeholders) ============

function editarProducto(id) {
    console.log('Editar producto:', id);
    
    // Buscar el producto en el cache
    const producto = window.productsCache.find(p => p.id === id);
    if (!producto) {
        alert('Error: No se encontró el producto');
        return;
    }
    
    const modal = `
        <div id="product-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style="z-index: 1000;">
            <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-2xl font-bold text-gray-800">Editar Producto</h3>
                    <button onclick="closeProductModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="edit-product-form" class="space-y-6">
                    <input type="hidden" id="product-id" value="${id}">
                    
                    <!-- Información básica -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                            <input type="text" id="edit-product-name" required value="${producto.name || producto.nombre || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                            <div class="flex gap-2">
                                <select id="edit-product-category" 
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                                    <option value="">-- Selecciona --</option>
                                </select>
                                <button type="button" onclick="showCategoryModal()" 
                                    class="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                                    Gestionar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio de Venta (S/) *</label>
                            <input type="number" id="edit-product-price" required step="0.01" min="0" value="${producto.price || producto.precio || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio Original (S/)</label>
                            <input type="number" id="edit-product-original-price" step="0.01" min="0" value="${producto.originalPrice || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Costo de Adquisición (S/)</label>
                            <input type="number" id="edit-product-cost" step="0.01" min="0" value="${producto.acquisitionCost || producto.cost || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
                        <input type="text" id="edit-product-sku" value="${producto.sku || ''}"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    
                    <!-- Nota sobre stock -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div class="flex items-center">
                            <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                            <div>
                                <p class="text-sm text-blue-700 font-medium">Sistema de Lotes</p>
                                <p class="text-xs text-blue-600">El stock se gestiona automáticamente a través del sistema de lotes. El stock actual se calcula desde los lotes existentes del producto.</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Imágenes existentes y nuevas -->
                    <div class="space-y-4">
                        ${(producto.imageUrl || producto.imagen) ? `
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Imagen Principal Actual</label>
                            <img src="${producto.imageUrl || producto.imagen}" alt="Imagen principal" 
                                 class="w-32 h-32 object-cover rounded-lg border mb-2">
                        </div>
                        ` : ''}
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                ${(producto.imageUrl || producto.imagen) ? 'Cambiar Imagen Principal' : 'Imagen Principal'}
                            </label>
                            <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                <input type="file" id="product-image-main" accept="image/*" class="hidden" onchange="previewImage(this, 'main')">
                                <div id="preview-main" class="mb-2"></div>
                                <button type="button" onclick="document.getElementById('product-image-main').click()" 
                                    class="bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600">
                                    Seleccionar archivo
                                </button>
                                <p class="text-sm text-gray-500 mt-1">Sin archivos seleccionados</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Imagen 2</label>
                                ${producto.imageUrl2 ? `
                                <img src="${producto.imageUrl2}" alt="Imagen 2" class="w-20 h-20 object-cover rounded border mb-2">
                                ` : ''}
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input type="file" id="product-image-2" accept="image/*" class="hidden" onchange="previewImage(this, '2')">
                                    <div id="preview-2" class="mb-2"></div>
                                    <button type="button" onclick="document.getElementById('product-image-2').click()" 
                                        class="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm">
                                        ${producto.imageUrl2 ? 'Cambiar' : 'Seleccionar'}
                                    </button>
                                    <p class="text-xs text-gray-500 mt-1">Sin archivos seleccionados</p>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Imagen 3</label>
                                ${producto.imageUrl3 ? `
                                <img src="${producto.imageUrl3}" alt="Imagen 3" class="w-20 h-20 object-cover rounded border mb-2">
                                ` : ''}
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input type="file" id="product-image-3" accept="image/*" class="hidden" onchange="previewImage(this, '3')">
                                    <div id="preview-3" class="mb-2"></div>
                                    <button type="button" onclick="document.getElementById('product-image-3').click()" 
                                        class="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm">
                                        ${producto.imageUrl3 ? 'Cambiar' : 'Seleccionar'}
                                    </button>
                                    <p class="text-xs text-gray-500 mt-1">Sin archivos seleccionados</p>
                                </div>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Imagen 4</label>
                                ${producto.imageUrl4 ? `
                                <img src="${producto.imageUrl4}" alt="Imagen 4" class="w-20 h-20 object-cover rounded border mb-2">
                                ` : ''}
                                <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <input type="file" id="product-image-4" accept="image/*" class="hidden" onchange="previewImage(this, '4')">
                                    <div id="preview-4" class="mb-2"></div>
                                    <button type="button" onclick="document.getElementById('product-image-4').click()" 
                                        class="bg-rose-500 text-white px-3 py-1 rounded hover:bg-rose-600 text-sm">
                                        ${producto.imageUrl4 ? 'Cambiar' : 'Seleccionar'}
                                    </button>
                                    <p class="text-xs text-gray-500 mt-1">Sin archivos seleccionados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Descripción -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                        <div id="description-editor">${producto.description || producto.descripcion || ''}</div>
                    </div>
                    
                    <!-- Botones -->
                    <div class="flex justify-end space-x-3 pt-6 border-t">
                        <button type="button" onclick="closeProductModal()" 
                            class="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" id="save-product-btn"
                            class="px-8 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <i class="fas fa-save mr-2"></i>Actualizar Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    
    // Cargar categorías y seleccionar la actual
    cargarCategoriasParaModal(producto.category || producto.categoria);
    
    // Inicializar editor de texto rico
    initializeTinyMCE();
    
    // Configurar evento del formulario
    document.getElementById('edit-product-form').addEventListener('submit', handleProductSubmit);
}

async function eliminarProducto(id, nombre) {
    if (confirm(`¿Estás seguro de que quieres eliminar el producto "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        console.log('Eliminando producto:', id);
        
        // Mostrar indicador de carga
        const loadingModal = `
            <div id="loading-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-rose-500 mb-4"></i>
                    <p class="text-gray-700">Eliminando producto...</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingModal);
        
        try {
            await data.deleteProduct(id);

            console.log('Producto eliminado correctamente');
            
            // Actualizar cache local
            window.productsCache = window.productsCache.filter(p => p.id !== id);
            
            // Recargar la vista
            displayProducts();
            
            // Mostrar mensaje de éxito
            showSuccessMessage('Producto eliminado correctamente');
        } catch (error) {
            console.error('Error eliminando producto:', error);
            showErrorMessage('Error al eliminar el producto: ' + error.message);
        } finally {
            const loadingModalEl = document.getElementById('loading-modal');
            if (loadingModalEl) {
                loadingModalEl.remove();
            }
        }
    }
}

console.log('Modulo UI de productos cargado completamente');

// ============ FUNCIONES AUXILIARES DEL MODAL ============

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.remove();
    }
    
    // Limpiar TinyMCE si existe
    if (window.tinymce) {
        window.tinymce.remove('#description-editor');
    }
}

function showCategoryModal() {
    const modal = `
        <div id="category-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style="z-index: 9999;">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Gestionar Categorías</h3>
                    <button onclick="closeCategoryModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Agregar nueva categoría -->
                <div class="mb-6">
                    <div class="flex gap-2">
                        <input type="text" id="new-category-name" placeholder="Nombre de la nueva categoría"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        <button onclick="addCategory()" class="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600">
                            Añadir
                        </button>
                    </div>
                </div>
                
                <!-- Lista de categorías existentes -->
                <div class="space-y-2" id="categories-list">
                    <!-- Las categorías se cargarán aquí -->
                </div>
                
                <div class="flex justify-end mt-6">
                    <button onclick="closeCategoryModal()" class="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
    loadCategoriesInModal();
}

function closeCategoryModal() {
    const modal = document.getElementById('category-modal');
    if (modal) {
        modal.remove();
    }
    
    // Recargar categorías en el select principal
    cargarCategoriasParaModal();
}

async function loadCategoriesInModal() {
    const container = document.getElementById('categories-list');
    if (!container) return;
    
    try {
        const categories = await data.fetchCategories();
        
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay categorías registradas</p>';
            return;
        }
        
        const categoriesHTML = categories.map(category => `
            <div class="flex justify-between items-center p-2 border rounded">
                <span>${category.name}</span>
                <div class="flex space-x-2">
                    <button onclick="editCategory('${category.id}', '${category.name}')" 
                        class="text-blue-500 hover:text-blue-700 px-2 py-1" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCategory('${category.id}', '${category.name}')" 
                        class="text-red-500 hover:text-red-700 px-2 py-1" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = categoriesHTML;
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
        container.innerHTML = '<p class="text-red-500 text-center py-4">Error cargando categorías</p>';
    }
}

async function addCategory() {
    const input = document.getElementById('new-category-name');
    const categoryName = input.value.trim();
    
    if (!categoryName) {
        alert('Por favor ingresa un nombre para la categoría');
        return;
    }
    
    try {
        await data.createCategory(categoryName);
        
        input.value = '';
        loadCategoriesInModal();
        showSuccessMessage('Categoría agregada correctamente');
        
    } catch (error) {
        console.error('Error agregando categoría:', error);
        if (error.code === 'category-exists') {
            showErrorMessage('Ya existe una categoría con ese nombre');
        } else {
            showErrorMessage('Error al agregar la categoría: ' + error.message);
        }
    }
}

async function deleteCategory(id, name) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
        return;
    }
    
    try {
        await data.removeCategory(id);
        loadCategoriesInModal();
        showSuccessMessage('Categoría eliminada correctamente');
        
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        showErrorMessage('Error al eliminar la categoría: ' + error.message);
    }
}

async function editCategory(id, currentName) {
    const newName = prompt('Ingresa el nuevo nombre para la categoria:', currentName);
    
    if (!newName || newName.trim() === '') {
        return;
    }
    
    const trimmedName = newName.trim();
    
    if (trimmedName === currentName) {
        return; // No hay cambios
    }
    
    try {
        const { newName: updatedName } = await data.updateCategoryName({
            categoryId: id,
            currentName,
            newName: trimmedName
        });
        
        console.log('Categoria actualizada correctamente');
        
        // Actualizar cache local de productos
        if (window.productsCache) {
            window.productsCache.forEach(product => {
                if (product.category === currentName || product.categoria === currentName) {
                    product.category = updatedName;
                    product.categoria = updatedName;
                }
            });
        }
        
        // Actualizar cache local de categorias
        if (window.categoriesCache) {
            const categoryIndex = window.categoriesCache.findIndex(cat => cat.id === id);
            if (categoryIndex !== -1) {
                window.categoriesCache[categoryIndex].name = updatedName;
            }
        }
        
        // Recargar la lista de categorias en el modal
        loadCategoriesInModal();
        
        // Recargar el selector de categorias en el formulario principal
        cargarCategoriasParaModal();
        
        // Mantener la categoria seleccionada en el formulario principal si era la editada
        const categorySelect = document.getElementById('product-category');
        if (categorySelect && categorySelect.value === currentName) {
            // Pequeño delay para asegurar que las opciones se hayan actualizado
            setTimeout(() => {
                categorySelect.value = updatedName;
            }, 100);
        }
        
        showSuccessMessage(`Categoria actualizada correctamente`);
    } catch (error) {
        if (error?.code === 'category-exists') {
            showErrorMessage('Ya existe una categoria con ese nombre');
            return;
        }
        console.error('Error editando categoria:', error);
        showErrorMessage('Error al editar la categoria: ' + error.message);
    }
}

function previewImage(input, imageType) {
    const file = input.files[0];
    const previewContainer = document.getElementById(`preview-${imageType}`);
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <img src="${e.target.result}" alt="Preview" class="max-w-full max-h-32 object-contain rounded">
            `;
        };
        reader.readAsDataURL(file);
        
        // Actualizar texto
        const textElement = input.parentElement.querySelector('p');
        if (textElement) {
            textElement.textContent = file.name;
        }
    } else {
        previewContainer.innerHTML = '';
        const textElement = input.parentElement.querySelector('p');
        if (textElement) {
            textElement.textContent = 'Sin archivos seleccionados';
        }
    }
}

function initializeTinyMCE() {
    // Verificar que TinyMCE esté disponible y que el elemento exista
    if (window.tinymce && document.getElementById('description-editor')) {
        // Remover instancia previa si existe
        if (window.tinymce.get('description-editor')) {
            window.tinymce.remove('#description-editor');
        }
        
        // Inicializar con un pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            if (document.getElementById('description-editor')) {
                window.tinymce.init({
                    selector: '#description-editor',
                    height: 200,
                    plugins: 'advlist autolink lists link image charmap print preview anchor',
                    toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
                    content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
                    language: 'es',
                    setup: function (editor) {
                        editor.on('init', function () {
                            console.log('TinyMCE inicializado correctamente');
                        });
                    }
                });
            }
        }, 100);
    } else {
        // Si TinyMCE no está disponible, intentar de nuevo después de un tiempo
        setTimeout(() => {
            initializeTinyMCE();
        }, 500);
    }
}

async function cargarCategoriasParaModal(categoriaSeleccionada = '') {
    const selectCategoria = document.getElementById('edit-product-category') || document.getElementById('product-category');
    if (!selectCategoria) return;
    
    try {
        const categories = await data.fetchCategories();
        
        // Limpiar y llenar el select
        while (selectCategoria.options.length > 1) {
            selectCategoria.remove(1);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            if (category.name === categoriaSeleccionada) {
                option.selected = true;
            }
            selectCategoria.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

async function handleProductSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = document.getElementById('save-product-btn');
    const isEdit = form.id === 'edit-product-form';
    
    // Deshabilitar botón y mostrar loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${isEdit ? 'Actualizando...' : 'Guardando...'}`;
    
    try {
        // Obtener descripción del editor TinyMCE
        let description = '';
        if (window.tinymce && window.tinymce.get('description-editor')) {
            description = window.tinymce.get('description-editor').getContent();
        }
        
        // Recopilar datos del formulario usando querySelector para evitar conflictos de ID
        console.log('Form type - isEdit:', isEdit);
        console.log('Form ID:', form.id);
        
        const nameElement = isEdit ? 
            form.querySelector('#edit-product-name') : 
            form.querySelector('#product-name');
        console.log('Product name element:', nameElement);
        console.log('Product name value:', nameElement?.value);
        console.log('Looking for element ID:', isEdit ? 'edit-product-name' : 'product-name');
        
        // Obtener elementos basándose en el tipo de formulario usando querySelector
        const priceElement = isEdit ? 
            form.querySelector('#edit-product-price') : 
            form.querySelector('#product-price');
        const originalPriceElement = isEdit ? 
            form.querySelector('#edit-product-original-price') : 
            form.querySelector('#product-original-price');
        const costElement = isEdit ? 
            form.querySelector('#edit-product-cost') : 
            form.querySelector('#product-cost');
        const categoryElement = isEdit ? 
            form.querySelector('#edit-product-category') : 
            form.querySelector('#product-category');
        const skuElement = isEdit ? 
            form.querySelector('#edit-product-sku') : 
            form.querySelector('#product-sku');

        const formData = {
            name: nameElement?.value?.trim() || '',
            price: parseFloat(priceElement?.value || 0),
            originalPrice: originalPriceElement?.value ? parseFloat(originalPriceElement.value) : null,
            acquisitionCost: costElement?.value ? parseFloat(costElement.value) : null,
            stock: 0, // Inicializado en 0, se obtendrá desde lotes
            category: categoryElement?.value?.trim() || '',
            sku: skuElement?.value?.trim() || '',
            description: description
        };
        
        console.log('FormData name:', formData.name);
        console.log('FormData name length:', formData.name.length);
        
        // Validaciones
        if (!formData.name || formData.name.trim() === '') {
            console.log('Validation failed: name is empty');
            throw new Error('El nombre del producto es obligatorio');
        }
        if (isNaN(formData.price) || formData.price < 0) {
            throw new Error('El precio debe ser un número válido mayor o igual a 0');
        }
        
        // Manejar múltiples imágenes
        const imageFiles = [
            { file: document.getElementById('product-image-main').files[0], key: 'imageUrl' },
            { file: document.getElementById('product-image-2').files[0], key: 'imageUrl2' },
            { file: document.getElementById('product-image-3').files[0], key: 'imageUrl3' },
            { file: document.getElementById('product-image-4').files[0], key: 'imageUrl4' }
        ];
        
        // Subir imágenes que se hayan seleccionado
        for (const imageItem of imageFiles) {
            if (imageItem.file) {
                // Validar tamaño (5MB max)
                if (imageItem.file.size > 5 * 1024 * 1024) {
                    throw new Error('Las imágenes no deben superar los 5MB');
                }
                
                // Validar tipo
                if (!imageItem.file.type.startsWith('image/')) {
                    throw new Error('Solo se permiten archivos de imagen');
                }
                
                // Subir imagen
                formData[imageItem.key] = await data.uploadProductImage(imageItem.file, formData.name);
            }
        }
        
        // Agregar timestamp
        formData.updatedAt = data.getServerTimestamp();
        
        if (isEdit) {
            // Actualizar producto existente
            const productId = document.getElementById('product-id').value;
            // Solo actualizar campos que tienen valores (no sobrescribir imágenes existentes si no se cambiaron)
            // NUNCA actualizar campos históricos: stockInicial, precioCompraInicial y stock (se gestiona por lotes)
            const fieldsToExclude = ['stockInicial', 'precioCompraInicial', 'createdAt', 'stock'];
            const updateData = {};
            
            Object.keys(formData).forEach(key => {
                if (!fieldsToExclude.includes(key) && 
                    formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                    updateData[key] = formData[key];
                }
            });
            
            console.log('Actualizando producto, campos excluidos:', fieldsToExclude);
            console.log('Datos a actualizar:', updateData);
            
            await data.updateProduct(productId, updateData);
            // Actualizar cache local
            const index = window.productsCache.findIndex(p => p.id === productId);
            if (index !== -1) {
                window.productsCache[index] = { ...window.productsCache[index], ...updateData };
            }
            showSuccessMessage('Producto actualizado correctamente');
        } else {
            // Crear nuevo producto
            // Guardar stockInicial y precioCompraInicial solo al crear
            formData.stockInicial = formData.stock;
            formData.precioCompraInicial = formData.acquisitionCost || 0;
            formData.createdAt = data.getServerTimestamp();
            
            console.log('Guardando producto con stock inicial:', {
                stockInicial: formData.stockInicial,
                precioCompraInicial: formData.precioCompraInicial,
                stock: formData.stock,
                acquisitionCost: formData.acquisitionCost
            });
            
            const newProductId = await data.createProduct(formData);
            // Agregar al cache local
            window.productsCache.push({ id: newProductId, ...formData });
            window.productsCache.sort((a, b) => (a.name || a.nombre || '').localeCompare(b.name || b.nombre || ''));
            showSuccessMessage('Producto agregado correctamente');
        }
        
        // Cerrar modal y recargar vista
        closeProductModal();
        displayProducts();
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        showErrorMessage('Error: ' + error.message);
        
        // Rehabilitar botón
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-save mr-2"></i>${isEdit ? 'Actualizar Producto' : 'Guardar Producto'}`;
    }
}

async function uploadProductImage(file, productName) {
    return data.uploadProductImage(file, productName);
}

function showSuccessMessage(message) {
    const messageDiv = `
        <div id="success-message" class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>${message}</span>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', messageDiv);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        const element = document.getElementById('success-message');
        if (element) {
            element.remove();
        }
    }, 3000);
}

function showErrorMessage(message) {
    const messageDiv = `
        <div id="error-message" class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
            <div class="flex items-center">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                <span>${message}</span>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', messageDiv);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        const element = document.getElementById('error-message');
        if (element) {
            element.remove();
        }
    }, 5000);
}

function showImageModal(imageUrl, productName) {
    const modal = `
        <div id="image-modal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60" onclick="closeImageModal()">
            <div class="relative max-w-4xl max-h-full p-4">
                <button onclick="closeImageModal()" class="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75">
                    <i class="fas fa-times"></i>
                </button>
                <img src="${imageUrl}" alt="${productName}" class="max-w-full max-h-full object-contain rounded-lg">
                <div class="text-white text-center mt-2 bg-black bg-opacity-50 px-4 py-2 rounded">
                    ${productName}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modal);
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.remove();
    }
}

// Función para ver stock por lotes
window.verStockPorLotes = async function(productId, productName) {
    try {
        const lotesStock = await data.fetchActiveLots(productId);
        const proveedores = await data.fetchProvidersMap();

        mostrarModalStockPorLotes(productId, productName, lotesStock, proveedores);
        
    } catch (error) {
        console.error('Error cargando stock por lotes:', error);
        alert('Error cargando información de lotes');
    }
};

function mostrarModalStockPorLotes(productId, productName, lotesStock, proveedores) {
    const stockTotal = lotesStock.reduce((sum, lote) => sum + (lote.cantidad || 0), 0);
    const costoPromedio = lotesStock.length > 0 ? 
        lotesStock.reduce((sum, lote) => sum + (lote.costoUnitario * lote.cantidad), 0) / stockTotal : 0;
    
    const modalHTML = `
        <div id="modal-stock-lotes" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style="z-index: 1000;">
            <div class="bg-white rounded-lg p-6 w-full max-w-6xl max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-xl font-semibold">Stock por Lotes</h3>
                        <p class="text-gray-600">${productName}</p>
                    </div>
                    <button onclick="cerrarModalStockLotes()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <!-- Resumen -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <div class="text-sm text-blue-600 font-medium">Stock Total</div>
                        <div class="text-2xl font-bold text-blue-700">${stockTotal}</div>
                    </div>
                    <div class="bg-green-50 p-4 rounded-lg">
                        <div class="text-sm text-green-600 font-medium">Lotes Activos</div>
                        <div class="text-2xl font-bold text-green-700">${lotesStock.length}</div>
                    </div>
                    <div class="bg-orange-50 p-4 rounded-lg">
                        <div class="text-sm text-orange-600 font-medium">Costo Promedio</div>
                        <div class="text-2xl font-bold text-orange-700">S/ ${costoPromedio.toFixed(2)}</div>
                    </div>
                </div>
                
                <!-- Tabla de lotes -->
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lote ID</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Ingreso</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Original</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Unitario</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${lotesStock.length > 0 ? lotesStock.map(lote => `
                                <tr class="hover:bg-gray-50">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                        ${lote.loteId || 'Sin lote'}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${lote.fechaIngreso ? 
                                            (lote.fechaIngreso.toDate ? lote.fechaIngreso.toDate() : new Date(lote.fechaIngreso))
                                            .toLocaleDateString('es-ES') : 'Sin fecha'}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <span class="font-semibold ${lote.cantidad === 0 ? 'text-red-600' : 'text-green-600'}">
                                            ${lote.cantidad || 0}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        ${lote.cantidadOriginal || 0}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        S/ ${(lote.costoUnitario || 0).toFixed(2)}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${proveedores[lote.proveedorId] || 'Desconocido'}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${lote.cantidad > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                            ${lote.cantidad > 0 ? 'Activo' : 'Agotado'}
                                        </span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button onclick="ajustarStockLote('${lote.id}', '${lote.loteId}', ${lote.cantidad})" 
                                                class="text-blue-600 hover:text-blue-900" title="Ajustar stock">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="verHistorialLote('${lote.loteId}')" 
                                                class="text-green-600 hover:text-green-900" title="Ver historial">
                                            <i class="fas fa-history"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                                        Este producto no tiene lotes registrados.
                                        <br><small class="text-xs">El stock actual se considera como "Lote Legacy" hasta la próxima compra.</small>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                
                <!-- Botones de acción -->
                <div class="mt-6 flex justify-between">
                    <button onclick="crearLoteLegacy('${productId}')" 
                            class="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600">
                        <i class="fas fa-box mr-2"></i>Crear Lote Legacy
                    </button>
                    <button onclick="exportarStockLotes('${productId}', '${productName}')" 
                            class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        <i class="fas fa-download mr-2"></i>Exportar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.cerrarModalStockLotes = function() {
    const modal = document.getElementById('modal-stock-lotes');
    if (modal) {
        modal.remove();
    }
};

window.ajustarStockLote = function(stockId, loteId, cantidadActual) {
    const nuevaCantidad = prompt(`Ajustar stock del lote ${loteId}\nCantidad actual: ${cantidadActual}\nNueva cantidad:`, cantidadActual);
    
    if (nuevaCantidad !== null && !isNaN(nuevaCantidad) && parseInt(nuevaCantidad) >= 0) {
        ajustarStockLoteEnBD(stockId, loteId, parseInt(nuevaCantidad), cantidadActual);
    }
};

async function ajustarStockLoteEnBD(stockId, loteId, nuevaCantidad, cantidadAnterior) {
    try {
        await data.updateLotStock({
            stockId,
            nuevaCantidad,
            cantidadAnterior
        });
        
        // Registrar movimiento de inventario
        const diferencia = nuevaCantidad - cantidadAnterior;
        if (diferencia !== 0) {
            await data.recordInventoryMovement({
                loteId: loteId,
                tipo: diferencia > 0 ? 'ajuste_entrada' : 'ajuste_salida',
                cantidad: Math.abs(diferencia),
                stockAnterior: cantidadAnterior,
                stockNuevo: nuevaCantidad,
                observacion: `Ajuste manual de stock - Lote: ${loteId}`,
                timestamp: data.getServerTimestamp(),
                usuario: window.currentUser ? window.currentUser.email : 'sistema'
            });
        }
        
        // Recalcular stock total del producto
        await recalcularStockTotalProducto(stockId);
        
        alert('Stock ajustado correctamente');
        cerrarModalStockLotes();
        
        // Recargar productos para mostrar el nuevo stock
        if (window.productsCache) {
            displayProducts();
        }
        
    } catch (error) {
        console.error('Error ajustando stock:', error);
        alert('Error ajustando el stock');
    }
}

async function recalcularStockTotalProducto(stockId) {
    try {
        const loteInfo = await data.fetchLotById(stockId);
        if (!loteInfo) return;
        
        const productoId = loteInfo.productoId;
        const stockTotal = await data.recalculateProductStock(productoId);
        
        // Actualizar cache local
        if (window.productsCache) {
            const productIndex = window.productsCache.findIndex(p => p.id === productoId);
            if (productIndex !== -1) {
                window.productsCache[productIndex].stock = stockTotal;
            }
        }
        
    } catch (error) {
        console.error('Error recalculando stock total:', error);
    }
}

window.crearLoteLegacy = async function(productId) {
    const producto = window.productsCache.find(p => p.id === productId);
    if (!producto) {
        alert('Producto no encontrado');
        return;
    }
    
    // Usar stockInicial para cantidadOriginal (permitir 0)
    const stockInicial = producto.stockInicial !== undefined ? producto.stockInicial : null;
    if (stockInicial === null) {
        alert('El producto no tiene stock inicial definido para crear un lote legacy');
        return;
    }
    
    // Usar stock actual para cantidad (permitir 0)
    const stockActual = parseInt(producto.stock) || 0;
    
    // Usar precioCompraInicial para el costo unitario
    const costoUnitario = producto.precioCompraInicial || producto.acquisitionCost || producto.cost || 0;
    
    // Usar createdAt para la fecha de ingreso
    const fechaIngreso = producto.createdAt ? 
        (producto.createdAt.toDate ? producto.createdAt.toDate() : new Date(producto.createdAt)) : 
        new Date();
    
    const fechaIngresoFormateada = fechaIngreso.toLocaleDateString('es-ES');
    
    const estadoLote = stockActual === 0 ? 'AGOTADO' : 'ACTIVO';
    const descripcionEstado = stockActual === 0 ? 
        'Este lote representará el inventario original del producto (actualmente agotado).' :
        'Este lote representará el inventario original del producto.';
    
    if (!confirm(`¿Crear lote legacy con los siguientes datos?\n\n` +
                `Stock original: ${stockInicial} unidades\n` +
                `Stock actual: ${stockActual} unidades (${estadoLote})\n` +
                `Costo unitario: S/ ${costoUnitario.toFixed(2)}\n` +
                `Fecha de ingreso: ${fechaIngresoFormateada}\n\n` +
                `${descripcionEstado}`)) return;
    
    try {
        const { loteId } = await data.createLegacyLot({
            productId,
            productoNombre: producto.name || producto.nombre,
            stockActual,
            stockInicial,
            costoUnitario,
            fechaIngreso,
            usuario: window.currentUser?.email || 'sistema'
        });
        
        const estadoFinal = stockActual === 0 ? '(AGOTADO)' : '(ACTIVO)';
        alert(`Lote legacy creado correctamente\n\n` +
              `ID: ${loteId}\n` +
              `Stock actual: ${stockActual} unidades ${estadoFinal}\n` +
              `Stock original: ${stockInicial} unidades\n` +
              `Fecha: ${fechaIngresoFormateada}`);
        
        // Refrescar modal si está abierto
        const modalLotes = document.getElementById('modal-lotes-producto');
        if (modalLotes) {
            window.cerrarModalLotesProducto();
            setTimeout(() => {
                window.mostrarLotesProducto(productId);
            }, 100);
        }
        
    } catch (error) {
        console.error('Error creando lote legacy:', error);
        alert('Error creando el lote legacy: ' + (error.message || error));
    }
};

window.verHistorialLote = function(loteId) {
    alert(`Función de historial del lote ${loteId} en desarrollo`);
};

window.exportarStockLotes = function(productId, productName) {
    alert(`Exportando stock por lotes de ${productName}...`);
};

// ====================================================================
// NUEVAS FUNCIONES PARA GESTIÓN AVANZADA DE LOTES
// ====================================================================

// Función principal para mostrar lotes de un producto
window.mostrarLotesProducto = async function(productoId) {
    try {
        console.log('Cargando lotes para producto:', productoId);
        
        // Obtener información del producto
        const producto = window.productsCache?.find(p => p.id === productoId);
        if (!producto) {
            alert('Producto no encontrado');
            return;
        }
        
        const lotes = await data.fetchProductLots(productoId);
        
        let proveedores = {};
        if (window.proveedoresCache && window.proveedoresCache.length) {
            window.proveedoresCache.forEach(p => {
                proveedores[p.id] = p.nombre;
            });
        } else {
            proveedores = await data.fetchProvidersMap();
            window.proveedoresCache = Object.entries(proveedores).map(([id, nombre]) => ({ id, nombre }));
        }
        
        mostrarModalLotesProducto(producto, lotes, proveedores);
        
    } catch (error) {
        console.error('Error al cargar lotes del producto:', error);
        alert('Error al cargar los lotes del producto');
    }
};

// Función para mostrar el modal con los lotes
function mostrarModalLotesProducto(producto, lotes, proveedores) {
    // Calcular estadísticas
    const stockTotal = lotes.reduce((sum, lote) => sum + (lote.cantidad || 0), 0);
    const costoPromedio = calcularCostoPromedioLotes(lotes);
    const lotesActivos = lotes.filter(l => l.cantidad > 0).length;
    
    let contenidoTabla = '';
    
    if (lotes.length === 0) {
        contenidoTabla = `
            <tr>
                <td colspan="8" class="px-4 py-6 text-center text-gray-500">
                    <i class="fas fa-box-open text-3xl mb-3 block"></i>
                    Este producto no tiene lotes registrados.
                    <br><small class="text-xs mt-2 block">Los lotes se crean automáticamente al registrar compras.</small>
                </td>
            </tr>
        `;
    } else {
        contenidoTabla = lotes.map(lote => {
            const fechaIngreso = lote.fechaIngreso ? 
                (lote.fechaIngreso.toDate ? lote.fechaIngreso.toDate() : new Date(lote.fechaIngreso))
                .toLocaleDateString('es-ES') : 'Sin fecha';
            
            const fechaVencimiento = lote.fechaVencimiento ? 
                (lote.fechaVencimiento.toDate ? lote.fechaVencimiento.toDate() : new Date(lote.fechaVencimiento))
                .toLocaleDateString('es-ES') : 'No aplica';
            
            // Determinar clase para fecha de vencimiento
            let vencimientoClass = '';
            if (lote.fechaVencimiento) {
                const hoy = new Date();
                const fechaVenc = lote.fechaVencimiento.toDate ? lote.fechaVencimiento.toDate() : new Date(lote.fechaVencimiento);
                const diasRestantes = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
                
                if (diasRestantes < 0) {
                    vencimientoClass = 'bg-red-100 text-red-800 px-2 py-1 rounded text-xs';
                    fechaVencimiento = `⚠️ ${fechaVencimiento}`;
                } else if (diasRestantes < 30) {
                    vencimientoClass = 'bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs';
                    fechaVencimiento = `⏰ ${fechaVencimiento}`;
                }
            }
            
            const estadoLote = lote.cantidad > 0 ? 'Activo' : 'Agotado';
            const estadoClass = lote.cantidad > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-4 py-3 border-b">
                        <div class="font-medium text-blue-600">${lote.loteId || 'Sin ID'}</div>
                        ${lote.esLegacy ? '<span class="text-xs text-orange-600">Legacy</span>' : ''}
                    </td>
                    <td class="px-4 py-3 border-b">${fechaIngreso}</td>
                    <td class="px-4 py-3 border-b text-center">
                        <span class="font-semibold ${lote.cantidad === 0 ? 'text-red-600' : 'text-green-600'}">
                            ${lote.cantidad || 0}
                        </span>
                    </td>
                    <td class="px-4 py-3 border-b text-center text-gray-500">${lote.cantidadOriginal || 0}</td>
                    <td class="px-4 py-3 border-b text-right">S/ ${(lote.costoUnitario || 0).toFixed(2)}</td>
                    <td class="px-4 py-3 border-b">${proveedores[lote.proveedorId] || 'Sin proveedor'}</td>
                    <td class="px-4 py-3 border-b">
                        <span class="${vencimientoClass}">${fechaVencimiento}</span>
                    </td>
                    <td class="px-4 py-3 border-b">
                        <span class="px-2 py-1 rounded text-xs font-medium ${estadoClass}">
                            ${estadoLote}
                        </span>
                    </td>
                    <td class="px-4 py-3 border-b text-center">
                        <div class="flex justify-center space-x-1">
                            <button onclick="verDetalleLote('${lote.id}')" 
                                    class="text-blue-600 hover:text-blue-800 p-1" title="Ver detalle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="ajustarStockLote('${lote.id}', '${lote.loteId}', ${lote.cantidad})" 
                                    class="text-green-600 hover:text-green-800 p-1" title="Ajustar stock">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="transferirStockLote('${lote.id}')" 
                                    class="text-orange-600 hover:text-orange-800 p-1" title="Transferir stock">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    const modalHTML = `
        <div id="modal-lotes-producto" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
                <div class="p-6 border-b">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-800">
                            <i class="fas fa-boxes mr-2 text-blue-600"></i>
                            Gestión de Lotes: ${producto.name || producto.nombre}
                        </h3>
                        <button onclick="cerrarModalLotesProducto()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Estadísticas -->
                <div class="p-6 bg-gray-50 border-b">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-sm text-blue-600 font-medium">Stock Total</div>
                            <div class="text-2xl font-bold text-blue-700">${stockTotal}</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-sm text-green-600 font-medium">Lotes Activos</div>
                            <div class="text-2xl font-bold text-green-700">${lotesActivos}</div>
                        </div>
                        <div class="bg-orange-50 p-4 rounded-lg">
                            <div class="text-sm text-orange-600 font-medium">Total Lotes</div>
                            <div class="text-2xl font-bold text-orange-700">${lotes.length}</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <div class="text-sm text-purple-600 font-medium">Costo Promedio</div>
                            <div class="text-2xl font-bold text-purple-700">S/ ${costoPromedio.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Tabla de lotes -->
                <div class="flex-1 overflow-auto p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full">
                            <thead class="bg-gray-100">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote ID</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Ingreso</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock Original</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Unitario</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white">
                                ${contenidoTabla}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Botones de acción -->
                <div class="p-6 border-t bg-gray-50">
                    <div class="flex justify-between items-center">
                        <div class="flex space-x-3">
                            <button onclick="crearLoteLegacy('${producto.id}')" 
                                    class="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600">
                                <i class="fas fa-box mr-2"></i>Crear Lote Legacy
                            </button>
                            <button onclick="exportarLotesProducto('${producto.id}', '${producto.name || producto.nombre}')" 
                                    class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                                <i class="fas fa-download mr-2"></i>Exportar
                            </button>
                        </div>
                        <button onclick="cerrarModalLotesProducto()" 
                                class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Función para cerrar el modal de lotes
window.cerrarModalLotesProducto = function() {
    const modal = document.getElementById('modal-lotes-producto');
    if (modal) {
        modal.remove();
    }
};

// Función para calcular costo promedio de lotes
function calcularCostoPromedioLotes(lotes) {
    if (!lotes || lotes.length === 0) return 0;
    
    const totalUnidades = lotes.reduce((sum, lote) => sum + (lote.cantidad || 0), 0);
    if (totalUnidades === 0) return 0;
    
    const valorTotal = lotes.reduce((sum, lote) => 
        sum + ((lote.cantidad || 0) * (lote.costoUnitario || 0)), 0);
    
    return valorTotal / totalUnidades;
}

// Función para ver detalle de un lote específico
window.verDetalleLote = async function(loteId) {
    try {
        const lote = await data.fetchLotById(loteId);
        if (!lote) {
            alert('El lote no existe');
            return;
        }
        
        // Obtener información del producto
        let productoNombre = 'Producto no encontrado';
        if (lote.productoId) {
            const producto = window.productsCache?.find(p => p.id === lote.productoId);
            if (producto) {
                productoNombre = producto.name || producto.nombre;
            }
        }
        
        // Obtener información del proveedor
        let proveedorNombre = 'Sin proveedor';
        if (lote.proveedorId) {
            // Asegurar que tenemos el cache de proveedores
            if (!window.proveedoresCache) {
                try {
                    const proveedoresMap = await data.fetchProvidersMap();
                    window.proveedoresCache = Object.entries(proveedoresMap).map(([id, nombre]) => ({ id, nombre }));
                } catch (error) {
                    console.log('Error cargando proveedores:', error);
                    window.proveedoresCache = [];
                }
            }
            
            const proveedor = window.proveedoresCache?.find(p => p.id === lote.proveedorId);
            if (proveedor) {
                proveedorNombre = proveedor.nombre;
            }
        } else if (lote.proveedorNombre) {
            // Fallback para lotes legacy que pueden tener proveedorNombre directamente
            proveedorNombre = lote.proveedorNombre;
        }
        
        // Obtener información de la compra
        let compraInfo = 'Sin compra asociada';
        if (lote.compraId) {
            try {
                const compra = await data.fetchPurchaseById(lote.compraId);
                if (compra) {
                    const fechaCompra = compra.fecha ? 
                        (compra.fecha.toDate ? compra.fecha.toDate() : new Date(compra.fecha))
                        .toLocaleDateString('es-ES') : 'Sin fecha';
                    compraInfo = `Compra del ${fechaCompra} - Total: S/ ${compra.totalInvertido?.toFixed(2) || '0.00'}`;
                }
            } catch (error) {
                console.log('Error cargando compra:', error);
            }
        }
        
        const fechaIngreso = lote.fechaIngreso ? 
            (lote.fechaIngreso.toDate ? lote.fechaIngreso.toDate() : new Date(lote.fechaIngreso))
            .toLocaleDateString('es-ES') : 'Sin fecha';
            
        const fechaVencimiento = lote.fechaVencimiento ? 
            (lote.fechaVencimiento.toDate ? lote.fechaVencimiento.toDate() : new Date(lote.fechaVencimiento))
            .toLocaleDateString('es-ES') : 'No aplica';
        
        const contenido = `
            <div class="space-y-6">
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-blue-800 mb-3">Información del Lote</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">ID de Lote</p>
                            <p class="font-medium">${lote.loteId || 'Sin ID'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Producto</p>
                            <p class="font-medium">${productoNombre}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Cantidad Actual</p>
                            <p class="font-medium text-lg ${lote.cantidad > 0 ? 'text-green-600' : 'text-red-600'}">${lote.cantidad || 0} unidades</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Cantidad Original</p>
                            <p class="font-medium">${lote.cantidadOriginal || 'N/A'} unidades</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Costo Unitario</p>
                            <p class="font-medium">S/ ${(lote.costoUnitario || 0).toFixed(2)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Valor Total del Lote</p>
                            <p class="font-medium">S/ ${((lote.cantidad || 0) * (lote.costoUnitario || 0)).toFixed(2)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Fecha de Ingreso</p>
                            <p class="font-medium">${fechaIngreso}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Fecha de Vencimiento</p>
                            <p class="font-medium">${fechaVencimiento}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-green-800 mb-3">Información de Compra</h3>
                    <div class="space-y-2">
                        <div>
                            <p class="text-sm text-gray-600">Compra</p>
                            <p class="font-medium">${compraInfo}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Proveedor</p>
                            <p class="font-medium">${proveedorNombre}</p>
                        </div>
                        ${lote.compraId ? `
                        <div class="mt-3">
                            <button onclick="window.open('#compras', '_blank')" 
                                    class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                                <i class="fas fa-external-link-alt mr-1"></i>Ver Módulo de Compras
                            </button>
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="bg-purple-50 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold text-purple-800 mb-3">Acciones Disponibles</h3>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="ajustarStockLote('${loteId}', '${lote.loteId}', ${lote.cantidad}); cerrarModalDetalleLote();" 
                                class="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                            <i class="fas fa-edit mr-1"></i>Ajustar Stock
                        </button>
                        <button onclick="transferirStockLote('${loteId}'); cerrarModalDetalleLote();" 
                                class="px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700">
                            <i class="fas fa-exchange-alt mr-1"></i>Transferir Stock
                        </button>
                        <button onclick="mostrarHistorialMovimientosLote('${loteId}')" 
                                class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            <i class="fas fa-history mr-1"></i>Ver Historial
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        mostrarModal(`Detalle del Lote: ${lote.loteId || loteId}`, contenido);
        
    } catch (error) {
        console.error('Error al cargar detalle del lote:', error);
        alert('Error al cargar el detalle del lote');
    }
};

// Función para cerrar modal de detalle de lote
window.cerrarModalDetalleLote = function() {
    const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
    if (modal) {
        modal.remove();
    }
};

// Función para mostrar historial de movimientos de un producto
window.mostrarHistorialMovimientos = async function(productoId) {
    try {
        console.log('Cargando historial de movimientos para producto:', productoId);
        
        const movimientos = await data.fetchInventoryMovements(productoId, 50);
        
        const producto = window.productsCache?.find(p => p.id === productoId);
        const nombreProducto = producto ? (producto.name || producto.nombre) : 'Producto no encontrado';
        
        let contenidoTabla = '';
        
        if (movimientos.length === 0) {
            contenidoTabla = `
                <tr>
                    <td colspan="6" class="px-4 py-6 text-center text-gray-500">
                        <i class="fas fa-history text-3xl mb-3 block"></i>
                        No hay movimientos registrados para este producto.
                    </td>
                </tr>
            `;
        } else {
            contenidoTabla = movimientos.map(mov => {
                const fecha = mov.fecha ? 
                    (mov.fecha.toDate ? mov.fecha.toDate() : new Date(mov.fecha))
                    .toLocaleDateString('es-ES') + ' ' + 
                    (mov.fecha.toDate ? mov.fecha.toDate() : new Date(mov.fecha))
                    .toLocaleTimeString('es-ES') : 'Sin fecha';
                
                const tipoClass = mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
                const tipoIcon = mov.tipo === 'entrada' ? 'fa-arrow-up' : 'fa-arrow-down';
                
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-3 border-b">${fecha}</td>
                        <td class="px-4 py-3 border-b">
                            <span class="${tipoClass}">
                                <i class="fas ${tipoIcon} mr-1"></i>
                                ${mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                            </span>
                        </td>
                        <td class="px-4 py-3 border-b text-center">
                            <span class="font-medium ${tipoClass}">${mov.cantidad || 0}</span>
                        </td>
                        <td class="px-4 py-3 border-b">${mov.proveedorNombre || 'N/A'}</td>
                        <td class="px-4 py-3 border-b text-right">
                            ${mov.costoUnitario ? 'S/ ' + mov.costoUnitario.toFixed(2) : 'N/A'}
                        </td>
                        <td class="px-4 py-3 border-b text-sm text-gray-600">
                            ${mov.observaciones || 'Sin observaciones'}
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        const modalHTML = `
            <div id="modal-historial-movimientos" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
                    <div class="p-6 border-b">
                        <div class="flex justify-between items-center">
                            <h3 class="text-xl font-semibold text-gray-800">
                                <i class="fas fa-history mr-2 text-green-600"></i>
                                Historial de Movimientos: ${nombreProducto}
                            </h3>
                            <button onclick="cerrarModalHistorialMovimientos()" class="text-gray-500 hover:text-gray-700">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex-1 overflow-auto p-6">
                        <div class="overflow-x-auto">
                            <table class="min-w-full">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Costo Unit.</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observaciones</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white">
                                    ${contenidoTabla}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="p-6 border-t bg-gray-50">
                        <div class="flex justify-end">
                            <button onclick="cerrarModalHistorialMovimientos()" 
                                    class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Error al cargar historial de movimientos:', error);
        alert('Error al cargar el historial de movimientos');
    }
};

// Función para cerrar modal de historial
window.cerrarModalHistorialMovimientos = function() {
    const modal = document.getElementById('modal-historial-movimientos');
    if (modal) {
        modal.remove();
    }
};

// Función para ajustar stock de un producto (sin lote específico)
window.ajustarStockProducto = function(productoId) {
    const producto = window.productsCache?.find(p => p.id === productoId);
    if (!producto) {
        alert('Producto no encontrado');
        return;
    }
    
    const nuevoStock = prompt(`Stock actual: ${producto.stock || 0}\n\nIngresa el nuevo stock para ${producto.name || producto.nombre}:`, producto.stock || 0);
    
    if (nuevoStock === null) return; // Usuario canceló
    
    const stockNumerico = parseInt(nuevoStock);
    if (isNaN(stockNumerico) || stockNumerico < 0) {
        alert('El stock debe ser un número válido mayor o igual a 0');
        return;
    }
    
    if (confirm(`¿Confirmar ajuste de stock?\n\nProducto: ${producto.name || producto.nombre}\nStock actual: ${producto.stock || 0}\nNuevo stock: ${stockNumerico}`)) {
        ajustarStockProductoConfirmar(productoId, stockNumerico);
    }
};

// Función para confirmar ajuste de stock
async function ajustarStockProductoConfirmar(productoId, nuevoStock) {
    try {
        await data.updateProductStock(productoId, nuevoStock);
        
        // Actualizar cache
        const productoIndex = window.productsCache?.findIndex(p => p.id === productoId);
        if (productoIndex !== -1 && window.productsCache) {
            window.productsCache[productoIndex].stock = nuevoStock;
        }
        
        // Registrar movimiento
        const productoNombre = productoIndex !== -1 && window.productsCache
            ? (window.productsCache[productoIndex].name || window.productsCache[productoIndex].nombre)
            : 'Producto';
        await data.recordInventoryMovement({
            productoId: productoId,
            productoNombre,
            cantidad: nuevoStock,
            tipo: 'ajuste',
            usuario: window.currentUser?.email || 'sistema',
            observaciones: 'Ajuste manual de stock desde módulo de productos'
        });
        
        alert('Stock ajustado correctamente');
        displayProducts(); // Refrescar vista
        
    } catch (error) {
        console.error('Error ajustando stock:', error);
        alert('Error al ajustar el stock');
    }
}

// Función helper para mostrar modales
function mostrarModal(titulo, contenido) {
    const modalHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
                <div class="p-6 border-b">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-800">${titulo}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    ${contenido}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Funciones placeholder para funcionalidades futuras
window.transferirStockLote = function(loteId) {
    alert('Función de transferencia de stock entre lotes en desarrollo');
};

window.mostrarHistorialMovimientosLote = function(loteId) {
    alert('Función de historial de movimientos por lote en desarrollo');
};

window.exportarLotesProducto = function(productoId, nombreProducto) {
    alert(`Función de exportación de lotes para ${nombreProducto} en desarrollo`);
};

// Hacer las funciones globales para que funcionen los onclick
window.editarProducto = editarProducto;
window.eliminarProducto = eliminarProducto;
window.showCategoryModal = showCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.editCategory = editCategory;
window.previewImage = previewImage;
window.showImageModal = showImageModal;
window.closeImageModal = closeImageModal;
window.closeProductModal = closeProductModal;

// ====================================================================
// FUNCIONES PARA AJUSTE DE STOCK POR LOTES
// ====================================================================

// Función para ajustar stock de un lote específico
window.ajustarStockLote = function(loteId, loteIdTexto, stockActual) {
    const nuevoStock = prompt(`Stock actual del lote ${loteIdTexto}: ${stockActual}\n\nIngresa el nuevo stock:`, stockActual);
    
    if (nuevoStock === null) return; // Usuario canceló
    
    const stockNumerico = parseInt(nuevoStock);
    if (isNaN(stockNumerico) || stockNumerico < 0) {
        alert('El stock debe ser un número válido mayor o igual a 0');
        return;
    }
    
    if (confirm(`¿Confirmar ajuste de stock?\n\nLote: ${loteIdTexto}\nStock actual: ${stockActual}\nNuevo stock: ${stockNumerico}`)) {
        ajustarStockLoteConfirmar(loteId, loteIdTexto, stockNumerico, stockActual);
    }
};

// Función para confirmar ajuste de stock de lote
async function ajustarStockLoteConfirmar(loteId, loteIdTexto, nuevoStock, stockAnterior) {
    try {
        const loteData = await data.fetchLotById(loteId);
        if (!loteData) {
            alert('El lote no existe');
            return;
        }

        const diferencia = nuevoStock - stockAnterior;
        
        await data.updateLotStock({
            stockId: loteId,
            nuevaCantidad: nuevoStock,
            cantidadAnterior: stockAnterior
        });
        
        // Actualizar stock total del producto si es posible
        if (loteData.productoId) {
            const stockTotal = await data.recalculateProductStock(loteData.productoId);
            
            // Actualizar cache si existe
            const productoIndex = window.productsCache?.findIndex(p => p.id === loteData.productoId);
            if (productoIndex !== -1 && window.productsCache) {
                window.productsCache[productoIndex].stock = stockTotal;
            }
        }
        
        // Registrar movimiento de inventario
        await data.recordInventoryMovement({
            productoId: loteData.productoId,
            productoNombre: loteData.productoNombre || 'Producto',
            loteId: loteData.loteId || loteIdTexto,
            cantidad: Math.abs(diferencia),
            tipo: diferencia > 0 ? 'entrada' : 'salida',
            subtipo: 'ajuste_lote',
            usuario: window.currentUser?.email || 'sistema',
            observaciones: `Ajuste manual de lote ${loteIdTexto}. Stock anterior: ${stockAnterior}, nuevo: ${nuevoStock}`,
            costoUnitario: loteData.costoUnitario || 0
        });
        
        alert('Stock del lote ajustado correctamente');
        
        // Refrescar vista si estamos en el modal de lotes
        const modalLotes = document.getElementById('modal-lotes-producto');
        if (modalLotes) {
            // Re-cargar el modal de lotes
            window.cerrarModalLotesProducto();
            setTimeout(() => {
                window.mostrarLotesProducto(loteData.productoId);
            }, 100);
        }
        
        // Refrescar vista principal
        displayProducts();
        
    } catch (error) {
        console.error('Error ajustando stock de lote:', error);
        alert('Error al ajustar el stock del lote');
    }
}
