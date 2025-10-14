// public/js/admin/services/firebase.js
// Servicio centralizado para la inicialización de Firebase en el panel administrativo
// Usa Firebase Compatibility Mode para mantener compatibilidad con el código existente

// Variables internas que se actualizarán cuando Firebase se inicialice
let _db = null;
let _storage = null;

// Funciones getter para acceder a las instancias de Firebase
// Estas funciones permiten que los módulos obtengan las instancias actualizadas
export function getDb() {
    if (!_db && typeof window !== 'undefined' && window.db) {
        _db = window.db;
    }
    return _db;
}

export function getStorage() {
    if (!_storage && typeof window !== 'undefined' && window.storage) {
        _storage = window.storage;
    }
    return _storage;
}

// Mantener compatibilidad con imports existentes usando getters
export const db = new Proxy({}, {
    get(target, prop) {
        const database = getDb();
        if (database && prop in database) {
            return typeof database[prop] === 'function' 
                ? database[prop].bind(database)
                : database[prop];
        }
        return undefined;
    }
});

export const storage = new Proxy({}, {
    get(target, prop) {
        const storageInstance = getStorage();
        if (storageInstance && prop in storageInstance) {
            return typeof storageInstance[prop] === 'function'
                ? storageInstance[prop].bind(storageInstance)
                : storageInstance[prop];
        }
        return undefined;
    }
}); 

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
        
        // --- INICIO DE CÓDIGO AÑADIDO ---
        // Conectar a los emuladores si estamos en localhost (entorno de desarrollo)
        if (window.location.hostname === 'localhost') {
            console.log("Modo de desarrollo: Conectando a los emuladores de Firebase...");
            try {
                // Usamos la sintaxis .useEmulator() para la versión de compatibilidad (v8)
                db.useEmulator("localhost", 8080);
                auth.useEmulator("http://localhost:9099");
                storage.useEmulator("localhost", 9199);
                console.log("✅ Conectado a los emuladores locales.");
            } catch (error) {
                console.error("❌ Error al conectar con los emuladores. ¿Están corriendo?", error);
            }
        }
        // --- FIN DE CÓDIGO AÑADIDO ---

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
    _db = services.db;
    _storage = services.storage;
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
