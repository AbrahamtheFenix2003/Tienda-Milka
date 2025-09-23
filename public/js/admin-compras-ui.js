// admin-compras-ui.js - Manejo de interfaz de usuario
console.log('Cargando admin-compras-ui.js...');

window.ComprasUI = {
    
    renderMainInterface() {
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
        `;
        
        document.getElementById('content-area').innerHTML = content;
        
        // Agregar modales
        this.addModalsToBody();
        
        // Establecer fecha por defecto
        const fechaCompra = document.getElementById('fecha-compra');
        if (fechaCompra) {
            fechaCompra.value = new Date().toISOString().split('T')[0];
        }
    },

    addModalsToBody() {
        // Eliminar modales existentes si los hay
        const existingModals = document.querySelectorAll('[id*="modal-"]');
        existingModals.forEach(modal => {
            if (modal.id.includes('compra') || modal.id.includes('proveedor')) {
                modal.remove();
            }
        });

        const modalsHtml = ComprasModals.getAllModalsHtml();
        document.body.insertAdjacentHTML('beforeend', modalsHtml);
    },

    setupEventListeners() {
        // Botones principales
        this.addClickListener('nueva-compra-btn', () => ComprasModals.openNuevaCompra());
        this.addClickListener('gestionar-proveedores-btn', () => ComprasModals.openProveedores());
        this.addClickListener('analisis-rentabilidad-btn', () => this.showAnalysisROI());
        
        // Filtros
        this.addInputListener('search-compras', () => ComprasData.filterCompras());
        this.addChangeListener('filter-proveedor', () => ComprasData.filterCompras());
        this.addChangeListener('filter-fecha-desde', () => ComprasData.filterCompras());
        this.addChangeListener('filter-fecha-hasta', () => ComprasData.filterCompras());
        this.addClickListener('limpiar-filtros-btn', () => this.clearFilters());
        
        // Botones de exportar/imprimir
        this.addClickListener('export-compras-btn', () => ComprasUtils.exportCompras());
        this.addClickListener('print-compras-btn', () => ComprasUtils.printCompras());
    },

    addClickListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    },

    addInputListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', handler);
        }
    },

    addChangeListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', handler);
        }
    },

    renderComprasTable(compras) {
        const tbody = document.getElementById('compras-table');
        if (!tbody) return;
        
        if (compras.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No se encontraron compras</td></tr>';
            return;
        }
        
        tbody.innerHTML = compras.map(compra => {
            const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
            const nombreProveedor = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
            
            const fecha = new Date(compra.fecha).toLocaleDateString('es-PE');
            const numProductos = compra.productos ? compra.productos.length : 0;
            const totalInvertido = compra.totalInvertido || 0;
            const totalVendido = compra.totalVendido || 0;
            
            let roi = 0;
            let roiClass = 'text-gray-600';
            
            // Usar el estado de la compra o calcular uno por defecto
            let estado = compra.estado || 'Registrada';
            let estadoClass = 'bg-gray-100 text-gray-800'; // Default
            
            // Determinar clase CSS basada en el estado
            switch(estado) {
                case 'Registrada':
                    estadoClass = 'bg-green-100 text-green-800';
                    break;
                case 'Parcial':
                    estadoClass = 'bg-yellow-100 text-yellow-800';
                    break;
                case 'Completada':
                    estadoClass = 'bg-blue-100 text-blue-800';
                    break;
                case 'Anulada':
                    estadoClass = 'bg-red-100 text-red-800';
                    break;
                default:
                    estadoClass = 'bg-gray-100 text-gray-800';
            }
            
            if (totalInvertido > 0) {
                roi = ((totalVendido - totalInvertido) / totalInvertido) * 100;
                
                if (roi > 0) {
                    roiClass = 'text-green-600';
                } else if (roi < 0) {
                    roiClass = 'text-red-600';
                }
                
                // Actualizar estado basado en ventas si no está anulada
                if (estado !== 'Anulada') {
                    if (totalVendido >= totalInvertido) {
                        estado = 'Recuperado';
                        estadoClass = 'bg-blue-100 text-blue-800';
                    } else if (totalVendido > 0) {
                        estado = 'Parcial';
                        estadoClass = 'bg-yellow-100 text-yellow-800';
                    }
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
                            <button onclick="ComprasModals.showDetail('${compra.id}')" class="text-blue-600 hover:text-blue-900" title="Ver detalle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="ComprasModals.editarCompra('${compra.id}')" class="text-green-600 hover:text-green-900" title="Editar compra">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    clearFilters() {
        const elements = ['search-compras', 'filter-proveedor', 'filter-fecha-desde', 'filter-fecha-hasta'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        ComprasData.filterCompras();
    },

    showAnalysisROI() {
        if (!window.comprasCache || window.comprasCache.length === 0) {
            ComprasUtils.showNotification('No hay datos de compras para analizar', 'info');
            return;
        }
        
        // Calcular métricas de ROI
        const analisis = window.comprasCache.map(compra => {
            const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
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
        
        const analisisHtml = this.generateAnalysisHtml(analisis);
        ComprasUtils.showModal('Análisis de Rentabilidad (ROI)', analisisHtml, 'max-w-6xl');
    },

    generateAnalysisHtml(analisis) {
        return `
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
    }
};

console.log('admin-compras-ui.js cargado completamente');
