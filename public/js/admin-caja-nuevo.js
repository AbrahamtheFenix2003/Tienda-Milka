// admin-caja-nuevo.js - Módulo de Caja Simplificado
console.log('Cargando admin-caja-nuevo.js...');

let movimientosCajaCache = [];
let saldoActualCaja = 0;

window.loadCaja = function() {
    console.log('Ejecutando loadCaja...');
    
    // Verificar permisos - permitir acceso a admins (super admins y super sellers)
    if (!window.currentUser || !window.isAdmin(window.currentUser.email)) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para gestionar la caja</p>
                <p class="text-gray-500 text-sm mt-2">Solo super admins y super sellers pueden acceder</p>
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
                    <button id="recargar-datos-caja" class="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 text-sm">
                        <i class="fas fa-sync-alt mr-1"></i>Recargar
                    </button>
                    <button id="nueva-entrada-btn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                        <i class="fas fa-plus mr-2"></i>Entrada
                    </button>
                    <button id="nueva-salida-btn" class="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                        <i class="fas fa-minus mr-2"></i>Salida
                    </button>
                </div>
            </div>

            <!-- Saldo Actual de Caja - Tarjeta Principal -->
            <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-2xl font-semibold mb-2">Saldo Actual de Caja</h3>
                        <p class="text-5xl font-bold" id="saldo-actual">S/ 0.00</p>
                        <p class="text-lg opacity-90 mt-2" id="ultima-actualizacion">Última actualización: --</p>
                    </div>
                    <div class="text-right">
                        <i class="fas fa-cash-register text-6xl opacity-80"></i>
                    </div>
                </div>
                <div class="mt-6 pt-4 border-t border-blue-400 border-opacity-50">
                    <div class="grid grid-cols-2 gap-4 text-sm opacity-90">
                        <div>
                            <span class="block">Total Entradas:</span>
                            <span class="font-semibold text-lg" id="total-entradas">S/ 0.00</span>
                        </div>
                        <div>
                            <span class="block">Total Salidas:</span>
                            <span class="font-semibold text-lg" id="total-salidas">S/ 0.00</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filtros -->
            <div class="bg-white p-4 rounded-lg shadow">
                <div class="flex flex-wrap gap-4 items-center">
                    <div class="flex-shrink-0">
                        <input type="date" id="filtro-fecha-caja" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div class="flex-shrink-0">
                        <select id="filtro-tipo-movimiento" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="todos">Todos los movimientos</option>
                            <option value="entrada">Solo entradas</option>
                            <option value="salida">Solo salidas</option>
                        </select>
                    </div>

                    <div class="flex-shrink-0">
                        <select id="filtro-categoria-caja" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="todas">Todas las categorías</option>
                            <option value="ventas">Ventas</option>
                            <option value="compras">Compras</option>
                            <option value="gastos">Gastos</option>
                            <option value="inyeccion-dinero">Inyección de Dinero</option>
                            <option value="egresos-manuales">Egresos Manuales</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>

                    <div class="flex-shrink-0">
                        <button id="aplicar-filtros-caja" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
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

            <!-- Movimientos de Caja -->
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
        <div id="modal-nueva-entrada" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center hidden z-50">
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
                            <option value="inyeccion-dinero">Inyección de Dinero</option>
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
        <div id="modal-nueva-salida" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center hidden z-50">
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
                            <option value="egresos-manuales">Egresos Manuales</option>
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
    `;

    document.getElementById('content-area').innerHTML = content;
    
    // Configurar eventos
    setupCajaEvents();
    
    // Cargar datos
    loadCajaData();
};

function setupCajaEvents() {
    console.log('Configurando eventos de caja...');
    
    // Eventos principales
    const recargarDatosBtn = document.getElementById('recargar-datos-caja');
    const nuevaEntradaBtn = document.getElementById('nueva-entrada-btn');
    const nuevaSalidaBtn = document.getElementById('nueva-salida-btn');
    
    if (recargarDatosBtn) {
        recargarDatosBtn.addEventListener('click', async () => {
            console.log('🔄 Recargando datos de caja...');
            recargarDatosBtn.disabled = true;
            recargarDatosBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Cargando...';
            
            try {
                await loadCajaData();
                showMessage('Datos de caja recargados correctamente', 'success');
            } catch (error) {
                console.error('Error recargando datos:', error);
                showMessage('Error recargando datos de caja', 'error');
            } finally {
                recargarDatosBtn.disabled = false;
                recargarDatosBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i>Recargar';
            }
        });
    }
    
    if (nuevaEntradaBtn) nuevaEntradaBtn.addEventListener('click', showNuevaEntradaModal);
    if (nuevaSalidaBtn) nuevaSalidaBtn.addEventListener('click', showNuevaSalidaModal);

    // Eventos para filtros
    document.getElementById('aplicar-filtros-caja').addEventListener('click', aplicarFiltrosCaja);
    document.getElementById('limpiar-filtros-caja').addEventListener('click', limpiarFiltrosCaja);

    // Eventos para modales
    setupModalEvents();

    // Configurar fecha de hoy por defecto
    document.getElementById('filtro-fecha-caja').value = new Date().toISOString().split('T')[0];
}

function setupModalEvents() {
    // Eventos para cerrar modales
    document.getElementById('close-nueva-entrada').addEventListener('click', () => {
        document.getElementById('modal-nueva-entrada').classList.add('hidden');
    });
    
    document.getElementById('cancel-nueva-entrada').addEventListener('click', () => {
        document.getElementById('modal-nueva-entrada').classList.add('hidden');
    });
    
    document.getElementById('close-nueva-salida').addEventListener('click', () => {
        document.getElementById('modal-nueva-salida').classList.add('hidden');
    });
    
    document.getElementById('cancel-nueva-salida').addEventListener('click', () => {
        document.getElementById('modal-nueva-salida').classList.add('hidden');
    });

    // Eventos de formularios
    document.getElementById('form-nueva-entrada').addEventListener('submit', guardarNuevaEntrada);
    document.getElementById('form-nueva-salida').addEventListener('submit', guardarNuevaSalida);
    
    // Cerrar modales al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (e.target.id === 'modal-nueva-entrada' || e.target.id === 'modal-nueva-salida') {
            e.target.classList.add('hidden');
        }
    });
}

async function loadCajaData() {
    try {
        console.log('📊 Cargando datos de caja...');
        
        // Cargar movimientos de caja
        await loadMovimientosCaja();
        
        // Calcular saldo actual
        calcularSaldoActual();
        
        // Renderizar movimientos
        renderMovimientosCaja();

    } catch (error) {
        console.error('Error cargando datos de caja:', error);
        showMessage('Error cargando datos de caja', 'error');
    }
}

async function loadMovimientosCaja() {
    try {
        console.log('📦 Cargando movimientos de caja...');
        
        const snapshot = await window.db.collection('movimientos_caja')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();
        
        movimientosCajaCache = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            movimientosCajaCache.push({ id: doc.id, ...data });
        });
        
        console.log(`📦 Total movimientos cargados: ${movimientosCajaCache.length}`);

    } catch (error) {
        console.error('Error cargando movimientos de caja:', error);
    }
}

function calcularSaldoActual() {
    console.log('📊 Calculando saldo actual de caja...');
    
    let totalEntradas = 0;
    let totalSalidas = 0;
    let saldo = 0;
    
    // Calcular desde todos los movimientos (excluyendo apertura de caja)
    movimientosCajaCache.forEach((movimiento, index) => {
        // Excluir apertura de caja
        if (movimiento.tipo === 'apertura_caja') {
            console.log(`⏭️ Saltando apertura de caja: ${movimiento.descripcion}`);
            return;
        }
        
        if (movimiento.tipo === 'entrada') {
            totalEntradas += movimiento.monto || 0;
            saldo += movimiento.monto || 0;
            console.log(`✅ ENTRADA S/ ${(movimiento.monto || 0).toFixed(2)} - ${movimiento.descripcion || 'Sin desc'}`);
        } else if (movimiento.tipo === 'salida') {
            totalSalidas += movimiento.monto || 0;
            saldo -= movimiento.monto || 0;
            console.log(`❌ SALIDA S/ ${(movimiento.monto || 0).toFixed(2)} - ${movimiento.descripcion || 'Sin desc'}`);
        }
    });
    
    // Actualizar elementos del DOM
    saldoActualCaja = saldo;
    document.getElementById('saldo-actual').textContent = `S/ ${saldo.toFixed(2)}`;
    document.getElementById('total-entradas').textContent = `S/ ${totalEntradas.toFixed(2)}`;
    document.getElementById('total-salidas').textContent = `S/ ${totalSalidas.toFixed(2)}`;
    
    // Actualizar última actualización
    const ahora = new Date().toLocaleString('es-ES');
    document.getElementById('ultima-actualizacion').textContent = `Última actualización: ${ahora}`;
    
    console.log(`📊 Resumen calculado:`);
    console.log(`   Total Entradas: S/ ${totalEntradas.toFixed(2)}`);
    console.log(`   Total Salidas: S/ ${totalSalidas.toFixed(2)}`);
    console.log(`   Saldo Actual: S/ ${saldo.toFixed(2)}`);
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
    
    // Calcular saldo acumulado para cada fila
    const movimientosOrdenados = [...movimientosAMostrar].reverse();
    
    tbody.innerHTML = movimientosOrdenados.map((movimiento, index) => {
        const fechaHora = movimiento.timestamp ? 
            new Date(movimiento.timestamp.toDate()).toLocaleString('es-ES') : 
            movimiento.fecha || 'Sin fecha';
        
        const tipoClase = movimiento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600';
        const tipoTexto = movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida';
        const montoFormateado = movimiento.tipo === 'entrada' ? 
            `+S/ ${(movimiento.monto || 0).toFixed(2)}` : 
            `-S/ ${(movimiento.monto || 0).toFixed(2)}`;
        
        // Calcular saldo acumulado (excluyendo apertura de caja)
        if (movimiento.tipo === 'entrada') {
            saldoAcumulado += movimiento.monto || 0;
        } else if (movimiento.tipo === 'salida') {
            saldoAcumulado -= movimiento.monto || 0;
        }

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fechaHora}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        movimiento.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${tipoTexto}
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
    document.getElementById('modal-nueva-entrada').classList.remove('hidden');
}

function showNuevaSalidaModal() {
    document.getElementById('form-nueva-salida').reset();
    document.getElementById('modal-nueva-salida').classList.remove('hidden');
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
        document.getElementById('modal-nueva-entrada').classList.add('hidden');
        await loadCajaData();
        
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
        document.getElementById('modal-nueva-salida').classList.add('hidden');
        await loadCajaData();
        
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

// Función para registrar automáticamente movimientos de caja desde otros módulos
window.registrarMovimientoCaja = async function(tipo, monto, categoria, descripcion, relatedTo = null, relatedId = null) {
    try {
        console.log(`📝 Registrando movimiento de caja: ${tipo} S/ ${monto.toFixed(2)} - ${descripcion}`);
        
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
        
        console.log(`✅ Movimiento de caja registrado exitosamente`);
        
        return true;
    } catch (error) {
        console.error('❌ Error registrando movimiento de caja:', error);
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

console.log('admin-caja-nuevo.js cargado correctamente');
