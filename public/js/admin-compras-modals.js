// admin-compras-modals.js - Gestión de modales
console.log('Cargando admin-compras-modals.js...');

window.ComprasModals = {
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
                            <select id="producto-seleccion" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500">
                                <option value="">Seleccionar producto</option>
                            </select>
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
        `;
    },

    setupModalEventListeners() {
        // Modal nueva compra
        this.addClickListener('cancelar-nueva-compra', () => this.closeModal('modal-nueva-compra'));
        this.addSubmitListener('form-nueva-compra', (e) => this.handleRegistrarCompra(e));
        this.addClickListener('agregar-producto-compra', () => this.openAgregarProducto());
        
        // Modal agregar producto
        this.addClickListener('cancelar-agregar-producto', () => this.closeModal('modal-agregar-producto'));
        this.addSubmitListener('form-agregar-producto', (e) => this.handleAgregarProducto(e));
        
        // Modal proveedores
        this.addClickListener('cerrar-proveedores', () => this.closeModal('modal-proveedores'));
        this.addClickListener('nuevo-proveedor-btn', () => this.openNuevoProveedor());
        
        // Modal nuevo proveedor
        this.addClickListener('cancelar-nuevo-proveedor', () => this.closeModal('modal-nuevo-proveedor'));
        this.addSubmitListener('form-nuevo-proveedor', (e) => this.handleCrearProveedor(e));
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
        window.ComprasModule.productosCompraActual = [];
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
        this.openModal('modal-agregar-producto');
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
        }
    },

    async handleRegistrarCompra(e) {
        e.preventDefault();
        
        // Prevenir envíos duplicados
        if (this.isSubmitting) {
            return;
        }
        this.isSubmitting = true;
        
        if (window.ComprasModule.productosCompraActual.length === 0) {
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
        
        const success = await ComprasData.registrarCompra(formData);
        
        // Restaurar el botón
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-save mr-2"></i>Registrar Compra';
        }
        
        this.isSubmitting = false;
        
        if (success) {
            // Limpiar productos actuales
            window.ComprasModule.productosCompraActual = [];
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
        
        // Verificar si el producto ya está agregado
        const existeIndex = window.ComprasModule.productosCompraActual.findIndex(p => p.id === productoId);
        if (existeIndex !== -1) {
            // Actualizar cantidad y precio - pero mantener la información de lote separada
            window.ComprasModule.productosCompraActual[existeIndex].cantidad += cantidad;
            window.ComprasModule.productosCompraActual[existeIndex].precioCompra = precioCompra;
            // Si hay información de lote, agregar como nuevo item para mantener trazabilidad
            if (loteNumero || fechaVencimiento) {
                window.ComprasModule.productosCompraActual.push({
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
            
            window.ComprasModule.productosCompraActual.push(productoCompra);
        }
        
        this.updateProductosCompraTable();
        
        // Limpiar el formulario
        document.getElementById('producto-seleccion').value = '';
        document.getElementById('cantidad-producto').value = '';
        document.getElementById('precio-compra-producto').value = '';
        document.getElementById('lote-numero').value = '';
        document.getElementById('fecha-vencimiento').value = '';
        
        this.closeModal('modal-agregar-producto');
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
        
        const success = await ComprasData.crearProveedor(proveedorData);
        if (success) {
            this.closeModal('modal-nuevo-proveedor');
            this.loadProveedoresList();
        }
    },

    updateProductosCompraTable() {
        const tbody = document.getElementById('productos-compra-table');
        const totalElement = document.getElementById('total-compra');
        
        if (!tbody || !totalElement) return;
        
        if (window.ComprasModule.productosCompraActual.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">No hay productos agregados</td></tr>';
            totalElement.textContent = '0.00';
            return;
        }
        
        let total = 0;
        tbody.innerHTML = window.ComprasModule.productosCompraActual.map((producto, index) => {
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
        window.ComprasModule.productosCompraActual.splice(index, 1);
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
        
        const success = await ComprasData.eliminarProveedor(proveedorId);
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
    }
};

console.log('admin-compras-modals.js cargado completamente');
