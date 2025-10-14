import {
    processSale,
    calcularStockRealProducto,
    ensureProductsCache,
    fetchAllSales,
} from './data.js';

let currentSaleItems = [];
let currentSelectedProduct = null;
let documentClickListenerAttached = false;

export async function renderVentasUI({ recentSales } = {}) {
    const contentArea = document.getElementById('content-area');

    if (!contentArea) {
        console.error('No se encontró el contenedor principal para renderizar la vista de ventas.');
        return;
    }

    contentArea.innerHTML = `
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
                                <td class="border border-gray-300 px-4 py-3"></td>
                            </tr>
                            <tr class="bg-gray-100" id="delivery-cost-row" style="display: none;">
                                <td colspan="4" class="border border-gray-300 px-4 py-3 text-right">ENTREGA:</td>
                                <td class="border border-gray-300 px-4 py-3 text-right" id="display-delivery-cost">S/ 0.00</td>
                                <td class="border border-gray-300 px-4 py-3"></td>
                            </tr>
                            <tr class="bg-gray-200 font-bold text-lg">
                                <td colspan="4" class="border border-gray-300 px-4 py-3 text-right">TOTAL:</td>
                                <td class="border border-gray-300 px-4 py-3 text-right" id="sale-total">S/ 0.00</td>
                                <td class="border border-gray-300 px-4 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <!-- Métodos de Pago y Entrega -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold mb-3">Método de Pago</h4>
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
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold mb-3">Método de Entrega</h4>
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
                            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">Envío</span>
                        </label>
                    </div>
                    <div id="delivery-details" class="mt-4 hidden">
                        <h5 class="text-sm font-medium text-gray-700 mb-2">Detalles de entrega</h5>
                        <div class="space-y-3">
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

    currentSaleItems = [];
    currentSelectedProduct = null;

    setupVentasEvents();
    updateSaleItemsTable();

    if (!Array.isArray(window.productsCache) || window.productsCache.length === 0) {
        try {
            await ensureProductsCache();
        } catch (error) {
            console.error('Error asegurando la caché de productos para ventas:', error);
        }
    }

    let salesToDisplay = Array.isArray(recentSales) && recentSales.length > 0 ? recentSales : [];
    if (salesToDisplay.length === 0) {
        salesToDisplay = Array.isArray(window.allSales) ? window.allSales : [];
    }
    if (salesToDisplay.length === 0) {
        try {
            salesToDisplay = await fetchAllSales();
        } catch (error) {
            console.error('Error cargando las ventas para la vista de ventas:', error);
        }
    }

    displayRecentSales(salesToDisplay);
    updateSaleTotals();
}

function setupVentasEvents() {
    const productSearch = document.getElementById('product-search');
    const productSuggestions = document.getElementById('product-suggestions');
    const saleItemsTbody = document.getElementById('sale-items-tbody');

    if (productSearch) {
        productSearch.addEventListener('input', handleProductSearch);
        productSearch.addEventListener('focus', showProductSuggestions);
    }

    if (productSuggestions) {
        productSuggestions.addEventListener('click', handleSuggestionClick);
    }

    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', addProductToSale);
    }

    document
        .querySelectorAll('input[name="delivery-method"]')
        .forEach((radio) => radio.addEventListener('change', handleDeliveryMethodChange));

    const deliveryCostInput = document.getElementById('delivery-cost');
    if (deliveryCostInput) {
        deliveryCostInput.addEventListener('input', updateSaleTotals);
    }

    const registerSaleBtn = document.getElementById('register-sale-btn');
    if (registerSaleBtn) {
        registerSaleBtn.addEventListener('click', handleRegisterSale);
    }

    if (saleItemsTbody) {
        saleItemsTbody.addEventListener('click', (event) => {
            const removeBtn = event.target.closest('[data-action="remove-item"]');
            if (removeBtn) {
                const index = parseInt(removeBtn.dataset.index, 10);
                if (!Number.isNaN(index)) {
                    removeSaleItem(index);
                }
            }
        });
    }

    if (!documentClickListenerAttached) {
        document.addEventListener('click', handleDocumentClickForSuggestions);
        documentClickListenerAttached = true;
    }
}

async function handleProductSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    const suggestionsDiv = document.getElementById('product-suggestions');

    if (!suggestionsDiv) {
        return;
    }

    if (query.length < 2) {
        suggestionsDiv.classList.add('hidden');
        currentSelectedProduct = null;
        clearProductFields();
        return;
    }

    const products = await ensureProductsCache();
    const filteredProducts = products.filter(
        (product) => (product.stock || 0) > 0 && product.name.toLowerCase().includes(query)
    );

    if (filteredProducts.length === 0) {
        suggestionsDiv.innerHTML = '<div class="p-3 text-gray-500">No se encontraron productos</div>';
        suggestionsDiv.classList.remove('hidden');
        return;
    }

    const productSuggestions = await Promise.all(
        filteredProducts.map(async (product) => {
            const stockReal = await calcularStockRealProducto(product.id);
            const stockMessage = stockReal !== product.stock ? ` (Reg: ${product.stock ?? 0})` : '';
            return `
                <div class="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-200 last:border-b-0"
                    data-product-id="${product.id}">
                    <div class="font-medium">${product.name}</div>
                    <div class="text-sm text-gray-600">
                        Stock en lotes: ${stockReal}${stockMessage} | Precio: S/ ${product.price}
                    </div>
                </div>
            `;
        })
    );

    suggestionsDiv.innerHTML = productSuggestions.join('');
    suggestionsDiv.classList.remove('hidden');
}

async function showProductSuggestions() {
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        const query = productSearch.value.toLowerCase().trim();
        if (query.length >= 2) {
            await handleProductSearch({ target: productSearch });
        }
    }
}

async function selectProduct(productId) {
    const products = await ensureProductsCache();
    const product = products.find((p) => p.id === productId);

    if (!product) {
        return;
    }

    currentSelectedProduct = product;

    const searchInput = document.getElementById('product-search');
    const priceInput = document.getElementById('product-price');
    const quantityInput = document.getElementById('product-quantity');
    const suggestionsDiv = document.getElementById('product-suggestions');

    if (searchInput) {
        searchInput.value = product.name;
    }
    if (priceInput) {
        priceInput.value = product.price;
    }

    if (quantityInput) {
        const stockReal = await calcularStockRealProducto(productId);
        quantityInput.max = stockReal;
        quantityInput.value = 1;

        if (stockReal !== product.stock) {
            console.warn(
                `Diferencia de stock en producto ${product.name}: Registrado=${product.stock}, Real=${stockReal}`
            );
        }
    }

    if (suggestionsDiv) {
        suggestionsDiv.classList.add('hidden');
    }
}

function clearProductFields() {
    const priceInput = document.getElementById('product-price');
    const quantityInput = document.getElementById('product-quantity');

    if (priceInput) {
        priceInput.value = '';
    }
    if (quantityInput) {
        quantityInput.max = '';
    }
}

async function addProductToSale() {
    const quantityInput = document.getElementById('product-quantity');
    const priceInput = document.getElementById('product-price');

    if (!quantityInput || !priceInput) {
        return;
    }

    const quantity = parseInt(quantityInput.value, 10);
    const price = parseFloat(priceInput.value);

    if (!currentSelectedProduct || !quantity || !price) {
        alert('Por favor busque y seleccione un producto, y complete todos los campos.');
        return;
    }

    const stockReal = await calcularStockRealProducto(currentSelectedProduct.id);
    if (quantity > stockReal) {
        alert(`Stock insuficiente. Disponible en lotes: ${stockReal}`);
        return;
    }

    const product = {
        id: currentSelectedProduct.id,
        name: currentSelectedProduct.name,
        quantity,
        price,
        cost: currentSelectedProduct.acquisitionCost || 0,
        category: currentSelectedProduct.category,
        stock: currentSelectedProduct.stock,
    };

    const existingIndex = currentSaleItems.findIndex((item) => item.id === product.id);
    if (existingIndex >= 0) {
        const newQuantity = currentSaleItems[existingIndex].quantity + quantity;
        if (newQuantity > stockReal) {
            alert(
                `Stock insuficiente. Ya tiene ${currentSaleItems[existingIndex].quantity} en la venta. Máximo disponible en lotes: ${stockReal}`
            );
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

    if (!tbody) {
        return;
    }

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

    const rows = currentSaleItems
        .map(
            (item, index) => `
            <tr>
                <td class="border border-gray-300 px-4 py-2">${index + 1}</td>
                <td class="border border-gray-300 px-4 py-2">${item.name}</td>
                <td class="border border-gray-300 px-4 py-2 text-center">${item.quantity}</td>
                <td class="border border-gray-300 px-4 py-2 text-right">S/ ${item.price.toFixed(2)}</td>
                <td class="border border-gray-300 px-4 py-2 text-right">S/ ${(item.quantity * item.price).toFixed(
                    2
                )}</td>
                <td class="border border-gray-300 px-4 py-2 text-center">
                    <button type="button" data-action="remove-item" data-index="${index}" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm">
                        Quitar
                    </button>
                </td>
            </tr>
        `
        )
        .join('');

    tbody.innerHTML = rows;
    updateSaleTotals();
}

function removeSaleItem(index) {
    currentSaleItems.splice(index, 1);
    updateSaleItemsTable();
}

function updateSaleTotals() {
    const subtotal = currentSaleItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const deliveryCostInput = document.getElementById('delivery-cost');
    const deliveryCost = deliveryCostInput ? parseFloat(deliveryCostInput.value) || 0 : 0;
    const total = subtotal + deliveryCost;

    const subtotalElement = document.getElementById('sale-subtotal');
    const deliveryCostElement = document.getElementById('display-delivery-cost');
    const totalElement = document.getElementById('sale-total');
    const registerBtn = document.getElementById('register-sale-btn');

    if (subtotalElement) {
        subtotalElement.textContent = `S/ ${subtotal.toFixed(2)}`;
    }
    if (deliveryCostElement) {
        deliveryCostElement.textContent = `S/ ${deliveryCost.toFixed(2)}`;
    }
    if (totalElement) {
        totalElement.textContent = `S/ ${total.toFixed(2)}`;
    }
    if (registerBtn) {
        registerBtn.disabled = currentSaleItems.length === 0;
    }
}

function handleDeliveryMethodChange(event) {
    const deliveryDetails = document.getElementById('delivery-details');
    const deliveryCostRow = document.getElementById('delivery-cost-row');

    if (event.target.value === 'delivery' || event.target.value === 'envio') {
        deliveryDetails?.classList.remove('hidden');
        if (deliveryCostRow) {
            deliveryCostRow.style.display = 'table-row';
        }
    } else {
        deliveryDetails?.classList.add('hidden');
        if (deliveryCostRow) {
            deliveryCostRow.style.display = 'none';
        }
        const locationInput = document.getElementById('delivery-location');
        const costInput = document.getElementById('delivery-cost');
        if (locationInput) {
            locationInput.value = '';
        }
        if (costInput) {
            costInput.value = '';
        }
    }
    updateSaleTotals();
}

function clearProductForm() {
    const searchInput = document.getElementById('product-search');
    const quantityInput = document.getElementById('product-quantity');
    const priceInput = document.getElementById('product-price');
    const suggestionsDiv = document.getElementById('product-suggestions');

    if (searchInput) {
        searchInput.value = '';
    }
    if (quantityInput) {
        quantityInput.value = 1;
    }
    if (priceInput) {
        priceInput.value = '';
    }
    if (suggestionsDiv) {
        suggestionsDiv.classList.add('hidden');
    }
    currentSelectedProduct = null;
}

async function handleRegisterSale() {
    if (currentSaleItems.length === 0) {
        alert('Debe agregar al menos un producto a la venta.');
        return;
    }

    const customerNameInput = document.getElementById('customer-name');
    if (!customerNameInput) {
        return;
    }

    const customerName = customerNameInput.value.trim();
    if (!customerName) {
        alert('Por favor ingrese el nombre del cliente.');
        return;
    }

    const deliveryMethodInput = document.querySelector('input[name="delivery-method"]:checked');
    if (!deliveryMethodInput) {
        alert('Seleccione un método de entrega.');
        return;
    }

    if (deliveryMethodInput.value === 'delivery' || deliveryMethodInput.value === 'envio') {
        const deliveryLocationInput = document.getElementById('delivery-location');
        if (!deliveryLocationInput || !deliveryLocationInput.value.trim()) {
            alert('Por favor ingrese la ubicación de entrega.');
            return;
        }
    }

    const registerBtn = document.getElementById('register-sale-btn');
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Registrando...';
    }

    try {
        const customerPhone = document.getElementById('customer-phone')?.value.trim() || '';
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'yape';
        const deliveryLocation = document.getElementById('delivery-location')?.value.trim() || '';
        const deliveryCost = parseFloat(document.getElementById('delivery-cost')?.value || '0') || 0;

        const result = await processSale({
            customerName,
            customerPhone,
            paymentMethod,
            deliveryMethod: deliveryMethodInput.value,
            deliveryLocation,
            deliveryCost,
            items: currentSaleItems.map((item) => ({ ...item })),
        });

        result.stockUpdates.forEach(({ productId, stockRestante }) => {
            const cache = window.productsCache;
            if (Array.isArray(cache)) {
                const index = cache.findIndex((product) => product.id === productId);
                if (index !== -1) {
                    cache[index].stock = stockRestante;
                }
            }
        });

        const sales = await fetchAllSales();
        displayRecentSales(sales);

        if (typeof window.displayProducts === 'function') {
            window.displayProducts();
        }

        alert(
            `Venta registrada exitosamente.\n\n` +
                `Lotes procesados: ${result.totalLotesAfectados}\n` +
                `Movimientos de inventario: ${result.totalMovimientos}\n` +
                `Costo real: S/ ${result.totalCostReal.toFixed(2)}\n` +
                `Ganancia real: S/ ${result.profit.toFixed(2)}\n` +
                `Movimiento de caja registrado`
        );

        clearSaleForm();
    } catch (error) {
        console.error('Error registrando venta:', error);

        let errorMessage = 'Error al registrar la venta: ';
        if (
            error.message.includes('insufficient permissions') ||
            error.message.includes('Missing or insufficient permissions')
        ) {
            errorMessage +=
                'Permisos insuficientes. La venta se registró pero puede haber problemas con el stock. Contacta al administrador.';
        } else {
            errorMessage += error.message;
        }

        alert(errorMessage);
    } finally {
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Registrar Venta Completa';
        }
    }
}

function clearSaleForm() {
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');

    customerNameInput && (customerNameInput.value = '');
    customerPhoneInput && (customerPhoneInput.value = '');

    const paymentChecked = document.querySelector('input[name="payment-method"]:checked');
    if (paymentChecked) {
        paymentChecked.checked = false;
    }
    const defaultPayment = document.querySelector('input[name="payment-method"][value="yape"]');
    if (defaultPayment) {
        defaultPayment.checked = true;
    }

    const deliveryChecked = document.querySelector('input[name="delivery-method"]:checked');
    if (deliveryChecked) {
        deliveryChecked.checked = false;
    }
    const defaultDelivery = document.querySelector('input[name="delivery-method"][value="oficina"]');
    if (defaultDelivery) {
        defaultDelivery.checked = true;
    }

    const deliveryLocationInput = document.getElementById('delivery-location');
    const deliveryCostInput = document.getElementById('delivery-cost');
    const deliveryDetails = document.getElementById('delivery-details');
    const deliveryCostRow = document.getElementById('delivery-cost-row');

    deliveryLocationInput && (deliveryLocationInput.value = '');
    deliveryCostInput && (deliveryCostInput.value = '');
    deliveryDetails?.classList.add('hidden');
    if (deliveryCostRow) {
        deliveryCostRow.style.display = 'none';
    }

    currentSaleItems = [];
    updateSaleItemsTable();
    clearProductForm();
}

function displayRecentSales(sales = []) {
    const container = document.getElementById('recent-sales-list');
    if (!container) {
        return;
    }

    const recentSales = Array.isArray(sales) && sales.length > 0 ? sales.slice(0, 10) : [];

    if (recentSales.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-4">No hay ventas registradas</p>';
        return;
    }

    container.innerHTML = recentSales
        .map((sale) => {
            let saleDate;
            if (sale.timestamp?.toDate) {
                saleDate = sale.timestamp.toDate();
            } else if (sale.timestamp) {
                saleDate = new Date(sale.timestamp);
            } else if (sale.date) {
                saleDate = new Date(sale.date);
            } else {
                saleDate = new Date();
            }

            let productsDisplay = '';
            if (Array.isArray(sale.items)) {
                productsDisplay = sale.items.map((item) => `${item.name} (${item.quantity}x)`).join(', ');
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
                            ${
                                sale.deliveryLocation
                                    ? `<p class="text-sm text-gray-600">Entrega: ${sale.deliveryLocation}</p>`
                                    : ''
                            }
                        </div>
                        <div class="text-right">
                            <p class="font-bold text-green-600">S/ ${(sale.totalSale || 0).toFixed(2)}</p>
                            <p class="text-sm text-gray-500">
                                ${saleDate.toLocaleDateString('es-PE')} ${saleDate.toLocaleTimeString('es-PE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                    
                    <div class="text-sm text-gray-600 mb-2">
                        <strong>Productos:</strong> ${productsDisplay}
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <div class="flex space-x-2">
                            ${
                                sale.paymentMethod
                                    ? `<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">${sale.paymentMethod}</span>`
                                    : ''
                            }
                            ${
                                sale.deliveryMethod
                                    ? `<span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">${sale.deliveryMethod}</span>`
                                    : ''
                            }
                        </div>
                        <div class="text-xs text-gray-500">
                            Por: ${sale.soldBy || 'No especificado'}
                        </div>
                    </div>
                </div>
            `;
        })
        .join('');
}

function handleDocumentClickForSuggestions(event) {
    const suggestionsElement = document.getElementById('product-suggestions');
    if (
        suggestionsElement &&
        !event.target.closest('#product-search') &&
        !event.target.closest('#product-suggestions')
    ) {
        suggestionsElement.classList.add('hidden');
    }
}

function handleSuggestionClick(event) {
    const suggestion = event.target.closest('[data-product-id]');
    if (suggestion) {
        const productId = suggestion.dataset.productId;
        if (productId) {
            selectProduct(productId);
        }
    }
}
