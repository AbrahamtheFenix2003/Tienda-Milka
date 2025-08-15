// admin-rentabilidad.js - Funciones para análisis de rentabilidad de productos
console.log('Cargando admin-rentabilidad.js...');

window.loadRentabilidad = function() {
    console.log('Ejecutando loadRentabilidad...');
    
    // Verificar permisos (solo admins pueden ver análisis de rentabilidad)
    const isVendedor = window.isVendedor && window.isVendedor(window.currentUser?.email);
    
    if (isVendedor) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para ver el análisis de rentabilidad</p>
            </div>
        `;
        return;
    }
    
    const content = `
        <div class="space-y-6">
            <!-- Header con resumen general -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-pie mr-2 text-green-600"></i>
                    Análisis de Rentabilidad de Productos
                </h2>
                <p class="text-gray-600 mb-4">
                    Analiza la rentabilidad de tu inventario basado en costos de adquisición y precios de venta actuales.
                </p>
                
                <!-- Resumen de totales -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white rounded-lg p-4 shadow-sm border">
                        <div class="flex items-center">
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <i class="fas fa-shopping-basket text-blue-600"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-gray-600">Inversión Total</p>
                                <p class="text-lg font-bold text-blue-600" id="total-inversion">S/ 0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg p-4 shadow-sm border">
                        <div class="flex items-center">
                            <div class="p-2 bg-green-100 rounded-lg">
                                <i class="fas fa-chart-line text-green-600"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-gray-600">Ganancia Potencial</p>
                                <p class="text-lg font-bold text-green-600" id="total-ganancia-potencial">S/ 0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg p-4 shadow-sm border">
                        <div class="flex items-center">
                            <div class="p-2 bg-purple-100 rounded-lg">
                                <i class="fas fa-percentage text-purple-600"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-gray-600">Margen Promedio</p>
                                <p class="text-lg font-bold text-purple-600" id="margen-promedio">0%</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg p-4 shadow-sm border">
                        <div class="flex items-center">
                            <div class="p-2 bg-orange-100 rounded-lg">
                                <i class="fas fa-box text-orange-600"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-gray-600">Total Productos</p>
                                <p class="text-lg font-bold text-orange-600" id="total-productos">0</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filtros y controles -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex flex-wrap gap-4 items-center mb-4">
                    <div class="flex-grow min-w-64">
                        <input type="text" id="filtro-busqueda" placeholder="Buscar producto..." 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-categoria" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="todas">Todas las categorías</option>
                        </select>
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-rentabilidad" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="todos">Todos los márgenes</option>
                            <option value="alta">Alta rentabilidad (>50%)</option>
                            <option value="media">Media rentabilidad (20-50%)</option>
                            <option value="baja">Baja rentabilidad (0-20%)</option>
                            <option value="perdida">Con pérdidas (<0%)</option>
                        </select>
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="ordenar-por" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="ganancia-desc">Mayor ganancia</option>
                            <option value="ganancia-asc">Menor ganancia</option>
                            <option value="margen-desc">Mayor margen %</option>
                            <option value="margen-asc">Menor margen %</option>
                            <option value="nombre-asc">Nombre A-Z</option>
                            <option value="stock-desc">Mayor stock</option>
                        </select>
                    </div>
                    
                    <button id="btn-exportar" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors">
                        <i class="fas fa-download mr-2"></i>Exportar
                    </button>
                </div>
                
                <!-- Contador y configuraciones -->
                <div class="flex justify-between items-center text-sm text-gray-600">
                    <span id="contador-productos-filtrados">Mostrando 0 productos</span>
                    <div class="flex items-center space-x-4">
                        <label class="flex items-center">
                            <input type="checkbox" id="solo-con-stock" class="mr-2">
                            Solo productos con stock
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="sin-stock" class="mr-2">
                            Productos sin stock
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="incluir-sin-costo" class="mr-2" checked>
                            Incluir productos sin costo definido
                        </label>
                    </div>
                </div>
            </div>
            
            <!-- Tabla de productos -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Producto
                                </th>
                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Categoría
                                </th>
                                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable('costo')">
                                    Costo Adq. <i class="fas fa-sort ml-1"></i>
                                </th>
                                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable('precio')">
                                    Precio Venta <i class="fas fa-sort ml-1"></i>
                                </th>
                                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable('ganancia')">
                                    Ganancia Unit. <i class="fas fa-sort ml-1"></i>
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable('stock')">
                                    Stock <i class="fas fa-sort ml-1"></i>
                                </th>
                                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable('ganancia-total')">
                                    Ganancia Total <i class="fas fa-sort ml-1"></i>
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onclick="sortTable('margen')">
                                    Margen % <i class="fas fa-sort ml-1"></i>
                                </th>
                                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody id="tabla-rentabilidad" class="bg-white divide-y divide-gray-200">
                            <!-- Los datos se cargarán aquí -->
                        </tbody>
                    </table>
                </div>

                <!-- Paginación simple -->
                <div class="bg-gray-50 px-4 py-3 border-t">
                    <div class="flex justify-between items-center">
                        <div class="text-sm text-gray-700">
                            Mostrando <span id="productos-mostrados">0</span> productos
                        </div>
                        <div class="flex space-x-2">
                            <button id="btn-mostrar-mas" class="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors">
                                Mostrar más
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Panel de resumen por categoría -->
                <div id="panel-resumen-categoria" class="my-6 hidden">
                    <!-- El resumen se renderiza dinámicamente aquí -->
                </div>
            </div>
        </div>
        
        <!-- Modal para editar costo -->
        <div id="modal-editar-costo" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Editar Costo de Adquisición</h3>
                    <button id="cerrar-modal-costo" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-600 mb-2">Producto: <span id="producto-nombre-modal" class="font-semibold"></span></p>
                    <p class="text-gray-600 mb-4">Precio actual de venta: S/ <span id="producto-precio-modal"></span></p>
                    
                    <label for="nuevo-costo" class="block text-sm font-medium text-gray-700 mb-2">
                        Costo de adquisición:
                    </label>
                    <div class="relative">
                        <span class="absolute left-3 top-2 text-gray-500">S/</span>
                        <input type="number" id="nuevo-costo" step="0.01" min="0" 
                            class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    </div>
                    
                    <div id="vista-previa-calculo" class="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                        <!-- Se mostrará el cálculo en tiempo real -->
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button id="cancelar-edicion-costo" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                        Cancelar
                    </button>
                    <button id="guardar-costo" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        Guardar Costo
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = content;
    
    // Configurar eventos
    setupRentabilidadEvents();
    
    // Cargar datos iniciales
    loadProfitabilityData();
};

// Variables globales para la sección
let currentProductsData = [];
let filteredProductsData = [];
let currentDisplayLimit = 50;
let currentSortField = 'ganancia-desc';
let productToEdit = null;

function setupRentabilidadEvents() {
    // Eventos de filtros
    document.getElementById('filtro-busqueda').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('filtro-categoria').addEventListener('change', () => {
        applyFilters();
        renderResumenCategoria();
    });
    document.getElementById('filtro-rentabilidad').addEventListener('change', applyFilters);
    document.getElementById('ordenar-por').addEventListener('change', (e) => {
        currentSortField = e.target.value;
        applyFilters();
    });
    document.getElementById('solo-con-stock').addEventListener('change', applyFilters);
    document.getElementById('sin-stock').addEventListener('change', applyFilters);
    document.getElementById('incluir-sin-costo').addEventListener('change', applyFilters);

    // Eventos de botones
    document.getElementById('btn-exportar').addEventListener('click', exportToCSV);
    document.getElementById('btn-mostrar-mas').addEventListener('click', showMoreProducts);

    // Eventos del modal
    document.getElementById('cerrar-modal-costo').addEventListener('click', closeEditCostModal);
    document.getElementById('cancelar-edicion-costo').addEventListener('click', closeEditCostModal);
    document.getElementById('guardar-costo').addEventListener('click', saveCost);
    document.getElementById('nuevo-costo').addEventListener('input', updateCostPreview);

    // Eventos de la tabla
    document.getElementById('tabla-rentabilidad').addEventListener('click', handleTableClick);

    // Renderizar resumen al cargar
    renderResumenCategoria();
}

function loadProfitabilityData() {
    if (!window.productsCache) {
        document.getElementById('tabla-rentabilidad').innerHTML = `
            <tr>
                <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>
                    Cargando productos...
                </td>
            </tr>
        `;
        return;
    }
    
    // Procesar datos de productos
    currentProductsData = window.productsCache.map(product => {
        const nombre = product.name || product.nombre || 'Producto sin nombre';
        const categoria = product.category || product.categoria || 'Sin categoría';
        const precio = parseFloat(product.price || product.precio || 0);
        const costo = parseFloat(product.acquisitionCost || product.cost || product.costo || 0);
        const stock = parseInt(product.stock || 0);
        
        // Usar los nuevos campos stockInicial y precioCompraInicial
        const stockInicial = parseInt(product.stockInicial || 0);
        const precioCompraInicial = parseFloat(product.precioCompraInicial || costo || 0);
        
        // Debug: verificar campos de stock inicial
        if (product.stockInicial !== undefined || product.precioCompraInicial !== undefined) {
            console.log(`Producto ${nombre} tiene stock inicial:`, {
                stockInicial: stockInicial,
                precioCompraInicial: precioCompraInicial,
                stockActual: stock,
                costoActual: costo
            });
        }
        
        const gananciaUnitaria = precio - costo;
        const gananciaPotencialTotal = gananciaUnitaria * stock;
        const margenPorcentaje = costo > 0 ? ((gananciaUnitaria / costo) * 100) : 0;
        
        return {
            id: product.id,
            nombre,
            categoria,
            precio,
            costo,
            stock,
            stockInicial,
            precioCompraInicial,
            gananciaUnitaria,
            gananciaPotencialTotal,
            margenPorcentaje,
            inversionTotal: costo * stock,
            inversionInicial: stockInicial * precioCompraInicial, // Nueva propiedad
            imageUrl: product.imageUrl || product.imagen,
            tieneCosto: costo > 0
        };
    });
    
    // Cargar categorías para filtro
    loadCategoriesForFilter();
    
    // Aplicar filtros iniciales
    applyFilters();
    
    // Actualizar resumen
    updateSummary();
}

function loadCategoriesForFilter() {
    const selectCategoria = document.getElementById('filtro-categoria');
    
    // Limpiar opciones existentes excepto la primera
    while (selectCategoria.options.length > 1) {
        selectCategoria.remove(1);
    }
    
    // Obtener categorías únicas
    const categorias = [...new Set(currentProductsData.map(p => p.categoria))].sort();
    
    categorias.forEach(categoria => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        selectCategoria.appendChild(option);
    });
}

function applyFilters() {
    const busqueda = document.getElementById('filtro-busqueda').value.toLowerCase();
    const categoriaFiltro = document.getElementById('filtro-categoria').value;
    const rentabilidadFiltro = document.getElementById('filtro-rentabilidad').value;
    const soloConStock = document.getElementById('solo-con-stock').checked;
    const sinStock = document.getElementById('sin-stock').checked;
    const incluirSinCosto = document.getElementById('incluir-sin-costo').checked;

    filteredProductsData = currentProductsData.filter(product => {
        // Filtro de búsqueda
        if (busqueda && !product.nombre.toLowerCase().includes(busqueda)) {
            return false;
        }

        // Filtro de categoría
        if (categoriaFiltro !== 'todas' && product.categoria !== categoriaFiltro) {
            return false;
        }

        // Filtro de stock
        if (soloConStock && product.stock <= 0) {
            return false;
        }
        // Filtro de productos sin stock
        if (sinStock && product.stock > 0) {
            return false;
        }
        // Si ambos están activos, mostrar todos (no filtrar por stock)
        if (soloConStock && sinStock) {
            // No filtrar por stock
        }

        // Filtro de productos sin costo
        if (!incluirSinCosto && !product.tieneCosto) {
            return false;
        }

        // Filtro de rentabilidad
        if (rentabilidadFiltro !== 'todos') {
            const margen = product.margenPorcentaje;
            switch (rentabilidadFiltro) {
                case 'alta':
                    if (margen <= 50) return false;
                    break;
                case 'media':
                    if (margen <= 20 || margen > 50) return false;
                    break;
                case 'baja':
                    if (margen < 0 || margen > 20) return false;
                    break;
                case 'perdida':
                    if (margen >= 0) return false;
                    break;
            }
        }

        return true;
    });

    // Aplicar ordenamiento
    sortProductsData();

    // Resetear límite de visualización
    currentDisplayLimit = 50;

    // Actualizar tabla
    updateTable();

    // Actualizar contador
    updateCounter();

    // Actualizar resumen por categoría
    renderResumenCategoria();
}
// Panel de resumen por categoría
function renderResumenCategoria() {
    const categoriaFiltro = document.getElementById('filtro-categoria').value;
    const panel = document.getElementById('panel-resumen-categoria');
    let productos = [];
    let nombreCategoria = '';
    if (categoriaFiltro === 'todas') {
        productos = currentProductsData;
        nombreCategoria = 'Todo el inventario';
    } else {
        productos = currentProductsData.filter(p => p.categoria === categoriaFiltro);
        nombreCategoria = categoriaFiltro;
    }

    if (!productos.length) {
        panel.classList.add('hidden');
        panel.innerHTML = '';
        return;
    }

    // Sección: Inventario actual (stock > 0)
    const productosStock = productos.filter(p => p.stock > 0);
    const totalConStock = productosStock.length;
    const inversionStock = productosStock.reduce((sum, p) => sum + p.inversionTotal, 0);
    const valorVentaStock = productosStock.reduce((sum, p) => sum + (p.precio * p.stock), 0);
    const gananciaStock = productosStock.reduce((sum, p) => sum + p.gananciaPotencialTotal, 0);

    // Sección: Histórico total
    const totalRegistrados = productos.length;
    const inversionInicial = productos.reduce((sum, p) => {
        // Usar los nuevos campos stockInicial y precioCompraInicial
        const stockInicial = p.stockInicial || 0;
        const precioCompraInicial = p.precioCompraInicial || p.costo || 0;
        return sum + (stockInicial * precioCompraInicial);
    }, 0);
    const valorVentaInicial = productos.reduce((sum, p) => {
        const stockInicial = p.stockInicial || 0;
        return sum + (p.precio * stockInicial);
    }, 0);
    const gananciaEsperada = valorVentaInicial - inversionInicial;
    const roi = inversionInicial > 0 ? (gananciaEsperada / inversionInicial) * 100 : 0;

    // Productos agotados
    const productosAgotados = productos.filter(p => (p.stock === 0) && (p.stockInicial > 0));

    // Métricas adicionales
    const productosConCosto = productos.filter(p => p.tieneCosto);
    const margenPromedio = productosConCosto.length > 0 ? productosConCosto.reduce((sum, p) => sum + p.margenPorcentaje, 0) / productosConCosto.length : 0;
    const productoMasRentable = productosConCosto.length > 0 ? productosConCosto.reduce((max, p) => p.margenPorcentaje > max.margenPorcentaje ? p : max, productosConCosto[0]) : null;
    const productoMayorGanancia = productos.length > 0 ? productos.reduce((max, p) => p.gananciaPotencialTotal > max.gananciaPotencialTotal ? p : max, productos[0]) : null;
    const margenNegativo = productosConCosto.some(p => p.margenPorcentaje < 0);

    // Panel HTML
    panel.innerHTML = `
        <div class="rounded-lg border shadow-sm bg-gradient-to-r from-blue-50 to-green-50 p-6 mb-4">
            <div class="flex items-center mb-3">
                <i class="fas fa-chart-pie text-2xl text-green-600 mr-2"></i>
                <h3 class="text-xl font-bold text-gray-800">Resumen de Categoría: <span class="text-green-700">${nombreCategoria}</span></h3>
            </div>
            <div class="mb-4">
                <div class="font-semibold text-blue-900 border-b pb-1 mb-2">INVENTARIO ACTUAL</div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-box text-blue-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Productos con stock</div>
                            <div class="text-lg font-bold">${totalConStock} de ${totalRegistrados}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-wallet text-blue-600 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Inversión en stock</div>
                            <div class="text-lg font-bold text-blue-600">S/ ${inversionStock.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-coins text-green-600 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Valor de venta actual</div>
                            <div class="text-lg font-bold text-green-700">S/ ${valorVentaStock.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-money-bill-wave text-green-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Ganancia potencial</div>
                            <div class="text-lg font-bold ${gananciaStock >= 0 ? 'text-green-600' : 'text-red-600'}">S/ ${gananciaStock.toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-4">
                <div class="font-semibold text-blue-900 border-b pb-1 mb-2">HISTÓRICO TOTAL</div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-archive text-gray-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Total productos registrados</div>
                            <div class="text-lg font-bold">${totalRegistrados}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-briefcase text-blue-700 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Inversión inicial total</div>
                            <div class="text-lg font-bold text-blue-700">S/ ${inversionInicial.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-bullseye text-green-700 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Valor venta esperado total</div>
                            <div class="text-lg font-bold text-green-700">S/ ${valorVentaInicial.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-chart-line text-green-600 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Ganancia esperada total</div>
                            <div class="text-lg font-bold ${gananciaEsperada >= 0 ? 'text-green-600' : 'text-red-600'}">S/ ${gananciaEsperada.toFixed(2)}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-percentage text-purple-600 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">ROI esperado</div>
                            <div class="text-lg font-bold ${roi < 0 ? 'text-red-600' : 'text-purple-600'}">${roi.toFixed(1)}%</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="mb-4">
                <div class="font-semibold text-blue-900 border-b pb-1 mb-2">PRODUCTOS AGOTADOS</div>
                <div class="space-y-2">
                    ${productosAgotados.length === 0 ? '<div class="text-gray-500">No hay productos agotados.</div>' : productosAgotados.map(p => `
                        <div class="flex items-center">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                            <span class="font-semibold text-gray-800">${p.nombre}</span>
                            <span class="ml-2 text-sm text-gray-500">(Stock inicial: ${p.stockInicial}, agotado)</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="mb-4">
                <div class="font-semibold text-blue-900 border-b pb-1 mb-2">MÉTRICAS ADICIONALES</div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-percentage text-purple-600 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Margen promedio</div>
                            <div class="text-lg font-bold ${margenPromedio < 0 ? 'text-red-600' : 'text-purple-600'}">${margenPromedio.toFixed(1)}%</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                        <i class="fas fa-star text-yellow-500 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Producto más rentable</div>
                            <div class="text-lg font-bold">${productoMasRentable ? productoMasRentable.nombre + ` (${productoMasRentable.margenPorcentaje.toFixed(1)}%)` : '-'}</div>
                        </div>
                    </div>
                    <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border md:col-span-2">
                        <i class="fas fa-trophy text-green-700 text-2xl mr-3"></i>
                        <div>
                            <div class="text-sm text-gray-600">Producto con mayor ganancia potencial</div>
                            <div class="text-lg font-bold">${productoMayorGanancia ? productoMayorGanancia.nombre + ` (S/ ${productoMayorGanancia.gananciaPotencialTotal.toFixed(2)})` : '-'}</div>
                        </div>
                    </div>
                </div>
            </div>
            ${margenNegativo ? `<div class='mt-4 text-red-600 font-semibold flex items-center'><i class=\"fas fa-exclamation-triangle mr-2\"></i> ¡Alerta! Hay productos con margen negativo en esta categoría.</div>` : ''}
            <!-- Espacio para gráfico de dona -->
            <div id="grafico-dona-categoria" class="mt-6"></div>
        </div>
    `;
    panel.classList.remove('hidden');
}

function sortProductsData() {
    filteredProductsData.sort((a, b) => {
        switch (currentSortField) {
            case 'ganancia-desc':
                return b.gananciaPotencialTotal - a.gananciaPotencialTotal;
            case 'ganancia-asc':
                return a.gananciaPotencialTotal - b.gananciaPotencialTotal;
            case 'margen-desc':
                return b.margenPorcentaje - a.margenPorcentaje;
            case 'margen-asc':
                return a.margenPorcentaje - b.margenPorcentaje;
            case 'nombre-asc':
                return a.nombre.localeCompare(b.nombre);
            case 'stock-desc':
                return b.stock - a.stock;
            case 'costo':
                return b.costo - a.costo;
            case 'precio':
                return b.precio - a.precio;
            default:
                return 0;
        }
    });
}

function updateTable() {
    const tbody = document.getElementById('tabla-rentabilidad');
    const productsToShow = filteredProductsData.slice(0, currentDisplayLimit);
    
    if (productsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-search text-2xl mb-2"></i><br>
                    No se encontraron productos con los filtros aplicados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = productsToShow.map(product => {
        const margenClass = getMarginClass(product.margenPorcentaje);
        const gananciaClass = product.gananciaUnitaria >= 0 ? 'text-green-600' : 'text-red-600';
        const stockClass = getStockClass(product.stock);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="flex items-center">
                        ${product.imageUrl ? `
                        <img src="${product.imageUrl}" alt="${product.nombre}" 
                             class="w-10 h-10 object-cover rounded-lg mr-3 border">
                        ` : `
                        <div class="w-10 h-10 bg-gray-200 rounded-lg mr-3 flex items-center justify-center">
                            <i class="fas fa-box text-gray-400"></i>
                        </div>
                        `}
                        <div>
                            <p class="font-medium text-gray-900">${product.nombre}</p>
                            ${!product.tieneCosto ? '<p class="text-xs text-orange-600"><i class="fas fa-exclamation-triangle mr-1"></i>Sin costo</p>' : ''}
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3">
                    <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                        ${product.categoria}
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-medium">S/ ${product.costo.toFixed(2)}</span>
                    ${!product.tieneCosto ? `
                    <button class="edit-cost-btn ml-2 text-orange-600 hover:text-orange-800" 
                            data-product-id="${product.id}" title="Definir costo">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    ` : ''}
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-medium">S/ ${product.precio.toFixed(2)}</span>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-medium ${gananciaClass}">
                        S/ ${product.gananciaUnitaria.toFixed(2)}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="${stockClass} px-2 py-1 rounded text-sm font-medium">
                        ${product.stock}
                    </span>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-bold ${gananciaClass}">
                        S/ ${product.gananciaPotencialTotal.toFixed(2)}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="font-bold ${margenClass}">
                        ${product.margenPorcentaje.toFixed(1)}%
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <button class="edit-cost-btn bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200" 
                            data-product-id="${product.id}" title="Editar costo">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Actualizar botón "Mostrar más"
    const btnMostrarMas = document.getElementById('btn-mostrar-mas');
    if (filteredProductsData.length > currentDisplayLimit) {
        btnMostrarMas.style.display = 'block';
    } else {
        btnMostrarMas.style.display = 'none';
    }
}

function updateCounter() {
    const totalFiltrados = filteredProductsData.length;
    const totalMostrados = Math.min(currentDisplayLimit, totalFiltrados);
    
    document.getElementById('contador-productos-filtrados').textContent = 
        `Mostrando ${totalMostrados} de ${totalFiltrados} productos`;
    
    document.getElementById('productos-mostrados').textContent = totalMostrados;
}

function updateSummary() {
    const totalInversion = currentProductsData.reduce((sum, p) => sum + p.inversionTotal, 0);
    const totalGananciaPotencial = currentProductsData.reduce((sum, p) => sum + p.gananciaPotencialTotal, 0);
    const productosConCosto = currentProductsData.filter(p => p.tieneCosto);
    const margenPromedio = productosConCosto.length > 0 
        ? productosConCosto.reduce((sum, p) => sum + p.margenPorcentaje, 0) / productosConCosto.length 
        : 0;
    
    document.getElementById('total-inversion').textContent = `S/ ${totalInversion.toFixed(2)}`;
    document.getElementById('total-ganancia-potencial').textContent = `S/ ${totalGananciaPotencial.toFixed(2)}`;
    document.getElementById('margen-promedio').textContent = `${margenPromedio.toFixed(1)}%`;
    document.getElementById('total-productos').textContent = currentProductsData.length;
}

function getMarginClass(margin) {
    if (margin < 0) return 'text-red-600';
    if (margin < 20) return 'text-orange-600';
    if (margin < 50) return 'text-yellow-600';
    return 'text-green-600';
}

function getStockClass(stock) {
    if (stock === 0) return 'bg-red-100 text-red-800';
    if (stock <= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
}

function showMoreProducts() {
    currentDisplayLimit += 50;
    updateTable();
    updateCounter();
}

function handleTableClick(e) {
    if (e.target.classList.contains('edit-cost-btn') || e.target.closest('.edit-cost-btn')) {
        const button = e.target.classList.contains('edit-cost-btn') ? e.target : e.target.closest('.edit-cost-btn');
        const productId = button.dataset.productId;
        showEditCostModal(productId);
    }
}

function showEditCostModal(productId) {
    const product = currentProductsData.find(p => p.id === productId);
    if (!product) return;
    
    productToEdit = product;
    
    document.getElementById('producto-nombre-modal').textContent = product.nombre;
    document.getElementById('producto-precio-modal').textContent = product.precio.toFixed(2);
    document.getElementById('nuevo-costo').value = product.costo > 0 ? product.costo.toFixed(2) : '';
    
    updateCostPreview();
    
    document.getElementById('modal-editar-costo').classList.add('active');
    document.getElementById('nuevo-costo').focus();
}

function closeEditCostModal() {
    document.getElementById('modal-editar-costo').classList.remove('active');
    productToEdit = null;
}

function updateCostPreview() {
    if (!productToEdit) return;
    
    const nuevoCosto = parseFloat(document.getElementById('nuevo-costo').value) || 0;
    const ganancia = productToEdit.precio - nuevoCosto;
    const margen = nuevoCosto > 0 ? ((ganancia / nuevoCosto) * 100) : 0;
    const gananciaPotencial = ganancia * productToEdit.stock;
    
    const gananciaClass = ganancia >= 0 ? 'text-green-600' : 'text-red-600';
    const margenClass = getMarginClass(margen);
    
    document.getElementById('vista-previa-calculo').innerHTML = `
        <div class="space-y-2">
            <div class="flex justify-between">
                <span>Ganancia unitaria:</span>
                <span class="font-semibold ${gananciaClass}">S/ ${ganancia.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
                <span>Margen de ganancia:</span>
                <span class="font-semibold ${margenClass}">${margen.toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
                <span>Ganancia potencial total:</span>
                <span class="font-semibold ${gananciaClass}">S/ ${gananciaPotencial.toFixed(2)}</span>
            </div>
        </div>
    `;
}

async function saveCost() {
    if (!productToEdit) return;
    
    const nuevoCosto = parseFloat(document.getElementById('nuevo-costo').value);
    
    if (isNaN(nuevoCosto) || nuevoCosto < 0) {
        alert('Por favor ingresa un costo válido');
        return;
    }
    
    const guardarBtn = document.getElementById('guardar-costo');
    const originalText = guardarBtn.textContent;
    guardarBtn.disabled = true;
    guardarBtn.textContent = 'Guardando...';
    
    try {
        // Actualizar en Firestore
        const productRef = window.doc(window.db, "products", productToEdit.id);
        await window.updateDoc(productRef, {
            acquisitionCost: nuevoCosto,
            cost: nuevoCosto, // Mantener ambos campos por compatibilidad
            costo: nuevoCosto // Mantener campo en español por compatibilidad
        });
        
        // Actualizar cache local
        const productIndex = window.productsCache.findIndex(p => p.id === productToEdit.id);
        if (productIndex !== -1) {
            window.productsCache[productIndex].acquisitionCost = nuevoCosto;
            window.productsCache[productIndex].cost = nuevoCosto;
            window.productsCache[productIndex].costo = nuevoCosto;
        }
        
        // Recargar datos
        loadProfitabilityData();
        
        closeEditCostModal();
        
        // Mostrar mensaje de éxito
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
        successMsg.textContent = 'Costo actualizado exitosamente';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            document.body.removeChild(successMsg);
        }, 3000);
        
    } catch (error) {
        console.error('Error actualizando costo:', error);
        alert('Error al actualizar el costo: ' + error.message);
    } finally {
        guardarBtn.disabled = false;
        guardarBtn.textContent = originalText;
    }
}

function sortTable(field) {
    currentSortField = field;
    applyFilters();
}

function exportToCSV() {
    if (filteredProductsData.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const headers = [
        'Producto',
        'Categoría',
        'Costo Adquisición',
        'Precio Venta',
        'Ganancia Unitaria',
        'Stock',
        'Ganancia Potencial Total',
        'Margen %',
        'Inversión Total'
    ];
    
    const csvContent = [
        headers.join(','),
        ...filteredProductsData.map(product => [
            `"${product.nombre}"`,
            `"${product.categoria}"`,
            product.costo.toFixed(2),
            product.precio.toFixed(2),
            product.gananciaUnitaria.toFixed(2),
            product.stock,
            product.gananciaPotencialTotal.toFixed(2),
            product.margenPorcentaje.toFixed(1),
            product.inversionTotal.toFixed(2)
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `analisis-rentabilidad-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Función auxiliar para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Función para verificar que las funciones de Firebase estén disponibles
window.addEventListener('load', function() {
    console.log('Verificando funciones de Firebase para rentabilidad:');
    console.log('updateDoc:', typeof window.updateDoc);
    console.log('doc:', typeof window.doc);
});

console.log('admin-rentabilidad.js cargado completamente');
