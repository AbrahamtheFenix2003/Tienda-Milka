# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BRAHOLET Importaciones - A Firebase-based e-commerce and inventory management system for a retail business. This is a web application with customer-facing storefront ([index.html](public/index.html)) and admin panel ([admin-layout.html](public/admin-layout.html)) for managing products, sales, inventory, purchases, and cash flow.

**Tech Stack:**
- Frontend: Vanilla JavaScript (ES6+ modules), Tailwind CSS, HTML5
- Backend: Firebase (Firestore, Authentication, Storage, Functions, Hosting)
- Additional Libraries: Chart.js, TinyMCE, Day.js, jsPDF

## Firebase Architecture

### Hosting Configuration ([firebase.json](firebase.json))
- Single-page routing with rewrites to [admin-layout.html](public/admin-layout.html) for admin routes
- SSR for product pages via Cloud Function (`/producto/:id` → `ssr` function)
- Public directory: [public/](public/)

### Cloud Functions ([functions/index.js](functions/index.js))
- **`ssr`**: Server-side rendering for product pages with Open Graph meta tags
- Reads product data from Firestore and injects into [producto-template.html](functions/producto-template.html)

### Firestore Collections

Key collections defined in [firestore.rules](firestore.rules):

- **`products`**: Product catalog with stock management
- **`sales`**: Sales records with FIFO batch costing
- **`categories`**: Product categories
- **`expenses`**: Business expenses (admin only)
- **`stock_por_lote`**: Batch inventory tracking (FIFO system)
- **`compras`**: Purchase orders
- **`proveedores`**: Supplier management
- **`movimientos_inventario`**: Inventory movement history
- **`movimientos_caja`**: Cash flow transactions
- **`arqueos_caja`**: Cash register audits
- **`historial_lotes`**: Batch history

### Security Rules

Role-based access control with 3 user types:
- **Super Admin**: Full system access (product management, reporting, all operations)
- **Super Vendedor**: Sales, reporting, inventory, purchases, cash management
- **Vendedor**: Sales only, limited dashboard access

Emails are hardcoded in [firestore.rules](firestore.rules:7-17) and [common.js](public/js/common.js:18-20).

## Key Architecture Patterns

### FIFO Batch Inventory System

Core functionality in [admin-ventas.js](public/js/admin-ventas.js:666-966):

1. **Stock Tracking**: Products have a `stock` field synced with `stock_por_lote` collection
2. **Batch Management**: Each purchase creates batches in `stock_por_lote` with:
   - `productoId`, `loteId`, `cantidad`, `costoUnitario`, `fechaIngreso`, `fechaVencimiento`
3. **FIFO Sales Processing**: `procesarVentaConLotes()` consumes oldest batches first
4. **Cost Calculation**: Real cost per sale computed from actual batches consumed
5. **Inventory Movements**: Every transaction logged in `movimientos_inventario`

**Critical Flow**:
```
Sale Registration → procesarVentaConLotes() → obtenerLotesDisponibles() (sorted by fechaIngreso)
→ Update each batch → Register movements → Update product.stock → Update sale with real cost
```

### Role-Based UI & Permissions

Authentication handled in [common.js](public/js/common.js) and enforced in [firestore.rules](firestore.rules).

Check permissions before rendering UI:
- Admin layout: [admin-layout.html](public/admin-layout.html:558-591)
- Products page: [admin-productos.js](public/js/admin-productos.js:8-16)

### Modular Admin Panel Architecture

Admin panel loads section-specific scripts dynamically:

**Main Controller**: [admin-layout.html](public/admin-layout.html:832-1010)
- Loads section via `loadSection(section)` function
- Each section has a global `load{Section}()` function

**Section Modules**:
- Dashboard: [admin-dashboard.js](public/js/admin-dashboard.js)
- Products: [admin-productos.js](public/js/admin-productos.js)
- Sales: [admin-ventas.js](public/js/admin-ventas.js)
- Reports: [admin-reportes.js](public/js/admin-reportes.js)
- Profitability: [admin-rentabilidad.js](public/js/admin-rentabilidad.js)
- Warehouse: [admin-almacen.js](public/js/admin-almacen.js)
- Purchases: Split into multiple files:
  - [admin-compras-main.js](public/js/admin-compras-main.js) (entry point)
  - [admin-compras-data.js](public/js/admin-compras-data.js) (data layer)
  - [admin-compras-ui.js](public/js/admin-compras-ui.js) (rendering)
  - [admin-compras-modals.js](public/js/admin-compras-modals.js) (modals)
  - [admin-compras-utils.js](public/js/admin-compras-utils.js) (utilities)
- Cash Register: Modularized under `public/js/admin/pages/caja/` (`data.js`, `ui.js`, `index.js`)

### Customer Storefront

**Main Page**: [index.html](public/index.html)
- Real-time product updates via Firestore `onSnapshot` listeners ([index.html](public/index.html:717-769))
- Product filtering by category and stock status
- Smart search with fuzzy matching (Levenshtein distance algorithm)
- Quote cart system with WhatsApp integration for customer inquiries

**Product Details**: Handled by SSR function for SEO optimization

## Common Development Commands

### Firebase Emulators
```bash
# Start all emulators
firebase emulators:start

# Functions only
cd functions && npm run serve
```

### Deploy
```bash
# Full deploy
firebase deploy

# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions
```

### Functions Development
```bash
cd functions
npm install
npm run lint
```

## Development Workflow

### Adding a New Product Feature

1. Update Firestore collection in Firebase Console or via admin panel
2. Modify [firestore.rules](firestore.rules) if new permissions needed
3. Update relevant admin section file (e.g., [admin-productos.js](public/js/admin-productos.js))
4. If affects customer view, update [index.html](public/index.html) and/or [producto-cliente.js](public/js/producto-cliente.js)
5. Test role-based access for all user types

### Adding a New Admin Section

1. Create `/public/js/admin-{section}.js` with global `load{Section}()` function
2. Add script tag to [admin-layout.html](public/admin-layout.html) (around line 1051)
3. Add navigation item in sidebar ([admin-layout.html](public/admin-layout.html:340-390))
4. Add case to `loadSection()` switch statement ([admin-layout.html](public/admin-layout.html:832-1010))
5. Implement role-based visibility if needed ([admin-layout.html](public/admin-layout.html:558-591))

### Working with the FIFO Batch System

**When modifying sales logic:**
- Always call `calcularStockRealProducto(productId)` to get accurate available stock
- Use `procesarVentaConLotes()` to handle batch consumption
- Never directly decrement `product.stock` - let the batch processor sync it
- Register all stock changes in `movimientos_inventario`

**When modifying purchase logic:**
- Create batches in `stock_por_lote` with all required fields
- Include `fechaIngreso` (Timestamp) for FIFO ordering
- Register purchase in `compras` collection
- Update product stock to match sum of batch quantities

### Modal Management

Modals use a shared pattern:
- Class `.modal` with `.active` state
- Global `closeAllModals()` and `emergencyCloseModals()` functions ([admin-layout.html](public/admin-layout.html:641-672))
- Press ESC to close active modal
- Auto-close on section change

## Important Implementation Details

### Firebase Compatibility Mode

Admin panel uses Firebase Compat mode ([admin-layout.html](public/admin-layout.html:434-437)):
```javascript
firebase.initializeApp(config)
firebase.auth(), firebase.firestore(), firebase.storage()
```

Customer storefront uses modern modular SDK ([index.html](public/index.html:393-395)):
```javascript
import { ... } from 'firebase/...'
```

### Global Variables & State

Admin panel exposes globals in `window` scope:
- `auth`, `db`, `storage` - Firebase instances
- `currentUser` - Authenticated user object
- `productsCache`, `categoriesCache`, `proveedoresCache` - Data caches
- `allSales`, `allExpenses` - Transaction data
- Role functions: `isSuperAdmin()`, `isAdmin()`, `hasAccessToSales()`

### Service Worker

PWA features with "kamikaze" service worker ([sw.js](public/sw.js)):
- Registered in [common.js](public/js/common.js:38-46) and [admin-layout.html](public/admin-layout.html:505-510)
- Self-destructs after initial load

### Stock Synchronization

**Critical**: Product `stock` field must always match sum of `stock_por_lote.cantidad` for that product.

After any batch operation, recalculate and update:
```javascript
const stockReal = await calcularStockRealProducto(productId);
await db.collection('products').doc(productId).update({ stock: stockReal });
```

### Firestore Transactions

Complex operations (sales, purchases) use Firestore transactions or sequential writes with error handling. Never assume success - always verify writes and handle partial failures.

## Branch Information

- Main branch: `main`
- Current branch: `refactorizacion-modular`
- Recent focus: Batch system implementation, modular refactoring

## Known Issues & Considerations

1. **Email-based roles**: User roles are hardcoded by email - changes require updating both [firestore.rules](firestore.rules) and [common.js](public/js/common.js)
2. **Index requirements**: Firestore queries with `.where()` + `.orderBy()` may need composite indexes (check console errors)
3. **Legacy sales**: Older sales may not have `lotesInfo` - handle gracefully with fallbacks
4. **Stock discrepancies**: If `product.stock` differs from sum of batches, prefer batch calculation as source of truth
5. **Modal stacking**: Multiple modals can cause z-index issues - use `emergencyCloseModals()` if needed

## Testing Checklist

When making changes, verify:
- [ ] All 3 user roles can access appropriate sections
- [ ] Product stock updates correctly after sales/purchases
- [ ] Batch quantities match product stock
- [ ] Cash flow entries created for relevant transactions
- [ ] Firestore security rules prevent unauthorized access
- [ ] Mobile responsiveness (sidebar, filters, tables)
- [ ] Error handling for network failures
- [ ] Browser console has no errors
