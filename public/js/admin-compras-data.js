// admin-compras-data.js - Manejo de datos y lógica de negocio
console.log('Cargando admin-compras-data.js...');

window.ComprasData = {
    
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
            ComprasUtils.showNotification('Error cargando datos de compras', 'error');
        }
    },

    async loadProveedores() {
        try {
            const querySnapshot = await window.db.collection('proveedores').get();
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
            const querySnapshot = await window.db.collection('compras').orderBy('fecha', 'desc').get();
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
            const fechaCompra = new Date(compra.fecha);
            return fechaCompra.getMonth() === mesActual && fechaCompra.getFullYear() === añoActual;
        });
        
        // Inversión total
        const inversionTotal = window.comprasCache.reduce((sum, compra) => sum + (compra.totalInvertido || 0), 0);
        
        // Total de proveedores registrados
        const totalProveedores = window.proveedoresCache ? window.proveedoresCache.length : 0;
        
        // ROI promedio
        let roiPromedio = 0;
        const comprasConVentas = window.comprasCache.filter(compra => (compra.totalVendido || 0) > 0);
        if (comprasConVentas.length > 0) {
            const roiTotal = comprasConVentas.reduce((sum, compra) => {
                const roi = ((compra.totalVendido - compra.totalInvertido) / compra.totalInvertido) * 100;
                return sum + roi;
            }, 0);
            roiPromedio = roiTotal / comprasConVentas.length;
        }
        
        // Actualizar elementos del DOM
        this.updateElement('compras-mes', comprasMes.length);
        this.updateElement('inversion-total', `S/ ${inversionTotal.toFixed(2)}`);
        this.updateElement('total-proveedores', totalProveedores);
        this.updateElement('roi-promedio', `${roiPromedio.toFixed(1)}%`);
        
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
                const fechaCompra = new Date(compra.fecha);
                if (fechaDesde) {
                    matchFecha = matchFecha && fechaCompra >= new Date(fechaDesde);
                }
                if (fechaHasta) {
                    matchFecha = matchFecha && fechaCompra <= new Date(fechaHasta);
                }
            }
            
            return matchSearch && matchProveedor && matchFecha;
        });
        
        ComprasUI.renderComprasTable(comprasFiltradas);
        this.updateElement('compras-count', `Mostrando ${comprasFiltradas.length} compras`);
    },

    getElementValue(id, defaultValue = '') {
        const element = document.getElementById(id);
        return element ? element.value : defaultValue;
    },

    async registrarCompra(formData) {
        try {
            console.log('Productos para calcular total:', window.ComprasModule.productosCompraActual);
            
            const totalInvertido = window.ComprasModule.productosCompraActual.reduce((sum, p) => {
                const subtotal = p.cantidad * p.precioCompra;
                console.log(`Producto: ${p.nombre}, Cantidad: ${p.cantidad}, Precio: ${p.precioCompra}, Subtotal: ${subtotal}`);
                return sum + subtotal;
            }, 0);
            
            console.log('Total invertido calculado:', totalInvertido);
            
            if (totalInvertido <= 0) {
                ComprasUtils.showNotification('Error: El total de la compra debe ser mayor a 0', 'error');
                return false;
            }
            
            const compra = {
                proveedorId: formData.proveedorId,
                fecha: formData.fecha,
                factura: formData.factura,
                metodoPago: formData.metodoPago,
                observaciones: formData.observaciones,
                productos: window.ComprasModule.productosCompraActual.map(p => ({
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
                cantidadProductos: window.ComprasModule.productosCompraActual.length,
                usuario: window.currentUser.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Registrar la compra
            const compraRef = await window.db.collection('compras').add(compra);
            
            // Actualizar stock de productos
            await this.updateProductStock(window.ComprasModule.productosCompraActual);
            
            // Crear lotes en stock_por_lote
            await this.createProductLots(window.ComprasModule.productosCompraActual, formData, compraRef.id);
            
            // Registrar movimientos de inventario
            await this.registerStockMovements(window.ComprasModule.productosCompraActual, formData.fecha, formData.factura, compraRef.id, formData);
            
            // Registrar egreso en caja
            await this.registrarEgresoCaja(formData, totalInvertido, compraRef.id);
            
            // Recargar datos
            await this.loadCompras();
            this.updateStats();
            
            // Verificar que la integración completa funcionó correctamente
            setTimeout(async () => {
                await ComprasUtils.probarIntegracionCompleta(compraRef.id);
            }, 1500);
            
            ComprasUtils.showNotification('Compra registrada con integración completa: lotes, inventario y caja', 'success');
            return true;
            
        } catch (error) {
            console.error('Error registrando compra:', error);
            ComprasUtils.showNotification('Error al registrar la compra', 'error');
            return false;
        }
    },

    async updateProductStock(productos) {
        const batch = window.db.batch();
        
        for (const producto of productos) {
            const productoRef = window.db.collection('products').doc(producto.id);
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
        const batch = window.db.batch();
        
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
            
            const loteRef = window.db.collection('stock_por_lote').doc();
            batch.set(loteRef, loteData);
        }
        
        await batch.commit();
        console.log('Lotes creados correctamente para la compra');
    },

    async registerStockMovements(productos, fecha, factura, compraId, formData) {
        try {
            const batch = window.db.batch();
            
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
                
                const movimientoRef = window.db.collection('movimientos_inventario').doc();
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
                
                await window.db.collection('movimientos_caja').add(egresoData);
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
            
            await window.db.collection('proveedores').add(proveedor);
            await this.loadProveedores();
            this.updateStats();
            
            ComprasUtils.showNotification('Proveedor creado correctamente', 'success');
            return true;
            
        } catch (error) {
            console.error('Error creando proveedor:', error);
            ComprasUtils.showNotification('Error al crear el proveedor', 'error');
            return false;
        }
    },

    async eliminarProveedor(proveedorId) {
        try {
            await window.db.collection('proveedores').doc(proveedorId).delete();
            await this.loadProveedores();
            this.updateStats();
            
            ComprasUtils.showNotification('Proveedor eliminado correctamente', 'success');
            return true;
            
        } catch (error) {
            console.error('Error eliminando proveedor:', error);
            ComprasUtils.showNotification('Error al eliminar el proveedor', 'error');
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
                ComprasUtils.showNotification('Error: El total de la compra debe ser mayor a 0', 'error');
                return false;
            }
            
            // Obtener compra original
            const compraOriginal = window.comprasCache?.find(c => c.id === compraId);
            if (!compraOriginal) {
                ComprasUtils.showNotification('Error: Compra original no encontrada', 'error');
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
            
            ComprasUtils.showNotification('Compra actualizada correctamente con todos los ajustes', 'success');
            return true;
            
        } catch (error) {
            console.error('Error actualizando compra:', error);
            ComprasUtils.showNotification('Error al actualizar la compra: ' + error.message, 'error');
            return false;
        }
    },
    
    async ejecutarActualizacionCompra(compraId, compraActualizada, productosOriginales, productosNuevos, diferenciaCaja, formData) {
        // 0) Calcular deltas entre productos originales y nuevos
        const deltas = this.calcularDeltasProductos(productosOriginales, productosNuevos);

        // 1) Validar reducciones seguras (no por debajo de lo ya vendido/consumido)
        await this.validarReduccionesNoMenorConsumido(compraId, deltas);

        // 2) Actualizar documento de compra (metadatos y arreglo de productos)
        await window.db.collection('compras').doc(compraId).update(compraActualizada);

        // 3) Aplicar cambios de lotes SOLO para productos afectados
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
        await this.reconciliarStockProductos(idsAfectados);

        // 6) Ajustar caja si hay diferencia
        if (Math.abs(diferenciaCaja) > 0.01) {
            await this.ajustarCajaCompraEditada(compraId, diferenciaCaja, formData);
        }

        console.log('Actualización de compra (delta) completada exitosamente');
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
        const db = window.db;
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
        const db = window.db;
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

            let restante = m.deltaCantidad; // puede ser negativo, cero o positivo
            // Aplica delta distribuyéndolo entre los lotes de la compra (si hubiera varios)
            for (const doc of lotesSnap.docs) {
                if (restante === 0) break;
                const d = doc.data();
                const actual = Number(d.cantidad) || 0;
                if (restante > 0) {
                    // Aumentar
                    const nuevo = actual + restante;
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
                    await doc.ref.update({
                        cantidad: nuevo,
                        // cantidadOriginal no se reduce para conservar histórico de adquisición
                        costoUnitario: Number(m.after.precioCompra) || Number(d.costoUnitario) || 0,
                        actualizado: true,
                        timestamp: nowTs
                    });
                    restante += reducir; // restante es negativo, al sumar reducir se acerca a 0
                }
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
        const db = window.db;
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
        for (const productoId of ids) {
            const lotesSnap = await window.db.collection('stock_por_lote')
                .where('productoId', '==', productoId)
                .get();
            let total = 0;
            lotesSnap.forEach(doc => {
                const d = doc.data();
                total += Number(d.cantidad) || 0; // cantidad ya refleja ventas
            });
            await window.db.collection('products').doc(productoId).update({ stock: total });
            // Actualizar cache local si existe
            if (window.productsCache) {
                const idx = window.productsCache.findIndex(p => p.id === productoId);
                if (idx !== -1) window.productsCache[idx].stock = total;
            }
        }
    },
    
    async procesarCambiosProductos(compraId, productosOriginales, productosNuevos) {
        const batch = window.db.batch();
        
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
                const productoRef = window.db.collection('products').doc(productoId);
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
        const lotesOriginales = await window.db.collection('stock_por_lote')
            .where('compraId', '==', compraId)
            .get();
        
        const batch = window.db.batch();
        
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
            
            const loteRef = window.db.collection('stock_por_lote').doc();
            batch.set(loteRef, loteData);
        }
        
        await batch.commit();
        console.log('Lotes actualizados correctamente para la compra editada');
    },
    
    async actualizarMovimientosInventario(compraId, productosOriginales, productosNuevos, formData) {
        // Eliminar movimientos originales de la compra
        const movimientosOriginales = await window.db.collection('movimientos_inventario')
            .where('compraId', '==', compraId)
            .get();
        
        const batch = window.db.batch();
        
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
            
            const movimientoRef = window.db.collection('movimientos_inventario').doc();
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
                    
                    await window.db.collection('movimientos_caja').add(egresoData);
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
                    
                    await window.db.collection('movimientos_caja').add(ingresoData);
                }
            }
            
            console.log(`Ajuste de caja registrado: S/ ${diferencia.toFixed(2)}`);
        } catch (error) {
            console.error('Error al ajustar caja:', error);
            throw error;
        }
    }
};

console.log('admin-compras-data.js cargado completamente');
