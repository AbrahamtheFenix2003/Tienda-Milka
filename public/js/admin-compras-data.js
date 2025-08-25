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
            
            const egresoData = {
                fecha: firebase.firestore.FieldValue.serverTimestamp(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(), // Para compatibilidad con módulo de caja
                tipo: 'egreso',
                concepto: `Compra a proveedor: ${proveedorNombre}`,
                monto: parseFloat(totalInvertido), // Asegurar que sea un número
                compraId: compraId,
                proveedorId: formData.proveedorId,
                proveedorNombre: proveedorNombre,
                metodoPago: formData.metodoPago,
                numeroFactura: formData.factura || '',
                observaciones: formData.observaciones || `Compra de productos registrada el ${new Date().toLocaleDateString()}`,
                usuario: window.currentUser?.email || 'sistema',
                categoria: 'Compras'
            };
            
            console.log('Datos del egreso a registrar:', egresoData);
            
            await window.db.collection('movimientos_caja').add(egresoData);
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
    }
};

console.log('admin-compras-data.js cargado completamente');
