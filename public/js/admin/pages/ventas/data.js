import { getDb } from '../../services/firebase.js';

const COLLECTIONS = {
    SALES: 'sales',
    STOCK_BY_LOT: 'stock_por_lote',
    INVENTORY_MOVEMENTS: 'movimientos_inventario',
    PRODUCTS: 'products',
    CASH_MOVEMENTS: 'movimientos_caja',
};

async function runTransaction(updateFunction) {
    const db = ensureDb();
    if (typeof db.runTransaction !== 'function') {
        console.warn('db.runTransaction no es una función. Ejecutando sin transacción para mantener la funcionalidad.');
        const fakeTransaction = {
            get: (ref) => ref.get(),
            update: (ref, data) => ref.update(data),
            set: (ref, data) => ref.set(data),
        };
        return updateFunction(fakeTransaction);
    }
    return db.runTransaction(updateFunction);
}


function ensureDb() {
    const db = getDb();
    if (!db) {
        throw new Error('Firestore no se encuentra inicializado');
    }
    return db;
}

function getServerTimestampValue() {
    if (typeof window !== 'undefined') {
        if (typeof window.serverTimestamp === 'function') {
            return window.serverTimestamp();
        }
        const fallback = window.firebase?.firestore?.FieldValue?.serverTimestamp;
        if (typeof fallback === 'function') {
            return fallback();
        }
    }
    return null;
}

function getCurrentUserEmail() {
    if (typeof window !== 'undefined' && window.currentUser?.email) {
        return window.currentUser.email;
    }
    return '';
}

function sortSalesByTimestamp(sales) {
    const getTimestamp = (sale) => {
        if (sale.timestamp?.toDate) {
            return sale.timestamp.toDate().getTime();
        }
        if (sale.timestamp) {
            return new Date(sale.timestamp).getTime();
        }
        if (sale.soldAt?.toDate) {
            return sale.soldAt.toDate().getTime();
        }
        if (sale.soldAt) {
            return new Date(sale.soldAt).getTime();
        }
        if (sale.date) {
            return new Date(sale.date).getTime();
        }
        return 0;
    };

    sales.sort((a, b) => getTimestamp(b) - getTimestamp(a));
    return sales;
}

export async function ensureProductsCache() {
    const db = ensureDb();

    if (Array.isArray(window.productsCache) && window.productsCache.length > 0) {
        return window.productsCache;
    }

    const snapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
    const products = [];
    snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
    });
    products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    window.productsCache = products;
    return products;
}

export async function fetchAllSales() {
    const db = ensureDb();

    const snapshot = await db.collection(COLLECTIONS.SALES).get();
    const sales = [];
    snapshot.forEach((doc) => {
        sales.push({ id: doc.id, ...doc.data() });
    });

    const orderedSales = sortSalesByTimestamp(sales);
    window.allSales = orderedSales;
    return orderedSales;
}

export async function calcularStockRealProducto(productId, transaction = null) {
    const db = ensureDb();

    if (!productId) {
        return 0;
    }

    try {
        const lotesCollection = db.collection(COLLECTIONS.STOCK_BY_LOT);
        const query = lotesCollection
            .where('productoId', '==', productId)
            .where('cantidad', '>', 0);

        const lotesSnapshot = transaction ? await transaction.get(query) : await query.get();

        let stockReal = 0;
        lotesSnapshot.forEach((doc) => {
            const lote = doc.data();
            stockReal += lote.cantidad || 0;
        });

        return stockReal;
    } catch (error) {
        console.error('Error calculando stock real:', error);
        return 0;
    }
}

async function obtenerLotesDisponibles(productId, transaction = null) {
    const db = ensureDb();

    try {
        console.log(`Consultando lotes para producto: ${productId}`);

        const lotesCollection = db.collection(COLLECTIONS.STOCK_BY_LOT);
        const query = lotesCollection
            .where('productoId', '==', productId)
            .where('cantidad', '>', 0);

        const lotesSnapshot = transaction ? await transaction.get(query) : await query.get();

        const lotes = [];
        lotesSnapshot.forEach((doc) => {
            const loteData = doc.data();
            lotes.push({
                id: doc.id,
                ...loteData,
            });
        });

        lotes.sort((a, b) => {
            const resolveDate = (value) => {
                if (value?.toDate) {
                    return value.toDate();
                }
                if (typeof value === 'string') {
                    return new Date(value);
                }
                if (value instanceof Date) {
                    return value;
                }
                return new Date(0);
            };

            const fechaA = resolveDate(a.fechaIngreso);
            const fechaB = resolveDate(b.fechaIngreso);

            if (fechaA.getTime() === fechaB.getTime()) {
                const loteIdA = a.loteId || '';
                const loteIdB = b.loteId || '';
                return loteIdA.localeCompare(loteIdB);
            }

            return fechaA - fechaB;
        });

        console.log(`Lotes encontrados para producto ${productId}:`, lotes.length);
        return lotes;
    } catch (error) {
        console.error('Error obteniendo lotes disponibles:', error.message, error.code);
        return [];
    }
}

async function procesarVentaSinLotes(transaction, productId, cantidadVendida, ventaId, customerName, productData, currentUserEmail) {
    const db = ensureDb();

    try {
        console.log(`Procesando venta sin lotes para producto ${productData.name}`);

        const costoUnitario = productData.acquisitionCost || 0;
        const costoTotal = cantidadVendida * costoUnitario;
        const nuevoStock = (productData.stock || 0) - cantidadVendida;

        const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(productId);
        transaction.update(productRef, { stock: nuevoStock });

        const movimiento = {
            fecha: new Date().toISOString().split('T')[0],
            timestamp: getServerTimestampValue(),
            productoId: productId,
            productoNombre: productData.name || '',
            loteId: 'sin-lote',
            cantidad: cantidadVendida,
            tipo: 'salida',
            subtipo: 'venta',
            ventaId,
            relatedTo: 'venta',
            relatedId: ventaId,
            costoUnitario,
            costoTotal,
            usuario: currentUserEmail,
            observaciones: `Venta a ${customerName} - ${ventaId} (modo legacy sin lotes)`,
        };

        const newMovementRef = db.collection(COLLECTIONS.INVENTORY_MOVEMENTS).doc();
        transaction.set(newMovementRef, movimiento);

        console.log(`Venta procesada sin lotes para producto ${productData.name}:`, {
            cantidadVendida,
            costoTotal,
            stockRestante: nuevoStock,
        });

        return {
            success: true,
            cantidadVendida,
            lotesAfectados: [
                {
                    loteId: 'sin-lote',
                    cantidadTomada: cantidadVendida,
                    costoUnitario,
                    costoTotal,
                },
            ],
            costoTotal,
            costoUnitarioPromedio: costoUnitario,
            stockRestante: nuevoStock,
            movimientos: 1,
        };
    } catch (error) {
        console.error('Error procesando venta sin lotes:', error);
        throw error;
    }
}

async function procesarVentaConLotes(transaction, productId, cantidadVendida, ventaId, customerName, currentUserEmail, productInfo = {}) {
    const db = ensureDb();

    if (!productId) {
        const msg = 'productoId faltante o inválido en procesarVentaConLotes';
        console.error(msg, { productId, productInfo });
        throw new Error(msg);
    }

    try {
        const lotesDisponibles = await obtenerLotesDisponibles(productId, transaction);

        if (lotesDisponibles.length === 0) {
            console.log(`No se encontraron lotes para producto ${productId}, verificando stock directo...`);
            const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(productId);
            const productDoc = await transaction.get(productRef);

            if (!productDoc.exists) {
                throw new Error(`Producto ${productId} no encontrado`);
            }

            const productData = productDoc.data();
            const stockDirecto = productData.stock || 0;

            if (stockDirecto < cantidadVendida) {
                throw new Error(
                    `Stock insuficiente en modo legacy. Disponible: ${stockDirecto}, Requerido: ${cantidadVendida}`
                );
            }

            return procesarVentaSinLotes(transaction, productId, cantidadVendida, ventaId, customerName, productData, currentUserEmail);
        }

        let cantidadPendiente = cantidadVendida;
        const lotesAfectados = [];
        let costoTotal = 0;
        const movimientos = [];

        for (const lote of lotesDisponibles) {
            if (cantidadPendiente <= 0) {
                break;
            }

            const cantidadDisponible = lote.cantidad || 0;
            if (cantidadDisponible <= 0) {
                continue;
            }

            const cantidadTomada = Math.min(cantidadDisponible, cantidadPendiente);
            const costoUnitario = lote.costoUnitario || productInfo.cost || productInfo.acquisitionCost || 0;
            const costoLote = cantidadTomada * costoUnitario;

            const loteRef = db.collection(COLLECTIONS.STOCK_BY_LOT).doc(lote.id);
            transaction.update(loteRef, {
                cantidad: cantidadDisponible - cantidadTomada,
                ultimaActualizacion: getServerTimestampValue(),
            });

            lotesAfectados.push({
                loteId: lote.loteId || lote.id,
                cantidadTomada,
                costoUnitario,
                costoTotal: costoLote,
                fechaIngreso: lote.fechaIngreso || null,
            });

            movimientos.push({
                fecha: new Date().toISOString().split('T')[0],
                timestamp: getServerTimestampValue(),
                productoId: productId,
                productoNombre: lote.productoNombre || productInfo.name || '',
                loteId: lote.loteId || lote.id,
                cantidad: cantidadTomada,
                tipo: 'salida',
                subtipo: 'venta',
                ventaId,
                relatedTo: 'venta',
                relatedId: ventaId,
                costoUnitario,
                costoTotal: costoLote,
                usuario: currentUserEmail,
                observaciones: `Venta a ${customerName} - ${ventaId}`,
            });

            cantidadPendiente -= cantidadTomada;
            costoTotal += costoLote;
        }

        if (cantidadPendiente > 0) {
            throw new Error(
                `No hay suficiente stock en lotes para completar la venta. Falta: ${cantidadPendiente}`
            );
        }
        
        for (const movimiento of movimientos) {
            const newMovementRef = db.collection(COLLECTIONS.INVENTORY_MOVEMENTS).doc();
            transaction.set(newMovementRef, movimiento);
        }

        const stockRealActualizado = await calcularStockRealProducto(productId, transaction);
        const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(productId);
        transaction.update(productRef, { stock: stockRealActualizado });

        console.log(`Venta procesada con lotes FIFO para producto ${productId}:`, {
            cantidadVendida,
            lotesAfectados: lotesAfectados.length,
            costoTotal,
            stockRestante: stockRealActualizado,
        });

        return {
            success: true,
            cantidadVendida,
            lotesAfectados,
            costoTotal,
            costoUnitarioPromedio: costoTotal / cantidadVendida,
            stockRestante: stockRealActualizado,
            movimientos: movimientos.length,
        };
    } catch (error) {
        console.error('Error procesando venta con lotes:', error);
        throw error;
    }
}

export async function processSale({
    customerName,
    customerPhone,
    paymentMethod,
    deliveryMethod,
    deliveryLocation,
    deliveryCost = 0,
    items = [],
}) {
    const db = ensureDb();

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Debe agregar productos a la venta.');
    }

    const currentUserEmail = getCurrentUserEmail();
    const subtotalSale = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const totalSale = subtotalSale + (deliveryCost || 0);
    const totalCostEstimado = items.reduce((sum, item) => sum + item.quantity * (item.cost || 0), 0);

    const saleRecord = {
        customerName,
        customerPhone,
        paymentMethod,
        deliveryMethod,
        deliveryLocation: deliveryLocation || null,
        deliveryCost: deliveryCost || 0,
        items,
        subtotalSale,
        totalSale,
        totalCost: totalCostEstimado,
        profit: totalSale - totalCostEstimado,
        timestamp: getServerTimestampValue(),
        date: new Date().toISOString().split('T')[0],
        soldBy: currentUserEmail,
        lotesInfo: [],
    };

    const saleRef = await db.collection(COLLECTIONS.SALES).add(saleRecord);
    console.log('Venta creada con ID:', saleRef.id);

    const { lotesResults, stockUpdates, costoRealTotal } = await runTransaction(async (transaction) => {
        const lotesResults = [];
        const stockUpdates = [];
        let costoRealTotal = 0;

        for (const item of items) {
            console.log(`Procesando producto ${item.name} (${item.id}) - Cantidad: ${item.quantity}`);
            const resultado = await procesarVentaConLotes(
                transaction,
                item.id,
                item.quantity,
                saleRef.id,
                customerName,
                currentUserEmail,
                item
            );

            lotesResults.push({
                productId: item.id,
                productName: item.name,
                ...resultado,
            });

            stockUpdates.push({
                productId: item.id,
                stockRestante: resultado.stockRestante,
            });

            costoRealTotal += resultado.costoTotal;
        }

        return { lotesResults, stockUpdates, costoRealTotal };
    });

    const gananciaReal = totalSale - costoRealTotal;

    await db.collection(COLLECTIONS.SALES).doc(saleRef.id).update({
        totalCost: costoRealTotal,
        profit: gananciaReal,
        lotesInfo: lotesResults.map((resultado) => ({
            productId: resultado.productId,
            productName: resultado.productName,
            lotesAfectados: resultado.lotesAfectados.length,
            costoTotal: resultado.costoTotal,
            costoUnitarioPromedio: resultado.costoUnitarioPromedio,
        })),
    });

    if (typeof window !== 'undefined' && typeof window.registrarMovimientoCaja === 'function') {
        await window.registrarMovimientoCaja(
            'entrada',
            totalSale,
            'ventas',
            `Venta a ${customerName} - ${items.length} productos`,
            'venta',
            saleRef.id
        );
    } else {
        try {
            await db.collection(COLLECTIONS.CASH_MOVEMENTS).add({
                tipo: 'entrada',
                monto: totalSale,
                categoria: 'ventas',
                descripcion: `Venta a ${customerName} - ${items.length} productos`,
                fecha: new Date().toISOString().split('T')[0],
                timestamp: getServerTimestampValue(),
                usuario: currentUserEmail,
                relatedTo: 'venta',
                relatedId: saleRef.id,
            });
        } catch (error) {
            console.error('Error registrando movimiento de caja:', error);
        }
    }

    const totalLotesAfectados = lotesResults.reduce(
        (sum, resultado) => sum + resultado.lotesAfectados.length,
        0
    );
    const totalMovimientos = lotesResults.reduce(
        (sum, resultado) => sum + (resultado.movimientos || 0),
        0
    );

    return {
        saleId: saleRef.id,
        subtotalSale,
        totalSale,
        deliveryCost: deliveryCost || 0,
        totalCostEstimado,
        totalCostReal: costoRealTotal,
        profit: gananciaReal,
        lotesResults,
        stockUpdates,
        totalLotesAfectados,
        totalMovimientos,
    };
}
