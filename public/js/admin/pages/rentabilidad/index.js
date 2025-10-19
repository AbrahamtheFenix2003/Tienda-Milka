import { getProfitabilityData } from './data.js';
import { renderRentabilidadUI, updateKpiCards, renderProductsTable, renderCharts } from './ui.js';

// Estado en memoria del último análisis para exportación
let lastProfitabilityResult = null;

// Carga dinámica de SheetJS (XLSX) si no está presente
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}

async function ensureXlsxLoaded() {
  if (window.XLSX) return;
  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
}

export async function loadRentabilidadPage() {
  const container = document.getElementById('content-area');
  if (!container) {
    console.error('No se encontró el contenedor principal para la sección de rentabilidad.');
    return;
  }

  const esVendedor =
    typeof window.isVendedor === 'function' && window.isVendedor(window.currentUser?.email);

  if (esVendedor) {
    container.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-600 text-lg">No tienes permisos para ver el análisis de rentabilidad</p>
      </div>
    `;
    return;
  }

  // Renderizar la UI inicial
  renderRentabilidadUI();

  // Configurar el rango de fechas por defecto (último mes)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);

  // Establecer valores en los inputs
  document.getElementById('start-date').valueAsDate = startDate;
  document.getElementById('end-date').valueAsDate = endDate;

  // Conectar el botón "Analizar"
  document.getElementById('apply-filters-btn').addEventListener('click', async () => {
    await analyzeProfitability();
  });

  // Conectar el botón "Exportar a Excel"
  document.getElementById('export-excel-btn').addEventListener('click', () => {
    exportToExcel();
  });
}

async function analyzeProfitability() {
  const startDateInput = document.getElementById('start-date').value;
  const endDateInput = document.getElementById('end-date').value;

  if (!startDateInput || !endDateInput) {
    alert('Por favor selecciona un rango de fechas válido.');
    return;
  }

  // Crear fechas en hora local para evitar problemas de zona horaria
  const startDate = new Date(startDateInput + 'T00:00:00');
  const endDate = new Date(endDateInput + 'T00:00:00');

  if (startDate > endDate) {
    alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
    return;
  }

  // Mostrar indicador de carga
  const kpiContainer = document.getElementById('kpi-container');
  kpiContainer.innerHTML = '<p class="text-gray-500 col-span-full py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando análisis...</p>';

  try {
    // Obtener datos de rentabilidad
    const data = await getProfitabilityData(startDate, endDate);

    // Guardar resultado para exportación
    lastProfitabilityResult = data;

    // Actualizar la interfaz
    updateKpiCards(data.kpis);
    renderProductsTable(data.products);

    // Mostrar gráficos (por ahora solo los hace visibles, la lógica de Chart.js se implementará después)
    renderCharts(data);

  } catch (error) {
    console.error('Error al calcular rentabilidad:', error);
    kpiContainer.innerHTML = '<p class="text-red-500 col-span-full py-8"><i class="fas fa-exclamation-triangle mr-2"></i>Error al cargar el análisis. Por favor intenta nuevamente.</p>';
    alert('Error al calcular la rentabilidad: ' + error.message);
  }
}

async function exportToExcel() {
  try {
    if (!lastProfitabilityResult) {
      alert('Primero realiza un análisis para poder exportar.');
      return;
    }

    // Asegurar librería XLSX
    await ensureXlsxLoaded();

    const { kpis, products } = lastProfitabilityResult;

    // Hoja 1: KPIs
    const kpiRows = [
      ['Métrica', 'Valor'],
      ['Entradas de Caja', Number(kpis.ingresos || 0)],
      ['Ingreso Total de Ventas', Number(kpis.ingresoTotalVentas || 0)],
      ['Número de Ventas', Number(kpis.numeroVentas || 0)],
      ['Costo de Venta', Number(kpis.costoVenta || 0)],
      ['Ganancia Bruta', Number(kpis.gananciaBruta || 0)],
      ['Gastos Operativos', Number(kpis.gastosOperativos || 0)],
    ];
    const wsKpis = XLSX.utils.aoa_to_sheet(kpiRows);

    // Hoja 2: Productos
    const productRows = [
      ['Producto', 'Unidades Vendidas', 'Ingreso Total', 'Costo Total', 'Ganancia Bruta', 'Margen Bruto %'],
      ...(products || []).map(p => [
        p.nombre,
        Number(p.unidadesVendidas || 0),
        Number((p.ingresoTotal ?? 0).toFixed ? p.ingresoTotal.toFixed(2) : (p.ingresoTotal ?? 0)),
        Number((p.costoTotal ?? 0).toFixed ? p.costoTotal.toFixed(2) : (p.costoTotal ?? 0)),
        Number((p.gananciaBruta ?? (p.ingresoTotal - p.costoTotal) ?? 0).toFixed ? (p.gananciaBruta ?? (p.ingresoTotal - p.costoTotal)).toFixed(2) : (p.gananciaBruta ?? (p.ingresoTotal - p.costoTotal) ?? 0)),
        Number((p.margenBruto ?? 0).toFixed ? p.margenBruto.toFixed(2) : (p.margenBruto ?? 0)),
      ])
    ];
    const wsProd = XLSX.utils.aoa_to_sheet(productRows);

    // Libro y descarga
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsKpis, 'KPIs');
    XLSX.utils.book_append_sheet(wb, wsProd, 'Productos');

    const startDateInput = document.getElementById('start-date')?.value || '';
    const endDateInput = document.getElementById('end-date')?.value || '';
    const filename = `Rentabilidad_${startDateInput || 'inicio'}_a_${endDateInput || 'fin'}.xlsx`.replace(/[:]/g, '-');

    XLSX.writeFile(wb, filename);
  } catch (err) {
    console.error('Error exportando a Excel:', err);
    alert('No se pudo exportar a Excel. Revisa la consola para más detalles.');
  }
}
