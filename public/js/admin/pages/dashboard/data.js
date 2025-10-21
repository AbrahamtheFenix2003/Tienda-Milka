import { loadAllSalesAndExpenses, getSaleDate } from '../reportes/data.js';
import { ensureProductsCache } from '../ventas/data.js';

const LOW_STOCK_THRESHOLD = 5;
let baseDataPromise = null;

function resetBaseDataOnError() {
    baseDataPromise = null;
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

function toNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
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

