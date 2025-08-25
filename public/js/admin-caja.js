// admin-caja.js - Funciones para la sección Caja
console.log('Cargando admin-caja.js...');

let movimientosCajaCache = [];
let saldoActualCaja = 0;

window.loadCaja = function() {
    console.log('Ejecutando loadCaja...');
    
    // Verificar permisos
    if (!window.currentUser || !window.isAdmin(window.currentUser.email)) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para gestionar la caja</p>
            </div>
        `;
        return;
    }

    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Gestión de Caja 💰</h2>
                <div class="flex space-x-3">
                    <button id="nueva-entrada-btn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                        <i class="fas fa-plus mr-2"></i>Entrada
                    </button>
                    <button id="nueva-salida-btn" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                        <i class="fas fa-minus mr-2"></i>Salida
                    </button>
                    <button id="cierre-caja-btn" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                        <i class="fas fa-calculator mr-2"></i>Cierre de Caja
                    </button>
                    <button id="historial-arqueos-btn" class="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600">
                        <i class="fas fa-history mr-2"></i>Historial
                    </button>
                </div>
            </div>

            <!-- Saldo Actual -->
            <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium">Saldo Actual de Caja</h3>
                        <p class="text-3xl font-bold" id="saldo-actual">S/ 0.00</p>
                        <p class="text-sm opacity-90" id="ultima-actualizacion">Última actualización: --</p>
                    </div>
                    <div class="text-right">
                        <i class="fas fa-cash-register text-4xl opacity-80"></i>
                    </div>
                </div>
            </div>

            <!-- Resumen del Día -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-500">
                            <i class="fas fa-arrow-up text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Entradas del Día</p>
                            <p class="text-2xl font-semibold text-gray-900" id="entradas-dia">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-red-100 text-red-500">
                            <i class="fas fa-arrow-down text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Salidas del Día</p>
                            <p class="text-2xl font-semibold text-gray-900" id="salidas-dia">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                            <i class="fas fa-receipt text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Ventas del Día</p>
                            <p class="text-2xl font-semibold text-gray-900" id="ventas-dia">S/ 0.00</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100 text-yellow-500">
                            <i class="fas fa-calculator text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500">Movimientos</p>
                            <p class="text-2xl font-semibold text-gray-900" id="total-movimientos">0</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filtros -->
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex-shrink-0">
                        <input type="date" id="filtro-fecha-caja" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-tipo-movimiento" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="todos">Todos los movimientos</option>
                            <option value="entrada">Solo entradas</option>
                            <option value="salida">Solo salidas</option>
                        </select>
                    </div>

                    <div class="flex-shrink-0">
                        <select id="filtro-categoria-caja" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <option value="todas">Todas las categorías</option>
                            <option value="ventas">Ventas</option>
                            <option value="compras">Compras</option>
                            <option value="gastos">Gastos</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>

                    <div class="flex-shrink-0">
                        <button id="aplicar-filtros-caja" class="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600">
                            <i class="fas fa-filter mr-2"></i>Filtrar
                        </button>
                    </div>

                    <div class="flex-shrink-0">
                        <button id="limpiar-filtros-caja" class="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                            <i class="fas fa-eraser mr-2"></i>Limpiar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Movimientos del Día -->
            <div class="bg-white rounded-lg shadow overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Movimientos de Caja</h3>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            </tr>
                        </thead>
                        <tbody id="movimientos-caja-tbody" class="bg-white divide-y divide-gray-200">
                            <!-- Los movimientos se cargarán aquí dinámicamente -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Modal para Nueva Entrada -->
        <div id="modal-nueva-entrada" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-green-600">
                        <i class="fas fa-plus mr-2"></i>Nueva Entrada de Dinero
                    </h3>
                    <button id="close-nueva-entrada" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="form-nueva-entrada">
                    <div class="mb-4">
                        <label for="entrada-monto" class="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
                        <input type="number" id="entrada-monto" min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required>
                    </div>
                    <div class="mb-4">
                        <label for="entrada-categoria" class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select id="entrada-categoria" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required>
                            <option value="">Seleccionar categoría</option>
                            <option value="ventas">Ventas</option>
                            <option value="otros-ingresos">Otros Ingresos</option>
                            <option value="prestamo">Préstamo</option>
                            <option value="capital">Aporte de Capital</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label for="entrada-descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea id="entrada-descripcion" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe el motivo de esta entrada..." required></textarea>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-nueva-entrada" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" class="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600">Registrar Entrada</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal para Nueva Salida -->
        <div id="modal-nueva-salida" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-red-600">
                        <i class="fas fa-minus mr-2"></i>Nueva Salida de Dinero
                    </h3>
                    <button id="close-nueva-salida" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="form-nueva-salida">
                    <div class="mb-4">
                        <label for="salida-monto" class="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
                        <input type="number" id="salida-monto" min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required>
                    </div>
                    <div class="mb-4">
                        <label for="salida-categoria" class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select id="salida-categoria" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required>
                            <option value="">Seleccionar categoría</option>
                            <option value="compras">Compras de Mercadería</option>
                            <option value="gastos-operativos">Gastos Operativos</option>
                            <option value="servicios">Servicios (luz, agua, etc.)</option>
                            <option value="salarios">Salarios</option>
                            <option value="impuestos">Impuestos</option>
                            <option value="retiro-personal">Retiro Personal</option>
                            <option value="otros">Otros Gastos</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label for="salida-descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                        <textarea id="salida-descripcion" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Describe el motivo de esta salida..." required></textarea>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-nueva-salida" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" class="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600">Registrar Salida</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal para Cierre de Caja -->
        <div id="modal-cierre-caja" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-blue-600">
                        <i class="fas fa-calculator mr-2"></i>Cierre de Caja
                    </h3>
                    <button id="close-cierre-caja" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div id="cierre-caja-content">
                    <!-- El contenido del cierre se cargará aquí -->
                </div>
            </div>
        </div>

        <!-- Modal para Historial de Arqueos -->
        <div id="modal-historial-arqueos" class="modal fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-96 overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-purple-600">
                        <i class="fas fa-history mr-2"></i>Historial de Arqueos de Caja
                    </h3>
                    <button id="close-historial-arqueos" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entradas</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Salidas</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                            </tr>
                        </thead>
                        <tbody id="arqueos-tbody" class="bg-white divide-y divide-gray-200">
                            <!-- Los arqueos se cargarán aquí -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    document.getElementById('content-area').innerHTML = content;
    
    // Asegurar que todos los modales estén cerrados al cargar
    setTimeout(() => {
        // Cerrar todos los modales existentes
        const modales = document.querySelectorAll('.modal');
        modales.forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Configurar eventos después de cerrar modales
        setupCajaEvents();
        
        // Cargar datos
        loadCajaData();
    }, 200);
};

function setupCajaEvents() {
    // Eventos principales
    document.getElementById('nueva-entrada-btn').addEventListener('click', showNuevaEntradaModal);
    document.getElementById('nueva-salida-btn').addEventListener('click', showNuevaSalidaModal);
    document.getElementById('cierre-caja-btn').addEventListener('click', showCierreCajaModal);
    document.getElementById('historial-arqueos-btn').addEventListener('click', showHistorialArqueosModal);

    // Eventos para filtros
    document.getElementById('aplicar-filtros-caja').addEventListener('click', aplicarFiltrosCaja);
    document.getElementById('limpiar-filtros-caja').addEventListener('click', limpiarFiltrosCaja);

    // Eventos para modales
    setupCajaModalEvents();

    // Configurar fecha de hoy por defecto
    document.getElementById('filtro-fecha-caja').value = new Date().toISOString().split('T')[0];
}

function setupCajaModalEvents() {
    // Función auxiliar para cerrar modales
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Lista de botones de cierre y sus modales correspondientes
    const closeButtons = [
        { id: 'close-nueva-entrada', modal: 'modal-nueva-entrada' },
        { id: 'cancel-nueva-entrada', modal: 'modal-nueva-entrada' },
        { id: 'close-nueva-salida', modal: 'modal-nueva-salida' },
        { id: 'cancel-nueva-salida', modal: 'modal-nueva-salida' },
        { id: 'close-cierre-caja', modal: 'modal-cierre-caja' },
        { id: 'close-historial-arqueos', modal: 'modal-historial-arqueos' }
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
    const formNuevaEntrada = document.getElementById('form-nueva-entrada');
    if (formNuevaEntrada) {
        formNuevaEntrada.addEventListener('submit', guardarNuevaEntrada);
    }

    const formNuevaSalida = document.getElementById('form-nueva-salida');
    if (formNuevaSalida) {
        formNuevaSalida.addEventListener('submit', guardarNuevaSalida);
    }
}

async function loadCajaData() {
    try {
        // Cargar movimientos de caja
        await loadMovimientosCaja();
        
        // Calcular saldo actual
        calcularSaldoActual();
        
        // Actualizar resumen del día
        updateResumenDia();
        
        // Renderizar movimientos
        renderMovimientosCaja();

    } catch (error) {
        console.error('Error cargando datos de caja:', error);
        showMessage('Error cargando datos de caja', 'error');
    }
}

async function loadMovimientosCaja() {
    try {
        const snapshot = await window.db.collection('movimientos_caja')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        movimientosCajaCache = [];
        snapshot.forEach(doc => {
            movimientosCajaCache.push({ id: doc.id, ...doc.data() });
        });

    } catch (error) {
        console.error('Error cargando movimientos de caja:', error);
    }
}

function calcularSaldoActual() {
    let saldo = 0;
    
    // Calcular saldo basado en todos los movimientos
    movimientosCajaCache.forEach(movimiento => {
        if (movimiento.tipo === 'entrada') {
            saldo += movimiento.monto || 0;
        } else if (movimiento.tipo === 'salida') {
            saldo -= movimiento.monto || 0;
        }
    });
    
    saldoActualCaja = saldo;
    document.getElementById('saldo-actual').textContent = `S/ ${saldo.toFixed(2)}`;
    
    // Actualizar última actualización
    const ahora = new Date().toLocaleString('es-ES');
    document.getElementById('ultima-actualizacion').textContent = `Última actualización: ${ahora}`;
}

function updateResumenDia() {
    const hoy = new Date().toISOString().split('T')[0];
    
    let entradasDia = 0;
    let salidasDia = 0;
    let movimientosDia = 0;
    let ventasDia = 0;
    
    movimientosCajaCache.forEach(movimiento => {
        const fechaMovimiento = movimiento.fecha || (movimiento.timestamp ? 
            movimiento.timestamp.toDate().toISOString().split('T')[0] : null);
        
        if (fechaMovimiento === hoy) {
            movimientosDia++;
            
            if (movimiento.tipo === 'entrada') {
                entradasDia += movimiento.monto || 0;
                if (movimiento.categoria === 'ventas') {
                    ventasDia += movimiento.monto || 0;
                }
            } else if (movimiento.tipo === 'salida') {
                salidasDia += movimiento.monto || 0;
            }
        }
    });
    
    document.getElementById('entradas-dia').textContent = `S/ ${entradasDia.toFixed(2)}`;
    document.getElementById('salidas-dia').textContent = `S/ ${salidasDia.toFixed(2)}`;
    document.getElementById('ventas-dia').textContent = `S/ ${ventasDia.toFixed(2)}`;
    document.getElementById('total-movimientos').textContent = movimientosDia;
}

function renderMovimientosCaja(movimientos = null) {
    const tbody = document.getElementById('movimientos-caja-tbody');
    const movimientosAMostrar = movimientos || movimientosCajaCache;

    if (movimientosAMostrar.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                    No hay movimientos de caja registrados
                </td>
            </tr>
        `;
        return;
    }

    let saldoAcumulado = 0;
    
    // Calcular saldo inicial
    const movimientosOrdenados = [...movimientosAMostrar].reverse();
    
    tbody.innerHTML = movimientosOrdenados.map((movimiento, index) => {
        const fechaHora = movimiento.timestamp ? 
            new Date(movimiento.timestamp.toDate()).toLocaleString('es-ES') : 
            movimiento.fecha || 'Sin fecha';
        
        const tipoClase = movimiento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
        const montoFormateado = movimiento.tipo === 'entrada' ? 
            `+S/ ${(movimiento.monto || 0).toFixed(2)}` : 
            `-S/ ${(movimiento.monto || 0).toFixed(2)}`;
        
        // Calcular saldo acumulado
        if (movimiento.tipo === 'entrada') {
            saldoAcumulado += movimiento.monto || 0;
        } else {
            saldoAcumulado -= movimiento.monto || 0;
        }

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fechaHora}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movimiento.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${movimiento.categoria || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${movimiento.descripcion || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${tipoClase}">
                    ${montoFormateado}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    S/ ${saldoAcumulado.toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${movimiento.usuario || 'Sistema'}
                </td>
            </tr>
        `;
    }).reverse().join('');
}

function showNuevaEntradaModal() {
    document.getElementById('form-nueva-entrada').reset();
    document.getElementById('modal-nueva-entrada').classList.add('active');
}

function showNuevaSalidaModal() {
    document.getElementById('form-nueva-salida').reset();
    document.getElementById('modal-nueva-salida').classList.add('active');
}

async function guardarNuevaEntrada(e) {
    e.preventDefault();
    
    const monto = parseFloat(document.getElementById('entrada-monto').value);
    const categoria = document.getElementById('entrada-categoria').value;
    const descripcion = document.getElementById('entrada-descripcion').value;
    
    if (monto <= 0) {
        showMessage('El monto debe ser mayor a 0', 'error');
        return;
    }
    
    try {
        const movimientoData = {
            tipo: 'entrada',
            monto: monto,
            categoria: categoria,
            descripcion: descripcion,
            fecha: new Date().toISOString().split('T')[0],
            timestamp: window.serverTimestamp(),
            usuario: window.currentUser.email,
            saldoAnterior: saldoActualCaja,
            saldoNuevo: saldoActualCaja + monto
        };
        
        await window.db.collection('movimientos_caja').add(movimientoData);
        
        // Cerrar modal y recargar datos
        document.getElementById('modal-nueva-entrada').classList.remove('active');
        await loadMovimientosCaja();
        calcularSaldoActual();
        updateResumenDia();
        renderMovimientosCaja();
        
        showMessage('Entrada registrada correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando entrada:', error);
        showMessage('Error guardando la entrada', 'error');
    }
}

async function guardarNuevaSalida(e) {
    e.preventDefault();
    
    const monto = parseFloat(document.getElementById('salida-monto').value);
    const categoria = document.getElementById('salida-categoria').value;
    const descripcion = document.getElementById('salida-descripcion').value;
    
    if (monto <= 0) {
        showMessage('El monto debe ser mayor a 0', 'error');
        return;
    }
    
    if (monto > saldoActualCaja) {
        if (!confirm(`El monto a retirar (S/ ${monto.toFixed(2)}) es mayor al saldo actual (S/ ${saldoActualCaja.toFixed(2)}). ¿Deseas continuar?`)) {
            return;
        }
    }
    
    try {
        const movimientoData = {
            tipo: 'salida',
            monto: monto,
            categoria: categoria,
            descripcion: descripcion,
            fecha: new Date().toISOString().split('T')[0],
            timestamp: window.serverTimestamp(),
            usuario: window.currentUser.email,
            saldoAnterior: saldoActualCaja,
            saldoNuevo: saldoActualCaja - monto
        };
        
        await window.db.collection('movimientos_caja').add(movimientoData);
        
        // Cerrar modal y recargar datos
        document.getElementById('modal-nueva-salida').classList.remove('active');
        await loadMovimientosCaja();
        calcularSaldoActual();
        updateResumenDia();
        renderMovimientosCaja();
        
        showMessage('Salida registrada correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando salida:', error);
        showMessage('Error guardando la salida', 'error');
    }
}

function aplicarFiltrosCaja() {
    const fecha = document.getElementById('filtro-fecha-caja').value;
    const tipo = document.getElementById('filtro-tipo-movimiento').value;
    const categoria = document.getElementById('filtro-categoria-caja').value;
    
    let movimientosFiltrados = [...movimientosCajaCache];
    
    // Filtrar por fecha
    if (fecha) {
        movimientosFiltrados = movimientosFiltrados.filter(movimiento => {
            const fechaMovimiento = movimiento.fecha || (movimiento.timestamp ? 
                movimiento.timestamp.toDate().toISOString().split('T')[0] : null);
            return fechaMovimiento === fecha;
        });
    }
    
    // Filtrar por tipo
    if (tipo !== 'todos') {
        movimientosFiltrados = movimientosFiltrados.filter(movimiento => 
            movimiento.tipo === tipo
        );
    }
    
    // Filtrar por categoría
    if (categoria !== 'todas') {
        movimientosFiltrados = movimientosFiltrados.filter(movimiento => 
            movimiento.categoria === categoria
        );
    }
    
    renderMovimientosCaja(movimientosFiltrados);
}

function limpiarFiltrosCaja() {
    document.getElementById('filtro-fecha-caja').value = '';
    document.getElementById('filtro-tipo-movimiento').value = 'todos';
    document.getElementById('filtro-categoria-caja').value = 'todas';
    renderMovimientosCaja();
}

function showCierreCajaModal() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaFormateada = new Date().toLocaleDateString('es-ES');
    
    // Calcular datos del día
    let entradasDia = 0;
    let salidasDia = 0;
    let movimientosDia = 0;
    
    movimientosCajaCache.forEach(movimiento => {
        const fechaMovimiento = movimiento.fecha || (movimiento.timestamp ? 
            movimiento.timestamp.toDate().toISOString().split('T')[0] : null);
        
        if (fechaMovimiento === hoy) {
            movimientosDia++;
            
            if (movimiento.tipo === 'entrada') {
                entradasDia += movimiento.monto || 0;
            } else if (movimiento.tipo === 'salida') {
                salidasDia += movimiento.monto || 0;
            }
        }
    });
    
    const saldoInicial = saldoActualCaja - entradasDia + salidasDia;
    
    const contenidoCierre = `
        <div class="space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-blue-800 mb-3">Resumen del Día - ${fechaFormateada}</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-600">Saldo Inicial:</span>
                        <span class="font-semibold text-gray-900 ml-2">S/ ${saldoInicial.toFixed(2)}</span>
                    </div>
                    <div>
                        <span class="text-gray-600">Movimientos:</span>
                        <span class="font-semibold text-gray-900 ml-2">${movimientosDia}</span>
                    </div>
                    <div>
                        <span class="text-green-600">Total Entradas:</span>
                        <span class="font-semibold text-green-800 ml-2">S/ ${entradasDia.toFixed(2)}</span>
                    </div>
                    <div>
                        <span class="text-red-600">Total Salidas:</span>
                        <span class="font-semibold text-red-800 ml-2">S/ ${salidasDia.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                    <span class="text-lg font-semibold text-green-800">Saldo Final:</span>
                    <span class="text-2xl font-bold text-green-900">S/ ${saldoActualCaja.toFixed(2)}</span>
                </div>
            </div>
            
            <form id="form-cierre-caja">
                <div class="mb-4">
                    <label for="cierre-observaciones" class="block text-sm font-medium text-gray-700 mb-1">Observaciones del Cierre</label>
                    <textarea id="cierre-observaciones" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Observaciones adicionales sobre el cierre de caja..."></textarea>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button type="button" onclick="document.getElementById('modal-cierre-caja').classList.remove('active')" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button type="submit" class="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600">
                        Confirmar Cierre
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.getElementById('cierre-caja-content').innerHTML = contenidoCierre;
    document.getElementById('form-cierre-caja').addEventListener('submit', procesarCierreCaja);
    document.getElementById('modal-cierre-caja').classList.add('active');
}

async function procesarCierreCaja(e) {
    e.preventDefault();
    
    const observaciones = document.getElementById('cierre-observaciones').value;
    const hoy = new Date().toISOString().split('T')[0];
    
    try {
        // Calcular datos del cierre
        let entradasDia = 0;
        let salidasDia = 0;
        
        movimientosCajaCache.forEach(movimiento => {
            const fechaMovimiento = movimiento.fecha || (movimiento.timestamp ? 
                movimiento.timestamp.toDate().toISOString().split('T')[0] : null);
            
            if (fechaMovimiento === hoy) {
                if (movimiento.tipo === 'entrada') {
                    entradasDia += movimiento.monto || 0;
                } else if (movimiento.tipo === 'salida') {
                    salidasDia += movimiento.monto || 0;
                }
            }
        });
        
        const saldoInicial = saldoActualCaja - entradasDia + salidasDia;
        
        const cierreData = {
            fecha: hoy,
            saldoInicial: saldoInicial,
            totalEntradas: entradasDia,
            totalSalidas: salidasDia,
            saldoFinal: saldoActualCaja,
            observaciones: observaciones,
            usuario: window.currentUser.email,
            timestamp: window.serverTimestamp()
        };
        
        await window.db.collection('arqueos_caja').add(cierreData);
        
        document.getElementById('modal-cierre-caja').classList.remove('active');
        showMessage('Cierre de caja procesado correctamente', 'success');
        
    } catch (error) {
        console.error('Error procesando cierre de caja:', error);
        showMessage('Error procesando el cierre de caja', 'error');
    }
}

async function showHistorialArqueosModal() {
    try {
        const snapshot = await window.db.collection('arqueos_caja')
            .orderBy('fecha', 'desc')
            .limit(30)
            .get();
        
        const arqueos = [];
        snapshot.forEach(doc => {
            arqueos.push({ id: doc.id, ...doc.data() });
        });
        
        const tbody = document.getElementById('arqueos-tbody');
        
        if (arqueos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-3 text-center text-gray-500">
                        No hay arqueos de caja registrados
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = arqueos.map(arqueo => {
                const fecha = arqueo.fecha ? new Date(arqueo.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
                
                return `
                    <tr class="hover:bg-gray-50">
                        <td class="px-4 py-2 text-sm text-gray-900">${fecha}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">S/ ${(arqueo.saldoInicial || 0).toFixed(2)}</td>
                        <td class="px-4 py-2 text-sm text-green-600">S/ ${(arqueo.totalEntradas || 0).toFixed(2)}</td>
                        <td class="px-4 py-2 text-sm text-red-600">S/ ${(arqueo.totalSalidas || 0).toFixed(2)}</td>
                        <td class="px-4 py-2 text-sm font-semibold text-gray-900">S/ ${(arqueo.saldoFinal || 0).toFixed(2)}</td>
                        <td class="px-4 py-2 text-sm text-gray-500">${arqueo.usuario || 'Sistema'}</td>
                    </tr>
                `;
            }).join('');
        }
        
        document.getElementById('modal-historial-arqueos').classList.add('active');
        
    } catch (error) {
        console.error('Error cargando historial de arqueos:', error);
        showMessage('Error cargando historial de arqueos', 'error');
    }
}

// Función para registrar automáticamente movimientos de caja desde otros módulos
window.registrarMovimientoCaja = async function(tipo, monto, categoria, descripcion, relatedTo = null, relatedId = null) {
    try {
        const movimientoData = {
            tipo: tipo, // 'entrada' o 'salida'
            monto: monto,
            categoria: categoria,
            descripcion: descripcion,
            fecha: new Date().toISOString().split('T')[0],
            timestamp: window.serverTimestamp(),
            usuario: window.currentUser ? window.currentUser.email : 'Sistema',
            saldoAnterior: saldoActualCaja,
            saldoNuevo: tipo === 'entrada' ? saldoActualCaja + monto : saldoActualCaja - monto,
            relatedTo: relatedTo, // 'venta', 'compra', etc.
            relatedId: relatedId   // ID del documento relacionado
        };
        
        await window.db.collection('movimientos_caja').add(movimientoData);
        
        // Actualizar saldo local
        if (tipo === 'entrada') {
            saldoActualCaja += monto;
        } else {
            saldoActualCaja -= monto;
        }
        
        return true;
    } catch (error) {
        console.error('Error registrando movimiento de caja:', error);
        return false;
    }
};

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

console.log('admin-caja.js cargado correctamente');
