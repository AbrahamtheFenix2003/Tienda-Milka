// admin-productos.js - Funciones para la sección Productos
console.log('Cargando admin-productos.js...');

window.loadProductos = function() {
    console.log('Ejecutando loadProductos...');
    
    // Verificar permisos
    if (!window.currentUser || !window.hasAccessToSales(window.currentUser.email)) {
        document.getElementById('content-area').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 text-lg">No tienes permisos para gestionar productos</p>
            </div>
        `;
        return;
    }

    const isVendedor = window.isVendedor && window.isVendedor(window.currentUser.email);
    
    const content = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-gray-800">Gestión de Productos</h2>
                ${!isVendedor ? `
                <button id="add-product-btn" class="bg-rose-500 text-white px-4 py-2 rounded-md hover:bg-rose-600">
                    <i class="fas fa-plus mr-2"></i>Agregar Producto
                </button>
                ` : ''}
            </div>

            <!-- Lista de productos -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6">
                    <h3 class="text-lg font-semibold mb-4">Productos Registrados</h3>
                    <div id="products-list">
                        <div class="text-center py-8">
                            <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500">Cargando productos...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('content-area').innerHTML = content;
    
    // Cargar y mostrar productos
    displayProducts();
    
    // Configurar eventos
    if (!isVendedor) {
        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', showAddProductModal);
        }
    }
};

function displayProducts() {
    const productsList = document.getElementById('products-list');
    
    if (!window.productsCache || window.productsCache.length === 0) {
        productsList.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-box-open text-4xl text-gray-400 mb-4"></i>
                <p class="text-gray-500">No hay productos registrados</p>
            </div>
        `;
        return;
    }

    const productsHTML = window.productsCache.map(product => `
        <div class="border rounded-lg p-4 mb-4">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <h4 class="font-semibold text-lg">${product.name}</h4>
                    <p class="text-gray-600 text-sm">${product.description || 'Sin descripción'}</p>
                    <div class="mt-2 flex flex-wrap gap-2">
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                            Stock: ${product.stock || 0}
                        </span>
                        <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                            S/ ${product.price || '0.00'}
                        </span>
                        ${product.category ? `
                        <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                            ${product.category}
                        </span>
                        ` : ''}
                    </div>
                </div>
                ${product.imageUrl ? `
                <div class="ml-4">
                    <img src="${product.imageUrl}" alt="${product.name}" class="w-16 h-16 object-cover rounded">
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');

    productsList.innerHTML = productsHTML;
}

function showAddProductModal() {
    // Implementar modal para agregar producto
    alert('Función de agregar producto - Por implementar');
}

console.log('admin-productos.js cargado completamente');
