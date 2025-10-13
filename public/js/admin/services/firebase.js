// public/js/admin/services/firebase.js
// Servicio centralizado para la inicialización de Firebase en el panel administrativo
// Usa Firebase Compatibility Mode para mantener compatibilidad con el código existente

export let db = null;

/**
 * Inicializa Firebase y retorna las instancias de los servicios
 * @returns {Promise<{app: firebase.app.App, auth: firebase.auth.Auth, db: firebase.firestore.Firestore, storage: firebase.storage.Storage}>}
 */
export async function initializeFirebase() {
    try {
        // Obtener la configuración de Firebase desde el endpoint de hosting
        const response = await fetch('/__/firebase/init.json');
        const config = await response.json();

        // Inicializar Firebase con la configuración obtenida
        const app = firebase.initializeApp(config);

        // Inicializar servicios de Firebase
        const auth = firebase.auth();
        const db = firebase.firestore();
        const storage = firebase.storage();

        console.log('✅ Firebase inicializado correctamente');

        // Retornar las instancias de los servicios
        return {
            app,
            auth,
            db,
            storage
        };
    } catch (error) {
        console.error("❌ Error al inicializar Firebase:", error);
        throw error;
    }
}

/**
 * Expone las instancias de Firebase globalmente para mantener compatibilidad
 * con el código existente que accede a window.auth, window.db, etc.
 * @param {Object} services - Objeto con las instancias de Firebase
 */
export function exposeFirebaseGlobally(services) {
    db = services.db;
    window.auth = services.auth;
    window.db = services.db;
    window.storage = services.storage;
    window.firebase = firebase;

    console.log('✅ Servicios de Firebase expuestos globalmente');
}

/**
 * Inicializa las variables globales de la aplicación
 */
export function initializeGlobalVariables() {
    window.currentUser = null;
    window.productsCache = [];
    window.categoriesCache = [];
    window.proveedoresCache = [];
    window.allSales = [];
    window.allExpenses = [];

    console.log('✅ Variables globales inicializadas');
}

/**
 * Función principal que inicializa Firebase y configura el entorno global
 * @returns {Promise<{auth: firebase.auth.Auth, db: firebase.firestore.Firestore, storage: firebase.storage.Storage}>}
 */
export async function setupFirebase() {
    try {
        // Inicializar Firebase
        const services = await initializeFirebase();

        // Exponer servicios globalmente
        exposeFirebaseGlobally(services);

        // Inicializar variables globales
        initializeGlobalVariables();

        return services;
    } catch (error) {
        console.error("❌ Error en setupFirebase:", error);
        throw error;
    }
}
