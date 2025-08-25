// admin-compras.js - Gestión de Compras
console.log('Cargando admin-compras.js...');

window.loadCompras = function() {
    console.log('Ejecutando loadCompras...');
    const content = `
        <div class="space-y-6">
            <!-- Resumen de Compras -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                            <i class="fas fa-shopping-bag text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Compras Este Mes</p>
                            <p class="text-2xl font-semibold text-gray-900" id="compras-mes">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-500">
                            <i class="fas fa-dollar-sign text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Inversión Total</p>
                            <p class="text-2xl font-semibold text-green-600" id="inversion-total">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-purple-100 text-purple-500">
                            <i class="fas fa-truck text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Proveedores</p>
                            <p class="text-2xl font-semibold text-purple-600" id="total-proveedores">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100 text-yellow-500">
                            <i class="fas fa-chart-line text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">ROI Promedio</p>
                            <p class="text-2xl font-semibold text-yellow-600" id="roi-promedio">0%</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Panel de Control -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                        <h3 class="text-lg font-semibold text-gray-900">Gestión de Compras</h3>
                        <div class="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                            <button id="nueva-compra-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                                <i class="fas fa-plus mr-2"></i>Nueva Compra
                            </button>
                            <button id="gestionar-proveedores-btn" class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                                <i class="fas fa-truck mr-2"></i>Proveedores
                            </button>
                            <button id="analisis-rentabilidad-btn" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                <i class="fas fa-chart-bar mr-2"></i>Análisis ROI
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Filtros -->
                <div class="p-4 bg-gray-50 border-b border-gray-200">
                    <div class="flex flex-wrap gap-4">
                        <div class="relative">
                            <input type="text" id="search-compras" placeholder="Buscar compra..."
                                   class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                        </div>
                        <select id="filter-proveedor" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="">Todos los proveedores</option>
                        </select>
                        <input type="date" id="filter-fecha-desde" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        <input type="date" id="filter-fecha-hasta" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        <button id="limpiar-filtros-btn" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                            <i class="fas fa-eraser mr-2"></i>Limpiar
                        </button>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invertido</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendido</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="compras-table" class="bg-white divide-y divide-gray-200">
                            <tr>
                                <td colspan="8" class="px-6 py-4 text-center text-gray-500">Cargando compras...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700" id="compras-count">Mostrando 0 compras</span>
                        <div class="flex space-x-2">
                            <button id="export-compras-btn" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                <i class="fas fa-download mr-1"></i>Exportar
                            </button>
                            <button id="print-compras-btn" class="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">
                                <i class="fas fa-print mr-1"></i>Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Nueva Compra -->
        <div id="modal-nueva-compra" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <h3 class="text-lg font-semibold mb-4">Registrar Nueva Compra</h3>
                <form id="form-nueva-compra">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                            <select id="proveedor-compra" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                <option value="">Seleccionar proveedor</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Compra</label>
                            <input type="date" id="fecha-compra" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Número de Factura</label>
                            <input type="text" id="factura-compra" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Opcional">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                            <select id="metodo-pago-compra" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="cheque">Cheque</option>
                                <option value="credito">Crédito</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                        <textarea id="observaciones-compra" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Observaciones adicionales..."></textarea>
                    </div>
                    
                    <!-- Productos de la compra -->
                    <div class="mb-4">
                        <div class="flex justify-between items-center mb-3">
                            <h4 class="text-md font-semibold">Productos</h4>
                            <button type="button" id="agregar-producto-compra" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                <i class="fas fa-plus mr-1"></i>Agregar Producto
                            </button>
                        </div>
                        
                        <div class="overflow-x-auto">
                            <table class="min-w-full border border-gray-200 rounded-lg">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Cantidad</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio Compra</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Acción</th>
                                    </tr>
                                </thead>
                                <tbody id="productos-compra-table">
                                    <tr>
                                        <td colspan="5" class="px-4 py-4 text-center text-gray-500">No hay productos agregados</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-3 text-right">
                            <span class="text-lg font-semibold">Total: S/ <span id="total-compra">0.00</span></span>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelar-nueva-compra" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Registrar Compra
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal Agregar Producto -->
        <div id="modal-agregar-producto" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">Agregar Producto</h3>
                <form id="form-agregar-producto">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                        <select id="producto-seleccion" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="">Seleccionar producto</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                        <input type="number" id="cantidad-producto" min="1" step="1" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Precio de Compra (por unidad)</label>
                        <input type="number" id="precio-compra-producto" min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelar-agregar-producto" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                            Agregar
                        </button>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Modal Gestionar Proveedores -->
        <div id="modal-proveedores" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Gestionar Proveedores</h3>
                    <button id="nuevo-proveedor-btn" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                        <i class="fas fa-plus mr-1"></i>Nuevo
                    </button>
                </div>
                
                <div class="space-y-3" id="lista-proveedores">
                    <div class="text-center text-gray-500 py-4">Cargando proveedores...</div>
                </div>
                
                <div class="flex justify-end mt-6">
                    <button id="cerrar-proveedores" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Modal Nuevo Proveedor -->
        <div id="modal-nuevo-proveedor" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">Nuevo Proveedor</h3>
                <form id="form-nuevo-proveedor">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Proveedor</label>
                        <input type="text" id="nombre-proveedor" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Contacto</label>
                        <input type="text" id="contacto-proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                        <input type="tel" id="telefono-proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" id="email-proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                        <textarea id="direccion-proveedor" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"></textarea>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelar-nuevo-proveedor" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = content;
    
    // Establecer fecha por defecto
    document.getElementById('fecha-compra').value = new Date().toISOString().split('T')[0];
    
    setupComprasEventListeners();
    loadComprasData();
};

let productosCompraActual = [];

function setupComprasEventListeners() {
    // Botones principales
    document.getElementById('nueva-compra-btn').addEventListener('click', abrirModalNuevaCompra);
    document.getElementById('gestionar-proveedores-btn').addEventListener('click', abrirModalProveedores);
    document.getElementById('analisis-rentabilidad-btn').addEventListener('click', mostrarAnalisisROI);
    
    // Filtros
    document.getElementById('search-compras').addEventListener('input', filtrarCompras);
    document.getElementById('filter-proveedor').addEventListener('change', filtrarCompras);
    document.getElementById('filter-fecha-desde').addEventListener('change', filtrarCompras);
    document.getElementById('filter-fecha-hasta').addEventListener('change', filtrarCompras);
    document.getElementById('limpiar-filtros-btn').addEventListener('click', limpiarFiltros);
    
    // Modal nueva compra
    document.getElementById('cancelar-nueva-compra').addEventListener('click', () => {
        document.getElementById('modal-nueva-compra').classList.remove('active');
    });
    document.getElementById('form-nueva-compra').addEventListener('submit', registrarCompra);
    document.getElementById('agregar-producto-compra').addEventListener('click', abrirModalAgregarProducto);
    
    // Modal agregar producto
    document.getElementById('cancelar-agregar-producto').addEventListener('click', () => {
        document.getElementById('modal-agregar-producto').classList.remove('active');
    });
    document.getElementById('form-agregar-producto').addEventListener('submit', agregarProductoCompra);
    
    // Modal proveedores
    document.getElementById('cerrar-proveedores').addEventListener('click', () => {
        document.getElementById('modal-proveedores').classList.remove('active');
    });
    document.getElementById('nuevo-proveedor-btn').addEventListener('click', abrirModalNuevoProveedor);
    
    // Modal nuevo proveedor
    document.getElementById('cancelar-nuevo-proveedor').addEventListener('click', () => {
        document.getElementById('modal-nuevo-proveedor').classList.remove('active');
    });
    document.getElementById('form-nuevo-proveedor').addEventListener('submit', crearProveedor);
    
    // Botones de exportar/imprimir
    document.getElementById('export-compras-btn').addEventListener('click', exportarCompras);
    document.getElementById('print-compras-btn').addEventListener('click', imprimirCompras);
}

async function loadComprasData() {
    try {
        // Cargar proveedores
        await loadProveedores();
        
        // Cargar compras
        await loadCompras();
        
        // Cargar productos para el selector
        loadProductosSelector();
        
        // Actualizar estadísticas
        updateComprasStats();
        
    } catch (error) {
        console.error('Error cargando datos de compras:', error);
        showNotification('Error cargando datos de compras', 'error');
    }
}

async function loadProveedores() {
    try {
        const querySnapshot = await window.db.collection('proveedores').get();
        window.proveedoresCache = [];
        querySnapshot.forEach((doc) => {
            window.proveedoresCache.push({ id: doc.id, ...doc.data() });
        });
        
        // Actualizar selectores
        updateProveedoresSelectors();
        
        // Actualizar estadísticas después de cargar proveedores
        updateComprasStats();
        
        console.log(`Cargados ${window.proveedoresCache.length} proveedores`);
    } catch (error) {
        console.error('Error cargando proveedores:', error);
        window.proveedoresCache = [];
    }
}

async function loadCompras() {
    try {
        const querySnapshot = await window.db.collection('compras').orderBy('fecha', 'desc').get();
        window.comprasCache = [];
        querySnapshot.forEach((doc) => {
            window.comprasCache.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Cargadas ${window.comprasCache.length} compras`);
        filtrarCompras();
    } catch (error) {
        console.error('Error cargando compras:', error);
        window.comprasCache = [];
    }
}

function updateProveedoresSelectors() {
    // Selector en nueva compra
    const selectorCompra = document.getElementById('proveedor-compra');
    if (selectorCompra) {
        selectorCompra.innerHTML = '<option value="">Seleccionar proveedor</option>';
    }
    
    // Filtro
    const filtroProveedor = document.getElementById('filter-proveedor');
    if (filtroProveedor) {
        filtroProveedor.innerHTML = '<option value="">Todos los proveedores</option>';
    }
    
    if (window.proveedoresCache) {
        window.proveedoresCache.forEach(proveedor => {
            if (selectorCompra) {
                const optionCompra = new Option(proveedor.nombre, proveedor.id);
                selectorCompra.appendChild(optionCompra);
            }
            
            if (filtroProveedor) {
                const optionFiltro = new Option(proveedor.nombre, proveedor.id);
                filtroProveedor.appendChild(optionFiltro);
            }
        });
    }
}

function loadProductosSelector() {
    const selector = document.getElementById('producto-seleccion');
    if (selector) {
        selector.innerHTML = '<option value="">Seleccionar producto</option>';
        
        if (window.productsCache) {
            window.productsCache.forEach(product => {
                const option = new Option(product.name, product.id);
                selector.appendChild(option);
            });
        }
    }
}

function abrirModalNuevaCompra() {
    productosCompraActual = [];
    document.getElementById('form-nueva-compra').reset();
    document.getElementById('fecha-compra').value = new Date().toISOString().split('T')[0];
    updateProductosCompraTable();
    document.getElementById('modal-nueva-compra').classList.add('active');
}

function abrirModalAgregarProducto() {
    document.getElementById('form-agregar-producto').reset();
    document.getElementById('modal-agregar-producto').classList.add('active');
}

function agregarProductoCompra(e) {
    e.preventDefault();
    
    const productoId = document.getElementById('producto-seleccion').value;
    const cantidad = parseInt(document.getElementById('cantidad-producto').value);
    const precioCompra = parseFloat(document.getElementById('precio-compra-producto').value);
    
    const producto = window.productsCache.find(p => p.id === productoId);
    if (!producto) return;
    
    // Verificar si el producto ya está agregado
    const existeIndex = productosCompraActual.findIndex(p => p.id === productoId);
    if (existeIndex !== -1) {
        // Actualizar cantidad y precio
        productosCompraActual[existeIndex].cantidad += cantidad;
        productosCompraActual[existeIndex].precioCompra = precioCompra;
    } else {
        // Agregar nuevo producto
        productosCompraActual.push({
            id: productoId,
            nombre: producto.name,
            cantidad: cantidad,
            precioCompra: precioCompra,
            subtotal: cantidad * precioCompra
        });
    }
    
    updateProductosCompraTable();
    document.getElementById('modal-agregar-producto').classList.remove('active');
}

function updateProductosCompraTable() {
    const tbody = document.getElementById('productos-compra-table');
    const totalElement = document.getElementById('total-compra');
    
    if (productosCompraActual.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">No hay productos agregados</td></tr>';
        totalElement.textContent = '0.00';
        return;
    }
    
    let total = 0;
    tbody.innerHTML = productosCompraActual.map((producto, index) => {
        const subtotal = producto.cantidad * producto.precioCompra;
        total += subtotal;
        
        return `
            <tr>
                <td class="px-4 py-2">${producto.nombre}</td>
                <td class="px-4 py-2">${producto.cantidad}</td>
                <td class="px-4 py-2">S/ ${producto.precioCompra.toFixed(2)}</td>
                <td class="px-4 py-2">S/ ${subtotal.toFixed(2)}</td>
                <td class="px-4 py-2">
                    <button type="button" onclick="eliminarProductoCompra(${index})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    totalElement.textContent = total.toFixed(2);
}

function eliminarProductoCompra(index) {
    productosCompraActual.splice(index, 1);
    updateProductosCompraTable();
}

async function registrarCompra(e) {
    e.preventDefault();
    
    if (productosCompraActual.length === 0) {
        alert('Debe agregar al menos un producto');
        return;
    }
    
    try {
        const proveedorId = document.getElementById('proveedor-compra').value;
        const fecha = document.getElementById('fecha-compra').value;
        const factura = document.getElementById('factura-compra').value;
        const metodoPago = document.getElementById('metodo-pago-compra').value;
        const observaciones = document.getElementById('observaciones-compra').value;
        
        const totalInvertido = productosCompraActual.reduce((sum, p) => sum + (p.cantidad * p.precioCompra), 0);
        
        const compra = {
            proveedorId: proveedorId,
            fecha: fecha,
            factura: factura,
            metodoPago: metodoPago,
            observaciones: observaciones,
            productos: productosCompraActual.map(p => ({
                id: p.id,
                nombre: p.nombre,
                cantidad: p.cantidad,
                precioCompra: p.precioCompra,
                subtotal: p.cantidad * p.precioCompra
            })),
            totalInvertido: totalInvertido,
            totalVendido: 0,
            usuario: window.currentUser.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Registrar la compra
        const compraRef = await window.db.collection('compras').add(compra);
        
        // Actualizar stock de productos
        const batch = window.db.batch();
        
        for (const producto of productosCompraActual) {
            const productoRef = window.db.collection('products').doc(producto.id);
            const productoDoc = await productoRef.get();
            
            if (productoDoc.exists) {
                const stockActual = productoDoc.data().stock || 0;
                batch.update(productoRef, {
                    stock: stockActual + producto.cantidad
                });
                
                // Actualizar cache local
                const productIndex = window.productsCache.findIndex(p => p.id === producto.id);
                if (productIndex !== -1) {
                    window.productsCache[productIndex].stock = stockActual + producto.cantidad;
                }
            }
        }
        
        await batch.commit();
        
        // Registrar movimientos de stock
        for (const producto of productosCompraActual) {
            const movimiento = {
                productoId: producto.id,
                fecha: fecha,
                tipo: 'aumentar',
                cantidad: producto.cantidad,
                motivo: 'compra',
                observaciones: `Compra - Factura: ${factura}`,
                usuario: window.currentUser.email,
                compraId: compraRef.id,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await window.db.collection('movimientos_stock').add(movimiento);
        }
        
        document.getElementById('modal-nueva-compra').classList.remove('active');
        loadCompras();
        updateComprasStats();
        
        showNotification('Compra registrada correctamente', 'success');
        
    } catch (error) {
        console.error('Error registrando compra:', error);
        showNotification('Error al registrar la compra', 'error');
    }
}

function filtrarCompras() {
    if (!window.comprasCache) return;
    
    const search = document.getElementById('search-compras').value.toLowerCase();
    const proveedorFilter = document.getElementById('filter-proveedor').value;
    const fechaDesde = document.getElementById('filter-fecha-desde').value;
    const fechaHasta = document.getElementById('filter-fecha-hasta').value;
    
    const comprasFiltradas = window.comprasCache.filter(compra => {
        const proveedor = window.proveedoresCache.find(p => p.id === compra.proveedorId);
        const nombreProveedor = proveedor ? proveedor.nombre.toLowerCase() : '';
        
        const matchSearch = nombreProveedor.includes(search) || 
                           (compra.factura && compra.factura.toLowerCase().includes(search));
        
        const matchProveedor = !proveedorFilter || compra.proveedorId === proveedorFilter;
        
        let matchFecha = true;
        if (fechaDesde || fechaHasta) {
            const fechaCompra = new Date(compra.fecha);
            if (fechaDesde) {
                matchFecha = matchFecha && fechaCompra >= new Date(fechaDesde);
            }
            if (fechaHasta) {
                matchFecha = matchFecha && fechaCompra <= new Date(fechaHasta);
            }
        }
        
        return matchSearch && matchProveedor && matchFecha;
    });
    
    renderComprasTable(comprasFiltradas);
    document.getElementById('compras-count').textContent = `Mostrando ${comprasFiltradas.length} compras`;
}

function renderComprasTable(compras) {
    const tbody = document.getElementById('compras-table');
    
    if (compras.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No se encontraron compras</td></tr>';
        return;
    }
    
    tbody.innerHTML = compras.map(compra => {
        const proveedor = window.proveedoresCache.find(p => p.id === compra.proveedorId);
        const nombreProveedor = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
        
        const fecha = new Date(compra.fecha).toLocaleDateString('es-PE');
        const numProductos = compra.productos ? compra.productos.length : 0;
        const totalInvertido = compra.totalInvertido || 0;
        const totalVendido = compra.totalVendido || 0;
        
        let roi = 0;
        let roiClass = 'text-gray-600';
        let estado = 'Pendiente';
        let estadoClass = 'bg-yellow-100 text-yellow-800';
        
        if (totalInvertido > 0) {
            roi = ((totalVendido - totalInvertido) / totalInvertido) * 100;
            
            if (roi > 0) {
                roiClass = 'text-green-600';
                estado = 'Rentable';
                estadoClass = 'bg-green-100 text-green-800';
            } else if (roi < 0) {
                roiClass = 'text-red-600';
                estado = 'Pérdida';
                estadoClass = 'bg-red-100 text-red-800';
            }
            
            if (totalVendido >= totalInvertido) {
                estado = 'Recuperado';
                estadoClass = 'bg-blue-100 text-blue-800';
            }
        }
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm">${fecha}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${nombreProveedor}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">${numProductos} productos</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">S/ ${totalInvertido.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">S/ ${totalVendido.toFixed(2)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${roiClass}">
                    ${roi.toFixed(1)}%
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoClass}">
                        ${estado}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="verDetalleCompra('${compra.id}')" class="text-blue-600 hover:text-blue-900" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editarCompra('${compra.id}')" class="text-green-600 hover:text-green-900" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateComprasStats() {
    if (!window.comprasCache) return;
    
    const fechaActual = new Date();
    const mesActual = fechaActual.getMonth();
    const añoActual = fechaActual.getFullYear();
    
    // Compras del mes actual
    const comprasMes = window.comprasCache.filter(compra => {
        const fechaCompra = new Date(compra.fecha);
        return fechaCompra.getMonth() === mesActual && fechaCompra.getFullYear() === añoActual;
    });
    
    // Inversión total
    const inversionTotal = window.comprasCache.reduce((sum, compra) => sum + (compra.totalInvertido || 0), 0);
    
    // Total de proveedores registrados (modificado para mostrar todos los proveedores)
    const totalProveedores = window.proveedoresCache ? window.proveedoresCache.length : 0;
    
    // ROI promedio
    let roiPromedio = 0;
    const comprasConVentas = window.comprasCache.filter(compra => (compra.totalVendido || 0) > 0);
    if (comprasConVentas.length > 0) {
        const roiTotal = comprasConVentas.reduce((sum, compra) => {
            const roi = ((compra.totalVendido - compra.totalInvertido) / compra.totalInvertido) * 100;
            return sum + roi;
        }, 0);
        roiPromedio = roiTotal / comprasConVentas.length;
    }
    
    // Verificar que los elementos existan antes de actualizarlos
    const comprasMesElement = document.getElementById('compras-mes');
    if (comprasMesElement) {
        comprasMesElement.textContent = comprasMes.length;
    }
    
    const inversionTotalElement = document.getElementById('inversion-total');
    if (inversionTotalElement) {
        inversionTotalElement.textContent = `S/ ${inversionTotal.toFixed(2)}`;
    }
    
    const totalProveedoresElement = document.getElementById('total-proveedores');
    if (totalProveedoresElement) {
        totalProveedoresElement.textContent = totalProveedores;
    }
    
    const roiPromedioElement = document.getElementById('roi-promedio');
    if (roiPromedioElement) {
        roiPromedioElement.textContent = `${roiPromedio.toFixed(1)}%`;
    }
}

function limpiarFiltros() {
    document.getElementById('search-compras').value = '';
    document.getElementById('filter-proveedor').value = '';
    document.getElementById('filter-fecha-desde').value = '';
    document.getElementById('filter-fecha-hasta').value = '';
    filtrarCompras();
}

function abrirModalProveedores() {
    cargarListaProveedores();
    document.getElementById('modal-proveedores').classList.add('active');
}

function cargarListaProveedores() {
    const container = document.getElementById('lista-proveedores');
    
    if (!window.proveedoresCache || window.proveedoresCache.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-4">No hay proveedores registrados</div>';
        return;
    }
    
    container.innerHTML = window.proveedoresCache.map(proveedor => `
        <div class="bg-gray-50 rounded-lg p-4 flex justify-between items-start">
            <div class="flex-1">
                <h4 class="font-semibold text-gray-900">${proveedor.nombre}</h4>
                <p class="text-sm text-gray-600">${proveedor.contacto || 'Sin contacto'}</p>
                <p class="text-sm text-gray-600">${proveedor.telefono || 'Sin teléfono'}</p>
                <p class="text-sm text-gray-600">${proveedor.email || 'Sin email'}</p>
            </div>
            <div class="flex space-x-2">
                <button onclick="editarProveedor('${proveedor.id}')" class="text-blue-600 hover:text-blue-900" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="eliminarProveedor('${proveedor.id}')" class="text-red-600 hover:text-red-900" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function abrirModalNuevoProveedor() {
    document.getElementById('form-nuevo-proveedor').reset();
    document.getElementById('modal-nuevo-proveedor').classList.add('active');
}

async function crearProveedor(e) {
    e.preventDefault();
    
    try {
        const proveedor = {
            nombre: document.getElementById('nombre-proveedor').value,
            contacto: document.getElementById('contacto-proveedor').value,
            telefono: document.getElementById('telefono-proveedor').value,
            email: document.getElementById('email-proveedor').value,
            direccion: document.getElementById('direccion-proveedor').value,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            usuario: window.currentUser.email
        };
        
        await window.db.collection('proveedores').add(proveedor);
        
        document.getElementById('modal-nuevo-proveedor').classList.remove('active');
        await loadProveedores();
        cargarListaProveedores();
        
        showNotification('Proveedor creado correctamente', 'success');
        
    } catch (error) {
        console.error('Error creando proveedor:', error);
        showNotification('Error al crear el proveedor', 'error');
    }
}

async function eliminarProveedor(proveedorId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
        return;
    }
    
    try {
        await window.db.collection('proveedores').doc(proveedorId).delete();
        await loadProveedores();
        cargarListaProveedores();
        
        showNotification('Proveedor eliminado correctamente', 'success');
        
    } catch (error) {
        console.error('Error eliminando proveedor:', error);
        showNotification('Error al eliminar el proveedor', 'error');
    }
}

function verDetalleCompra(compraId) {
    const compra = window.comprasCache.find(c => c.id === compraId);
    if (!compra) return;
    
    const proveedor = window.proveedoresCache.find(p => p.id === compra.proveedorId);
    
    let detalleHtml = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <strong>Proveedor:</strong> ${proveedor ? proveedor.nombre : 'No encontrado'}
                </div>
                <div>
                    <strong>Fecha:</strong> ${new Date(compra.fecha).toLocaleDateString('es-PE')}
                </div>
                <div>
                    <strong>Factura:</strong> ${compra.factura || 'N/A'}
                </div>
                <div>
                    <strong>Método de Pago:</strong> ${compra.metodoPago}
                </div>
            </div>
            
            <div>
                <strong>Productos:</strong>
                <div class="mt-2 border rounded">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-3 py-2 text-left">Producto</th>
                                <th class="px-3 py-2 text-left">Cantidad</th>
                                <th class="px-3 py-2 text-left">Precio</th>
                                <th class="px-3 py-2 text-left">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${compra.productos.map(p => `
                                <tr>
                                    <td class="px-3 py-2">${p.nombre}</td>
                                    <td class="px-3 py-2">${p.cantidad}</td>
                                    <td class="px-3 py-2">S/ ${p.precioCompra.toFixed(2)}</td>
                                    <td class="px-3 py-2">S/ ${p.subtotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                    <strong>Total Invertido:</strong><br>
                    S/ ${compra.totalInvertido.toFixed(2)}
                </div>
                <div>
                    <strong>Total Vendido:</strong><br>
                    S/ ${(compra.totalVendido || 0).toFixed(2)}
                </div>
                <div>
                    <strong>ROI:</strong><br>
                    ${compra.totalInvertido > 0 ? (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100).toFixed(1) : 0}%
                </div>
            </div>
            
            ${compra.observaciones ? `
                <div>
                    <strong>Observaciones:</strong><br>
                    ${compra.observaciones}
                </div>
            ` : ''}
        </div>
    `;
    
    // Crear modal temporal para mostrar detalle
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Detalle de Compra</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            ${detalleHtml}
        </div>
    `;
    
    document.body.appendChild(modal);
}

function mostrarAnalisisROI() {
    if (!window.comprasCache || window.comprasCache.length === 0) {
        alert('No hay datos de compras para analizar');
        return;
    }
    
    // Calcular métricas de ROI
    const analisis = window.comprasCache.map(compra => {
        const proveedor = window.proveedoresCache.find(p => p.id === compra.proveedorId);
        const roi = compra.totalInvertido > 0 ? 
            (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100) : 0;
        
        return {
            ...compra,
            nombreProveedor: proveedor ? proveedor.nombre : 'No encontrado',
            roi: roi,
            ganancia: (compra.totalVendido || 0) - compra.totalInvertido,
            porcentajeRecuperado: compra.totalInvertido > 0 ? 
                ((compra.totalVendido || 0) / compra.totalInvertido * 100) : 0
        };
    }).sort((a, b) => b.roi - a.roi);
    
    const analisisHtml = `
        <div class="space-y-6">
            <div class="grid grid-cols-3 gap-4">
                <div class="bg-green-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-green-800">Mejor ROI</h4>
                    <p class="text-2xl font-bold text-green-600">
                        ${analisis.length > 0 ? analisis[0].roi.toFixed(1) : 0}%
                    </p>
                </div>
                <div class="bg-red-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-red-800">Peor ROI</h4>
                    <p class="text-2xl font-bold text-red-600">
                        ${analisis.length > 0 ? analisis[analisis.length - 1].roi.toFixed(1) : 0}%
                    </p>
                </div>
                <div class="bg-blue-50 p-4 rounded-lg">
                    <h4 class="font-semibold text-blue-800">ROI Promedio</h4>
                    <p class="text-2xl font-bold text-blue-600">
                        ${analisis.length > 0 ? (analisis.reduce((sum, a) => sum + a.roi, 0) / analisis.length).toFixed(1) : 0}%
                    </p>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="min-w-full border border-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left">Fecha</th>
                            <th class="px-4 py-2 text-left">Proveedor</th>
                            <th class="px-4 py-2 text-left">Invertido</th>
                            <th class="px-4 py-2 text-left">Vendido</th>
                            <th class="px-4 py-2 text-left">Ganancia</th>
                            <th class="px-4 py-2 text-left">ROI</th>
                            <th class="px-4 py-2 text-left">% Recuperado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${analisis.map(compra => `
                            <tr>
                                <td class="px-4 py-2">${new Date(compra.fecha).toLocaleDateString('es-PE')}</td>
                                <td class="px-4 py-2">${compra.nombreProveedor}</td>
                                <td class="px-4 py-2">S/ ${compra.totalInvertido.toFixed(2)}</td>
                                <td class="px-4 py-2">S/ ${(compra.totalVendido || 0).toFixed(2)}</td>
                                <td class="px-4 py-2 ${compra.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    S/ ${compra.ganancia.toFixed(2)}
                                </td>
                                <td class="px-4 py-2 font-semibold ${compra.roi >= 0 ? 'text-green-600' : 'text-red-600'}">
                                    ${compra.roi.toFixed(1)}%
                                </td>
                                <td class="px-4 py-2">
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min(100, compra.porcentajeRecuperado)}%"></div>
                                    </div>
                                    <span class="text-xs text-gray-600">${compra.porcentajeRecuperado.toFixed(1)}%</span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Crear modal para mostrar análisis
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[80vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold">Análisis de Rentabilidad (ROI)</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            ${analisisHtml}
        </div>
    `;
    
    document.body.appendChild(modal);
}

function exportarCompras() {
    try {
        const headers = ['Fecha', 'Proveedor', 'Factura', 'Método Pago', 'Total Invertido', 'Total Vendido', 'ROI', 'Estado'];
        const data = window.comprasCache.map(compra => {
            const proveedor = window.proveedoresCache.find(p => p.id === compra.proveedorId);
            const nombreProveedor = proveedor ? proveedor.nombre : 'No encontrado';
            const roi = compra.totalInvertido > 0 ? 
                (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100) : 0;
            
            let estado = 'Pendiente';
            if (compra.totalVendido >= compra.totalInvertido) {
                estado = 'Recuperado';
            } else if (compra.totalVendido > 0) {
                estado = 'En progreso';
            }
            
            return [
                new Date(compra.fecha).toLocaleDateString('es-PE'),
                nombreProveedor,
                compra.factura || 'N/A',
                compra.metodoPago,
                compra.totalInvertido.toFixed(2),
                (compra.totalVendido || 0).toFixed(2),
                roi.toFixed(1) + '%',
                estado
            ];
        });
        
        let csv = headers.join(',') + '\n';
        csv += data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('Compras exportadas correctamente', 'success');
        
    } catch (error) {
        console.error('Error exportando compras:', error);
        showNotification('Error al exportar las compras', 'error');
    }
}

function imprimirCompras() {
    const printWindow = window.open('', '_blank');
    
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte de Compras - Tienda Milka</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #e11d48; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #f8f9fa; font-weight: bold; }
                .positivo { color: #059669; font-weight: bold; }
                .negativo { color: #dc2626; font-weight: bold; }
                .fecha { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <h1>REPORTE DE COMPRAS - TIENDA MILKA</h1>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Proveedor</th>
                        <th>Factura</th>
                        <th>Invertido</th>
                        <th>Vendido</th>
                        <th>ROI</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    window.comprasCache.forEach(compra => {
        const proveedor = window.proveedoresCache.find(p => p.id === compra.proveedorId);
        const nombreProveedor = proveedor ? proveedor.nombre : 'No encontrado';
        const roi = compra.totalInvertido > 0 ? 
            (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100) : 0;
        
        let estado = 'Pendiente';
        if (compra.totalVendido >= compra.totalInvertido) {
            estado = 'Recuperado';
        } else if (compra.totalVendido > 0) {
            estado = 'En progreso';
        }
        
        const roiClass = roi >= 0 ? 'positivo' : 'negativo';
        
        html += `
            <tr>
                <td>${new Date(compra.fecha).toLocaleDateString('es-PE')}</td>
                <td>${nombreProveedor}</td>
                <td>${compra.factura || 'N/A'}</td>
                <td>S/ ${compra.totalInvertido.toFixed(2)}</td>
                <td>S/ ${(compra.totalVendido || 0).toFixed(2)}</td>
                <td class="${roiClass}">${roi.toFixed(1)}%</td>
                <td>${estado}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
            <div class="fecha">
                Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
    
    if (type === 'success') {
        notification.className += ' bg-green-500 text-white';
    } else if (type === 'error') {
        notification.className += ' bg-red-500 text-white';
    } else {
        notification.className += ' bg-blue-500 text-white';
    }
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-info'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar notificación
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Continúa en la siguiente parte...

// Escuchar cuando los proveedores se cargan desde el layout principal
window.addEventListener('proveedoresLoaded', function(event) {
    console.log('Evento proveedoresLoaded recibido en compras:', event.detail);
    // Actualizar estadísticas cuando los proveedores estén cargados
    setTimeout(() => {
        updateComprasStats();
    }, 100);
});

console.log('admin-compras.js cargado completamente');
