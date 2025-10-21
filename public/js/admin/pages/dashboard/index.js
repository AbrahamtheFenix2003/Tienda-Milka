import {
    renderDashboardUI,
    updateSummaryCards,
    renderSalesChart,
    renderCategorySalesChart,
    renderTopProducts,
    renderRecentActivity,
    showDashboardError,
} from './ui.js';

import {
    getDashboardMetrics,
    getSalesChartData,
    getCategorySalesData,
    getTopProducts,
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
        const [metrics, chartData, categoryData, topProducts, activities] = await Promise.all([
            getDashboardMetrics(),
            getSalesChartData({ days: 7 }),
            getCategorySalesData(),
            getTopProducts(5),
            getRecentActivity(adminContext),
        ]);

        updateSummaryCards(metrics);
        renderSalesChart(chartData);
        renderCategorySalesChart(categoryData);
        renderTopProducts(topProducts);
        renderRecentActivity(activities);
    } catch (error) {
        console.error('Error loading dashboard page:', error);
        showDashboardError('Error: no se pudo cargar el dashboard');
    }
}

if (typeof window !== 'undefined') {
    window.loadDashboardPage = loadDashboardPage;
}

