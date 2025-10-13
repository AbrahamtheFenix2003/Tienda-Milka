import { db as firebaseDb, storage as firebaseStorage } from '../../services/firebase.js';

function resolveDb() {
  if (firebaseDb) {
    return firebaseDb;
  }
  if (typeof window !== 'undefined' && window.db) {
    return window.db;
  }
  throw new Error('Firestore no está inicializado. Inicializa Firebase antes de usar las funciones de productos.');
}

function resolveStorage() {
  if (firebaseStorage) {
    return firebaseStorage;
  }
  if (typeof window !== 'undefined' && window.storage) {
    return window.storage;
  }
  throw new Error('Firebase Storage no está inicializado. Inicializa Firebase antes de subir imágenes.');
}

function resolveFirebase() {
  if (typeof firebase !== 'undefined') {
    return firebase;
  }
  if (typeof window !== 'undefined' && window.firebase) {
    return window.firebase;
  }
  throw new Error('SDK de Firebase no disponible en el contexto actual.');
}

export function getServerTimestamp() {
  if (typeof window !== 'undefined' && typeof window.serverTimestamp === 'function') {
    return window.serverTimestamp();
  }

  const firebaseInstance = resolveFirebase();
  if (firebaseInstance.firestore?.FieldValue?.serverTimestamp) {
    return firebaseInstance.firestore.FieldValue.serverTimestamp();
  }

  return new Date();
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate();
  }

  return new Date(value);
}

export async function getRealProductStock(productId) {
  const db = resolveDb();

  const lotesSnapshot = await db
    .collection('stock_por_lote')
    .where('productoId', '==', productId)
    .get();

  let stockReal = 0;
  lotesSnapshot.forEach((doc) => {
    const lote = doc.data();
    stockReal += lote.cantidad || 0;
  });

  return stockReal;
}

export async function fetchAllProducts() {
  const db = resolveDb();
  const snapshot = await db.collection('products').get();

  const products = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  products.sort((a, b) => {
    const nameA = (a.name || a.nombre || '').toString().toLowerCase();
    const nameB = (b.name || b.nombre || '').toString().toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return products;
}

export async function deleteProduct(productId) {
  const db = resolveDb();
  await db.collection('products').doc(productId).delete();
}

export async function fetchCategories() {
  const db = resolveDb();
  const snapshot = await db.collection('categories').get();

  const categories = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  categories.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  return categories;
}

export async function createCategory(name) {
  const db = resolveDb();
  const trimmedName = name.trim();

  const existsSnapshot = await db
    .collection('categories')
    .where('name', '==', trimmedName)
    .get();

  if (!existsSnapshot.empty) {
    const error = new Error('La categoría ya existe');
    error.code = 'category-exists';
    throw error;
  }

  const docRef = await db.collection('categories').add({
    name: trimmedName,
    createdAt: getServerTimestamp(),
  });

  return {
    id: docRef.id,
    name: trimmedName,
  };
}

export async function removeCategory(categoryId) {
  const db = resolveDb();
  await db.collection('categories').doc(categoryId).delete();
}

export async function updateCategoryName({ categoryId, currentName, newName }) {
  const db = resolveDb();
  const trimmedName = newName.trim();

  const existsSnapshot = await db
    .collection('categories')
    .where('name', '==', trimmedName)
    .get();

  if (!existsSnapshot.empty) {
    const otherCategory = existsSnapshot.docs[0];
    if (otherCategory.id !== categoryId) {
      const error = new Error('Ya existe una categoría con ese nombre');
      error.code = 'category-exists';
      throw error;
    }
  }

  await db.collection('categories').doc(categoryId).update({
    name: trimmedName,
    updatedAt: getServerTimestamp(),
  });

  const productsSnapshot = await db.collection('products').where('category', '==', currentName).get();
  const batch = db.batch();
  productsSnapshot.forEach((doc) => {
    batch.update(doc.ref, { category: trimmedName });
  });
  await batch.commit();

  return {
    updatedProducts: productsSnapshot.size,
    newName: trimmedName,
  };
}

export async function updateProduct(productId, updateData) {
  const db = resolveDb();
  await db.collection('products').doc(productId).update(updateData);
}

export async function createProduct(productData) {
  const db = resolveDb();
  const docRef = await db.collection('products').add(productData);
  return docRef.id;
}

function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
}

export async function uploadProductImage(file, productName) {
  if (!file) {
    throw new Error('Archivo de imagen no proporcionado');
  }

  const storage = resolveStorage();
  const timestamp = Date.now();
  const sanitizedName = sanitizeFileName(productName || 'producto');
  const extension = file.name.split('.').pop();
  const fileName = `products/${sanitizedName}_${timestamp}.${extension}`;

  const storageRef = storage.ref().child(fileName);
  const snapshot = await storageRef.put(file);
  return snapshot.ref.getDownloadURL();
}

export async function fetchProductLots(productId) {
  const db = resolveDb();

  const snapshot = await db
    .collection('stock_por_lote')
    .where('productoId', '==', productId)
    .get();

  const lots = [];
  snapshot.forEach((doc) => {
    lots.push({
      id: doc.id,
      ...doc.data(),
    });
  });

  return lots.sort((a, b) => {
    const fechaA = normalizeDate(a.fechaIngreso) || new Date(0);
    const fechaB = normalizeDate(b.fechaIngreso) || new Date(0);
    return fechaB - fechaA;
  });
}

export async function fetchActiveLots(productId) {
  const lots = await fetchProductLots(productId);
  return lots.filter((lote) => {
    const estado = lote.estado || 'activo';
    const cantidad = lote.cantidad || 0;
    return (estado === 'activo' || estado === 'disponible') && cantidad > 0;
  });
}

export async function fetchProvidersMap() {
  const db = resolveDb();
  const snapshot = await db.collection('proveedores').get();
  const providers = {};

  snapshot.forEach((doc) => {
    providers[doc.id] = doc.data().nombre;
  });

  return providers;
}

export async function updateLotStock({ stockId, nuevaCantidad, cantidadAnterior, productoNombre = '' }) {
  const db = resolveDb();
  const firebaseInstance = resolveFirebase();
  const stockRef = db.collection('stock_por_lote').doc(stockId);

  await stockRef.update({
    cantidad: nuevaCantidad,
    updatedAt: firebaseInstance.firestore.FieldValue.serverTimestamp(),
  });

  return stockRef;
}

export async function recalculateProductStock(productoId) {
  const db = resolveDb();

  const stockSnapshot = await db
    .collection('stock_por_lote')
    .where('productoId', '==', productoId)
    .get();

  let stockTotal = 0;
  stockSnapshot.forEach((doc) => {
    const lote = doc.data();
    const estado = lote.estado || 'activo';
    if (estado === 'activo' || estado === 'disponible') {
      stockTotal += lote.cantidad || 0;
    }
  });

  await db.collection('products').doc(productoId).update({
    stock: stockTotal,
    updatedAt: getServerTimestamp(),
  });

  return stockTotal;
}

export async function createLegacyLot({
  productId,
  productoNombre,
  stockActual,
  stockInicial,
  costoUnitario,
  fechaIngreso,
  usuario,
}) {
  const db = resolveDb();
  const firebaseInstance = resolveFirebase();

  const lotesExistentes = await db
    .collection('stock_por_lote')
    .where('productoId', '==', productId)
    .get();

  const numeroLote = lotesExistentes.size + 1;
  const loteId = `lote${numeroLote}`;

  const loteData = {
    productoId: productId,
    productoNombre: productoNombre || '',
    loteId,
    cantidad: stockActual,
    cantidadOriginal: stockInicial,
    costoUnitario,
    fechaIngreso: firebaseInstance.firestore.Timestamp.fromDate(fechaIngreso),
    fechaVencimiento: null,
    proveedorId: null,
    proveedorNombre: 'Legacy - Stock Inicial',
    compraId: null,
    esLegacy: true,
    usuario: usuario || 'sistema',
    creadoEn: firebaseInstance.firestore.FieldValue.serverTimestamp(),
  };

  const loteRef = await db.collection('stock_por_lote').add(loteData);

  await db.collection('movimientos_inventario').add({
    fecha: firebaseInstance.firestore.Timestamp.fromDate(fechaIngreso),
    productoId: productId,
    productoNombre: productoNombre || '',
    loteId,
    cantidad: stockActual,
    tipo: 'entrada',
    subtipo: 'lote_legacy',
    usuario: usuario || 'sistema',
    observaciones: `Lote legacy creado. Stock original: ${stockInicial}, stock actual: ${stockActual} unidades`,
    costoUnitario,
    proveedorNombre: 'Legacy - Stock Inicial',
  });

  return {
    loteRef,
    loteId,
  };
}

export async function fetchLotById(loteId) {
  const db = resolveDb();
  const loteDoc = await db.collection('stock_por_lote').doc(loteId).get();

  if (!loteDoc.exists) {
    return null;
  }

  return {
    id: loteDoc.id,
    ...loteDoc.data(),
  };
}

export async function fetchPurchaseById(compraId) {
  if (!compraId) {
    return null;
  }

  const db = resolveDb();
  const compraDoc = await db.collection('compras').doc(compraId).get();

  if (!compraDoc.exists) {
    return null;
  }

  return {
    id: compraDoc.id,
    ...compraDoc.data(),
  };
}

export async function fetchInventoryMovements(productoId, limit = 50) {
  const db = resolveDb();

  const snapshot = await db
    .collection('movimientos_inventario')
    .where('productoId', '==', productoId)
    .limit(limit)
    .get();

  const movimientos = [];
  snapshot.forEach((doc) => {
    movimientos.push({ id: doc.id, ...doc.data() });
  });

  movimientos.sort((a, b) => {
    const fechaA = normalizeDate(a.fecha) || normalizeDate(a.timestamp) || new Date(0);
    const fechaB = normalizeDate(b.fecha) || normalizeDate(b.timestamp) || new Date(0);
    return fechaB - fechaA;
  });

  return movimientos;
}

export async function updateProductStock(productoId, nuevoStock) {
  const db = resolveDb();
  await db.collection('products').doc(productoId).update({
    stock: nuevoStock,
  });
}

export async function recordInventoryMovement(movementData) {
  const db = resolveDb();
  await db.collection('movimientos_inventario').add({
    ...movementData,
    fecha: movementData.fecha || getServerTimestamp(),
  });
}

export async function updateLotStockConfirmed({
  loteId,
  nuevoStock,
  movimientoData,
  productoIdParaRecalculo,
}) {
  const db = resolveDb();
  const loteRef = db.collection('stock_por_lote').doc(loteId);

  await loteRef.update({
    cantidad: nuevoStock,
  });

  if (productoIdParaRecalculo) {
    await recalculateProductStock(productoIdParaRecalculo);
  }

  if (movimientoData) {
    await recordInventoryMovement(movimientoData);
  }
}

// Compatibilidad global opcional cuando se carga el módulo directamente en el navegador.
if (typeof window !== 'undefined') {
  window.productosData = {
    getServerTimestamp,
    getRealProductStock,
    fetchAllProducts,
    deleteProduct,
    fetchCategories,
    createCategory,
    removeCategory,
    updateCategoryName,
    updateProduct,
    createProduct,
    uploadProductImage,
    fetchProductLots,
    fetchActiveLots,
    fetchProvidersMap,
    updateLotStock,
    recalculateProductStock,
    createLegacyLot,
    fetchLotById,
    fetchPurchaseById,
    fetchInventoryMovements,
    updateProductStock,
    recordInventoryMovement,
    updateLotStockConfirmed,
  };
}
