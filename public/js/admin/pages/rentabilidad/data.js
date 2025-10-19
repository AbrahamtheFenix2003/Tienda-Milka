// public/js/admin/pages/rentabilidad/data.js
import { getDb } from '../../services/firebase.js';

/**
 * Obtiene la fecha de una venta SOLO usando timestamp
 * @param {object} sale - Objeto de venta
 * @returns {Date|null} Fecha de la venta o null
 */
function getSaleDate(sale) {
  if (!sale) {
    return null;
  }

  // SOLO usar timestamp, ignorar date y otros campos
  if (sale.timestamp && typeof sale.timestamp.toDate === 'function') {
    return sale.timestamp.toDate();
  }

  if (sale.timestamp) {
    return new Date(sale.timestamp);
  }

  return null;
}

/**
 * Calcula los datos de rentabilidad para un rango de fechas dado.
 * @param {Date} startDate - La fecha de inicio del período.
 * @param {Date} endDate - La fecha de fin del período.
 * @returns {Promise<object>} Un objeto con los KPIs y el desglose de productos.
 */
export async function getProfitabilityData(startDate, endDate) {
    const db = getDb();
    if (!db) {
        throw new Error('Firestore no está inicializado');
    }

    // Convertir a formato de string para la comparación usando zona horaria local
    const startYear = startDate.getFullYear();
    const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
    const startDay = String(startDate.getDate()).padStart(2, '0');
    const startDateStr = `${startYear}-${startMonth}-${startDay}`;
    
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endDateStr = `${endYear}-${endMonth}-${endDay}`;

    // 1. OBTENER DATOS CRUDOS EN PARALELO
    const [salesSnapshot, purchasesSnapshot, expensesSnapshot, incomesSnapshot] = await Promise.all([
        db.collection("sales").get(), // Obtenemos todas y filtramos después
        db.collection("compras").get(),
        db.collection("movimientos_caja")
            .where("tipo", "==", "salida")
            .get(),
        db.collection("movimientos_caja")
            .where("tipo", "==", "entrada")
            .get()
    ]);

    // Filtrar ventas por rango de fechas usando la función robusta getSaleDate
    const sales = [];
    console.log('=== DEBUG FILTRADO DE VENTAS ===');
    console.log('Rango solicitado:', startDateStr, 'a', endDateStr);
    console.log('Total ventas en BD:', salesSnapshot.size);
    
    salesSnapshot.forEach(doc => {
        const data = doc.data();
        const saleDate = getSaleDate(data);
        
        if (saleDate) {
            // Usar fecha local en lugar de UTC para evitar cambios de día
            const year = saleDate.getFullYear();
            const month = String(saleDate.getMonth() + 1).padStart(2, '0');
            const day = String(saleDate.getDate()).padStart(2, '0');
            const saleDateStr = `${year}-${month}-${day}`;
            
            const isInRange = saleDateStr >= startDateStr && saleDateStr <= endDateStr;
            
            console.log(`Venta ${doc.id}: timestamp=${data.timestamp?.toDate?.()}, fecha local=${saleDateStr}, incluida=${isInRange}`);
            
            if (isInRange) {
                sales.push({ id: doc.id, ...data });
            }
        } else {
            console.log(`Venta ${doc.id}: SIN timestamp válido, excluida`);
        }
    });
    
    console.log('Total ventas FILTRADAS:', sales.length);
    console.log('================================');

    const purchases = [];
    purchasesSnapshot.forEach(doc => {
        purchases.push({ id: doc.id, ...doc.data() });
    });

    // Filtrar gastos por rango de fechas
    const expenses = [];
    const expensesExcluded = [];
    
    console.log('=== DEBUG GASTOS OPERATIVOS ===');
    console.log('Rango de fechas:', startDateStr, 'a', endDateStr);
    console.log('Total de salidas en BD (tipo="salida"):', expensesSnapshot.size);
    
    expensesSnapshot.forEach(doc => {
        const data = doc.data();
        const expenseDate = data.date || data.fecha;
        let expenseDateStr;

        if (typeof expenseDate === 'string') {
            expenseDateStr = expenseDate;
        } else if (expenseDate?.toDate) {
            expenseDateStr = expenseDate.toDate().toISOString().split('T')[0];
        }

        if (expenseDateStr && expenseDateStr >= startDateStr && expenseDateStr <= endDateStr) {
            expenses.push(data);
        } else {
            expensesExcluded.push({
                fecha: expenseDate,
                fechaStr: expenseDateStr,
                monto: data.amount || data.monto,
                descripcion: data.description || data.descripcion,
                razon: !expenseDateStr ? 'Sin fecha' : 'Fuera de rango'
            });
        }
    });

    console.log('Salidas INCLUIDAS en el rango:', expenses.length);
    console.log('Detalle de salidas incluidas:', expenses.map(e => ({
        fecha: e.date || e.fecha,
        monto: e.amount || e.monto,
        descripcion: e.description || e.descripcion
    })));
    
    console.log('\nSalidas EXCLUIDAS (fuera de rango o sin fecha):', expensesExcluded.length);
    console.log('Detalle de salidas excluidas:', expensesExcluded);

    // Filtrar ingresos adicionales (entradas de caja) por rango de fechas
    const otherIncomes = [];
    incomesSnapshot.forEach(doc => {
        const data = doc.data();
        const incomeDate = data.date || data.fecha;
        let incomeDateStr;

        if (typeof incomeDate === 'string') {
            incomeDateStr = incomeDate;
        } else if (incomeDate?.toDate) {
            incomeDateStr = incomeDate.toDate().toISOString().split('T')[0];
        }

        if (incomeDateStr && incomeDateStr >= startDateStr && incomeDateStr <= endDateStr) {
            otherIncomes.push(data);
        }
    });

    // 2. PROCESAR DATOS Y CALCULAR COGS (FIFO/PEPS)
    const productsProfitability = {};
    let totalCostOfGoodsSold = 0;
    let totalRevenue = 0;

    // Estructurar compras para un acceso fácil
    const purchasesByProduct = {};
    purchases.forEach(purchase => {
        const items = purchase.items || [];
        items.forEach(item => {
            const productId = item.productId || item.id;
            if (!productId) return;

            if (!purchasesByProduct[productId]) {
                purchasesByProduct[productId] = [];
            }

            const purchaseDate = purchase.date?.toDate ? purchase.date.toDate() : new Date(purchase.date);
            const cost = parseFloat(item.cost || item.precio || item.costoUnitario || 0);
            const quantity = parseInt(item.quantity || item.cantidad || 0);

            purchasesByProduct[productId].push({
                quantity: quantity,
                cost: cost,
                date: purchaseDate,
                remaining: quantity
            });
        });
    });

    // Ordenar las compras de cada producto por fecha (FIFO)
    for (const productId in purchasesByProduct) {
        purchasesByProduct[productId].sort((a, b) => a.date - b.date);
    }

    // Procesar ventas y calcular COGS
    sales.forEach(sale => {
        const saleTotal = parseFloat(sale.totalSale || sale.total || 0);
        totalRevenue += saleTotal;

        const items = sale.items || [];
        items.forEach(item => {
            const productId = item.productId || item.id;
            if (!productId) return;

            let itemCost = 0;
            let quantityToAccount = parseInt(item.quantity || item.cantidad || 0);
            const productPurchases = purchasesByProduct[productId] || [];

            // Aplicar FIFO: consumir lotes más antiguos primero
            for (const purchaseLot of productPurchases) {
                if (quantityToAccount === 0) break;

                const quantityFromLot = Math.min(quantityToAccount, purchaseLot.remaining);
                if (quantityFromLot > 0) {
                    itemCost += quantityFromLot * purchaseLot.cost;
                    purchaseLot.remaining -= quantityFromLot;
                    quantityToAccount -= quantityFromLot;
                }
            }

            // Si aún queda cantidad sin asignar, usar el costo del producto como fallback
            if (quantityToAccount > 0 && item.cost) {
                itemCost += quantityToAccount * parseFloat(item.cost);
            }

            totalCostOfGoodsSold += itemCost;

            // Acumular datos por producto
            const productName = item.name || item.nombre || 'Producto sin nombre';
            if (!productsProfitability[productId]) {
                productsProfitability[productId] = {
                    nombre: productName,
                    unidadesVendidas: 0,
                    ingresoTotal: 0,
                    costoTotal: 0,
                };
            }

            const itemQuantity = parseInt(item.quantity || item.cantidad || 0);
            const itemPrice = parseFloat(item.price || item.precio || 0);

            productsProfitability[productId].unidadesVendidas += itemQuantity;
            productsProfitability[productId].ingresoTotal += itemPrice * itemQuantity;
            productsProfitability[productId].costoTotal += itemCost;
        });
    });

    // 3. CALCULAR MÉTRICAS FINALES
    
    // Calcular total de entradas de caja (sin incluir ventas)
    const totalIngresosCaja = otherIncomes.reduce((acc, curr) => {
        const amount = parseFloat(curr.amount || curr.monto || 0);
        return acc + amount;
    }, 0);
    
    const totalExpenses = expenses.reduce((acc, curr) => {
        const amount = parseFloat(curr.amount || curr.monto || 0);
        return acc + amount;
    }, 0);

    console.log('Total Gastos Operativos calculado:', totalExpenses);
    console.log('================================');

    // Ganancia Bruta se calcula solo con ingresos por ventas
    const grossProfit = totalRevenue - totalCostOfGoodsSold;

    const kpis = {
        ingresos: totalIngresosCaja,  // Solo entradas de caja
        ingresoTotalVentas: totalRevenue,  // Total de ingresos por ventas
        numeroVentas: sales.length,
        costoVenta: totalCostOfGoodsSold,
        gananciaBruta: grossProfit,
        gastosOperativos: totalExpenses,
    };

    const productsArray = Object.values(productsProfitability).map(p => {
        const gananciaBruta = p.ingresoTotal - p.costoTotal;
        const margenBruto = p.ingresoTotal > 0 ? (gananciaBruta / p.ingresoTotal) * 100 : 0;
        return { ...p, gananciaBruta, margenBruto };
    }).sort((a, b) => b.gananciaBruta - a.gananciaBruta); // Ordenar por los más rentables

    return { kpis, products: productsArray };
}
