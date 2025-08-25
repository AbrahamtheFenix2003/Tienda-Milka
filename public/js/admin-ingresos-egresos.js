// admin-ingresos-egresos.js - Funciones para la sección Ingresos y Egresos
console.log('Cargando admin-ingresos-egresos.js...');

let ingresosEgresosData = {
    ingresos: [],
    egresos: []
};

window.loadIngresosEgresos = function() {
    console.log('Ejecutando loadIngresosEgresos...');
    
    // Verificar permisos
    if (!window.currentUser || !window.isAdmin(window.currentUser.email)) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para ver ingresos y egresos</p>
            </div>
        `;
        return;
    }

    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Ingresos y Egresos 📊</h2>
                <div class="flex space-x-3">
                    <button id="generar-reporte-btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        <i class="fas fa-file-export mr-2"></i>Generar Reporte
                    </button>
                    <button id="grafico-flujo-btn" class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
                        <i class="fas fa-chart-line mr-2"></i>Gráfico de Flujo
                    </button>
                </div>
            </div>

            <!-- Filtros de Período -->
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex-shrink-0">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Período:</label>
                        <select id="filtro-periodo" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="hoy">Hoy</option>
                            <option value="semana">Esta Semana</option>
                            <option value="mes" selected>Este Mes</option>
                            <option value="trimestre">Este Trimestre</option>
                            <option value="año">Este Año</option>
                            <option value="personalizado">Personalizado</option>
                        </select>
                    </div>
                    
                    <div id="fechas-personalizadas" class="flex space-x-2" style="display: none;">
                        <div class="flex-shrink-0">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
                            <input type="date" id="fecha-desde" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        <div class="flex-shrink-0">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Hasta:</label>
                            <input type="date" id="fecha-hasta" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                    </div>

                    <div class="flex-shrink-0">
                        <button id="aplicar-periodo" class="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600 mt-6">
                            <i class="fas fa-search mr-2"></i>Aplicar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Resumen Financiero -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                            <i class="fas fa-dollar-sign text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Ingresos Brutos</p>
                            <p class="text-2xl font-semibold text-blue-600" id="total-ingresos-brutos">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-500">
                            <i class="fas fa-arrow-up text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Ganancia Neta</p>
                            <p class="text-2xl font-semibold text-green-600" id="total-ingresos">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-red-100 text-red-500">
                            <i class="fas fa-arrow-down text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Total Egresos</p>
                            <p class="text-2xl font-semibold text-red-600" id="total-egresos">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                            <i class="fas fa-balance-scale text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Flujo Neto</p>
                            <p class="text-2xl font-semibold" id="flujo-neto">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100 text-yellow-500">
                            <i class="fas fa-percentage text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Margen</p>
                            <p class="text-2xl font-semibold text-gray-900" id="margen-porcentaje">0%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Gráfico de Ingresos vs Egresos -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Ingresos vs Egresos</h3>
                    <div class="h-64">
                        <canvas id="chart-ingresos-egresos"></canvas>
                    </div>
                </div>
                
                <!-- Gráfico de Categorías -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Distribución por Categorías</h3>
                    <div class="h-64">
                        <canvas id="chart-categorias"></canvas>
                    </div>
                </div>
            </div>

            <!-- Desglose por Categorías -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Categorías de Ingresos -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 bg-green-50">
                        <h3 class="text-lg font-medium text-green-800">
                            <i class="fas fa-plus-circle mr-2"></i>Categorías de Ingresos
                        </h3>
                    </div>
                    <div class="p-6">
                        <div id="categorias-ingresos" class="space-y-3">
                            <!-- Las categorías de ingresos se cargarán aquí -->
                        </div>
                    </div>
                </div>
                
                <!-- Categorías de Egresos -->
                <div class="bg-white rounded-lg shadow overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 bg-red-50">
                        <h3 class="text-lg font-medium text-red-800">
                            <i class="fas fa-minus-circle mr-2"></i>Categorías de Egresos
                        </h3>
                    </div>
                    <div class="p-6">
                        <div id="categorias-egresos" class="space-y-3">
                            <!-- Las categorías de egresos se cargarán aquí -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Timeline de Flujo de Caja -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">
                        <i class="fas fa-chart-line mr-2"></i>Timeline de Flujo de Caja
                    </h3>
                </div>
                <div class="p-6">
                    <div class="h-80">
                        <canvas id="chart-timeline"></canvas>
                    </div>
                </div>
            </div>

            <!-- Tabla Detallada -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-lg font-medium text-gray-900">Detalle de Movimientos</h3>
                    <div class="flex space-x-2">
                        <select id="filtro-tipo-detalle" class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="todos">Todos</option>
                            <option value="ingresos">Solo Ingresos</option>
                            <option value="egresos">Solo Egresos</option>
                        </select>
                    </div>
                </div>
                <div class="overflow-x-auto max-h-96">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origen</th>
                            </tr>
                        </thead>
                        <tbody id="detalle-movimientos-tbody" class="bg-white divide-y divide-gray-200">
                            <!-- Los movimientos detallados se cargarán aquí -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal para Gráfico de Flujo -->
        <div id="modal-grafico-flujo" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-purple-600">
                        <i class="fas fa-chart-line mr-2"></i>Gráfico de Flujo de Caja Detallado
                    </h3>
                    <button id="close-grafico-flujo" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="h-96">
                    <canvas id="chart-flujo-detallado"></canvas>
                </div>
            </div>
        </div>

        <!-- Modal para Generar Reporte -->
        <div id="modal-generar-reporte" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-blue-600">
                        <i class="fas fa-file-export mr-2"></i>Generar Reporte
                    </h3>
                    <button id="close-generar-reporte" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="form-generar-reporte">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
                        <select id="tipo-reporte" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="resumen">Resumen Ejecutivo</option>
                            <option value="detallado">Reporte Detallado</option>
                            <option value="por-categoria">Por Categorías</option>
                            <option value="flujo-caja">Flujo de Caja</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                        <select id="formato-reporte" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                            <option value="pdf">PDF</option>
                            <option value="excel">Excel</option>
                            <option value="csv">CSV</option>
                        </select>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-generar-reporte" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" class="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600">Generar</button>
                    </div>
                </form>
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
        setupIngresosEgresosEvents();
        
        // Cargar datos
        loadIngresosEgresosData();
    }, 200);
};

function setupIngresosEgresosEvents() {
    // Eventos principales
    document.getElementById('generar-reporte-btn').addEventListener('click', showGenerarReporteModal);
    document.getElementById('grafico-flujo-btn').addEventListener('click', showGraficoFlujoModal);

    // Eventos para filtros
    document.getElementById('filtro-periodo').addEventListener('change', function() {
        const fechasPersonalizadas = document.getElementById('fechas-personalizadas');
        if (this.value === 'personalizado') {
            fechasPersonalizadas.style.display = 'flex';
        } else {
            fechasPersonalizadas.style.display = 'none';
        }
    });

    document.getElementById('aplicar-periodo').addEventListener('click', aplicarFiltroPeriodo);
    document.getElementById('filtro-tipo-detalle').addEventListener('change', filtrarDetalleMovimientos);

    // Eventos para modales
    setupIngresosEgresosModalEvents();
}

function setupIngresosEgresosModalEvents() {
    // Función auxiliar para cerrar modales
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Lista de botones de cierre y sus modales correspondientes
    const closeButtons = [
        { id: 'close-grafico-flujo', modal: 'modal-grafico-flujo' },
        { id: 'close-generar-reporte', modal: 'modal-generar-reporte' },
        { id: 'cancel-generar-reporte', modal: 'modal-generar-reporte' }
    ];

    // Configurar eventos de cierre
    closeButtons.forEach(btn => {
        const element = document.getElementById(btn.id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                closeModal(btn.modal);
            });
        }
    });

    // Cerrar modales al hacer clic fuera de ellos
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });

    // Eventos específicos de formularios
    const formGenerarReporte = document.getElementById('form-generar-reporte');
    if (formGenerarReporte) {
        formGenerarReporte.addEventListener('submit', procesarGenerarReporte);
    }
}

async function loadIngresosEgresosData() {
    try {
        // IMPORTANTE: Limpiar datos existentes antes de cargar
        console.log('Limpiando datos de ingresos y egresos...');
        ingresosEgresosData = {
            ingresos: [],
            egresos: [],
            todosMovimientos: []
        };
        
        console.log('Cargando datos frescos...');
        // Cargar datos de múltiples fuentes (SIN movimientos de caja para evitar duplicación)
        await Promise.all([
            loadVentasData(),
            loadComprasData(),
            loadEgresosData()
            // REMOVIDO: loadMovimientosCajaData() - evita duplicar ingresos de ventas
        ]);
        
        console.log('Datos cargados:', {
            ingresos: ingresosEgresosData.ingresos.length,
            egresos: ingresosEgresosData.egresos.length
        });
        
        // Procesar y combinar datos
        procesarDatosIntegrados();
        
        // Aplicar filtro de período actual
        aplicarFiltroPeriodo();
        
        // Mostrar mensaje de éxito
        console.log('Datos de ingresos y egresos cargados correctamente (sin duplicación)');

    } catch (error) {
        console.error('Error cargando datos de ingresos y egresos:', error);
        showMessage('Error cargando datos financieros', 'error');
    }
}

async function loadVentasData() {
    try {
        // Usar datos de ventas ya cargados
        if (window.allSales && window.allSales.length > 0) {
            console.log('Procesando ventas para ingresos:', window.allSales.length);
            
            ingresosEgresosData.ingresos = window.allSales
                .filter(sale => sale.profit && sale.profit > 0) // Solo ventas con ganancia
                .map(sale => {
                    let fecha;
                    // Prioridad: timestamp (nuevo) -> soldAt (antiguo) -> date -> fecha actual
                    if (sale.timestamp && sale.timestamp.toDate) {
                        fecha = sale.timestamp.toDate().toISOString().split('T')[0];
                    } else if (sale.timestamp) {
                        fecha = new Date(sale.timestamp).toISOString().split('T')[0];
                    } else if (sale.soldAt && sale.soldAt.toDate) {
                        fecha = sale.soldAt.toDate().toISOString().split('T')[0];
                    } else if (sale.soldAt) {
                        fecha = new Date(sale.soldAt).toISOString().split('T')[0];
                    } else if (sale.date) {
                        fecha = sale.date;
                    } else {
                        fecha = new Date().toISOString().split('T')[0]; // Fecha actual como fallback
                    }
                    
                    return {
                        id: sale.id,
                        fecha: fecha,
                        tipo: 'ingreso',
                        categoria: 'ventas',
                        descripcion: `Venta - ${sale.items ? sale.items.length : 0} productos`,
                        monto: sale.profit || 0, // Ganancia neta
                        montoBruto: sale.totalSale || 0, // Ingreso bruto
                        origen: 'ventas',
                        timestamp: sale.timestamp || sale.soldAt
                    };
                });
            
            console.log('Ingresos de ventas procesados:', ingresosEgresosData.ingresos.length);
        } else {
            console.log('Cargando ventas...');
            await window.loadSales();
            await loadVentasData(); // Recursivo después de cargar
        }
    } catch (error) {
        console.error('Error cargando datos de ventas:', error);
    }
}

async function loadComprasData() {
    try {
        console.log('Intentando cargar datos de compras...');
        const snapshot = await window.db.collection('compras').get();
        const compras = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            compras.push({
                id: doc.id,
                fecha: data.fecha,
                tipo: 'egreso',
                categoria: 'compras',
                descripcion: `Compra a proveedor - ${data.productos ? data.productos.length : 0} productos`,
                monto: data.totalInvertido || data.costoTotal || 0, // Usar totalInvertido como campo principal
                origen: 'compras',
                timestamp: data.timestamp
            });
        });
        
        // Inicializar array si no existe y luego agregar compras
        if (!ingresosEgresosData.egresos) {
            ingresosEgresosData.egresos = [];
        }
        ingresosEgresosData.egresos = [...ingresosEgresosData.egresos, ...compras];
        console.log('Compras cargadas:', compras.length);
    } catch (error) {
        console.warn('Error cargando datos de compras (colección puede no existir):', error.message);
        // Inicializar array vacío si hay error
        if (!ingresosEgresosData.egresos) {
            ingresosEgresosData.egresos = [];
        }
    }
}

async function loadEgresosData() {
    try {
        console.log('Cargando datos de egresos...');
        // Usar datos de egresos ya cargados
        if (window.allExpenses && window.allExpenses.length > 0) {
            const egresos = window.allExpenses.map(expense => {
                let fecha;
                if (expense.timestamp && expense.timestamp.toDate) {
                    fecha = expense.timestamp.toDate().toISOString().split('T')[0];
                } else if (expense.timestamp) {
                    fecha = new Date(expense.timestamp).toISOString().split('T')[0];
                } else if (expense.date) {
                    fecha = expense.date;
                } else {
                    fecha = new Date().toISOString().split('T')[0];
                }
                
                return {
                    id: expense.id,
                    fecha: fecha,
                    tipo: 'egreso',
                    categoria: expense.category || 'gastos',
                    descripcion: expense.description || 'Gasto',
                    monto: expense.amount || 0,
                    origen: 'egresos',
                    timestamp: expense.timestamp
                };
            });
            
            // Concatenar con los egresos existentes (de compras)
            ingresosEgresosData.egresos = [...(ingresosEgresosData.egresos || []), ...egresos];
            console.log('Egresos procesados:', egresos.length);
        } else {
            console.log('Cargando expenses...');
            await window.loadExpenses();
            await loadEgresosData(); // Recursivo después de cargar
        }
    } catch (error) {
        console.warn('Error cargando datos de egresos:', error.message);
        if (!ingresosEgresosData.egresos) {
            ingresosEgresosData.egresos = [];
        }
    }
}

// FUNCIÓN DESHABILITADA: Movimientos de caja causan duplicación con ventas
// async function loadMovimientosCajaData() {
//     try {
//         console.log('Intentando cargar movimientos de caja...');
//         const snapshot = await window.db.collection('movimientos_caja').get();
//         const movimientos = [];
//         snapshot.forEach(doc => {
//             const data = doc.data();
//             movimientos.push({
//                 id: doc.id,
//                 fecha: data.fecha,
//                 tipo: data.tipo === 'entrada' ? 'ingreso' : 'egreso',
//                 categoria: data.categoria || 'otros',
//                 descripcion: data.descripcion || 'Movimiento de caja',
//                 monto: data.monto || 0,
//                 origen: 'caja',
//                 timestamp: data.timestamp
//             });
//         });
//         
//         ingresosEgresosData.movimientosCaja = movimientos;
//         console.log('Movimientos de caja cargados:', movimientos.length);
//     } catch (error) {
//         console.warn('Error cargando movimientos de caja (colección puede no existir):', error.message);
//         ingresosEgresosData.movimientosCaja = [];
//     }
// }

function procesarDatosIntegrados() {
    console.log('Procesando datos integrados...');
    
    // Asegurar que todos los arrays existen
    const ingresos = ingresosEgresosData.ingresos || [];
    const egresos = ingresosEgresosData.egresos || [];
    
    console.log(`Datos disponibles: ${ingresos.length} ingresos, ${egresos.length} egresos`);
    
    // Debug: mostrar fechas de los primeros ingresos
    if (ingresos.length > 0) {
        console.log('Primeras 5 fechas de ingresos:', ingresos.slice(0, 5).map(ing => `${ing.fecha} (${ing.descripcion})`));
    }
    
    // Combinar solo ingresos y egresos (SIN movimientos de caja para evitar duplicación)
    const todosMovimientos = [
        ...ingresos,
        ...egresos
    ];
    
    // Filtrar movimientos con fecha válida
    const movimientosConFecha = todosMovimientos.filter(mov => {
        if (!mov.fecha) {
            console.warn('Movimiento sin fecha:', mov);
            return false;
        }
        return true;
    });
    
    // Eliminar duplicados por ID y origen para evitar problemas
    const movimientosUnicos = [];
    const idsVistos = new Set();
    
    movimientosConFecha.forEach(mov => {
        const claveUnica = `${mov.id}-${mov.origen}`;
        if (!idsVistos.has(claveUnica)) {
            idsVistos.add(claveUnica);
            movimientosUnicos.push(mov);
        }
    });
    
    console.log(`Procesando movimientos: ${todosMovimientos.length} total, ${movimientosConFecha.length} con fecha, ${movimientosUnicos.length} únicos`);
    
    // Ordenar por fecha
    movimientosUnicos.sort((a, b) => {
        const fechaA = new Date(a.fecha || 0);
        const fechaB = new Date(b.fecha || 0);
        return fechaB - fechaA;
    });
    
    ingresosEgresosData.todosMovimientos = movimientosUnicos;
    
    // Log de datos para hoy para debugging
    const hoy = new Date().toISOString().split('T')[0];
    const movimientosHoy = movimientosUnicos.filter(mov => mov.fecha === hoy);
    console.log(`Movimientos para hoy (${hoy}):`, movimientosHoy);
}

function aplicarFiltroPeriodo() {
    const periodo = document.getElementById('filtro-periodo').value;
    let fechaDesde, fechaHasta;
    
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    
    switch (periodo) {
        case 'hoy':
            // Usar comparaciones precisas por timestamp para el día actual
            const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()); // 00:00:00 de hoy
            const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999); // 23:59:59 de hoy
            
            fechaDesde = inicioDelDia.toISOString().split('T')[0];
            fechaHasta = finDelDia.toISOString().split('T')[0];
            
            // Filtrar usando timestamp para mayor precisión
            const movimientosHoyTimestamp = (ingresosEgresosData.todosMovimientos || []).filter(mov => {
                let fechaMovimiento;
                
                if (mov.timestamp && mov.timestamp.toDate) {
                    fechaMovimiento = mov.timestamp.toDate();
                } else if (mov.timestamp) {
                    fechaMovimiento = new Date(mov.timestamp);
                } else if (mov.fecha) {
                    fechaMovimiento = new Date(mov.fecha + 'T12:00:00'); // Asume mediodía si solo hay fecha
                } else {
                    return false;
                }
                
                return fechaMovimiento >= inicioDelDia && fechaMovimiento <= finDelDia;
            });
            
            console.log(`Movimientos encontrados para hoy usando timestamp:`, movimientosHoyTimestamp.length);
            
            // Si no hay datos para hoy, mostrar los más recientes
            if (movimientosHoyTimestamp.length === 0 && ingresosEgresosData.todosMovimientos && ingresosEgresosData.todosMovimientos.length > 0) {
                console.log(`No hay datos para hoy (${fechaDesde}), buscando fecha más reciente...`);
                const fechasDisponibles = [...new Set(ingresosEgresosData.todosMovimientos.map(mov => mov.fecha))].sort().reverse();
                if (fechasDisponibles.length > 0) {
                    fechaDesde = fechaHasta = fechasDisponibles[0];
                    console.log(`Mostrando la fecha más reciente: ${fechaDesde}`);
                }
            }
            break;
        case 'semana':
            const inicioSemana = new Date(hoy.setDate(hoy.getDate() - hoy.getDay()));
            fechaDesde = inicioSemana.toISOString().split('T')[0];
            fechaHasta = new Date().toISOString().split('T')[0];
            break;
        case 'mes':
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
            fechaHasta = new Date().toISOString().split('T')[0];
            break;
        case 'trimestre':
            const trimestre = Math.floor(hoy.getMonth() / 3);
            fechaDesde = new Date(hoy.getFullYear(), trimestre * 3, 1).toISOString().split('T')[0];
            fechaHasta = new Date().toISOString().split('T')[0];
            break;
        case 'año':
            fechaDesde = new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0];
            fechaHasta = new Date().toISOString().split('T')[0];
            break;
        case 'personalizado':
            fechaDesde = document.getElementById('fecha-desde').value;
            fechaHasta = document.getElementById('fecha-hasta').value;
            break;
        default:
            fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
            fechaHasta = new Date().toISOString().split('T')[0];
    }
    
    if (!fechaDesde || !fechaHasta) {
        showMessage('Selecciona un período válido', 'warning');
        return;
    }
    
    console.log(`Aplicando filtro: ${periodo}, desde: ${fechaDesde}, hasta: ${fechaHasta}`);
    console.log('Total movimientos disponibles:', ingresosEgresosData.todosMovimientos?.length || 0);
    
    if (ingresosEgresosData.todosMovimientos && ingresosEgresosData.todosMovimientos.length > 0) {
        const fechasUnicas = [...new Set(ingresosEgresosData.todosMovimientos.map(mov => mov.fecha))].sort();
        console.log('Fechas disponibles en datos:', fechasUnicas);
    }
    
    // Filtrar datos
    const movimientosFiltrados = (ingresosEgresosData.todosMovimientos || []).filter(mov => {
        const fechaMovimiento = mov.fecha;
        const enRango = fechaMovimiento >= fechaDesde && fechaMovimiento <= fechaHasta;
        
        return enRango;
    });
    
    console.log(`Movimientos filtrados para ${periodo}:`, movimientosFiltrados.length);
    if (movimientosFiltrados.length > 0) {
        console.log('Ejemplos de movimientos filtrados:', movimientosFiltrados.slice(0, 3));
    } else {
        console.log(`No se encontraron movimientos para el período: ${periodo} (${fechaDesde} - ${fechaHasta})`);
        if (periodo === 'hoy') {
            const fechaActual = new Date().toISOString().split('T')[0];
            if (fechaDesde !== fechaActual) {
                showMessage(`No hay datos para hoy (${fechaActual}). Mostrando datos de: ${fechaDesde}`, 'info');
            } else {
                showMessage('No hay movimientos registrados para hoy', 'info');
            }
        }
    }
    
    // Actualizar vistas
    updateResumenFinanciero(movimientosFiltrados);
    updateCategoriasDesglose(movimientosFiltrados);
    renderDetalleMovimientos(movimientosFiltrados);
    renderGraficos(movimientosFiltrados);
}

function updateResumenFinanciero(movimientos) {
    let totalIngresos = 0;
    let totalIngresosBrutos = 0;
    let totalEgresos = 0;
    
    movimientos.forEach(mov => {
        if (mov.tipo === 'ingreso') {
            totalIngresos += mov.monto; // Ganancia neta
            totalIngresosBrutos += mov.montoBruto || mov.monto; // Ingreso bruto, fallback a neto si no existe
        } else {
            totalEgresos += mov.monto;
        }
    });
    
    const flujoNeto = totalIngresos - totalEgresos;
    const margenPorcentaje = totalIngresosBrutos > 0 ? ((totalIngresos / totalIngresosBrutos) * 100) : 0;
    
    document.getElementById('total-ingresos-brutos').textContent = `S/ ${totalIngresosBrutos.toFixed(2)}`;
    document.getElementById('total-ingresos').textContent = `S/ ${totalIngresos.toFixed(2)}`;
    document.getElementById('total-egresos').textContent = `S/ ${totalEgresos.toFixed(2)}`;
    document.getElementById('flujo-neto').textContent = `S/ ${flujoNeto.toFixed(2)}`;
    document.getElementById('flujo-neto').className = `text-2xl font-semibold ${flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`;
    document.getElementById('margen-porcentaje').textContent = `${margenPorcentaje.toFixed(1)}%`;
}

function updateCategoriasDesglose(movimientos) {
    // Agrupar por categorías
    const categoriasIngresos = {};
    const categoriasIngresosBrutos = {};
    const categoriasEgresos = {};
    
    movimientos.forEach(mov => {
        if (mov.tipo === 'ingreso') {
            categoriasIngresos[mov.categoria] = (categoriasIngresos[mov.categoria] || 0) + mov.monto;
            categoriasIngresosBrutos[mov.categoria] = (categoriasIngresosBrutos[mov.categoria] || 0) + (mov.montoBruto || mov.monto);
        } else {
            categoriasEgresos[mov.categoria] = (categoriasEgresos[mov.categoria] || 0) + mov.monto;
        }
    });
    
    // Renderizar categorías de ingresos (mostrando tanto bruto como neto para ventas)
    const ingresosContainer = document.getElementById('categorias-ingresos');
    ingresosContainer.innerHTML = Object.entries(categoriasIngresos)
        .sort(([,a], [,b]) => b - a)
        .map(([categoria, monto]) => {
            const montoBruto = categoriasIngresosBrutos[categoria] || monto;
            const mostrarBruto = categoria === 'ventas' && montoBruto !== monto;
            
            return `
                <div class="py-2 border-b border-gray-100">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-700 capitalize">${categoria}</span>
                        <span class="text-sm font-semibold text-green-600">S/ ${monto.toFixed(2)}</span>
                    </div>
                    ${mostrarBruto ? `
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-xs text-gray-500 ml-2">Ingresos brutos:</span>
                            <span class="text-xs text-blue-600">S/ ${montoBruto.toFixed(2)}</span>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    
    // Renderizar categorías de egresos
    const egresosContainer = document.getElementById('categorias-egresos');
    egresosContainer.innerHTML = Object.entries(categoriasEgresos)
        .sort(([,a], [,b]) => b - a)
        .map(([categoria, monto]) => `
            <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-sm text-gray-700 capitalize">${categoria}</span>
                <span class="text-sm font-semibold text-red-600">S/ ${monto.toFixed(2)}</span>
            </div>
        `).join('');
}

function renderDetalleMovimientos(movimientos = null) {
    const tbody = document.getElementById('detalle-movimientos-tbody');
    const movimientosAMostrar = movimientos || ingresosEgresosData.todosMovimientos || [];
    
    if (movimientosAMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    No hay movimientos en el período seleccionado
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = movimientosAMostrar.slice(0, 50).map(mov => {
        // Usar el timestamp original para mayor precisión
        let fechaCompleta = 'Sin fecha';
        let fechaSolo = 'Sin fecha';
        
        if (mov.timestamp) {
            if (mov.timestamp.toDate) {
                // Firebase Timestamp
                const fecha = mov.timestamp.toDate();
                fechaCompleta = fecha.toLocaleString('es-ES');
                fechaSolo = fecha.toLocaleDateString('es-ES');
            } else {
                // String timestamp
                const fecha = new Date(mov.timestamp);
                fechaCompleta = fecha.toLocaleString('es-ES');
                fechaSolo = fecha.toLocaleDateString('es-ES');
            }
        } else if (mov.fecha) {
            // Fallback a fecha simple
            const fecha = new Date(mov.fecha);
            fechaCompleta = fecha.toLocaleDateString('es-ES');
            fechaSolo = fecha.toLocaleDateString('es-ES');
        }
        
        const tipoClase = mov.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const montoClase = mov.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600';
        const montoFormato = mov.tipo === 'ingreso' ? `+S/ ${mov.monto.toFixed(2)}` : `-S/ ${mov.monto.toFixed(2)}`;
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900" title="${fechaCompleta}">${fechaSolo}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tipoClase}">
                        ${mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">${mov.categoria}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${mov.descripcion}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${montoClase}">
                    ${montoFormato}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${mov.origen}</td>
            </tr>
        `;
    }).join('');
}

function filtrarDetalleMovimientos() {
    const tipoFiltro = document.getElementById('filtro-tipo-detalle').value;
    let movimientosFiltrados = ingresosEgresosData.todosMovimientos || [];
    
    if (tipoFiltro !== 'todos') {
        movimientosFiltrados = movimientosFiltrados.filter(mov => {
            return (tipoFiltro === 'ingresos' && mov.tipo === 'ingreso') ||
                   (tipoFiltro === 'egresos' && mov.tipo === 'egreso');
        });
    }
    
    renderDetalleMovimientos(movimientosFiltrados);
}

function renderGraficos(movimientos) {
    // Implementar gráficos con Chart.js
    // Por ahora, placeholder
    console.log('Renderizando gráficos con', movimientos.length, 'movimientos');
}

function showGenerarReporteModal() {
    document.getElementById('modal-generar-reporte').classList.add('active');
}

function showGraficoFlujoModal() {
    document.getElementById('modal-grafico-flujo').classList.add('active');
    // Implementar gráfico detallado
}

function procesarGenerarReporte(e) {
    e.preventDefault();
    
    const tipoReporte = document.getElementById('tipo-reporte').value;
    const formatoReporte = document.getElementById('formato-reporte').value;
    
    // Placeholder para generar reporte
    showMessage(`Generando reporte ${tipoReporte} en formato ${formatoReporte}...`, 'info');
    
    // Simular generación
    setTimeout(() => {
        showMessage('Reporte generado correctamente (función en desarrollo)', 'success');
        document.getElementById('modal-generar-reporte').classList.remove('active');
    }, 2000);
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

console.log('admin-ingresos-egresos.js cargado correctamente');
