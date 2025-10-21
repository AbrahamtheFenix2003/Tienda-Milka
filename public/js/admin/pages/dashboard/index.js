import {
    renderDashboardUI,
    updateSummaryCards,
    renderSalesChart,
    renderCategorySalesChart,
    renderTopProducts,
    renderTopProfitableProducts,
    renderRecentActivity,
    showDashboardError,
} from './ui.js';

import {
    getDashboardMetrics,
    getSalesChartData,
    getCategorySalesData,
    getTopProducts,
    getTopProfitableProducts,
    getRecentActivity,
} from './data.js';

function resolveAdminContext() {
    if (typeof window === 'undefined') {
        return {
            isAdminFn: undefined,
            currentUser: undefined,
        };
    }

    return {
        isAdminFn: window.isAdmin,
        currentUser: window.currentUser,
    };
}

export async function loadDashboardPage() {
    renderDashboardUI();

    const adminContext = resolveAdminContext();

    try {
        const [metrics, chartData, categoryData, topProducts, topProfitableProducts, activities] = await Promise.all([
            getDashboardMetrics(),
            getSalesChartData({ days: 7 }),
            getCategorySalesData(),
            getTopProducts(5),
            getTopProfitableProducts(5),
            getRecentActivity(adminContext),
        ]);

        updateSummaryCards(metrics);
        renderSalesChart(chartData);
        renderCategorySalesChart(categoryData);
        renderTopProducts(topProducts);
        renderTopProfitableProducts(topProfitableProducts);
        renderRecentActivity(activities);
    } catch (error) {
        console.error('Error loading dashboard page:', error);
        showDashboardError('Error: no se pudo cargar el dashboard');
    }
}

if (typeof window !== 'undefined') {
    window.loadDashboardPage = loadDashboardPage;
}

