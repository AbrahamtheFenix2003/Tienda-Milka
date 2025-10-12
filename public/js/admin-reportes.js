// admin-reportes.js - Funciones para reportes y análisis

console.log('Cargando admin-reportes.js...');



let currentSalesHistory = [];



// Función helper para obtener la fecha de una venta considerando campos legacy

function getSaleDate(sale) {

    // Prioridad: timestamp (nuevo) -> soldAt (antiguo) -> date -> null

    if (sale.timestamp && sale.timestamp.toDate) {

        return sale.timestamp.toDate();

    } else if (sale.timestamp) {

        return new Date(sale.timestamp);

    } else if (sale.soldAt && sale.soldAt.toDate) {

        return sale.soldAt.toDate();

    } else if (sale.soldAt) {

        return new Date(sale.soldAt);

    } else if (sale.date) {

        return new Date(sale.date);

    }

    return null;

}



window.loadReportes = function() {

    console.log('Ejecutando loadReportes...');

    const isVendedor = window.isVendedor && window.isVendedor(window.currentUser?.email);

    

    const content = `

        ${!isVendedor ? `

        <!-- Resumen Financiero -->

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

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

            

            <div class="bg-orange-50 rounded-lg p-6">

                <div class="flex items-center">

                    <div class="p-3 rounded-full bg-orange-100 text-orange-500">

                        <i class="fas fa-credit-card text-xl"></i>

                    </div>

                    <div class="ml-4">

                        <p class="text-sm font-medium text-orange-800">EGRESOS TOTALES</p>

                        <p class="text-2xl font-bold text-orange-900" id="total-expenses">S/ 0.00</p>

                    </div>

                </div>

            </div>

            

            <div class="bg-green-50 rounded-lg p-6">

                <div class="flex items-center">

                    <div class="p-3 rounded-full bg-green-100 text-green-500">

                        <i class="fas fa-chart-line text-xl"></i>

                    </div>

                    <div class="ml-4">

                        <p class="text-sm font-medium text-green-800">GANANCIA NETA</p>

                        <p class="text-2xl font-bold text-green-900" id="net-profit">S/ 0.00</p>

                    </div>

                </div>

            </div>

        </div>

        

        <!-- Gráficos -->

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

            <!-- Gráfico de Ventas -->

            <div class="lg:col-span-2 bg-white rounded-lg shadow p-6">

                <div class="flex justify-between items-center mb-4">

                    <h3 class="text-xl font-bold">Rendimiento de Ventas</h3>

                    <div class="flex space-x-2">

                        <button class="period-btn text-sm font-semibold py-1 px-3 rounded-md bg-gray-200 hover:bg-rose-500 hover:text-white transition-colors" data-period="week">Semana</button>

                        <button class="period-btn text-sm font-semibold py-1 px-3 rounded-md bg-rose-500 text-white transition-colors" data-period="month">Mes</button>

                    </div>

                </div>

                <div class="h-80">

                    <canvas id="sales-performance-chart"></canvas>

                </div>

            </div>

            

            <!-- Gráfico de Categorías -->

            <div class="bg-white rounded-lg shadow p-6">

                <h3 class="text-xl font-bold mb-4 text-center">Ventas por Categoría</h3>

                <div class="h-80 flex items-center justify-center">

                    <canvas id="category-sales-chart"></canvas>

                </div>

            </div>

        </div>

        ` : `

        <!-- Vista simplificada para vendedores -->

        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">

            <div class="flex items-center">

                <div class="flex-shrink-0">

                    <i class="fas fa-info-circle text-blue-400 text-2xl"></i>

                </div>

                <div class="ml-3">

                    <h3 class="text-lg font-medium text-blue-800">Panel de Vendedor</h3>

                    <p class="text-blue-700">Como vendedor, puedes ver el historial de ventas pero no los reportes financieros detallados.</p>

                </div>

            </div>

        </div>

        `}

        

        <!-- Historial de Ventas -->



        <div class="bg-white rounded-lg shadow p-6">



            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">



                <div class="flex items-center w-full sm:w-auto space-x-3">



                    <h3 class="text-xl font-bold">Historial de Ventas</h3>



                    <button id="generate-pdf-btn" class="inline-flex items-center px-3 py-2 bg-rose-500 text-white text-sm font-semibold rounded-md hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">



                        Generar PDF



                    </button>



                </div>



                <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">



                    <input type="date" id="date-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">



                    <select id="period-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">



                        <option value="all">Todas las fechas</option>



                        <option value="today">Hoy</option>



                        <option value="week">Esta semana</option>



                        <option value="month">Este mes</option>



                    </select>



                </div>



            </div>







            <div id="sales-history" class="space-y-3">



                <div class="py-6 text-center text-slate-400">Cargando historial de ventas...</div>



            </div>



        </div>







        </div>



        

        <!-- Modal para detalles de venta -->

        <div id="sale-details-modal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">

            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">

                <div class="flex justify-between items-center mb-4 gap-3">

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

        

        <!-- Modal de confirmación para anular venta -->

        <div id="annul-sale-modal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">

            <div class="bg-white rounded-lg p-6 w-full max-w-md text-center">

                <h3 class="text-xl font-bold mb-4">Confirmar Anulación</h3>

                <p class="mb-6">¿Estás seguro de que quieres anular esta venta? El stock será restaurado. Esta acción no se puede deshacer.</p>

                <div class="flex justify-center space-x-4">

                    <button id="cancel-annul-sale" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>

                    <button id="confirm-annul-sale" class="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Sí, Anular</button>

                </div>

            </div>

        </div>

    `;

    

    document.getElementById('content-area').innerHTML = content;

    

    // Configurar eventos

    setupReportesEvents();

    

    // Cargar datos

    if (!isVendedor) {

        updateFinancialSummary();

        renderSalesChart('month');

        renderCategoryChart();

    }

    displaySalesHistory();

};



function setupReportesEvents() {

    const isVendedor = window.isVendedor && window.isVendedor(window.currentUser?.email);

    

    if (!isVendedor) {

        // Eventos para filtros de gráficos

        document.querySelectorAll('.period-btn').forEach(button => {

            button.addEventListener('click', (e) => {

                document.querySelectorAll('.period-btn').forEach(btn => {

                    btn.classList.remove('bg-rose-500', 'text-white');

                    btn.classList.add('bg-gray-200');

                });

                e.target.classList.add('bg-rose-500', 'text-white');

                e.target.classList.remove('bg-gray-200');

                renderSalesChart(e.target.dataset.period);

            });

        });

    }

    

    // Eventos para filtros de historial

    document.getElementById('date-filter').addEventListener('change', filterSalesHistory);

    document.getElementById('period-filter').addEventListener('change', filterSalesHistory);

    const pdfButton = document.getElementById('generate-pdf-btn');

    if (pdfButton) {

        pdfButton.addEventListener('click', generateSalesHistoryPdf);

    }

    const singleSaleButton = document.getElementById('download-sale-details-btn');

    if (singleSaleButton) {

        singleSaleButton.addEventListener('click', handleDownloadSaleDetails);

    }

    

    // Eventos de modales

    document.getElementById('close-sale-details').addEventListener('click', closeSaleDetailsModal);

    document.getElementById('cancel-annul-sale').addEventListener('click', closeAnnulSaleModal);

    document.getElementById('confirm-annul-sale').addEventListener('click', handleAnnulSale);

    

    // Eventos del historial de ventas

    document.getElementById('sales-history').addEventListener('click', handleSalesHistoryClick);

}



function updateFinancialSummary() {

    if (!window.allSales || !window.allExpenses) return;

    

    const totalRevenue = window.allSales.reduce((sum, sale) => sum + (sale.totalSale || 0), 0);

    const totalCost = window.allSales.reduce((sum, sale) => sum + (sale.totalCost || 0), 0);

    const totalExpenses = window.allExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

    const netProfit = totalRevenue - totalCost - totalExpenses;

    

    document.getElementById('total-revenue').textContent = `S/ ${totalRevenue.toFixed(2)}`;

    document.getElementById('total-cost').textContent = `S/ ${totalCost.toFixed(2)}`;

    document.getElementById('total-expenses').textContent = `S/ ${totalExpenses.toFixed(2)}`;

    document.getElementById('net-profit').textContent = `S/ ${netProfit.toFixed(2)}`;

}



function renderSalesChart(period = 'month') {

    const canvas = document.getElementById('sales-performance-chart');

    if (!canvas || !window.allSales) return;

    

    const ctx = canvas.getContext('2d');

    const today = new Date();

    const days = period === 'week' ? 7 : 30;

    

    // Preparar datos

    const salesByDay = {};

    const labels = [];

    

    for (let i = days - 1; i >= 0; i--) {

        const date = new Date(today);

        date.setDate(date.getDate() - i);

        const dateStr = date.toISOString().split('T')[0];

        salesByDay[dateStr] = 0;

        labels.push(date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' }));

    }

    

    // Contar ventas por día

    window.allSales.forEach(sale => {

        const saleDate = getSaleDate(sale);

        if (!saleDate) return;

        

        const dateStr = saleDate.toISOString().split('T')[0];

        if (salesByDay[dateStr] !== undefined) {

            salesByDay[dateStr] += sale.totalSale || 0;

        }

    });

    

    const data = Object.values(salesByDay);

    

    // Destruir gráfico anterior si existe

    if (window.salesChart) {

        window.salesChart.destroy();

    }

    

    window.salesChart = new Chart(ctx, {

        type: 'line',

        data: {

            labels: labels,

            datasets: [{

                label: 'Ingresos por Ventas (S/)',

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



function renderCategoryChart() {

    const canvas = document.getElementById('category-sales-chart');

    if (!canvas || !window.allSales) return;

    

    const ctx = canvas.getContext('2d');

    

    // Agrupar ventas por categoría

    const salesByCategory = {};

    

    window.allSales.forEach(sale => {

        if (sale.items && Array.isArray(sale.items)) {

            // Ventas nuevas con múltiples productos

            sale.items.forEach(item => {

                const category = item.category || 'Sin Categoría';

                if (!salesByCategory[category]) {

                    salesByCategory[category] = 0;

                }

                salesByCategory[category] += item.quantity * item.price;

            });

        } else {

            // Ventas antiguas con un solo producto

            const category = sale.category || 'Sin Categoría';

            if (!salesByCategory[category]) {

                salesByCategory[category] = 0;

            }

            salesByCategory[category] += sale.totalSale || 0;

        }

    });

    

    const labels = Object.keys(salesByCategory);

    const data = Object.values(salesByCategory);

    

    const backgroundColors = [

        '#f43f5e', '#3b82f6', '#10b981', '#f97316', '#8b5cf6',

        '#ec4899', '#6366f1', '#f59e0b', '#06b6d4', '#d946ef'

    ];

    

    // Destruir gráfico anterior si existe

    if (window.categoryChart) {

        window.categoryChart.destroy();

    }

    

    window.categoryChart = new Chart(ctx, {

        type: 'doughnut',

        data: {

            labels: labels,

            datasets: [{

                data: data,

                backgroundColor: backgroundColors.slice(0, labels.length),

                hoverOffset: 4

            }]

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

                            size: 11

                        }

                    }

                }

            }

        }

    });

}



function displaySalesHistory(filteredSales = null) {



    const container = document.getElementById('sales-history');



    if (!container) return;







    const salesToShow = filteredSales || window.allSales || [];



    currentSalesHistory = [...salesToShow];







    const pdfButton = document.getElementById('generate-pdf-btn');



    if (pdfButton) {



        pdfButton.disabled = currentSalesHistory.length === 0;



    }



    const singleSaleButton = document.getElementById('download-sale-details-btn');



    if (singleSaleButton) {



        singleSaleButton.disabled = true;



        delete singleSaleButton.dataset.saleId;



    }







    if (salesToShow.length === 0) {



        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay ventas para mostrar</p>';



        return;



    }







    const canAnnul = window.isAdmin && window.isAdmin(window.currentUser?.email);







    container.innerHTML = salesToShow.map(sale => {



        const saleDate = getSaleDate(sale) || new Date();







        let productsDisplay = '';



        if (sale.items && Array.isArray(sale.items)) {



            productsDisplay = sale.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');



        } else if (sale.productName) {



            productsDisplay = `${sale.productName} (${sale.quantitySold || 1}x)`;



        } else {



            productsDisplay = 'Productos no especificados';



        }







        return `



            <div class="bg-white border border-gray-200 rounded-lg p-4">



                <div class="flex justify-between items-start mb-3">



                    <div class="flex-1">



                        <div class="flex justify-between items-start mb-2">



                            <div>



                                <p class="font-semibold text-gray-900">${sale.customerName || 'Cliente no especificado'}</p>



                                <p class="text-sm text-gray-600">${sale.customerPhone || 'Sin teléfono'}</p>



                                ${sale.deliveryLocation ? `<p class="text-sm text-gray-600">Ubicación: ${sale.deliveryLocation}</p>` : ''}



                            </div>



                            <div class="text-right">



                                <p class="font-bold text-green-600 text-lg">S/ ${(sale.totalSale || 0).toFixed(2)}</p>



                                ${sale.deliveryCost && sale.deliveryCost > 0 ? `<p class="text-xs text-gray-500">+ S/ ${sale.deliveryCost.toFixed(2)} entrega</p>` : ''}



                                <p class="text-sm text-gray-500">${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>



                                ${sale.profit !== undefined ? `<p class="text-xs ${sale.profit >= 0 ? 'text-green-600' : 'text-red-600'}">Ganancia: S/ ${sale.profit.toFixed(2)}</p>` : ''}



                            </div>



                        </div>







                        <div class="mb-3">



                            <p class="text-sm text-gray-700"><strong>Productos:</strong> ${productsDisplay}</p>



                        </div>







                        <div class="flex justify-between items-center">



                            <div class="flex space-x-2">



                                ${sale.paymentMethod ? `<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">${sale.paymentMethod}</span>` : ''}



                                ${sale.deliveryMethod ? `<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">${sale.deliveryMethod}</span>` : ''}



                            </div>



                            <div class="flex space-x-2">



                                <button class="view-sale-details px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600" data-sale-id="${sale.id}">



                                    Ver Detalles



                                </button>



                                ${canAnnul ? `



                                <button class="annul-sale-btn px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600" data-sale-id="${sale.id}">



                                    Anular



                                </button>



                                ` : ''}



                            </div>



                        </div>







                        <div class="mt-2 text-xs text-gray-500">



                            Vendido por: ${sale.soldBy || 'No especificado'}



                        </div>



                    </div>



                </div>



            </div>



        `;



    }).join('');



}







function filterSalesHistory() {

    const dateFilter = document.getElementById('date-filter').value;

    const periodFilter = document.getElementById('period-filter').value;

    

    if (!window.allSales) return;

    

    let filteredSales = [...window.allSales];

    

    if (periodFilter !== 'all') {

        const today = new Date();

        const startDate = new Date();

        

        switch (periodFilter) {

            case 'today':

                startDate.setHours(0, 0, 0, 0);

                break;

            case 'week':

                startDate.setDate(today.getDate() - 7);

                break;

            case 'month':

                startDate.setMonth(today.getMonth() - 1);

                break;

        }

        

        filteredSales = filteredSales.filter(sale => {

            const saleDate = getSaleDate(sale);

            return saleDate && saleDate >= startDate;

        });

    }

    

    if (dateFilter) {

        const filterDate = new Date(dateFilter);

        filteredSales = filteredSales.filter(sale => {

            const saleDate = getSaleDate(sale);

            return saleDate && saleDate.toDateString() === filterDate.toDateString();

        });

    }

    

    displaySalesHistory(filteredSales);

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

    const dateFilterInput = document.getElementById('date-filter');

    const periodValue = periodSelect ? periodSelect.value : 'all';

    const dateFilterValue = dateFilterInput ? dateFilterInput.value : '';



    const periodLabels = {

        all: 'Todas las fechas',

        today: 'Hoy',

        week: 'Esta semana',

        month: 'Este mes'

    };



    const periodLabel = periodLabels[periodValue] || 'Personalizado';

    const dateLabel = dateFilterValue ? new Date(dateFilterValue).toLocaleDateString('es-PE') : 'Sin fecha específica';



    doc.text(`Periodo: ${periodLabel}`, margin, y + 6);

    doc.text(`Fecha específica: ${dateLabel}`, margin, y + 12);



    const totalAmount = currentSalesHistory.reduce((sum, sale) => sum + (sale.totalSale || 0), 0);

    const summaryItems = [

        { label: 'Ventas incluidas', value: String(currentSalesHistory.length) },

        { label: 'Monto total', value: `S/ ${totalAmount.toFixed(2)}` }

    ];



    const gap = 6;

    const boxWidth = (pageWidth - margin * 2 - gap) / summaryItems.length;

    y += 18;

    summaryItems.forEach((item, index) => {

        const boxX = margin + index * (boxWidth + gap);

        doc.setFillColor(255, 241, 242);

        doc.rect(boxX, y, boxWidth, 14, 'F');

        doc.setDrawColor(accent.r, accent.g, accent.b);

        doc.setLineWidth(0.2);

        doc.rect(boxX, y, boxWidth, 14);

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



    currentSalesHistory.forEach((sale, index) => {

        const saleDate = getSaleDate(sale) || new Date();



        let products = '';

        if (sale.items && Array.isArray(sale.items)) {

            products = sale.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');

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

        const blockHeight = 18 + productLines.length * 4 + (tags.length ? 4 : 0) + (sale.deliveryLocation ? 4 : 0) + (profitLine ? 4 : 0);



        ensureSpace(blockHeight + 6);



        doc.line(margin, y - 4, pageWidth - margin, y - 4);



        doc.setTextColor(accent.r, accent.g, accent.b);

        doc.setFontSize(11);

        doc.text(`${index + 1}. ${sale.customerName || 'Cliente no especificado'}`, margin, y);

        doc.text(`S/ ${(sale.totalSale || 0).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });



        doc.setTextColor(slate.r, slate.g, slate.b);

        doc.setFontSize(9);

        y += 5;

        doc.text(`Teléfono: ${sale.customerPhone || 'Sin teléfono'}`, margin, y);

        doc.text(`Fecha: ${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, y, { align: 'right' });



        if (sale.deliveryLocation) {

            y += 5;

            doc.text(`Ubicación: ${sale.deliveryLocation}`, margin, y);

        }



        if (tags.length) {

            y += 5;

            doc.text(tags.join(' | '), margin, y);

        }



        y += 5;

        productLines.forEach(line => {

            doc.text(line, margin, y);

            y += 4;

        });



        if (profitLine) {

            doc.text(profitLine, margin, y);

            y += 4;

        }



        doc.text(`Vendedor: ${sale.soldBy || 'No especificado'}`, margin, y);

        y += 8;

    });



    const filename = (() => {

        const pad = (value) => String(value).padStart(2, '0');

        const year = generatedAt.getFullYear();

        const month = pad(generatedAt.getMonth() + 1);

        const day = pad(generatedAt.getDate());

        const hours = pad(generatedAt.getHours());

        const minutes = pad(generatedAt.getMinutes());

        return `reporte-ventas-${year}${month}${day}-${hours}${minutes}.pdf`;

    })();



    doc.save(filename);

}





function handleDownloadSaleDetails() {

    const button = document.getElementById('download-sale-details-btn');

    if (!button || !button.dataset.saleId) {

        alert('Selecciona una venta para descargar.');

        return;

    }



    const sale = window.allSales?.find(s => s.id === button.dataset.saleId);

    if (!sale) {

        alert('No se pudo encontrar la venta seleccionada.');

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

    doc.text(`ID de venta: ${sale.id}`, margin, y);

    doc.text(`Fecha: ${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, y, { align: 'right' });

    y += 6;

    doc.text(`Cliente: ${sale.customerName || 'No especificado'}`, margin, y);

    doc.text(`Teléfono: ${sale.customerPhone || 'Sin teléfono'}`, pageWidth - margin, y, { align: 'right' });

    y += 6;



    if (sale.deliveryLocation) {

        doc.text(`Ubicación: ${sale.deliveryLocation}`, margin, y);

        y += 6;

    }



    doc.text(`Metodo de pago: ${sale.paymentMethod || 'No especificado'}`, margin, y);

    doc.text(`Metodo de entrega: ${sale.deliveryMethod || 'No especificado'}`, pageWidth - margin, y, { align: 'right' });

    y += 8;



    doc.setFontSize(11);

    doc.setTextColor(accent.r, accent.g, accent.b);

    doc.text(`Total: S/ ${(sale.totalSale || 0).toFixed(2)}`, margin, y);

    const profitLine = sale.profit !== undefined ? `Ganancia: S/ ${sale.profit.toFixed(2)}` : '' ;

    if (profitLine) {

        doc.text(profitLine, pageWidth - margin, y, { align: 'right' });

    }

    y += 8;



    doc.setTextColor(slate.r, slate.g, slate.b);

    doc.setFontSize(10);

    doc.text('Productos vendidos:', margin, y);

    y += 6;



    if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {

        doc.setFontSize(9);

        sale.items.forEach(item => {

            if (y > 270) {

                doc.addPage();

                y = 20;

                doc.setFontSize(9);

                doc.setTextColor(slate.r, slate.g, slate.b);

            }

            doc.text(`- ${item.name} (${item.quantity} x S/ ${item.price.toFixed(2)})`, margin, y);

            doc.text(`S/ ${(item.quantity * item.price).toFixed(2)}`, pageWidth - margin, y, { align: 'right' });

            y += 5;

        });

    } else {

        doc.setFontSize(9);

        doc.text(`- ${sale.productName || 'Producto no especificado'} (${sale.quantitySold || 1} x S/ ${(sale.totalSale || 0).toFixed(2)})`, margin, y);

        y += 5;

    }



    if (sale.deliveryCost) {

        doc.text(`Costo de entrega: S/ ${sale.deliveryCost.toFixed(2)}`, margin, y);

        y += 5;

    }

    if (sale.subtotalSale && sale.subtotalSale !== sale.totalSale) {

        doc.text(`Subtotal sin entrega: S/ ${sale.subtotalSale.toFixed(2)}`, margin, y);

        y += 5;

    }



    if (sale.notes) {

        y += 3;

        const notes = doc.splitTextToSize(`Observaciones: ${sale.notes}`, pageWidth - margin * 2);

        notes.forEach(line => {

            if (y > 270) {

                doc.addPage();

                y = 20;

            }

            doc.text(line, margin, y);

            y += 4;

        });

    }



    doc.text(`Vendedor: ${sale.soldBy || 'No especificado'}`, margin, y + 4);



    const filename = (() => {

        const pad = (value) => String(value).padStart(2, '0');

        const year = saleDate.getFullYear();

        const month = pad(saleDate.getMonth() + 1);

        const day = pad(saleDate.getDate());

        return `detalle-venta-${year}${month}${day}-${sale.id}`.replace(/[^a-zA-Z0-9-_]/g, '');

    })();



    doc.save(`${filename}.pdf`);

}



function handleSalesHistoryClick(e) {

    if (e.target.classList.contains('view-sale-details')) {

        const saleId = e.target.dataset.saleId;

        showSaleDetails(saleId);

    } else if (e.target.classList.contains('annul-sale-btn')) {

        const saleId = e.target.dataset.saleId;

        showAnnulSaleModal(saleId);

    }

}



function showSaleDetails(saleId) {

    const sale = window.allSales.find(s => s.id === saleId);

    if (!sale) return;

    

    const saleDate = getSaleDate(sale) || new Date();

    

    let productsTable = '';

    if (sale.items && Array.isArray(sale.items)) {

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

                    ${sale.items.map(item => `

                        <tr>

                            <td class="border border-gray-300 px-3 py-2">${item.name}</td>

                            <td class="border border-gray-300 px-3 py-2 text-center">${item.quantity}</td>

                            <td class="border border-gray-300 px-3 py-2 text-right">S/ ${item.price.toFixed(2)}</td>

                            <td class="border border-gray-300 px-3 py-2 text-right">S/ ${(item.quantity * item.price).toFixed(2)}</td>

                        </tr>

                    `).join('')}

                </tbody>

                <tfoot>

                    <tr class="bg-gray-100 font-bold">

                        <td colspan="3" class="border border-gray-300 px-3 py-2 text-right">Subtotal:</td>

                        <td class="border border-gray-300 px-3 py-2 text-right">S/ ${(sale.subtotalSale || sale.totalSale).toFixed(2)}</td>

                    </tr>

                    ${sale.deliveryCost ? `

                    <tr>

                        <td colspan="3" class="border border-gray-300 px-3 py-2 text-right">Costo de entrega:</td>

                        <td class="border border-gray-300 px-3 py-2 text-right">S/ ${sale.deliveryCost.toFixed(2)}</td>

                    </tr>

                    ` : ''}

                    <tr class="bg-gray-200 font-bold">

                        <td colspan="3" class="border border-gray-300 px-3 py-2 text-right">TOTAL:</td>

                        <td class="border border-gray-300 px-3 py-2 text-right">S/ ${sale.totalSale.toFixed(2)}</td>

                    </tr>

                </tfoot>

            </table>

        `;

    } else {

        productsTable = `<p class="mt-4"><strong>Producto:</strong> ${sale.productName} (${sale.quantitySold || 1}x)</p>`;

    }

    

    const content = `

        <div class="space-y-4">

            <div class="grid grid-cols-2 gap-4 text-sm">

                <div>

                    <p><strong>Cliente:</strong> ${sale.customerName || 'No especificado'}</p>

                    <p><strong>Teléfono:</strong> ${sale.customerPhone || 'No especificado'}</p>

                    ${sale.deliveryLocation ? `<p><strong>Ubicación:</strong> ${sale.deliveryLocation}</p>` : ''}

                </div>

                <div>

                    <p><strong>Fecha:</strong> ${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE')}</p>

                    <p><strong>Método de pago:</strong> ${sale.paymentMethod || 'No especificado'}</p>

                    <p><strong>Método de entrega:</strong> ${sale.deliveryMethod || 'No especificado'}</p>

                    <p><strong>Vendedor:</strong> ${sale.soldBy || 'No especificado'}</p>

                </div>

            </div>

            

            <div>

                <h4 class="font-bold">Productos vendidos:</h4>

                ${productsTable}

            </div>

        </div>

    `;

    

    document.getElementById('sale-details-content').innerHTML = content;

    const downloadButton = document.getElementById('download-sale-details-btn');

    if (downloadButton) {

        downloadButton.dataset.saleId = sale.id;

        downloadButton.disabled = false;

    }

    document.getElementById('sale-details-modal').classList.add('active');

}



function closeSaleDetailsModal() {

    document.getElementById('sale-details-modal').classList.remove('active');

    const downloadButton = document.getElementById('download-sale-details-btn');

    if (downloadButton) {

        downloadButton.disabled = true;

        delete downloadButton.dataset.saleId;

    }

}



let saleToAnnul = null;



function showAnnulSaleModal(saleId) {

    saleToAnnul = saleId;

    document.getElementById('annul-sale-modal').classList.add('active');

}



function closeAnnulSaleModal() {

    saleToAnnul = null;

    document.getElementById('annul-sale-modal').classList.remove('active');

}



async function handleAnnulSale() {

    if (!saleToAnnul) return;

    

    const confirmBtn = document.getElementById('confirm-annul-sale');

    const originalText = confirmBtn.textContent;

    confirmBtn.disabled = true;

    confirmBtn.textContent = 'Anulando...';

    

    try {

        const sale = window.allSales.find(s => s.id === saleToAnnul);

        if (!sale) {

            alert('No se pudo encontrar la venta.');

            return;

        }

        

        // Verificar si se descontó stock originalmente consultando movimientos de inventario

        let stockFueDescontado = false;

        try {

            const movimientosQuery = await window.db.collection('movimientos_inventario')

                .where('relatedTo', '==', 'venta')

                .where('relatedId', '==', saleToAnnul)

                .where('tipo', '==', 'salida')

                .get();

            

            stockFueDescontado = !movimientosQuery.empty;

            console.log(`Stock fue descontado para venta ${saleToAnnul}:`, stockFueDescontado);

        } catch (error) {

            console.warn('Error verificando movimientos de inventario:', error);

            // En caso de error, asumir que sí se descontó para mantener compatibilidad

            stockFueDescontado = true;

        }

        

        // Solo restaurar stock si realmente se había descontado

        if (stockFueDescontado) {

            console.log('Restaurando stock usando movimientos de inventario...');

            

            // Buscar todos los movimientos de inventario de esta venta

            const movimientosInventario = await window.db.collection('movimientos_inventario')

                .where('relatedTo', '==', 'venta')

                .where('relatedId', '==', saleToAnnul)

                .where('tipo', '==', 'salida')

                .get();

            

            if (!movimientosInventario.empty) {

                console.log(`Encontrados ${movimientosInventario.size} movimientos de inventario para restaurar`);

                

                // Agrupar movimientos por producto

                const movimientosPorProducto = {};

                movimientosInventario.forEach(doc => {

                    const mov = doc.data();

                    if (!movimientosPorProducto[mov.productoId]) {

                        movimientosPorProducto[mov.productoId] = [];

                    }

                    movimientosPorProducto[mov.productoId].push({

                        id: doc.id,

                        ...mov

                    });

                });

                

                // Restaurar lotes y stock por cada producto

                for (const [productId, movimientos] of Object.entries(movimientosPorProducto)) {

                    await restaurarLotesDesdeMovimientos(productId, movimientos);

                }

                

                // Eliminar los movimientos de inventario ya procesados

                for (const doc of movimientosInventario.docs) {

                    await window.deleteDoc(doc.ref);

                }

                

            } else {

                console.log('No se encontraron movimientos de inventario, usando método legacy...');

                

                // Fallback al método anterior para ventas sin movimientos de inventario

                if (sale.items && Array.isArray(sale.items)) {

                    for (const item of sale.items) {

                        const productRef = window.doc(window.db, "products", item.id);

                        await window.runTransaction(window.db, async (transaction) => {

                            const productDoc = await transaction.get(productRef);

                            if (productDoc && productDoc.exists) {

                                const currentStock = productDoc.data().stock;

                                transaction.update(productRef, {

                                    stock: currentStock + item.quantity

                                });

                            }

                        });

                    }

                } else if (sale.productId) {

                    const productRef = window.doc(window.db, "products", sale.productId);

                    await window.runTransaction(window.db, async (transaction) => {

                        const productDoc = await transaction.get(productRef);

                        if (productDoc && productDoc.exists) {

                            const currentStock = productDoc.data().stock;

                            transaction.update(productRef, {

                                stock: currentStock + (sale.quantitySold || 1)

                            });

                        }

                    });

                }

            }

        } else {

            console.log('No se restaura stock porque no fue descontado originalmente');

        }

        

        // Eliminar la venta

        await window.deleteDoc(window.doc(window.db, "sales", saleToAnnul));

        

        // Eliminar movimiento de caja asociado a esta venta

        try {

            console.log('Buscando movimientos de caja asociados a la venta...');

            const movimientosCajaQuery = await window.db.collection('movimientos_caja')

                .where('relatedTo', '==', 'venta')

                .where('relatedId', '==', saleToAnnul)

                .get();

            

            if (!movimientosCajaQuery.empty) {

                console.log(`Eliminando ${movimientosCajaQuery.size} movimiento(s) de caja asociado(s)...`);

                for (const doc of movimientosCajaQuery.docs) {

                    await window.deleteDoc(doc.ref);

                    console.log(`Movimiento de caja ${doc.id} eliminado`);

                }

            } else {

                console.log('No se encontraron movimientos de caja asociados a esta venta');

            }

        } catch (error) {

            console.warn('Error eliminando movimientos de caja asociados:', error);

            // No fallar la anulación por esto, solo advertir

        }

        

        alert('Venta anulada exitosamente. Stock restaurado y movimientos de caja eliminados.');

        

        // Recargar datos

        await window.loadProducts();

        await window.loadSales();

        

        // Actualizar vista

        const isVendedor = window.isVendedor && window.isVendedor(window.currentUser?.email);

        if (!isVendedor) {

            updateFinancialSummary();

            renderSalesChart('month');

            renderCategoryChart();

        }

        displaySalesHistory();

        

        closeAnnulSaleModal();

        

    } catch (error) {

        console.error("Error anulando venta:", error);

        alert('Error al anular la venta: ' + error.message);

    } finally {

        confirmBtn.disabled = false;

        confirmBtn.textContent = originalText;

    }

}



/**

 * Restaura los lotes específicos desde los movimientos de inventario

 * @param {string} productId - ID del producto

 * @param {Array} movimientos - Array de movimientos de inventario de la venta

 */

async function restaurarLotesDesdeMovimientos(productId, movimientos) {

    try {

        console.log(`Restaurando lotes para producto ${productId} desde ${movimientos.length} movimientos`);

        

        let stockRestauradoTotal = 0;

        

        for (const movimiento of movimientos) {

            const { loteId, cantidad, costoUnitario } = movimiento;

            

            if (loteId && loteId !== 'sin-lote') {

                // Restaurar lote específico

                console.log(`Restaurando ${cantidad} unidades al lote ${loteId}`);

                

                const loteQuery = await window.db.collection('stock_por_lote')

                    .where('productoId', '==', productId)

                    .where('loteId', '==', loteId)

                    .get();

                

                if (!loteQuery.empty) {

                    // Lote existe, restaurar cantidad

                    const loteDoc = loteQuery.docs[0];

                    const loteData = loteDoc.data();

                    const nuevaCantidad = (loteData.cantidad || 0) + cantidad;

                    

                    await loteDoc.ref.update({

                        cantidad: nuevaCantidad

                    });

                    

                    console.log(`Lote ${loteId} restaurado: ${loteData.cantidad} + ${cantidad} = ${nuevaCantidad}`);

                } else {

                    // Lote no existe, recrearlo

                    console.log(`Recreando lote ${loteId} con ${cantidad} unidades`);

                    

                    await window.db.collection('stock_por_lote').add({

                        productoId: productId,

                        productoNombre: movimiento.productoNombre || '',

                        loteId: loteId,

                        cantidad: cantidad,

                        costoUnitario: costoUnitario || 0,

                        fechaIngreso: movimiento.timestamp || window.serverTimestamp(),

                        fechaVencimiento: null,

                        proveedor: 'Restaurado de venta anulada',

                        estado: 'disponible',

                        observaciones: `Lote restaurado de venta anulada ${movimiento.ventaId || movimiento.relatedId}`

                    });

                }

                

                stockRestauradoTotal += cantidad;

            } else {

                // Movimiento sin lote (modo legacy), solo sumar al stock total

                console.log(`Restaurando ${cantidad} unidades al stock directo (sin lote)`);

                stockRestauradoTotal += cantidad;

            }

            

            // Registrar movimiento de entrada por la restauración

            await window.db.collection('movimientos_inventario').add({

                fecha: new Date().toISOString().split('T')[0],

                timestamp: window.serverTimestamp(),

                productoId: productId,

                productoNombre: movimiento.productoNombre || '',

                loteId: loteId || 'restaurado',

                cantidad: cantidad,

                tipo: 'entrada',

                subtipo: 'anulacion_venta',

                relatedTo: 'anulacion',

                relatedId: movimiento.ventaId || movimiento.relatedId,

                costoUnitario: costoUnitario || 0,

                costoTotal: (costoUnitario || 0) * cantidad,

                usuario: window.currentUser?.email || '',

                observaciones: `Restauración por anulación de venta ${movimiento.ventaId || movimiento.relatedId}`

            });

        }

        

        return stockRestauradoTotal;
        lotesSnapshot.forEach(doc => {

            const lote = doc.data();

            stockReal += lote.cantidad || 0;

        });

        

        return stockReal;

    } catch (error) {

        console.error('Error calculando stock real:', error);

        return 0;

    }

}


console.log('admin-reportes.js cargado completamente');