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
        <style>
            .tab-content.hidden { 
                display: none !important; 
            }
            .tab-content:not(.hidden) { 
                display: block !important; 
            }
        </style>
        <div class="space-y-6">
            <!-- Header con pestañas -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-chart-pie mr-2 text-green-600"></i>
                    Análisis de Rentabilidad
                </h2>
                
                <!-- Pestañas de navegación -->
                <div class="flex space-x-1 mb-4">
                    <button id="tab-productos" class="tab-button active px-4 py-2 rounded-md font-medium transition-colors bg-green-600 text-white">
                        <i class="fas fa-box mr-2"></i>Por Productos
                    </button>
                    <button id="tab-lotes" class="tab-button px-4 py-2 rounded-md font-medium transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300">
                        <i class="fas fa-layer-group mr-2"></i>Por Lotes
                    </button>
                </div>
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
            
            <!-- Contenido Por Productos -->
            <div id="contenido-productos" class="tab-content" style="display: block;">
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
            
        <!-- Contenido Por Lotes -->
        <div id="contenido-lotes" class="tab-content hidden" style="display: none;">
                
                <!-- Resumen de lotes -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i class="fas fa-layer-group mr-2 text-blue-600"></i>
                        Resumen General de Lotes
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-blue-50 rounded-lg p-4 border">
                            <div class="flex items-center">
                                <div class="p-2 bg-blue-100 rounded-lg">
                                    <i class="fas fa-boxes text-blue-600"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-gray-600">Total Lotes</p>
                                    <p class="text-lg font-bold text-blue-600" id="total-lotes">0</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-green-50 rounded-lg p-4 border">
                            <div class="flex items-center">
                                <div class="p-2 bg-green-100 rounded-lg">
                                    <i class="fas fa-check-circle text-green-600"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-gray-600">Lotes Activos</p>
                                    <p class="text-lg font-bold text-green-600" id="lotes-activos">0</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-yellow-50 rounded-lg p-4 border">
                            <div class="flex items-center">
                                <div class="p-2 bg-yellow-100 rounded-lg">
                                    <i class="fas fa-clock text-yellow-600"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-gray-600">ROI Promedio</p>
                                    <p class="text-lg font-bold text-yellow-600" id="roi-promedio-lotes">0%</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-purple-50 rounded-lg p-4 border">
                            <div class="flex items-center">
                                <div class="p-2 bg-purple-100 rounded-lg">
                                    <i class="fas fa-coins text-purple-600"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-gray-600">Inversión Total</p>
                                    <p class="text-lg font-bold text-purple-600" id="inversion-total-lotes">S/ 0.00</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Filtros para lotes -->
                <div class="bg-white rounded-lg shadow p-6 mb-6">
                    <div class="flex flex-wrap gap-4 items-center mb-4">
                        <div class="flex-grow min-w-64">
                            <input type="text" id="filtro-busqueda-lotes" placeholder="Buscar por producto o lote..." 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div class="flex-shrink-0">
                            <select id="filtro-producto-lotes" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="todos">Todos los productos</option>
                            </select>
                        </div>
                        
                        <div class="flex-shrink-0">
                            <select id="filtro-estado-lotes" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="todos">Todos los estados</option>
                                <option value="activo">Activos (con stock)</option>
                                <option value="parcial">Parcialmente vendidos</option>
                                <option value="agotado">Agotados</option>
                            </select>
                        </div>
                        
                        <div class="flex-shrink-0">
                            <select id="filtro-rentabilidad-lotes" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="todos">Todas las rentabilidades</option>
                                <option value="alta">Alta rentabilidad (>50%)</option>
                                <option value="media">Media rentabilidad (20-50%)</option>
                                <option value="baja">Baja rentabilidad (0-20%)</option>
                                <option value="perdida">Con pérdidas (<0%)</option>
                            </select>
                        </div>
                        
                        <div class="flex-shrink-0">
                            <select id="ordenar-lotes" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="fecha-desc">Más recientes</option>
                                <option value="fecha-asc">Más antiguos</option>
                                <option value="roi-desc">Mayor ROI</option>
                                <option value="roi-asc">Menor ROI</option>
                                <option value="ganancia-desc">Mayor ganancia</option>
                                <option value="stock-desc">Mayor stock</option>
                            </select>
                        </div>
                        
                        <button id="btn-exportar-lotes" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                            <i class="fas fa-download mr-2"></i>Exportar
                        </button>
                    </div>
                    
                    <div class="flex justify-between items-center text-sm text-gray-600">
                        <span id="contador-lotes-filtrados">Mostrando 0 lotes</span>
                        <div class="flex items-center space-x-4">
                            <label class="flex items-center">
                                <input type="checkbox" id="solo-lotes-activos" class="mr-2">
                                Solo lotes con stock
                            </label>
                            <label class="flex items-center">
                                <input type="checkbox" id="mostrar-lotes-antiguos" class="mr-2">
                                Incluir lotes > 90 días
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Tabla de lotes -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Lote
                                    </th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Producto
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Ingreso
                                    </th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Costo/Unidad
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cant. Original
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Stock Actual
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendido
                                    </th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Inversión
                                    </th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ganancia Real
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ROI %
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Días
                                    </th>
                                </tr>
                            </thead>
                            <tbody id="tabla-lotes" class="bg-white divide-y divide-gray-200">
                                <!-- Los datos se cargarán aquí -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Paginación para lotes -->
                    <div class="bg-gray-50 px-4 py-3 border-t">
                        <div class="flex justify-between items-center">
                            <div class="text-sm text-gray-700">
                                Mostrando <span id="lotes-mostrados">0</span> lotes
                            </div>
                            <div class="flex space-x-2">
                                <button id="btn-mostrar-mas-lotes" class="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors">
                                    Mostrar más
                                </button>
                            </div>
                        </div>
                    </div>
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

// Cache para datos históricos por categoría
let historicoCache = {};
let historicoLoading = false;

// Variables para análisis por lotes
let currentLotesData = [];
let filteredLotesData = [];
let currentDisplayLimitLotes = 50;
let currentSortFieldLotes = 'fecha-desc';
let currentActiveTab = 'productos';

function setupRentabilidadEvents() {
    // Eventos de pestañas
    document.getElementById('tab-productos').addEventListener('click', () => switchTab('productos'));
    document.getElementById('tab-lotes').addEventListener('click', () => switchTab('lotes'));
    
    // Eventos de filtros (productos)
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

    // Eventos de filtros para lotes
    document.getElementById('filtro-busqueda-lotes').addEventListener('input', debounce(applyFiltersLotes, 300));
    document.getElementById('filtro-producto-lotes').addEventListener('change', applyFiltersLotes);
    document.getElementById('filtro-estado-lotes').addEventListener('change', applyFiltersLotes);
    document.getElementById('filtro-rentabilidad-lotes').addEventListener('change', applyFiltersLotes);
    document.getElementById('ordenar-lotes').addEventListener('change', (e) => {
        currentSortFieldLotes = e.target.value;
        applyFiltersLotes();
    });
    document.getElementById('solo-lotes-activos').addEventListener('change', applyFiltersLotes);
    document.getElementById('mostrar-lotes-antiguos').addEventListener('change', applyFiltersLotes);

    // Eventos de botones para lotes
    document.getElementById('btn-exportar-lotes').addEventListener('click', exportLotesToCSV);
    document.getElementById('btn-mostrar-mas-lotes').addEventListener('click', showMoreLotes);

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
async function renderResumenCategoria() {
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

    // Sección: Inventario actual (stock > 0) - RÁPIDA
    const productosStock = productos.filter(p => p.stock > 0);
    const totalConStock = productosStock.length;
    const inversionStock = productosStock.reduce((sum, p) => sum + p.inversionTotal, 0);
    const valorVentaStock = productosStock.reduce((sum, p) => sum + (p.precio * p.stock), 0);
    const gananciaStock = productosStock.reduce((sum, p) => sum + p.gananciaPotencialTotal, 0);

    // Renderizar panel con datos del inventario actual inmediatamente
    renderPanelResumenRapido(panel, nombreCategoria, productos, productosStock, totalConStock, inversionStock, valorVentaStock, gananciaStock);

    // Sección: Histórico total - LENTO - cargar en background
    loadHistoricoDataAsync(categoriaFiltro, panel, nombreCategoria, productos, productosStock, totalConStock, inversionStock, valorVentaStock, gananciaStock);
}

// Función para renderizar el panel rápidamente con datos del inventario actual
function renderPanelResumenRapido(panel, nombreCategoria, productos, productosStock, totalConStock, inversionStock, valorVentaStock, gananciaStock) {
    const totalRegistrados = productos.length;

    // Panel HTML optimizado - solo inventario actual (rápido)
    panel.innerHTML = `
        <div class="rounded-lg border shadow-sm bg-gradient-to-r from-blue-50 to-green-50 p-6 mb-4">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center">
                    <i class="fas fa-chart-pie text-2xl text-green-600 mr-2"></i>
                    <h3 class="text-xl font-bold text-gray-800">Resumen de Categoría: <span class="text-green-700">${nombreCategoria}</span></h3>
                </div>
                <div id="loading-historico" class="hidden">
                    <i class="fas fa-spinner fa-spin text-blue-500 mr-2"></i>
                    <span class="text-sm text-blue-600">Cargando datos históricos...</span>
                </div>
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
            <!-- Contenedor para datos históricos - se llenará async -->
            <div id="historico-container">
                <div class="text-center py-4 text-gray-500">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    Cargando análisis histórico...
                </div>
            </div>
        </div>
    `;
    panel.classList.remove('hidden');
}

// Función para cargar datos históricos de manera asíncrona con caché
async function loadHistoricoDataAsync(categoriaFiltro, panel, nombreCategoria, productos, productosStock, totalConStock, inversionStock, valorVentaStock, gananciaStock) {
    if (historicoLoading) return; // Evitar múltiples cargas simultáneas
    
    const cacheKey = categoriaFiltro || 'todas';
    
    // Verificar caché
    if (historicoCache[cacheKey]) {
        console.log('Usando datos históricos desde caché para:', cacheKey);
        renderHistoricoSection(historicoCache[cacheKey], productos);
        return;
    }
    
    try {
        historicoLoading = true;
        
        // Mostrar indicador de carga
        const loadingIndicator = document.getElementById('loading-historico');
        if (loadingIndicator) {
            loadingIndicator.classList.remove('hidden');
        }
        
        console.log('=== Cargando datos históricos para:', cacheKey, '===');
        const datosHistoricos = await calcularHistoricoDesdeOriginalLotes(categoriaFiltro === 'todas' ? null : categoriaFiltro);
        
        // Guardar en caché
        historicoCache[cacheKey] = datosHistoricos;
        
        // Renderizar sección histórica
        renderHistoricoSection(datosHistoricos, productos);
        
    } catch (error) {
        console.error('Error cargando datos históricos:', error);
        const container = document.getElementById('historico-container');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4 text-red-500">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Error cargando análisis histórico
                </div>
            `;
        }
    } finally {
        historicoLoading = false;
        
        // Ocultar indicador de carga
        const loadingIndicator = document.getElementById('loading-historico');
        if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
        }
    }
}

// Función para renderizar la sección histórica
function renderHistoricoSection(datosHistoricos, productos) {
    const container = document.getElementById('historico-container');
    if (!container) return;
    
    const totalRegistrados = productos.length;
    const inversionInicial = datosHistoricos.inversionHistoricaTotal;
    const valorVentaEsperadoTotal = datosHistoricos.valorVentaEsperadoTotal;
    const gananciaEsperada = datosHistoricos.gananciaEsperadaTotal;
    const roi = datosHistoricos.roiEsperado;
    const lotesTotales = datosHistoricos.lotesTotales;
    const lotesAgotados = datosHistoricos.lotesAgotados;
    const unidadesTotalesOriginales = datosHistoricos.unidadesTotalesOriginales;
    const unidadesVendidas = datosHistoricos.unidadesVendidas;
    const productosLegacy = datosHistoricos.productosLegacy;
    
    container.innerHTML = `
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
                        <div class="text-lg font-bold text-green-700">S/ ${isNaN(valorVentaEsperadoTotal) ? '0.00' : valorVentaEsperadoTotal.toFixed(2)}</div>
                    </div>
                </div>
                <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                    <i class="fas fa-chart-line text-green-600 text-2xl mr-3"></i>
                    <div>
                        <div class="text-sm text-gray-600">Ganancia esperada total</div>
                        <div class="text-lg font-bold ${(isNaN(gananciaEsperada) ? 0 : gananciaEsperada) >= 0 ? 'text-green-600' : 'text-red-600'}">S/ ${isNaN(gananciaEsperada) ? '0.00' : gananciaEsperada.toFixed(2)}</div>
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
            <div class="font-semibold text-blue-900 border-b pb-1 mb-2">ANÁLISIS DE LOTES Y VENTAS</div>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                    <i class="fas fa-layer-group text-orange-500 text-2xl mr-3"></i>
                    <div>
                        <div class="text-sm text-gray-600">Total de lotes</div>
                        <div class="text-lg font-bold">${lotesTotales}</div>
                    </div>
                </div>
                <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                    <i class="fas fa-times-circle text-red-500 text-2xl mr-3"></i>
                    <div>
                        <div class="text-sm text-gray-600">Lotes agotados</div>
                        <div class="text-lg font-bold text-red-600">${lotesAgotados}</div>
                    </div>
                </div>
                <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                    <i class="fas fa-cube text-blue-500 text-2xl mr-3"></i>
                    <div>
                        <div class="text-sm text-gray-600">Unidades originales</div>
                        <div class="text-lg font-bold">${unidadesTotalesOriginales}</div>
                    </div>
                </div>
                <div class="flex items-center bg-white rounded-lg p-4 shadow-sm border">
                    <i class="fas fa-shopping-cart text-green-500 text-2xl mr-3"></i>
                    <div>
                        <div class="text-sm text-gray-600">Unidades vendidas</div>
                        <div class="text-lg font-bold text-green-600">${unidadesVendidas}</div>
                    </div>
                </div>
            </div>
            ${productosLegacy > 0 ? `
            <div class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div class="flex items-center">
                    <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                    <span class="text-sm font-medium text-yellow-800">
                        Se encontraron ${productosLegacy} productos legacy (sin sistema de lotes). 
                        Sus datos se incluyen en el análisis basándose en stock inicial registrado.
                    </span>
                </div>
            </div>
            ` : ''}
        </div>
    `;
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

// ========================================================================
// FUNCIONES PARA ANÁLISIS POR LOTES
// ========================================================================

function switchTab(tabName) {
    console.log(`=== Cambiando a pestaña: ${tabName} ===`);
    currentActiveTab = tabName;
    
    // Actualizar estado visual de las pestañas
    const tabButtons = document.querySelectorAll('.tab-button');
    console.log(`Encontrados ${tabButtons.length} botones de pestaña`);
    
    tabButtons.forEach(btn => {
        btn.classList.remove('active', 'bg-green-600', 'text-white');
        btn.classList.add('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
    });
    
    const activeButton = document.getElementById(`tab-${tabName}`);
    if (activeButton) {
        activeButton.classList.remove('bg-gray-200', 'text-gray-700', 'hover:bg-gray-300');
        activeButton.classList.add('active', 'bg-green-600', 'text-white');
        console.log(`Botón tab-${tabName} activado correctamente`);
    } else {
        console.error(`ERROR: Botón tab-${tabName} no encontrado`);
    }
    
    // Mostrar/ocultar contenido
    const contenidos = document.querySelectorAll('.tab-content');
    console.log(`Encontrados ${contenidos.length} contenidos de pestaña`);
    
    contenidos.forEach(contenido => {
        contenido.classList.add('hidden');
        contenido.style.display = 'none'; // Forzar ocultación con CSS inline
    });
    
    const contenidoActivo = document.getElementById(`contenido-${tabName}`);
    if (contenidoActivo) {
        contenidoActivo.classList.remove('hidden');
        contenidoActivo.style.display = 'block'; // Forzar visualización con CSS inline
        console.log(`Contenido contenido-${tabName} mostrado`);
        
        // Verificar que efectivamente sea visible
        const isVisible = contenidoActivo.offsetWidth > 0 && contenidoActivo.offsetHeight > 0;
        console.log(`¿Es visible el contenido? ${isVisible}`);
        
        // Diagnosticar por qué no es visible
        if (!isVisible) {
            const computedStyle = window.getComputedStyle(contenidoActivo);
            console.log('=== DIAGNÓSTICO DE VISIBILIDAD ===');
            console.log('display:', computedStyle.display);
            console.log('visibility:', computedStyle.visibility);
            console.log('opacity:', computedStyle.opacity);
            console.log('height:', computedStyle.height);
            console.log('width:', computedStyle.width);
            console.log('position:', computedStyle.position);
            console.log('z-index:', computedStyle.zIndex);
            console.log('overflow:', computedStyle.overflow);
            console.log('classes del elemento:', contenidoActivo.className);
            console.log('style inline:', contenidoActivo.style.cssText);
            
            // Intentar forzar visibilidad
            console.log('Intentando forzar visibilidad...');
            contenidoActivo.style.display = 'block !important';
            contenidoActivo.style.visibility = 'visible !important';
            contenidoActivo.style.opacity = '1 !important';
            contenidoActivo.style.height = 'auto !important';
            contenidoActivo.style.width = 'auto !important';
            contenidoActivo.style.position = 'static !important';
            
            // Verificar de nuevo después de forzar
            setTimeout(() => {
                const isVisibleAfter = contenidoActivo.offsetWidth > 0 && contenidoActivo.offsetHeight > 0;
                console.log(`¿Es visible después de forzar? ${isVisibleAfter}`);
                
                if (!isVisibleAfter) {
                    console.log('=== DIAGNÓSTICO DE ELEMENTOS PADRE ===');
                    
                    // Revisar contenedor padre
                    let parent = contenidoActivo.parentElement;
                    let level = 0;
                    
                    while (parent && level < 5) {
                        const parentStyle = window.getComputedStyle(parent);
                        console.log(`Padre nivel ${level}:`, {
                            tagName: parent.tagName,
                            className: parent.className,
                            id: parent.id,
                            display: parentStyle.display,
                            visibility: parentStyle.visibility,
                            opacity: parentStyle.opacity,
                            overflow: parentStyle.overflow,
                            height: parentStyle.height,
                            maxHeight: parentStyle.maxHeight,
                            width: parentStyle.width
                        });
                        
                        parent = parent.parentElement;
                        level++;
                    }
                    
                    // Verificar si hay otros elementos tomando todo el espacio
                    console.log('=== VERIFICACIÓN DE HERMANOS ===');
                    const hermanos = contenidoActivo.parentElement.children;
                    for (let i = 0; i < hermanos.length; i++) {
                        const hermano = hermanos[i];
                        const hermanoStyle = window.getComputedStyle(hermano);
                        console.log(`Hermano ${i}:`, {
                            tagName: hermano.tagName,
                            className: hermano.className,
                            id: hermano.id,
                            display: hermanoStyle.display,
                            position: hermanoStyle.position,
                            width: hermano.offsetWidth,
                            height: hermano.offsetHeight
                        });
                    }
                    
                    // SOLUCIÓN TEMPORAL: Intentar insertar contenido directamente
                    console.log('=== SOLUCIÓN TEMPORAL ===');
                    console.log('Intentando mostrar contenido directamente...');
                    
                    // Crear un elemento temporal visible
                    const tempDiv = document.createElement('div');
                    tempDiv.style.cssText = 'background: yellow; padding: 20px; margin: 20px; border: 2px solid red; z-index: 9999; position: relative;';
                    tempDiv.innerHTML = `
                        <h2>🔧 MODO DEBUG - CONTENIDO DE LOTES</h2>
                        <p>Si ves este mensaje, el problema está identificado.</p>
                        <div style="background: white; padding: 10px; margin: 10px;">
                            <strong>Datos procesados:</strong> ${currentLotesData.length} lotes
                        </div>
                    `;
                    
                    // Intentar agregarlo al contenedor principal
                    const contentArea = document.getElementById('content-area');
                    if (contentArea) {
                        contentArea.appendChild(tempDiv);
                        console.log('Elemento temporal agregado al content-area');
                    }
                    
                    // También intentar agregarlo al contenido de lotes
                    contenidoActivo.appendChild(tempDiv.cloneNode(true));
                    console.log('Elemento temporal agregado al contenido-lotes');
                }
            }, 100);
        }
    } else {
        console.error(`ERROR: Contenido contenido-${tabName} no encontrado`);
    }
    
    // Cargar datos según la pestaña activa
    if (tabName === 'lotes') {
        console.log('Iniciando carga de datos de lotes...');
        loadLotesData();
    }
    
    // Actualizar resumen de categoría al cambiar de pestaña (para reflejar los nuevos datos)
    console.log('Actualizando resumen de categoría después del cambio de pestaña...');
    renderResumenCategoria();
}

async function loadLotesData() {
    try {
        console.log('=== INICIANDO CARGA DE DATOS DE LOTES ===');
        
        // Verificar que la tabla existe
        const tablaLotes = document.getElementById('tabla-lotes');
        if (!tablaLotes) {
            console.error('ERROR: tabla-lotes no encontrada');
            return;
        }
        
        // Mostrar indicador de carga
        tablaLotes.innerHTML = `
            <tr>
                <td colspan="12" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>
                    Cargando lotes...
                </td>
            </tr>
        `;
        
        // Verificar que window.db existe
        if (!window.db) {
            console.error('ERROR: window.db no está disponible');
            tablaLotes.innerHTML = `
                <tr>
                    <td colspan="12" class="px-4 py-8 text-center text-red-500">
                        Error: Base de datos no disponible
                    </td>
                </tr>
            `;
            return;
        }
        
        // NUEVA VERIFICACIÓN DIRECTA DE DATOS
        console.log('=== VERIFICACIÓN DIRECTA DE DATOS ===');
        
        // 1. Buscar ventas directamente
        console.log('🔍 Buscando ventas...');
        const ventasSnapshotDebug = await window.db.collection('sales').get();
        console.log(`📋 Encontradas ${ventasSnapshotDebug.size} ventas en total`);
        
        // Mostrar las primeras 3 ventas para debug
        let ventasCount = 0;
        ventasSnapshotDebug.forEach(doc => {
            if (ventasCount < 3) {
                const venta = doc.data();
                console.log(`Venta ${ventasCount + 1}:`, {
                    id: doc.id,
                    customerName: venta.customerName,
                    totalSale: venta.totalSale,
                    items: venta.items,
                    date: venta.date,
                    timestamp: venta.timestamp
                });
                ventasCount++;
            }
        });
        
        // 2. Buscar movimientos de inventario directamente
        console.log('🔍 Buscando movimientos de inventario...');
        const movimientosSnapshotDebug = await window.db.collection('movimientos_inventario').get();
        console.log(`📋 Encontrados ${movimientosSnapshotDebug.size} movimientos en total`);
        
        // Buscar específicamente movimientos del producto "prueba"
        console.log('🔍 Buscando movimientos del producto "prueba"...');
        const movimientosPruebaDebug = [];
        movimientosSnapshotDebug.forEach(doc => {
            const mov = doc.data();
            if ((mov.productoNombre && mov.productoNombre.toLowerCase().includes('prueba')) ||
                (mov.observaciones && mov.observaciones.toLowerCase().includes('prueba'))) {
                movimientosPruebaDebug.push({
                    id: doc.id,
                    ...mov
                });
            }
        });
        
        console.log(`📦 Encontrados ${movimientosPruebaDebug.length} movimientos del producto "prueba":`, movimientosPruebaDebug);
        
        // 3. Buscar lotes del producto "prueba"
        console.log('🔍 Buscando lotes del producto "prueba"...');
        const lotesSnapshotDebug = await window.db.collection('stock_por_lote').get();
        const lotesPruebaDebug = [];
        lotesSnapshotDebug.forEach(doc => {
            const lote = doc.data();
            if (lote.productoNombre && lote.productoNombre.toLowerCase().includes('prueba')) {
                lotesPruebaDebug.push({
                    id: doc.id,
                    ...lote
                });
            }
        });
        
        console.log(`📦 Encontrados ${lotesPruebaDebug.length} lotes del producto "prueba":`, lotesPruebaDebug);
        
        // 4. Buscar productos para obtener el ID correcto
        console.log('🔍 Buscando productos...');
        if (window.productsCache) {
            const productoPrueba = window.productsCache.find(p => p.name && p.name.toLowerCase().includes('prueba'));
            if (productoPrueba) {
                console.log('📦 Producto "prueba" encontrado:', {
                    id: productoPrueba.id,
                    name: productoPrueba.name,
                    stock: productoPrueba.stock,
                    price: productoPrueba.price,
                    acquisitionCost: productoPrueba.acquisitionCost
                });
                
                // Buscar ventas específicas de este producto
                console.log('🔍 Buscando ventas específicas del producto prueba...');
                const ventasProductoPrueba = [];
                ventasSnapshotDebug.forEach(doc => {
                    const venta = doc.data();
                    if (venta.items && Array.isArray(venta.items)) {
                        venta.items.forEach(item => {
                            if (item.productId === productoPrueba.id || 
                                (item.name && item.name.toLowerCase().includes('prueba'))) {
                                ventasProductoPrueba.push({
                                    ventaId: doc.id,
                                    customerName: venta.customerName,
                                    date: venta.date,
                                    item: item
                                });
                            }
                        });
                    }
                });
                
                console.log(`💰 Encontradas ${ventasProductoPrueba.length} ventas del producto "prueba":`, ventasProductoPrueba);
                
                // Buscar movimientos específicos por ID de producto
                console.log('🔍 Buscando movimientos por ID de producto...');
                const movimientosPorId = [];
                movimientosSnapshotDebug.forEach(doc => {
                    const mov = doc.data();
                    if (mov.productoId === productoPrueba.id) {
                        movimientosPorId.push({
                            id: doc.id,
                            ...mov
                        });
                    }
                });
                
                console.log(`📋 Encontrados ${movimientosPorId.length} movimientos por ID del producto:`, movimientosPorId);
            } else {
                console.log('❌ No se encontró producto con nombre "prueba"');
            }
        } else {
            console.log('❌ window.productsCache no está disponible');
        }
        
        console.log('=== FIN VERIFICACIÓN DIRECTA ===');
        console.log('Continuando con el proceso normal...');
        
        // CONTINUAR CON EL PROCESO NORMAL
        
        // Cargar datos de lotes desde Firestore
        console.log('Consultando colección stock_por_lote...');
        const lotesSnapshot = await window.db.collection('stock_por_lote').get();
        console.log(`Encontrados ${lotesSnapshot.size} lotes en Firestore`);
        
        // Cargar ventas reales desde la colección sales para obtener precios de venta correctos
        console.log('Consultando ventas reales...');
        const ventasSnapshot = await window.db.collection('sales').get();
        console.log(`Encontradas ${ventasSnapshot.size} ventas`);
        
        // Crear mapa de ventas por producto y lote (si disponible)
        const ventasPorProducto = {};
        const ventasPorLote = {};
        
        ventasSnapshot.forEach(doc => {
            const venta = doc.data();
            const ventaItems = venta.items || [];
            
            ventaItems.forEach(item => {
                const productId = item.productId || item.id; // Fallback para item.id
                const cantidad = item.quantity || 0;
                const precioVenta = item.price || 0;
                const ingresoItem = cantidad * precioVenta;
                const loteId = item.loteId; // Verificar si hay información de lote en las ventas
                
                // Solo procesar si tenemos un productId válido
                if (!productId) {
                    console.warn('❌ Item sin productId válido en venta:', doc.id, item);
                    return;
                }
                
                // Mapa por producto (para productos legacy sin lotes)
                if (!ventasPorProducto[productId]) {
                    ventasPorProducto[productId] = {
                        cantidadVendida: 0,
                        ingresoTotal: 0,
                        ventasCount: 0
                    };
                }
                
                ventasPorProducto[productId].cantidadVendida += cantidad;
                ventasPorProducto[productId].ingresoTotal += ingresoItem;
                ventasPorProducto[productId].ventasCount += 1;
                
                console.log(`✅ Venta procesada: Producto ${productId}, cantidad: ${cantidad}, precio: ${precioVenta}`);
                
                // Si tenemos información de lote, también agregarlo al mapa por lote
                if (loteId) {
                    const key = `${productId}_${loteId}`;
                    if (!ventasPorLote[key]) {
                        ventasPorLote[key] = {
                            cantidadVendida: 0,
                            ingresoTotal: 0,
                            ventasCount: 0
                        };
                    }
                    
                    ventasPorLote[key].cantidadVendida += cantidad;
                    ventasPorLote[key].ingresoTotal += ingresoItem;
                    ventasPorLote[key].ventasCount += 1;
                    
                    console.log(`✅ Venta por lote procesada: ${key}, cantidad: ${cantidad}, precio: ${precioVenta}, ingreso: ${ingresoItem}`);
                }
            });
        });
        
        // Ahora cargar movimientos de inventario para obtener información de lotes
        console.log('Consultando movimientos de inventario para lotes...');
        const movimientosSnapshot = await window.db.collection('movimientos_inventario')
            .where('tipo', '==', 'salida')
            .get(); // Quitamos filtro de subtipo para ser más inclusivo
        console.log(`Encontrados ${movimientosSnapshot.size} movimientos de salida`);
        
        // DEBUG: Mostrar algunos movimientos para entender la estructura
        console.log('=== MUESTRA DE MOVIMIENTOS DE INVENTARIO ===');
        let movimientosCount = 0;
        movimientosSnapshot.forEach(doc => {
            if (movimientosCount < 5) { // Mostrar solo los primeros 5 para no llenar la consola
                console.log(`Movimiento ${movimientosCount + 1}:`, doc.data());
                movimientosCount++;
            }
        });
        
        // Crear mapa de cantidades vendidas por lote desde movimientos
        const cantidadesPorLote = {};
        console.log('Procesando movimientos de inventario...');
        
        movimientosSnapshot.forEach(doc => {
            const mov = doc.data();
            
            // Hacer filtro más inclusivo para capturar todos los movimientos de venta
            // Condiciones principales: debe tener loteId y ser una salida por venta
            const esVenta = (
                mov.subtipo === 'venta' || 
                mov.relatedTo === 'venta' || 
                mov.ventaId ||
                (mov.tipo === 'salida' && mov.observaciones && mov.observaciones.toLowerCase().includes('venta'))
            );
            
            if (esVenta && mov.loteId && mov.loteId !== 'sin-lote') {
                const key = `${mov.productoId}_${mov.loteId}`;
                
                if (!cantidadesPorLote[key]) {
                    cantidadesPorLote[key] = 0;
                }
                
                cantidadesPorLote[key] += mov.cantidad || 0;
                
                console.log(`✅ Movimiento de venta encontrado: ${key}`);
                console.log(`   📦 Cantidad: ${mov.cantidad}`);
                console.log(`   📋 Subtipo: ${mov.subtipo}`);
                console.log(`   🔗 RelatedTo: ${mov.relatedTo}`);
                console.log(`   💳 VentaId: ${mov.ventaId}`);
                console.log(`   📝 Observaciones: ${mov.observaciones}`);
            } else if (mov.loteId && mov.tipo === 'salida') {
                // Debug para movimientos que no se están capturando
                console.log(`❌ Movimiento de salida NO capturado: ${mov.productoId}_${mov.loteId}`);
                console.log(`   📋 Subtipo: ${mov.subtipo}`);
                console.log(`   🔗 RelatedTo: ${mov.relatedTo}`);
                console.log(`   💳 VentaId: ${mov.ventaId}`);
                console.log(`   📝 Observaciones: ${mov.observaciones}`);
            }
        });
        
        console.log('Cantidades por lote calculadas:', cantidadesPorLote);
        
        // DEBUG ESPECÍFICO: Buscar todos los movimientos del producto "prueba"
        console.log('=== DEBUG ESPECÍFICO PARA PRODUCTO PRUEBA ===');
        const movimientosPrueba = [];
        movimientosSnapshot.forEach(doc => {
            const mov = doc.data();
            if (mov.productoNombre && mov.productoNombre.toLowerCase().includes('prueba') || 
                (mov.observaciones && mov.observaciones.toLowerCase().includes('prueba'))) {
                movimientosPrueba.push({
                    id: doc.id,
                    ...mov
                });
            }
        });
        
        console.log(`Encontrados ${movimientosPrueba.length} movimientos relacionados con "prueba":`, movimientosPrueba);
        
        movimientosPrueba.forEach((mov, index) => {
            console.log(`Movimiento ${index + 1}:`, {
                fecha: mov.fecha,
                tipo: mov.tipo,
                subtipo: mov.subtipo,
                cantidad: mov.cantidad,
                loteId: mov.loteId,
                relatedTo: mov.relatedTo,
                ventaId: mov.ventaId,
                observaciones: mov.observaciones
            });
        });
        
        // Combinar datos: para cada lote, obtener cantidades de movimientos y precios de ventas
        console.log('Combinando datos de lotes con ventas...');
        console.log('Ventas por producto disponibles:', Object.keys(ventasPorProducto));
        console.log('Ventas por lote disponibles:', Object.keys(ventasPorLote));
        
        // Primero procesar ventas directas por lote (datos más precisos)
        Object.keys(ventasPorLote).forEach(key => {
            console.log(`Procesando venta directa del lote ${key}:`, ventasPorLote[key]);
        });
        
        // Luego procesar cantidades por lote desde movimientos
        Object.keys(cantidadesPorLote).forEach(key => {
            const [productoId, loteId] = key.split('_');
            const cantidadVendidaMovimiento = cantidadesPorLote[key];
            
            // Si ya tenemos datos directos de ventas, usar esos (más precisos)
            if (ventasPorLote[key]) {
                console.log(`Lote ${key} ya tiene datos directos de ventas, usando esos datos`);
                return;
            }
            
            // Si no, usar datos de movimientos + precios de producto
            const ventasProducto = ventasPorProducto[productoId];
            
            console.log(`Procesando lote ${key} desde movimientos:`);
            console.log(`  Cantidad vendida (movimientos): ${cantidadVendidaMovimiento}`);
            console.log(`  Ventas del producto:`, ventasProducto);
            
            if (ventasProducto && cantidadVendidaMovimiento > 0) {
                // Calcular precio promedio de venta del producto
                const precioPromedioVenta = ventasProducto.ingresoTotal / ventasProducto.cantidadVendida;
                const ingresoEstimado = cantidadVendidaMovimiento * precioPromedioVenta;
                
                ventasPorLote[key] = {
                    cantidadVendida: cantidadVendidaMovimiento,
                    ingresoTotal: ingresoEstimado,
                    ventasCount: 1, // Aproximado
                    fuente: 'movimientos' // Indicar la fuente para debug
                };
                
                console.log(`  Precio promedio venta: S/ ${precioPromedioVenta.toFixed(2)}`);
                console.log(`  Ingreso estimado: S/ ${ingresoEstimado.toFixed(2)}`);
            } else {
                console.log(`  Sin datos de ventas para el producto ${productoId}`);
            }
        });
        
        console.log('Ventas por lote finales:', ventasPorLote);
        
        // Obtener datos de productos para nombres y precios
        const productosMap = {};
        if (window.productsCache) {
            window.productsCache.forEach(product => {
                productosMap[product.id] = {
                    nombre: product.name,
                    precio: product.price || 0,
                    categoria: product.category || 'Sin categoría'
                };
            });
        }
        
        // Procesar datos de lotes
        currentLotesData = [];
        lotesSnapshot.forEach(doc => {
            const lote = doc.data();
            const producto = productosMap[lote.productoId] || {};
            const key = `${lote.productoId}_${lote.loteId}`;
            
            // Obtener datos de ventas - priorizar ventas por lote, luego por producto
            let ventasInfo = ventasPorLote[key] || { cantidadVendida: 0, ingresoTotal: 0, ventasCount: 0 };
            
            // Si no hay ventas directas por lote, verificar si hay cantidades desde movimientos
            if (ventasInfo.cantidadVendida === 0 && cantidadesPorLote[key]) {
                const cantidadMovimientos = cantidadesPorLote[key];
                const ventasProducto = ventasPorProducto[lote.productoId];
                
                if (ventasProducto && cantidadMovimientos > 0) {
                    // Calcular precio promedio del producto
                    const precioPromedio = ventasProducto.ingresoTotal / ventasProducto.cantidadVendida;
                    ventasInfo = {
                        cantidadVendida: cantidadMovimientos,
                        ingresoTotal: cantidadMovimientos * precioPromedio,
                        ventasCount: 1,
                        fuente: 'movimientos_calculado'
                    };
                    
                    console.log(`📊 Calculando ventas para lote ${key} desde movimientos:`, {
                        cantidadMovimientos,
                        precioPromedio: precioPromedio.toFixed(2),
                        ingresoCalculado: ventasInfo.ingresoTotal.toFixed(2)
                    });
                }
            }
            
            // Calcular cantidad original y vendida correctamente
            const cantidadActual = lote.cantidad || 0;
            const cantidadVendida = ventasInfo.cantidadVendida;
            
            // La cantidad original debe ser la cantidad inicial del lote (cuando se creó)
            // Si no existe cantidadInicial, usar cantidadOriginal del lote, o calcular como actual + vendida
            const cantidadOriginal = lote.cantidadInicial || 
                                   lote.cantidadOriginal || 
                                   (cantidadActual + cantidadVendida) ||
                                   (lote.cantidadIngreso) || 0;
            
            // Calcular métricas financieras
            const costoUnitario = lote.costoUnitario || 0;
            const inversionTotal = cantidadOriginal * costoUnitario;
            
            // Para el ingreso real, usamos los datos reales de ventas (no precios actuales)
            const ingresoReal = ventasInfo.ingresoTotal || 0; // Ingreso REAL de las ventas
            const costoRealVendido = cantidadVendida * costoUnitario; // Costo real de lo vendido
            const gananciaReal = ingresoReal - costoRealVendido; // Ganancia REAL obtenida
            const roi = inversionTotal > 0 ? (gananciaReal / inversionTotal) * 100 : 0;
            
            // Calcular días en inventario
            const fechaIngreso = lote.fechaIngreso ? 
                (lote.fechaIngreso.toDate ? lote.fechaIngreso.toDate() : new Date(lote.fechaIngreso)) : 
                new Date();
            const diasEnInventario = Math.floor((new Date() - fechaIngreso) / (1000 * 60 * 60 * 24));
            
            // Determinar estado
            let estado;
            if (cantidadActual === 0) {
                estado = (cantidadVendida > 0 || cantidadOriginal > 0) ? 'agotado' : 'vacio';
            } else if (cantidadVendida > 0) {
                estado = 'parcial';
            } else {
                estado = 'activo';
            }
            
            // Debug para verificar cálculos de ganancia
            console.log(`=== PROCESANDO LOTE ${lote.loteId} ===`);
            console.log(`Producto: ${producto.nombre || 'desconocido'} (ID: ${lote.productoId})`);
            console.log(`Key del lote: ${key}`);
            console.log(`Cantidad actual: ${cantidadActual}`);
            console.log(`Cantidad vendida (calculada): ${cantidadVendida}`);
            console.log(`Cantidad original: ${cantidadOriginal}`);
            console.log(`Datos de ventas encontrados:`, ventasInfo);
            
            if (cantidadVendida > 0 || ventasInfo.cantidadVendida > 0) {
                console.log(`=== GANANCIA LOTE ${lote.loteId} ===`);
                console.log(`Ingreso real de ventas: S/ ${ingresoReal.toFixed(2)}`);
                console.log(`Costo unitario: S/ ${costoUnitario.toFixed(2)}`);
                console.log(`Costo real vendido: S/ ${costoRealVendido.toFixed(2)}`);
                console.log(`Ganancia real: S/ ${gananciaReal.toFixed(2)}`);
                console.log(`ROI: ${roi.toFixed(2)}%`);
                console.log(`Fuente de datos: ${ventasInfo.fuente || 'ventas directas'}`);
            } else {
                console.log(`=== LOTE SIN VENTAS: ${lote.loteId} ===`);
                console.log(`Estado: ${estado}`);
            }
            
            // Debug para lotes con problemas de datos
            if (cantidadActual === 0 && cantidadVendida === 0 && cantidadOriginal === 0) {
                console.warn(`Lote ${lote.loteId} del producto ${producto.nombre || 'desconocido'} tiene todos los valores en cero:`, {
                    loteData: lote,
                    ventasInfo: ventasInfo,
                    cantidadOriginalCalculada: cantidadOriginal
                });
            }
            
            currentLotesData.push({
                id: doc.id,
                loteId: lote.loteId,
                productoId: lote.productoId,
                productoNombre: producto.nombre || lote.productoNombre || 'Producto desconocido',
                categoria: producto.categoria,
                fechaIngreso: fechaIngreso,
                costoUnitario: costoUnitario,
                cantidadOriginal: cantidadOriginal,
                cantidadActual: cantidadActual,
                cantidadVendida: cantidadVendida,
                inversionTotal: inversionTotal,
                ingresoReal: ingresoReal,
                gananciaReal: gananciaReal,
                roi: roi,
                estado: estado,
                diasEnInventario: diasEnInventario,
                proveedor: lote.proveedor || 'No especificado',
                fechaVencimiento: lote.fechaVencimiento,
                ventasCount: ventasInfo.ventasCount
            });
        });
        
        console.log(`Procesados ${currentLotesData.length} lotes`);
        
        // Verificar y corregir lotes con datos incompletos
        await verificarYCorregirLotesIncompletos();
        
        // Si no hay lotes, mostrar mensaje
        if (currentLotesData.length === 0) {
            tablaLotes.innerHTML = `
                <tr>
                    <td colspan="12" class="px-4 py-8 text-center text-gray-500">
                        <i class="fas fa-inbox text-3xl mb-4"></i><br>
                        <div class="text-lg mb-2">No hay lotes registrados</div>
                        <div class="text-sm">Los lotes se crean automáticamente al registrar compras</div>
                    </td>
                </tr>
            `;
            
            // Actualizar resumen con valores en cero
            document.getElementById('total-lotes').textContent = '0';
            document.getElementById('lotes-activos').textContent = '0';
            document.getElementById('roi-promedio-lotes').textContent = '0%';
            document.getElementById('inversion-total-lotes').textContent = 'S/ 0.00';
            return;
        }
        
        // Cargar productos para filtro
        loadProductsForLotesFilter();
        
        // Aplicar filtros iniciales
        applyFiltersLotes();
        
        // Actualizar resumen
        updateLotesSummary();
        
    } catch (error) {
        console.error('Error cargando datos de lotes:', error);
        document.getElementById('tabla-lotes').innerHTML = `
            <tr>
                <td colspan="12" class="px-4 py-8 text-center text-red-500">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i><br>
                    Error cargando datos de lotes: ${error.message}
                </td>
            </tr>
        `;
    }
}

function loadProductsForLotesFilter() {
    console.log('=== Cargando productos para filtro de lotes ===');
    const selectProducto = document.getElementById('filtro-producto-lotes');
    
    if (!selectProducto) {
        console.error('ERROR: filtro-producto-lotes no encontrado');
        return;
    }
    
    // Limpiar opciones existentes excepto la primera
    while (selectProducto.options.length > 1) {
        selectProducto.remove(1);
    }
    
    // Obtener productos únicos de los lotes
    const productos = [...new Set(currentLotesData.map(l => l.productoNombre))].sort();
    console.log(`Agregando ${productos.length} productos al filtro:`, productos);
    
    productos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto;
        option.textContent = producto;
        selectProducto.appendChild(option);
    });
    
    console.log('Productos agregados al filtro exitosamente');
}

function applyFiltersLotes() {
    console.log('=== Aplicando filtros a lotes ===');
    console.log(`Lotes totales: ${currentLotesData.length}`);
    
    // Verificar que todos los elementos de filtro existan
    const elementos = {
        busqueda: document.getElementById('filtro-busqueda-lotes'),
        producto: document.getElementById('filtro-producto-lotes'),
        estado: document.getElementById('filtro-estado-lotes'),
        rentabilidad: document.getElementById('filtro-rentabilidad-lotes'),
        soloActivos: document.getElementById('solo-lotes-activos'),
        mostrarAntiguos: document.getElementById('mostrar-lotes-antiguos')
    };
    
    // Verificar que todos los elementos existan
    for (const [nombre, elemento] of Object.entries(elementos)) {
        if (!elemento) {
            console.error(`ERROR: ${nombre} filter element not found`);
            return;
        }
    }
    
    const busqueda = elementos.busqueda.value.toLowerCase();
    const productoFiltro = elementos.producto.value;
    const estadoFiltro = elementos.estado.value;
    const rentabilidadFiltro = elementos.rentabilidad.value;
    const soloActivos = elementos.soloActivos.checked;
    const mostrarAntiguos = elementos.mostrarAntiguos.checked;

    filteredLotesData = currentLotesData.filter(lote => {
        // Filtro de búsqueda
        if (busqueda && !lote.productoNombre.toLowerCase().includes(busqueda) && 
            !lote.loteId.toLowerCase().includes(busqueda)) {
            return false;
        }

        // Filtro de producto
        if (productoFiltro !== 'todos' && lote.productoNombre !== productoFiltro) {
            return false;
        }

        // Filtro de estado
        if (estadoFiltro !== 'todos' && lote.estado !== estadoFiltro) {
            return false;
        }

        // Filtro de solo activos
        if (soloActivos && lote.cantidadActual <= 0) {
            return false;
        }

        // Filtro de lotes antiguos
        if (!mostrarAntiguos && lote.diasEnInventario > 90) {
            return false;
        }

        // Filtro de rentabilidad
        if (rentabilidadFiltro !== 'todos') {
            const roi = lote.roi;
            switch (rentabilidadFiltro) {
                case 'alta':
                    if (roi <= 50) return false;
                    break;
                case 'media':
                    if (roi <= 20 || roi > 50) return false;
                    break;
                case 'baja':
                    if (roi < 0 || roi > 20) return false;
                    break;
                case 'perdida':
                    if (roi >= 0) return false;
                    break;
            }
        }

        return true;
    });

    console.log(`Lotes después de filtrado: ${filteredLotesData.length}`);
    
    // Aplicar ordenamiento
    sortLotesData();

    // Resetear límite de visualización
    currentDisplayLimitLotes = 50;

    // Actualizar tabla
    console.log('Actualizando tabla de lotes...');
    updateLotesTable();

    // Actualizar contador
    console.log('Actualizando contador de lotes...');
    updateLotesCounter();
}

function sortLotesData() {
    filteredLotesData.sort((a, b) => {
        switch (currentSortFieldLotes) {
            case 'fecha-desc':
                return b.fechaIngreso - a.fechaIngreso;
            case 'fecha-asc':
                return a.fechaIngreso - b.fechaIngreso;
            case 'roi-desc':
                return b.roi - a.roi;
            case 'roi-asc':
                return a.roi - b.roi;
            case 'ganancia-desc':
                return b.gananciaReal - a.gananciaReal;
            case 'stock-desc':
                return b.cantidadActual - a.cantidadActual;
            default:
                return 0;
        }
    });
}

function updateLotesTable() {
    console.log('=== Actualizando tabla de lotes ===');
    const tbody = document.getElementById('tabla-lotes');
    
    if (!tbody) {
        console.error('ERROR: tabla-lotes tbody no encontrado');
        return;
    }
    
    const lotesToShow = filteredLotesData.slice(0, currentDisplayLimitLotes);
    console.log(`Mostrando ${lotesToShow.length} lotes de ${filteredLotesData.length} filtrados`);
    
    if (lotesToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="12" class="px-4 py-8 text-center text-gray-500">
                    <i class="fas fa-search text-2xl mb-2"></i><br>
                    No se encontraron lotes con los filtros aplicados
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = lotesToShow.map(lote => {
        const roiClass = getRoiClass(lote.roi);
        const estadoClass = getEstadoClass(lote.estado);
        const gananciaClass = lote.gananciaReal >= 0 ? 'text-green-600' : 'text-red-600';
        const diasClass = getDiasClass(lote.diasEnInventario);
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="font-medium text-blue-600">${lote.loteId}</div>
                    <div class="text-xs text-gray-500">${lote.proveedor}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">${lote.productoNombre}</div>
                    <div class="text-xs text-purple-600">${lote.categoria}</div>
                </td>
                <td class="px-4 py-3 text-center text-sm">
                    ${lote.fechaIngreso.toLocaleDateString('es-ES')}
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-medium">S/ ${lote.costoUnitario.toFixed(2)}</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="font-medium">${lote.cantidadOriginal}</span>
                    ${lote.cantidadOriginal === 0 && lote.cantidadActual === 0 && lote.cantidadVendida === 0 ? 
                        '<div class="text-xs text-orange-600 mt-1"><i class="fas fa-exclamation-triangle"></i> Sin datos</div>' : ''}
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="font-medium ${lote.cantidadActual > 0 ? 'text-green-600' : 'text-red-600'}">
                        ${lote.cantidadActual}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="font-medium ${lote.cantidadVendida > 0 ? 'text-blue-600' : 'text-gray-400'}">
                        ${lote.cantidadVendida}
                    </span>
                    ${lote.cantidadVendida === 0 && lote.cantidadActual === 0 && lote.cantidadOriginal > 0 ? 
                        '<div class="text-xs text-yellow-600 mt-1">Posiblemente vendido</div>' : ''}
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-medium text-blue-600">S/ ${lote.inversionTotal.toFixed(2)}</span>
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-medium ${gananciaClass}">S/ ${lote.gananciaReal.toFixed(2)}</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="font-bold ${roiClass}">${lote.roi.toFixed(1)}%</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-xs font-medium ${estadoClass}">
                        ${getEstadoText(lote.estado)}
                    </span>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded text-xs ${diasClass}">
                        ${lote.diasEnInventario}d
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log(`HTML de tabla generado exitosamente para ${lotesToShow.length} lotes`);
    
    // Actualizar botón "Mostrar más"
    const btnMostrarMas = document.getElementById('btn-mostrar-mas-lotes');
    if (filteredLotesData.length > currentDisplayLimitLotes) {
        btnMostrarMas.style.display = 'block';
    } else {
        btnMostrarMas.style.display = 'none';
    }
    
    console.log('Tabla de lotes actualizada exitosamente');
}

function updateLotesCounter() {
    const totalFiltrados = filteredLotesData.length;
    const totalMostrados = Math.min(currentDisplayLimitLotes, totalFiltrados);
    
    document.getElementById('contador-lotes-filtrados').textContent = 
        `Mostrando ${totalMostrados} de ${totalFiltrados} lotes`;
    
    document.getElementById('lotes-mostrados').textContent = totalMostrados;
}

function updateLotesSummary() {
    console.log('=== Actualizando resumen de lotes ===');
    const totalLotes = currentLotesData.length;
    const lotesActivos = currentLotesData.filter(l => l.cantidadActual > 0).length;
    const inversionTotal = currentLotesData.reduce((sum, l) => sum + l.inversionTotal, 0);
    
    console.log(`Resumen calculado: ${totalLotes} total, ${lotesActivos} activos, S/ ${inversionTotal.toFixed(2)} inversión`);
    
    // ROI promedio ponderado por inversión
    let roiPonderado = 0;
    let inversionParaROI = 0;
    currentLotesData.forEach(lote => {
        if (lote.inversionTotal > 0 && !isNaN(lote.roi)) {
            roiPonderado += lote.roi * lote.inversionTotal;
            inversionParaROI += lote.inversionTotal;
        }
    });
    const roiPromedio = inversionParaROI > 0 ? roiPonderado / inversionParaROI : 0;
    
    // Actualizar elementos del DOM
    const elementos = {
        'total-lotes': totalLotes,
        'lotes-activos': lotesActivos,
        'roi-promedio-lotes': `${roiPromedio.toFixed(1)}%`,
        'inversion-total-lotes': `S/ ${inversionTotal.toFixed(2)}`
    };
    
    for (const [id, valor] of Object.entries(elementos)) {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.textContent = valor;
            console.log(`${id} actualizado: ${valor}`);
        } else {
            console.error(`ERROR: Elemento ${id} no encontrado`);
        }
    }
    
    console.log('Resumen de lotes actualizado exitosamente');
}

function showMoreLotes() {
    currentDisplayLimitLotes += 50;
    updateLotesTable();
    updateLotesCounter();
}

function exportLotesToCSV() {
    if (filteredLotesData.length === 0) {
        alert('No hay datos para exportar');
        return;
    }
    
    const headers = [
        'Lote',
        'Producto',
        'Fecha Ingreso',
        'Costo Unitario',
        'Cantidad Original',
        'Stock Actual',
        'Vendido',
        'Inversión Total',
        'Ganancia Real',
        'ROI %',
        'Estado',
        'Días en Inventario',
        'Proveedor'
    ];
    
    const csvContent = [
        headers.join(','),
        ...filteredLotesData.map(lote => [
            `"${lote.loteId}"`,
            `"${lote.productoNombre}"`,
            lote.fechaIngreso.toLocaleDateString('es-ES'),
            lote.costoUnitario.toFixed(2),
            lote.cantidadOriginal,
            lote.cantidadActual,
            lote.cantidadVendida,
            lote.inversionTotal.toFixed(2),
            lote.gananciaReal.toFixed(2),
            lote.roi.toFixed(1),
            getEstadoText(lote.estado),
            lote.diasEnInventario,
            `"${lote.proveedor}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `analisis-lotes-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Funciones auxiliares para el análisis por lotes
function getRoiClass(roi) {
    if (roi < 0) return 'text-red-600';
    if (roi < 20) return 'text-orange-600';
    if (roi < 50) return 'text-yellow-600';
    return 'text-green-600';
}

function getEstadoClass(estado) {
    switch (estado) {
        case 'activo':
            return 'bg-green-100 text-green-800';
        case 'parcial':
            return 'bg-yellow-100 text-yellow-800';
        case 'agotado':
            return 'bg-blue-100 text-blue-800';
        case 'vacio':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getEstadoText(estado) {
    switch (estado) {
        case 'activo':
            return 'Activo';
        case 'parcial':
            return 'Parcial';
        case 'agotado':
            return 'Agotado';
        case 'vacio':
            return 'Vacío';
        default:
            return 'Desconocido';
    }
}

function getDiasClass(dias) {
    if (dias > 90) return 'bg-red-100 text-red-800';
    if (dias > 60) return 'bg-yellow-100 text-yellow-800';
    if (dias > 30) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
}

// ========================================================================
// FUNCIONES AUXILIARES PARA CORRECCIÓN DE DATOS DE LOTES
// ========================================================================

/**
 * Verifica y corrige lotes que tengan datos incompletos o inconsistentes
 */
async function verificarYCorregirLotesIncompletos() {
    console.log('=== Verificando lotes con datos incompletos ===');
    
    const lotesProblematicos = currentLotesData.filter(lote => 
        lote.cantidadActual === 0 && lote.cantidadVendida === 0 && lote.cantidadOriginal === 0
    );
    
    if (lotesProblematicos.length === 0) {
        console.log('No se encontraron lotes con datos incompletos');
        return;
    }
    
    console.log(`Encontrados ${lotesProblematicos.length} lotes con datos incompletos:`, 
                lotesProblematicos.map(l => ({ loteId: l.loteId, producto: l.productoNombre })));
    
    // Intentar recuperar datos desde otras fuentes
    for (const lote of lotesProblematicos) {
        try {
            // Buscar en la colección de compras para obtener cantidad original
            const comprasSnapshot = await window.db.collection('compras')
                .where('lotes', 'array-contains-any', [lote.loteId])
                .get();
            
            let cantidadOriginalEncontrada = 0;
            comprasSnapshot.forEach(compraDoc => {
                const compra = compraDoc.data();
                if (compra.lotes && Array.isArray(compra.lotes)) {
                    compra.lotes.forEach(loteCompra => {
                        if (loteCompra.loteId === lote.loteId) {
                            cantidadOriginalEncontrada = loteCompra.cantidad || 0;
                        }
                    });
                }
                // También verificar en items de compra
                if (compra.items && Array.isArray(compra.items)) {
                    compra.items.forEach(item => {
                        if (item.loteId === lote.loteId) {
                            cantidadOriginalEncontrada = item.quantity || item.cantidad || 0;
                        }
                    });
                }
            });
            
            if (cantidadOriginalEncontrada > 0) {
                console.log(`Cantidad original encontrada para lote ${lote.loteId}: ${cantidadOriginalEncontrada}`);
                
                // Actualizar el lote en currentLotesData
                const loteIndex = currentLotesData.findIndex(l => l.id === lote.id);
                if (loteIndex !== -1) {
                    currentLotesData[loteIndex].cantidadOriginal = cantidadOriginalEncontrada;
                    
                    // Recalcular métricas
                    const loteActualizado = currentLotesData[loteIndex];
                    loteActualizado.inversionTotal = cantidadOriginalEncontrada * loteActualizado.costoUnitario;
                    
                    // Si toda la cantidad original fue vendida, actualizar estado
                    if (loteActualizado.cantidadActual === 0 && cantidadOriginalEncontrada > 0) {
                        loteActualizado.cantidadVendida = cantidadOriginalEncontrada;
                        loteActualizado.estado = 'agotado';
                        
                        // Recalcular ganancia
                        const precioVentaActual = currentProductsData.find(p => p.id === loteActualizado.productoId)?.precio || 0;
                        loteActualizado.ingresoReal = loteActualizado.cantidadVendida * precioVentaActual;
                        loteActualizado.gananciaReal = loteActualizado.ingresoReal - (loteActualizado.cantidadVendida * loteActualizado.costoUnitario);
                        loteActualizado.roi = loteActualizado.inversionTotal > 0 ? (loteActualizado.gananciaReal / loteActualizado.inversionTotal) * 100 : 0;
                    }
                    
                    console.log(`Lote ${lote.loteId} actualizado:`, {
                        cantidadOriginal: loteActualizado.cantidadOriginal,
                        cantidadVendida: loteActualizado.cantidadVendida,
                        estado: loteActualizado.estado,
                        roi: loteActualizado.roi
                    });
                }
            }
            
        } catch (error) {
            console.error(`Error verificando lote ${lote.loteId}:`, error);
        }
    }
    
    console.log('Verificación y corrección de lotes completada');
}

// ========================================================================
// FUNCIONES PARA ANÁLISIS HISTÓRICO BASADO EN LOTES
// ========================================================================

/**
 * Calcula métricas históricas basadas en lotes reales y ventas reales
 * @param {string} categoryId - ID de la categoría a filtrar (opcional)
 * @returns {Promise<Object>} - Objeto con métricas históricas calculadas desde lotes y ventas
 */
async function calcularHistoricoDesdeOriginalLotes(categoryId = null) {
    try {
        console.log('=== Calculando histórico desde lotes originales y ventas reales ===');
        
        // Variables para acumular datos
        let inversionHistoricaTotal = 0;
        let unidadesTotalesOriginales = 0;
        let unidadesVendidas = 0;
        let ingresosPorVentasReales = 0;
        let valorVentaEsperadoTotal = 0; // Nuevo: valor esperado si se vendiera todo
        let lotesTotales = 0;
        let lotesAgotados = 0;
        
        // Obtener datos de productos para filtrado por categoría
        const productosMap = {};
        if (window.productsCache) {
            window.productsCache.forEach(product => {
                productosMap[product.id] = {
                    nombre: product.name,
                    precio: product.price || 0,
                    categoria: product.category || 'Sin categoría',
                    categoryId: product.categoryId
                };
            });
        }
        
        // Consultar todos los lotes de stock
        console.log('Consultando lotes...');
        const lotesSnapshot = await window.db.collection('stock_por_lote').get();
        console.log(`Encontrados ${lotesSnapshot.size} lotes en total`);
        
        // Lista de productos procesados para obtener ventas reales
        const productosParaVentas = new Set();
        
        // Procesar cada lote
        lotesSnapshot.forEach(doc => {
            const lote = doc.data();
            const producto = productosMap[lote.productoId] || {};
            
            // Filtrar por categoría si se especifica
            if (categoryId && categoryId !== 'todas') {
                if (producto.categoria !== categoryId) {
                    return; // Saltar este lote
                }
            }
            
            lotesTotales++;
            productosParaVentas.add(lote.productoId);
            
            // Obtener datos del lote
            const cantidadActual = lote.cantidad || 0;
            const costoUnitario = lote.costoUnitario || 0;
            
            // Determinar cantidad original del lote
            let cantidadOriginal = 0;
            if (lote.cantidadInicial) {
                cantidadOriginal = lote.cantidadInicial;
            } else if (lote.cantidadOriginal) {
                cantidadOriginal = lote.cantidadOriginal;
            } else if (lote.cantidadIngreso) {
                cantidadOriginal = lote.cantidadIngreso;
            } else {
                cantidadOriginal = cantidadActual; // Fallback temporal
            }
            
            // Calcular cantidad vendida
            const cantidadVendida = Math.max(0, cantidadOriginal - cantidadActual);
            
            // Acumular métricas de inversión y unidades
            const inversionLote = cantidadOriginal * costoUnitario;
            const precioProducto = producto.precio || 0; // Validar precio del producto
            const valorVentaLote = cantidadOriginal * precioProducto; // Valor esperado del lote
            
            inversionHistoricaTotal += inversionLote;
            unidadesTotalesOriginales += cantidadOriginal;
            unidadesVendidas += cantidadVendida;
            valorVentaEsperadoTotal += valorVentaLote;
            
            // Contar lotes agotados
            if (cantidadActual === 0 && cantidadOriginal > 0) {
                lotesAgotados++;
            }
            
            console.log(`Lote procesado: ${lote.loteId} - Original: ${cantidadOriginal}, Actual: ${cantidadActual}, Vendido: ${cantidadVendida}, Inversión: S/ ${inversionLote.toFixed(2)}, Valor venta: S/ ${valorVentaLote.toFixed(2)}`);
            
            // Debug para detectar NaN
            if (isNaN(valorVentaLote)) {
                console.error(`ERROR: Valor de venta NaN para lote ${lote.loteId}:`, {
                    cantidadOriginal,
                    precioProducto,
                    producto: producto,
                    loteId: lote.loteId,
                    productoId: lote.productoId
                });
            }
        });
        
        // Calcular ingresos reales desde la colección de ventas
        console.log('Calculando ingresos reales desde ventas...');
        const ventasSnapshot = await window.db.collection('sales').get();
        
        ventasSnapshot.forEach(doc => {
            const venta = doc.data();
            const ventaItems = venta.items || [];
            
            ventaItems.forEach(item => {
                const productId = item.productId;
                const producto = productosMap[productId];
                
                // Filtrar por categoría si se especifica
                if (categoryId && categoryId !== 'todas') {
                    if (!producto || producto.categoria !== categoryId) {
                        return;
                    }
                }
                
                // Solo incluir productos que tienen lotes o son legacy de la categoría
                if (productosParaVentas.has(productId) || !producto) {
                    const cantidadVendida = item.quantity || 0;
                    const precioVenta = item.price || 0;
                    const ingresoItem = cantidadVendida * precioVenta;
                    
                    ingresosPorVentasReales += ingresoItem;
                    
                    console.log(`Venta procesada: ${producto?.nombre || 'Producto desconocido'} - Cantidad: ${cantidadVendida}, Precio: S/ ${precioVenta}, Ingreso: S/ ${ingresoItem.toFixed(2)}`);
                }
            });
        });
        
        // Procesar productos legacy (sin sistema de lotes)
        console.log('Procesando productos legacy...');
        const datosLegacy = await procesarProductosLegacy(categoryId);
        
        // Sumar datos legacy
        inversionHistoricaTotal += datosLegacy.inversionLegacy;
        unidadesTotalesOriginales += datosLegacy.unidadesLegacy;
        unidadesVendidas += datosLegacy.unidadesVendidasLegacy;
        ingresosPorVentasReales += datosLegacy.ingresosLegacy;
        valorVentaEsperadoTotal += datosLegacy.valorVentaEsperadoLegacy || 0;
        
        // Calcular métricas derivadas
        const gananciaTotal = ingresosPorVentasReales - inversionHistoricaTotal;
        const margenPromedio = ingresosPorVentasReales > 0 ? (gananciaTotal / ingresosPorVentasReales) * 100 : 0;
        const roi = inversionHistoricaTotal > 0 ? (gananciaTotal / inversionHistoricaTotal) * 100 : 0;
        const porcentajeVendido = unidadesTotalesOriginales > 0 ? (unidadesVendidas / unidadesTotalesOriginales) * 100 : 0;
        
        // Calcular ganancia esperada total (si se vendiera todo)
        const gananciaEsperadaTotal = valorVentaEsperadoTotal - inversionHistoricaTotal;
        const roiEsperado = inversionHistoricaTotal > 0 ? (gananciaEsperadaTotal / inversionHistoricaTotal) * 100 : 0;
        
        // Debug de los valores finales
        console.log('=== DEBUG VALORES FINALES ===');
        console.log('valorVentaEsperadoTotal:', valorVentaEsperadoTotal);
        console.log('inversionHistoricaTotal:', inversionHistoricaTotal);
        console.log('gananciaEsperadaTotal:', gananciaEsperadaTotal);
        console.log('roiEsperado:', roiEsperado);
        
        // Validar NaN
        if (isNaN(valorVentaEsperadoTotal) || isNaN(gananciaEsperadaTotal)) {
            console.error('ERROR: Valores NaN detectados en cálculo final');
            console.error('valorVentaEsperadoTotal es NaN:', isNaN(valorVentaEsperadoTotal));
            console.error('gananciaEsperadaTotal es NaN:', isNaN(gananciaEsperadaTotal));
        }
        
        const resultado = {
            // Datos básicos
            inversionHistoricaTotal,
            unidadesTotalesOriginales,
            unidadesVendidas,
            ingresosPorVentas: ingresosPorVentasReales,
            gananciaTotal,
            
            // Nuevos datos para histórico total esperado
            valorVentaEsperadoTotal,
            gananciaEsperadaTotal,
            roiEsperado,
            
            // Métricas calculadas
            margenPromedio,
            roi,
            porcentajeVendido,
            
            // Estadísticas de lotes
            lotesTotales,
            lotesAgotados,
            lotesActivos: lotesTotales - lotesAgotados,
            
            // Datos legacy
            tieneProductosLegacy: datosLegacy.productosLegacy > 0,
            productosLegacy: datosLegacy.productosLegacy
        };
        
        console.log('=== Resultado del cálculo histórico real ===');
        console.log('Inversión histórica total:', `S/ ${resultado.inversionHistoricaTotal.toFixed(2)}`);
        console.log('Unidades totales originales:', resultado.unidadesTotalesOriginales);
        console.log('Unidades vendidas:', resultado.unidadesVendidas);
        console.log('Ingresos por ventas REALES:', `S/ ${resultado.ingresosPorVentas.toFixed(2)}`);
        console.log('Ganancia total REAL:', `S/ ${resultado.gananciaTotal.toFixed(2)}`);
        console.log('ROI REAL:', `${resultado.roi.toFixed(2)}%`);
        console.log('Lotes procesados:', resultado.lotesTotales);
        console.log('Productos legacy:', resultado.productosLegacy);
        
        return resultado;
        
    } catch (error) {
        console.error('Error calculando histórico desde lotes:', error);
        return {
            inversionHistoricaTotal: 0,
            unidadesTotalesOriginales: 0,
            unidadesVendidas: 0,
            ingresosPorVentas: 0,
            gananciaTotal: 0,
            margenPromedio: 0,
            roi: 0,
            porcentajeVendido: 0,
            lotesTotales: 0,
            lotesAgotados: 0,
            lotesActivos: 0,
            tieneProductosLegacy: false,
            productosLegacy: 0,
            error: error.message
        };
    }
}

/**
 * Procesa productos que no usan el sistema de lotes (productos legacy)
 * @param {string} categoryId - ID de la categoría a filtrar (opcional)
 * @returns {Promise<Object>} - Datos de productos legacy
 */
async function procesarProductosLegacy(categoryId = null) {
    try {
        console.log('Procesando productos legacy...');
        
        let inversionLegacy = 0;
        let unidadesLegacy = 0;
        let unidadesVendidasLegacy = 0;
        let ingresosLegacy = 0;
        let valorVentaEsperadoLegacy = 0; // Nuevo: valor esperado de productos legacy
        let productosLegacy = 0;
        
        // Obtener productos que no tienen lotes o que explícitamente no usan lotes
        const productos = window.productsCache || [];
        
        // Obtener ventas reales para productos legacy
        console.log('Consultando ventas para productos legacy...');
        const ventasSnapshot = await window.db.collection('sales').get();
        const ventasPorProducto = {};
        
        ventasSnapshot.forEach(doc => {
            const venta = doc.data();
            const ventaItems = venta.items || [];
            
            ventaItems.forEach(item => {
                const productId = item.productId;
                const cantidad = item.quantity || 0;
                const precio = item.price || 0;
                
                if (!ventasPorProducto[productId]) {
                    ventasPorProducto[productId] = {
                        cantidadVendida: 0,
                        ingresoTotal: 0
                    };
                }
                
                ventasPorProducto[productId].cantidadVendida += cantidad;
                ventasPorProducto[productId].ingresoTotal += (cantidad * precio);
            });
        });
        
        for (const product of productos) {
            // Filtrar por categoría si se especifica
            if (categoryId && categoryId !== 'todas' && product.category !== categoryId) {
                continue;
            }
            
            // Verificar si el producto tiene lotes en el sistema
            const tieneLotes = await verificarSiProductoTieneLotes(product.id);
            
            if (!tieneLotes) {
                productosLegacy++;
                
                // Usar datos del producto
                const stockInicial = product.stockInicial || 0;
                const stockActual = product.stock || 0;
                const costoAdquisicion = product.acquisitionCost || product.cost || product.costo || 0;
                
                // Obtener ventas reales de este producto
                const ventasProducto = ventasPorProducto[product.id] || { cantidadVendida: 0, ingresoTotal: 0 };
                const unidadesVendidasReales = ventasProducto.cantidadVendida;
                const ingresosReales = ventasProducto.ingresoTotal;
                
                // Acumular datos
                const inversionProducto = stockInicial * costoAdquisicion;
                const valorVentaEsperadoProducto = stockInicial * (product.price || 0); // Valor esperado si se vendiera todo
                
                inversionLegacy += inversionProducto;
                unidadesLegacy += stockInicial;
                unidadesVendidasLegacy += unidadesVendidasReales;
                ingresosLegacy += ingresosReales;
                valorVentaEsperadoLegacy += valorVentaEsperadoProducto;
                
                console.log(`Producto legacy: ${product.name} - Stock inicial: ${stockInicial}, Vendido real: ${unidadesVendidasReales}, Ingresos reales: S/ ${ingresosReales.toFixed(2)}`);
            }
        }
        
        console.log(`Productos legacy procesados: ${productosLegacy}`);
        console.log(`Inversión legacy total: S/ ${inversionLegacy.toFixed(2)}`);
        console.log(`Ingresos legacy reales: S/ ${ingresosLegacy.toFixed(2)}`);
        
        return {
            inversionLegacy,
            unidadesLegacy,
            unidadesVendidasLegacy,
            ingresosLegacy,
            valorVentaEsperadoLegacy,
            productosLegacy
        };
        
    } catch (error) {
        console.error('Error procesando productos legacy:', error);
        return {
            inversionLegacy: 0,
            unidadesLegacy: 0,
            unidadesVendidasLegacy: 0,
            ingresosLegacy: 0,
            valorVentaEsperadoLegacy: 0,
            productosLegacy: 0
        };
    }
}

/**
 * Verifica si un producto tiene lotes en el sistema
 * @param {string} productId - ID del producto
 * @returns {Promise<boolean>} - true si tiene lotes, false si no
 */
async function verificarSiProductoTieneLotes(productId) {
    try {
        const lotesSnapshot = await window.db.collection('stock_por_lote')
            .where('productoId', '==', productId)
            .limit(1)
            .get();
        
        return !lotesSnapshot.empty;
    } catch (error) {
        console.error(`Error verificando lotes para producto ${productId}:`, error);
        return false;
    }
}

console.log('admin-rentabilidad.js cargado completamente');
