// admin-ventas.js - Funciones para el registro de ventas
console.log('Cargando admin-ventas.js...');

window.loadVentas = function() {
    console.log('Ejecutando loadVentas...');
    const content = `
        <!-- Formulario de Registro de Ventas -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h2 class="text-2xl font-bold mb-6 text-center">Registro de Ventas</h2>
            
            <!-- Información del Cliente -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label for="customer-name" class="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                    <input type="text" id="customer-name" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Nombre del cliente" required>
                </div>
                <div>
                    <label for="customer-phone" class="block text-sm font-medium text-gray-700 mb-2">Teléfono / Ubicación</label>
                    <input type="text" id="customer-phone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Teléfono o dirección">
                </div>
            </div>

            <!-- Selección de Producto -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-4">Agregar Productos</h3>
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div class="md:col-span-2 relative">
                        <label for="product-search" class="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                        <input type="text" id="product-search" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Buscar producto..." autocomplete="off">
                        <div id="product-suggestions" class="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg hidden max-h-60 overflow-y-auto"></div>
                    </div>
                    <div>
                        <label for="product-quantity" class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                        <input type="number" id="product-quantity" min="1" value="1" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div>
                        <label for="product-price" class="block text-sm font-medium text-gray-700 mb-2">Precio Unitario</label>
                        <input type="number" step="0.01" id="product-price" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500">
                    </div>
                    <div>
                        <button type="button" id="add-product-btn" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
                            Agregar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Tabla de Productos -->
            <div class="mb-6">
                <h3 class="text-lg font-semibold mb-4">Productos en la Venta</h3>
                <div class="overflow-x-auto">
                    <table class="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr class="bg-gray-50">
                                <th class="border border-gray-300 px-4 py-2 text-left">Ítem</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Producto</th>
                                <th class="border border-gray-300 px-4 py-2 text-center">Cant.</th>
                                <th class="border border-gray-300 px-4 py-2 text-right">Precio</th>
                                <th class="border border-gray-300 px-4 py-2 text-right">Subtotal</th>
                                <th class="border border-gray-300 px-4 py-2 text-center">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="sale-items-tbody">
                            <tr>
                                <td colspan="6" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    No hay productos agregados. Use el formulario de arriba para agregar productos.
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="bg-gray-100 font-bold">
                                <td colspan="4" class="border border-gray-300 px-4 py-3 text-right">SUBTOTAL:</td>
                                <td class="border border-gray-300 px-4 py-3 text-right" id="sale-subtotal">S/ 0.00</td>
                                <td class="border border-gray-300"></td>
                            </tr>
                            <tr class="bg-gray-100" id="delivery-cost-row" style="display: none;">
                                <td colspan="4" class="border border-gray-300 px-4 py-3 text-right font-medium">COSTO DE ENTREGA:</td>
                                <td class="border border-gray-300 px-4 py-3 text-right font-medium" id="display-delivery-cost">S/ 0.00</td>
                                <td class="border border-gray-300"></td>
                            </tr>
                            <tr class="bg-gray-200 font-bold text-lg">
                                <td colspan="4" class="border border-gray-300 px-4 py-3 text-right">TOTAL:</td>
                                <td class="border border-gray-300 px-4 py-3 text-right" id="sale-total">S/ 0.00</td>
                                <td class="border border-gray-300"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Método de Pago y Entrega -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">Método de Pago</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="radio" name="payment-method" value="yape" class="mr-2" checked>
                            <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">Yape</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="payment-method" value="plin" class="mr-2">
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Plin</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="payment-method" value="efectivo" class="mr-2">
                            <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Efectivo</span>
                        </label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-3">Método de Entrega</label>
                    <div class="space-y-2">
                        <label class="flex items-center">
                            <input type="radio" name="delivery-method" value="oficina" class="mr-2" checked>
                            <span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">Oficina</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="delivery-method" value="delivery" class="mr-2">
                            <span class="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">Delivery</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="delivery-method" value="envio" class="mr-2">
                            <span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">Envío</span>
                        </label>
                    </div>
                    
                    <!-- Campos adicionales para delivery y envío -->
                    <div id="delivery-details" class="mt-4 space-y-3 hidden">
                        <div>
                            <label for="delivery-location" class="block text-sm font-medium text-gray-700 mb-1">Ubicación de entrega</label>
                            <input type="text" id="delivery-location" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Ingrese la dirección">
                        </div>
                        <div>
                            <label for="delivery-cost" class="block text-sm font-medium text-gray-700 mb-1">Costo de entrega</label>
                            <input type="number" step="0.01" min="0" id="delivery-cost" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="0.00">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Botón de Registrar Venta -->
            <div class="text-center">
                <button type="button" id="register-sale-btn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                    Registrar Venta Completa
                </button>
            </div>
        </div>

        <!-- Ventas Recientes -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-xl font-bold mb-4">Ventas Recientes</h3>
            <div id="recent-sales-list" class="space-y-3">
                <p class="text-center text-gray-500 py-4">Cargando ventas recientes...</p>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = content;
    
    // Inicializar eventos y datos
    setupVentasEvents();
    displayRecentSales();
};

let currentSaleItems = [];
let currentSelectedProduct = null;

function setupVentasEvents() {
    // Búsqueda de productos
    document.getElementById('product-search').addEventListener('input', handleProductSearch);
    document.getElementById('product-search').addEventListener('focus', showProductSuggestions);
    
    // Agregar producto
    document.getElementById('add-product-btn').addEventListener('click', addProductToSale);
    
    // Métodos de entrega
    document.querySelectorAll('input[name="delivery-method"]').forEach(radio => {
        radio.addEventListener('change', handleDeliveryMethodChange);
    });
    
    // Costo de entrega
    document.getElementById('delivery-cost').addEventListener('input', updateSaleTotals);
    
    // Registrar venta
    document.getElementById('register-sale-btn').addEventListener('click', handleRegisterSale);
    
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#product-search') && !e.target.closest('#product-suggestions')) {
            document.getElementById('product-suggestions').classList.add('hidden');
        }
    });
}

async function handleProductSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const suggestionsDiv = document.getElementById('product-suggestions');
    
    if (query.length < 2) {
        suggestionsDiv.classList.add('hidden');
        currentSelectedProduct = null;
        clearProductFields();
        return;
    }
    
    const filteredProducts = window.productsCache.filter(product => 
        product.stock > 0 && product.name.toLowerCase().includes(query)
    );
    
    if (filteredProducts.length === 0) {
        suggestionsDiv.innerHTML = '<div class="p-3 text-gray-500">No se encontraron productos</div>';
        suggestionsDiv.classList.remove('hidden');
        return;
    }
    
    // Generar sugerencias con stock real calculado de forma asíncrona
    const productSuggestions = await Promise.all(
        filteredProducts.map(async (product) => {
            const stockReal = await calcularStockRealProducto(product.id);
            return `
                <div class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0" 
                     onclick="selectProduct('${product.id}')">
                    <div class="font-medium">${product.name}</div>
                    <div class="text-sm text-gray-600">
                        Stock en lotes: ${stockReal} 
                        ${stockReal !== product.stock ? `(Reg: ${product.stock})` : ''} 
                        | Precio: S/ ${product.price}
                    </div>
                </div>
            `;
        })
    );
    
    suggestionsDiv.innerHTML = productSuggestions.join('');
    
    suggestionsDiv.classList.remove('hidden');
}

async function showProductSuggestions() {
    const query = document.getElementById('product-search').value.toLowerCase().trim();
    if (query.length >= 2) {
        await handleProductSearch({ target: { value: query } });
    }
}

window.selectProduct = async function(productId) {
    const product = window.productsCache.find(p => p.id === productId);
    if (product) {
        currentSelectedProduct = product;
        document.getElementById('product-search').value = product.name;
        document.getElementById('product-price').value = product.price;
        
        // Calcular stock real desde lotes
        const stockReal = await calcularStockRealProducto(productId);
        document.getElementById('product-quantity').max = stockReal;
        document.getElementById('product-quantity').value = 1;
        document.getElementById('product-suggestions').classList.add('hidden');
        
        // Mostrar stock real vs stock registrado (para debug)
        if (stockReal !== product.stock) {
            console.warn(`Diferencia de stock en producto ${product.name}: Registrado=${product.stock}, Real=${stockReal}`);
        }
    }
};

function clearProductFields() {
    document.getElementById('product-price').value = '';
    document.getElementById('product-quantity').max = '';
}

async function addProductToSale() {
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const price = parseFloat(document.getElementById('product-price').value);
    
    if (!currentSelectedProduct || !quantity || !price) {
        alert('Por favor busque y seleccione un producto, y complete todos los campos.');
        return;
    }
    
    // Calcular stock real desde lotes
    const stockReal = await calcularStockRealProducto(currentSelectedProduct.id);
    if (quantity > stockReal) {
        alert(`Stock insuficiente. Disponible en lotes: ${stockReal}`);
        return;
    }
    
    const product = {
        id: currentSelectedProduct.id,
        name: currentSelectedProduct.name,
        quantity: quantity,
        price: price,
        cost: currentSelectedProduct.acquisitionCost || 0,
        category: currentSelectedProduct.category,
        stock: currentSelectedProduct.stock
    };
    
    // Verificar si el producto ya está en la lista
    const existingIndex = currentSaleItems.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) {
        const newQuantity = currentSaleItems[existingIndex].quantity + quantity;
        if (newQuantity > stockReal) {
            alert(`Stock insuficiente. Ya tiene ${currentSaleItems[existingIndex].quantity} en la venta. Máximo disponible en lotes: ${stockReal}`);
            return;
        }
        currentSaleItems[existingIndex].quantity = newQuantity;
    } else {
        currentSaleItems.push(product);
    }
    
    updateSaleItemsTable();
    clearProductForm();
}

function updateSaleItemsTable() {
    const tbody = document.getElementById('sale-items-tbody');
    
    if (currentSaleItems.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No hay productos agregados. Use el formulario de arriba para agregar productos.
                </td>
            </tr>
        `;
        updateSaleTotals();
        return;
    }
    
    tbody.innerHTML = currentSaleItems.map((item, index) => `
        <tr>
            <td class="border border-gray-300 px-4 py-2">${index + 1}</td>
            <td class="border border-gray-300 px-4 py-2">${item.name}</td>
            <td class="border border-gray-300 px-4 py-2 text-center">${item.quantity}</td>
            <td class="border border-gray-300 px-4 py-2 text-right">S/ ${item.price.toFixed(2)}</td>
            <td class="border border-gray-300 px-4 py-2 text-right">S/ ${(item.quantity * item.price).toFixed(2)}</td>
            <td class="border border-gray-300 px-4 py-2 text-center">
                <button onclick="removeSaleItem(${index})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">
                    Quitar
                </button>
            </td>
        </tr>
    `).join('');
    
    updateSaleTotals();
}

window.removeSaleItem = function(index) {
    currentSaleItems.splice(index, 1);
    updateSaleItemsTable();
};

function updateSaleTotals() {
    const subtotal = currentSaleItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const deliveryCost = parseFloat(document.getElementById('delivery-cost').value) || 0;
    const total = subtotal + deliveryCost;
    
    document.getElementById('sale-subtotal').textContent = `S/ ${subtotal.toFixed(2)}`;
    document.getElementById('display-delivery-cost').textContent = `S/ ${deliveryCost.toFixed(2)}`;
    document.getElementById('sale-total').textContent = `S/ ${total.toFixed(2)}`;
    
    // Habilitar/deshabilitar botón de registro
    const registerBtn = document.getElementById('register-sale-btn');
    registerBtn.disabled = currentSaleItems.length === 0;
}

function handleDeliveryMethodChange(event) {
    const deliveryDetails = document.getElementById('delivery-details');
    const deliveryCostRow = document.getElementById('delivery-cost-row');
    
    if (event.target.value === 'delivery' || event.target.value === 'envio') {
        deliveryDetails.classList.remove('hidden');
        deliveryCostRow.style.display = 'table-row';
    } else {
        deliveryDetails.classList.add('hidden');
        deliveryCostRow.style.display = 'none';
        document.getElementById('delivery-location').value = '';
        document.getElementById('delivery-cost').value = '';
    }
    updateSaleTotals();
}

function clearProductForm() {
    document.getElementById('product-search').value = '';
    document.getElementById('product-quantity').value = 1;
    document.getElementById('product-price').value = '';
    document.getElementById('product-suggestions').classList.add('hidden');
    currentSelectedProduct = null;
}

async function handleRegisterSale() {
    if (currentSaleItems.length === 0) {
        alert('Debe agregar al menos un producto a la venta.');
        return;
    }
    
    const customerName = document.getElementById('customer-name').value.trim();
    if (!customerName) {
        alert('Por favor ingrese el nombre del cliente.');
        return;
    }
    
    const deliveryMethod = document.querySelector('input[name="delivery-method"]:checked').value;
    if ((deliveryMethod === 'delivery' || deliveryMethod === 'envio')) {
        const deliveryLocation = document.getElementById('delivery-location').value.trim();
        if (!deliveryLocation) {
            alert('Por favor ingrese la ubicación de entrega.');
            return;
        }
    }
    
    const registerBtn = document.getElementById('register-sale-btn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registrando...';
    
    try {
        const customerPhone = document.getElementById('customer-phone').value.trim();
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
        const deliveryLocation = document.getElementById('delivery-location').value.trim();
        const deliveryCost = parseFloat(document.getElementById('delivery-cost').value) || 0;
        
        // Calcular totales
        const subtotalSale = currentSaleItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        const totalSale = subtotalSale + deliveryCost;
        const totalCostEstimado = currentSaleItems.reduce((sum, item) => sum + (item.quantity * item.cost), 0);
        
        // Crear la venta (se actualizará con costos reales después del procesamiento de lotes)
        const saleData = {
            customerName,
            customerPhone,
            paymentMethod,
            deliveryMethod,
            deliveryLocation: deliveryLocation || null,
            deliveryCost,
            items: currentSaleItems,
            subtotalSale,
            totalSale,
            totalCost: totalCostEstimado, // Se actualizará con costos reales
            profit: totalSale - totalCostEstimado, // Se actualizará con ganancia real
            timestamp: window.serverTimestamp(),
            date: new Date().toISOString().split('T')[0],
            soldBy: window.currentUser.email,
            lotesInfo: [] // Se añadirá información de lotes procesados
        };
        
        // Registrar en Firestore
        const docRef = await window.addDoc(window.collection(window.db, "sales"), saleData);
        console.log('Venta creada con ID:', docRef.id);
        
        // Procesar venta usando sistema de lotes FIFO
        const resultadosLotes = [];
        let costoRealTotal = 0;
        
        for (const item of currentSaleItems) {
            try {
                console.log(`Procesando producto ${item.name} (${item.id}) - Cantidad: ${item.quantity}`);
                
                const resultado = await procesarVentaConLotes(
                    item.id, 
                    item.quantity, 
                    docRef.id, 
                    customerName
                );
                
                resultadosLotes.push({
                    productId: item.id,
                    productName: item.name,
                    ...resultado
                });
                
                costoRealTotal += resultado.costoTotal;
                
                console.log(`Producto ${item.name} procesado exitosamente:`, resultado);
                
            } catch (error) {
                console.error(`Error procesando producto ${item.name}:`, error);
                throw new Error(`Error procesando ${item.name}: ${error.message}`);
            }
        }
        
        // Actualizar la venta con costos reales y información de lotes
        const gananciReal = totalSale - costoRealTotal;
        await docRef.update({
            totalCost: costoRealTotal,
            profit: gananciReal,
            lotesInfo: resultadosLotes.map(r => ({
                productId: r.productId,
                productName: r.productName,
                lotesAfectados: r.lotesAfectados.length,
                costoTotal: r.costoTotal,
                costoUnitarioPromedio: r.costoUnitarioPromedio
            }))
        });
        
        console.log('Venta actualizada con costos reales:', {
            costoEstimado: totalCostEstimado,
            costoReal: costoRealTotal,
            gananciReal: gananciReal,
            diferencia: costoRealTotal - totalCostEstimado
        });
        
        // Registrar entrada en caja automáticamente
        if (window.registrarMovimientoCaja) {
            await window.registrarMovimientoCaja(
                'entrada',
                totalSale,
                'ventas',
                `Venta a ${customerName} - ${currentSaleItems.length} productos`,
                'venta',
                docRef.id
            );
        } else {
            // Fallback: registrar movimiento de caja manualmente
            try {
                await window.db.collection('movimientos_caja').add({
                    tipo: 'entrada',
                    monto: totalSale,
                    categoria: 'ventas',
                    descripcion: `Venta a ${customerName} - ${currentSaleItems.length} productos`,
                    fecha: new Date().toISOString().split('T')[0],
                    timestamp: window.serverTimestamp(),
                    usuario: window.currentUser.email,
                    relatedTo: 'venta',
                    relatedId: docRef.id
                });
            } catch (error) {
                console.error('Error registrando movimiento de caja:', error);
            }
        }
        
        // Mensaje de éxito detallado
        const totalLotesAfectados = resultadosLotes.reduce((sum, r) => sum + r.lotesAfectados.length, 0);
        const totalMovimientos = resultadosLotes.reduce((sum, r) => sum + r.movimientos, 0);
        
        alert(`¡Venta registrada exitosamente con sistema de lotes FIFO!\n\n` +
              `📦 ${totalLotesAfectados} lotes procesados\n` +
              `📋 ${totalMovimientos} movimientos de inventario registrados\n` +
              `💰 Costo real: S/ ${costoRealTotal.toFixed(2)}\n` +
              `📈 Ganancia real: S/ ${gananciReal.toFixed(2)}\n` +
              `💳 Movimiento de caja registrado`);
        
        // Limpiar formulario
        clearSaleForm();
        
        // Recargar datos
        await window.loadProducts();
        await window.loadSales();
        displayRecentSales();
        
    } catch (error) {
        console.error("Error registrando venta:", error);
        
        // Mensaje de error más específico
        let errorMessage = 'Error al registrar la venta: ';
        if (error.message.includes('insufficient permissions') || error.message.includes('Missing or insufficient permissions')) {
            errorMessage += 'Permisos insuficientes. La venta se registró pero puede haber problemas con el stock. Contacta al administrador.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Registrar Venta Completa';
    }
}

function clearSaleForm() {
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-phone').value = '';
    document.querySelector('input[name="payment-method"]:checked').checked = false;
    document.querySelector('input[value="yape"]').checked = true;
    document.querySelector('input[name="delivery-method"]:checked').checked = false;
    document.querySelector('input[value="oficina"]').checked = true;
    document.getElementById('delivery-location').value = '';
    document.getElementById('delivery-cost').value = '';
    document.getElementById('delivery-details').classList.add('hidden');
    document.getElementById('delivery-cost-row').style.display = 'none';
    currentSaleItems = [];
    updateSaleItemsTable();
    clearProductForm();
}

function displayRecentSales() {
    const container = document.getElementById('recent-sales-list');
    if (!container || !window.allSales) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay datos de ventas disponibles</p>';
        return;
    }
    
    const recentSales = window.allSales.slice(0, 10); // Últimas 10 ventas
    
    if (recentSales.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay ventas registradas</p>';
        return;
    }
    
    container.innerHTML = recentSales.map(sale => {
        let saleDate;
        if (sale.timestamp && sale.timestamp.toDate) {
            saleDate = sale.timestamp.toDate();
        } else if (sale.timestamp) {
            saleDate = new Date(sale.timestamp);
        } else if (sale.date) {
            saleDate = new Date(sale.date);
        } else {
            saleDate = new Date();
        }
        
        let productsDisplay = '';
        if (sale.items && Array.isArray(sale.items)) {
            productsDisplay = sale.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');
        } else if (sale.productName) {
            productsDisplay = `${sale.productName} (${sale.quantitySold || 1}x)`;
        } else {
            productsDisplay = 'Productos no especificados';
        }
        
        return `
            <div class="bg-gray-50 border rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="font-semibold text-gray-900">${sale.customerName || 'Cliente no especificado'}</p>
                        <p class="text-sm text-gray-600">${sale.customerPhone || 'Sin teléfono'}</p>
                        ${sale.deliveryLocation ? `<p class="text-sm text-gray-600">📍 ${sale.deliveryLocation}</p>` : ''}
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-green-600">S/ ${(sale.totalSale || 0).toFixed(2)}</p>
                        <p class="text-sm text-gray-500">${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                
                <div class="text-sm text-gray-600 mb-2">
                    <strong>Productos:</strong> ${productsDisplay}
                </div>
                
                <div class="flex justify-between items-center">
                    <div class="flex space-x-2">
                        ${sale.paymentMethod ? `<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">${sale.paymentMethod}</span>` : ''}
                        ${sale.deliveryMethod ? `<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">${sale.deliveryMethod}</span>` : ''}
                    </div>
                    <div class="text-xs text-gray-500">
                        Por: ${sale.soldBy || 'No especificado'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================================================
// FUNCIONES DE APOYO PARA SISTEMA DE LOTES FIFO
// ========================================================================

/**
 * Calcula el stock real de un producto sumando todos sus lotes activos
 * @param {string} productId - ID del producto
 * @returns {Promise<number>} - Stock real calculado desde lotes
 */
async function calcularStockRealProducto(productId) {
    try {
        const lotesSnapshot = await window.db.collection('stock_por_lote')
            .where('productoId', '==', productId)
            .where('cantidad', '>', 0)
            .get();
        
        let stockReal = 0;
        lotesSnapshot.forEach(doc => {
            const lote = doc.data();
            stockReal += lote.cantidad || 0;
        });
        
        console.log(`Stock real calculado para producto ${productId}: ${stockReal}`);
        return stockReal;
    } catch (error) {
        console.error('Error calculando stock real:', error);
        return 0;
    }
}

/**
 * Obtiene todos los lotes disponibles de un producto ordenados por FIFO (más antiguos primero)
 * @param {string} productId - ID del producto
 * @returns {Promise<Array>} - Array de lotes ordenados por fecha de ingreso
 */
async function obtenerLotesDisponibles(productId) {
    try {
        const lotesSnapshot = await window.db.collection('stock_por_lote')
            .where('productoId', '==', productId)
            .where('cantidad', '>', 0)
            .orderBy('fechaIngreso', 'asc') // FIFO: más antiguos primero
            .get();
        
        const lotes = [];
        lotesSnapshot.forEach(doc => {
            lotes.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Lotes disponibles para producto ${productId}:`, lotes.length);
        return lotes;
    } catch (error) {
        console.error('Error obteniendo lotes disponibles:', error);
        return [];
    }
}

/**
 * Procesa una venta consumiendo lotes usando metodología FIFO
 * @param {string} productId - ID del producto
 * @param {number} cantidadVendida - Cantidad a vender
 * @param {string} ventaId - ID de la venta
 * @param {string} customerName - Nombre del cliente
 * @returns {Promise<Object>} - Resultado del procesamiento con lotes afectados y costos
 */
async function procesarVentaConLotes(productId, cantidadVendida, ventaId, customerName) {
    try {
        const lotesDisponibles = await obtenerLotesDisponibles(productId);
        
        // Verificar si hay suficiente stock
        const stockTotal = lotesDisponibles.reduce((sum, lote) => sum + lote.cantidad, 0);
        if (stockTotal < cantidadVendida) {
            throw new Error(`Stock insuficiente. Disponible: ${stockTotal}, Solicitado: ${cantidadVendida}`);
        }
        
        const lotesAfectados = [];
        const movimientos = [];
        let cantidadPendiente = cantidadVendida;
        let costoTotal = 0;
        
        // Procesar lotes usando FIFO
        for (const lote of lotesDisponibles) {
            if (cantidadPendiente <= 0) break;
            
            const cantidadTomada = Math.min(cantidadPendiente, lote.cantidad);
            const nuevaCantidad = lote.cantidad - cantidadTomada;
            const costoLote = cantidadTomada * (lote.costoUnitario || 0);
            
            // Actualizar lote en Firestore
            const loteRef = window.db.collection('stock_por_lote').doc(lote.id);
            await loteRef.update({
                cantidad: nuevaCantidad
            });
            
            // Registrar lote afectado
            lotesAfectados.push({
                loteId: lote.loteId,
                docId: lote.id,
                cantidadTomada,
                cantidadRestante: nuevaCantidad,
                costoUnitario: lote.costoUnitario || 0,
                costoTotal: costoLote,
                fechaVencimiento: lote.fechaVencimiento
            });
            
            // Preparar movimiento de inventario
            movimientos.push({
                fecha: new Date().toISOString().split('T')[0],
                timestamp: window.serverTimestamp(),
                productoId: productId,
                productoNombre: lote.productoNombre || '',
                loteId: lote.loteId,
                cantidad: cantidadTomada,
                tipo: 'salida',
                subtipo: 'venta',
                ventaId: ventaId,
                costoUnitario: lote.costoUnitario || 0,
                costoTotal: costoLote,
                usuario: window.currentUser?.email || '',
                observaciones: `Venta a ${customerName} - ${ventaId}`
            });
            
            cantidadPendiente -= cantidadTomada;
            costoTotal += costoLote;
        }
        
        // Registrar todos los movimientos de inventario
        for (const movimiento of movimientos) {
            await window.db.collection('movimientos_inventario').add(movimiento);
        }
        
        // Actualizar stock del producto con el stock real calculado
        const stockRealActualizado = await calcularStockRealProducto(productId);
        const productRef = window.db.collection('products').doc(productId);
        await productRef.update({
            stock: stockRealActualizado
        });
        
        console.log(`Venta procesada con lotes FIFO para producto ${productId}:`, {
            cantidadVendida,
            lotesAfectados: lotesAfectados.length,
            costoTotal,
            stockRestante: stockRealActualizado
        });
        
        return {
            success: true,
            cantidadVendida,
            lotesAfectados,
            costoTotal,
            costoUnitarioPromedio: costoTotal / cantidadVendida,
            stockRestante: stockRealActualizado,
            movimientos: movimientos.length
        };
        
    } catch (error) {
        console.error('Error procesando venta con lotes:', error);
        throw error;
    }
}

console.log('admin-ventas.js cargado completamente');