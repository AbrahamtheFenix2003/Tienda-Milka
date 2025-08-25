# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is a Firebase web application for "Tienda Milka" - a store management system with inventory, sales, and financial tracking capabilities.

**Frontend**: Vanilla JavaScript with Tailwind CSS  
**Backend**: Firebase Functions (Node.js + Express)  
**Database**: Cloud Firestore  
**Hosting**: Firebase Hosting  

### Core Components

#### Admin Dashboard (`public/admin-layout.html`)
Single-page application with modular architecture. Different sections are loaded dynamically:
- Dashboard (`admin-dashboard.js`)
- Products (`admin-productos.js`) 
- Sales (`admin-ventas.js`)
- Reports (`admin-reportes.js`)
- Inventory/Warehouse (`admin-almacen.js`)
- Purchases (modular system - see below)
- Cash Management (`admin-caja.js`)
- Financial Reports (`admin-ingresos-egresos.js`)

#### Modular Purchase System
The purchase module has been refactored into multiple specialized files:
- `admin-compras-main.js` - Entry point and module coordination
- `admin-compras-ui.js` - User interface rendering and updates
- `admin-compras-data.js` - Data operations and Firebase interactions
- `admin-compras-modals.js` - Modal dialogs and form handling
- `admin-compras-utils.js` - Utility functions and system verification
- `admin-compras-backup.js` - Legacy backup functionality

#### User Access Levels (Firestore Rules)
- **Super Admin**: `elinquisidor09@gmail.com`, `milkavv.2001@gmail.com` - Full access
- **Super Seller**: `garyvv.1993@gmail.com`, `abrahamjimenez092003@gmail.com` - Admin access except some restrictions
- **Seller**: `amvf280194@gmail.com`, `noeatlas28@gmail.com` - Limited to sales operations

#### Key Firebase Collections
- `products` - Product catalog with stock management
- `sales` - Sales transactions with profit calculations
- `categories` - Product categorization
- `expenses` - Business expenses (admin only)
- `movimientos_inventario` - Inventory movement tracking
- `movimientos_caja` - Cash flow movements
- `compras` - Purchase orders and receipts
- `proveedores` - Supplier management
- `stock_por_lote` - Batch/lot-based stock management system
- `product_analytics` - Product performance analytics

### Data Integration Pattern
The system uses automatic integration between modules:
- **Sales** → automatically updates inventory and cash movements
- **Purchases** → automatically updates inventory, registers cash outflow, and creates stock lots
- **Inventory** → tracks all stock movements from sales/purchases with lot-based tracking
- **Financial Reports** → consolidates data from all sources

### Batch/Lot Management System
**Status**: Fully implemented for purchases, pending integration with sales
- Automatic lot creation during purchase registration with sequential naming (`lote1`, `lote2`, etc.)
- FIFO (First In, First Out) stock management for cost accuracy
- Complete traceability from purchase to sale through lot system
- Legacy lot creation for migrating existing products
- Integration with inventory movements and financial tracking

### Date Handling
Critical: The system handles legacy date fields with the `getSaleDate()` helper function:
```javascript
function getSaleDate(sale) {
  if (sale.timestamp && sale.timestamp.toDate) return sale.timestamp.toDate();
  if (sale.timestamp) return new Date(sale.timestamp);
  if (sale.soldAt && sale.soldAt.toDate) return sale.soldAt.toDate();
  if (sale.soldAt) return new Date(sale.soldAt);
  if (sale.date) return new Date(sale.date);
  return null;
}
```

### SSR for Product Pages
The `functions/index.js` contains Express server for server-side rendering of product pages (`/producto/:productId`) with dynamic meta tags for social sharing.

## Building and Running

### Firebase Functions
```bash
# In functions/ directory
npm run lint          # Run ESLint
npm run serve         # Start local emulator
npm run deploy        # Deploy to Firebase
npm run logs          # View function logs
```

### Firebase Project
```bash
firebase serve        # Serve project locally
firebase deploy       # Deploy hosting + functions
firebase deploy --only hosting  # Deploy only hosting
firebase deploy --only functions  # Deploy only functions
```

## Development Conventions

### Working with Firebase
- Test locally with `firebase serve` before deploying
- Use `firebase deploy --only hosting` for frontend-only changes
- Functions require Node.js 22 (specified in functions/package.json)

### JavaScript Module Pattern
- Each admin section is a separate JS file with its own initialization
- Common functionality is in `common.js` (Firebase init, navigation, service worker)  
- All modules follow the pattern: load data → render UI → attach event listeners
- **Modular Architecture**: Complex modules (like purchases) are split into specialized files:
  - `*-main.js` - Entry point and coordination
  - `*-ui.js` - User interface management  
  - `*-data.js` - Data operations and Firebase interactions
  - `*-modals.js` - Modal dialogs and forms
  - `*-utils.js` - Utility functions and verification

### Stock Management
- **Lot-Based System**: Stock is managed through individual lots with complete traceability
- Stock updates are automatic through sales/purchases with lot creation/consumption
- Manual stock adjustments should create inventory movements and affect specific lots
- Always verify stock movements exist before restoring stock on sale cancellations
- **Real Stock Calculation**: Stock totals are calculated by summing all active lots for a product

### Financial Calculations
- Use `sale.profit` for net profit calculations (not `sale.total`)
- Separate gross income (`totalSale`) from net profit (`profit`)
- Avoid double-counting by not mixing sales data with cash movement data
