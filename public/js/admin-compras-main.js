// admin-compras-main.js - Archivo principal del módulo de compras
console.log('Cargando admin-compras-main.js...');

// Variables globales del módulo
window.ComprasModule = {
    productosCompraActual: [],
    initialized: false
};

// Función principal que se ejecuta desde admin-layout.html
window.loadCompras = function() {
    console.log('Ejecutando loadCompras...');
    
    // Renderizar la interfaz
    ComprasUI.renderMainInterface();
    
    // Configurar event listeners
    ComprasUI.setupEventListeners();
    
    // Cargar datos
    ComprasData.loadAllData();
    
    // Marcar como inicializado
    window.ComprasModule.initialized = true;
};

// Escuchar cuando los proveedores se cargan desde el layout principal
window.addEventListener('proveedoresLoaded', function(event) {
    console.log('Evento proveedoresLoaded recibido en compras:', event.detail);
    
    // Solo actualizar si el módulo ya está inicializado
    if (window.ComprasModule.initialized) {
        setTimeout(() => {
            ComprasData.updateStats();
        }, 100);
    }
});

console.log('admin-compras-main.js cargado completamente');
