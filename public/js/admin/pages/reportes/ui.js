import { annulSale, getSaleDate, getSaleDetails, loadAllSalesAndExpenses, filterSalesByPeriod } from './data.js';
import { renderSalesPerformanceChart, renderCategorySalesChart } from './charts.js';

let isVendor = false;
let salesData = [];
let expensesData = [];
let currentSalesHistory = [];
let saleToAnnul = null;
let currentChartPeriod = 'month';

export function renderReportesUI(options = {}) {
  const derivedVendor =
    typeof options.isVendedor === 'boolean'
      ? options.isVendedor
      : typeof window !== 'undefined' &&
        typeof window.isVendedor === 'function' &&
        window.isVendedor(window.currentUser?.email || '');

  isVendor = Boolean(derivedVendor);
  currentSalesHistory = [];
  saleToAnnul = null;
  currentChartPeriod = 'month';

  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    return;
  }

  contentArea.innerHTML = buildReportesTemplate();
  setupEventHandlers();
}

export function updateSummaryCards(allSales = [], allExpenses = []) {
  if (isVendor) {
    return;
  }

  const revenueEl = document.getElementById('total-revenue');
  const costEl = document.getElementById('total-cost');
  const profitEl = document.getElementById('net-profit');

  if (!revenueEl || !costEl || !profitEl) {
    return;
  }

  const salesList = Array.isArray(allSales) ? allSales : [];
  const expensesList = Array.isArray(allExpenses) ? allExpenses : [];

  expensesData = [...expensesList];

  const totalRevenue = salesList.reduce((sum, sale) => sum + (sale.totalSale || 0), 0);
  const totalCost = salesList.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);
  const totalExpenses = expensesList.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const netProfit = totalRevenue - totalCost - totalExpenses;

  revenueEl.textContent = `S/ ${totalRevenue.toFixed(2)}`;
  costEl.textContent = `S/ ${totalCost.toFixed(2)}`;
  profitEl.textContent = `S/ ${netProfit.toFixed(2)}`;
}

export function displaySalesHistory(salesList = null, { updateBase = true } = {}) {
  const container = document.getElementById('sales-history');
  if (!container) {
    return;
  }

  if (Array.isArray(salesList) && updateBase) {
    salesData = [...salesList];
  } else if (!Array.isArray(salesData)) {
    salesData = [];
  }

  const listToRender =
    salesList !== null && Array.isArray(salesList) ? salesList : Array.isArray(salesData) ? salesData : [];

  currentSalesHistory = [...listToRender];

  const pdfButton = document.getElementById('generate-pdf-btn');
  if (pdfButton) {
    pdfButton.disabled = currentSalesHistory.length === 0;
  }

  const detailButton = document.getElementById('download-sale-details-btn');
  if (detailButton) {
    detailButton.disabled = true;
    delete detailButton.dataset.saleId;
  }

  // Actualizar contador de ventas
  const salesCounter = document.getElementById('sales-counter');
  if (salesCounter) {
    salesCounter.textContent = `${listToRender.length} venta${listToRender.length !== 1 ? 's' : ''} encontrada${listToRender.length !== 1 ? 's' : ''}`;
  }

  if (listToRender.length === 0) {
    container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay ventas para mostrar</p>';
    return;
  }

  const canAnnulSale =
    typeof window !== 'undefined' &&
    typeof window.isAdmin === 'function' &&
    window.isAdmin(window.currentUser?.email || '');

  // Ordenar ventas de más antigua a más reciente para la numeración
  const sortedForNumbering = [...listToRender].sort((a, b) => {
    const dateA = getSaleDate(a)?.getTime() ?? 0;
    const dateB = getSaleDate(b)?.getTime() ?? 0;
    return dateA - dateB; // Ascendente: más antigua primero
  });

  // Crear un mapa de ID a número de venta
  const saleNumberMap = new Map();
  sortedForNumbering.forEach((sale, index) => {
    saleNumberMap.set(sale.id, index + 1);
  });

  // Renderizar en el orden original (más reciente primero en la UI)
  container.innerHTML = listToRender.map((sale) => {
    const saleNumber = saleNumberMap.get(sale.id);
    return createSaleCardHtml(sale, canAnnulSale, saleNumber);
  }).join('');
}

export function showErrorMessage(message) {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) {
    return;
  }

  contentArea.innerHTML = `
    <div class="text-center py-8">
      <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
      <p class="text-red-600 text-lg font-semibold">${message}</p>
    </div>
  `;
}
function buildReportesTemplate() {
  const summarySection = isVendor ? renderVendorBanner() : renderSummaryAndCharts();
  return `
    ${renderDateFilterSection()}
    ${summarySection}
    ${renderHistorySection()}
    ${renderSaleDetailsModal()}
    ${renderAnnulSaleModal()}
  `;
}

function renderDateFilterSection() {
  return `
    <div class="bg-white rounded-lg shadow p-6 mb-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h3 class="text-xl font-bold text-gray-800">Filtrar por Periodo</h3>
        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Desde:</label>
            <input type="date" id="date-from" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <div class="flex items-center space-x-2">
            <label class="text-sm font-medium text-gray-700">Hasta:</label>
            <input type="date" id="date-to" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
          </div>
          <select id="period-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
            <option value="quarter">Ultimos 90 dias</option>
          </select>
        </div>
      </div>
    </div>
  `;
}

function renderSummaryAndCharts() {
  return `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-blue-50 rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-500">
            <i class="fas fa-dollar-sign text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-blue-800">INGRESOS TOTALES</p>
            <p class="text-2xl font-bold text-blue-900" id="total-revenue">S/ 0.00</p>
          </div>
        </div>
      </div>
      <div class="bg-red-50 rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-red-100 text-red-500">
            <i class="fas fa-shopping-basket text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-red-800">COSTOS TOTALES</p>
            <p class="text-2xl font-bold text-red-900" id="total-cost">S/ 0.00</p>
          </div>
        </div>
      </div>
      <div class="bg-green-50 rounded-lg p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-500">
            <i class="fas fa-chart-line text-xl"></i>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-green-800">UTILIDAD NETA</p>
            <p class="text-2xl font-bold text-green-900" id="net-profit">S/ 0.00</p>
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Desempeno de Ventas</h3>
          <div class="flex space-x-2">
            <button class="period-btn text-sm font-semibold py-1 px-3 rounded-md bg-gray-200 hover:bg-rose-500 hover:text-white transition-colors" data-period="week">Semana</button>
            <button class="period-btn text-sm font-semibold py-1 px-3 rounded-md bg-rose-500 text-white transition-colors" data-period="month">Mes</button>
          </div>
        </div>
        <div class="h-80">
          <canvas id="sales-performance-chart"></canvas>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-xl font-bold mb-4 text-center">Ventas por Categoria</h3>
        <div class="h-80 flex items-center justify-center">
          <canvas id="category-sales-chart"></canvas>
        </div>
      </div>
    </div>
  `;
}

function renderVendorBanner() {
  return `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="fas fa-info-circle text-blue-400 text-2xl"></i>
        </div>
        <div class="ml-3">
          <h3 class="text-lg font-medium text-blue-800">Panel de Vendedor</h3>
          <p class="text-blue-700">Como vendedor puedes revisar el historial de ventas. Los indicadores financieros estan disponibles solo para administradores.</p>
        </div>
      </div>
    </div>
  `;
}

function renderHistorySection() {
  return `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h3 class="text-xl font-bold">Historial de Ventas</h3>
          <p id="sales-counter" class="text-sm text-gray-600 mt-1">0 ventas encontradas</p>
        </div>
        <button id="generate-pdf-btn" class="inline-flex items-center px-3 py-2 bg-rose-500 text-white text-sm font-semibold rounded-md hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Generar PDF
        </button>
      </div>
      <div id="sales-history" class="space-y-4"></div>
    </div>
  `;
}

function renderSaleDetailsModal() {
  return `
    <div id="sale-details-modal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold">Detalles de la Venta</h3>
          <div class="flex items-center gap-2">
            <button id="download-sale-details-btn" class="inline-flex items-center gap-1 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-semibold rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Descargar
            </button>
            <button id="close-sale-details" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>
        <div id="sale-details-content"></div>
      </div>
    </div>
  `;
}

function renderAnnulSaleModal() {
  return `
    <div id="annul-sale-modal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md text-center">
        <h3 class="text-xl font-bold mb-4">Confirmar Anulacion</h3>
        <p class="mb-6">Estas seguro de que quieres anular esta venta? El stock sera restaurado. Esta accion no se puede deshacer.</p>
        <div class="flex justify-center space-x-4">
          <button id="cancel-annul-sale" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>
          <button id="confirm-annul-sale" class="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Si, Anular</button>
        </div>
      </div>
    </div>
  `;
}
function createSaleCardHtml(sale, canAnnulSale, saleNumber) {
  const saleDate = getSaleDate(sale) || new Date();
  let productsDisplay = '';

  if (Array.isArray(sale.items) && sale.items.length) {
    productsDisplay = sale.items.map((item) => `${item.name} (${item.quantity}x)`).join(', ');
  } else if (sale.productName) {
    productsDisplay = `${sale.productName} (${sale.quantitySold || 1}x)`;
  } else {
    productsDisplay = 'Productos no especificados';
  }

  const deliveryInfo = sale.deliveryLocation ? `<p class="text-sm text-gray-600">Ubicacion: ${sale.deliveryLocation}</p>` : '';
  const deliveryCostInfo =
    sale.deliveryCost && sale.deliveryCost > 0
      ? `<p class="text-xs text-gray-500">+ S/ ${sale.deliveryCost.toFixed(2)} entrega</p>`
      : '';
  const profitInfo =
    sale.profit !== undefined
      ? `<p class="text-xs ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}">Ganancia: S/ ${sale.profit.toFixed(2)}</p>`
      : '';

  const tags = [
    sale.paymentMethod ? `Pago: ${sale.paymentMethod}` : '',
    sale.deliveryMethod ? `Entrega: ${sale.deliveryMethod}` : '',
  ].filter(Boolean);

  return `
    <div class="bg-white border border-gray-200 rounded-lg p-4">
      <div class="flex justify-between items-start mb-3">
        <div class="flex-1">
          <div class="flex justify-between items-start mb-2">
            <div>
              ${saleNumber ? `<p class="text-xs font-bold text-rose-600 mb-1">Venta #${saleNumber}</p>` : ''}
              <p class="font-semibold text-gray-900">${sale.customerName || 'Cliente no especificado'}</p>
              <p class="text-sm text-gray-600">${sale.customerPhone || 'Sin telefono'}</p>
              ${deliveryInfo}
            </div>
            <div class="text-right">
              <p class="font-bold text-green-600 text-lg">S/ ${(sale.totalSale || 0).toFixed(2)}</p>
              ${deliveryCostInfo}
              <p class="text-sm text-gray-500">${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
              ${profitInfo}
            </div>
          </div>
          <p class="text-sm text-gray-700 mb-1"><span class="font-medium text-gray-600">Productos:</span> ${productsDisplay}</p>
          ${
            tags.length
              ? `<div class="flex flex-wrap gap-2 mt-2">${tags
                  .map((tag) => `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs bg-rose-100 text-rose-700">${tag}</span>`)
                  .join('')}</div>`
              : ''
          }
          ${sale.notes ? `<p class="text-sm text-gray-500 mt-2">Notas: ${sale.notes}</p>` : ''}
        </div>
        <div class="flex flex-col space-y-2 ml-4">
          <button class="view-sale-details px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600" data-sale-id="${sale.id}">
            Ver Detalles
          </button>
          ${
            canAnnulSale
              ? `<button class="annul-sale-btn px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600" data-sale-id="${sale.id}">
                  Anular
                </button>`
              : ''
          }
        </div>
      </div>
    </div>
  `;
}

function setupEventHandlers() {
  if (!isVendor) {
    const periodButtons = document.querySelectorAll('.period-btn');
    periodButtons.forEach((button) =>
      button.addEventListener('click', (event) => {
        periodButtons.forEach((btn) => {
          btn.classList.remove('bg-rose-500', 'text-white');
          btn.classList.add('bg-gray-200');
        });
        const target = event.currentTarget;
        target.classList.add('bg-rose-500', 'text-white');
        target.classList.remove('bg-gray-200');

        currentChartPeriod = target.dataset.period || 'month';
        const dateFrom = document.getElementById('date-from')?.value || '';
        const dateTo = document.getElementById('date-to')?.value || '';
        const periodFilterValue = document.getElementById('period-filter')?.value || 'all';
        const filteredSales = filterSalesByPeriod(salesData, periodFilterValue, dateFrom, dateTo);
        renderSalesPerformanceChart(filteredSales, currentChartPeriod);
      }),
    );
  }

  const dateFrom = document.getElementById('date-from');
  const dateTo = document.getElementById('date-to');
  const periodFilter = document.getElementById('period-filter');
  const pdfButton = document.getElementById('generate-pdf-btn');
  const downloadButton = document.getElementById('download-sale-details-btn');
  const salesHistory = document.getElementById('sales-history');
  const closeDetails = document.getElementById('close-sale-details');
  const cancelAnnul = document.getElementById('cancel-annul-sale');
  const confirmAnnul = document.getElementById('confirm-annul-sale');

  if (dateFrom) {
    dateFrom.addEventListener('change', applyDateFilter);
  }
  if (dateTo) {
    dateTo.addEventListener('change', applyDateFilter);
  }
  if (periodFilter) {
    periodFilter.addEventListener('change', applyDateFilter);
  }
  if (pdfButton) {
    pdfButton.addEventListener('click', generateSalesHistoryPdf);
  }
  if (downloadButton) {
    downloadButton.addEventListener('click', handleDownloadSaleDetails);
  }
  if (salesHistory) {
    salesHistory.addEventListener('click', handleSalesHistoryClick);
  }
  if (closeDetails) {
    closeDetails.addEventListener('click', closeSaleDetailsModal);
  }
  if (cancelAnnul) {
    cancelAnnul.addEventListener('click', closeAnnulSaleModal);
  }
  if (confirmAnnul) {
    confirmAnnul.addEventListener('click', handleAnnulSale);
  }
}

function applyDateFilter() {
  if (!Array.isArray(salesData) || salesData.length === 0) {
    displaySalesHistory([]);
    if (!isVendor) {
      updateSummaryCards([], expensesData);
      renderSalesPerformanceChart([], currentChartPeriod);
      renderCategorySalesChart([]);
    }
    return;
  }

  const dateFrom = document.getElementById('date-from')?.value || '';
  const dateTo = document.getElementById('date-to')?.value || '';
  const periodFilterValue = document.getElementById('period-filter')?.value || 'all';

  const filteredSales = filterSalesByPeriod(salesData, periodFilterValue, dateFrom, dateTo);

  displaySalesHistory(filteredSales, { updateBase: false });

  if (!isVendor) {
    updateSummaryCards(filteredSales, expensesData);
    renderSalesPerformanceChart(filteredSales, currentChartPeriod);
    renderCategorySalesChart(filteredSales);
  }
}
function generateSalesHistoryPdf() {
  const JsPdfConstructor = window.jspdf?.jsPDF || window.jsPDF;
  if (!JsPdfConstructor) {
    alert('No se pudo cargar la libreria para generar PDF.');
    return;
  }

  if (!currentSalesHistory || currentSalesHistory.length === 0) {
    alert('No hay ventas para exportar con los filtros actuales.');
    return;
  }

  const doc = new JsPdfConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const accent = { r: 244, g: 63, b: 94 };
  const slate = { r: 71, g: 85, b: 105 };
  const subtle = { r: 241, g: 245, b: 249 };

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 26;

  const ensureSpace = (height) => {
    if (y + height > pageHeight - 18) {
      doc.addPage();
      y = 20;
      doc.setTextColor(slate.r, slate.g, slate.b);
    }
  };

  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(margin, 12, pageWidth - margin * 2, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('Historial de Ventas', pageWidth / 2, 20, { align: 'center' });

  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.setFontSize(10);
  const generatedAt = new Date();
  doc.text(`Generado: ${generatedAt.toLocaleString('es-PE')}`, margin, y);

  const periodSelect = document.getElementById('period-filter');
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  const periodValue = periodSelect ? periodSelect.value : 'all';
  const dateFromValue = dateFromInput ? dateFromInput.value : '';
  const dateToValue = dateToInput ? dateToInput.value : '';

  let filterLabel = '';
  if (dateFromValue || dateToValue) {
    const fromLabel = dateFromValue ? new Date(dateFromValue).toLocaleDateString('es-PE') : 'Inicio';
    const toLabel = dateToValue ? new Date(dateToValue).toLocaleDateString('es-PE') : 'Presente';
    filterLabel = `Rango: Desde ${fromLabel} hasta ${toLabel}`;
  } else {
    const periodLabels = {
      all: 'Todas las fechas',
      today: 'Hoy',
      week: 'Ultimos 7 dias',
      month: 'Ultimos 30 dias',
      quarter: 'Ultimos 90 dias',
    };
    filterLabel = `Periodo: ${periodLabels[periodValue] || 'Personalizado'}`;
  }

  doc.text(filterLabel, pageWidth - margin, y, { align: 'right' });
  y += 8;

  const totalAmount = currentSalesHistory.reduce((sum, sale) => sum + (sale.totalSale || 0), 0);
  const summaryItems = [
    { label: 'Ventas registradas', value: currentSalesHistory.length.toString() },
    { label: 'Importe total', value: `S/ ${totalAmount.toFixed(2)}` },
    { label: 'Ultima venta', value: getLastSaleDateLabel() },
  ];

  const gap = 6;
  const boxWidth = (pageWidth - margin * 2 - gap) / summaryItems.length;
  summaryItems.forEach((item, index) => {
    const boxX = margin + index * (boxWidth + gap);
    doc.setFillColor(subtle.r, subtle.g, subtle.b);
    doc.roundedRect(boxX, y, boxWidth, 18, 2, 2, 'F');
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.setFontSize(9);
    doc.text(item.label, boxX + 2, y + 5);
    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.setFontSize(11);
    doc.text(item.value, boxX + 2, y + 11);
  });

  y += 22;
  doc.setDrawColor(subtle.r, subtle.g, subtle.b);
  doc.setLineWidth(0.2);

  // Ordenar ventas de más antigua a más reciente para la numeración en el PDF
  const sortedSalesForPdf = [...currentSalesHistory].sort((a, b) => {
    const dateA = getSaleDate(a)?.getTime() ?? 0;
    const dateB = getSaleDate(b)?.getTime() ?? 0;
    return dateA - dateB; // Ascendente: más antigua primero
  });

  sortedSalesForPdf.forEach((sale, index) => {
    const saleDate = getSaleDate(sale) || new Date();

    let products = '';
    if (Array.isArray(sale.items) && sale.items.length) {
      products = sale.items.map((item) => `${item.name} (${item.quantity}x)`).join(', ');
    } else if (sale.productName) {
      products = `${sale.productName} (${sale.quantitySold || 1}x)`;
    } else {
      products = 'Productos no especificados';
    }

    const productLines = doc.splitTextToSize(`Productos: ${products}`, pageWidth - margin * 2);
    const tags = [];
    if (sale.paymentMethod) {
      tags.push(`Pago: ${sale.paymentMethod}`);
    }
    if (sale.deliveryMethod) {
      tags.push(`Entrega: ${sale.deliveryMethod}`);
    }
    const profitLine = sale.profit !== undefined ? `Ganancia: S/ ${sale.profit.toFixed(2)}` : '';
    const blockHeight =
      18 +
      productLines.length * 4 +
      (tags.length ? 4 : 0) +
      (sale.deliveryLocation ? 4 : 0) +
      (profitLine ? 4 : 0);

    ensureSpace(blockHeight + 6);
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
    doc.setTextColor(accent.r, accent.g, accent.b);
    doc.setFontSize(11);
    doc.text(`${index + 1}. ${sale.customerName || 'Cliente no especificado'}`, margin, y);
    doc.text(`S/ ${(sale.totalSale || 0).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

    doc.setTextColor(slate.r, slate.g, slate.b);
    doc.setFontSize(9);
    y += 5;
    doc.text(`Fecha: ${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, margin, y);
    if (sale.customerPhone) {
      doc.text(`Contacto: ${sale.customerPhone}`, pageWidth - margin, y, { align: 'right' });
    }
    y += 4;

    productLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 4;
    });

    if (tags.length) {
      doc.text(`Etiquetas: ${tags.join(' | ')}`, margin, y);
      y += 4;
    }

    if (sale.deliveryLocation) {
      doc.text(`Ubicacion: ${sale.deliveryLocation}`, margin, y);
      y += 4;
    }

    if (profitLine) {
      doc.text(profitLine, margin, y);
      y += 4;
    }

    if (sale.notes) {
      const notesLines = doc.splitTextToSize(`Notas: ${sale.notes}`, pageWidth - margin * 2);
      notesLines.forEach((line) => {
        doc.text(line, margin, y);
        y += 4;
      });
    }

    y += 2;
  });

  const filename = (() => {
    const pad = (value) => String(value).padStart(2, '0');
    const year = generatedAt.getFullYear();
    const month = pad(generatedAt.getMonth() + 1);
    const day = pad(generatedAt.getDate());
    const hours = pad(generatedAt.getHours());
    const minutes = pad(generatedAt.getMinutes());
    return `historial-ventas-${year}${month}${day}-${hours}${minutes}`;
  })();

  doc.save(`${filename}.pdf`);
}

function getLastSaleDateLabel() {
  if (!currentSalesHistory.length) {
    return 'Sin datos';
  }
  const latest = currentSalesHistory
    .map((sale) => getSaleDate(sale))
    .filter(Boolean)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  return latest ? latest.toLocaleDateString('es-PE') : 'Sin fecha';
}
function handleDownloadSaleDetails() {
  const button = document.getElementById('download-sale-details-btn');
  if (!button || !button.dataset.saleId) {
    alert('Selecciona una venta para descargar su detalle.');
    return;
  }

  const sale =
    currentSalesHistory.find((s) => s.id === button.dataset.saleId) ||
    salesData.find((s) => s.id === button.dataset.saleId);
  if (!sale) {
    alert('No se encontro la venta seleccionada.');
    return;
  }

  downloadSaleDetailsPdf(sale);
}

function downloadSaleDetailsPdf(sale) {
  const JsPdfConstructor = window.jspdf?.jsPDF || window.jsPDF;
  if (!JsPdfConstructor) {
    alert('No se pudo cargar la libreria para generar PDF.');
    return;
  }

  const doc = new JsPdfConstructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const accent = { r: 244, g: 63, b: 94 };
  const slate = { r: 71, g: 85, b: 105 };

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 26;

  const saleDate = getSaleDate(sale) || new Date();

  doc.setFillColor(accent.r, accent.g, accent.b);
  doc.rect(margin, 12, pageWidth - margin * 2, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('Detalle de Venta', pageWidth / 2, 20, { align: 'center' });

  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.setFontSize(10);
  doc.text(`ID Venta: ${sale.id}`, margin, y);
  doc.text(`Fecha: ${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, y, { align: 'right' });
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text('Cliente', margin, y);
  y += 6;

  doc.setTextColor(slate.r, slate.g, slate.b);
  doc.text(`Nombre: ${sale.customerName || 'No especificado'}`, margin, y);
  y += 5;
  doc.text(`Contacto: ${sale.customerPhone || 'No especificado'}`, margin, y);
  y += 5;
  if (sale.deliveryLocation) {
    doc.text(`Ubicacion: ${sale.deliveryLocation}`, margin, y);
    y += 5;
  }
  if (sale.deliveryMethod) {
    doc.text(`Metodo de entrega: ${sale.deliveryMethod}`, margin, y);
    y += 5;
  }
  if (sale.paymentMethod) {
    doc.text(`Metodo de pago: ${sale.paymentMethod}`, margin, y);
    y += 5;
  }
  if (sale.soldBy) {
    doc.text(`Vendedor: ${sale.soldBy}`, margin, y);
    y += 5;
  }
  y += 4;

  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text('Productos', margin, y);
  y += 6;

  doc.setTextColor(slate.r, slate.g, slate.b);
  if (Array.isArray(sale.items) && sale.items.length) {
    doc.setFontSize(9);
    doc.text('Producto', margin, y);
    doc.text('Cant.', margin + 80, y);
    doc.text('Precio', margin + 100, y);
    doc.text('Subtotal', margin + 130, y);
    y += 4;
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    sale.items.forEach((item) => {
      doc.text(item.name || 'Producto sin nombre', margin, y);
      doc.text(String(item.quantity || 0), margin + 80, y);
      doc.text(`S/ ${(item.price || 0).toFixed(2)}`, margin + 100, y);
      doc.text(`S/ ${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`, margin + 130, y);
      y += 5;
    });
  } else if (sale.productName) {
    doc.text(`${sale.productName} (${sale.quantitySold || 1}x)`, margin, y);
    y += 5;
  } else {
    doc.text('Productos no especificados', margin, y);
    y += 5;
  }

  y += 2;
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.text(`Subtotal: S/ ${(sale.subtotalSale || sale.totalSale || 0).toFixed(2)}`, margin, y);
  y += 6;
  if (sale.deliveryCost) {
    doc.text(`Entrega: S/ ${sale.deliveryCost.toFixed(2)}`, margin, y);
    y += 6;
  }
  doc.setFontSize(12);
  doc.setTextColor(accent.r, accent.g, accent.b);
  doc.text(`Total pagado: S/ ${(sale.totalSale || 0).toFixed(2)}`, margin, y);
  y += 8;
  if (sale.profit !== undefined) {
    doc.text(`Ganancia: S/ ${sale.profit.toFixed(2)}`, margin, y);
    y += 6;
  }

  if (sale.notes) {
    const notes = doc.splitTextToSize(`Observaciones: ${sale.notes}`, pageWidth - margin * 2);
    doc.setTextColor(slate.r, slate.g, slate.b);
    notes.forEach((line) => {
      doc.text(line, margin, y);
      y += 4;
    });
  }

  const filename = (() => {
    const pad = (value) => String(value).padStart(2, '0');
    const year = saleDate.getFullYear();
    const month = pad(saleDate.getMonth() + 1);
    const day = pad(saleDate.getDate());
    return `detalle-venta-${year}${month}${day}-${sale.id}`.replace(/[^a-zA-Z0-9-_]/g, '');
  })();

  doc.save(`${filename}.pdf`);
}

function handleSalesHistoryClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  if (target.classList.contains('view-sale-details')) {
    const saleId = target.dataset.saleId;
    showSaleDetails(saleId);
  } else if (target.classList.contains('annul-sale-btn')) {
    const saleId = target.dataset.saleId;
    showAnnulSaleModal(saleId);
  }
}

function showSaleDetails(saleId) {
  const sale =
    salesData.find((s) => s.id === saleId) ||
    currentSalesHistory.find((s) => s.id === saleId) ||
    window.allSales?.find((s) => s.id === saleId);

  if (!sale) {
    alert('No se encontro la venta solicitada.');
    return;
  }

  const saleDate = getSaleDate(sale) || new Date();
  let productsTable = '';

  if (Array.isArray(sale.items) && sale.items.length) {
    productsTable = `
      <table class="w-full border-collapse border border-gray-300 text-sm mt-4">
        <thead>
          <tr class="bg-gray-50">
            <th class="border border-gray-300 px-3 py-2 text-left">Producto</th>
            <th class="border border-gray-300 px-3 py-2 text-center">Cant.</th>
            <th class="border border-gray-300 px-3 py-2 text-right">Precio</th>
            <th class="border border-gray-300 px-3 py-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items
            .map(
              (item) => `
                <tr>
                  <td class="border border-gray-300 px-3 py-2">${item.name}</td>
                  <td class="border border-gray-300 px-3 py-2 text-center">${item.quantity}</td>
                  <td class="border border-gray-300 px-3 py-2 text-right">S/ ${item.price.toFixed(2)}</td>
                  <td class="border border-gray-300 px-3 py-2 text-right">S/ ${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
        <tfoot>
          <tr class="bg-gray-100 font-bold">
            <td colspan="3" class="border border-gray-300 px-3 py-2 text-right">Subtotal:</td>
            <td class="border border-gray-300 px-3 py-2 text-right">S/ ${(sale.subtotalSale || sale.totalSale).toFixed(2)}</td>
          </tr>
          ${
            sale.deliveryCost
              ? `
                <tr>
                  <td colspan="3" class="border border-gray-300 px-3 py-2 text-right">Costo de entrega:</td>
                  <td class="border border-gray-300 px-3 py-2 text-right">S/ ${sale.deliveryCost.toFixed(2)}</td>
                </tr>
              `
              : ''
          }
          <tr class="bg-gray-200 font-bold">
            <td colspan="3" class="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>
            <td class="border border-gray-300 px-3 py-2 text-right">S/ ${(sale.totalSale || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    `;
  } else if (sale.productName) {
    productsTable = `<p><strong>Producto:</strong> ${sale.productName} (${sale.quantitySold || 1}x)</p>`;
  } else {
    productsTable = '<p>Productos no especificados</p>';
  }

  const content = `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <p><strong>Cliente:</strong> ${sale.customerName || 'No especificado'}</p>
          <p><strong>Contacto:</strong> ${sale.customerPhone || 'No especificado'}</p>
          ${sale.deliveryLocation ? `<p><strong>Ubicacion:</strong> ${sale.deliveryLocation}</p>` : ''}
        </div>
        <div>
          <p><strong>Fecha:</strong> ${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE')}</p>
          <p><strong>Metodo de pago:</strong> ${sale.paymentMethod || 'No especificado'}</p>
          <p><strong>Metodo de entrega:</strong> ${sale.deliveryMethod || 'No especificado'}</p>
          <p><strong>Vendedor:</strong> ${sale.soldBy || 'No especificado'}</p>
        </div>
      </div>
      <div>
        <h4 class="font-bold mb-2">Productos vendidos:</h4>
        ${productsTable}
      </div>
      ${sale.notes ? `<p><strong>Notas:</strong> ${sale.notes}</p>` : ''}
    </div>
  `;

  const modal = document.getElementById('sale-details-modal');
  const contentContainer = document.getElementById('sale-details-content');
  if (contentContainer) {
    contentContainer.innerHTML = content;
  }
  if (modal) {
    modal.classList.add('active');
  }

  const downloadButton = document.getElementById('download-sale-details-btn');
  if (downloadButton) {
    downloadButton.dataset.saleId = sale.id;
    downloadButton.disabled = false;
  }
}

function closeSaleDetailsModal() {
  const modal = document.getElementById('sale-details-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  const downloadButton = document.getElementById('download-sale-details-btn');
  if (downloadButton) {
    downloadButton.disabled = true;
    delete downloadButton.dataset.saleId;
  }
}

function showAnnulSaleModal(saleId) {
  saleToAnnul = saleId;
  const modal = document.getElementById('annul-sale-modal');
  if (modal) {
    modal.classList.add('active');
  }
  const confirmBtn = document.getElementById('confirm-annul-sale');
  if (confirmBtn) {
    confirmBtn.dataset.saleId = saleId;
  }
}

function closeAnnulSaleModal() {
  const modal = document.getElementById('annul-sale-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  const confirmBtn = document.getElementById('confirm-annul-sale');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = 'Si, Anular';
    delete confirmBtn.dataset.saleId;
  }
  saleToAnnul = null;
}

async function handleAnnulSale(event) {
  const button = event?.currentTarget || document.getElementById('confirm-annul-sale');
  const saleId = button?.dataset.saleId || saleToAnnul;

  if (!saleId) {
    return;
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'Anulando...';

  try {
    const sale = salesData.find((s) => s.id === saleId) || (await getSaleDetails(saleId));
    if (!sale) {
      alert('No se pudo encontrar la venta.');
      return;
    }

    await annulSale(saleId);
    alert('Venta anulada exitosamente. Stock restaurado y movimientos de caja eliminados.');

    if (typeof window !== 'undefined') {
      if (typeof window.loadProducts === 'function') {
        try {
          await window.loadProducts();
        } catch (error) {
          console.warn('Error recargando productos:', error);
        }
      }
      if (typeof window.loadSales === 'function') {
        try {
          await window.loadSales();
        } catch (error) {
          console.warn('Error recargando ventas globales:', error);
        }
      }
    }

    const { allSales, allExpenses } = await loadAllSalesAndExpenses();
    salesData = allSales;
    expensesData = allExpenses;

    displaySalesHistory(allSales);
    if (!isVendor) {
      updateSummaryCards(allSales, allExpenses);
      renderSalesPerformanceChart(allSales, currentChartPeriod);
      renderCategorySalesChart(allSales);
    }
    closeAnnulSaleModal();
  } catch (error) {
    console.error('Error anulando la venta:', error);
    alert(`Error al anular la venta: ${error.message || error}`);
  } finally {
    button.disabled = false;
    button.textContent = originalText || 'Si, Anular';
  }
}
