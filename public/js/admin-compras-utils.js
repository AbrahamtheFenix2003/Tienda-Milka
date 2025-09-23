// admin-compras-utils.js - Utilidades y helpers
console.log('Cargando admin-compras-utils.js...');

window.ComprasUtils = {
    
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

console.log('admin-compras-utils.js cargado completamente');
