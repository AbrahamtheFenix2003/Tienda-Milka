/**
 * MÓDULO DE DATOS DE VENTAS
 *
 * Este módulo maneja todas las operaciones de datos relacionadas con ventas,
 * incluyendo procesamiento de ventas con control de inventario FIFO (First-In-First-Out).
 *
 * ARQUITECTURA TRANSACCIONAL:
 * -------------------------
 * Desde la refactorización de transacciones, el módulo utiliza Firestore Transactions
 * para garantizar atomicidad en las operaciones de venta. Esto previene:
 * - Inconsistencias de stock entre ventas concurrentes
 * - Ventas parciales que dejan el sistema en estado inválido
 * - Condiciones de carrera en la actualización de lotes
 *
 * FLUJO DE PROCESAMIENTO DE VENTAS:
 * --------------------------------
 * 1. VALIDACIONES PREVIAS (fuera de transacción)
 *    - Verificar que hay productos en la venta
 *    - Preparar datos calculados (subtotales, totales)
 *
 * 2. TRANSACCIÓN PRINCIPAL (db.runTransaction)
 *    Fase de Lecturas:
 *    - Leer documentos de productos
 *    - Leer lotes disponibles para cada producto (ordenados por fechaIngreso - FIFO)
 *    - Validar stock disponible vs requerido
 *
 *    Fase de Escrituras:
 *    - Crear documento de venta
 *    - Actualizar cantidades en lotes (decrementar según FIFO)
 *    - Crear movimientos de inventario para cada lote afectado
 *    - Recalcular y actualizar stock de productos
 *
 * 3. POST-TRANSACCIÓN (operaciones no críticas)
 *    - Registrar movimiento de caja
 *    - Si falla, se logea pero no afecta la venta
 *
 * MODO LEGACY:
 * -----------
 * El sistema soporta productos sin lotes (adquiridos antes de implementar FIFO).
 * En estos casos, se usa el campo `acquisitionCost` del producto y se actualiza
 * el stock directamente sin procesamiento de lotes.
 *
 * FUNCIONES LEGACY:
 * ----------------
 * `procesarVentaSinLotes()` y `procesarVentaConLotes()` se mantienen por compatibilidad
 * pero NO se usan en el flujo transaccional principal de `processSale()`.
 */

import { getDb } from '../../services/firebase.js';

const COLLECTIONS = {
    SALES: 'sales',
    STOCK_BY_LOT: 'stock_por_lote',
    INVENTORY_MOVEMENTS: 'movimientos_inventario',
    PRODUCTS: 'products',
    CASH_MOVEMENTS: 'movimientos_caja',
};

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

export async function calcularStockRealProducto(productId) {
    const db = ensureDb();

    if (!productId) {
        return 0;
    }

    try {
        const lotesSnapshot = await db
            .collection(COLLECTIONS.STOCK_BY_LOT)
            .where('productoId', '==', productId)
            .where('cantidad', '>', 0)
            .get();

        let stockReal = 0;
        lotesSnapshot.forEach((doc) => {
            const lote = doc.data();
            stockReal += lote.cantidad || 0;
        });

        console.log(`Stock real calculado para producto ${productId}: ${stockReal}`);
        return stockReal;
    } catch (error) {
        console.error('Error calculando stock real:', error);
        return 0;
    }
}

async function obtenerLotesDisponibles(productId) {
    const db = ensureDb();

    try {
        console.log(`Consultando lotes para producto: ${productId}`);

        const lotesSnapshot = await db
            .collection(COLLECTIONS.STOCK_BY_LOT)
            .where('productoId', '==', productId)
            .where('cantidad', '>', 0)
            .get();

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

// FUNCIONES LEGACY: Mantenidas por compatibilidad pero no se usan en processSale() transaccional

async function procesarVentaSinLotes(productId, cantidadVendida, ventaId, customerName, productData, currentUserEmail) {
    const db = ensureDb();

    try {
        console.log(`[LEGACY] Procesando venta sin lotes para producto ${productData.name}`);

        const costoUnitario = productData.acquisitionCost || 0;
        const costoTotal = cantidadVendida * costoUnitario;
        const nuevoStock = (productData.stock || 0) - cantidadVendida;

        await db.collection(COLLECTIONS.PRODUCTS).doc(productId).update({
            stock: nuevoStock,
        });

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

        await db.collection(COLLECTIONS.INVENTORY_MOVEMENTS).add(movimiento);

        console.log(`[LEGACY] Venta procesada sin lotes para producto ${productData.name}:`, {
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
        console.error('[LEGACY] Error procesando venta sin lotes:', error);
        throw error;
    }
}

async function procesarVentaConLotes(productId, cantidadVendida, ventaId, customerName, currentUserEmail, productInfo = {}) {
    const db = ensureDb();

    if (!productId) {
        const msg = 'productoId faltante o inválido en procesarVentaConLotes';
        console.error(msg, { productId, productInfo });
        throw new Error(msg);
    }

    try {
        console.log(`[LEGACY] Procesando venta con lotes para producto ${productId}`);
        const lotesDisponibles = await obtenerLotesDisponibles(productId);

        if (lotesDisponibles.length === 0) {
            console.log(`[LEGACY] No se encontraron lotes para producto ${productId}, verificando stock directo...`);
            const productDoc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();

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

            return procesarVentaSinLotes(productId, cantidadVendida, ventaId, customerName, productData, currentUserEmail);
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

            await db.collection(COLLECTIONS.STOCK_BY_LOT).doc(lote.id).update({
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
            await db.collection(COLLECTIONS.INVENTORY_MOVEMENTS).add(movimiento);
        }

        const stockRealActualizado = await calcularStockRealProducto(productId);
        await db.collection(COLLECTIONS.PRODUCTS).doc(productId).update({
            stock: stockRealActualizado,
        });

        console.log(`[LEGACY] Venta procesada con lotes FIFO para producto ${productId}:`, {
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
        console.error('[LEGACY] Error procesando venta con lotes:', error);
        throw error;
    }
}

/**
 * Procesa una venta completa usando transacciones de Firestore para garantizar atomicidad.
 *
 * Esta función implementa un procesamiento transaccional completo que:
 * 1. Valida stock disponible para todos los productos
 * 2. Crea el documento de venta
 * 3. Actualiza lotes usando FIFO (First-In-First-Out)
 * 4. Registra movimientos de inventario
 * 5. Actualiza stock de productos
 * 6. Registra movimiento de caja (post-transacción)
 *
 * @param {Object} saleData - Datos de la venta
 * @param {string} saleData.customerName - Nombre del cliente
 * @param {string} saleData.customerPhone - Teléfono del cliente
 * @param {string} saleData.paymentMethod - Método de pago (Efectivo, Transferencia, etc.)
 * @param {string} saleData.deliveryMethod - Método de entrega (Recojo, Delivery)
 * @param {string} [saleData.deliveryLocation] - Ubicación de entrega (si aplica)
 * @param {number} [saleData.deliveryCost=0] - Costo de delivery
 * @param {Array<Object>} saleData.items - Items de la venta
 * @param {string} saleData.items[].id - ID del producto
 * @param {string} saleData.items[].name - Nombre del producto
 * @param {number} saleData.items[].quantity - Cantidad vendida
 * @param {number} saleData.items[].price - Precio de venta unitario
 * @param {number} [saleData.items[].cost] - Costo de adquisición (fallback si no hay lotes)
 *
 * @returns {Promise<Object>} Resultado de la venta procesada
 * @returns {string} return.saleId - ID de la venta creada
 * @returns {number} return.subtotalSale - Subtotal de la venta
 * @returns {number} return.totalSale - Total de la venta (incluye delivery)
 * @returns {number} return.deliveryCost - Costo de delivery
 * @returns {number} return.totalCostReal - Costo real calculado desde lotes
 * @returns {number} return.profit - Ganancia real de la venta
 * @returns {Array<Object>} return.lotesInfo - Información de lotes afectados por producto
 * @returns {number} return.totalLotesAfectados - Total de lotes procesados
 * @returns {number} return.totalMovimientos - Total de movimientos de inventario creados
 *
 * @throws {Error} Si no hay productos en la venta
 * @throws {Error} Si algún producto no existe
 * @throws {Error} Si hay stock insuficiente para cualquier producto
 * @throws {Error} Si la transacción de Firestore falla
 *
 * @example
 * const result = await processSale({
 *   customerName: 'Juan Pérez',
 *   customerPhone: '987654321',
 *   paymentMethod: 'Efectivo',
 *   deliveryMethod: 'Recojo',
 *   items: [
 *     { id: 'prod1', name: 'Producto A', quantity: 2, price: 50 },
 *     { id: 'prod2', name: 'Producto B', quantity: 1, price: 30 }
 *   ]
 * });
 * console.log('Venta procesada:', result.saleId);
 * console.log('Ganancia:', result.profit);
 */
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

    // === VALIDACIONES PREVIAS (fuera de transacción) ===
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Debe agregar productos a la venta.');
    }

    // === PREPARAR DATOS (cálculos sin I/O) ===
    const currentUserEmail = getCurrentUserEmail();
    const subtotalSale = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const totalSale = subtotalSale + (deliveryCost || 0);
    const currentDate = new Date().toISOString().split('T')[0];

    console.log('=== INICIANDO VENTA CON TRANSACCIÓN ===');
    console.log('Cliente:', customerName);
    console.log('Productos:', items.length);
    console.log('Total venta:', totalSale);

    // === TRANSACCIÓN PRINCIPAL ===
    let result;
    try {
        result = await db.runTransaction(async (transaction) => {
            console.log('=== FASE 1: LECTURAS ===');

            // 1. Leer productos y lotes para cada item
            const productReads = [];
            const lotesReads = [];

            for (const item of items) {
                if (!item.id) {
                    throw new Error(`Item sin ID: ${item.name || 'desconocido'}`);
                }

                // Leer documento del producto
                const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(item.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists) {
                    throw new Error(`Producto no encontrado: ${item.name || item.id}`);
                }

                const productData = productDoc.data();

                // Leer lotes disponibles ordenados por FIFO
                const lotesSnapshot = await db
                    .collection(COLLECTIONS.STOCK_BY_LOT)
                    .where('productoId', '==', item.id)
                    .where('cantidad', '>', 0)
                    .get();

                // Ordenar lotes por fecha de ingreso (FIFO)
                const lotes = [];
                lotesSnapshot.forEach((doc) => {
                    lotes.push({
                        id: doc.id,
                        ref: doc.ref,
                        ...doc.data(),
                    });
                });

                lotes.sort((a, b) => {
                    const resolveDate = (value) => {
                        if (value?.toDate) return value.toDate();
                        if (typeof value === 'string') return new Date(value);
                        if (value instanceof Date) return value;
                        return new Date(0);
                    };

                    const fechaA = resolveDate(a.fechaIngreso);
                    const fechaB = resolveDate(b.fechaIngreso);

                    if (fechaA.getTime() === fechaB.getTime()) {
                        return (a.loteId || '').localeCompare(b.loteId || '');
                    }

                    return fechaA - fechaB;
                });

                productReads.push({
                    ref: productRef,
                    data: productData,
                    item: item,
                });

                lotesReads.push({
                    item: item,
                    lotes: lotes,
                    productData: productData,
                });

                console.log(`Producto ${item.name}: ${lotes.length} lotes encontrados`);
            }

            // 2. Validar stock disponible para cada producto
            console.log('=== VALIDANDO STOCK DISPONIBLE ===');
            for (const { item, lotes, productData } of lotesReads) {
                let stockTotal = 0;

                if (lotes.length > 0) {
                    // Calcular stock desde lotes
                    stockTotal = lotes.reduce((sum, lote) => sum + (lote.cantidad || 0), 0);
                } else {
                    // Fallback: usar stock directo del producto (modo legacy)
                    stockTotal = productData.stock || 0;
                }

                if (stockTotal < item.quantity) {
                    throw new Error(
                        `Stock insuficiente para ${item.name}. Disponible: ${stockTotal}, Requerido: ${item.quantity}`
                    );
                }

                console.log(`${item.name}: Stock suficiente (${stockTotal} >= ${item.quantity})`);
            }

            console.log('=== FASE 2: ESCRITURAS ===');

            // 3. Crear documento de venta
            const saleRef = db.collection(COLLECTIONS.SALES).doc();
            const saleId = saleRef.id;

            console.log('ID de venta generado:', saleId);

            const lotesInfo = [];
            const stockUpdates = [];
            let costoRealTotal = 0;

            // 4. Procesar cada producto (actualizar lotes y crear movimientos)
            for (const { item, lotes, productData } of lotesReads) {
                console.log(`Procesando ${item.name} (${item.quantity} unidades)`);

                let cantidadPendiente = item.quantity;
                const lotesAfectados = [];
                let costoProducto = 0;
                let nuevoStock = 0;

                if (lotes.length > 0) {
                    // Procesar con lotes FIFO
                    for (const lote of lotes) {
                        if (cantidadPendiente <= 0) break;

                        const cantidadDisponible = lote.cantidad || 0;
                        if (cantidadDisponible <= 0) continue;

                        const cantidadTomada = Math.min(cantidadDisponible, cantidadPendiente);
                        const costoUnitario = lote.costoUnitario || item.cost || item.acquisitionCost || 0;
                        const costoLote = cantidadTomada * costoUnitario;

                        // Actualizar cantidad en lote
                        transaction.update(lote.ref, {
                            cantidad: cantidadDisponible - cantidadTomada,
                            ultimaActualizacion: getServerTimestampValue(),
                        });

                        // Registrar movimiento de inventario
                        const movimientoRef = db.collection(COLLECTIONS.INVENTORY_MOVEMENTS).doc();
                        transaction.set(movimientoRef, {
                            fecha: currentDate,
                            timestamp: getServerTimestampValue(),
                            productoId: item.id,
                            productoNombre: item.name || '',
                            loteId: lote.loteId || lote.id,
                            cantidad: cantidadTomada,
                            tipo: 'salida',
                            subtipo: 'venta',
                            ventaId: saleId,
                            relatedTo: 'venta',
                            relatedId: saleId,
                            costoUnitario: costoUnitario,
                            costoTotal: costoLote,
                            usuario: currentUserEmail,
                            observaciones: `Venta a ${customerName} - ${saleId}`,
                        });

                        lotesAfectados.push({
                            loteId: lote.loteId || lote.id,
                            cantidadTomada,
                            costoUnitario,
                            costoTotal: costoLote,
                            fechaIngreso: lote.fechaIngreso || null,
                        });

                        cantidadPendiente -= cantidadTomada;
                        costoProducto += costoLote;

                        console.log(`  Lote ${lote.loteId}: -${cantidadTomada} unidades, costo: S/ ${costoLote.toFixed(2)}`);
                    }

                    if (cantidadPendiente > 0) {
                        throw new Error(
                            `No hay suficiente stock en lotes para ${item.name}. Falta: ${cantidadPendiente}`
                        );
                    }

                    // Recalcular stock real del producto sumando lotes restantes
                    nuevoStock = lotes.reduce((sum, lote) => {
                        const cantidadOriginal = lote.cantidad || 0;
                        const afectado = lotesAfectados.find(la => la.loteId === (lote.loteId || lote.id));
                        const cantidadRestante = afectado ? cantidadOriginal - afectado.cantidadTomada : cantidadOriginal;
                        return sum + Math.max(0, cantidadRestante);
                    }, 0);

                    // Actualizar stock del producto
                    const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(item.id);
                    transaction.update(productRef, {
                        stock: nuevoStock,
                    });

                    console.log(`  Stock actualizado: ${nuevoStock}`);
                } else {
                    // Modo legacy sin lotes
                    console.log(`  Procesando sin lotes (modo legacy)`);
                    const costoUnitario = productData.acquisitionCost || 0;
                    const costoLote = item.quantity * costoUnitario;
                    nuevoStock = (productData.stock || 0) - item.quantity;

                    // Actualizar stock
                    const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(item.id);
                    transaction.update(productRef, {
                        stock: Math.max(0, nuevoStock),
                    });

                    // Registrar movimiento sin lote
                    const movimientoRef = db.collection(COLLECTIONS.INVENTORY_MOVEMENTS).doc();
                    transaction.set(movimientoRef, {
                        fecha: currentDate,
                        timestamp: getServerTimestampValue(),
                        productoId: item.id,
                        productoNombre: item.name || '',
                        loteId: 'sin-lote',
                        cantidad: item.quantity,
                        tipo: 'salida',
                        subtipo: 'venta',
                        ventaId: saleId,
                        relatedTo: 'venta',
                        relatedId: saleId,
                        costoUnitario: costoUnitario,
                        costoTotal: costoLote,
                        usuario: currentUserEmail,
                        observaciones: `Venta a ${customerName} - ${saleId} (modo legacy sin lotes)`,
                    });

                    lotesAfectados.push({
                        loteId: 'sin-lote',
                        cantidadTomada: item.quantity,
                        costoUnitario,
                        costoTotal: costoLote,
                    });

                    costoProducto = costoLote;
                    console.log(`  Stock actualizado: ${nuevoStock}, costo: S/ ${costoLote.toFixed(2)}`);
                }

                costoRealTotal += costoProducto;

                // Agregar actualización de stock para el cache
                stockUpdates.push({
                    productId: item.id,
                    stockRestante: nuevoStock,
                });

                lotesInfo.push({
                    productId: item.id,
                    productName: item.name,
                    lotesAfectados,
                    costoTotal: costoProducto,
                    costoUnitarioPromedio: costoProducto / item.quantity,
                });
            }

            // 5. Crear documento de venta con datos finales
            const gananciaReal = totalSale - costoRealTotal;

            transaction.set(saleRef, {
                customerName,
                customerPhone,
                paymentMethod,
                deliveryMethod,
                deliveryLocation: deliveryLocation || null,
                deliveryCost: deliveryCost || 0,
                items,
                subtotalSale,
                totalSale,
                totalCost: costoRealTotal,
                profit: gananciaReal,
                timestamp: getServerTimestampValue(),
                date: currentDate,
                soldBy: currentUserEmail,
                lotesInfo: lotesInfo.map((info) => ({
                    productId: info.productId,
                    productName: info.productName,
                    lotesAfectados: info.lotesAfectados.length,
                    costoTotal: info.costoTotal,
                    costoUnitarioPromedio: info.costoUnitarioPromedio,
                })),
            });

            console.log('=== RESUMEN DE TRANSACCIÓN ===');
            console.log('Costo real total:', costoRealTotal);
            console.log('Ganancia real:', gananciaReal);
            console.log('Lotes procesados:', lotesInfo.reduce((sum, info) => sum + info.lotesAfectados.length, 0));

            return {
                saleId,
                subtotalSale,
                totalSale,
                deliveryCost: deliveryCost || 0,
                totalCostReal: costoRealTotal,
                profit: gananciaReal,
                lotesInfo,
                stockUpdates,
            };
        });

        console.log('✅ Transacción completada exitosamente');
    } catch (error) {
        console.error('❌ Error en transacción de venta:', error);
        throw new Error(`Error procesando la venta: ${error.message}`);
    }

    // === POST-TRANSACCIÓN: Movimiento de caja (no crítico) ===
    console.log('=== REGISTRANDO MOVIMIENTO DE CAJA ===');
    try {
        if (typeof window !== 'undefined' && typeof window.registrarMovimientoCaja === 'function') {
            await window.registrarMovimientoCaja(
                'entrada',
                totalSale,
                'ventas',
                `Venta a ${customerName} - ${items.length} productos`,
                'venta',
                result.saleId
            );
        } else {
            await db.collection(COLLECTIONS.CASH_MOVEMENTS).add({
                tipo: 'entrada',
                monto: totalSale,
                categoria: 'ventas',
                descripcion: `Venta a ${customerName} - ${items.length} productos`,
                fecha: currentDate,
                timestamp: getServerTimestampValue(),
                usuario: currentUserEmail,
                relatedTo: 'venta',
                relatedId: result.saleId,
            });
        }
        console.log('✅ Movimiento de caja registrado');
    } catch (error) {
        console.error('⚠️ Error registrando movimiento de caja (venta ya completada):', error);
        // No lanzamos error porque la venta ya fue exitosa
    }

    console.log('=== VENTA COMPLETADA ===');
    return {
        ...result,
        totalLotesAfectados: result.lotesInfo.reduce((sum, info) => sum + info.lotesAfectados.length, 0),
        totalMovimientos: result.lotesInfo.reduce((sum, info) => sum + info.lotesAfectados.length, 0),
    };
}
