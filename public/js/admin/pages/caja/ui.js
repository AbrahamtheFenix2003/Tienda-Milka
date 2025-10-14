import {
    fetchLatestMovimientos,
    addEntrada,
    addSalida,
    deleteMovimiento,
    getMovimientoById,
    updateMovimiento
} from './data.js';

const DEFAULT_RESUMEN = {
    totalEntradas: 0,
    totalSalidas: 0,
    saldoActual: 0
};

const ENTRADA_CATEGORIES = [
    ['ventas', 'Ventas'],
    ['inyeccion-dinero', 'Inyeccion de dinero'],
    ['otros-ingresos', 'Otros ingresos'],
    ['prestamo', 'Prestamo'],
    ['capital', 'Aporte de capital']
];

const SALIDA_CATEGORIES = [
    ['compras', 'Compras de mercaderia'],
    ['egresos-manuales', 'Egresos manuales'],
    ['gastos-operativos', 'Gastos operativos'],
    ['servicios', 'Servicios'],
    ['salarios', 'Salarios'],
    ['impuestos', 'Impuestos'],
    ['retiro-personal', 'Retiro personal'],
    ['otros', 'Otros gastos']
];

const FILTER_TYPE_OPTIONS = [
    ['todos', 'Todos'],
    ['entrada', 'Entradas'],
    ['salida', 'Salidas'],
    ['egreso', 'Egresos']
];

const FILTER_CATEGORY_OPTIONS = [
    ['todas', 'Todas'],
    ['ventas', 'Ventas'],
    ['inyeccion-dinero', 'Inyeccion de dinero'],
    ['otros-ingresos', 'Otros ingresos'],
    ['prestamo', 'Prestamo'],
    ['capital', 'Aporte de capital'],
    ['compras', 'Compras de mercaderia'],
    ['egresos-manuales', 'Egresos manuales'],
    ['gastos-operativos', 'Gastos operativos'],
    ['servicios', 'Servicios'],
    ['salarios', 'Salarios'],
    ['impuestos', 'Impuestos'],
    ['retiro-personal', 'Retiro personal'],
    ['otros', 'Otros']
];

let movimientosState = [];
let resumenState = { ...DEFAULT_RESUMEN };
let documentEventsBound = false;
export function renderCajaUI() {
    const container = document.getElementById('content-area');
    if (!container) {
        console.warn('No se encontro el contenedor principal para la pagina de caja');
        return;
    }

    container.innerHTML = getCajaTemplate();
    movimientosState = [];
    resumenState = { ...DEFAULT_RESUMEN };

    attachElementEvents(container);
    bindDocumentEvents();
}

export function renderUnauthorizedCaja() {
    const container = document.getElementById('content-area');
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600 text-lg">No tienes permisos para gestionar la caja</p>
            <p class="text-gray-500 text-sm mt-2">Solo administradores autorizados pueden acceder</p>
        </div>
    `;
}

export function updateCajaView(movimientos, resumen) {
    movimientosState = Array.isArray(movimientos) ? [...movimientos] : [];
    resumenState = {
        totalEntradas: Number(resumen?.totalEntradas || 0),
        totalSalidas: Number(resumen?.totalSalidas || 0),
        saldoActual: Number(resumen?.saldoActual || 0)
    };

    renderResumen(resumenState);
    renderMovimientosTabla(movimientosState);
}
function attachElementEvents(container) {
    const reloadButton = container.querySelector('#recargar-datos-caja');
    const nuevaEntradaBtn = container.querySelector('#nueva-entrada-btn');
    const nuevaSalidaBtn = container.querySelector('#nueva-salida-btn');
    const aplicarFiltrosBtn = container.querySelector('#aplicar-filtros-caja');
    const limpiarFiltrosBtn = container.querySelector('#limpiar-filtros-caja');
    const limpiarFechasBtn = container.querySelector('#limpiar-fechas-caja');
    const fechaDesdeInput = container.querySelector('#filtro-fecha-desde');
    const fechaHastaInput = container.querySelector('#filtro-fecha-hasta');
    const entradaForm = container.querySelector('#form-nueva-entrada');
    const salidaForm = container.querySelector('#form-nueva-salida');
    const cerrarEntradaBtn = container.querySelector('#close-nueva-entrada');
    const cancelarEntradaBtn = container.querySelector('#cancel-nueva-entrada');
    const cerrarSalidaBtn = container.querySelector('#close-nueva-salida');
    const cancelarSalidaBtn = container.querySelector('#cancel-nueva-salida');
    const movimientosTbody = container.querySelector('#movimientos-caja-tbody');

    if (reloadButton) {
        reloadButton.addEventListener('click', handleReloadClick);
    }
    if (nuevaEntradaBtn) {
        nuevaEntradaBtn.addEventListener('click', () => toggleModal('modal-nueva-entrada', true));
    }
    if (nuevaSalidaBtn) {
        nuevaSalidaBtn.addEventListener('click', () => toggleModal('modal-nueva-salida', true));
    }
    if (aplicarFiltrosBtn) {
        aplicarFiltrosBtn.addEventListener('click', applyFilters);
    }
    if (limpiarFiltrosBtn) {
        limpiarFiltrosBtn.addEventListener('click', resetFilters);
    }
    if (limpiarFechasBtn) {
        limpiarFechasBtn.addEventListener('click', resetDateRange);
    }
    if (fechaDesdeInput) {
        fechaDesdeInput.addEventListener('change', () => updateDateRangeInfo(true));
    }
    if (fechaHastaInput) {
        fechaHastaInput.addEventListener('change', () => updateDateRangeInfo(true));
    }
    if (entradaForm) {
        entradaForm.addEventListener('submit', handleNuevaEntradaSubmit);
    }
    if (salidaForm) {
        salidaForm.addEventListener('submit', handleNuevaSalidaSubmit);
    }
    if (cerrarEntradaBtn) {
        cerrarEntradaBtn.addEventListener('click', () => toggleModal('modal-nueva-entrada', false));
    }
    if (cancelarEntradaBtn) {
        cancelarEntradaBtn.addEventListener('click', () => toggleModal('modal-nueva-entrada', false));
    }
    if (cerrarSalidaBtn) {
        cerrarSalidaBtn.addEventListener('click', () => toggleModal('modal-nueva-salida', false));
    }
    if (cancelarSalidaBtn) {
        cancelarSalidaBtn.addEventListener('click', () => toggleModal('modal-nueva-salida', false));
    }
    if (movimientosTbody) {
        movimientosTbody.addEventListener('click', handleMovimientosTableClick);
    }

    updateDateRangeInfo(false);
}

function bindDocumentEvents() {
    if (documentEventsBound) {
        return;
    }
    document.addEventListener('click', handleDocumentClick);
    documentEventsBound = true;
}

function handleDocumentClick(event) {
    const target = event.target;
    if (!target) {
        return;
    }

    if (target.classList.contains('caja-modal-overlay')) {
        target.classList.add('hidden');
    }
}
async function handleReloadClick(event) {
    const button = event.currentTarget;
    if (!button) {
        return;
    }
    const originalLabel = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Cargando...';

    try {
        const { movimientos, resumen } = await fetchLatestMovimientos();
        updateCajaView(movimientos, resumen);
        showMessage('Datos de caja actualizados', 'success');
    } catch (error) {
        console.error('Error recargando datos de caja:', error);
        showMessage('No se pudo recargar la informacion de caja', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalLabel;
    }
}

async function handleNuevaEntradaSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    const monto = Number(form.querySelector('#entrada-monto')?.value || 0);
    const categoria = form.querySelector('#entrada-categoria')?.value || '';
    const descripcion = (form.querySelector('#entrada-descripcion')?.value || '').trim();

    if (!Number.isFinite(monto) || monto <= 0) {
        showMessage('El monto debe ser mayor a 0', 'error');
        return;
    }

    try {
        const { movimientos, resumen } = await addEntrada({ monto, categoria, descripcion });
        updateCajaView(movimientos, resumen);
        form.reset();
        toggleModal('modal-nueva-entrada', false);
        showMessage('Entrada registrada correctamente', 'success');
    } catch (error) {
        console.error('Error registrando entrada de caja:', error);
        showMessage('No se pudo registrar la entrada', 'error');
    }
}

async function handleNuevaSalidaSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;

    const monto = Number(form.querySelector('#salida-monto')?.value || 0);
    const categoria = form.querySelector('#salida-categoria')?.value || '';
    const descripcion = (form.querySelector('#salida-descripcion')?.value || '').trim();

    if (!Number.isFinite(monto) || monto <= 0) {
        showMessage('El monto debe ser mayor a 0', 'error');
        return;
    }

    const saldoActual = resumenState.saldoActual;
    if (monto > saldoActual) {
        const continuar = window.confirm(
            `El monto a retirar (S/ ${monto.toFixed(2)}) es mayor al saldo disponible (S/ ${saldoActual.toFixed(2)}). Deseas continuar?`
        );
        if (!continuar) {
            return;
        }
    }

    try {
        const { movimientos, resumen } = await addSalida({ monto, categoria, descripcion });
        updateCajaView(movimientos, resumen);
        form.reset();
        toggleModal('modal-nueva-salida', false);
        showMessage('Salida registrada correctamente', 'success');
    } catch (error) {
        console.error('Error registrando salida de caja:', error);
        showMessage('No se pudo registrar la salida', 'error');
    }
}
function handleMovimientosTableClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
        return;
    }

    const movimientoId = actionButton.dataset.id;
    if (!movimientoId) {
        return;
    }

    const action = actionButton.dataset.action;
    if (action === 'edit') {
        handleEditarMovimiento(movimientoId);
    } else if (action === 'delete') {
        handleEliminarMovimiento(movimientoId);
    }
}

async function handleEditarMovimiento(movimientoId) {
    try {
        const movimiento = await getMovimientoById(movimientoId);
        if (!movimiento) {
            showMessage('El movimiento seleccionado no existe', 'error');
            return;
        }

        if (movimiento.relatedTo === 'venta' || movimiento.relatedTo === 'compra') {
            showMessage(
                'No se pueden editar movimientos generados automaticamente. Gestiona la operacion desde su modulo.',
                'warning'
            );
            return;
        }

        mostrarModalEditarMovimiento(movimiento);
    } catch (error) {
        console.error('Error al cargar el movimiento para editar:', error);
        showMessage('No se pudo preparar la edicion del movimiento', 'error');
    }
}

async function handleEliminarMovimiento(movimientoId) {
    const movimiento = movimientosState.find(item => item.id === movimientoId);
    if (!movimiento) {
        showMessage('No se encontro el movimiento seleccionado', 'error');
        return;
    }

    if (movimiento.relatedTo === 'venta' || movimiento.relatedTo === 'compra') {
        showMessage(
            'No se pueden eliminar movimientos generados automaticamente. Gestiona la operacion desde su modulo.',
            'warning'
        );
        return;
    }

    const tipo = movimiento.tipo === 'entrada' ? 'entrada' : 'salida';
    const confirmacion = window.confirm(
        `Estas seguro de eliminar este movimiento de ${tipo} por S/ ${Number(movimiento.monto || 0).toFixed(2)}?\n\nEsta accion no se puede deshacer.`
    );
    if (!confirmacion) {
        return;
    }

    try {
        const { movimientos, resumen } = await deleteMovimiento(movimientoId);
        updateCajaView(movimientos, resumen);
        showMessage('Movimiento eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando movimiento de caja:', error);
        showMessage('No se pudo eliminar el movimiento', 'error');
    }
}

function mostrarModalEditarMovimiento(movimiento) {
    cerrarModalEditarMovimiento();

    const modalHtml = `
        <div id="modal-editar-movimiento" class="fixed inset-0 caja-modal-overlay bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">Editar movimiento</h3>
                    <button id="cerrar-editar-movimiento" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="form-editar-movimiento">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                            <select id="edit-tipo" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="entrada" ${movimiento.tipo === 'entrada' ? 'selected' : ''}>Entrada</option>
                                <option value="salida" ${movimiento.tipo === 'salida' || movimiento.tipo === 'egreso' ? 'selected' : ''}>Salida</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <input id="edit-categoria" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value="${movimiento.categoria || ''}" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                            <textarea id="edit-descripcion" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${movimiento.descripcion || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
                            <input type="number" id="edit-monto" step="0.01" min="0.01" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value="${Number(movimiento.monto || 0)}" />
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" id="cancelar-editar-movimiento" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Guardar cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const cerrarBtn = document.getElementById('cerrar-editar-movimiento');
    const cancelarBtn = document.getElementById('cancelar-editar-movimiento');
    const form = document.getElementById('form-editar-movimiento');

    if (cerrarBtn) {
        cerrarBtn.addEventListener('click', cerrarModalEditarMovimiento);
    }
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', cerrarModalEditarMovimiento);
    }
    if (form) {
        form.addEventListener('submit', event => handleGuardarMovimiento(event, movimiento.id));
    }
}

function cerrarModalEditarMovimiento() {
    const modal = document.getElementById('modal-editar-movimiento');
    if (modal) {
        modal.remove();
    }
}

async function handleGuardarMovimiento(event, movimientoId) {
    event.preventDefault();
    const tipo = document.getElementById('edit-tipo')?.value || 'entrada';
    const categoria = (document.getElementById('edit-categoria')?.value || '').trim();
    const descripcion = (document.getElementById('edit-descripcion')?.value || '').trim();
    const monto = Number(document.getElementById('edit-monto')?.value || 0);

    if (!descripcion) {
        showMessage('La descripcion es obligatoria', 'error');
        return;
    }

    if (!Number.isFinite(monto) || monto <= 0) {
        showMessage('El monto debe ser mayor a 0', 'error');
        return;
    }

    try {
        const { movimientos, resumen } = await updateMovimiento(movimientoId, {
            tipo,
            categoria,
            descripcion,
            monto
        });
        cerrarModalEditarMovimiento();
        updateCajaView(movimientos, resumen);
        showMessage('Movimiento actualizado correctamente', 'success');
    } catch (error) {
        console.error('Error actualizando el movimiento:', error);
        showMessage('No se pudo actualizar el movimiento', 'error');
    }
}
function applyFilters() {
    const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';
    const tipo = document.getElementById('filtro-tipo-movimiento')?.value || 'todos';
    const categoria = document.getElementById('filtro-categoria-caja')?.value || 'todas';

    let filtrados = [...movimientosState];

    if (fechaDesde || fechaHasta) {
        filtrados = filtrados.filter(movimiento => {
            const fechaMovimiento = getFechaISO(movimiento);
            if (!fechaMovimiento) {
                return false;
            }
            if (fechaDesde && fechaMovimiento < fechaDesde) {
                return false;
            }
            if (fechaHasta && fechaMovimiento > fechaHasta) {
                return false;
            }
            return true;
        });
    }

    if (tipo !== 'todos') {
        filtrados = filtrados.filter(movimiento => {
            if (tipo === 'entrada') {
                return movimiento.tipo === 'entrada';
            }
            if (tipo === 'salida') {
                return movimiento.tipo === 'salida' || movimiento.tipo === 'egreso';
            }
            return movimiento.tipo === tipo;
        });
    }

    if (categoria !== 'todas') {
        filtrados = filtrados.filter(movimiento => movimiento.categoria === categoria);
    }

    renderMovimientosTabla(filtrados);
}

function resetFilters() {
    const fechaDesdeInput = document.getElementById('filtro-fecha-desde');
    const fechaHastaInput = document.getElementById('filtro-fecha-hasta');
    const tipoSelect = document.getElementById('filtro-tipo-movimiento');
    const categoriaSelect = document.getElementById('filtro-categoria-caja');

    if (fechaDesdeInput) fechaDesdeInput.value = '';
    if (fechaHastaInput) fechaHastaInput.value = '';
    if (tipoSelect) tipoSelect.value = 'todos';
    if (categoriaSelect) categoriaSelect.value = 'todas';

    updateDateRangeInfo(false);
    renderMovimientosTabla(movimientosState);
}

function resetDateRange() {
    const fechaDesdeInput = document.getElementById('filtro-fecha-desde');
    const fechaHastaInput = document.getElementById('filtro-fecha-hasta');
    if (fechaDesdeInput) fechaDesdeInput.value = '';
    if (fechaHastaInput) fechaHastaInput.value = '';
    updateDateRangeInfo(true);
}

function updateDateRangeInfo(autoApply) {
    const fechaDesde = document.getElementById('filtro-fecha-desde')?.value || '';
    const fechaHasta = document.getElementById('filtro-fecha-hasta')?.value || '';
    const infoElement = document.getElementById('rango-fechas-caja-info');
    if (!infoElement) {
        return;
    }

    if (!fechaDesde && !fechaHasta) {
        infoElement.innerHTML = '';
        infoElement.className = 'mt-1 text-xs text-blue-600 min-h-4';
        if (autoApply) {
            renderMovimientosTabla(movimientosState);
        }
        return;
    }

    if (fechaDesde && fechaHasta) {
        const desde = new Date(fechaDesde).toLocaleDateString('es-PE');
        const hasta = new Date(fechaHasta).toLocaleDateString('es-PE');
        const diffTime = new Date(fechaHasta) - new Date(fechaDesde);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffTime >= 0) {
            infoElement.innerHTML = `<i class="fas fa-calendar-check mr-1"></i>Rango: ${desde} - ${hasta} (${diffDays} dia${diffDays > 1 ? 's' : ''})`;
            infoElement.className = 'mt-1 text-xs text-green-600 min-h-4';
            if (autoApply) {
                applyFilters();
            }
        } else {
            infoElement.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i>La fecha "hasta" debe ser posterior a la fecha "desde"`;
            infoElement.className = 'mt-1 text-xs text-red-600 min-h-4';
        }
        return;
    }

    if (fechaDesde) {
        const desde = new Date(fechaDesde).toLocaleDateString('es-PE');
        infoElement.innerHTML = `<i class="fas fa-calendar-plus mr-1"></i>Desde: ${desde} (sin limite superior)`;
        infoElement.className = 'mt-1 text-xs text-blue-600 min-h-4';
        if (autoApply) {
            applyFilters();
        }
        return;
    }

    if (fechaHasta) {
        const hasta = new Date(fechaHasta).toLocaleDateString('es-PE');
        infoElement.innerHTML = `<i class="fas fa-calendar-minus mr-1"></i>Hasta: ${hasta} (sin limite inferior)`;
        infoElement.className = 'mt-1 text-xs text-blue-600 min-h-4';
        if (autoApply) {
            applyFilters();
        }
    }
}
function renderResumen(resumen) {
    const saldoEl = document.getElementById('saldo-actual');
    const totalEntradasEl = document.getElementById('total-entradas');
    const totalSalidasEl = document.getElementById('total-salidas');
    const ultimaActualizacionEl = document.getElementById('ultima-actualizacion');

    if (saldoEl) {
        saldoEl.textContent = formatCurrency(resumen.saldoActual);
    }
    if (totalEntradasEl) {
        totalEntradasEl.textContent = formatCurrency(resumen.totalEntradas);
    }
    if (totalSalidasEl) {
        totalSalidasEl.textContent = formatCurrency(resumen.totalSalidas);
    }
    if (ultimaActualizacionEl) {
        const ahora = new Date().toLocaleString('es-ES');
        ultimaActualizacionEl.textContent = `Ultima actualizacion: ${ahora}`;
    }
}

function renderMovimientosTabla(movimientos) {
    const tbody = document.getElementById('movimientos-caja-tbody');
    if (!tbody) {
        return;
    }

    if (!movimientos.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    No hay movimientos registrados
                </td>
            </tr>
        `;
        return;
    }

    const movimientosAsc = [...movimientos].sort((a, b) => {
        const fechaA = getComparableDate(a);
        const fechaB = getComparableDate(b);
        return fechaA - fechaB;
    });

    let saldoAcumulado = 0;
    const filas = movimientosAsc.map(movimiento => {
        if (movimiento.tipo === 'entrada') {
            saldoAcumulado += Number(movimiento.monto || 0);
        } else if (movimiento.tipo === 'salida' || movimiento.tipo === 'egreso') {
            saldoAcumulado -= Number(movimiento.monto || 0);
        }
        return {
            movimiento,
            saldo: saldoAcumulado
        };
    }).reverse();

    tbody.innerHTML = filas.map(({ movimiento, saldo }) => {
        const fechaHora = obtenerFechaLegible(movimiento);
        const tipoEsEntrada = movimiento.tipo === 'entrada';
        const etiquetaTipo = tipoEsEntrada ? 'Entrada' : 'Salida';
        const claseTipo = tipoEsEntrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const claseMonto = tipoEsEntrada ? 'text-green-600' : 'text-red-600';
        const signo = tipoEsEntrada ? '+' : '-';
        const monto = Number(movimiento.monto || 0).toFixed(2);

        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${fechaHora}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${claseTipo}">
                        ${etiquetaTipo}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${movimiento.categoria || '-'}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${movimiento.descripcion || '-'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${claseMonto}">
                    ${signo}S/ ${monto}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    S/ ${Number(saldo).toFixed(2)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${movimiento.usuario || 'Sistema'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button data-action="edit" data-id="${movimiento.id}" class="text-blue-600 hover:text-blue-900 p-1 rounded" title="Editar movimiento">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button data-action="delete" data-id="${movimiento.id}" class="text-red-600 hover:text-red-900 p-1 rounded" title="Eliminar movimiento">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function obtenerFechaLegible(movimiento) {
    const fecha = getComparableDate(movimiento);
    if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
        return fecha.toLocaleString('es-ES');
    }
    if (movimiento.fecha) {
        return movimiento.fecha;
    }
    return 'Sin fecha';
}

function getFechaISO(movimiento) {
    const comparable = getComparableDate(movimiento);
    if (comparable instanceof Date && !Number.isNaN(comparable.getTime())) {
        return comparable.toISOString().split('T')[0];
    }
    if (typeof movimiento.fecha === 'string') {
        return movimiento.fecha;
    }
    return null;
}

function getComparableDate(movimiento) {
    if (movimiento.timestamp?.toDate) {
        return movimiento.timestamp.toDate();
    }
    if (movimiento.timestamp instanceof Date) {
        return movimiento.timestamp;
    }
    if (typeof movimiento.timestamp === 'string') {
        const parsed = new Date(movimiento.timestamp);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    if (movimiento.fecha instanceof Date) {
        return movimiento.fecha;
    }
    if (typeof movimiento.fecha === 'string') {
        const parsed = new Date(movimiento.fecha);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    return new Date(0);
}
function toggleModal(modalId, visible) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        return;
    }
    if (visible) {
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function formatCurrency(value) {
    const monto = Number(value || 0);
    return `S/ ${monto.toFixed(2)}`;
}

function showMessage(message, type = 'info') {
    const alerts = {
        success: 'bg-green-100 border-green-400 text-green-700',
        error: 'bg-red-100 border-red-400 text-red-700',
        warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
        info: 'bg-blue-100 border-blue-400 text-blue-700'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 z-50 ${alerts[type] ?? alerts.info} border px-4 py-3 rounded shadow-lg max-w-md`;
    alertDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icons[type] ?? icons.info} mr-2"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}
function getCajaTemplate() {
    return `
        <div class="space-y-6">
            ${renderHeader()}
            ${renderSummaryCard()}
            ${renderFilters()}
            ${renderMovimientosSection()}
        </div>
        ${renderEntradaModal()}
        ${renderSalidaModal()}
    `;
}

function renderHeader() {
    return `
        <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-800">Gestion de Caja</h2>
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
    `;
}

function renderSummaryCard() {
    return `
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <h3 class="text-2xl font-semibold mb-2">Saldo actual de caja</h3>
                    <p class="text-5xl font-bold" id="saldo-actual">S/ 0.00</p>
                    <p class="text-lg opacity-90 mt-2" id="ultima-actualizacion">Ultima actualizacion: --</p>
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
    `;
}

function renderFilters() {
    return `
        <div class="bg-white p-4 rounded-lg shadow">
            <div class="flex flex-wrap gap-4 items-end">
                <div class="border border-blue-200 rounded-lg p-3 bg-blue-50">
                    <label class="block text-sm font-medium text-blue-700 mb-2">
                        <i class="fas fa-calendar-alt mr-1"></i>Rango de fechas
                    </label>
                    <div class="flex items-center gap-2">
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Desde</label>
                            <input type="date" id="filtro-fecha-desde" class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        <div class="text-gray-400 mt-4">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                        <div>
                            <label class="block text-xs text-gray-600 mb-1">Hasta</label>
                            <input type="date" id="filtro-fecha-hasta" class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        </div>
                        <button id="limpiar-fechas-caja" type="button" class="bg-blue-500 text-white px-2 py-2 rounded hover:bg-blue-600 transition-colors mt-4" title="Limpiar rango de fechas">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div id="rango-fechas-caja-info" class="mt-1 text-xs text-blue-600 min-h-4"></div>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
                    <select id="filtro-tipo-movimiento" class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        ${buildOptions(FILTER_TYPE_OPTIONS)}
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select id="filtro-categoria-caja" class="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                        ${buildOptions(FILTER_CATEGORY_OPTIONS)}
                    </select>
                </div>

                <div class="flex space-x-3">
                    <button id="aplicar-filtros-caja" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                        <i class="fas fa-filter mr-2"></i>Aplicar filtros
                    </button>
                    <button id="limpiar-filtros-caja" class="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        Limpiar
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderMovimientosSection() {
    return `
        <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Movimientos de caja</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripcion</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="movimientos-caja-tbody" class="bg-white divide-y divide-gray-200"></tbody>
                </table>
            </div>
        </div>
    `;
}

function renderEntradaModal() {
    return `
        <div id="modal-nueva-entrada" class="fixed inset-0 caja-modal-overlay bg-gray-600 bg-opacity-50 flex items-center justify-center hidden z-50">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-green-600">
                        <i class="fas fa-plus mr-2"></i>Nueva entrada de dinero
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
                        <label for="entrada-categoria" class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select id="entrada-categoria" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" required>
                            ${buildOptions(ENTRADA_CATEGORIES, { includeEmpty: true, emptyLabel: 'Selecciona una categoria' })}
                        </select>
                    </div>
                    <div class="mb-4">
                        <label for="entrada-descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                        <textarea id="entrada-descripcion" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Describe el motivo de esta entrada..." required></textarea>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-nueva-entrada" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" class="px-4 py-2 text-white bg-green-500 rounded-md hover:bg-green-600">Registrar entrada</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function renderSalidaModal() {
    return `
        <div id="modal-nueva-salida" class="fixed inset-0 caja-modal-overlay bg-gray-600 bg-opacity-50 flex items-center justify-center hidden z-50">
            <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-red-600">
                        <i class="fas fa-minus mr-2"></i>Nueva salida de dinero
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
                        <label for="salida-categoria" class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                        <select id="salida-categoria" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" required>
                            ${buildOptions(SALIDA_CATEGORIES, { includeEmpty: true, emptyLabel: 'Selecciona una categoria' })}
                        </select>
                    </div>
                    <div class="mb-4">
                        <label for="salida-descripcion" class="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                        <textarea id="salida-descripcion" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Describe el motivo de esta salida..." required></textarea>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancel-nueva-salida" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" class="px-4 py-2 text-white bg-red-500 rounded-md hover:bg-red-600">Registrar salida</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function buildOptions(options, settings = {}) {
    const config = {
        includeEmpty: false,
        emptyLabel: 'Selecciona'
    };
    Object.assign(config, settings);

    const parts = [];
    if (config.includeEmpty) {
        parts.push(`<option value="">${config.emptyLabel}</option>`);
    }
    options.forEach(([value, label]) => {
        parts.push(`<option value="${value}">${label}</option>`);
    });
    return parts.join('');
}

