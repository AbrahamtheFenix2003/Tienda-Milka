import { getSaleDate } from './data.js';

let salesChartInstance = null;
let categoryChartInstance = null;

function hasChartJs() {
  return typeof Chart !== 'undefined';
}

export function renderSalesPerformanceChart(sales = [], period = 'month', dateFrom = '', dateTo = '') {
  const canvas = document.getElementById('sales-performance-chart');
  if (!canvas || !hasChartJs()) {
    if (salesChartInstance) {
      salesChartInstance.destroy();
      salesChartInstance = null;
    }
    return null;
  }

  const ctx = canvas.getContext('2d');
  const salesByDay = {};
  const labels = [];

  // Calcular rango de fechas basado en filtros o periodo
  let startDate, endDate;

  if (dateFrom || dateTo) {
    // Si hay filtros personalizados, usarlos
    if (dateFrom) {
      const [year, month, day] = dateFrom.split('-').map(Number);
      startDate = new Date(year, month - 1, day);
    } else {
      // Si solo hay dateTo, usar la venta más antigua como inicio
      const oldestSale = (Array.isArray(sales) ? sales : [])
        .map((sale) => getSaleDate(sale))
        .filter(Boolean)
        .sort((a, b) => a.getTime() - b.getTime())[0];
      startDate = oldestSale || new Date();
    }

    if (dateTo) {
      const [year, month, day] = dateTo.split('-').map(Number);
      endDate = new Date(year, month - 1, day);
    } else {
      // Si solo hay dateFrom, usar hoy como fin
      endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
    }
  } else {
    // Si no hay filtros personalizados, usar periodo predefinido
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate = today;

    const days = period === 'week' ? 7 : 30;
    startDate = new Date(today);
    startDate.setDate(today.getDate() - (days - 1));
  }

  // Normalizar fechas
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  // Generar todas las fechas en el rango
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    salesByDay[dateKey] = 0;
    labels.push(currentDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Contar ventas por día
  (Array.isArray(sales) ? sales : []).forEach((sale) => {
    const saleDate = getSaleDate(sale);
    if (!saleDate) {
      return;
    }

    const dateKey = saleDate.toISOString().split('T')[0];
    if (Object.prototype.hasOwnProperty.call(salesByDay, dateKey)) {
      salesByDay[dateKey] += sale.totalSale || 0;
    }
  });

  const dataPoints = Object.values(salesByDay);

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  salesChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Ingresos por Ventas (S/)',
          data: dataPoints,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback(value) {
              const numeric = typeof value === 'number' ? value : Number(value);
              if (Number.isNaN(numeric)) {
                return value;
              }
              return `S/ ${numeric.toFixed(0)}`;
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });

  return salesChartInstance;
}

export function renderCategorySalesChart(sales = []) {
  const canvas = document.getElementById('category-sales-chart');
  if (!canvas || !hasChartJs()) {
    if (categoryChartInstance) {
      categoryChartInstance.destroy();
      categoryChartInstance = null;
    }
    return null;
  }

  const ctx = canvas.getContext('2d');
  const salesByCategory = {};

  (Array.isArray(sales) ? sales : []).forEach((sale) => {
    if (Array.isArray(sale.items) && sale.items.length) {
      sale.items.forEach((item) => {
        const category = item.category || 'Sin Categoria';
        if (!salesByCategory[category]) {
          salesByCategory[category] = 0;
        }
        salesByCategory[category] += (item.quantity || 0) * (item.price || 0);
      });
    } else {
      const category = sale.category || 'Sin Categoria';
      if (!salesByCategory[category]) {
        salesByCategory[category] = 0;
      }
      salesByCategory[category] += sale.totalSale || 0;
    }
  });

  const labels = Object.keys(salesByCategory);
  const dataPoints = Object.values(salesByCategory);

  const backgroundColors = [
    '#f43f5e',
    '#3b82f6',
    '#10b981',
    '#f97316',
    '#8b5cf6',
    '#ec4899',
    '#6366f1',
    '#f59e0b',
    '#06b6d4',
    '#d946ef',
  ];

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: dataPoints,
          backgroundColor: backgroundColors.slice(0, labels.length),
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11,
            },
          },
        },
      },
    },
  });

  return categoryChartInstance;
}
