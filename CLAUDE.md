# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Milka-v2 is a Firebase-hosted e-commerce inventory and point-of-sale (POS) system for retail management. The application supports product management, sales tracking with FIFO batch inventory control, purchase orders, cash flow management, and financial reporting. The system uses role-based access control with three tiers: Super Admin, Super Vendedor (Super Seller), and Vendedor (Seller).

## Development Commands

### Firebase
```bash
# Start Firebase emulators for local development (currently commented out in code)
firebase emulators:start

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

Note: Local emulator configuration exists in `public/js/admin/services/firebase.js` but is commented out (lines 70-83). The app currently connects directly to production Firebase.

## Code Architecture

### Modular Page Architecture

The application is undergoing a **modular refactoring** (tracked in branch `refactorizacion-modular`). Each admin section follows a standardized three-module pattern:

**Standard Module Structure:**
```
public/js/admin/pages/{section}/
├── index.js    # Entry point, orchestrates data and UI
├── data.js     # Data fetching, caching, and Firestore operations
└── ui.js       # DOM manipulation and event handlers
```

**Refactored Sections:**
- ✅ `ventas/` (Sales/POS) - Complete modular implementation
- ✅ `dashboard/` - Dashboard metrics and charts
- ✅ `caja/` - Cash register management
- ✅ `compras/` - Purchase orders
- ✅ `productos/` - Product catalog
- ✅ `reportes/` - Financial reports
- ✅ `almacen/` - Warehouse/inventory
- ✅ `rentabilidad/` - Profitability analysis

**Module Responsibilities:**

- **index.js**: Exports `load{Section}Page()` function, coordinates data loading and UI rendering
- **data.js**: Manages Firestore queries, product/sales caching, FIFO inventory logic
- **ui.js**: Renders HTML, attaches event listeners, handles form interactions

### Firebase Service Layer

**Centralized Firebase initialization:** `public/js/admin/services/firebase.js`

This module:
- Initializes Firebase using compatibility mode (v8 API via v11 SDK)
- Exposes `db` and `storage` instances globally via `window` and ES6 exports
- Provides `getDb()` and `getStorage()` getter functions
- Uses Proxy pattern for backward compatibility with legacy code
- Exports `setupFirebase()` as the main initialization function

**Key exports:**
- `initializeFirebase()`: Fetches config and initializes Firebase
- `exposeFirebaseGlobally(services)`: Sets `window.db`, `window.auth`, etc.
- `setupFirebase()`: Main function combining initialization and global exposure

### Firestore Collections

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `products` | Product catalog | `name`, `category`, `price`, `stock`, `acquisitionCost` |
| `sales` | Sales transactions | `customerName`, `items[]`, `totalSale`, `profit`, `lotesInfo[]` |
| `stock_por_lote` | Batch inventory (FIFO) | `productoId`, `loteId`, `cantidad`, `costoUnitario`, `fechaIngreso` |
| `movimientos_inventario` | Inventory movements | `productoId`, `tipo` (entrada/salida), `cantidad`, `loteId` |
| `movimientos_caja` | Cash movements | `tipo` (entrada/salida), `monto`, `categoria` |
| `compras` | Purchase orders | `proveedor`, `productos[]`, `total` |
| `proveedores` | Suppliers | `nombre`, `contacto` |
| `expenses` | Operating expenses | `description`, `amount`, `category` |
| `categories` | Product categories | `name` |

### FIFO Inventory System

The sales module implements First-In-First-Out (FIFO) batch tracking:

**Flow (in `ventas/data.js`):**
1. `processSale()`: Main entry point for sale processing
2. `procesarVentaConLotes()`: Attempts FIFO batch processing
3. `obtenerLotesDisponibles()`: Fetches available batches sorted by `fechaIngreso`
4. For each batch: deduct quantity, create `movimientos_inventario` entry
5. `calcularStockRealProducto()`: Recalculates actual stock from batches
6. Updates `products.stock` field to match real batch quantities

**Fallback:** If no batches exist, `procesarVentaSinLotes()` processes sale in legacy mode.

### Role-Based Access Control

**Email-based roles** (defined in `firestore.rules` and HTML files):

```javascript
SUPER_ADMIN_EMAILS = ['elinquisidor09@gmail.com', 'milkavv.2001@gmail.com']
SUPER_VENDEDOR_EMAILS = ['garyvv.1993@gmail.com', 'abrahamjimenez092003@gmail.com']
VENDEDOR_EMAILS = ['amvf280194@gmail.com', 'noeatlas28@gmail.com']
```

**Permissions:**
- **Super Admin**: Full CRUD on products, categories, purchases, suppliers, expenses
- **Super Vendedor**: Read-only products, full access to sales/reports/expenses, cannot edit products
- **Vendedor**: Register sales, view sales history, no access to financial summaries or charts

**Firestore Security:** See `firestore.rules` for granular permission rules. Notably:
- Vendors can update `products.stock` during sales (for FIFO processing)
- Vendors can update specific fields in `sales` (e.g., `totalCost`, `lotesInfo`) for real-time cost calculation
- Only admins can create/delete batches in `stock_por_lote`

### Page Entry Points

**Admin Pages:**
- `admin.html` → Product management (uses inline script, not modular yet)
- `reportes.html` → Multi-section page: sales registration, expenses, financial reports (inline script)

**Both pages use:**
- `common.js` for shared Firebase initialization (`initFirebase()`, `setupNavigation()`)
- Firebase v11 SDK via CDN (modular imports)
- TailwindCSS via CDN for styling

**Section Loading:**
The modular pages are loaded dynamically via global functions like `window.loadVentasPage()`, `window.loadDashboardPage()`, etc., which are called from navigation handlers (not shown in current code).

### Global Variables and Caching

To minimize Firestore reads, the following are cached on `window`:

- `window.productsCache`: Array of all products
- `window.categoriesCache`: Array of all categories
- `window.proveedoresCache`: Array of suppliers
- `window.allSales`: All sales records
- `window.allExpenses`: All expenses (admin only)
- `window.currentUser`: Current authenticated user object

Cache is populated on initial page load and updated after mutations.

### Common Patterns

**Timestamp Handling:**
The codebase handles multiple timestamp formats due to migration:
```javascript
function getSaleDate(sale) {
    if (sale.timestamp?.toDate) return sale.timestamp.toDate();
    if (sale.timestamp) return new Date(sale.timestamp);
    if (sale.soldAt?.toDate) return sale.soldAt.toDate();
    if (sale.soldAt) return new Date(sale.soldAt);
    if (sale.date) return new Date(sale.date);
    return null;
}
```
Always use similar defensive checks when working with timestamps.

**Server Timestamps:**
```javascript
function getServerTimestampValue() {
    if (window.serverTimestamp) return window.serverTimestamp();
    return window.firebase?.firestore?.FieldValue?.serverTimestamp?.();
}
```

## Important Notes

1. **Modified Files:** Recent changes include:
   - `public/js/admin/services/firebase.js`: Updated Proxy bindings for storage
   - `public/js/admin/pages/ventas/ui.js`: Enhanced FIFO stock validation and UI updates
   - `public/js/admin/pages/ventas/data.js`: Complete FIFO implementation with batch tracking
   - `firestore.rules`: Granular permissions for vendors to update stock during sales

2. **Branch Context:** Working on `refactorizacion-modular` branch, recently merged refactors for `almacen`, `rentabilidad`, `compras`, `caja`, `ventas`, and `dashboard` sections.

3. **Dual Mode Architecture:** The app currently has:
   - Legacy inline scripts in HTML (`admin.html`, `reportes.html`)
   - Modular ES6 modules in `public/js/admin/pages/`
   - Gradual migration toward full modularity

4. **Firebase Compatibility Mode:** Uses Firebase v8 API surface via v11 SDK to support legacy `window.db.collection()` patterns while enabling modern ES6 imports.

5. **Stock Synchronization:** The system maintains two stock values:
   - `products.stock`: Main inventory field (synced after batch operations)
   - Calculated stock: Sum of `stock_por_lote.cantidad` where `productoId` matches
   - Always prefer calculated stock for sales validation (see `calcularStockRealProducto()`)

6. **Sales Flow:** When processing multi-product sales, the system:
   - Creates a single `sales` document first
   - Processes each product's batches via FIFO
   - Updates `sales` document with real cost data from batches
   - Creates cash movement entries
   - All operations should be atomic where possible

## File Structure

```
Milka-v2/
├── public/
│   ├── admin.html              # Product management page
│   ├── reportes.html           # Sales & reports page
│   ├── js/
│   │   ├── common.js           # Shared Firebase setup
│   │   └── admin/
│   │       ├── services/
│   │       │   └── firebase.js # Centralized Firebase service
│   │       └── pages/
│   │           ├── ventas/     # POS module
│   │           ├── dashboard/  # Dashboard module
│   │           ├── caja/       # Cash register module
│   │           ├── compras/    # Purchases module
│   │           ├── productos/  # Products module
│   │           ├── reportes/   # Reports module
│   │           ├── almacen/    # Warehouse module
│   │           └── rentabilidad/ # Profitability module
├── functions/                  # Firebase Cloud Functions
├── firestore.rules            # Security rules
├── firestore.indexes.json     # Composite indexes
└── firebase.json              # Firebase config
```
