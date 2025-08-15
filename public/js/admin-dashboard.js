// admin-dashboard.js - Funciones para la sección Dashboard
console.log('Cargando admin-dashboard.js...');

window.loadDashboard = function() {
    console.log('Ejecutando loadDashboard...');
    const content = `
        <style>
        .dashboard-chart-container {
            height: 300px;
            min-height: 200px;
            max-height: 400px;
        }
        </style>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Tarjetas de métricas -->
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
            <!-- Gráfico de ventas recientes -->
            <div class="bg-white rounded-lg shadow p-6 dashboard-chart-container">
                <h3 class="text-lg font-semibold mb-4">Ventas de los últimos 7 días</h3>
                <canvas id="dashboard-sales-chart"></canvas>
            </div>
            
            <!-- Productos más vendidos -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Productos más vendidos</h3>
                <div id="top-products" class="space-y-3">
                    <p class="text-gray-500 text-center py-4">Cargando datos...</p>
                </div>
            </div>
        </div>
        
        <!-- Actividad reciente -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Actividad Reciente</h3>
            <div id="recent-activity" class="space-y-3">
                <p class="text-gray-500 text-center py-4">Cargando actividad...</p>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = content;
    
    // Cargar datos del dashboard
    updateDashboardMetrics();
    renderDashboardChart();
    loadTopProducts();
    loadRecentActivity();
};

function updateDashboardMetrics() {
    // Total de ventas
    const totalSales = window.allSales ? window.allSales.length : 0;
    document.getElementById('total-sales').textContent = totalSales;
    
    // Ingresos totales
    const totalRevenue = window.allSales ? 
        window.allSales.reduce((sum, sale) => sum + (sale.totalSale || 0), 0) : 0;
    document.getElementById('total-revenue').textContent = `S/ ${totalRevenue.toFixed(2)}`;
    
    // Total de productos
    const totalProducts = window.productsCache ? window.productsCache.length : 0;
    document.getElementById('total-products').textContent = totalProducts;
    
    // Productos con stock bajo (menor a 5)
    const lowStock = window.productsCache ? 
        window.productsCache.filter(product => (product.stock || 0) < 5).length : 0;
    document.getElementById('low-stock').textContent = lowStock;
}

function renderDashboardChart() {
    const ctx = document.getElementById('dashboard-sales-chart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    
    // Preparar datos de los últimos 7 días
    const last7Days = [];
    const salesByDay = {};
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days.push(dateStr);
        salesByDay[dateStr] = 0;
    }
    
    // Contar ventas por día
    if (window.allSales) {
        window.allSales.forEach(sale => {
            let saleDate;
            if (sale.timestamp && sale.timestamp.toDate) {
                saleDate = sale.timestamp.toDate();
            } else if (sale.timestamp) {
                saleDate = new Date(sale.timestamp);
            } else if (sale.date) {
                saleDate = new Date(sale.date);
            } else {
                return;
            }
            
            const dateStr = saleDate.toISOString().split('T')[0];
            if (salesByDay[dateStr] !== undefined) {
                salesByDay[dateStr] += sale.totalSale || 0;
            }
        });
    }
    
    const labels = last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    });
    
    const data = last7Days.map(date => salesByDay[date]);
    
    new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ventas (S/)',
                data: data,
                borderColor: '#f43f5e',
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'S/ ' + value.toFixed(0);
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function loadTopProducts() {
    const container = document.getElementById('top-products');
    if (!container || !window.allSales) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay datos disponibles</p>';
        return;
    }
    
    // Contar productos vendidos
    const productSales = {};
    
    window.allSales.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
            // Ventas nuevas con múltiples productos
            sale.items.forEach(item => {
                if (!productSales[item.name]) {
                    productSales[item.name] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.name].quantity += item.quantity;
                productSales[item.name].revenue += item.quantity * item.price;
            });
        } else if (sale.productName) {
            // Ventas antiguas
            if (!productSales[sale.productName]) {
                productSales[sale.productName] = {
                    name: sale.productName,
                    quantity: 0,
                    revenue: 0
                };
            }
            productSales[sale.productName].quantity += sale.quantitySold || 1;
            productSales[sale.productName].revenue += sale.totalSale || 0;
        }
    });
    
    // Ordenar por cantidad vendida
    const sortedProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
    
    if (sortedProducts.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay ventas registradas</p>';
        return;
    }
    
    container.innerHTML = sortedProducts.map(product => `
        <div class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div>
                <p class="font-medium text-gray-900">${product.name}</p>
                <p class="text-sm text-gray-500">${product.quantity} vendidos</p>
            </div>
            <div class="text-right">
                <p class="font-semibold text-green-600">S/ ${product.revenue.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
}

function loadRecentActivity() {
    const container = document.getElementById('recent-activity');
    if (!container) return;
    
    const activities = [];
    
    // Agregar ventas recientes
    if (window.allSales) {
        window.allSales.slice(0, 5).forEach(sale => {
            let date;
            if (sale.timestamp && sale.timestamp.toDate) {
                date = sale.timestamp.toDate();
            } else if (sale.timestamp) {
                date = new Date(sale.timestamp);
            } else if (sale.date) {
                date = new Date(sale.date);
            } else {
                date = new Date();
            }
            
            activities.push({
                type: 'sale',
                icon: 'fas fa-shopping-cart',
                color: 'text-green-500',
                message: `Venta a ${sale.customerName} por S/ ${(sale.totalSale || 0).toFixed(2)}`,
                date: date,
                time: date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
            });
        });
    }
    
    // Agregar egresos recientes (solo para admins)
    if (window.allExpenses && window.isAdmin && window.isAdmin(window.currentUser?.email)) {
        window.allExpenses.slice(0, 3).forEach(expense => {
            let date;
            if (expense.timestamp && expense.timestamp.toDate) {
                date = expense.timestamp.toDate();
            } else if (expense.timestamp) {
                date = new Date(expense.timestamp);
            } else {
                date = new Date();
            }
            
            activities.push({
                type: 'expense',
                icon: 'fas fa-credit-card',
                color: 'text-red-500',
                message: `Egreso: ${expense.description} - S/ ${expense.amount.toFixed(2)}`,
                date: date,
                time: date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
            });
        });
    }
    
    // Ordenar por fecha (más reciente primero)
    activities.sort((a, b) => b.date - a.date);
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">No hay actividad reciente</p>';
        return;
    }
    
    container.innerHTML = activities.slice(0, 8).map(activity => `
        <div class="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-b-0">
            <div class="flex-shrink-0">
                <i class="${activity.icon} ${activity.color}"></i>
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-900">${activity.message}</p>
                <p class="text-xs text-gray-500">${activity.time}</p>
            </div>
        </div>
    `).join('');
}

console.log('admin-dashboard.js cargado completamente');
