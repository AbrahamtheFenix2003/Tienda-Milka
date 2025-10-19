// public/js/admin/pages/rentabilidad/ui.js

/**
 * Renderiza el esqueleto principal de la interfaz de usuario para el análisis de rentabilidad.
 */
export function renderRentabilidadUI() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) {
        console.error('No se encontró el área de contenido');
        return;
    }

    contentArea.innerHTML = `
        <div class="space-y-6">
            <!-- Header y Filtros -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Análisis de Rentabilidad</h2>
                <div class="flex flex-wrap items-center gap-4">
                    <div class="flex-grow">
                        <label for="date-range-picker" class="text-sm font-medium text-gray-700">Rango de Fechas</label>
                        <input type="date" id="start-date" class="mt-1 p-2 border rounded-md">
                        <span class="mx-2">a</span>
                        <input type="date" id="end-date" class="mt-1 p-2 border rounded-md">
                    </div>
                    <button id="apply-filters-btn" class="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600">
                        <i class="fas fa-filter mr-2"></i>Analizar
                    </button>
                </div>
            </div>

            <!-- KPIs (Indicadores Clave) -->
            <div id="kpi-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 text-center">
                <!-- Los KPIs se cargarán aquí -->
                <p class="text-gray-500 col-span-full py-8">Seleccione un rango de fechas para ver el análisis.</p>
            </div>

            <!-- Gráficos eliminados: se removieron los canvases de Evolución de Ganancia Neta y Ganancia Bruta por Categoría -->

            <!-- Tabla de Desglose por Producto -->
            <div id="products-table-container" class="bg-white rounded-lg shadow-md overflow-hidden hidden">
                <div class="p-6 flex justify-between items-center">
                     <h3 class="text-xl font-bold">Desglose por Producto</h3>
                     <button id="export-excel-btn" class="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                        <i class="fas fa-file-excel mr-2"></i>Exportar a Excel
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="p-3 text-left text-xs font-semibold text-gray-600 uppercase">Producto</th>
                                <th class="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Unidades Vendidas</th>
                                <th class="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Ingreso Total</th>
                                <th class="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Costo Total</th>
                                <th class="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Ganancia Bruta</th>
                                <th class="p-3 text-right text-xs font-semibold text-gray-600 uppercase">Margen Bruto %</th>
                            </tr>
                        </thead>
                        <tbody id="rentabilidad-products-tbody">
                            <!-- Las filas de la tabla se cargarán aquí -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

/**
 * Actualiza las tarjetas de KPIs con los datos calculados.
 * @param {object} kpis - Objeto con los valores de los KPIs.
 */
export function updateKpiCards(kpis) {
    const container = document.getElementById('kpi-container');
    if (!container) return;

    container.innerHTML = `
        <div class="bg-white p-4 rounded-lg shadow-sm"><p class="text-sm text-gray-500">Entradas de Caja</p><p class="text-2xl font-bold text-blue-600">S/ ${kpis.ingresos.toFixed(2)}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-sm"><p class="text-sm text-gray-500">Ingreso Total de Ventas</p><p class="text-2xl font-bold text-purple-600">S/ ${kpis.ingresoTotalVentas.toFixed(2)}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-sm"><p class="text-sm text-gray-500">Número de Ventas</p><p class="text-2xl font-bold text-indigo-600">${kpis.numeroVentas || 0}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-sm"><p class="text-sm text-gray-500">Costo de Venta</p><p class="text-2xl font-bold text-orange-600">S/ ${kpis.costoVenta.toFixed(2)}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-sm"><p class="text-sm text-gray-500">Ganancia Bruta</p><p class="text-2xl font-bold text-green-600">S/ ${kpis.gananciaBruta.toFixed(2)}</p></div>
        <div class="bg-white p-4 rounded-lg shadow-sm"><p class="text-sm text-gray-500">Gastos Operativos</p><p class="text-2xl font-bold text-red-600">S/ ${kpis.gastosOperativos.toFixed(2)}</p></div>
    `;
}

/**
 * Renderiza la tabla de desglose de productos.
 * @param {Array<object>} products - Array de productos con sus métricas de rentabilidad.
 */
export function renderProductsTable(products) {
    const container = document.getElementById('products-table-container');
    const tbody = document.getElementById('rentabilidad-products-tbody');
    if (!container || !tbody) return;

    container.classList.remove('hidden');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-500">No hay datos de productos vendidos en este período.</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-3 font-medium">${p.nombre}</td>
            <td class="p-3 text-right">${p.unidadesVendidas}</td>
            <td class="p-3 text-right">S/ ${p.ingresoTotal.toFixed(2)}</td>
            <td class="p-3 text-right text-orange-600">S/ ${p.costoTotal.toFixed(2)}</td>
            <td class="p-3 text-right font-semibold ${p.gananciaBruta >= 0 ? 'text-green-600' : 'text-red-600'}">S/ ${p.gananciaBruta.toFixed(2)}</td>
            <td class="p-3 text-right font-semibold ${p.gananciaBruta >= 0 ? 'text-green-600' : 'text-red-600'}">${p.margenBruto.toFixed(1)}%</td>
        </tr>
    `).join('');
}

/* Gráficos removidos: la UI ya no muestra gráficos en esta sección.
   Mantener una función exportada vacía para compatibilidad con llamadas existentes. */
export function renderCharts() {
    // No-op: gráficos eliminados
    return;
}
