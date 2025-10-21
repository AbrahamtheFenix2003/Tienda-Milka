import { loadAllSalesAndExpenses, getSaleDate } from '../reportes/data.js';
import { ensureProductsCache } from '../ventas/data.js';
import { getDb } from '../../services/firebase.js';

const LOW_STOCK_THRESHOLD = 5;
let baseDataPromise = null;
let purchasesPromise = null;

function resetBaseDataOnError() {
    baseDataPromise = null;
}

function resetPurchasesOnError() {
    purchasesPromise = null;
}

async function ensureBaseData() {
    if (!baseDataPromise) {
        baseDataPromise = Promise.all([
            loadAllSalesAndExpenses(),
            ensureProductsCache(),
        ])
            .then(([salesAndExpenses, products]) => {
                const sales = salesAndExpenses?.allSales ?? [];
                const expenses = salesAndExpenses?.allExpenses ?? [];
                return {
                    sales: Array.isArray(sales) ? sales : [],
                    expenses: Array.isArray(expenses) ? expenses : [],
                    products: Array.isArray(products) ? products : [],
                };
            })
            .catch((error) => {
                resetBaseDataOnError();
                throw error;
            });
    }
    return baseDataPromise;
}

async function ensurePurchases() {
    if (typeof window !== 'undefined' && Array.isArray(window.comprasCache) && window.comprasCache.length > 0) {
        return window.comprasCache;
    }

    if (!purchasesPromise) {
        const db = getDb();
        if (!db) {
            throw new Error('Firestore no está inicializado');
        }

        purchasesPromise = db
            .collection('compras')
            .get()
            .then((snapshot) =>
                snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })),
            )
            .then((purchases) => {
                if (typeof window !== 'undefined') {
                    window.comprasCache = purchases;
                }
                return purchases;
            })
            .catch((error) => {
                resetPurchasesOnError();
                throw error;
            });
    }

    return purchasesPromise;
}

function toNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function resolveDate(value) {
    if (!value) {
        return new Date(0);
    }
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return new Date(value);
    }
    if (value?.toDate && typeof value.toDate === 'function') {
        try {
            return value.toDate();
        } catch (error) {
            return new Date(0);
        }
    }
    if (typeof value === 'object' && value !== null && typeof value.seconds === 'number') {
        return new Date(value.seconds * 1000);
    }
    return new Date(0);
}

function buildPurchaseLotsByProduct(purchases) {
    const lotsByProduct = new Map();

    purchases.forEach((purchase) => {
        const rawItems = Array.isArray(purchase.items) && purchase.items.length > 0 ? purchase.items : purchase.productos;
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
            return;
        }

        const purchaseDate = resolveDate(purchase.date ?? purchase.fecha ?? purchase.timestamp);

        rawItems.forEach((item) => {
            const productId = item?.productId || item?.id || item?.productoId || item?.codigo || item?.sku;
            if (!productId) {
                return;
            }

            const quantity = Math.max(0, toNumber(item.quantity ?? item.cantidad ?? item.qty ?? item.cantidadComprada ?? item.units));
            if (quantity <= 0) {
                return;
            }

            const unitCost = Math.max(
                0,
                toNumber(item.cost ?? item.costo ?? item.costoUnitario ?? item.precio ?? item.precioCompra ?? item.acquisitionCost),
            );

            if (!lotsByProduct.has(productId)) {
                lotsByProduct.set(productId, []);
            }

            lotsByProduct.get(productId).push({
                date: purchaseDate,
                cost: unitCost,
                remaining: quantity,
            });
        });
    });

    lotsByProduct.forEach((lots) => {
        lots.sort((a, b) => a.date.getTime() - b.date.getTime());
    });

    return lotsByProduct;
}

function resolveRevenue({ item, sale, quantity, isSingleItemSale }) {
    const subtotalCandidates = [item?.subtotal, item?.total, item?.totalSale, item?.montoTotal];
    for (const candidate of subtotalCandidates) {
        const value = toNumber(candidate);
        if (value > 0) {
            return value;
        }
    }

    const unitPriceCandidates = [item?.price, item?.precio, item?.unitPrice, item?.precioVenta];
    for (const candidate of unitPriceCandidates) {
        const value = toNumber(candidate);
        if (value > 0 && quantity > 0) {
            return value * quantity;
        }
    }

    if (isSingleItemSale) {
        const saleTotal = toNumber(sale?.totalSale ?? sale?.total);
        if (saleTotal > 0) {
            return saleTotal;
        }
    }

    return 0;
}

function resolveUnitCost({ item, sale, quantity, isSingleItemSale }) {
    const unitCostCandidates = [
        item?.cost,
        item?.costo,
        item?.costoUnitario,
        item?.precioCompra,
        item?.acquisitionCost,
        item?.unitCost,
    ];

    for (const candidate of unitCostCandidates) {
        const value = toNumber(candidate);
        if (value > 0) {
            return value;
        }
    }

    const totalCostCandidates = [item?.totalCost, item?.costoTotal];
    for (const candidate of totalCostCandidates) {
        const value = toNumber(candidate);
        if (value > 0 && quantity > 0) {
            return value / quantity;
        }
    }

    if (isSingleItemSale) {
        const saleTotalCost = toNumber(sale?.totalCost);
        if (saleTotalCost > 0 && quantity > 0) {
            return saleTotalCost / quantity;
        }
    }

    return 0;
}

function consumeLots(lotsByProduct, productId, quantityNeeded, fallbackUnitCost) {
    let remaining = Math.max(0, toNumber(quantityNeeded));
    let totalCost = 0;

    if (productId && lotsByProduct.has(productId)) {
        const lots = lotsByProduct.get(productId);
        for (const lot of lots) {
            if (remaining <= 0) {
                break;
            }
            const lotAvailable = Math.max(0, toNumber(lot.remaining));
            if (lotAvailable <= 0) {
                continue;
            }
            const quantityFromLot = Math.min(remaining, lotAvailable);
            totalCost += quantityFromLot * Math.max(0, toNumber(lot.cost));
            lot.remaining = lotAvailable - quantityFromLot;
            remaining -= quantityFromLot;
        }
    }

    const fallbackCost = Math.max(0, toNumber(fallbackUnitCost));
    if (remaining > 0 && fallbackCost > 0) {
        totalCost += remaining * fallbackCost;
        remaining = 0;
    }

    return totalCost;
}

function resolveProductKey(productId, name) {
    if (productId) {
        return String(productId);
    }
    const normalizedName = (name || 'Producto sin nombre').trim().toLowerCase();
    return `name:${normalizedName}`;
}

export async function getDashboardMetrics() {
    const { sales, products } = await ensureBaseData();

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + toNumber(sale.totalSale), 0);
    const totalProducts = products.length;
    const lowStock = products.filter((product) => toNumber(product.stock) < LOW_STOCK_THRESHOLD).length;

    return {
        totalSales,
        totalRevenue,
        totalProducts,
        lowStock,
    };
}

export async function getSalesChartData({ days = 7 } = {}) {
    const { sales } = await ensureBaseData();
    const clampedDays = Math.max(1, days);

    const dayEntries = Array.from({ length: clampedDays }, (_, index) => {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (clampedDays - 1 - index));
        const iso = date.toISOString().split('T')[0];
        return { iso, date };
    });

    const salesByDay = dayEntries.reduce((acc, { iso }) => {
        acc[iso] = 0;
        return acc;
    }, {});

    sales.forEach((sale) => {
        const saleDate = getSaleDate(sale);
        if (!saleDate) {
            return;
        }
        const dateIso = new Date(saleDate).toISOString().split('T')[0];
        if (salesByDay[dateIso] === undefined) {
            return;
        }
        salesByDay[dateIso] += toNumber(sale.totalSale);
    });

    return {
        dates: dayEntries.map(({ iso }) => iso),
        totals: dayEntries.map(({ iso }) => salesByDay[iso]),
    };
}

export async function getTopProducts(limit = 5) {
    const { sales } = await ensureBaseData();
    const normalizedLimit = Math.max(1, limit);

    const productTotals = new Map();

    sales.forEach((sale) => {
        if (Array.isArray(sale.items) && sale.items.length > 0) {
            sale.items.forEach((item) => {
                const name = item.name || item.nombre;
                if (!name) {
                    return;
                }
                if (!productTotals.has(name)) {
                    productTotals.set(name, { name, quantity: 0, revenue: 0 });
                }
                const stats = productTotals.get(name);
                stats.quantity += toNumber(item.quantity);
                stats.revenue += toNumber(item.quantity) * toNumber(item.price);
            });
            return;
        }

        if (sale.productName) {
            const name = sale.productName;
            if (!productTotals.has(name)) {
                productTotals.set(name, { name, quantity: 0, revenue: 0 });
            }
            const stats = productTotals.get(name);
            const quantity = sale.quantitySold !== undefined ? sale.quantitySold : 1;
            stats.quantity += toNumber(quantity);
            stats.revenue += toNumber(sale.totalSale);
        }
    });

    const sortedProducts = Array.from(productTotals.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, normalizedLimit);

    return sortedProducts;
}

export async function getTopProfitableProducts(limit = 5) {
    const normalizedLimit = Math.max(1, limit);
    const [baseData, purchases] = await Promise.all([ensureBaseData(), ensurePurchases()]);
    const { sales } = baseData;
    const lotsByProduct = buildPurchaseLotsByProduct(purchases);
    const productStats = new Map();

    const updateStats = (productId, name, quantity, revenue, cost) => {
        const quantitySold = Math.max(0, toNumber(quantity));
        if (quantitySold <= 0) {
            return;
        }

        const resolvedName = name || 'Producto sin nombre';
        const key = resolveProductKey(productId, resolvedName);
        if (!productStats.has(key)) {
            productStats.set(key, {
                productId: productId || null,
                name: resolvedName,
                unitsSold: 0,
                revenue: 0,
                cost: 0,
            });
        }

        const stats = productStats.get(key);
        stats.unitsSold += quantitySold;
        stats.revenue += Math.max(0, toNumber(revenue));
        stats.cost += Math.max(0, toNumber(cost));
    };

    sales.forEach((sale) => {
        if (Array.isArray(sale?.items) && sale.items.length > 0) {
            const isSingleItemSale = sale.items.length === 1;
            sale.items.forEach((item) => {
                const quantity = Math.max(0, toNumber(item?.quantity ?? item?.cantidad ?? item?.qty ?? item?.units));
                if (quantity <= 0) {
                    return;
                }

                const productId = item?.productId || item?.id || item?.productoId || item?.codigo || item?.sku;
                const name = item?.name || item?.nombre || sale?.productName;
                const revenue = resolveRevenue({ item, sale, quantity, isSingleItemSale });
                const unitCost = resolveUnitCost({ item, sale, quantity, isSingleItemSale });
                const cost = consumeLots(lotsByProduct, productId, quantity, unitCost);

                updateStats(productId, name, quantity, revenue, cost);
            });
            return;
        }

        const productId = sale?.productId || sale?.productoId || sale?.idProducto || null;
        const name = sale?.productName || sale?.nombreProducto;
        const quantity = Math.max(0, toNumber(sale?.quantitySold ?? sale?.quantity ?? sale?.cantidad ?? 0));
        if (quantity <= 0) {
            return;
        }

        const revenue = toNumber(sale?.totalSale ?? sale?.total ?? sale?.monto ?? 0);
        let fallbackUnitCost = 0;

        if (Array.isArray(sale?.lotesInfo) && sale.lotesInfo.length > 0 && productId) {
            const matchingLot = sale.lotesInfo.find((info) => info?.productId === productId);
            if (matchingLot && toNumber(matchingLot.costoTotal) > 0) {
                fallbackUnitCost = toNumber(matchingLot.costoTotal) / Math.max(quantity, 1);
            }
        }

        if (fallbackUnitCost === 0) {
            const saleTotalCost = toNumber(sale?.totalCost ?? sale?.cost ?? sale?.costoTotal ?? 0);
            if (saleTotalCost > 0 && quantity > 0) {
                fallbackUnitCost = saleTotalCost / quantity;
            }
        }

        const cost = consumeLots(lotsByProduct, productId, quantity, fallbackUnitCost);
        updateStats(productId, name, quantity, revenue, cost);
    });

    const result = Array.from(productStats.values())
        .map((stats) => ({
            productId: stats.productId,
            name: stats.name,
            unitsSold: stats.unitsSold,
            revenue: stats.revenue,
            grossProfit: stats.revenue - stats.cost,
        }))
        .sort((a, b) => b.grossProfit - a.grossProfit)
        .slice(0, normalizedLimit);

    return result;
}

export async function getRecentActivity({ isAdminFn, currentUser } = {}) {
    const { sales, expenses } = await ensureBaseData();

    const activities = [];

    sales.slice(0, 5).forEach((sale) => {
        const date = getSaleDate(sale) || new Date();
        activities.push({
            type: 'sale',
            icon: 'fas fa-shopping-cart',
            color: 'text-green-500',
            message: `Venta a ${sale.customerName || 'Cliente'} por S/ ${toNumber(sale.totalSale).toFixed(2)}`,
            date,
        });
    });

    let canSeeExpenses = false;
    if (typeof isAdminFn === 'function') {
        const email = typeof currentUser === 'string' ? currentUser : currentUser?.email;
        try {
            canSeeExpenses = Boolean(isAdminFn(email));
        } catch (error) {
            console.warn('Error evaluating isAdminFn:', error);
        }
    } else if (typeof window !== 'undefined' && typeof window.isAdmin === 'function') {
        const email = typeof currentUser === 'string' ? currentUser : currentUser?.email;
        canSeeExpenses = Boolean(window.isAdmin(email));
    }

    if (canSeeExpenses) {
        expenses.slice(0, 3).forEach((expense) => {
            let date = null;
            if (expense.timestamp?.toDate) {
                date = expense.timestamp.toDate();
            } else if (expense.timestamp) {
                date = new Date(expense.timestamp);
            } else if (expense.date) {
                date = new Date(expense.date);
            }
            const normalizedDate = date || new Date();
            activities.push({
                type: 'expense',
                icon: 'fas fa-credit-card',
                color: 'text-red-500',
                message: `Egreso: ${expense.description || 'Sin descripcion'} - S/ ${toNumber(expense.amount).toFixed(2)}`,
                date: normalizedDate,
            });
        });
    }

    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    return activities.slice(0, 8);
}

export async function getCategorySalesData() {
    const { sales } = await ensureBaseData();
    const salesByCategory = {};

    sales.forEach((sale) => {
        if (Array.isArray(sale.items) && sale.items.length > 0) {
            sale.items.forEach((item) => {
                const category = item.category || 'Sin Categoria';
                if (!salesByCategory[category]) {
                    salesByCategory[category] = 0;
                }
                salesByCategory[category] += toNumber(item.quantity) * toNumber(item.price);
            });
        } else {
            const category = sale.category || 'Sin Categoria';
            if (!salesByCategory[category]) {
                salesByCategory[category] = 0;
            }
            salesByCategory[category] += toNumber(sale.totalSale);
        }
    });

    return {
        labels: Object.keys(salesByCategory),
        totals: Object.values(salesByCategory),
    };
}

