// admin-productos.js - Funciones para la sección Productos
console.log('Cargando admin-productos.js...');

window.loadProductos = function() {
    console.log('Ejecutando loadProductos...');
    
    // Verificar permisos
    if (!window.currentUser || !window.hasAccessToSales(window.currentUser.email)) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para gestionar productos</p>
            </div>
        `;
        return;
    }

    const isVendedor = window.isVendedor && window.isVendedor(window.currentUser.email);
    
    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                ${!isVendedor ? `
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
    if (!isVendedor) {
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', showAddProductModal);
        }
    }
};

function displayProducts(productos = null) {
    const productsList = document.getElementById('products-list');
    const productsToShow = productos || window.productsCache || [];
    
    // Actualizar contador
    actualizarContadorProductos(productsToShow.length, window.productsCache ? window.productsCache.length : 0);
    
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
        // Determinar clase de stock
        const stock = parseInt(product.stock) || 0;
        let stockClass = 'bg-green-100 text-green-800';
        if (stock === 0) {
            stockClass = 'bg-red-100 text-red-800';
        } else if (stock <= 5) {
            stockClass = 'bg-yellow-100 text-yellow-800';
        }

        const isVendedor = window.isVendedor && window.isVendedor(window.currentUser.email);
        
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
                            ${!isVendedor ? `
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
                            <span class="${stockClass} px-2 py-1 rounded text-sm font-medium">
                                Stock: ${stock}
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
    }).join('');

    productsList.innerHTML = productsHTML;
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
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock (Unidades) *</label>
                            <input type="number" id="product-stock" required min="0"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
                            <input type="text" id="product-sku"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
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
                
                <form id="product-form" class="space-y-6">
                    <input type="hidden" id="product-id" value="${id}">
                    
                    <!-- Información básica -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del Producto *</label>
                            <input type="text" id="product-name" required value="${producto.name || producto.nombre || ''}"
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
                            <input type="number" id="product-price" required step="0.01" min="0" value="${producto.price || producto.precio || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Precio Original (S/)</label>
                            <input type="number" id="product-original-price" step="0.01" min="0" value="${producto.originalPrice || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Costo de Adquisición (S/)</label>
                            <input type="number" id="product-cost" step="0.01" min="0" value="${producto.acquisitionCost || producto.cost || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Stock (Unidades) *</label>
                            <input type="number" id="product-stock" required min="0" value="${producto.stock || 0}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Código (SKU)</label>
                            <input type="text" id="product-sku" value="${producto.sku || ''}"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
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
    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);
}

function eliminarProducto(id, nombre) {
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
        
        // Eliminar de Firebase
        window.db.collection('products').doc(id).delete()
            .then(() => {
                console.log('Producto eliminado correctamente');
                
                // Actualizar cache local
                window.productsCache = window.productsCache.filter(p => p.id !== id);
                
                // Recargar la vista
                displayProducts();
                
                // Remover modal de carga
                const loadingModalEl = document.getElementById('loading-modal');
                if (loadingModalEl) {
                    loadingModalEl.remove();
                }
                
                // Mostrar mensaje de éxito
                showSuccessMessage('Producto eliminado correctamente');
            })
            .catch((error) => {
                console.error('Error eliminando producto:', error);
                
                // Remover modal de carga
                const loadingModalEl = document.getElementById('loading-modal');
                if (loadingModalEl) {
                    loadingModalEl.remove();
                }
                
                // Mostrar error
                showErrorMessage('Error al eliminar el producto: ' + error.message);
            });
    }
}

console.log('admin-productos.js cargado completamente');

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
        // Cargar categorías desde Firebase
        const snapshot = await window.db.collection('categories').get();
        const categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
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
        // Verificar si ya existe
        const snapshot = await window.db.collection('categories')
            .where('name', '==', categoryName).get();
        
        if (!snapshot.empty) {
            alert('Esta categoría ya existe');
            return;
        }
        
        // Agregar nueva categoría
        await window.db.collection('categories').add({
            name: categoryName,
            createdAt: window.serverTimestamp()
        });
        
        input.value = '';
        loadCategoriesInModal();
        showSuccessMessage('Categoría agregada correctamente');
        
    } catch (error) {
        console.error('Error agregando categoría:', error);
        showErrorMessage('Error al agregar la categoría: ' + error.message);
    }
}

async function deleteCategory(id, name) {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${name}"?`)) {
        return;
    }
    
    try {
        await window.db.collection('categories').doc(id).delete();
        loadCategoriesInModal();
        showSuccessMessage('Categoría eliminada correctamente');
        
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        showErrorMessage('Error al eliminar la categoría: ' + error.message);
    }
}

function editCategory(id, currentName) {
    const newName = prompt('Ingresa el nuevo nombre para la categoría:', currentName);
    
    if (!newName || newName.trim() === '') {
        return;
    }
    
    const trimmedName = newName.trim();
    
    if (trimmedName === currentName) {
        return; // No hay cambios
    }
    
    // Validar que no exista otra categoría con ese nombre
    window.db.collection('categories').where('name', '==', trimmedName).get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                // Verificar si es una categoría diferente (no la misma que estamos editando)
                const existingCategory = querySnapshot.docs[0];
                if (existingCategory.id !== id) {
                    showErrorMessage('Ya existe una categoría con ese nombre');
                    return;
                }
            }
            
            // Actualizar la categoría
            return window.db.collection('categories').doc(id).update({
                name: trimmedName,
                updatedAt: window.serverTimestamp()
            });
        })
        .then(() => {
            // Actualizar todos los productos que usen esta categoría
            const batch = window.db.batch();
            
            return window.db.collection('products').where('category', '==', currentName).get()
                .then((querySnapshot) => {
                    querySnapshot.forEach((doc) => {
                        const productRef = window.db.collection('products').doc(doc.id);
                        batch.update(productRef, { category: trimmedName });
                    });
                    
                    return batch.commit();
                })
                .then(() => {
                    console.log(`Categoría actualizada en ${querySnapshot.size} productos`);
                    
                    // Actualizar cache local de productos
                    if (window.productsCache) {
                        window.productsCache.forEach(product => {
                            if (product.category === currentName || product.categoria === currentName) {
                                product.category = trimmedName;
                                product.categoria = trimmedName;
                            }
                        });
                    }
                    
                    // Actualizar cache local de categorías
                    if (window.categoriesCache) {
                        const categoryIndex = window.categoriesCache.findIndex(cat => cat.id === id);
                        if (categoryIndex !== -1) {
                            window.categoriesCache[categoryIndex].name = trimmedName;
                        }
                    }
                    
                    // Recargar la lista de categorías en el modal
                    loadCategoriesInModal();
                    
                    // Recargar el selector de categorías en el formulario principal
                    cargarCategoriasParaModal();
                    
                    // Mantener la categoría seleccionada en el formulario principal si era la editada
                    const categorySelect = document.getElementById('product-category');
                    if (categorySelect && categorySelect.value === currentName) {
                        // Pequeño delay para asegurar que las opciones se hayan actualizado
                        setTimeout(() => {
                            categorySelect.value = trimmedName;
                        }, 100);
                    }
                    
                    showSuccessMessage(`Categoría actualizada correctamente`);
                });
        })
        .catch((error) => {
            console.error('Error editando categoría:', error);
            showErrorMessage('Error al editar la categoría: ' + error.message);
        });
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
    if (window.tinymce) {
        window.tinymce.init({
            selector: '#description-editor',
            height: 200,
            plugins: 'advlist autolink lists link image charmap print preview anchor',
            toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
            content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }',
            language: 'es'
        });
    }
}

async function cargarCategoriasParaModal(categoriaSeleccionada = '') {
    const selectCategoria = document.getElementById('product-category');
    if (!selectCategoria) return;
    
    try {
        // Cargar categorías desde Firebase
        const snapshot = await window.db.collection('categories').get();
        const categories = [];
        snapshot.forEach(doc => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        
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
    const isEdit = document.getElementById('product-id') && document.getElementById('product-id').value;
    
    // Deshabilitar botón y mostrar loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${isEdit ? 'Actualizando...' : 'Guardando...'}`;
    
    try {
        // Obtener descripción del editor TinyMCE
        let description = '';
        if (window.tinymce && window.tinymce.get('description-editor')) {
            description = window.tinymce.get('description-editor').getContent();
        }
        
        // Recopilar datos del formulario
        const formData = {
            name: document.getElementById('product-name').value.trim(),
            price: parseFloat(document.getElementById('product-price').value),
            originalPrice: document.getElementById('product-original-price').value ? 
                parseFloat(document.getElementById('product-original-price').value) : null,
            acquisitionCost: document.getElementById('product-cost').value ? 
                parseFloat(document.getElementById('product-cost').value) : null,
            stock: parseInt(document.getElementById('product-stock').value),
            category: document.getElementById('product-category').value.trim(),
            sku: document.getElementById('product-sku').value.trim(),
            description: description
        };
        
        // Validaciones
        if (!formData.name) {
            throw new Error('El nombre del producto es obligatorio');
        }
        if (isNaN(formData.price) || formData.price < 0) {
            throw new Error('El precio debe ser un número válido mayor o igual a 0');
        }
        if (isNaN(formData.stock) || formData.stock < 0) {
            throw new Error('El stock debe ser un número válido mayor o igual a 0');
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
                formData[imageItem.key] = await uploadProductImage(imageItem.file, formData.name);
            }
        }
        
        // Agregar timestamp
        formData.updatedAt = window.serverTimestamp();
        
        if (isEdit) {
            // Actualizar producto existente
            const productId = document.getElementById('product-id').value;
            // Solo actualizar campos que tienen valores (no sobrescribir imágenes existentes si no se cambiaron)
            // NUNCA actualizar campos históricos: stockInicial y precioCompraInicial
            const fieldsToExclude = ['stockInicial', 'precioCompraInicial', 'createdAt'];
            const updateData = {};
            
            Object.keys(formData).forEach(key => {
                if (!fieldsToExclude.includes(key) && 
                    formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
                    updateData[key] = formData[key];
                }
            });
            
            console.log('Actualizando producto, campos excluidos:', fieldsToExclude);
            console.log('Datos a actualizar:', updateData);
            
            await window.db.collection('products').doc(productId).update(updateData);
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
            formData.createdAt = window.serverTimestamp();
            
            console.log('Guardando producto con stock inicial:', {
                stockInicial: formData.stockInicial,
                precioCompraInicial: formData.precioCompraInicial,
                stock: formData.stock,
                acquisitionCost: formData.acquisitionCost
            });
            
            const docRef = await window.db.collection('products').add(formData);
            // Agregar al cache local
            window.productsCache.push({ id: docRef.id, ...formData });
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
    const timestamp = Date.now();
    const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileName = `products/${sanitizedName}_${timestamp}.${file.name.split('.').pop()}`;
    
    const storageRef = window.storage.ref().child(fileName);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
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

// Hacer las funciones globales para que funcionen los onclick
window.showCategoryModal = showCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.previewImage = previewImage;
window.showImageModal = showImageModal;
window.closeImageModal = closeImageModal;
window.closeProductModal = closeProductModal;
