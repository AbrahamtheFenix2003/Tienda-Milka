// admin-stock-inicial.js - Gestión de actualización de stock inicial

let auth, db;
let allProducts = [];
let filteredProducts = [];
let modifiedProducts = {};
let categories = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('Iniciando aplicación de stock inicial...');
    initializeApp();
});

// Inicializar aplicación
async function initializeApp() {
    try {
        // Mostrar que está cargando
        document.body.style.opacity = '0.5';
        
        // Inicializar Firebase
        await initializeFirebase();
        
        // Verificar permisos (solo admins y super vendedores pueden ver actualización de stock inicial)
        const isVendedor = window.isVendedor && window.isVendedor(window.currentUser?.email);
        
        if (isVendedor) {
            alert('No tienes permisos para acceder a esta sección');
            window.location.href = '/admin-layout.html';
            return;
        }
        
        // Configurar eventos
        setupEventListeners();
        
        // Cargar datos
        await loadData();
        
        // Mostrar aplicación
        document.body.style.opacity = '1';
        
    } catch (error) {
        console.error('Error al inicializar:', error);
        showError('Error al cargar la aplicación: ' + error.message);
    }
}

// Inicializar Firebase
function initializeFirebase() {
    return new Promise(async (resolve, reject) => {
        try {
            // Configuración Firebase (reemplazar con tu configuración)
            const firebaseConfig = {
                // Intentar obtener la configuración desde el hosting
                apiKey: "AIzaSyDqJ9YJWHVnP4HZI2rGQHt9s8N-p0_BF_s",
                authDomain: "milka-store.firebaseapp.com",
                projectId: "milka-store",
                storageBucket: "milka-store.appspot.com",
                messagingSenderId: "123456789",
                appId: "1:123456789:web:abc123def456"
            };
            
            // Intentar obtener configuración automática
            try {
                const response = await fetch('/__/firebase/init.json');
                if (response.ok) {
                    const config = await response.json();
                    firebase.initializeApp(config);
                } else {
                    throw new Error('Config not found');
                }
            } catch (configError) {
                console.log('Usando configuración por defecto');
                firebase.initializeApp(firebaseConfig);
            }
            
            auth = firebase.auth();
            db = firebase.firestore();
            
            // Verificar autenticación
            auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('Usuario autenticado:', user.email);
                    document.getElementById('user-email').textContent = user.email;
                    resolve(user);
                } else {
                    console.log('Usuario no autenticado, redirigiendo...');
                    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
                }
            });
            
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
            reject(error);
        }
    });
}

// Cargar datos
async function loadData() {
    try {
        showLoading();
        
        // Cargar categorías
        await loadCategories();
        
        // Cargar productos
        await loadProducts();
        
        hideLoading();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showError('Error al cargar los datos: ' + error.message);
    }
}

// Cargar categorías
async function loadCategories() {
    try {
        console.log('Cargando categorías...');
        const querySnapshot = await db.collection("categories").get();
        categories = [];
        
        querySnapshot.forEach((doc) => {
            categories.push({ id: doc.id, ...doc.data() });
        });
        
        categories.sort((a, b) => a.name.localeCompare(b.name));
        populateCategoryFilter();
        
        console.log('Categorías cargadas:', categories.length);
        
    } catch (error) {
        console.error("Error cargando categorías:", error);
        categories = [];
    }
}

// Poblar filtro de categorías
function populateCategoryFilter() {
    const select = document.getElementById('filter-category');
    if (!select) {
        console.error('No se encontró el elemento filter-category');
        return;
    }
    
    // Limpiar opciones existentes excepto la primera
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
    
    // Asegurar que "Todas las categorías" esté seleccionada
    select.value = '';
}

// Cargar productos
async function loadProducts() {
    try {
        console.log('Cargando productos...');
        const querySnapshot = await db.collection("products").get();
        allProducts = [];
        
        querySnapshot.forEach((doc) => {
            const productData = doc.data();
            allProducts.push({ 
                id: doc.id, 
                ...productData,
                hasInitialStock: productData.stockInicial !== undefined && productData.stockInicial !== null
            });
        });
        
        // Ordenar productos alfabéticamente
        allProducts.sort((a, b) => a.name.localeCompare(b.name));
        
        filteredProducts = [...allProducts];
        updateStatistics();
        renderProducts();
        
        console.log('Productos cargados:', allProducts.length);
        
    } catch (error) {
        console.error("Error cargando productos:", error);
        showError('Error al cargar los productos: ' + error.message);
    }
}

// Actualizar estadísticas
function updateStatistics() {
    const total = allProducts.length;
    const withStock = allProducts.filter(p => p.hasInitialStock).length;
    const withoutStock = total - withStock;
    const modified = Object.keys(modifiedProducts).length;
    
    document.getElementById('total-products').textContent = total;
    document.getElementById('with-stock').textContent = withStock;
    document.getElementById('without-stock').textContent = withoutStock;
    document.getElementById('modified-count').textContent = modified;
}

// Renderizar productos
function renderProducts() {
    const container = document.getElementById('products-grid');
    
    if (filteredProducts.length === 0) {
        container.classList.add('hidden');
        document.getElementById('no-products').classList.remove('hidden');
        return;
    }
    
    document.getElementById('no-products').classList.add('hidden');
    container.classList.remove('hidden');
    
    container.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

// Crear tarjeta de producto
function createProductCard(product) {
    // Buscar categoría por ID o por nombre
    let category = categories.find(cat => cat.id === product.category);
    if (!category) {
        category = categories.find(cat => cat.name === product.category);
    }
    
    const categoryName = category ? category.name : (product.category || 'Sin categoría');
    const currentStock = product.stockInicial || '';
    const currentPrice = product.precioCompraInicial || product.purchasePrice || '';
    const hasStock = product.hasInitialStock;
    
    return `
        <div class="product-card ${hasStock ? 'has-stock' : 'no-stock'}" data-category="${product.category || ''}">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${categoryName}</p>
                <div>
                    ${hasStock ? 
                        `<span class="status-badge status-success">
                            <i class="fas fa-check"></i> Stock registrado
                        </span>` :
                        `<span class="status-badge status-warning">
                            <i class="fas fa-exclamation-triangle"></i> Sin stock inicial
                        </span>`
                    }
                </div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div class="input-group">
                    <label class="input-label">Stock Inicial</label>
                    <input 
                        type="number" 
                        min="0" 
                        step="1"
                        value="${currentStock}" 
                        placeholder="Ingrese stock inicial"
                        class="input-field stock-input"
                        data-product-id="${product.id}"
                        data-original-value="${currentStock}"
                    />
                </div>
                
                <div class="input-group">
                    <label class="input-label">Precio de Compra Inicial (S/)</label>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.01"
                        value="${currentPrice}" 
                        placeholder="Precio de compra"
                        class="input-field purchase-price-input"
                        data-product-id="${product.id}"
                        data-original-value="${currentPrice}"
                    />
                </div>
            </div>
            
            <div class="product-footer">
                <span>Stock actual: ${product.stock || 0}</span>
                <span>Precio venta: S/ ${product.price || 0}</span>
            </div>
        </div>
    `;
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    // Filtro por categoría
    const categoryFilter = document.getElementById('filter-category');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
    
    // Inputs de stock (usando delegación de eventos)
    const productsGrid = document.getElementById('products-grid');
    if (productsGrid) {
        productsGrid.addEventListener('input', handleInputChange);
    }
    
    // Botón guardar
    const saveBtn = document.getElementById('save-all-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveAllChanges);
    }
}

// Manejar cambios en inputs
function handleInputChange(e) {
    if (e.target.classList.contains('stock-input') || e.target.classList.contains('purchase-price-input')) {
        const productId = e.target.dataset.productId;
        
        // Verificar si hay cambios en cualquier input del producto
        const productCard = e.target.closest('.product-card');
        const stockInput = productCard.querySelector('.stock-input');
        const priceInput = productCard.querySelector('.purchase-price-input');
        
        const stockChanged = stockInput.value !== stockInput.dataset.originalValue;
        const priceChanged = priceInput.value !== priceInput.dataset.originalValue;
        
        if (stockChanged || priceChanged) {
            // Agregar producto a modificados
            modifiedProducts[productId] = {
                stockInicial: parseInt(stockInput.value) || 0,
                precioCompraInicial: parseFloat(priceInput.value) || 0
            };
            
            // Marcar inputs como modificados
            if (stockChanged) stockInput.classList.add('modified');
            if (priceChanged) priceInput.classList.add('modified');
            
        } else {
            // Remover de modificados si volvió al valor original
            delete modifiedProducts[productId];
            
            // Quitar marcado de modificado
            stockInput.classList.remove('modified');
            priceInput.classList.remove('modified');
        }
        
        // Actualizar estadísticas y botón
        updateStatistics();
        updateSaveButton();
    }
}

// Actualizar botón de guardar
function updateSaveButton() {
    const btn = document.getElementById('save-all-btn');
    if (!btn) return;
    
    const hasChanges = Object.keys(modifiedProducts).length > 0;
    const changeCount = Object.keys(modifiedProducts).length;
    
    btn.disabled = !hasChanges;
    btn.innerHTML = hasChanges ? 
        `<i class="fas fa-save" style="margin-right: 0.5rem;"></i>Guardar ${changeCount} Cambio${changeCount > 1 ? 's' : ''}` :
        `<i class="fas fa-save" style="margin-right: 0.5rem;"></i>Guardar Cambios`;
}

// Filtrar productos
function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('filter-category');
    
    if (!searchInput || !categoryFilter) {
        console.error('Elementos de filtro no encontrados');
        return;
    }
    
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    // Obtener el nombre de la categoría seleccionada
    const selectedCategoryName = selectedCategory ? 
        categories.find(cat => cat.id === selectedCategory)?.name : null;
    
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm);
        
        // Comparar tanto por ID como por nombre de categoría
        const matchesCategory = !selectedCategory || selectedCategory === '' || 
                               product.category === selectedCategory ||  // Comparar por ID
                               product.category === selectedCategoryName; // Comparar por nombre
        
        return matchesSearch && matchesCategory;
    });
    
    renderProducts();
}

// Guardar todos los cambios
async function saveAllChanges() {
    if (Object.keys(modifiedProducts).length === 0) return;
    
    const btn = document.getElementById('save-all-btn');
    const originalHTML = btn.innerHTML;
    
    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 0.5rem;"></i>Guardando...';
        
        // Guardar cada producto individualmente
        const promises = [];
        
        for (const [productId, data] of Object.entries(modifiedProducts)) {
            const promise = db.collection('products').doc(productId).update({
                stockInicial: data.stockInicial,
                precioCompraInicial: data.precioCompraInicial,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            promises.push(promise);
        }
        
        await Promise.all(promises);
        
        // Mostrar éxito
        showToast('Cambios guardados correctamente', 'success');
        
        // Limpiar modificaciones
        modifiedProducts = {};
        
        // Recargar productos
        await loadProducts();
        
        // Limpiar estilos
        document.querySelectorAll('.modified').forEach(input => {
            input.classList.remove('modified');
        });
        
    } catch (error) {
        console.error('Error guardando cambios:', error);
        showToast('Error al guardar cambios: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        updateSaveButton();
    }
}

// Mostrar toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const messageEl = document.getElementById('toast-message');
    
    if (!toast || !messageEl) return;
    
    messageEl.textContent = message;
    
    // Cambiar clase según el tipo
    if (type === 'error') {
        toast.classList.add('error');
    } else {
        toast.classList.remove('error');
    }
    
    // Mostrar toast
    toast.classList.add('show');
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Funciones auxiliares
function showLoading() {
    const loading = document.getElementById('loading-container');
    const grid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');
    
    if (loading) loading.classList.remove('hidden');
    if (grid) grid.classList.add('hidden');
    if (noProducts) noProducts.classList.add('hidden');
}

function hideLoading() {
    const loading = document.getElementById('loading-container');
    if (loading) loading.classList.add('hidden');
}

function showError(message) {
    const loading = document.getElementById('loading-container');
    const grid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');
    
    if (loading) loading.classList.add('hidden');
    if (grid) grid.classList.add('hidden');
    if (noProducts) {
        noProducts.classList.remove('hidden');
        const p = noProducts.querySelector('p');
        const i = noProducts.querySelector('i');
        if (p) p.textContent = message;
        if (i) i.className = 'fas fa-exclamation-triangle';
    }
}
