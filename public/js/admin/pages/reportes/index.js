import { loadAllSalesAndExpenses } from './data.js';
import { renderReportesUI, displaySalesHistory, updateSummaryCards, showErrorMessage } from './ui.js';
import { renderSalesPerformanceChart, renderCategorySalesChart } from './charts.js';

export async function loadReportesPage() {
  try {
    renderReportesUI();
    const { allSales, allExpenses } = await loadAllSalesAndExpenses();

    displaySalesHistory(allSales);
    updateSummaryCards(allSales, allExpenses);

    renderSalesPerformanceChart(allSales);
    renderCategorySalesChart(allSales);
  } catch (error) {
    console.error('Error al cargar la pagina de reportes:', error);
    showErrorMessage('No se pudieron cargar los datos. Intente de nuevo.');
  }
}