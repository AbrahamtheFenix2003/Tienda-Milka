import {
  fetchAllProducts,
  fetchCategories,
  updateProduct,
  updateProductStock,
  recordInventoryMovement,
  getServerTimestamp,
} from '../productos/data.js';
import { getDb } from '../../services/firebase.js';

function resolveDb() {
  const db = getDb();
  if (!db) {
    throw new Error(
      'Firestore no esta inicializado. Inicializa Firebase antes de usar el modulo de almacen.'
    );
  }
  return db;
}

function syncGlobalCaches(products, categories) {
  if (typeof window === 'undefined') {
    return;
  }

  if (Array.isArray(products)) {
    window.productsCache = [...products];
  }

  if (Array.isArray(categories)) {
    window.categoriesCache = [...categories];
  }
}

function updateCachedProduct(productId, updates) {
  if (typeof window === 'undefined' || !Array.isArray(window.productsCache)) {
    return;
  }

  const index = window.productsCache.findIndex((product) => product.id === productId);
  if (index === -1) {
    return;
  }

  window.productsCache[index] = {
    ...window.productsCache[index],
    ...updates,
  };
}

export async function getInventoryStatus() {
  const [products, categories] = await Promise.all([fetchAllProducts(), fetchCategories()]);

  syncGlobalCaches(products, categories);

  return { products, categories };
}

export async function updateStockThresholds(productId, { stockMinimo, stockMaximo }) {
  if (!productId) {
    throw new Error('productId es requerido para actualizar la configuracion de stock.');
  }

  const minimo = Number(stockMinimo);
  const maximo = Number(stockMaximo);

  if (!Number.isFinite(minimo) || !Number.isFinite(maximo)) {
    throw new Error('Los valores de stock deben ser numeros validos.');
  }

  if (minimo < 0 || maximo < 0) {
    throw new Error('Los valores de stock no pueden ser negativos.');
  }

  await updateProduct(productId, { stockMinimo: minimo, stockMaximo: maximo });
  updateCachedProduct(productId, { stockMinimo: minimo, stockMaximo: maximo });

  return { stockMinimo: minimo, stockMaximo: maximo };
}

export async function adjustStock(
  productId,
  { tipo = 'entrada', cantidad, observacion = '', usuario } = {}
) {
  if (!productId) {
    throw new Error('productId es requerido para ajustar el stock.');
  }

  const unidades = Number(cantidad);
  if (!Number.isFinite(unidades) || unidades <= 0) {
    throw new Error('La cantidad debe ser un numero mayor que cero.');
  }

  const movementType = tipo === 'salida' ? 'salida' : 'entrada';
  const db = resolveDb();
  const productRef = db.collection('products').doc(productId);
  const snapshot = await productRef.get();

  if (!snapshot.exists) {
    throw new Error('No se encontro el producto solicitado.');
  }

  const productData = snapshot.data() || {};
  const stockActual = Number(productData.stock || 0);
  const delta = movementType === 'salida' ? -unidades : unidades;
  const stockNuevo = stockActual + delta;

  if (stockNuevo < 0) {
    throw new Error('El ajuste dejaria el stock en un valor negativo.');
  }

  await updateProductStock(productId, stockNuevo);

  const movementPayload = {
    productId,
    productoId: productId,
    tipo: movementType,
    cantidad: unidades,
    stockAnterior: stockActual,
    stockNuevo,
    observacion,
    timestamp: getServerTimestamp(),
    usuario: usuario || (typeof window !== 'undefined' ? window.currentUser?.email : 'sistema'),
    origen: 'ajuste_manual',
  };

  await recordInventoryMovement(movementPayload);
  updateCachedProduct(productId, { stock: stockNuevo });

  return {
    stockAnterior: stockActual,
    stockNuevo,
  };
}

export async function getMovementHistory(limit = 50) {
  const db = resolveDb();
  const snapshot = await db
    .collection('movimientos_inventario')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();

  const movimientos = [];
  snapshot.forEach((doc) => {
    movimientos.push({ id: doc.id, ...doc.data() });
  });

  return movimientos;
}
