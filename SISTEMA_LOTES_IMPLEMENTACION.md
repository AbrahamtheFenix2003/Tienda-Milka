# Sistema de Gestión por Lotes - Documentación Completa

## 📋 Índice
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Estructura de Base de Datos](#estructura-de-base-de-datos)
3. [Flujos Implementados](#flujos-implementados)
4. [Módulos y Funciones](#módulos-y-funciones)
5. [Integración con Compras](#integración-con-compras)
6. [Gestión de Stock](#gestión-de-stock)
7. [Interfaz de Usuario](#interfaz-de-usuario)
8. [Próximos Pasos: Ventas](#próximos-pasos-ventas)

---

## 🏗️ Arquitectura del Sistema

### Flujo Principal
```
Compras → Almacén (Lotes) → Caja → Ventas
```

### Integración Completa
- **Compras**: Crea lotes automáticamente al registrar compras
- **Almacén**: Gestiona stock por lotes con trazabilidad completa
- **Caja**: Registra egresos automáticos de las compras
- **Productos**: Visualiza y gestiona lotes por producto
- **Ventas**: ⚠️ **PENDIENTE DE IMPLEMENTAR**

---

## 🗄️ Estructura de Base de Datos

### Colección: `stock_por_lote`
```javascript
{
  id: "auto-generated-id",
  productoId: "product-id",
  productoNombre: "Nombre del Producto",
  loteId: "lote1", // Nomenclatura secuencial por producto
  cantidad: 50, // Stock actual del lote
  cantidadOriginal: 50, // Stock inicial del lote
  costoUnitario: 2.50,
  fechaIngreso: Timestamp, // Fecha real de ingreso
  fechaVencimiento: Timestamp || null,
  proveedorId: "proveedor-id" || null,
  proveedorNombre: "Nombre Proveedor", // Para lotes legacy
  compraId: "compra-id" || null,
  esLegacy: false, // true para lotes creados manualmente
  usuario: "email@usuario.com",
  creadoEn: Timestamp
}
```

### Colección: `movimientos_inventario`
```javascript
{
  id: "auto-generated-id",
  fecha: Timestamp,
  productoId: "product-id",
  productoNombre: "Nombre del Producto",
  loteId: "lote1" || null,
  cantidad: 10,
  tipo: "entrada" | "salida" | "ajuste",
  subtipo: "compra" | "venta" | "lote_legacy" | "ajuste_lote",
  compraId: "compra-id" || null,
  ventaId: "venta-id" || null, // Para futuras ventas
  proveedorId: "proveedor-id" || null,
  proveedorNombre: "Nombre Proveedor",
  costoUnitario: 2.50,
  costoTotal: 25.00,
  usuario: "email@usuario.com",
  observaciones: "Descripción del movimiento"
}
```

### Colección: `compras` (Actualizada)
```javascript
{
  id: "auto-generated-id",
  fecha: Timestamp,
  factura: "F001-0001",
  proveedorId: "proveedor-id",
  productos: [
    {
      id: "product-id",
      nombre: "Producto",
      cantidad: 10,
      precioCompra: 2.50,
      loteInfo: {
        fechaVencimiento: Timestamp || null
      }
    }
  ],
  totalInvertido: 125.50,
  usuario: "email@usuario.com",
  creadoEn: Timestamp
}
```

---

## 🔄 Flujos Implementados

### 1. Flujo de Compra Completo
```
1. Usuario registra compra → admin-compras-modals.js
2. Se valida y procesa → admin-compras-data.js
3. Se crean lotes automáticamente → registerStockLotes()
4. Se actualiza stock de productos → updateProductStock()
5. Se registra egreso en caja → registrarEgresoCaja()
6. Se crean movimientos de inventario → registerStockMovements()
```

### 2. Flujo de Gestión de Lotes
```
1. Ver lotes por producto → mostrarLotesProducto()
2. Crear lote legacy → crearLoteLegacy()
3. Ajustar stock de lote → ajustarStockLote()
4. Ver historial de movimientos → mostrarHistorialMovimientos()
```

### 3. Cálculo de Stock Real
```
1. Suma de todos los lotes activos del producto
2. Actualización automática en interfaz
3. Sincronización con stock del producto
```

---

## 📁 Módulos y Funciones

### admin-compras-data.js
**Funciones Principales:**
- `registrarCompra()`: Proceso completo de registro de compra
- `registerStockLotes()`: Creación automática de lotes
- `updateProductStock()`: Actualización de stock de productos
- `registrarEgresoCaja()`: Registro de egreso en caja
- `registerStockMovements()`: Registro de movimientos de inventario

**Integración:**
- Usa `firebase.firestore.FieldValue.serverTimestamp()` para fechas precisas
- Nomenclatura secuencial de lotes: "lote1", "lote2", etc.
- Validación de `totalInvertido > 0`

### admin-compras-modals.js
**Funciones Principales:**
- `handleRegistrarCompra()`: Control del formulario de compra
- Protección anti-duplicación con `isSubmitting`
- Gestión de estados del botón de envío

### admin-compras-utils.js
**Funciones de Verificación:**
- `probarIntegracionCompleta()`: Prueba todos los sistemas
- `verificarLotesCreados()`: Verifica creación de lotes
- `verificarMovimientosInventario()`: Verifica movimientos
- `verificarMovimientosCaja()`: Verifica registros de caja

### admin-productos.js
**Funciones Principales:**
- `mostrarLotesProducto()`: Modal completo de gestión de lotes
- `crearLoteLegacy()`: Creación de lotes históricos
- `verDetalleLote()`: Información detallada de lotes
- `ajustarStockLote()`: Ajuste manual de stock por lote
- `mostrarHistorialMovimientos()`: Historial de movimientos
- `calcularStockRealProducto()`: Cálculo de stock desde lotes

**Características UI:**
- Cálculo automático de stock real
- Actualización visual en tiempo real
- Manejo de fechas de vencimiento con alertas
- Estados visuales (Activo/Agotado)

---

## 🛒 Integración con Compras

### Proceso Automático
1. **Registro de Compra**: Se valida la compra y proveedores
2. **Creación de Lotes**: Cada producto genera un lote automáticamente
3. **Actualización de Stock**: Se suma al stock existente del producto
4. **Registro de Caja**: Se registra el egreso automáticamente
5. **Movimientos**: Se registra la entrada en el inventario

### Nomenclatura de Lotes
- **Secuencial por producto**: "lote1", "lote2", "lote3"
- **Único por producto**: Cada producto tiene su propia secuencia
- **Ejemplo**: Producto A → lote1, lote2; Producto B → lote1, lote2

### Datos de Lotes desde Compras
```javascript
{
  loteId: "lote2", // Secuencial
  cantidad: cantidadComprada,
  cantidadOriginal: cantidadComprada,
  costoUnitario: precioCompra,
  fechaIngreso: serverTimestamp(), // Fecha real
  fechaVencimiento: fechaVencimiento || null,
  proveedorId: proveedorSeleccionado,
  compraId: compraCreada,
  esLegacy: false
}
```

---

## 📊 Gestión de Stock

### Cálculo de Stock Real
```javascript
async function calcularStockRealProducto(productoId) {
  const lotesSnapshot = await db.collection('stock_por_lote')
    .where('productoId', '==', productoId)
    .get();
  
  let stockReal = 0;
  lotesSnapshot.forEach(doc => {
    stockReal += doc.data().cantidad || 0;
  });
  
  return stockReal;
}
```

### Actualización Automática
- **Interfaz**: Stock se actualiza automáticamente en la vista
- **Visual**: Colores cambian según stock (Verde/Amarillo/Rojo)
- **Tiempo real**: Actualización en background sin bloquear UI

### Lotes Legacy
**Propósito**: Migrar productos existentes al sistema de lotes
**Campos**:
- `cantidad`: Stock actual del producto
- `cantidadOriginal`: Stock inicial del producto
- `fechaIngreso`: Fecha de creación del producto (`createdAt`)
- `costoUnitario`: Precio de compra inicial
- `proveedorNombre`: "Legacy - Stock Inicial"

---

## 🎨 Interfaz de Usuario

### Modal de Gestión de Lotes
**Ubicación**: Módulo de Productos → Botón "Ver Lotes"
**Características**:
- Estadísticas en tiempo real (Stock Total, Lotes Activos, Costo Promedio)
- Tabla completa con información de cada lote
- Acciones por lote (Ver Detalle, Ajustar Stock, Transferir)
- Alertas de vencimiento con colores
- Botón "Crear Lote Legacy"

### Botones de Acción por Producto
1. **Ver Lotes**: Abre modal de gestión completa
2. **Historial**: Muestra movimientos del producto
3. **Ajustar Stock**: Ajuste manual del stock total

### Indicadores Visuales
- **Stock con lotes**: Ícono de cajas 📦
- **Colores de stock**: Verde (>5), Amarillo (1-5), Rojo (0)
- **Estados de lote**: Activo/Agotado
- **Vencimientos**: ⚠️ Vencido, ⏰ Próximo a vencer

---

## 🚀 Próximos Pasos: Ventas

### Integración Requerida

#### 1. Modificar Registro de Ventas
**Archivo**: `admin-ventas.js`
**Cambios necesarios**:
```javascript
// En lugar de solo reducir stock del producto
await updateDoc(productRef, { stock: newStock });

// Implementar lógica FIFO para lotes
await procesarVentaConLotes(productId, cantidadVendida);
```

#### 2. Función de Procesamiento FIFO
```javascript
async function procesarVentaConLotes(productId, cantidadVendida) {
  // 1. Obtener lotes ordenados por fecha (FIFO)
  // 2. Reducir cantidad de lotes más antiguos primero
  // 3. Crear movimientos de inventario tipo "salida"
  // 4. Actualizar stock total del producto
}
```

#### 3. Movimientos de Inventario para Ventas
```javascript
{
  tipo: "salida",
  subtipo: "venta",
  ventaId: "venta-id",
  loteId: "lote-afectado",
  cantidad: cantidadReducida,
  // ... otros campos
}
```

#### 4. Validaciones de Stock
- Verificar stock disponible antes de venta
- Mostrar lotes disponibles al vendedor
- Alertar si no hay stock suficiente
- Permitir venta parcial si es necesario

### Archivos a Modificar
1. **admin-ventas.js**: Lógica principal de ventas
2. **admin-layout-new.html**: Si hay cambios en la UI
3. **common.js**: Funciones compartidas de lotes

### Consideraciones Importantes
- **FIFO**: Usar lotes más antiguos primero
- **Trazabilidad**: Registrar qué lotes se usaron en cada venta
- **Stock cero**: Manejar lotes que se agotan completamente
- **Costos**: Calcular costo real basado en lotes vendidos

---

## 📝 Resumen de Estado Actual

### ✅ Implementado y Funcionando
- [x] Sistema completo de lotes
- [x] Integración Compras → Almacén → Caja
- [x] Gestión visual de lotes por producto
- [x] Cálculo automático de stock real
- [x] Lotes legacy para productos existentes
- [x] Movimientos de inventario completos
- [x] Nomenclatura secuencial de lotes
- [x] Manejo de fechas con timestamps
- [x] Validaciones y controles de seguridad

### ⚠️ Pendiente de Implementar
- [ ] Integración con módulo de ventas
- [ ] Lógica FIFO para reducción de stock
- [ ] Movimientos de inventario por ventas
- [ ] Validaciones de stock en ventas
- [ ] Cálculo de costos reales por venta

### 🔧 Archivos Principales
- `admin-compras-data.js`: Lógica de compras y lotes
- `admin-compras-modals.js`: UI de compras
- `admin-compras-utils.js`: Utilidades y verificaciones
- `admin-productos.js`: Gestión visual de lotes
- `firestore.indexes.json`: Índices de base de datos

---

## 🎯 Siguiente Sesión: Integración con Ventas

Para la próxima sesión, necesitarás:

1. **Revisar**: `admin-ventas.js` actual
2. **Identificar**: Dónde se actualiza el stock en ventas
3. **Planificar**: Implementación de lógica FIFO
4. **Considerar**: UI para mostrar lotes en ventas (opcional)
5. **Preparar**: Casos de prueba para validar funcionamiento

### Pregunta Clave para la Próxima Sesión
¿Quieres implementar FIFO automático (usar lotes más antiguos primero) o permitir al vendedor elegir qué lotes usar?

---

*Documentación generada el 24 de agosto de 2025*  
*Sistema implementado y verificado funcionando correctamente*
