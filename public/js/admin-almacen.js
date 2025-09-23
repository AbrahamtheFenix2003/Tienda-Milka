// admin-almacen.js - Funciones para la sección Almacén
console.log('Cargando admin-almacen.js...');

window.loadAlmacen = function() {
    console.log('Ejecutando loadAlmacen...');
    
    // Verificar permisos
    if (!window.currentUser || !window.isAdmin(window.currentUser.email)) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para gestionar el almacén</p>
            </div>
        `;
        return;
    }

    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Gestión de Almacén 📦</h2>
                <div class="flex space-x-3">
                    <button id="exportar-pdf-btn" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                        <i class="fas fa-file-pdf mr-2"></i>Exportar PDF
                    </button>
                    <button id="config-stock-btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        <i class="fas fa-cog mr-2"></i>Configurar Stock
                    </button>
                    <button id="movimientos-btn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                        <i class="fas fa-exchange-alt mr-2"></i>Movimientos
                    </button>
                </div>
            </div>

            <!-- Resumen de Inventario General -->
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
                                <p class="text-sm font-medium text-gray-600">Total de Productos Únicos</p>
                                <p class="text-3xl font-bold text-blue-600" id="total-productos-unicos">0</p>
                                <p class="text-xs text-gray-500">Diferentes productos registrados</p>
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
                
                <!-- Lista Rápida de Productos con Stock -->
                <div id="resumen-productos-stock" class="hidden">
                    <h4 class="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                        <i class="fas fa-list mr-2"></i>Productos y Sus Stocks
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="lista-resumen-productos">
                        <!-- Se llenará dinámicamente -->
                    </div>
                </div>
            </div>

            <!-- Resumen del Almacén (Métricas) -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                            <i class="fas fa-boxes text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Total Productos</p>
                            <p class="text-2xl font-semibold text-gray-900" id="total-productos-almacen">0</p>
                        </div>
                    </div>
                </div>
                
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
                        <div class="p-3 rounded-full bg-yellow-100 text-yellow-500">
                            <i class="fas fa-exclamation-triangle text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Stock Bajo</p>
                            <p class="text-2xl font-semibold text-gray-900" id="productos-stock-bajo">0</p>
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
                        <input type="text" id="filtro-nombre-almacen" placeholder="Buscar producto..." 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-categoria-almacen" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="todas">Todas las categorías</option>
                        </select>
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-estado-stock" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="todos">Todos</option>
                            <option value="sin-stock">Sin stock</option>
                            <option value="stock-bajo">Stock bajo</option>
                            <option value="stock-ok">Stock normal</option>
                            <option value="stock-alto">Stock alto</option>
                        </select>
                    </div>

                    <div class="flex-shrink-0">
                        <button id="btn-alertas" class="bg-yellow-500 text-white px-3 py-2 rounded-md hover:bg-yellow-600">
                            <i class="fas fa-bell mr-1"></i>Alertas
                        </button>
                    </div>
                </div>
            </div>

            <!-- Lista de Productos en Almacén -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Máximo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="productos-almacen-tbody" class="bg-white divide-y divide-gray-200">
                            <!-- Los productos se cargarán aquí dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal para Configurar Stock -->
        <div id="modal-config-stock" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Configurar Stock</h3>
                    <button id="close-config-stock" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="form-config-stock">
                    <input type="hidden" id="config-product-id">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                        <p id="config-product-name" class="text-gray-900 font-medium"></p>
                    </div>
                    <div class="mb-4">
                        <label for="config-stock-minimo" class="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                        <input type="number" id="config-stock-minimo" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" required>
                    </div>
                    <div class="mb-4">
                        <label for="config-stock-maximo" class="block text-sm font-medium text-gray-700 mb-1">Stock Máximo</label>
                        <input type="number" id="config-stock-maximo" min="0" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" required>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-config-stock" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" class="px-4 py-2 text-white bg-rose-500 rounded-md hover:bg-rose-600">Guardar</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal para Movimientos -->
        <div id="modal-movimientos" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Historial de Movimientos</h3>
                    <button id="close-movimientos" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock Anterior</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock Nuevo</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Observación</th>
                            </tr>
                        </thead>
                        <tbody id="movimientos-tbody" class="bg-white divide-y divide-gray-200">
                            <!-- Los movimientos se cargarán aquí -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal para Alertas -->
        <div id="modal-alertas" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-yellow-600">
                        <i class="fas fa-bell mr-2"></i>Alertas de Stock
                    </h3>
                    <button id="close-alertas" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="alertas-content" class="space-y-3">
                    <!-- Las alertas se cargarán aquí -->
                </div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = content;
    
    // Asegurar que todos los modales estén cerrados al cargar
    setTimeout(() => {
        // Cerrar todos los modales existentes
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Configurar eventos después de cerrar modales
        setupAlmacenEvents();
        
        // Cargar datos
        loadAlmacenData();
    }, 200);
};

function setupAlmacenEvents() {
    // Eventos para filtros
    document.getElementById('filtro-nombre-almacen').addEventListener('input', filtrarProductosAlmacen);
    document.getElementById('filtro-categoria-almacen').addEventListener('change', filtrarProductosAlmacen);
    document.getElementById('filtro-estado-stock').addEventListener('change', filtrarProductosAlmacen);

    // Evento para toggle del resumen detallado
    document.getElementById('toggle-resumen-detail').addEventListener('click', toggleResumenDetail);

    // Eventos para modales
    document.getElementById('config-stock-btn').addEventListener('click', () => {
        // Si no hay productos seleccionados, mostrar mensaje
        showMessage('Selecciona un producto de la tabla para configurar su stock', 'warning');
    });

    document.getElementById('exportar-pdf-btn').addEventListener('click', exportarAlmacenPDF);
    document.getElementById('movimientos-btn').addEventListener('click', showMovimientosModal);
    document.getElementById('btn-alertas').addEventListener('click', showAlertasModal);

    // Función auxiliar para cerrar modales
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Eventos para cerrar modales - con verificación de existencia
    const closeButtons = [
        { id: 'close-config-stock', modal: 'modal-config-stock' },
        { id: 'cancel-config-stock', modal: 'modal-config-stock' },
        { id: 'close-movimientos', modal: 'modal-movimientos' },
        { id: 'close-alertas', modal: 'modal-alertas' }
    ];

    closeButtons.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) {
            element.addEventListener('click', () => closeModal(btn.modal));
        }
    });

    // Cerrar modales al hacer clic fuera de ellos
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Evento para el formulario de configuración de stock
    const formConfigStock = document.getElementById('form-config-stock');
    if (formConfigStock) {
        formConfigStock.addEventListener('submit', saveStockConfig);
    }
}

async function loadAlmacenData() {
    try {
        // Cargar productos desde la caché existente
        if (!window.productsCache || window.productsCache.length === 0) {
            await window.loadProducts();
        }

        // Cargar categorías para el filtro
        loadCategoriasAlmacen();

        // Renderizar productos en la tabla
        renderProductosAlmacen();

        // Actualizar resumen
        updateAlmacenSummary();

    } catch (error) {
        console.error('Error cargando datos del almacén:', error);
        showMessage('Error cargando datos del almacén', 'error');
    }
}

function loadCategoriasAlmacen() {
    const categoriaSelect = document.getElementById('filtro-categoria-almacen');
    categoriaSelect.innerHTML = '<option value="todas">Todas las categorías</option>';
    
    if (window.categoriesCache && window.categoriesCache.length > 0) {
        window.categoriesCache.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name; // Usar el nombre en lugar del ID
            option.textContent = category.name;
            categoriaSelect.appendChild(option);
        });
    }
    
    // También agregar categorías de productos que no estén en categoriesCache
    if (window.productsCache && window.productsCache.length > 0) {
        const categoriasEncontradas = new Set();
        
        window.productsCache.forEach(product => {
            let categoriaTexto = '';
            if (product.category) {
                categoriaTexto = product.category;
            } else if (product.categoria) {
                categoriaTexto = product.categoria;
            } else if (product.categoryName) {
                categoriaTexto = product.categoryName;
            }
            
            if (categoriaTexto && !categoriasEncontradas.has(categoriaTexto)) {
                categoriasEncontradas.add(categoriaTexto);
                
                // Verificar si ya existe en el select
                const exists = Array.from(categoriaSelect.options).some(opt => opt.value === categoriaTexto);
                if (!exists) {
                    const option = document.createElement('option');
                    option.value = categoriaTexto;
                    option.textContent = categoriaTexto;
                    categoriaSelect.appendChild(option);
                }
            }
        });
    }
}

function renderProductosAlmacen(productos = null) {
    const tbody = document.getElementById('productos-almacen-tbody');
    const productosAMostrar = productos || window.productsCache || [];

    if (productosAMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    No hay productos en el almacén
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productosAMostrar.map(product => {
        const stockActual = product.stock || 0;
        const stockMinimo = product.stockMinimo || 5;
        const stockMaximo = product.stockMaximo || 100;
        
        // Determinar estado del stock
        let estadoStock = '';
        let estadoClase = '';
        if (stockActual === 0) {
            estadoStock = 'Sin Stock';
            estadoClase = 'bg-red-100 text-red-800';
        } else if (stockActual <= stockMinimo) {
            estadoStock = 'Stock Bajo';
            estadoClase = 'bg-yellow-100 text-yellow-800';
        } else if (stockActual >= stockMaximo) {
            estadoStock = 'Stock Alto';
            estadoClase = 'bg-blue-100 text-blue-800';
        } else {
            estadoStock = 'Normal';
            estadoClase = 'bg-green-100 text-green-800';
        }

        const categoria = window.categoriesCache ? 
            window.categoriesCache.find(cat => cat.id === product.categoryId) : null;

        // DEBUG: Agregar logs para diagnosticar el problema de categorías
        if (productosAMostrar.length > 0 && productosAMostrar.indexOf(product) === 0) {
            console.log('🔍 DEBUG - Estructura del primer producto:', product);
            console.log('🔍 DEBUG - CategoriesCache:', window.categoriesCache);
            console.log('🔍 DEBUG - Buscando categoría con ID:', product.categoryId);
            console.log('🔍 DEBUG - Categoría encontrada:', categoria);
        }

        // FALLBACK: Intentar con otros posibles campos de categoría
        let categoriaTexto = 'Sin categoría';
        if (categoria) {
            categoriaTexto = categoria.name;
        } else if (product.category) {
            categoriaTexto = product.category;
        } else if (product.categoria) {
            categoriaTexto = product.categoria;
        } else if (product.categoryName) {
            categoriaTexto = product.categoryName;
        }

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        ${product.imageUrl ? 
                            `<img src="${product.imageUrl}" alt="${product.name}" class="w-10 h-10 rounded-full mr-3 object-cover">` :
                            `<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <i class="fas fa-box text-gray-400"></i>
                            </div>`
                        }
                        <div>
                            <div class="text-sm font-medium text-gray-900">${product.name}</div>
                            <div class="text-sm text-gray-500">${product.id}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${categoriaTexto}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${stockActual === 0 ? 'text-red-600' : stockActual <= stockMinimo ? 'text-yellow-600' : 'text-gray-900'}">
                    ${stockActual}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${stockMinimo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${stockMaximo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${estadoClase}">
                        ${estadoStock}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    S/ ${(product.price || 0).toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="openConfigStock('${product.id}')" class="text-blue-600 hover:text-blue-900" title="Configurar Stock">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button onclick="viewProductHistory('${product.id}')" class="text-green-600 hover:text-green-900" title="Ver Historial">
                        <i class="fas fa-history"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateAlmacenSummary(productosACalcular = null) {
    const productos = productosACalcular || window.productsCache || [];
    const totalProductos = productos.length;
    let productosConStock = 0;
    let productosStockBajo = 0;
    let productosSinStock = 0;
    let totalStockDisponible = 0;
    let valorTotalInventario = 0;

    productos.forEach(product => {
        const stock = product.stock || 0;
        const stockMinimo = product.stockMinimo || 5;
        const precio = product.price || 0;

        // Sumar al stock total disponible
        totalStockDisponible += stock;
        
        // Calcular valor total del inventario
        valorTotalInventario += stock * precio;

        if (stock === 0) {
            productosSinStock++;
        } else if (stock <= stockMinimo) {
            productosStockBajo++;
            productosConStock++;
        } else {
            productosConStock++;
        }
    });

    // Actualizar elementos del DOM - Resumen General
    document.getElementById('total-productos-unicos').textContent = totalProductos;
    document.getElementById('total-stock-disponible').textContent = totalStockDisponible.toLocaleString();
    document.getElementById('valor-total-inventario').textContent = `S/ ${valorTotalInventario.toFixed(2)}`;

    // Actualizar elementos del DOM - Métricas (que se actualizan con el filtro)
    document.getElementById('total-productos-almacen').textContent = totalProductos;
    document.getElementById('productos-con-stock').textContent = productosConStock;
    document.getElementById('productos-stock-bajo').textContent = productosStockBajo;
    document.getElementById('productos-sin-stock').textContent = productosSinStock;

    // Actualizar la lista resumida de productos
    updateListaResumenProductos();
}

function updateListaResumenProductos() {
    const productos = window.productsCache || [];
    const listaContainer = document.getElementById('lista-resumen-productos');
    
    if (!listaContainer) return;

    // Filtrar solo productos con stock y ordenar por stock descendente
    const productosConStock = productos
        .filter(product => (product.stock || 0) > 0)
        .sort((a, b) => (b.stock || 0) - (a.stock || 0));

    if (productosConStock.length === 0) {
        listaContainer.innerHTML = `
            <div class="col-span-full text-center py-4 text-gray-500">
                <i class="fas fa-inbox text-2xl mb-2"></i>
                <p>No hay productos con stock disponible</p>
            </div>
        `;
        return;
    }

    listaContainer.innerHTML = productosConStock.map(product => {
        const stock = product.stock || 0;
        const stockMinimo = product.stockMinimo || 5;
        const precio = product.price || 0;
        const valorTotal = stock * precio;
        
        // Determinar color del indicador de stock
        let stockIndicatorClass = '';
        if (stock <= stockMinimo) {
            stockIndicatorClass = 'bg-yellow-100 border-yellow-300 text-yellow-800';
        } else if (stock > stockMinimo * 3) {
            stockIndicatorClass = 'bg-green-100 border-green-300 text-green-800';
        } else {
            stockIndicatorClass = 'bg-blue-100 border-blue-300 text-blue-800';
        }

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-2">
                    <h5 class="font-medium text-gray-900 text-sm truncate" title="${product.name}">
                        ${product.name.length > 25 ? product.name.substring(0, 25) + '...' : product.name}
                    </h5>
                    ${stock <= stockMinimo ? 
                        '<i class="fas fa-exclamation-triangle text-yellow-500 text-xs" title="Stock bajo"></i>' : 
                        '<i class="fas fa-check-circle text-green-500 text-xs" title="Stock normal"></i>'
                    }
                </div>
                
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-600">Stock:</span>
                        <span class="px-2 py-1 rounded text-xs font-medium border ${stockIndicatorClass}">
                            ${stock} unidades
                        </span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-xs text-gray-600">Precio:</span>
                        <span class="text-xs font-medium text-gray-900">S/ ${precio.toFixed(2)}</span>
                    </div>
                    
                    <div class="flex justify-between items-center border-t pt-2">
                        <span class="text-xs text-gray-600">Valor total:</span>
                        <span class="text-xs font-bold text-purple-600">S/ ${valorTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleResumenDetail() {
    const resumenDetail = document.getElementById('resumen-productos-stock');
    const toggleBtn = document.getElementById('toggle-resumen-detail');
    
    if (resumenDetail.classList.contains('hidden')) {
        resumenDetail.classList.remove('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-compress-arrows-alt mr-1"></i>Ocultar detalles';
    } else {
        resumenDetail.classList.add('hidden');
        toggleBtn.innerHTML = '<i class="fas fa-expand-arrows-alt mr-1"></i>Ver detalles';
    }
}

function filtrarProductosAlmacen() {
    const nombreFiltro = document.getElementById('filtro-nombre-almacen').value.toLowerCase();
    const categoriaFiltro = document.getElementById('filtro-categoria-almacen').value;
    const estadoFiltro = document.getElementById('filtro-estado-stock').value;

    let productosFiltrados = window.productsCache || [];

    // Verificar si hay algún filtro activo
    const hayFiltroActivo = nombreFiltro || (categoriaFiltro !== 'todas') || (estadoFiltro !== 'todos');

    // Filtrar por nombre
    if (nombreFiltro) {
        productosFiltrados = productosFiltrados.filter(product => 
            product.name.toLowerCase().includes(nombreFiltro)
        );
    }

    // Filtrar por categoría
    if (categoriaFiltro !== 'todas') {
        productosFiltrados = productosFiltrados.filter(product => {
            // Obtener el texto de categoría usando la misma lógica del renderizado
            const categoria = window.categoriesCache ? 
                window.categoriesCache.find(cat => cat.id === product.categoryId) : null;
            
            let categoriaTexto = '';
            if (categoria) {
                categoriaTexto = categoria.name;
            } else if (product.category) {
                categoriaTexto = product.category;
            } else if (product.categoria) {
                categoriaTexto = product.categoria;
            } else if (product.categoryName) {
                categoriaTexto = product.categoryName;
            }
            
            // Comparar el texto de categoría con el filtro seleccionado
            return categoriaTexto.toLowerCase() === categoriaFiltro.toLowerCase();
        });
    }

    // Filtrar por estado de stock
    if (estadoFiltro !== 'todos') {
        productosFiltrados = productosFiltrados.filter(product => {
            const stock = product.stock || 0;
            const stockMinimo = product.stockMinimo || 5;
            const stockMaximo = product.stockMaximo || 100;

            switch (estadoFiltro) {
                case 'sin-stock':
                    return stock === 0;
                case 'stock-bajo':
                    return stock > 0 && stock <= stockMinimo;
                case 'stock-ok':
                    return stock > stockMinimo && stock < stockMaximo;
                case 'stock-alto':
                    return stock >= stockMaximo;
                default:
                    return true;
            }
        });
    }

    // Actualizar estadísticas con productos filtrados o todos los productos si no hay filtro
    if (hayFiltroActivo) {
        updateAlmacenSummary(productosFiltrados);
    } else {
        updateAlmacenSummary(); // Sin parámetros, usa todos los productos
    }
    
    renderProductosAlmacen(productosFiltrados);
}

window.openConfigStock = function(productId) {
    const product = window.productsCache.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('config-product-id').value = productId;
    document.getElementById('config-product-name').textContent = product.name;
    document.getElementById('config-stock-minimo').value = product.stockMinimo || 5;
    document.getElementById('config-stock-maximo').value = product.stockMaximo || 100;

    document.getElementById('modal-config-stock').classList.add('active');
};

async function saveStockConfig(e) {
    e.preventDefault();
    
    const productId = document.getElementById('config-product-id').value;
    const stockMinimo = parseInt(document.getElementById('config-stock-minimo').value);
    const stockMaximo = parseInt(document.getElementById('config-stock-maximo').value);

    if (stockMinimo >= stockMaximo) {
        showMessage('El stock mínimo debe ser menor al stock máximo', 'error');
        return;
    }

    try {
        // Actualizar en Firebase
        await window.db.collection('products').doc(productId).update({
            stockMinimo: stockMinimo,
            stockMaximo: stockMaximo
        });

        // Actualizar en caché local
        const productIndex = window.productsCache.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            window.productsCache[productIndex].stockMinimo = stockMinimo;
            window.productsCache[productIndex].stockMaximo = stockMaximo;
        }

        // Cerrar modal y actualizar vista
        document.getElementById('modal-config-stock').classList.remove('active');
        renderProductosAlmacen();
        updateAlmacenSummary();

        showMessage('Configuración de stock actualizada correctamente', 'success');

    } catch (error) {
        console.error('Error actualizando configuración de stock:', error);
        showMessage('Error actualizando configuración de stock', 'error');
    }
}

async function showMovimientosModal() {
    try {
        const movimientosSnapshot = await window.db.collection('movimientos_inventario')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        const movimientos = [];
        movimientosSnapshot.forEach(doc => {
            movimientos.push({ id: doc.id, ...doc.data() });
        });

        const tbody = document.getElementById('movimientos-tbody');
        
        if (movimientos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-3 text-center text-gray-500">
                        No hay movimientos registrados
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = movimientos.map(mov => {
                const fecha = mov.timestamp ? 
                    new Date(mov.timestamp.toDate()).toLocaleString('es-ES') : 
                    'Sin fecha';
                
                const product = window.productsCache.find(p => p.id === mov.productId);
                const productName = product ? product.name : mov.productId;

                const tipoClase = mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';

                return `
                    <tr>
                        <td class="px-4 py-2 text-sm text-gray-900">${fecha}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${productName}</td>
                        <td class="px-4 py-2 text-sm ${tipoClase} font-medium">
                            ${mov.tipo === 'entrada' ? '+ Entrada' : '- Salida'}
                        </td>
                        <td class="px-4 py-2 text-sm text-gray-900">${mov.cantidad}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${mov.stockAnterior}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${mov.stockNuevo}</td>
                        <td class="px-4 py-2 text-sm text-gray-500">${mov.observacion || '-'}</td>
                    </tr>
                `;
            }).join('');
        }

        document.getElementById('modal-movimientos').classList.add('active');

    } catch (error) {
        console.error('Error cargando movimientos:', error);
        showMessage('Error cargando historial de movimientos', 'error');
    }
}

function showAlertasModal() {
    const productos = window.productsCache || [];
    const alertas = [];

    productos.forEach(product => {
        const stock = product.stock || 0;
        const stockMinimo = product.stockMinimo || 5;

        if (stock === 0) {
            alertas.push({
                tipo: 'sin-stock',
                producto: product.name,
                mensaje: 'Producto sin stock',
                nivel: 'error'
            });
        } else if (stock <= stockMinimo) {
            alertas.push({
                tipo: 'stock-bajo',
                producto: product.name,
                mensaje: `Stock bajo: ${stock} unidades (mínimo: ${stockMinimo})`,
                nivel: 'warning'
            });
        }
    });

    const alertasContent = document.getElementById('alertas-content');
    
    if (alertas.length === 0) {
        alertasContent.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i>
                <p class="text-gray-600">No hay alertas de stock</p>
            </div>
        `;
    } else {
        alertasContent.innerHTML = alertas.map(alerta => {
            const colorClase = alerta.nivel === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50';
            const iconoClase = alerta.nivel === 'error' ? 'text-red-500 fa-times-circle' : 'text-yellow-500 fa-exclamation-triangle';

            return `
                <div class="border ${colorClase} rounded-lg p-3">
                    <div class="flex items-center">
                        <i class="fas ${iconoClase} mr-3"></i>
                        <div>
                            <p class="font-medium text-gray-900">${alerta.producto}</p>
                            <p class="text-sm text-gray-600">${alerta.mensaje}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    document.getElementById('modal-alertas').classList.add('active');
}

window.viewProductHistory = function(productId) {
    // Esta función podría mostrar un modal específico con el historial de un producto
    showMessage('Función de historial específico por producto en desarrollo', 'info');
};

// Función para exportar almacén a PDF
async function exportarAlmacenPDF() {
    try {
        // Mostrar mensaje de generación
        showMessage('Generando PDF del almacén...', 'info');

        // Verificar que jsPDF esté disponible
        let PDFConstructor;
        if (window.jsPDF && window.jsPDF.jsPDF) {
            PDFConstructor = window.jsPDF.jsPDF;
        } else if (window.jsPDF) {
            PDFConstructor = window.jsPDF;
        } else if (typeof jsPDF !== 'undefined') {
            PDFConstructor = jsPDF;
        } else {
            showMessage('Error: Biblioteca PDF no disponible. Recarga la página.', 'error');
            return;
        }

        // Crear instancia de jsPDF
        const doc = new PDFConstructor();

        // Configuración del documento
        const fecha = new Date().toLocaleString('es-ES');
        const productos = window.productsCache || [];

        // Header del documento
        doc.setFontSize(20);
        doc.text('Reporte de Inventario - Tienda Milka', 20, 20);
        
        doc.setFontSize(12);
        doc.text(`Generado el: ${fecha}`, 20, 30);
        doc.text(`Total de productos: ${productos.length}`, 20, 40);

        // Calcular totales para el resumen
        let totalStock = 0;
        let valorTotal = 0;
        let productosConStock = 0;
        let productosSinStock = 0;
        let productosStockBajo = 0;

        productos.forEach(product => {
            const stock = product.stock || 0;
            const precio = product.price || 0;
            const stockMinimo = product.stockMinimo || 5;
            
            totalStock += stock;
            valorTotal += stock * precio;
            
            if (stock === 0) {
                productosSinStock++;
            } else if (stock <= stockMinimo) {
                productosStockBajo++;
                productosConStock++;
            } else {
                productosConStock++;
            }
        });

        // Resumen ejecutivo
        doc.setFontSize(14);
        doc.text('Resumen Ejecutivo:', 20, 55);
        doc.setFontSize(10);
        doc.text(`• Stock total disponible: ${totalStock.toLocaleString()} unidades`, 25, 65);
        doc.text(`• Valor total del inventario: S/ ${valorTotal.toFixed(2)}`, 25, 72);
        doc.text(`• Productos con stock: ${productosConStock}`, 25, 79);
        doc.text(`• Productos sin stock: ${productosSinStock}`, 25, 86);
        doc.text(`• Productos con stock bajo: ${productosStockBajo}`, 25, 93);

        // Línea separadora
        doc.line(20, 100, 190, 100);

        // Header de la tabla
        let yPos = 115;
        doc.setFontSize(14);
        doc.text('Detalle de Productos:', 20, yPos);
        
        yPos += 10;
        doc.setFontSize(8);
        
        // Headers de tabla
        doc.text('Producto', 20, yPos);
        doc.text('Categoría', 70, yPos);
        doc.text('Stock', 110, yPos);
        doc.text('Precio', 130, yPos);
        doc.text('Valor Total', 150, yPos);
        doc.text('Estado', 175, yPos);
        
        yPos += 5;
        doc.line(20, yPos, 190, yPos); // Línea bajo headers
        yPos += 5;

        // Ordenar productos por stock descendente para mostrar primero los que tienen más stock
        const productosOrdenados = [...productos].sort((a, b) => (b.stock || 0) - (a.stock || 0));

        // Datos de productos
        for (let i = 0; i < productosOrdenados.length; i++) {
            const product = productosOrdenados[i];
            const stock = product.stock || 0;
            const precio = product.price || 0;
            const stockMinimo = product.stockMinimo || 5;
            const valorProducto = stock * precio;
            
            // Determinar estado
            let estado = '';
            if (stock === 0) {
                estado = 'Sin Stock';
            } else if (stock <= stockMinimo) {
                estado = 'Stock Bajo';
            } else {
                estado = 'Normal';
            }

            // Obtener categoría
            const categoria = window.categoriesCache ? 
                window.categoriesCache.find(cat => cat.id === product.categoryId) : null;
            const categoriaNombre = categoria ? categoria.name : 'Sin categoría';

            // Ajustar texto largo del producto
            let nombreProducto = product.name;
            if (nombreProducto.length > 25) {
                nombreProducto = nombreProducto.substring(0, 22) + '...';
            }

            // Ajustar texto largo de categoría
            let nombreCategoria = categoriaNombre;
            if (nombreCategoria.length > 15) {
                nombreCategoria = nombreCategoria.substring(0, 12) + '...';
            }

            // Escribir fila
            doc.text(nombreProducto, 20, yPos);
            doc.text(nombreCategoria, 70, yPos);
            doc.text(stock.toString(), 110, yPos);
            doc.text(`S/ ${precio.toFixed(2)}`, 130, yPos);
            doc.text(`S/ ${valorProducto.toFixed(2)}`, 150, yPos);
            doc.text(estado, 175, yPos);

            yPos += 8;

            // Verificar si necesitamos una nueva página
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
                
                // Re-escribir headers en nueva página
                doc.setFontSize(8);
                doc.text('Producto', 20, yPos);
                doc.text('Categoría', 70, yPos);
                doc.text('Stock', 110, yPos);
                doc.text('Precio', 130, yPos);
                doc.text('Valor Total', 150, yPos);
                doc.text('Estado', 175, yPos);
                
                yPos += 5;
                doc.line(20, yPos, 190, yPos);
                yPos += 5;
            }
        }

        // Pie de página en la última página
        const pageCount = doc.internal.getNumberOfPages();
        doc.setPage(pageCount);
        doc.setFontSize(8);
        doc.text(`Página ${pageCount} - Tienda Milka © ${new Date().getFullYear()}`, 20, 290);

        // Guardar el PDF
        const fileName = `inventario_tienda_milka_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);

        showMessage('PDF exportado correctamente', 'success');

    } catch (error) {
        console.error('Error exportando PDF:', error);
        showMessage('Error al exportar PDF del almacén', 'error');
    }
}

// Función auxiliar para mostrar mensajes
function showMessage(message, type = 'info') {
    const alertClasses = {
        'success': 'bg-green-100 border-green-400 text-green-700',
        'error': 'bg-red-100 border-red-400 text-red-700',
        'warning': 'bg-yellow-100 border-yellow-400 text-yellow-700',
        'info': 'bg-blue-100 border-blue-400 text-blue-700'
    };

    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-times-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };

    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 ${alertClasses[type]} border px-4 py-3 rounded shadow-lg max-w-md`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icons[type]} mr-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(alertDiv);

    // Remover el mensaje después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

console.log('admin-almacen.js cargado correctamente');
