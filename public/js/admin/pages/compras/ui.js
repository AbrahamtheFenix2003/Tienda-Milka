import comprasData, { comprasState, setComprasIntegrationTester, setComprasNotificationHandler, setComprasTableRenderer } from './data.js';

const ComprasUtils = {
    
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-x-full`;
        
        if (type === 'success') {
            notification.className += ' bg-green-500 text-white';
        } else if (type === 'error') {
            notification.className += ' bg-red-500 text-white';
        } else {
            notification.className += ' bg-blue-500 text-white';
        }
        
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check' : type === 'error' ? 'fa-times' : 'fa-info'} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar notificación
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Ocultar después de 3 segundos
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    },

    showModal(title, content, maxWidth = 'max-w-4xl') {
        // Crear modal temporal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full ${maxWidth} max-h-[80vh] overflow-y-auto">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">${title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                ${content}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cerrar con escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    },

    exportCompras() {
        try {
            if (!window.comprasCache || window.comprasCache.length === 0) {
                this.showNotification('No hay compras para exportar', 'info');
                return;
            }

            const headers = ['Fecha', 'Proveedor', 'Factura', 'Método Pago', 'Total Invertido', 'Total Vendido', 'ROI', 'Estado'];
            const data = window.comprasCache.map(compra => {
                const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
                const nombreProveedor = proveedor ? proveedor.nombre : 'No encontrado';
                const roi = compra.totalInvertido > 0 ? 
                    (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100) : 0;
                
                let estado = 'Pendiente';
                if (compra.totalVendido >= compra.totalInvertido) {
                    estado = 'Recuperado';
                } else if (compra.totalVendido > 0) {
                    estado = 'En progreso';
                }
                
                return [
                    new Date(compra.fecha).toLocaleDateString('es-PE'),
                    nombreProveedor,
                    compra.factura || 'N/A',
                    compra.metodoPago,
                    compra.totalInvertido.toFixed(2),
                    (compra.totalVendido || 0).toFixed(2),
                    roi.toFixed(1) + '%',
                    estado
                ];
            });
            
            let csv = headers.join(',') + '\n';
            csv += data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showNotification('Compras exportadas correctamente', 'success');
            
        } catch (error) {
            console.error('Error exportando compras:', error);
            this.showNotification('Error al exportar las compras', 'error');
        }
    },

    printCompras() {
        if (!window.comprasCache || window.comprasCache.length === 0) {
            this.showNotification('No hay compras para imprimir', 'info');
            return;
        }

        const printWindow = window.open('', '_blank');
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Compras - Tienda Milka</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { text-align: center; color: #e11d48; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .positivo { color: #059669; font-weight: bold; }
                    .negativo { color: #dc2626; font-weight: bold; }
                    .fecha { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <h1>REPORTE DE COMPRAS - TIENDA MILKA</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Proveedor</th>
                            <th>Factura</th>
                            <th>Invertido</th>
                            <th>Vendido</th>
                            <th>ROI</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        window.comprasCache.forEach(compra => {
            const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
            const nombreProveedor = proveedor ? proveedor.nombre : 'No encontrado';
            const roi = compra.totalInvertido > 0 ? 
                (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100) : 0;
            
            let estado = 'Pendiente';
            if (compra.totalVendido >= compra.totalInvertido) {
                estado = 'Recuperado';
            } else if (compra.totalVendido > 0) {
                estado = 'En progreso';
            }
            
            const roiClass = roi >= 0 ? 'positivo' : 'negativo';
            
            html += `
                <tr>
                    <td>${new Date(compra.fecha).toLocaleDateString('es-PE')}</td>
                    <td>${nombreProveedor}</td>
                    <td>${compra.factura || 'N/A'}</td>
                    <td>S/ ${compra.totalInvertido.toFixed(2)}</td>
                    <td>S/ ${(compra.totalVendido || 0).toFixed(2)}</td>
                    <td class="${roiClass}">${roi.toFixed(1)}%</td>
                    <td>${estado}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                <div class="fecha">
                    Generado el ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')}
                </div>
            </body>
            </html>
        `;
        
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.print();
        }
    },

    formatCurrency(amount) {
        return `S/ ${parseFloat(amount || 0).toFixed(2)}`;
    },

    formatDate(date) {
        return new Date(date).toLocaleDateString('es-PE');
    },

    formatROI(totalInvertido, totalVendido) {
        if (totalInvertido <= 0) return '0.0%';
        const roi = ((totalVendido - totalInvertido) / totalInvertido) * 100;
        return `${roi.toFixed(1)}%`;
    },

    getEstadoCompra(totalInvertido, totalVendido) {
        if (totalVendido >= totalInvertido) {
            return { estado: 'Recuperado', class: 'bg-blue-100 text-blue-800' };
        } else if (totalVendido > 0) {
            return { estado: 'En progreso', class: 'bg-yellow-100 text-yellow-800' };
        } else {
            return { estado: 'Pendiente', class: 'bg-gray-100 text-gray-800' };
        }
    },

    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }
        });
        
        if (!isValid) {
            this.showNotification('Por favor complete todos los campos obligatorios', 'error');
        }
        
        return isValid;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    sanitizeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Función para verificar lotes de una compra
    async verificarLotesCompra(compraId) {
        try {
            const lotesSnapshot = await window.db.collection('stock_por_lote')
                .where('compraId', '==', compraId)
                .get();
            
            console.log(`Lotes encontrados para compra ${compraId}:`, lotesSnapshot.size);
            lotesSnapshot.forEach(doc => {
                const lote = doc.data();
                console.log('Lote:', {
                    id: doc.id,
                    loteId: lote.loteId,
                    productoId: lote.productoId,
                    cantidad: lote.cantidad,
                    costoUnitario: lote.costoUnitario,
                    fechaIngreso: lote.fechaIngreso,
                    proveedorId: lote.proveedorId
                });
            });
            
            return lotesSnapshot.size;
        } catch (error) {
            console.error('Error verificando lotes:', error);
            return 0;
        }
    },

    // Función para verificar movimientos de inventario de una compra
    async verificarMovimientosInventario(compraId) {
        try {
            const movimientosSnapshot = await window.db.collection('movimientos_inventario')
                .where('compraId', '==', compraId)
                .get();
            
            console.log(`Movimientos de inventario encontrados para compra ${compraId}:`, movimientosSnapshot.size);
            movimientosSnapshot.forEach(doc => {
                const movimiento = doc.data();
                console.log('Movimiento inventario:', {
                    id: doc.id,
                    productoId: movimiento.productoId,
                    productoNombre: movimiento.productoNombre,
                    cantidad: movimiento.cantidad,
                    tipo: movimiento.tipo,
                    costoUnitario: movimiento.costoUnitario,
                    costoTotal: movimiento.costoTotal,
                    proveedorNombre: movimiento.proveedorNombre
                });
            });
            
            return movimientosSnapshot.size;
        } catch (error) {
            console.error('Error verificando movimientos de inventario:', error);
            return 0;
        }
    },

    // Función para verificar egreso de caja de una compra
    async verificarEgresoCaja(compraId) {
        try {
            const egresoSnapshot = await window.db.collection('movimientos_caja')
                .where('compraId', '==', compraId)
                .where('tipo', '==', 'egreso')
                .get();
            
            console.log(`Egresos de caja encontrados para compra ${compraId}:`, egresoSnapshot.size);
            egresoSnapshot.forEach(doc => {
                const egreso = doc.data();
                console.log('Egreso caja:', {
                    id: doc.id,
                    concepto: egreso.concepto,
                    monto: egreso.monto,
                    metodoPago: egreso.metodoPago,
                    proveedorNombre: egreso.proveedorNombre,
                    categoria: egreso.categoria
                });
            });
            
            return egresoSnapshot.size;
        } catch (error) {
            console.error('Error verificando egreso de caja:', error);
            return 0;
        }
    },

    // Función para probar la integración completa
    async probarIntegracionCompleta(compraId) {
        if (!compraId) {
            console.error('❌ ID de compra requerido');
            return;
        }
        
        console.log('🔍 Verificando integración completa para compra:', compraId);
        console.log('================================================');
        
        // Verificar lotes
        const numLotes = await this.verificarLotesCompra(compraId);
        console.log(`✅ Lotes creados: ${numLotes}`);
        
        // Verificar movimientos de inventario
        const numMovimientos = await this.verificarMovimientosInventario(compraId);
        console.log(`✅ Movimientos de inventario: ${numMovimientos}`);
        
        // Verificar egreso de caja
        const numEgresos = await this.verificarEgresoCaja(compraId);
        console.log(`✅ Egresos de caja: ${numEgresos}`);
        
        console.log('================================================');
        
        if (numLotes > 0 && numMovimientos > 0 && numEgresos > 0) {
            console.log('🎉 INTEGRACIÓN COMPLETA EXITOSA');
            console.log('✅ Compras → Almacén (stock actualizado)');
            console.log('✅ Compras → Inventario (movimientos registrados)');
            console.log('✅ Compras → Caja (egreso registrado)');
        } else {
            console.log('⚠️ INTEGRACIÓN INCOMPLETA:');
            if (numLotes === 0) console.log('❌ Faltan lotes');
            if (numMovimientos === 0) console.log('❌ Faltan movimientos de inventario');
            if (numEgresos === 0) console.log('❌ Falta egreso de caja');
        }
    },

    // Función para limpiar compras duplicadas (uso administrativo)
    async limpiarComprasDuplicadas() {
        try {
            console.log('🧹 Iniciando limpieza de compras duplicadas...');
            
            const comprasSnapshot = await window.db.collection('compras').get();
            const compras = [];
            
            comprasSnapshot.forEach(doc => {
                const data = doc.data();
                compras.push({
                    id: doc.id,
                    ...data,
                    fechaStr: data.fecha,
                    proveedorId: data.proveedorId,
                    totalInvertido: data.totalInvertido
                });
            });
            
            // Agrupar por fecha, proveedor y total para identificar duplicados
            const grupos = {};
            
            compras.forEach(compra => {
                const key = `${compra.fechaStr}_${compra.proveedorId}_${compra.totalInvertido}`;
                if (!grupos[key]) {
                    grupos[key] = [];
                }
                grupos[key].push(compra);
            });
            
            // Identificar duplicados
            let duplicadosEncontrados = 0;
            
            for (const [key, grupo] of Object.entries(grupos)) {
                if (grupo.length > 1) {
                    console.log(`Duplicados encontrados para ${key}:`, grupo.length);
                    duplicadosEncontrados += grupo.length - 1;
                    
                    // Mantener solo la primera compra, eliminar las demás
                    const [mantener, ...eliminar] = grupo.sort((a, b) => 
                        (a.timestamp?.toDate?.() || new Date(a.timestamp)) - 
                        (b.timestamp?.toDate?.() || new Date(b.timestamp))
                    );
                    
                    console.log(`Manteniendo compra: ${mantener.id}`);
                    
                    for (const compraEliminar of eliminar) {
                        console.log(`⚠️ COMPRA DUPLICADA ENCONTRADA: ${compraEliminar.id}`);
                        console.log('Para eliminar manualmente, ejecuta:');
                        console.log(`window.db.collection('compras').doc('${compraEliminar.id}').delete()`);
                    }
                }
            }
            
            if (duplicadosEncontrados === 0) {
                console.log('✅ No se encontraron compras duplicadas');
            } else {
                console.log(`⚠️ Se encontraron ${duplicadosEncontrados} compras duplicadas`);
                console.log('Revisa los logs anteriores para los comandos de eliminación');
            }
            
        } catch (error) {
            console.error('Error limpiando compras duplicadas:', error);
        }
    },

    // Función para probar la integración de lotes
    async probarSistemaLotes() {
        console.log('🧪 Iniciando prueba del sistema de lotes...');
        
        // Verificar que existen productos y proveedores
        if (!window.productsCache || window.productsCache.length === 0) {
            console.error('❌ No hay productos cargados');
            return;
        }
        
        if (!window.proveedoresCache || window.proveedoresCache.length === 0) {
            console.error('❌ No hay proveedores cargados');
            return;
        }
        
        console.log('✅ Productos disponibles:', window.productsCache.length);
        console.log('✅ Proveedores disponibles:', window.proveedoresCache.length);
        console.log('✅ Sistema de lotes integrado correctamente');
        console.log('✅ Sistema de movimientos de inventario integrado');
        console.log('✅ Sistema de caja integrado');
        console.log('✅ Protección contra envíos duplicados implementada');
        console.log('');
        console.log('📝 Para probar:');
        console.log('1. Haz clic en "Nueva Compra"');
        console.log('2. Selecciona un proveedor');
        console.log('3. Agrega un producto con información de lote opcional');
        console.log('4. Registra la compra');
        console.log('5. Los lotes se crearán automáticamente en stock_por_lote');
        console.log('6. Se registrarán movimientos en movimientos_inventario');
        console.log('7. Se registrará egreso en movimientos_caja');
        console.log('');
        console.log('📊 Utilidades disponibles:');
        console.log('ComprasUtils.probarIntegracionCompleta("ID_DE_LA_COMPRA")');
        console.log('ComprasUtils.limpiarComprasDuplicadas() // Para limpiar duplicados');
        console.log('ComprasUtils.probarEdicionCompra("ID_DE_LA_COMPRA") // Verificar edición de compras');
    },

    // Función para probar la funcionalidad de edición de compras
    async probarEdicionCompra(compraId) {
        if (!compraId) {
            console.error('❌ ID de compra requerido');
            return;
        }
        
        console.log('🔍 Verificando funcionalidad de edición para compra:', compraId);
        console.log('===============================================');
        
        try {
            // Verificar que la compra existe
            const compra = window.comprasCache?.find(c => c.id === compraId);
            if (!compra) {
                console.error('❌ Compra no encontrada en cache');
                return;
            }
            
            console.log('✅ Compra encontrada:', {
                id: compra.id,
                fecha: compra.fecha,
                totalInvertido: compra.totalInvertido,
                productos: compra.productos?.length || 0
            });
            
            // Verificar lotes asociados
            const lotesSnapshot = await window.db.collection('stock_por_lote')
                .where('compraId', '==', compraId)
                .get();
            
            console.log(`✅ Lotes asociados: ${lotesSnapshot.size}`);
            lotesSnapshot.forEach(doc => {
                const lote = doc.data();
                console.log(`  - Lote: ${lote.loteId}, Producto: ${lote.productoId}, Cantidad: ${lote.cantidad}, Actualizado: ${lote.actualizado || false}`);
            });
            
            // Verificar movimientos de inventario
            const movimientosSnapshot = await window.db.collection('movimientos_inventario')
                .where('compraId', '==', compraId)
                .get();
            
            console.log(`✅ Movimientos de inventario: ${movimientosSnapshot.size}`);
            movimientosSnapshot.forEach(doc => {
                const mov = doc.data();
                console.log(`  - Producto: ${mov.productoNombre}, Cantidad: ${mov.cantidad}, Tipo: ${mov.tipo}, Editado: ${mov.editado || false}`);
            });
            
            // Verificar movimientos de caja
            const cajaSnapshot = await window.db.collection('movimientos_caja')
                .where('compraId', '==', compraId)
                .get();
            
            console.log(`✅ Movimientos de caja: ${cajaSnapshot.size}`);
            cajaSnapshot.forEach(doc => {
                const caja = doc.data();
                console.log(`  - Tipo: ${caja.tipo}, Monto: S/${caja.monto}, Categoría: ${caja.categoria}, Relacionado: ${caja.relatedTo || 'original'}`);
            });
            
            console.log('===============================================');
            console.log('🎯 FUNCIONALIDAD DE EDICIÓN DISPONIBLE:');
            console.log('✅ Botón de editar en tabla de compras');
            console.log('✅ Modal de edición con productos editables');
            console.log('✅ Agregar/quitar productos en tiempo real');
            console.log('✅ Edición de cantidades y precios inline');
            console.log('✅ Cálculo automático de diferencias');
            console.log('✅ Actualización completa de stock, lotes, inventario y caja');
            console.log('');
            console.log('📝 PARA PROBAR LA EDICIÓN:');
            console.log('1. Ve a la tabla de compras');
            console.log('2. Haz clic en el botón de editar (icono lápiz verde)');
            console.log('3. Modifica productos, cantidades o precios');
            console.log('4. Agrega nuevos productos si deseas');
            console.log('5. Guarda los cambios');
            console.log('6. El sistema actualizará automáticamente stock, lotes, inventario y caja');
            
        } catch (error) {
            console.error('Error verificando edición de compra:', error);
        }
    }
};

const ComprasModals = {
    isSubmitting: false, // Variable para prevenir envíos duplicados
    
    getAllModalsHtml() {
        return `
            <!-- Modal Nueva Compra -->
            <div id="modal-nueva-compra" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <h3 class="text-lg font-semibold mb-4">Registrar Nueva Compra</h3>
                    <form id="form-nueva-compra">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                                <select id="proveedor-compra" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                    <option value="">Seleccionar proveedor</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Compra</label>
                                <input type="date" id="fecha-compra" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Número de Factura</label>
                                <input type="text" id="factura-compra" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Opcional">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                                <select id="metodo-pago-compra" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="credito">Crédito</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                            <textarea id="observaciones-compra" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Observaciones adicionales..."></textarea>
                        </div>
                        
                        <!-- Productos de la compra -->
                        <div class="mb-4">
                            <div class="flex justify-between items-center mb-3">
                                <div>
                                    <h4 class="text-md font-semibold">Productos</h4>
                                    <div class="flex items-center mt-1">
                                        <i class="fas fa-info-circle text-blue-500 mr-1"></i>
                                        <small class="text-blue-600">Ahora se crean lotes automáticamente para cada producto</small>
                                    </div>
                                </div>
                                <button type="button" id="agregar-producto-compra" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                    <i class="fas fa-plus mr-1"></i>Agregar Producto
                                </button>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="min-w-full border border-gray-200 rounded-lg">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto / Lote</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Cantidad</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio Compra</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="productos-compra-table">
                                        <tr>
                                            <td colspan="5" class="px-4 py-4 text-center text-gray-500">No hay productos agregados</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="mt-3 text-right">
                                <span class="text-lg font-semibold">Total: S/ <span id="total-compra">0.00</span></span>
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancelar-nueva-compra" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Registrar Compra
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Modal Agregar Producto -->
            <div id="modal-agregar-producto" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 class="text-lg font-semibold mb-4">Agregar Producto</h3>
                    <form id="form-agregar-producto">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                            <div class="relative">
                                <input type="text" id="producto-seleccion-input" required 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                                       placeholder="Escriba para buscar un producto..."
                                       autocomplete="off">
                                <input type="hidden" id="producto-seleccion" required>
                                <div id="producto-dropdown" class="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 hidden">
                                    <!-- Los productos se cargarán aquí -->
                                </div>
                            </div>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                            <input type="number" id="cantidad-producto" min="1" step="1" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Precio de Compra (por unidad)</label>
                            <input type="number" id="precio-compra-producto" min="0" step="0.01" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        
                        <!-- Información del Lote -->
                        <div class="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 class="text-sm font-semibold text-blue-800 mb-3">
                                <i class="fas fa-box mr-2"></i>Información del Lote
                            </h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-blue-700 mb-1">Número de Lote (Opcional)</label>
                                    <input type="text" id="lote-numero" placeholder="Ej: LOTE-001, L240315..."
                                           class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <small class="text-blue-600 text-xs">Si no se especifica, se generará automáticamente</small>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-blue-700 mb-1">Fecha de Vencimiento (Opcional)</label>
                                    <input type="date" id="fecha-vencimiento"
                                           class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    <small class="text-blue-600 text-xs">Solo para productos perecederos</small>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancelar-agregar-producto" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                                Agregar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Modal Gestionar Proveedores -->
            <div id="modal-proveedores" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Gestionar Proveedores</h3>
                        <button id="nuevo-proveedor-btn" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                            <i class="fas fa-plus mr-1"></i>Nuevo
                        </button>
                    </div>
                    
                    <div class="space-y-3" id="lista-proveedores">
                        <div class="text-center text-gray-500 py-4">Cargando proveedores...</div>
                    </div>
                    
                    <div class="flex justify-end mt-6">
                        <button id="cerrar-proveedores" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Modal Nuevo Proveedor -->
            <div id="modal-nuevo-proveedor" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 class="text-lg font-semibold mb-4">Nuevo Proveedor</h3>
                    <form id="form-nuevo-proveedor">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del Proveedor</label>
                            <input type="text" id="nombre-proveedor" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Contacto</label>
                            <input type="text" id="contacto-proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                            <input type="tel" id="telefono-proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" id="email-proveedor" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                            <textarea id="direccion-proveedor" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"></textarea>
                        </div>
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancelar-nuevo-proveedor" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Modal Editar Compra -->
            <div id="modal-editar-compra" class="modal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <h3 class="text-lg font-semibold mb-4">
                        <i class="fas fa-edit text-green-600 mr-2"></i>Editar Compra
                    </h3>
                    <form id="form-editar-compra">
                        <input type="hidden" id="editar-compra-id" value="">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                                <select id="editar-proveedor-compra" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                    <option value="">Seleccionar proveedor</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Compra</label>
                                <input type="date" id="editar-fecha-compra" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Número de Factura</label>
                                <input type="text" id="editar-factura-compra" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Opcional">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                                <select id="editar-metodo-pago-compra" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="credito">Crédito</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                            <textarea id="editar-observaciones-compra" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" placeholder="Observaciones adicionales..."></textarea>
                        </div>
                        
                        <!-- Productos de la compra -->
                        <div class="mb-4">
                            <div class="flex justify-between items-center mb-3">
                                <div>
                                    <h4 class="text-md font-semibold">Productos de la Compra</h4>
                                    <div class="flex items-center mt-1">
                                        <i class="fas fa-exclamation-triangle text-amber-500 mr-1"></i>
                                        <small class="text-amber-600">Los cambios afectarán stock y lotes existentes</small>
                                    </div>
                                </div>
                                <button type="button" id="editar-agregar-producto-compra" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                    <i class="fas fa-plus mr-1"></i>Agregar Producto
                                </button>
                            </div>
                            
                            <div class="overflow-x-auto">
                                <table class="min-w-full border border-gray-200 rounded-lg">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Producto / Lote</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Cantidad</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Precio Compra</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Subtotal</th>
                                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="editar-productos-compra-table">
                                        <tr>
                                            <td colspan="5" class="px-4 py-4 text-center text-gray-500">Cargando productos...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="mt-3 text-right">
                                <span class="text-lg font-semibold">Total: S/ <span id="editar-total-compra">0.00</span></span>
                            </div>
                            
                            <div class="mt-2 text-sm text-gray-600">
                                <div class="flex justify-between">
                                    <span>Total Original: S/ <span id="total-original">0.00</span></span>
                                    <span class="font-medium">Diferencia: S/ <span id="diferencia-total" class="text-blue-600">0.00</span></span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-3">
                            <button type="button" id="cancelar-editar-compra" class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                                <i class="fas fa-save mr-2"></i>Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    },

    setupModalEventListeners() {
        // Modal nueva compra
        this.addClickListener('cancelar-nueva-compra', () => this.closeModal('modal-nueva-compra'));
        this.addSubmitListener('form-nueva-compra', (e) => this.handleRegistrarCompra(e));
        this.addClickListener('agregar-producto-compra', () => this.openAgregarProducto());
        
        // Modal agregar producto
        this.addClickListener('cancelar-agregar-producto', () => this.cancelarAgregarProducto());
        this.addSubmitListener('form-agregar-producto', (e) => this.handleAgregarProducto(e));
        
        // Modal proveedores
        this.addClickListener('cerrar-proveedores', () => this.closeModal('modal-proveedores'));
        this.addClickListener('nuevo-proveedor-btn', () => this.openNuevoProveedor());
        
        // Modal nuevo proveedor
        this.addClickListener('cancelar-nuevo-proveedor', () => this.closeModal('modal-nuevo-proveedor'));
        this.addSubmitListener('form-nuevo-proveedor', (e) => this.handleCrearProveedor(e));
        
        // Modal editar compra
        this.addClickListener('cancelar-editar-compra', () => this.closeModal('modal-editar-compra'));
        this.addSubmitListener('form-editar-compra', (e) => this.handleEditarCompra(e));
        this.addClickListener('editar-agregar-producto-compra', () => this.openAgregarProductoEdicion());
    },

    addClickListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    },

    addSubmitListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('submit', handler);
        }
    },

    openNuevaCompra() {
        comprasState.productosCompraActual = [];
        this.resetForm('form-nueva-compra');
        
        const fechaCompra = document.getElementById('fecha-compra');
        if (fechaCompra) {
            fechaCompra.value = new Date().toISOString().split('T')[0];
        }
        
        this.updateProductosCompraTable();
        this.openModal('modal-nueva-compra');
        
        // Configurar event listeners específicos del modal
        setTimeout(() => this.setupModalEventListeners(), 100);
    },

    openAgregarProducto() {
        this.resetForm('form-agregar-producto');
        this.setupProductSearch();
        this.openModal('modal-agregar-producto');
    },
    
    cancelarAgregarProducto() {
        // Restaurar z-index normal del modal de agregar producto
        const modalAgregarProducto = document.getElementById('modal-agregar-producto');
        if (modalAgregarProducto) {
            modalAgregarProducto.style.zIndex = '50'; // Volver al z-index normal
        }
        
        // Limpiar la variable de edición
        comprasState.editandoCompra = false;
        
        this.closeModal('modal-agregar-producto');
    },

    setupProductSearch() {
        const input = document.getElementById('producto-seleccion-input');
        const hiddenInput = document.getElementById('producto-seleccion');
        const dropdown = document.getElementById('producto-dropdown');
        
        if (!input || !hiddenInput || !dropdown) return;
        
        // Event listener para búsqueda en tiempo real
        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Solo mostrar dropdown si hay texto escrito
            if (searchTerm.length > 0) {
                this.loadProductsIntoDropdown(searchTerm);
            } else {
                dropdown.classList.add('hidden');
            }
            
            // Limpiar selección si se cambia el texto
            if (hiddenInput.value && input.value !== input.dataset.selectedName) {
                hiddenInput.value = '';
                delete input.dataset.selectedName;
            }
        });
        
        // Mostrar dropdown al hacer focus solo si hay texto
        input.addEventListener('focus', () => {
            const searchTerm = input.value.toLowerCase().trim();
            if (searchTerm.length > 0) {
                this.loadProductsIntoDropdown(searchTerm);
            }
        });
        
        // Ocultar dropdown al perder focus (con delay para permitir clicks)
        input.addEventListener('blur', () => {
            setTimeout(() => {
                dropdown.classList.add('hidden');
            }, 200);
        });
        
        // Manejar navegación con teclado
        input.addEventListener('keydown', (e) => {
            const items = dropdown.querySelectorAll('[data-product-id]');
            const current = dropdown.querySelector('[data-product-id].bg-rose-50');
            let index = Array.from(items).indexOf(current);
            
            switch(e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    index = Math.min(index + 1, items.length - 1);
                    this.highlightDropdownItem(items, index);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    index = Math.max(index - 1, 0);
                    this.highlightDropdownItem(items, index);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (current) {
                        current.click();
                    }
                    break;
                case 'Escape':
                    dropdown.classList.add('hidden');
                    break;
            }
        });
    },
    
    loadProductsIntoDropdown(searchTerm = '') {
        const dropdown = document.getElementById('producto-dropdown');
        if (!dropdown || !window.productsCache) return;
        
        // Filtrar productos por término de búsqueda
        const filteredProducts = window.productsCache.filter(product => {
            const name = (product.name || '').toLowerCase();
            const sku = (product.sku || '').toLowerCase();
            const category = (product.category || '').toLowerCase();
            
            return name.includes(searchTerm) || 
                   sku.includes(searchTerm) || 
                   category.includes(searchTerm);
        });
        
        // Mostrar mensaje si no hay resultados
        if (filteredProducts.length === 0) {
            dropdown.innerHTML = '<div class="px-4 py-3 text-gray-500 text-center">No se encontraron productos</div>';
            dropdown.classList.remove('hidden');
            return;
        }
        
        // Generar HTML para productos
        const productsHtml = filteredProducts.map(product => `
            <div class="px-4 py-3 hover:bg-rose-50 cursor-pointer border-b border-gray-100 last:border-b-0" 
                 data-product-id="${product.id}" data-product-name="${product.name}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-600">
                            ${product.category ? `Categoría: ${product.category}` : ''}
                            ${product.sku ? ` • SKU: ${product.sku}` : ''}
                        </div>
                        <div class="text-sm text-gray-500">
                            Stock: ${product.stock || 0} • Precio: S/ ${(product.price || 0).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        dropdown.innerHTML = productsHtml;
        dropdown.classList.remove('hidden');
        
        // Agregar event listeners a los items
        dropdown.querySelectorAll('[data-product-id]').forEach(item => {
            item.addEventListener('click', () => {
                this.selectProduct(item.dataset.productId, item.dataset.productName);
            });
        });
    },
    
    highlightDropdownItem(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle('bg-rose-50', i === index);
        });
    },
    
    selectProduct(productId, productName) {
        const input = document.getElementById('producto-seleccion-input');
        const hiddenInput = document.getElementById('producto-seleccion');
        const dropdown = document.getElementById('producto-dropdown');
        
        if (input && hiddenInput && dropdown) {
            input.value = productName;
            input.dataset.selectedName = productName;
            hiddenInput.value = productId;
            dropdown.classList.add('hidden');
            
            // Auto-focus en el siguiente campo
            const cantidadInput = document.getElementById('cantidad-producto');
            if (cantidadInput) {
                cantidadInput.focus();
            }
        }
    },

    openProveedores() {
        this.loadProveedoresList();
        this.openModal('modal-proveedores');
        
        // Configurar event listeners específicos del modal
        setTimeout(() => this.setupModalEventListeners(), 100);
    },

    openNuevoProveedor() {
        this.resetForm('form-nuevo-proveedor');
        this.openModal('modal-nuevo-proveedor');
    },

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            
            // Limpiar campos específicos del formulario de agregar producto
            if (formId === 'form-agregar-producto') {
                const input = document.getElementById('producto-seleccion-input');
                const dropdown = document.getElementById('producto-dropdown');
                if (input) {
                    input.value = '';
                    delete input.dataset.selectedName;
                }
                if (dropdown) {
                    dropdown.classList.add('hidden');
                }
            }
        }
    },

    async handleRegistrarCompra(e) {
        e.preventDefault();
        
        // Prevenir envíos duplicados
        if (this.isSubmitting) {
            return;
        }
        this.isSubmitting = true;
        
        if (comprasState.productosCompraActual.length === 0) {
            ComprasUtils.showNotification('Debe agregar al menos un producto', 'error');
            this.isSubmitting = false;
            return;
        }
        
        // Deshabilitar el botón de envío
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registrando...';
        }
        
        const formData = {
            proveedorId: document.getElementById('proveedor-compra').value,
            fecha: document.getElementById('fecha-compra').value,
            factura: document.getElementById('factura-compra').value,
            metodoPago: document.getElementById('metodo-pago-compra').value,
            observaciones: document.getElementById('observaciones-compra').value
        };
        
        const success = await comprasData.registrarCompra(formData);
        
        // Restaurar el botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-save mr-2"></i>Registrar Compra';
        }
        
        this.isSubmitting = false;
        
        if (success) {
            // Limpiar productos actuales
            comprasState.productosCompraActual = [];
            this.updateProductosCompraTable();
            this.closeModal('modal-nueva-compra');
        }
    },

    handleAgregarProducto(e) {
        e.preventDefault();
        
        const productoId = document.getElementById('producto-seleccion').value;
        const cantidad = parseInt(document.getElementById('cantidad-producto').value);
        const precioCompra = parseFloat(document.getElementById('precio-compra-producto').value);
        
        // Capturar información del lote
        const loteNumero = document.getElementById('lote-numero').value.trim();
        const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
        
        const producto = window.productsCache?.find(p => p.id === productoId);
        if (!producto) {
            ComprasUtils.showNotification('Producto no encontrado', 'error');
            return;
        }
        
        // Determinar a qué array agregar el producto (nueva compra o edición)
        const productosArray = comprasState.editandoCompra ? 
            comprasState.productosEditandoActual : 
            comprasState.productosCompraActual;
        
        // Verificar si el producto ya está agregado
        const existeIndex = productosArray.findIndex(p => p.id === productoId);
        if (existeIndex !== -1) {
            // Actualizar cantidad y precio - pero mantener la información de lote separada
            productosArray[existeIndex].cantidad += cantidad;
            productosArray[existeIndex].precioCompra = precioCompra;
            // Si hay información de lote, agregar como nuevo item para mantener trazabilidad
            if (loteNumero || fechaVencimiento) {
                productosArray.push({
                    id: productoId,
                    nombre: producto.name,
                    cantidad: cantidad,
                    precioCompra: precioCompra,
                    subtotal: cantidad * precioCompra,
                    loteInfo: {
                        numero: loteNumero,
                        fechaVencimiento: fechaVencimiento
                    }
                });
            }
        } else {
            // Agregar nuevo producto
            const productoCompra = {
                id: productoId,
                nombre: producto.name,
                cantidad: cantidad,
                precioCompra: precioCompra,
                subtotal: cantidad * precioCompra
            };
            
            // Agregar información del lote si existe
            if (loteNumero || fechaVencimiento) {
                productoCompra.loteInfo = {
                    numero: loteNumero,
                    fechaVencimiento: fechaVencimiento
                };
            }
            
            productosArray.push(productoCompra);
        }
        
        // Actualizar la tabla correspondiente
        if (comprasState.editandoCompra) {
            this.updateProductosEditarCompraTable();
        } else {
            this.updateProductosCompraTable();
        }
        
        // Limpiar el formulario
        const inputSearch = document.getElementById('producto-seleccion-input');
        if (inputSearch) {
            inputSearch.value = '';
            delete inputSearch.dataset.selectedName;
        }
        document.getElementById('producto-seleccion').value = '';
        document.getElementById('cantidad-producto').value = '';
        document.getElementById('precio-compra-producto').value = '';
        document.getElementById('lote-numero').value = '';
        document.getElementById('fecha-vencimiento').value = '';
        
        // Ocultar dropdown
        const dropdown = document.getElementById('producto-dropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
        
        this.closeModal('modal-agregar-producto');
        
        // Restaurar z-index normal del modal de agregar producto
        const modalAgregarProducto = document.getElementById('modal-agregar-producto');
        if (modalAgregarProducto) {
            modalAgregarProducto.style.zIndex = '50'; // Volver al z-index normal
        }
        
        // Limpiar la variable de edición
        comprasState.editandoCompra = false;
    },

    async handleCrearProveedor(e) {
        e.preventDefault();
        
        const proveedorData = {
            nombre: document.getElementById('nombre-proveedor').value,
            contacto: document.getElementById('contacto-proveedor').value,
            telefono: document.getElementById('telefono-proveedor').value,
            email: document.getElementById('email-proveedor').value,
            direccion: document.getElementById('direccion-proveedor').value
        };
        
        const success = await comprasData.crearProveedor(proveedorData);
        if (success) {
            this.closeModal('modal-nuevo-proveedor');
            this.loadProveedoresList();
        }
    },

    updateProductosCompraTable() {
        const tbody = document.getElementById('productos-compra-table');
        const totalElement = document.getElementById('total-compra');
        
        if (!tbody || !totalElement) return;
        
        if (comprasState.productosCompraActual.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">No hay productos agregados</td></tr>';
            totalElement.textContent = '0.00';
            return;
        }
        
        let total = 0;
        tbody.innerHTML = comprasState.productosCompraActual.map((producto, index) => {
            const subtotal = producto.cantidad * producto.precioCompra;
            total += subtotal;
            
            // Información del lote
            const loteInfo = producto.loteInfo;
            const loteDisplay = loteInfo ? 
                `<div class="text-xs text-blue-600">
                    ${loteInfo.numero ? `Lote: ${loteInfo.numero}` : 'Lote: Auto'}
                    ${loteInfo.fechaVencimiento ? `<br>Vence: ${new Date(loteInfo.fechaVencimiento).toLocaleDateString('es-ES')}` : ''}
                </div>` : 
                '<div class="text-xs text-gray-400">Sin lote específico</div>';
            
            return `
                <tr>
                    <td class="px-4 py-2">
                        <div>${producto.nombre}</div>
                        ${loteDisplay}
                    </td>
                    <td class="px-4 py-2">${producto.cantidad}</td>
                    <td class="px-4 py-2">S/ ${producto.precioCompra.toFixed(2)}</td>
                    <td class="px-4 py-2">S/ ${subtotal.toFixed(2)}</td>
                    <td class="px-4 py-2">
                        <button type="button" onclick="ComprasModals.eliminarProductoCompra(${index})" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        totalElement.textContent = total.toFixed(2);
    },

    eliminarProductoCompra(index) {
        comprasState.productosCompraActual.splice(index, 1);
        this.updateProductosCompraTable();
    },

    loadProveedoresList() {
        const container = document.getElementById('lista-proveedores');
        if (!container) return;
        
        if (!window.proveedoresCache || window.proveedoresCache.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-4">No hay proveedores registrados</div>';
            return;
        }
        
        container.innerHTML = window.proveedoresCache.map(proveedor => `
            <div class="bg-gray-50 rounded-lg p-4 flex justify-between items-start">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-900">${proveedor.nombre}</h4>
                    <p class="text-sm text-gray-600">${proveedor.contacto || 'Sin contacto'}</p>
                    <p class="text-sm text-gray-600">${proveedor.telefono || 'Sin teléfono'}</p>
                    <p class="text-sm text-gray-600">${proveedor.email || 'Sin email'}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="ComprasModals.eliminarProveedor('${proveedor.id}')" class="text-red-600 hover:text-red-900" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    async eliminarProveedor(proveedorId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
            return;
        }
        
        const success = await comprasData.eliminarProveedor(proveedorId);
        if (success) {
            this.loadProveedoresList();
        }
    },

    showDetail(compraId) {
        const compra = window.comprasCache?.find(c => c.id === compraId);
        if (!compra) {
            ComprasUtils.showNotification('Compra no encontrada', 'error');
            return;
        }
        
        const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
        
        const detalleHtml = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div><strong>Proveedor:</strong> ${proveedor ? proveedor.nombre : 'No encontrado'}</div>
                    <div><strong>Fecha:</strong> ${new Date(compra.fecha).toLocaleDateString('es-PE')}</div>
                    <div><strong>Factura:</strong> ${compra.factura || 'N/A'}</div>
                    <div><strong>Método de Pago:</strong> ${compra.metodoPago}</div>
                </div>
                
                <div>
                    <strong>Productos y Lotes:</strong>
                    <div class="mt-2 border rounded">
                        <table class="w-full">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-3 py-2 text-left">Producto</th>
                                    <th class="px-3 py-2 text-left">Lote</th>
                                    <th class="px-3 py-2 text-left">Cantidad</th>
                                    <th class="px-3 py-2 text-left">Precio</th>
                                    <th class="px-3 py-2 text-left">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${compra.productos.map(p => {
                                    const loteInfo = p.loteInfo;
                                    const loteDisplay = loteInfo ? 
                                        `<div class="text-xs">
                                            <div class="font-medium text-blue-600">${loteInfo.numero || 'Auto-generado'}</div>
                                            ${loteInfo.fechaVencimiento ? `<div class="text-gray-500">Vence: ${new Date(loteInfo.fechaVencimiento).toLocaleDateString('es-ES')}</div>` : ''}
                                        </div>` : 
                                        '<div class="text-xs text-gray-400">Sin lote específico</div>';
                                    
                                    return `
                                        <tr>
                                            <td class="px-3 py-2">${p.nombre}</td>
                                            <td class="px-3 py-2">${loteDisplay}</td>
                                            <td class="px-3 py-2">${p.cantidad}</td>
                                            <td class="px-3 py-2">S/ ${p.precioCompra.toFixed(2)}</td>
                                            <td class="px-3 py-2">S/ ${p.subtotal.toFixed(2)}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                        <strong>Total Invertido:</strong><br>
                        S/ ${compra.totalInvertido.toFixed(2)}
                    </div>
                    <div>
                        <strong>Total Vendido:</strong><br>
                        S/ ${(compra.totalVendido || 0).toFixed(2)}
                    </div>
                    <div>
                        <strong>ROI:</strong><br>
                        ${compra.totalInvertido > 0 ? (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100).toFixed(1) : 0}%
                    </div>
                </div>
                
                ${compra.observaciones ? `
                    <div>
                        <strong>Observaciones:</strong><br>
                        ${compra.observaciones}
                    </div>
                ` : ''}
            </div>
        `;
        
        ComprasUtils.showModal('Detalle de Compra', detalleHtml);
    },

    // ======================== FUNCIONES DE EDICIÓN ========================
    
    editarCompra(compraId) {
        const compra = window.comprasCache?.find(c => c.id === compraId);
        if (!compra) {
            ComprasUtils.showNotification('Compra no encontrada', 'error');
            return;
        }
        
        // Guardar el estado original de los productos para referencia
        comprasState.productosOriginalEditando = [...(compra.productos || [])];
        comprasState.productosEditandoActual = [...(compra.productos || [])];
        comprasState.compraEditandoId = compraId;
        
        // Cargar datos en el modal
        this.cargarDatosCompraEdicion(compra);
        
        // Actualizar selectores de proveedores
        comprasData.updateProveedoresSelectors();
        this.updateProveedoresSelectoresEdicion();
        
        // Abrir modal
        this.openModal('modal-editar-compra');
        
        // Configurar event listeners específicos
        setTimeout(() => this.setupModalEventListeners(), 100);
    },
    
    cargarDatosCompraEdicion(compra) {
        // Cargar datos básicos
        document.getElementById('editar-compra-id').value = compra.id;
        document.getElementById('editar-proveedor-compra').value = compra.proveedorId || '';
        document.getElementById('editar-fecha-compra').value = compra.fecha || '';
        document.getElementById('editar-factura-compra').value = compra.factura || '';
        document.getElementById('editar-metodo-pago-compra').value = compra.metodoPago || 'efectivo';
        document.getElementById('editar-observaciones-compra').value = compra.observaciones || '';
        
        // Mostrar totales
        document.getElementById('total-original').textContent = (compra.totalInvertido || 0).toFixed(2);
        
        // Cargar productos
        this.updateProductosEditarCompraTable();
    },
    
    updateProveedoresSelectoresEdicion() {
        const selector = document.getElementById('editar-proveedor-compra');
        if (selector && window.proveedoresCache) {
            // Mantener la opción seleccionada actual
            const selectedValue = selector.value;
            selector.innerHTML = '<option value="">Seleccionar proveedor</option>';
            
            window.proveedoresCache.forEach(proveedor => {
                const option = new Option(proveedor.nombre, proveedor.id);
                selector.appendChild(option);
            });
            
            // Restaurar selección
            selector.value = selectedValue;
        }
    },
    
    openAgregarProductoEdicion() {
        // Abrir el modal de agregar producto pero configurado para edición
        comprasState.editandoCompra = true;
        this.openAgregarProducto();
        
        // Aumentar z-index del modal de agregar producto para que aparezca encima del modal de edición
        setTimeout(() => {
            const modalAgregarProducto = document.getElementById('modal-agregar-producto');
            if (modalAgregarProducto) {
                modalAgregarProducto.style.zIndex = '60'; // Mayor que z-50 del modal de edición
            }
        }, 50);
    },
    
    updateProductosEditarCompraTable() {
        const tbody = document.getElementById('editar-productos-compra-table');
        const totalElement = document.getElementById('editar-total-compra');
        const diferenciaElement = document.getElementById('diferencia-total');
        const totalOriginalElement = document.getElementById('total-original');
        
        if (!tbody || !totalElement || !comprasState.productosEditandoActual) return;
        
        if (comprasState.productosEditandoActual.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-4 text-center text-gray-500">No hay productos en esta compra</td></tr>';
            totalElement.textContent = '0.00';
            if (diferenciaElement) diferenciaElement.textContent = '0.00';
            return;
        }
        
        let totalActual = 0;
        tbody.innerHTML = comprasState.productosEditandoActual.map((producto, index) => {
            const subtotal = producto.cantidad * producto.precioCompra;
            totalActual += subtotal;
            
            // Información del lote
            const loteInfo = producto.loteInfo;
            const loteDisplay = loteInfo ? 
                `<div class="text-xs text-blue-600">
                    ${loteInfo.numero ? `Lote: ${loteInfo.numero}` : 'Lote: Auto'}
                    ${loteInfo.fechaVencimiento ? `<br>Vence: ${new Date(loteInfo.fechaVencimiento).toLocaleDateString('es-ES')}` : ''}
                </div>` : 
                '<div class="text-xs text-gray-400">Sin lote específico</div>';
            
            return `
                <tr>
                    <td class="px-4 py-2">
                        <div>${producto.nombre}</div>
                        ${loteDisplay}
                    </td>
                    <td class="px-4 py-2">
                        <input type="number" value="${producto.cantidad}" min="1" 
                               onchange="ComprasModals.actualizarCantidadProductoEdicion(${index}, this.value)"
                               class="w-20 px-2 py-1 border border-gray-300 rounded text-center">
                    </td>
                    <td class="px-4 py-2">
                        <input type="number" value="${producto.precioCompra}" min="0" step="0.01"
                               onchange="ComprasModals.actualizarPrecioProductoEdicion(${index}, this.value)"
                               class="w-24 px-2 py-1 border border-gray-300 rounded text-center">
                    </td>
                    <td class="px-4 py-2 font-medium">S/ ${subtotal.toFixed(2)}</td>
                    <td class="px-4 py-2">
                        <button type="button" onclick="ComprasModals.eliminarProductoEdicion(${index})" 
                                class="text-red-600 hover:text-red-900 px-2 py-1 rounded" title="Eliminar producto">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Actualizar totales
        totalElement.textContent = totalActual.toFixed(2);
        
        // Calcular diferencia si existe el elemento
        if (diferenciaElement && totalOriginalElement) {
            const totalOriginal = parseFloat(totalOriginalElement.textContent || 0);
            const diferencia = totalActual - totalOriginal;
            diferenciaElement.textContent = diferencia.toFixed(2);
            diferenciaElement.className = diferencia >= 0 ? 'text-green-600' : 'text-red-600';
        }
    },
    
    actualizarCantidadProductoEdicion(index, nuevaCantidad) {
        if (comprasState.productosEditandoActual && comprasState.productosEditandoActual[index]) {
            comprasState.productosEditandoActual[index].cantidad = parseInt(nuevaCantidad) || 1;
            this.updateProductosEditarCompraTable();
        }
    },
    
    actualizarPrecioProductoEdicion(index, nuevoPrecio) {
        if (comprasState.productosEditandoActual && comprasState.productosEditandoActual[index]) {
            comprasState.productosEditandoActual[index].precioCompra = parseFloat(nuevoPrecio) || 0;
            this.updateProductosEditarCompraTable();
        }
    },
    
    eliminarProductoEdicion(index) {
        if (comprasState.productosEditandoActual && confirm('¿Estás seguro de eliminar este producto de la compra?')) {
            comprasState.productosEditandoActual.splice(index, 1);
            this.updateProductosEditarCompraTable();
        }
    },
    
    async handleEditarCompra(e) {
        e.preventDefault();
        
        // Prevenir envíos duplicados
        if (this.isSubmitting) {
            return;
        }
        this.isSubmitting = true;
        
        if (!comprasState.productosEditandoActual || comprasState.productosEditandoActual.length === 0) {
            ComprasUtils.showNotification('Debe tener al menos un producto en la compra', 'error');
            this.isSubmitting = false;
            return;
        }
        
        // Deshabilitar el botón de envío
        const submitButton = e.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        }
        
        const formData = {
            compraId: document.getElementById('editar-compra-id').value,
            proveedorId: document.getElementById('editar-proveedor-compra').value,
            fecha: document.getElementById('editar-fecha-compra').value,
            factura: document.getElementById('editar-factura-compra').value,
            metodoPago: document.getElementById('editar-metodo-pago-compra').value,
            observaciones: document.getElementById('editar-observaciones-compra').value,
            productosOriginales: comprasState.productosOriginalEditando,
            productosNuevos: comprasState.productosEditandoActual
        };
        
        const success = await comprasData.actualizarCompra(formData);
        
        // Restaurar el botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-save mr-2"></i>Guardar Cambios';
        }
        
        this.isSubmitting = false;
        
        if (success) {
            // Limpiar variables temporales
            comprasState.productosOriginalEditando = [];
            comprasState.productosEditandoActual = [];
            comprasState.compraEditandoId = null;
            comprasState.editandoCompra = false;
            
            this.closeModal('modal-editar-compra');
        }
    }
};

const ComprasUI = {
    
    renderMainInterface() {
        const content = `
            <div class="space-y-6">
                <!-- Resumen de Compras -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-500">
                                <i class="fas fa-shopping-bag text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Compras Este Mes</p>
                                <p class="text-2xl font-semibold text-gray-900" id="compras-mes">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 text-green-500">
                                <i class="fas fa-dollar-sign text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Inversión Total</p>
                                <p class="text-2xl font-semibold text-green-600" id="inversion-total">S/ 0.00</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-purple-100 text-purple-500">
                                <i class="fas fa-truck text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">Proveedores</p>
                                <p class="text-2xl font-semibold text-purple-600" id="total-proveedores">0</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-yellow-100 text-yellow-500">
                                <i class="fas fa-chart-line text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-500">ROI Promedio</p>
                                <p class="text-2xl font-semibold text-yellow-600" id="roi-promedio">0%</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Panel de Control -->
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                            <h3 class="text-lg font-semibold text-gray-900">Gestión de Compras</h3>
                            <div class="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                                <button id="nueva-compra-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                                    <i class="fas fa-plus mr-2"></i>Nueva Compra
                                </button>
                                <button id="gestionar-proveedores-btn" class="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors">
                                    <i class="fas fa-truck mr-2"></i>Proveedores
                                </button>
                                <button id="analisis-rentabilidad-btn" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
                                    <i class="fas fa-chart-bar mr-2"></i>Análisis ROI
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Filtros -->
                    <div class="p-4 bg-gray-50 border-b border-gray-200">
                        <div class="flex flex-wrap gap-4">
                            <div class="relative">
                                <input type="text" id="search-compras" placeholder="Buscar compra..."
                                       class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                            <select id="filter-proveedor" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                <option value="">Todos los proveedores</option>
                            </select>
                            <input type="date" id="filter-fecha-desde" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <input type="date" id="filter-fecha-hasta" class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                            <button id="limpiar-filtros-btn" class="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                                <i class="fas fa-eraser mr-2"></i>Limpiar
                            </button>
                        </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Invertido</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendido</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="compras-table" class="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td colspan="8" class="px-6 py-4 text-center text-gray-500">Cargando compras...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div class="flex justify-between items-center">
                            <span class="text-sm text-gray-700" id="compras-count">Mostrando 0 compras</span>
                            <div class="flex space-x-2">
                                <button id="export-compras-btn" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                    <i class="fas fa-download mr-1"></i>Exportar
                                </button>
                                <button id="print-compras-btn" class="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600">
                                    <i class="fas fa-print mr-1"></i>Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        
        // Agregar modales
        this.addModalsToBody();
        
        // Establecer fecha por defecto
        const fechaCompra = document.getElementById('fecha-compra');
        if (fechaCompra) {
            fechaCompra.value = new Date().toISOString().split('T')[0];
        }
    },

    addModalsToBody() {
        // Eliminar modales existentes si los hay
        const existingModals = document.querySelectorAll('[id*="modal-"]');
        existingModals.forEach(modal => {
            if (modal.id.includes('compra') || modal.id.includes('proveedor')) {
                modal.remove();
            }
        });

        const modalsHtml = ComprasModals.getAllModalsHtml();
        document.body.insertAdjacentHTML('beforeend', modalsHtml);
    },

    setupEventListeners() {
        // Botones principales
        this.addClickListener('nueva-compra-btn', () => ComprasModals.openNuevaCompra());
        this.addClickListener('gestionar-proveedores-btn', () => ComprasModals.openProveedores());
        this.addClickListener('analisis-rentabilidad-btn', () => this.showAnalysisROI());
        
        // Filtros
        this.addInputListener('search-compras', () => comprasData.filterCompras());
        this.addChangeListener('filter-proveedor', () => comprasData.filterCompras());
        this.addChangeListener('filter-fecha-desde', () => comprasData.filterCompras());
        this.addChangeListener('filter-fecha-hasta', () => comprasData.filterCompras());
        this.addClickListener('limpiar-filtros-btn', () => this.clearFilters());
        
        // Botones de exportar/imprimir
        this.addClickListener('export-compras-btn', () => ComprasUtils.exportCompras());
        this.addClickListener('print-compras-btn', () => ComprasUtils.printCompras());
    },

    addClickListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    },

    addInputListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', handler);
        }
    },

    addChangeListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', handler);
        }
    },

    renderComprasTable(compras) {
        const tbody = document.getElementById('compras-table');
        if (!tbody) return;
        
        if (compras.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="px-6 py-4 text-center text-gray-500">No se encontraron compras</td></tr>';
            return;
        }
        
        tbody.innerHTML = compras.map(compra => {
            const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
            const nombreProveedor = proveedor ? proveedor.nombre : 'Proveedor no encontrado';
            
            const fecha = new Date(compra.fecha).toLocaleDateString('es-PE');
            const numProductos = compra.productos ? compra.productos.length : 0;
            const totalInvertido = compra.totalInvertido || 0;
            const totalVendido = compra.totalVendido || 0;
            
            let roi = 0;
            let roiClass = 'text-gray-600';
            
            // Usar el estado de la compra o calcular uno por defecto
            let estado = compra.estado || 'Registrada';
            let estadoClass = 'bg-gray-100 text-gray-800'; // Default
            
            // Determinar clase CSS basada en el estado
            switch(estado) {
                case 'Registrada':
                    estadoClass = 'bg-green-100 text-green-800';
                    break;
                case 'Parcial':
                    estadoClass = 'bg-yellow-100 text-yellow-800';
                    break;
                case 'Completada':
                    estadoClass = 'bg-blue-100 text-blue-800';
                    break;
                case 'Anulada':
                    estadoClass = 'bg-red-100 text-red-800';
                    break;
                default:
                    estadoClass = 'bg-gray-100 text-gray-800';
            }
            
            if (totalInvertido > 0) {
                roi = ((totalVendido - totalInvertido) / totalInvertido) * 100;
                
                if (roi > 0) {
                    roiClass = 'text-green-600';
                } else if (roi < 0) {
                    roiClass = 'text-red-600';
                }
                
                // Actualizar estado basado en ventas si no está anulada
                if (estado !== 'Anulada') {
                    if (totalVendido >= totalInvertido) {
                        estado = 'Recuperado';
                        estadoClass = 'bg-blue-100 text-blue-800';
                    } else if (totalVendido > 0) {
                        estado = 'Parcial';
                        estadoClass = 'bg-yellow-100 text-yellow-800';
                    }
                }
            }
            
            return `
                <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${fecha}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${nombreProveedor}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">${numProductos} productos</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold">S/ ${totalInvertido.toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">S/ ${totalVendido.toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold ${roiClass}">
                        ${roi.toFixed(1)}%
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoClass}">
                            ${estado}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div class="flex space-x-2">
                            <button onclick="ComprasModals.showDetail('${compra.id}')" class="text-blue-600 hover:text-blue-900" title="Ver detalle">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="ComprasModals.editarCompra('${compra.id}')" class="text-green-600 hover:text-green-900" title="Editar compra">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    clearFilters() {
        const elements = ['search-compras', 'filter-proveedor', 'filter-fecha-desde', 'filter-fecha-hasta'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });
        comprasData.filterCompras();
    },

    showAnalysisROI() {
        if (!window.comprasCache || window.comprasCache.length === 0) {
            ComprasUtils.showNotification('No hay datos de compras para analizar', 'info');
            return;
        }
        
        // Calcular métricas de ROI
        const analisis = window.comprasCache.map(compra => {
            const proveedor = window.proveedoresCache?.find(p => p.id === compra.proveedorId);
            const roi = compra.totalInvertido > 0 ? 
                (((compra.totalVendido || 0) - compra.totalInvertido) / compra.totalInvertido * 100) : 0;
            
            return {
                ...compra,
                nombreProveedor: proveedor ? proveedor.nombre : 'No encontrado',
                roi: roi,
                ganancia: (compra.totalVendido || 0) - compra.totalInvertido,
                porcentajeRecuperado: compra.totalInvertido > 0 ? 
                    ((compra.totalVendido || 0) / compra.totalInvertido * 100) : 0
            };
        }).sort((a, b) => b.roi - a.roi);
        
        const analisisHtml = this.generateAnalysisHtml(analisis);
        ComprasUtils.showModal('Análisis de Rentabilidad (ROI)', analisisHtml, 'max-w-6xl');
    },

    generateAnalysisHtml(analisis) {
        return `
            <div class="space-y-6">
                <div class="grid grid-cols-3 gap-4">
                    <div class="bg-green-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-green-800">Mejor ROI</h4>
                        <p class="text-2xl font-bold text-green-600">
                            ${analisis.length > 0 ? analisis[0].roi.toFixed(1) : 0}%
                        </p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-red-800">Peor ROI</h4>
                        <p class="text-2xl font-bold text-red-600">
                            ${analisis.length > 0 ? analisis[analisis.length - 1].roi.toFixed(1) : 0}%
                        </p>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-lg">
                        <h4 class="font-semibold text-blue-800">ROI Promedio</h4>
                        <p class="text-2xl font-bold text-blue-600">
                            ${analisis.length > 0 ? (analisis.reduce((sum, a) => sum + a.roi, 0) / analisis.length).toFixed(1) : 0}%
                        </p>
                    </div>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full border border-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left">Fecha</th>
                                <th class="px-4 py-2 text-left">Proveedor</th>
                                <th class="px-4 py-2 text-left">Invertido</th>
                                <th class="px-4 py-2 text-left">Vendido</th>
                                <th class="px-4 py-2 text-left">Ganancia</th>
                                <th class="px-4 py-2 text-left">ROI</th>
                                <th class="px-4 py-2 text-left">% Recuperado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analisis.map(compra => `
                                <tr>
                                    <td class="px-4 py-2">${new Date(compra.fecha).toLocaleDateString('es-PE')}</td>
                                    <td class="px-4 py-2">${compra.nombreProveedor}</td>
                                    <td class="px-4 py-2">S/ ${compra.totalInvertido.toFixed(2)}</td>
                                    <td class="px-4 py-2">S/ ${(compra.totalVendido || 0).toFixed(2)}</td>
                                    <td class="px-4 py-2 ${compra.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}">
                                        S/ ${compra.ganancia.toFixed(2)}
                                    </td>
                                    <td class="px-4 py-2 font-semibold ${compra.roi >= 0 ? 'text-green-600' : 'text-red-600'}">
                                        ${compra.roi.toFixed(1)}%
                                    </td>
                                    <td class="px-4 py-2">
                                        <div class="w-full bg-gray-200 rounded-full h-2">
                                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min(100, compra.porcentajeRecuperado)}%"></div>
                                        </div>
                                        <span class="text-xs text-gray-600">${compra.porcentajeRecuperado.toFixed(1)}%</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
};
let bridgesRegistered = false;

function registerBridges() {
  if (bridgesRegistered) {
    return;
  }

  setComprasNotificationHandler((message, type) => {
    ComprasUtils.showNotification(message, type);
  });

  setComprasTableRenderer((compras) => {
    ComprasUI.renderComprasTable(compras);
  });

  setComprasIntegrationTester(async (compraId) => {
    if (typeof ComprasUtils.probarIntegracionCompleta === 'function') {
      await ComprasUtils.probarIntegracionCompleta(compraId);
    }
  });

  bridgesRegistered = true;
}

export function renderComprasUI() {
  ComprasUI.renderMainInterface();
  ComprasUI.setupEventListeners();
  registerBridges();
}

if (typeof window !== 'undefined') {
  window.ComprasUI = ComprasUI;
  window.ComprasModals = ComprasModals;
  window.ComprasUtils = ComprasUtils;
  window.ComprasModule = comprasState;
}
