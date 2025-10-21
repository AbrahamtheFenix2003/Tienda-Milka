import { db, storage } from '../../services/firebase.js';

export function getStorageInstance() {
  return storage;
}

export const comprasState = {
  productosCompraActual: [],
  productosEditandoActual: [],
  productosOriginalEditando: [],
  compraEditandoId: null,
  editandoCompra: false,
  initialized: false,
};

let notificationHandler = null;
let comprasTableRenderer = null;
let integrationTester = null;

export function setComprasNotificationHandler(handler) {
  notificationHandler = typeof handler === 'function' ? handler : null;
}

export function setComprasTableRenderer(renderer) {
  comprasTableRenderer = typeof renderer === 'function' ? renderer : null;
}

export function setComprasIntegrationTester(handler) {
  integrationTester = typeof handler === 'function' ? handler : null;
}

function notify(message, type = 'info') {
  if (notificationHandler) {
    try {
      notificationHandler(message, type);
      return;
    } catch (error) {
      console.warn('Notification handler for compras failed:', error);
    }
  }

  if (type === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
}

function renderComprasTable(compras) {
  if (typeof comprasTableRenderer === 'function') {
    try {
      comprasTableRenderer(compras);
    } catch (error) {
      console.error('Compras table renderer failed:', error);
    }
  }
}

async function runIntegrationTest(compraId) {
  if (typeof integrationTester === 'function') {
    try {
      await integrationTester(compraId);
    } catch (error) {
      console.warn('Compras integration tester failed:', error);
    }
  }
}

// Helper para parsear fechas en formato YYYY-MM-DD como fechas locales
function parseLocalDate(dateString) {
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(dateString);
}

const comprasData = {

    async loadAllData() {
        try {
            // Cargar proveedores primero
            await this.loadProveedores();
            
            // Cargar compras
            await this.loadCompras();
            
            // Cargar productos para el selector
            this.loadProductosSelector();
            
            // Actualizar estadísticas
            this.updateStats();
            
        } catch (error) {
            console.error('Error cargando datos de compras:', error);
            notify('Error cargando datos de compras', 'error');
        }
    },

    async loadProveedores() {
        try {
            const querySnapshot = await db.collection('proveedores').get();
            window.proveedoresCache = [];
            querySnapshot.forEach((doc) => {
                window.proveedoresCache.push({ id: doc.id, ...doc.data() });
            });
            
            // Actualizar selectores
            this.updateProveedoresSelectors();
            
            console.log(`Cargados ${window.proveedoresCache.length} proveedores`);
        } catch (error) {
            console.error('Error cargando proveedores:', error);
            window.proveedoresCache = [];
        }
    },

    async loadCompras() {
        try {
            const querySnapshot = await db.collection('compras').orderBy('fecha', 'desc').get();
            window.comprasCache = [];
            querySnapshot.forEach((doc) => {
                window.comprasCache.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`Cargadas ${window.comprasCache.length} compras`);
            this.filterCompras();
        } catch (error) {
            console.error('Error cargando compras:', error);
            window.comprasCache = [];
        }
    },

    updateProveedoresSelectors() {
        // Selector en nueva compra
        const selectorCompra = document.getElementById('proveedor-compra');
        if (selectorCompra) {
            selectorCompra.innerHTML = '<option value="">Seleccionar proveedor</option>';
        }
        
        // Filtro
        const filtroProveedor = document.getElementById('filter-proveedor');
        if (filtroProveedor) {
            filtroProveedor.innerHTML = '<option value="">Todos los proveedores</option>';
        }
        
        if (window.proveedoresCache) {
            window.proveedoresCache.forEach(proveedor => {
                if (selectorCompra) {
                    const optionCompra = new Option(proveedor.nombre, proveedor.id);
                    selectorCompra.appendChild(optionCompra);
                }
                
                if (filtroProveedor) {
                    const optionFiltro = new Option(proveedor.nombre, proveedor.id);
                    filtroProveedor.appendChild(optionFiltro);
                }
            });
        }
    },

    loadProductosSelector() {
        const selector = document.getElementById('producto-seleccion');
        if (selector) {
            selector.innerHTML = '<option value="">Seleccionar producto</option>';
            
            if (window.productsCache) {
                window.productsCache.forEach(product => {
                    const option = new Option(product.name, product.id);
                    selector.appendChild(option);
                });
            }
        }
    },

    updateStats() {
        if (!window.comprasCache) {
            console.log('comprasCache no disponible para actualizar estadísticas');
            return;
        }

        const fechaActual = new Date();
        const mesActual = fechaActual.getMonth();
        const añoActual = fechaActual.getFullYear();

        // Compras del mes actual
        const comprasMes = window.comprasCache.filter(compra => {
            const fechaCompra = parseLocalDate(compra.fecha);
            return fechaCompra.getMonth() === mesActual && fechaCompra.getFullYear() === añoActual;
        });

        // Inversión total
        const inversionTotal = window.comprasCache.reduce((sum, compra) => sum + (compra.totalInvertido || 0), 0);

        // Total de proveedores registrados
        const totalProveedores = window.proveedoresCache ? window.proveedoresCache.length : 0;

        // Actualizar elementos del DOM
        this.updateElement('compras-mes', comprasMes.length);
        this.updateElement('inversion-total', `S/ ${inversionTotal.toFixed(2)}`);
        this.updateElement('total-proveedores', totalProveedores);

        console.log(`Estadísticas actualizadas - Proveedores: ${totalProveedores}, Compras del mes: ${comprasMes.length}`);
    },

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        } else {
            console.log(`Elemento ${id} no encontrado para actualizar`);
        }
    },

    filterCompras() {
        if (!window.comprasCache) return;
        
        const search = this.getElementValue('search-compras', '').toLowerCase();
        const proveedorFilter = this.getElementValue('filter-proveedor', '');
        const fechaDesde = this.getElementValue('filter-fecha-desde', '');
        const fechaHasta = this.getElementValue('filter-fecha-hasta', '');
        
        const comprasFiltradas = window.comprasCache.filter(compra => {
            const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
            const nombreProveedor = proveedor ? proveedor.nombre.toLowerCase() : '';
            
            const matchSearch = nombreProveedor.includes(search) || 
                               (compra.factura && compra.factura.toLowerCase().includes(search));
            
            const matchProveedor = !proveedorFilter || compra.proveedorId === proveedorFilter;
            
            let matchFecha = true;
            if (fechaDesde || fechaHasta) {
                const fechaCompra = parseLocalDate(compra.fecha);
                if (fechaDesde) {
                    matchFecha = matchFecha && fechaCompra >= parseLocalDate(fechaDesde);
                }
                if (fechaHasta) {
                    matchFecha = matchFecha && fechaCompra <= parseLocalDate(fechaHasta);
                }
            }
            
            return matchSearch && matchProveedor && matchFecha;
        });
        
        renderComprasTable(comprasFiltradas);
        this.updateElement('compras-count', `Mostrando ${comprasFiltradas.length} compras`);
    },

    getElementValue(id, defaultValue = '') {
        const element = document.getElementById(id);
        return element ? element.value : defaultValue;
    },

    async registrarCompra(formData) {
        try {
            console.log('Productos para calcular total:', comprasState.productosCompraActual);
            
            const totalInvertido = comprasState.productosCompraActual.reduce((sum, p) => {
                const subtotal = p.cantidad * p.precioCompra;
                console.log(`Producto: ${p.nombre}, Cantidad: ${p.cantidad}, Precio: ${p.precioCompra}, Subtotal: ${subtotal}`);
                return sum + subtotal;
            }, 0);
            
            console.log('Total invertido calculado:', totalInvertido);
            
            if (totalInvertido <= 0) {
                notify('Error: El total de la compra debe ser mayor a 0', 'error');
                return false;
            }
            
            const compra = {
                proveedorId: formData.proveedorId,
                fecha: formData.fecha,
                factura: formData.factura,
                metodoPago: formData.metodoPago,
                observaciones: formData.observaciones,
                productos: comprasState.productosCompraActual.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precioCompra: p.precioCompra,
                    subtotal: p.cantidad * p.precioCompra,
                    loteInfo: p.loteInfo || null // Incluir información del lote
                })),
                totalInvertido: totalInvertido,
                totalVendido: 0,
                estado: 'Registrada', // Estado inicial de la compra
                cantidadProductos: comprasState.productosCompraActual.length,
                usuario: window.currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Registrar la compra
            const compraRef = await db.collection('compras').add(compra);
            
            // Actualizar stock de productos
            await this.updateProductStock(comprasState.productosCompraActual);
            
            // Crear lotes en stock_por_lote
            await this.createProductLots(comprasState.productosCompraActual, formData, compraRef.id);
            
            // Registrar movimientos de inventario
            await this.registerStockMovements(comprasState.productosCompraActual, formData.fecha, formData.factura, compraRef.id, formData);
            
            // Registrar egreso en caja
            await this.registrarEgresoCaja(formData, totalInvertido, compraRef.id);
            
            // Recargar datos
            await this.loadCompras();
            this.updateStats();
            
            // Verificar que la integración completa funcionó correctamente
            setTimeout(async () => {
                await runIntegrationTest(compraRef.id);
            }, 1500);
            
            notify('Compra registrada con integración completa: lotes, inventario y caja', 'success');
            return true;
            
        } catch (error) {
            console.error('Error registrando compra:', error);
            notify('Error al registrar la compra', 'error');
            return false;
        }
    },

    async updateProductStock(productos) {
        const batch = db.batch();
        
        for (const producto of productos) {
            const productoRef = db.collection('products').doc(producto.id);
            const productoDoc = await productoRef.get();
            
            if (productoDoc.exists) {
                const stockActual = productoDoc.data().stock || 0;
                batch.update(productoRef, {
                    stock: stockActual + producto.cantidad
                });
                
                // Actualizar cache local
                const productIndex = window.productsCache?.findIndex(p => p.id === producto.id);
                if (productIndex !== -1 && window.productsCache) {
                    window.productsCache[productIndex].stock = stockActual + producto.cantidad;
                }
            }
        }
        
        await batch.commit();
    },

    async createProductLots(productos, formData, compraId) {
        const batch = db.batch();
        
        for (const producto of productos) {
            const loteInfo = producto.loteInfo || {};
            
            // Generar ID de lote si no se especificó
            const loteId = loteInfo.numero || `AUTO-${producto.id.substring(0, 8)}-${Date.now()}`;
            
            const loteData = {
                productoId: producto.id,
                loteId: loteId,
                cantidad: producto.cantidad,
                cantidadOriginal: producto.cantidad,
                costoUnitario: producto.precioCompra,
                fechaIngreso: firebase.firestore.FieldValue.serverTimestamp(),
                fechaVencimiento: loteInfo.fechaVencimiento || null,
                proveedorId: formData.proveedorId,
                compraId: compraId,
                estado: 'activo',
                esLegacy: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const loteRef = db.collection('stock_por_lote').doc();
            batch.set(loteRef, loteData);
        }
        
        await batch.commit();
        console.log('Lotes creados correctamente para la compra');
    },

    async registerStockMovements(productos, fecha, factura, compraId, formData) {
        try {
            const batch = db.batch();
            
            for (const producto of productos) {
                // Obtener nombre del proveedor
                const proveedor = window.proveedoresCache?.find(p => p.id === formData?.proveedorId);
                const proveedorNombre = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
                
                const movimiento = {
                    fecha: firebase.firestore.FieldValue.serverTimestamp(),
                    productoId: producto.id,
                    productoNombre: producto.nombre,
                    cantidad: producto.cantidad,
                    tipo: 'entrada', // Tipo 'entrada' para compras
                    compraId: compraId,
                    proveedorId: formData?.proveedorId || null,
                    proveedorNombre: proveedorNombre,
                    costoUnitario: producto.precioCompra,
                    costoTotal: producto.cantidad * producto.precioCompra,
                    loteInfo: producto.loteInfo || null,
                    usuario: window.currentUser?.email || 'sistema',
                    observaciones: `Compra - Factura: ${factura}`
                };
                
                const movimientoRef = db.collection('movimientos_inventario').doc();
                batch.set(movimientoRef, movimiento);
            }
            
            await batch.commit();
            console.log('Movimientos de inventario registrados exitosamente');
        } catch (error) {
            console.error('Error registrando movimientos de inventario:', error);
        }
    },

    async registrarEgresoCaja(formData, totalInvertido, compraId) {
        try {
            console.log('Registrando egreso en caja:', { totalInvertido, compraId });
            
            // Validar que el monto sea válido
            if (!totalInvertido || totalInvertido <= 0) {
                console.error('Error: Total invertido inválido:', totalInvertido);
                return false;
            }
            
            const proveedor = window.proveedoresCache?.find(p => p.id === formData.proveedorId);
            const proveedorNombre = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
            
            // Usar la función registrarMovimientoCaja para mantener consistencia
            if (window.registrarMovimientoCaja) {
                const descripcion = `Compra a proveedor: ${proveedorNombre} - Factura: ${formData.factura || 'Sin número'}`;
                await window.registrarMovimientoCaja(
                    'salida', 
                    parseFloat(totalInvertido), 
                    'compras', 
                    descripcion, 
                    'compra', 
                    compraId
                );
            } else {
                // Fallback al método anterior si la función no está disponible
                const egresoData = {
                    fecha: new Date().toISOString().split('T')[0],
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    tipo: 'salida',
                    monto: parseFloat(totalInvertido),
                    categoria: 'compras',
                    descripcion: `Compra a proveedor: ${proveedorNombre} - Factura: ${formData.factura || 'Sin número'}`,
                    compraId: compraId,
                    proveedorId: formData.proveedorId,
                    proveedorNombre: proveedorNombre,
                    metodoPago: formData.metodoPago,
                    numeroFactura: formData.factura || '',
                    observaciones: formData.observaciones || `Compra de productos registrada el ${new Date().toLocaleDateString()}`,
                    usuario: window.currentUser?.email || 'sistema',
                    relatedTo: 'compra',
                    relatedId: compraId
                };
                
                await db.collection('movimientos_caja').add(egresoData);
            }
            console.log('Egreso de caja registrado exitosamente con monto:', totalInvertido);
            return true;
        } catch (error) {
            console.error('Error al registrar egreso en caja:', error);
            return false;
        }
    },

    async crearProveedor(proveedorData) {
        try {
            const proveedor = {
                ...proveedorData,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                usuario: window.currentUser.email
            };
            
            await db.collection('proveedores').add(proveedor);
            await this.loadProveedores();
            this.updateStats();
            
            notify('Proveedor creado correctamente', 'success');
            return true;
            
        } catch (error) {
            console.error('Error creando proveedor:', error);
            notify('Error al crear el proveedor', 'error');
            return false;
        }
    },

    async eliminarProveedor(proveedorId) {
        try {
            await db.collection('proveedores').doc(proveedorId).delete();
            await this.loadProveedores();
            this.updateStats();
            
            notify('Proveedor eliminado correctamente', 'success');
            return true;
            
        } catch (error) {
            console.error('Error eliminando proveedor:', error);
            notify('Error al eliminar el proveedor', 'error');
            return false;
        }
    },

    // ======================== FUNCIONES DE EDICIÓN DE COMPRAS ========================

    async actualizarCompra(formData) {
        try {
            console.log('Iniciando actualización de compra:', formData.compraId);
            
            const { compraId, productosOriginales, productosNuevos } = formData;
            
            // Calcular nuevo total invertido
            const nuevoTotalInvertido = productosNuevos.reduce((sum, p) => sum + (p.cantidad * p.precioCompra), 0);
            
            if (nuevoTotalInvertido <= 0) {
                notify('Error: El total de la compra debe ser mayor a 0', 'error');
                return false;
            }
            
            // Obtener compra original
            const compraOriginal = window.comprasCache?.find(c => c.id === compraId);
            if (!compraOriginal) {
                notify('Error: Compra original no encontrada', 'error');
                return false;
            }
            
            const totalOriginal = compraOriginal.totalInvertido || 0;
            const diferenciaCaja = nuevoTotalInvertido - totalOriginal;
            
            // Preparar datos de la compra actualizada
            const compraActualizada = {
                proveedorId: formData.proveedorId,
                fecha: formData.fecha,
                factura: formData.factura,
                metodoPago: formData.metodoPago,
                observaciones: formData.observaciones,
                productos: productosNuevos.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precioCompra: p.precioCompra,
                    subtotal: p.cantidad * p.precioCompra,
                    loteInfo: p.loteInfo || null
                })),
                totalInvertido: nuevoTotalInvertido,
                cantidadProductos: productosNuevos.length,
                usuario: window.currentUser.email,
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Ejecutar todas las actualizaciones
            await this.ejecutarActualizacionCompra(compraId, compraActualizada, productosOriginales, productosNuevos, diferenciaCaja, formData);
            
            // Recargar datos
            await this.loadCompras();
            this.updateStats();
            
            notify('Compra actualizada correctamente con todos los ajustes', 'success');
            return true;
            
        } catch (error) {
            console.error('Error actualizando compra:', error);
            notify('Error al actualizar la compra: ' + error.message, 'error');
            return false;
        }
    },
    
    async ejecutarActualizacionCompra(compraId, compraActualizada, productosOriginales, productosNuevos, diferenciaCaja, formData) {
        console.log('=== INICIO ACTUALIZACIÓN COMPRA ===');
        console.log('CompraId:', compraId);
        console.log('Productos originales:', JSON.stringify(productosOriginales, null, 2));
        console.log('Productos nuevos:', JSON.stringify(productosNuevos, null, 2));

        // 0) Calcular deltas entre productos originales y nuevos
        const deltas = this.calcularDeltasProductos(productosOriginales, productosNuevos);
        console.log('Deltas calculados:', JSON.stringify(deltas, null, 2));

        // 1) Validar reducciones seguras (no por debajo de lo ya vendido/consumido)
        await this.validarReduccionesNoMenorConsumido(compraId, deltas);

        // 2) Actualizar documento de compra (metadatos y arreglo de productos)
        await db.collection('compras').doc(compraId).update(compraActualizada);

        // 3) Aplicar cambios de lotes SOLO para productos afectados
        console.log('=== APLICANDO CAMBIOS A LOTES ===');
        await this.aplicarCambiosLotesCompra(compraId, deltas, formData);

        // 4) Registrar movimientos de ajuste en vez de borrar y recrear
        await this.aplicarAjustesMovimientos(compraId, deltas, formData);

        // 5) Reconciliar stock de productos sumando cantidades de lotes
        const idsAfectados = [
            ...new Set([
                ...productosOriginales.map(p => p.id).filter(Boolean),
                ...productosNuevos.map(p => p.id).filter(Boolean)
            ])
        ];
        console.log('=== RECONCILIANDO STOCK ===');
        console.log('IDs afectados:', idsAfectados);
        await this.reconciliarStockProductos(idsAfectados);

        // 6) Ajustar caja si hay diferencia
        if (Math.abs(diferenciaCaja) > 0.01) {
            await this.ajustarCajaCompraEditada(compraId, diferenciaCaja, formData);
        }

        console.log('=== FIN ACTUALIZACIÓN COMPRA ===');
    },

    // ======================== NUEVO FLUJO DELTA DE EDICIÓN ========================

    // Calcula agregados, eliminados y modificados considerando múltiplos por producto
    calcularDeltasProductos(productosOriginales, productosNuevos) {
        const normalizar = (arr) => {
            const map = new Map();
            (arr || []).forEach(p => {
                const id = p.id || p.productoId;
                if (!id) return;
                if (!map.has(id)) {
                    map.set(id, { ...p });
                } else {
                    const acum = map.get(id);
                    acum.cantidad = (Number(acum.cantidad) || 0) + (Number(p.cantidad) || 0);
                    // En caso de precios diferentes en duplicados, conservar el último editado
                    if (p.precioCompra != null) acum.precioCompra = p.precioCompra;
                    map.set(id, acum);
                }
            });
            return map;
        };

        const A = normalizar(productosOriginales);
        const B = normalizar(productosNuevos);

        const agregados = [];
        const eliminados = [];
        const modificados = [];

        // Detectar agregados y modificados
        for (const [id, nuevo] of B.entries()) {
            if (!A.has(id)) {
                agregados.push({ ...nuevo, id });
            } else {
                const orig = A.get(id);
                const qtyA = Number(orig.cantidad) || 0;
                const qtyB = Number(nuevo.cantidad) || 0;
                const deltaCantidad = qtyB - qtyA;
                const costoA = Number(orig.precioCompra) || 0;
                const costoB = Number(nuevo.precioCompra) || 0;
                if (deltaCantidad !== 0 || costoA !== costoB) {
                    modificados.push({ before: { ...orig, id }, after: { ...nuevo, id }, deltaCantidad });
                }
            }
        }

        // Detectar eliminados
        for (const [id, orig] of A.entries()) {
            if (!B.has(id)) {
                eliminados.push({ ...orig, id });
            }
        }

        return { agregados, eliminados, modificados };
    },

    // Verificar que no se reduzca por debajo de lo disponible (ventas reducen 'cantidad')
    async validarReduccionesNoMenorConsumido(compraId, deltas) {
        // Casos con reducción: eliminados (quitar todo) y modificados con deltaCantidad < 0
        const candidatos = [
            ...deltas.eliminados.map(p => ({ productoId: p.id || p.productoId, reducir: Number(p.cantidad) || 0 })),
            ...deltas.modificados
                .filter(m => m.deltaCantidad < 0)
                .map(m => ({ productoId: m.after.id || m.after.productoId, reducir: Math.abs(m.deltaCantidad) }))
        ];

        for (const c of candidatos) {
            if (!c.productoId || !c.reducir) continue;
            const lotesSnap = await db.collection('stock_por_lote')
                .where('compraId', '==', compraId)
                .where('productoId', '==', c.productoId)
                .get();
            let disponibleTotal = 0;
            lotesSnap.forEach(doc => {
                const d = doc.data();
                disponibleTotal += Number(d.cantidad) || 0; // ventas ya descontaron 'cantidad'
            });
            if (c.reducir > disponibleTotal) {
                throw new Error(`No se puede reducir el producto ${c.productoId} por ${c.reducir}. Disponible en compra: ${disponibleTotal}. Ya hay unidades vendidas/consumidas.`);
            }
        }
    },

    // Aplica cambios de lotes solo a productos afectados por la edición
    async aplicarCambiosLotesCompra(compraId, deltas, formData) {
        const proveedorId = formData?.proveedorId || null;
        const nowTs = firebase.firestore.FieldValue.serverTimestamp();

        // 1) Agregados: crear nuevos lotes
        for (const p of deltas.agregados) {
            const loteInfo = p.loteInfo || {};
            const loteId = loteInfo.numero || `AUTO-${(p.id || p.productoId).substring(0, 8)}-${Date.now()}`;
            const data = {
                productoId: p.id || p.productoId,
                loteId: loteId,
                cantidad: Number(p.cantidad) || 0,
                cantidadOriginal: Number(p.cantidad) || 0,
                costoUnitario: Number(p.precioCompra) || 0,
                fechaIngreso: nowTs,
                fechaVencimiento: loteInfo.fechaVencimiento || null,
                proveedorId: proveedorId,
                compraId: compraId,
                estado: 'activo',
                esLegacy: false,
                actualizado: true,
                timestamp: nowTs
            };
            await db.collection('stock_por_lote').add(data);
        }

        // 2) Modificados: ajustar cantidad/costo en lotes existentes de esta compra
        for (const m of deltas.modificados) {
            const productoId = m.after.id || m.after.productoId;
            const lotesSnap = await db.collection('stock_por_lote')
                .where('compraId', '==', compraId)
                .where('productoId', '==', productoId)
                .get();

            console.log(`Modificando producto ${productoId}: delta=${m.deltaCantidad}, lotes encontrados=${lotesSnap.size}`);

            let restante = m.deltaCantidad; // puede ser negativo, cero o positivo
            // Aplica delta distribuyéndolo entre los lotes de la compra (si hubiera varios)
            for (const doc of lotesSnap.docs) {
                if (restante === 0) break;
                const d = doc.data();
                const actual = Number(d.cantidad) || 0;
                if (restante > 0) {
                    // Aumentar
                    const nuevo = actual + restante;
                    console.log(`Aumentando lote ${doc.id}: ${actual} → ${nuevo}`);
                    await doc.ref.update({
                        cantidad: nuevo,
                        // cantidadOriginal opcionalmente también puede aumentar si consideramos que es la compra editada
                        cantidadOriginal: (Number(d.cantidadOriginal) || actual) + restante,
                        costoUnitario: Number(m.after.precioCompra) || Number(d.costoUnitario) || 0,
                        actualizado: true,
                        timestamp: nowTs
                    });
                    restante = 0;
                } else {
                    // Disminuir sin dejar negativo
                    const reducir = Math.min(actual, Math.abs(restante));
                    const nuevo = actual - reducir;
                    const cantidadOriginalActual = Number(d.cantidadOriginal) || actual;
                    const nuevaCantidadOriginal = Math.max(0, cantidadOriginalActual - reducir);

                    console.log(`Disminuyendo lote ${doc.id}:`);
                    console.log(`  - Cantidad: ${actual} → ${nuevo} (reducir: ${reducir})`);
                    console.log(`  - CantidadOriginal: ${cantidadOriginalActual} → ${nuevaCantidadOriginal}`);

                    await doc.ref.update({
                        cantidad: nuevo,
                        cantidadOriginal: nuevaCantidadOriginal, // Reducir también cantidadOriginal al editar compra
                        costoUnitario: Number(m.after.precioCompra) || Number(d.costoUnitario) || 0,
                        actualizado: true,
                        timestamp: nowTs
                    });

                    console.log(`  ✓ Lote actualizado en Firestore`);
                    restante += reducir; // restante es negativo, al sumar reducir se acerca a 0
                }
            }

            // Si no se encontraron lotes o quedó restante sin aplicar, loguear advertencia
            if (lotesSnap.size === 0) {
                console.warn(`⚠️ No se encontraron lotes para el producto ${productoId} en compra ${compraId}`);
            }
            if (restante !== 0) {
                console.warn(`⚠️ Quedó restante sin aplicar: ${restante} para producto ${productoId}`);
            }
        }

        // 3) Eliminados: retirar lotes de la compra (solo si no hay consumo; validado antes)
        for (const p of deltas.eliminados) {
            const productoId = p.id || p.productoId;
            const lotesSnap = await db.collection('stock_por_lote')
                .where('compraId', '==', compraId)
                .where('productoId', '==', productoId)
                .get();
            for (const doc of lotesSnap.docs) {
                // Se puede borrar directamente; la validación ya aseguró que la suma disponible alcanza
                await doc.ref.delete();
            }
        }
    },

    // Registra movimientos de ajuste por edición de compra (no borra históricos)
    async aplicarAjustesMovimientos(compraId, deltas, formData) {
        const batch = db.batch();
        const proveedor = window.proveedoresCache?.find(p => p.id === formData?.proveedorId);
        const proveedorNombre = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
        const usuario = window.currentUser?.email || 'sistema';

        const registrar = (productoId, productoNombre, deltaCantidad, precioCompra) => {
            if (!deltaCantidad) return;
            const movimientoRef = db.collection('movimientos_inventario').doc();
            batch.set(movimientoRef, {
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                productoId,
                productoNombre: productoNombre || '',
                cantidad: deltaCantidad, // + entra, - sale
                tipo: deltaCantidad > 0 ? 'entrada' : 'salida',
                subtipo: 'ajuste_compra_editada',
                compraId,
                proveedorId: formData?.proveedorId || null,
                proveedorNombre,
                costoUnitario: Number(precioCompra) || 0,
                costoTotal: Math.abs(deltaCantidad) * (Number(precioCompra) || 0),
                loteInfo: null,
                usuario,
                observaciones: `Ajuste por edición de compra - Factura: ${formData?.factura || ''}`,
                editado: true
            });
        };

        deltas.agregados.forEach(p => registrar(p.id || p.productoId, p.nombre, Number(p.cantidad) || 0, p.precioCompra));
        deltas.modificados.forEach(m => registrar(m.after.id || m.after.productoId, m.after.nombre, m.deltaCantidad, m.after.precioCompra));
        deltas.eliminados.forEach(p => registrar(p.id || p.productoId, p.nombre, -(Number(p.cantidad) || 0), p.precioCompra));

        await batch.commit();
    },

    // Recalcula y sincroniza stock del producto sumando cantidades de todos sus lotes
    async reconciliarStockProductos(productIds = []) {
        const ids = [...new Set((productIds || []).filter(Boolean))];
        console.log(`=== RECONCILIANDO STOCK DE ${ids.length} PRODUCTOS ===`);

        for (const productoId of ids) {
            console.log(`\n📦 Procesando producto: ${productoId}`);

            const lotesSnap = await db.collection('stock_por_lote')
                .where('productoId', '==', productoId)
                .get();

            let total = 0;
            const lotes = [];
            lotesSnap.forEach(doc => {
                const d = doc.data();
                const cantidad = Number(d.cantidad) || 0;
                const cantidadOriginal = Number(d.cantidadOriginal) || 0;
                lotes.push({
                    id: doc.id,
                    loteId: d.loteId,
                    cantidad,
                    cantidadOriginal,
                    compraId: d.compraId
                });
                total += cantidad;
            });

            console.log(`  - Lotes encontrados: ${lotesSnap.size}`);
            console.log(`  - Stock total calculado: ${total}`);
            console.log(`  - Detalle de lotes:`, lotes);

            // Obtener stock actual antes de la actualización
            const productoDoc = await db.collection('products').doc(productoId).get();
            const stockAnterior = productoDoc.exists ? (productoDoc.data().stock || 0) : 0;

            await db.collection('products').doc(productoId).update({ stock: total });
            console.log(`  ✓ Stock actualizado en Firestore: ${stockAnterior} → ${total}`);

            // Actualizar cache local si existe
            if (window.productsCache) {
                const idx = window.productsCache.findIndex(p => p.id === productoId);
                if (idx !== -1) {
                    window.productsCache[idx].stock = total;
                    console.log(`  ✓ Cache local actualizado`);
                }
            }
        }

        console.log(`\n=== FIN RECONCILIACIÓN ===\n`);
    },
    
    async procesarCambiosProductos(compraId, productosOriginales, productosNuevos) {
        const batch = db.batch();
        
        // Mapear productos por ID para comparación
        const productosOriginalesMap = new Map();
        productosOriginales.forEach(p => {
            const key = p.id;
            if (productosOriginalesMap.has(key)) {
                productosOriginalesMap.get(key).cantidad += p.cantidad;
            } else {
                productosOriginalesMap.set(key, { ...p });
            }
        });
        
        const productosNuevosMap = new Map();
        productosNuevos.forEach(p => {
            const key = p.id;
            if (productosNuevosMap.has(key)) {
                productosNuevosMap.get(key).cantidad += p.cantidad;
            } else {
                productosNuevosMap.set(key, { ...p });
            }
        });
        
        // Encontrar todos los productos afectados
        const todosLosProductos = new Set([...productosOriginalesMap.keys(), ...productosNuevosMap.keys()]);
        
        for (const productoId of todosLosProductos) {
            const productoOriginal = productosOriginalesMap.get(productoId);
            const productoNuevo = productosNuevosMap.get(productoId);
            
            const cantidadOriginal = productoOriginal ? productoOriginal.cantidad : 0;
            const cantidadNueva = productoNuevo ? productoNuevo.cantidad : 0;
            const diferenciaCantidad = cantidadNueva - cantidadOriginal;
            
            if (diferenciaCantidad !== 0) {
                // Actualizar stock del producto
                const productoRef = db.collection('products').doc(productoId);
                const productoDoc = await productoRef.get();
                
                if (productoDoc.exists) {
                    const stockActual = productoDoc.data().stock || 0;
                    const nuevoStock = stockActual + diferenciaCantidad;
                    
                    batch.update(productoRef, { stock: nuevoStock });
                    
                    // Actualizar cache local
                    const productIndex = window.productsCache?.findIndex(p => p.id === productoId);
                    if (productIndex !== -1 && window.productsCache) {
                        window.productsCache[productIndex].stock = nuevoStock;
                    }
                    
                    console.log(`Stock actualizado para producto ${productoId}: ${stockActual} → ${nuevoStock} (diferencia: ${diferenciaCantidad})`);
                }
            }
        }
        
        await batch.commit();
    },
    
    async actualizarLotesCompra(compraId, productosOriginales, productosNuevos, formData) {
        // Eliminar lotes originales de la compra
        const lotesOriginales = await db.collection('stock_por_lote')
            .where('compraId', '==', compraId)
            .get();
        
        const batch = db.batch();
        
        lotesOriginales.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Crear nuevos lotes para los productos actualizados
        for (const producto of productosNuevos) {
            const loteInfo = producto.loteInfo || {};
            const loteId = loteInfo.numero || `AUTO-${producto.id.substring(0, 8)}-${Date.now()}`;
            
            const loteData = {
                productoId: producto.id,
                loteId: loteId,
                cantidad: producto.cantidad,
                cantidadOriginal: producto.cantidad,
                costoUnitario: producto.precioCompra,
                fechaIngreso: firebase.firestore.FieldValue.serverTimestamp(),
                fechaVencimiento: loteInfo.fechaVencimiento || null,
                proveedorId: formData.proveedorId,
                compraId: compraId,
                estado: 'activo',
                esLegacy: false,
                actualizado: true,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const loteRef = db.collection('stock_por_lote').doc();
            batch.set(loteRef, loteData);
        }
        
        await batch.commit();
        console.log('Lotes actualizados correctamente para la compra editada');
    },
    
    async actualizarMovimientosInventario(compraId, productosOriginales, productosNuevos, formData) {
        // Eliminar movimientos originales de la compra
        const movimientosOriginales = await db.collection('movimientos_inventario')
            .where('compraId', '==', compraId)
            .get();
        
        const batch = db.batch();
        
        movimientosOriginales.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Crear nuevos movimientos para los productos actualizados
        const proveedor = window.proveedoresCache?.find(p => p.id === formData.proveedorId);
        const proveedorNombre = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
        
        for (const producto of productosNuevos) {
            const movimiento = {
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                productoId: producto.id,
                productoNombre: producto.nombre,
                cantidad: producto.cantidad,
                tipo: 'entrada',
                compraId: compraId,
                proveedorId: formData.proveedorId,
                proveedorNombre: proveedorNombre,
                costoUnitario: producto.precioCompra,
                costoTotal: producto.cantidad * producto.precioCompra,
                loteInfo: producto.loteInfo || null,
                usuario: window.currentUser?.email || 'sistema',
                observaciones: `Compra editada - Factura: ${formData.factura}`,
                editado: true
            };
            
            const movimientoRef = db.collection('movimientos_inventario').doc();
            batch.set(movimientoRef, movimiento);
        }
        
        await batch.commit();
        console.log('Movimientos de inventario actualizados correctamente');
    },
    
    async ajustarCajaCompraEditada(compraId, diferencia, formData) {
        try {
            const proveedor = window.proveedoresCache?.find(p => p.id === formData.proveedorId);
            const proveedorNombre = proveedor ? proveedor.nombre : 'Proveedor no encontrado';

            if (diferencia > 0) {
                // La compra aumentó, registrar egreso adicional
                const descripcion = `Ajuste por edición de compra - ${proveedorNombre} - Factura: ${formData.factura || 'Sin número'}`;

                if (window.registrarMovimientoCaja) {
                    await window.registrarMovimientoCaja(
                        'salida',
                        Math.abs(diferencia),
                        'compras',
                        descripcion,
                        'ajuste-compra-editada',
                        compraId
                    );
                } else {
                    // Fallback
                    const egresoData = {
                        fecha: new Date().toISOString().split('T')[0],
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        tipo: 'salida',
                        monto: Math.abs(diferencia),
                        categoria: 'compras',
                        descripcion: descripcion,
                        compraId: compraId,
                        proveedorId: formData.proveedorId,
                        proveedorNombre: proveedorNombre,
                        metodoPago: formData.metodoPago,
                        observaciones: `Ajuste por edición de compra el ${new Date().toLocaleDateString()}`,
                        usuario: window.currentUser?.email || 'sistema',
                        relatedTo: 'ajuste-compra-editada',
                        relatedId: compraId
                    };

                    await db.collection('movimientos_caja').add(egresoData);
                }
            } else {
                // La compra disminuyó, registrar ingreso (devolución)
                const descripcion = `Devolución por edición de compra - ${proveedorNombre} - Factura: ${formData.factura || 'Sin número'}`;

                if (window.registrarMovimientoCaja) {
                    await window.registrarMovimientoCaja(
                        'entrada',
                        Math.abs(diferencia),
                        'compras',
                        descripcion,
                        'ajuste-compra-editada',
                        compraId
                    );
                } else {
                    // Fallback
                    const ingresoData = {
                        fecha: new Date().toISOString().split('T')[0],
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        tipo: 'entrada',
                        monto: Math.abs(diferencia),
                        categoria: 'compras',
                        descripcion: descripcion,
                        compraId: compraId,
                        proveedorId: formData.proveedorId,
                        proveedorNombre: proveedorNombre,
                        observaciones: `Devolución por edición de compra el ${new Date().toLocaleDateString()}`,
                        usuario: window.currentUser?.email || 'sistema',
                        relatedTo: 'ajuste-compra-editada',
                        relatedId: compraId
                    };

                    await db.collection('movimientos_caja').add(ingresoData);
                }
            }

            console.log(`Ajuste de caja registrado: S/ ${diferencia.toFixed(2)}`);
        } catch (error) {
            console.error('Error al ajustar caja:', error);
            throw error;
        }
    },

    // ======================== ELIMINACIÓN DE COMPRAS ========================

    /**
     * Elimina una compra y revierte todas sus operaciones asociadas de forma atómica.
     * @param {string} purchaseId - El ID de la compra a eliminar.
     * @returns {Promise<void>}
     */
    async deletePurchase(purchaseId) {
        if (!purchaseId) {
            throw new Error('Se requiere un ID de compra para eliminarla.');
        }

        try {
            // === FASE 1: LECTURAS (fuera de la transacción) ===

            // 1. Obtener la compra
            const purchaseRef = db.collection('compras').doc(purchaseId);
            const purchaseDoc = await purchaseRef.get();

            if (!purchaseDoc.exists) {
                throw new Error('La compra que intentas eliminar no existe.');
            }

            const purchaseData = purchaseDoc.data();
            console.log('Datos de la compra a eliminar:', purchaseData);

            // 2. Obtener todos los productos afectados
            const productRefs = [];
            for (const item of purchaseData.productos || []) {
                const productId = item.id || item.productoId;
                if (productId) {
                    productRefs.push({
                        id: productId,
                        cantidad: item.cantidad || 0
                    });
                }
            }

            // 3. Obtener lotes asociados
            const lotesSnapshot = await db.collection('stock_por_lote')
                .where('compraId', '==', purchaseId)
                .get();

            // 4. Obtener movimientos de inventario asociados
            const movimientosSnapshot = await db.collection('movimientos_inventario')
                .where('compraId', '==', purchaseId)
                .get();

            // 5. Obtener movimientos de caja asociados
            const cashMovementSnapshot = await db.collection('movimientos_caja')
                .where('compraId', '==', purchaseId)
                .get();

            // 6. Si no hay movimientos por compraId, buscar por relatedId
            let cashMovementByRelatedId = null;
            if (cashMovementSnapshot.empty) {
                cashMovementByRelatedId = await db.collection('movimientos_caja')
                    .where('relatedId', '==', purchaseId)
                    .where('relatedTo', '==', 'compra')
                    .get();
            }

            // === FASE 2: ESCRITURAS (dentro de transacción) ===

            await db.runTransaction(async (transaction) => {
                // TODAS LAS LECTURAS PRIMERO
                const productDocs = [];
                for (const item of productRefs) {
                    const productRef = db.collection('products').doc(item.id);
                    const productDoc = await transaction.get(productRef);
                    productDocs.push({
                        ref: productRef,
                        doc: productDoc,
                        cantidad: item.cantidad
                    });
                }

                // AHORA TODAS LAS ESCRITURAS

                // 1. Actualizar stock de productos
                for (const prod of productDocs) {
                    if (prod.doc.exists) {
                        const currentStock = prod.doc.data().stock || 0;
                        const newStock = currentStock - prod.cantidad;
                        transaction.update(prod.ref, { stock: Math.max(0, newStock) });
                        console.log(`Stock revertido para producto ${prod.ref.id}: ${currentStock} → ${Math.max(0, newStock)}`);
                    } else {
                        console.warn(`Producto con ID ${prod.ref.id} no encontrado`);
                    }
                }

                // 2. Eliminar lotes
                lotesSnapshot.forEach((loteDoc) => {
                    transaction.delete(loteDoc.ref);
                });
                console.log(`${lotesSnapshot.size} lotes marcados para eliminación`);

                // 3. Eliminar movimientos de inventario
                movimientosSnapshot.forEach((movDoc) => {
                    transaction.delete(movDoc.ref);
                });
                console.log(`${movimientosSnapshot.size} movimientos de inventario marcados para eliminación`);

                // 4. Eliminar movimientos de caja
                if (!cashMovementSnapshot.empty) {
                    cashMovementSnapshot.forEach((cashDoc) => {
                        transaction.delete(cashDoc.ref);
                    });
                    console.log(`${cashMovementSnapshot.size} movimientos de caja marcados para eliminación`);
                } else if (cashMovementByRelatedId && !cashMovementByRelatedId.empty) {
                    cashMovementByRelatedId.forEach((cashDoc) => {
                        transaction.delete(cashDoc.ref);
                    });
                    console.log(`${cashMovementByRelatedId.size} movimientos de caja (por relatedId) marcados para eliminación`);
                }

                // 5. Eliminar el documento de la compra
                transaction.delete(purchaseRef);
                console.log(`Documento de compra ${purchaseId} marcado para eliminación`);
            });

            console.log(`✅ Compra ${purchaseId} y todas sus operaciones asociadas han sido eliminadas exitosamente.`);

            // Recargar datos y actualizar UI
            await this.loadCompras();
            this.updateStats();

            notify('Compra eliminada exitosamente y todas las operaciones revertidas', 'success');

        } catch (error) {
            console.error('Error al eliminar la compra:', error);
            notify(`Error al eliminar la compra: ${error.message}`, 'error');
            throw error; // Re-lanzar el error para que la UI lo maneje
        }
    }
};

export const loadAllData = (...args) => comprasData.loadAllData(...args);
export const loadProveedores = (...args) => comprasData.loadProveedores(...args);
export const loadCompras = (...args) => comprasData.loadCompras(...args);
export const updateProveedoresSelectors = (...args) => comprasData.updateProveedoresSelectors(...args);
export const loadProductosSelector = (...args) => comprasData.loadProductosSelector(...args);
export const updateStats = (...args) => comprasData.updateStats(...args);
export const updateElement = (...args) => comprasData.updateElement(...args);
export const filterCompras = (...args) => comprasData.filterCompras(...args);
export const getElementValue = (...args) => comprasData.getElementValue(...args);
export const registrarCompra = (...args) => comprasData.registrarCompra(...args);
export const updateProductStock = (...args) => comprasData.updateProductStock(...args);
export const createProductLots = (...args) => comprasData.createProductLots(...args);
export const registerStockMovements = (...args) => comprasData.registerStockMovements(...args);
export const registrarEgresoCaja = (...args) => comprasData.registrarEgresoCaja(...args);
export const crearProveedor = (...args) => comprasData.crearProveedor(...args);
export const eliminarProveedor = (...args) => comprasData.eliminarProveedor(...args);
export const actualizarCompra = (...args) => comprasData.actualizarCompra(...args);
export const ejecutarActualizacionCompra = (...args) => comprasData.ejecutarActualizacionCompra(...args);
export const calcularDeltasProductos = (...args) => comprasData.calcularDeltasProductos(...args);
export const validarReduccionesNoMenorConsumido = (...args) => comprasData.validarReduccionesNoMenorConsumido(...args);
export const aplicarCambiosLotesCompra = (...args) => comprasData.aplicarCambiosLotesCompra(...args);
export const aplicarAjustesMovimientos = (...args) => comprasData.aplicarAjustesMovimientos(...args);
export const reconciliarStockProductos = (...args) => comprasData.reconciliarStockProductos(...args);
export const procesarCambiosProductos = (...args) => comprasData.procesarCambiosProductos(...args);
export const actualizarLotesCompra = (...args) => comprasData.actualizarLotesCompra(...args);
export const actualizarMovimientosInventario = (...args) => comprasData.actualizarMovimientosInventario(...args);
export const ajustarCajaCompraEditada = (...args) => comprasData.ajustarCajaCompraEditada(...args);
export const deletePurchase = (...args) => comprasData.deletePurchase(...args);

export default comprasData;

if (typeof window !== 'undefined') {
  window.ComprasData = comprasData;
}
