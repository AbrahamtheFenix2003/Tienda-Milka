import { renderVentasUI } from './ui.js';
import { ensureProductsCache, fetchAllSales } from './data.js';

export async function loadVentasPage() {
    try {
        const [, sales] = await Promise.all([
            ensureProductsCache(),
            fetchAllSales(),
        ]);

        await renderVentasUI({ recentSales: sales });
    } catch (error) {
        console.error('Error inicializando la página de ventas:', error);
        await renderVentasUI();
    }
}
