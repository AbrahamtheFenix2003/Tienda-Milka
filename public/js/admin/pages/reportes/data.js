import { db as firebaseDb } from '../../services/firebase.js';

let salesCache = [];
let expensesCache = [];

function resolveDb() {
  const database = firebaseDb ?? window?.db ?? null;
  if (!database) {
    throw new Error('Firestore no esta inicializado. Asegurate de haber configurado Firebase antes de usar los reportes.');
  }
  return database;
}

function getServerTimestamp() {
  if (typeof window !== 'undefined' && typeof window.serverTimestamp === 'function') {
    return window.serverTimestamp();
  }
  if (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp) {
    return firebase.firestore.FieldValue.serverTimestamp();
  }
  throw new Error('serverTimestamp no disponible');
}

export function getSaleDate(sale) {
  if (!sale) {
    return null;
  }

  if (sale.timestamp && typeof sale.timestamp.toDate === 'function') {
    return sale.timestamp.toDate();
  }

  if (sale.timestamp) {
    return new Date(sale.timestamp);
  }

  if (sale.soldAt && typeof sale.soldAt.toDate === 'function') {
    return sale.soldAt.toDate();
  }

  if (sale.soldAt) {
    return new Date(sale.soldAt);
  }

  if (sale.date) {
    return new Date(sale.date);
  }

  return null;
}

function sortSalesByDate(sales) {
  return [...sales].sort((a, b) => {
    const dateA = getSaleDate(a)?.getTime() ?? 0;
    const dateB = getSaleDate(b)?.getTime() ?? 0;
    return dateB - dateA;
  });
}

function getExpenseDate(expense) {
  if (!expense) {
    return null;
  }

  if (expense.timestamp && typeof expense.timestamp.toDate === 'function') {
    return expense.timestamp.toDate();
  }

  if (expense.timestamp) {
    return new Date(expense.timestamp);
  }

  if (expense.date) {
    return new Date(expense.date);
  }

  return null;
}

function sortExpensesByDate(expenses) {
  return [...expenses].sort((a, b) => {
    const dateA = getExpenseDate(a)?.getTime() ?? 0;
    const dateB = getExpenseDate(b)?.getTime() ?? 0;
    return dateB - dateA;
  });
}

export async function loadAllSalesAndExpenses() {
  const database = resolveDb();

  const [salesSnapshot, expensesSnapshot] = await Promise.all([
    database.collection('sales').get(),
    database
      .collection('expenses')
      .get()
      .catch((error) => {
        if (error.code === 'permission-denied') {
          console.warn('Sin permisos para leer expenses. Continuando con una lista vacia.');
          return { empty: true, docs: [] };
        }
        console.error('Error obteniendo expenses:', error);
        return { empty: true, docs: [] };
      }),
  ]);

  const sales = salesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  const expenses = expensesSnapshot.empty
    ? []
    : expensesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

  salesCache = sortSalesByDate(sales);
  expensesCache = sortExpensesByDate(expenses);

  if (typeof window !== 'undefined') {
    window.allSales = salesCache;
    window.allExpenses = expensesCache;
  }

  return {
    allSales: salesCache,
    allExpenses: expensesCache,
  };
}

export function getCachedSales() {
  if (salesCache.length) {
    return salesCache;
  }
  if (Array.isArray(window?.allSales) && window.allSales.length) {
    salesCache = window.allSales;
    return salesCache;
  }
  return [];
}

export function setSalesCache(sales) {
  salesCache = Array.isArray(sales) ? sales : [];
  if (typeof window !== 'undefined') {
    window.allSales = salesCache;
  }
}

export function setExpensesCache(expenses) {
  expensesCache = Array.isArray(expenses) ? expenses : [];
  if (typeof window !== 'undefined') {
    window.allExpenses = expensesCache;
  }
}

export async function getSaleDetails(saleId) {
  const cachedSale = getCachedSales().find((sale) => sale.id === saleId);
  if (cachedSale) {
    return cachedSale;
  }

  const database = resolveDb();
  const saleDoc = await database.collection('sales').doc(saleId).get();
  if (!saleDoc.exists) {
    return null;
  }

  const sale = { id: saleDoc.id, ...saleDoc.data() };
  salesCache.push(sale);
  if (typeof window !== 'undefined') {
    window.allSales = salesCache;
  }

  return sale;
}

export async function annulSale(saleId) {
  const database = resolveDb();
  const sale = await getSaleDetails(saleId);

  if (!sale) {
    throw new Error('No se encontro la venta solicitada.');
  }

  let inventoryMovementsSnapshot = null;
  let stockWasDiscounted = false;

  try {
    inventoryMovementsSnapshot = await database
      .collection('movimientos_inventario')
      .where('relatedTo', '==', 'venta')
      .where('relatedId', '==', saleId)
      .where('tipo', '==', 'salida')
      .get();

    stockWasDiscounted = !inventoryMovementsSnapshot.empty;
  } catch (error) {
    console.warn('Error verificando movimientos de inventario:', error);
    stockWasDiscounted = true;
  }

  if (stockWasDiscounted && inventoryMovementsSnapshot && !inventoryMovementsSnapshot.empty) {
    const movementsByProduct = groupMovementsByProduct(inventoryMovementsSnapshot);

    for (const [productId, movimientos] of Object.entries(movementsByProduct)) {
      const restoredQuantity = await restoreLotsFromMovements(database, productId, movimientos);
      await incrementProductStock(database, productId, restoredQuantity);
    }

    await deleteInventoryMovements(inventoryMovementsSnapshot);
  } else if (stockWasDiscounted) {
    await restoreStockWithoutInventoryMovements(database, sale);
  }

  await database.collection('sales').doc(saleId).delete();
  await deleteCashMovements(database, saleId);

  salesCache = salesCache.filter((item) => item.id !== saleId);
  if (typeof window !== 'undefined') {
    window.allSales = salesCache;
  }

  return true;
}

function groupMovementsByProduct(snapshot) {
  const result = {};
  snapshot.forEach((doc) => {
    const data = doc.data();
    const productId = data.productoId;
    if (!productId) {
      return;
    }
    if (!result[productId]) {
      result[productId] = [];
    }
    result[productId].push({ id: doc.id, ...data });
  });
  return result;
}

async function restoreLotsFromMovements(database, productId, movimientos) {
  let restoredTotal = 0;

  for (const movimiento of movimientos) {
    const { loteId, cantidad = 0, costoUnitario = 0 } = movimiento;

    if (loteId && loteId !== 'sin-lote') {
      const lotsQuery = await database
        .collection('stock_por_lote')
        .where('productoId', '==', productId)
        .where('loteId', '==', loteId)
        .limit(1)
        .get();

      if (!lotsQuery.empty) {
        const lotDoc = lotsQuery.docs[0];
        const lotData = lotDoc.data();
        const newQuantity = (lotData.cantidad || 0) + cantidad;
        await lotDoc.ref.update({ cantidad: newQuantity });
      } else {
        await database.collection('stock_por_lote').add({
          productoId: productId,
          productoNombre: movimiento.productoNombre || '',
          loteId,
          cantidad,
          costoUnitario,
          fechaIngreso: movimiento.timestamp || getServerTimestamp(),
          fechaVencimiento: null,
          proveedor: 'Restaurado de venta anulada',
          estado: 'disponible',
          observaciones: `Lote restaurado de venta anulada ${movimiento.ventaId || movimiento.relatedId || ''}`,
        });
      }
    }

    await database.collection('movimientos_inventario').add({
      fecha: new Date().toISOString().split('T')[0],
      timestamp: getServerTimestamp(),
      productoId: productId,
      productoNombre: movimiento.productoNombre || '',
      loteId: loteId || 'restaurado',
      cantidad,
      tipo: 'entrada',
      subtipo: 'anulacion_venta',
      relatedTo: 'anulacion',
      relatedId: movimiento.ventaId || movimiento.relatedId || '',
      costoUnitario,
      costoTotal: (costoUnitario || 0) * cantidad,
      usuario: window?.currentUser?.email || '',
      observaciones: `Restauracion por anulacion de venta ${movimiento.ventaId || movimiento.relatedId || ''}`,
    });

    restoredTotal += cantidad;
  }

  return restoredTotal;
}

async function incrementProductStock(database, productId, quantity) {
  if (!quantity) {
    return;
  }

  const productRef = database.collection('products').doc(productId);

  await database.runTransaction(async (transaction) => {
    const productSnapshot = await transaction.get(productRef);
    if (!productSnapshot.exists) {
      return;
    }
    const currentStock = productSnapshot.data().stock || 0;
    transaction.update(productRef, {
      stock: currentStock + quantity,
    });
  });
}

async function deleteInventoryMovements(snapshot) {
  if (!snapshot || snapshot.empty) {
    return;
  }

  for (const doc of snapshot.docs) {
    await doc.ref.delete();
  }
}

async function restoreStockWithoutInventoryMovements(database, sale) {
  if (Array.isArray(sale.items) && sale.items.length) {
    for (const item of sale.items) {
      if (!item.id || !item.quantity) {
        continue;
      }

      const productRef = database.collection('products').doc(item.id);
      await database.runTransaction(async (transaction) => {
        const productSnapshot = await transaction.get(productRef);
        if (!productSnapshot.exists) {
          return;
        }
        const currentStock = productSnapshot.data().stock || 0;
        transaction.update(productRef, {
          stock: currentStock + item.quantity,
        });
      });
    }
    return;
  }

  if (sale.productId) {
    const productRef = database.collection('products').doc(sale.productId);
    const quantity = sale.quantitySold || 1;

    await database.runTransaction(async (transaction) => {
      const productSnapshot = await transaction.get(productRef);
      if (!productSnapshot.exists) {
        return;
      }
      const currentStock = productSnapshot.data().stock || 0;
      transaction.update(productRef, {
        stock: currentStock + quantity,
      });
    });
  }
}

async function deleteCashMovements(database, saleId) {
  try {
    const cashMovementsSnapshot = await database
      .collection('movimientos_caja')
      .where('relatedTo', '==', 'venta')
      .where('relatedId', '==', saleId)
      .get();

    if (cashMovementsSnapshot.empty) {
      return;
    }

    for (const doc of cashMovementsSnapshot.docs) {
      await doc.ref.delete();
    }
  } catch (error) {
    console.warn('Error eliminando movimientos de caja asociados:', error);
  }
}




