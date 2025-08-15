// admin-egresos.js - Funciones para la gestión de egresos
console.log('Cargando admin-egresos.js...');

window.loadEgresos = function() {
    console.log('Ejecutando loadEgresos...');
    // Verificar permisos - solo admins pueden ver egresos
    if (!window.currentUser || !window.isAdmin(window.currentUser.email)) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para gestionar egresos</p>
                <p class="text-gray-500">Esta sección es solo para Administradores</p>
            </div>
        `;
        return;
    }

    const content = `
        <!-- Formulario para registrar egreso -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h2 class="text-2xl font-bold mb-6 text-center text-red-600">Registro de Egresos</h2>
            
            <form id="expense-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="md:col-span-2">
                        <label for="expense-description" class="block text-sm font-medium text-gray-700 mb-2">Descripción del Egreso</label>
                        <input type="text" id="expense-description" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Ej: Alquiler, servicios, compra de inventario..." required>
                    </div>
                    <div>
                        <label for="expense-amount" class="block text-sm font-medium text-gray-700 mb-2">Monto (S/)</label>
                        <input type="number" step="0.01" min="0" id="expense-amount" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="0.00" required>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="expense-category" class="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <select id="expense-category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                            <option value="alquiler">Alquiler</option>
                            <option value="servicios">Servicios (luz, agua, internet)</option>
                            <option value="transporte">Transporte</option>
                            <option value="personal">Gastos de Personal</option>
                            <option value="marketing">Marketing</option>
                            <option value="inventario">Compra de Inventario</option>
                            <option value="sistema">Sistema</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>
                    <div>
                        <label for="expense-date" class="block text-sm font-medium text-gray-700 mb-2">Fecha del Egreso</label>
                        <input type="date" id="expense-date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                    </div>
                </div>
                
                <div>
                    <label for="expense-notes" class="block text-sm font-medium text-gray-700 mb-2">Notas Adicionales (Opcional)</label>
                    <textarea id="expense-notes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Detalles adicionales sobre este egreso..."></textarea>
                </div>
                
                <div class="text-center">
                    <button type="submit" id="register-expense-btn" class="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
                        Registrar Egreso
                    </button>
                </div>
            </form>
        </div>

        <!-- Resumen de egresos -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-red-50 rounded-lg p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-red-100 text-red-500">
                        <i class="fas fa-calendar-day text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-red-800">EGRESOS HOY</p>
                        <p class="text-2xl font-bold text-red-900" id="expenses-today">S/ 0.00</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-orange-50 rounded-lg p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-orange-100 text-orange-500">
                        <i class="fas fa-calendar-week text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-orange-800">EGRESOS ESTE MES</p>
                        <p class="text-2xl font-bold text-orange-900" id="expenses-month">S/ 0.00</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-6">
                <div class="flex items-center">
                    <div class="p-3 rounded-full bg-gray-100 text-gray-500">
                        <i class="fas fa-calendar-alt text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-800">EGRESOS TOTALES</p>
                        <p class="text-2xl font-bold text-gray-900" id="expenses-total">S/ 0.00</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Gráfico de egresos por categoría -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h3 class="text-xl font-bold mb-4">Egresos por Categoría</h3>
            <div class="h-80">
                <canvas id="expenses-by-category-chart"></canvas>
            </div>
        </div>

        <!-- Lista de egresos -->
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <h3 class="text-xl font-bold">Historial de Egresos</h3>
                <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <input type="date" id="expense-date-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                    <select id="expense-category-filter" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="">Todas las categorías</option>
                        <option value="alquiler">Alquiler</option>
                        <option value="servicios">Servicios</option>
                        <option value="transporte">Transporte</option>
                        <option value="personal">Gastos de Personal</option>
                        <option value="marketing">Marketing</option>
                        <option value="inventario">Compra de Inventario</option>
                        <option value="sistema">Sistema</option>
                        <option value="otros">Otros</option>
                    </select>
                </div>
            </div>
            
            <div id="expenses-history" class="space-y-3">
                <p class="text-center text-gray-500 py-4">Cargando historial de egresos...</p>
            </div>
        </div>

        <!-- Modal de confirmación para anular egreso -->
        <div id="annul-expense-modal" class="modal fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md text-center">
                <h3 class="text-xl font-bold mb-4 text-red-600">Confirmar Anulación de Egreso</h3>
                <div id="expense-details" class="mb-4 p-4 bg-gray-50 rounded-lg text-left">
                    <!-- Los detalles del egreso se llenarán dinámicamente -->
                </div>
                <p class="mb-6 text-sm text-gray-600">¿Estás seguro de que quieres anular este egreso? Esta acción no se puede deshacer.</p>
                <div class="flex justify-center space-x-4">
                    <button id="cancel-annul-expense" class="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">Cancelar</button>
                    <button id="confirm-annul-expense" class="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Sí, Anular</button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = content;
    
    // Configurar fecha por defecto (hoy)
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
    
    // Configurar eventos
    setupEgresosEvents();
    
    // Cargar datos
    updateExpensesSummary();
    renderExpensesCategoryChart();
    displayExpensesHistory();
};

let expenseToAnnul = null;

function setupEgresosEvents() {
    // Formulario de registro
    document.getElementById('expense-form').addEventListener('submit', handleExpenseSubmit);
    
    // Filtros
    document.getElementById('expense-date-filter').addEventListener('change', filterExpensesHistory);
    document.getElementById('expense-category-filter').addEventListener('change', filterExpensesHistory);
    
    // Modal de anulación
    document.getElementById('cancel-annul-expense').addEventListener('click', closeAnnulExpenseModal);
    document.getElementById('confirm-annul-expense').addEventListener('click', handleAnnulExpense);
    
    // Eventos del historial
    document.getElementById('expenses-history').addEventListener('click', handleExpensesHistoryClick);
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('register-expense-btn');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';
    
    try {
        const description = document.getElementById('expense-description').value.trim();
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const expenseDate = document.getElementById('expense-date').value;
        const notes = document.getElementById('expense-notes').value.trim();
        
        if (!description || !amount || amount <= 0) {
            alert('Por favor complete todos los campos requeridos correctamente.');
            return;
        }
        
        const expenseData = {
            description,
            amount,
            category,
            expenseDate,
            notes: notes || null,
            timestamp: window.serverTimestamp(),
            date: new Date().toISOString().split('T')[0],
            registeredBy: window.currentUser.email
        };
        
        await window.addDoc(window.collection(window.db, "expenses"), expenseData);
        
        // Limpiar formulario
        document.getElementById('expense-form').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expense-date').value = today;
        
        // Recargar datos
        await window.loadExpenses();
        updateExpensesSummary();
        renderExpensesCategoryChart();
        displayExpensesHistory();
        
        alert('Egreso registrado exitosamente.');
        
    } catch (error) {
        console.error("Error registrando egreso:", error);
        alert('Error al registrar el egreso: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function updateExpensesSummary() {
    if (!window.allExpenses) return;
    
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const todayStr = today.toISOString().split('T')[0];
    
    let expensesToday = 0;
    let expensesThisMonth = 0;
    let expensesTotal = 0;
    
    window.allExpenses.forEach(expense => {
        const amount = expense.amount || 0;
        expensesTotal += amount;
        
        let expenseDate;
        if (expense.timestamp && expense.timestamp.toDate) {
            expenseDate = expense.timestamp.toDate();
        } else if (expense.timestamp) {
            expenseDate = new Date(expense.timestamp);
        } else if (expense.expenseDate) {
            expenseDate = new Date(expense.expenseDate);
        } else {
            expenseDate = new Date();
        }
        
        const expenseDateStr = expenseDate.toISOString().split('T')[0];
        
        if (expenseDateStr === todayStr) {
            expensesToday += amount;
        }
        
        if (expenseDate >= thisMonth) {
            expensesThisMonth += amount;
        }
    });
    
    document.getElementById('expenses-today').textContent = `S/ ${expensesToday.toFixed(2)}`;
    document.getElementById('expenses-month').textContent = `S/ ${expensesThisMonth.toFixed(2)}`;
    document.getElementById('expenses-total').textContent = `S/ ${expensesTotal.toFixed(2)}`;
}

function renderExpensesCategoryChart() {
    const canvas = document.getElementById('expenses-by-category-chart');
    if (!canvas || !window.allExpenses) return;
    
    const ctx = canvas.getContext('2d');
    
    // Agrupar egresos por categoría
    const expensesByCategory = {};
    
    window.allExpenses.forEach(expense => {
        const category = expense.category || 'otros';
        if (!expensesByCategory[category]) {
            expensesByCategory[category] = 0;
        }
        expensesByCategory[category] += expense.amount || 0;
    });
    
    const labels = Object.keys(expensesByCategory).map(key => {
        const categoryNames = {
            'alquiler': 'Alquiler',
            'servicios': 'Servicios',
            'transporte': 'Transporte',
            'personal': 'Personal',
            'marketing': 'Marketing',
            'inventario': 'Inventario',
            'sistema': 'Sistema',
            'otros': 'Otros'
        };
        return categoryNames[key] || key;
    });
    
    const data = Object.values(expensesByCategory);
    
    const backgroundColors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
        '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'
    ];
    
    // Destruir gráfico anterior si existe
    if (window.expensesCategoryChart) {
        window.expensesCategoryChart.destroy();
    }
    
    window.expensesCategoryChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Egresos por Categoría (S/)',
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 1
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

function displayExpensesHistory(filteredExpenses = null) {
    const container = document.getElementById('expenses-history');
    if (!container) return;
    
    const expensesToShow = filteredExpenses || window.allExpenses || [];
    
    if (expensesToShow.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay egresos para mostrar</p>';
        return;
    }
    
    container.innerHTML = expensesToShow.map(expense => {
        let expenseDate;
        if (expense.timestamp && expense.timestamp.toDate) {
            expenseDate = expense.timestamp.toDate();
        } else if (expense.timestamp) {
            expenseDate = new Date(expense.timestamp);
        } else if (expense.expenseDate) {
            expenseDate = new Date(expense.expenseDate);
        } else {
            expenseDate = new Date();
        }
        
        const categoryNames = {
            'alquiler': 'Alquiler',
            'servicios': 'Servicios',
            'transporte': 'Transporte',
            'personal': 'Personal',
            'marketing': 'Marketing',
            'inventario': 'Inventario',
            'sistema': 'Sistema',
            'otros': 'Otros'
        };
        
        const categoryDisplay = categoryNames[expense.category] || expense.category || 'Sin categoría';
        
        return `
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                    <div class="flex-1">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <p class="font-semibold text-gray-900">${expense.description}</p>
                                <p class="text-sm text-gray-600">Categoría: ${categoryDisplay}</p>
                                ${expense.notes ? `<p class="text-sm text-gray-500 mt-1">${expense.notes}</p>` : ''}
                            </div>
                            <div class="text-right">
                                <p class="font-bold text-red-600 text-lg">-S/ ${(expense.amount || 0).toFixed(2)}</p>
                                <p class="text-sm text-gray-500">${expenseDate.toLocaleDateString('es-PE')} ${expenseDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        
                        <div class="flex justify-between items-center">
                            <div class="text-xs text-gray-500">
                                Registrado por: ${expense.registeredBy || 'No especificado'}
                            </div>
                            <div>
                                <button class="annul-expense-btn px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600" data-expense-id="${expense.id}">
                                    Anular
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterExpensesHistory() {
    const dateFilter = document.getElementById('expense-date-filter').value;
    const categoryFilter = document.getElementById('expense-category-filter').value;
    
    if (!window.allExpenses) return;
    
    let filteredExpenses = [...window.allExpenses];
    
    if (dateFilter) {
        const filterDate = new Date(dateFilter);
        filteredExpenses = filteredExpenses.filter(expense => {
            let expenseDate;
            if (expense.timestamp && expense.timestamp.toDate) {
                expenseDate = expense.timestamp.toDate();
            } else if (expense.timestamp) {
                expenseDate = new Date(expense.timestamp);
            } else if (expense.expenseDate) {
                expenseDate = new Date(expense.expenseDate);
            } else {
                return false;
            }
            
            return expenseDate.toDateString() === filterDate.toDateString();
        });
    }
    
    if (categoryFilter) {
        filteredExpenses = filteredExpenses.filter(expense => expense.category === categoryFilter);
    }
    
    displayExpensesHistory(filteredExpenses);
}

function handleExpensesHistoryClick(e) {
    if (e.target.classList.contains('annul-expense-btn')) {
        const expenseId = e.target.dataset.expenseId;
        showAnnulExpenseModal(expenseId);
    }
}

function showAnnulExpenseModal(expenseId) {
    const expense = window.allExpenses.find(e => e.id === expenseId);
    if (!expense) {
        alert('Egreso no encontrado');
        return;
    }
    
    expenseToAnnul = expense;
    
    let expenseDate;
    if (expense.timestamp && expense.timestamp.toDate) {
        expenseDate = expense.timestamp.toDate();
    } else if (expense.timestamp) {
        expenseDate = new Date(expense.timestamp);
    } else if (expense.expenseDate) {
        expenseDate = new Date(expense.expenseDate);
    } else {
        expenseDate = new Date();
    }
    
    const categoryNames = {
        'alquiler': 'Alquiler',
        'servicios': 'Servicios',
        'transporte': 'Transporte',
        'personal': 'Personal',
        'marketing': 'Marketing',
        'inventario': 'Inventario',
        'sistema': 'Sistema',
        'otros': 'Otros'
    };
    
    document.getElementById('expense-details').innerHTML = `
        <div class="text-sm">
            <p><strong>Descripción:</strong> ${expense.description}</p>
            <p><strong>Monto:</strong> S/ ${expense.amount.toFixed(2)}</p>
            <p><strong>Categoría:</strong> ${categoryNames[expense.category] || expense.category || 'Sin categoría'}</p>
            <p><strong>Fecha:</strong> ${expenseDate.toLocaleDateString('es-PE')} ${expenseDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
            ${expense.notes ? `<p><strong>Notas:</strong> ${expense.notes}</p>` : ''}
            ${expense.registeredBy ? `<p><strong>Registrado por:</strong> ${expense.registeredBy}</p>` : ''}
        </div>
    `;
    
    document.getElementById('annul-expense-modal').classList.add('active');
}

function closeAnnulExpenseModal() {
    expenseToAnnul = null;
    document.getElementById('annul-expense-modal').classList.remove('active');
}

async function handleAnnulExpense() {
    if (!expenseToAnnul) {
        alert('No hay egreso seleccionado para anular');
        return;
    }
    
    const confirmBtn = document.getElementById('confirm-annul-expense');
    const originalText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Anulando...';
    
    try {
        await window.deleteDoc(window.doc(window.db, "expenses", expenseToAnnul.id));
        
        alert(`Egreso anulado exitosamente.\n\nDescripción: ${expenseToAnnul.description}\nMonto: S/ ${expenseToAnnul.amount.toFixed(2)}`);
        
        // Recargar datos
        await window.loadExpenses();
        updateExpensesSummary();
        renderExpensesCategoryChart();
        displayExpensesHistory();
        
        closeAnnulExpenseModal();
        
    } catch (error) {
        console.error("Error anulando egreso:", error);
        alert('Error al anular el egreso: ' + error.message);
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

console.log('admin-egresos.js cargado completamente');
