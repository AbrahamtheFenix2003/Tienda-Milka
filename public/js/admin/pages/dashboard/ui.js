let salesChartInstance = null;
let categoryChartInstance = null;

function getContentArea() {
    return document.getElementById('content-area');
}

export function renderDashboardUI() {
    const container = getContentArea();
    if (!container) {
        return;
    }
    container.innerHTML = `
        <style>
        .dashboard-chart-container {
            height: 300px;
            min-height: 200px;
            max-height: 400px;
        }
        </style>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                        <i class="fas fa-shopping-cart text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Ventas Totales</p>
                        <p class="text-2xl font-semibold text-gray-900" id="total-sales">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100 text-green-500">
                        <i class="fas fa-dollar-sign text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Ingresos</p>
                        <p class="text-2xl font-semibold text-gray-900" id="total-revenue">S/ 0.00</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100 text-yellow-500">
                        <i class="fas fa-box text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Productos</p>
                        <p class="text-2xl font-semibold text-gray-900" id="total-products">0</p>
                    </div>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-red-100 text-red-500">
                        <i class="fas fa-exclamation-triangle text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">Stock Bajo</p>
                        <p class="text-2xl font-semibold text-gray-900" id="low-stock">0</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div class="bg-white rounded-lg shadow p-6 dashboard-chart-container">
                <h3 class="text-lg font-semibold mb-4">Ventas de los &Uacute;ltimos 7 D&iacute;as</h3>
                <canvas id="dashboard-sales-chart"></canvas>
            </div>
            <div class="bg-white rounded-lg shadow p-6 dashboard-chart-container">
                <h3 class="text-lg font-semibold mb-4">Ventas por Categor&iacute;a</h3>
                <canvas id="dashboard-category-chart"></canvas>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Productos M&aacute;s Vendidos</h3>
                <div id="top-products" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">Cargando datos...</p>
                </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Productos M&aacute;s Rentables</h3>
                <div id="top-profitable-products" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">Cargando datos...</p>
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Actividad Reciente</h3>
            <div id="recent-activity" class="space-y-3">
                <p class="text-gray-500 text-center py-4">Cargando actividad...</p>
            </div>
        </div>
    `;
}

export function updateSummaryCards({ totalSales, totalRevenue, totalProducts, lowStock }) {
    const setText = (id, text) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = text;
        }
    };

    setText('total-sales', totalSales ?? 0);
    setText('total-revenue', `S/ ${(Number(totalRevenue) || 0).toFixed(2)}`);
    setText('total-products', totalProducts ?? 0);
    setText('low-stock', lowStock ?? 0);
}

export function renderSalesChart({ dates, totals }) {
    const canvas = document.getElementById('dashboard-sales-chart');
    if (!canvas || typeof Chart === 'undefined') {
        return;
    }

    if (salesChartInstance) {
        salesChartInstance.destroy();
        salesChartInstance = null;
    }

    const context = canvas.getContext('2d');
    const labels = Array.isArray(dates)
        ? dates.map((date) => {
              const parsed = new Date(date);
              return parsed.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
          })
        : [];

    salesChartInstance = new Chart(context, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Ventas (S/)',
                    data: Array.isArray(totals) ? totals : [],
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
                            return `S/ ${Number(value).toFixed(0)}`;
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
}

export function renderTopProducts(products) {
    const container = document.getElementById('top-products');
    if (!container) {
        return;
    }

    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay ventas registradas</p>';
        return;
    }

    container.innerHTML = products
        .map(
            (product) => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div>
                <p class="font-medium text-gray-900">${product.name}</p>
                <p class="text-sm text-gray-500">${product.quantity} vendidos</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-green-600">S/ ${Number(product.revenue || 0).toFixed(2)}</p>
            </div>
        </div>
    `,
        )
        .join('');
}

export function renderTopProfitableProducts(products) {
    const container = document.getElementById('top-profitable-products');
    if (!container) {
        return;
    }

    if (!Array.isArray(products) || products.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay datos de rentabilidad</p>';
        return;
    }

    container.innerHTML = products
        .map((product) => {
            const unitsSold = Number(product.unitsSold || 0);
            const unitsLabel = unitsSold === 1
                ? '1 unidad vendida'
                : `${unitsSold.toLocaleString('es-PE')} unidades vendidas`;
            const grossProfit = Number(product.grossProfit || 0).toFixed(2);
            const productName = product.name || 'Producto sin nombre';
            return `
        <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div>
                <p class="font-medium text-gray-900">${productName}</p>
                <p class="text-sm text-gray-500">${unitsLabel}</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-green-600">S/ ${grossProfit}</p>
            </div>
        </div>
    `;
        })
        .join('');
}

export function renderRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    if (!container) {
        return;
    }

    if (!Array.isArray(activities) || activities.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay actividad reciente</p>';
        return;
    }

    container.innerHTML = activities
        .map((activity) => {
            const date = activity.date instanceof Date ? activity.date : new Date(activity.date);
            const time = date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
            return `
        <div class="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
            <div class="flex-shrink-0">
                <i class="${activity.icon} ${activity.color}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-900">${activity.message}</p>
                <p class="text-xs text-gray-500">${time}</p>
            </div>
        </div>
    `;
        })
        .join('');
}

export function renderCategorySalesChart({ labels, totals }) {
    const canvas = document.getElementById('dashboard-category-chart');
    if (!canvas || typeof Chart === 'undefined') {
        return;
    }

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
        categoryChartInstance = null;
    }

    const context = canvas.getContext('2d');

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

    categoryChartInstance = new Chart(context, {
        type: 'doughnut',
        data: {
            labels: Array.isArray(labels) ? labels : [],
            datasets: [
                {
                    data: Array.isArray(totals) ? totals : [],
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
}

export function showDashboardError(message) {
    const container = getContentArea();
    if (!container) {
        return;
    }
    container.innerHTML = `
        <div class="text-center py-8">
            <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
            <p class="text-red-600 text-lg font-semibold">${message}</p>
        </div>
    `;
}

