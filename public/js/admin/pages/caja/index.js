import { fetchLatestMovimientos } from './data.js';
import { renderCajaUI, renderUnauthorizedCaja, updateCajaView } from './ui.js';

function userHasAccess() {
    if (typeof window === 'undefined') {
        return false;
    }
    const { currentUser, isAdmin } = window;
    if (!currentUser || typeof isAdmin !== 'function') {
        return false;
    }
    try {
        return Boolean(isAdmin(currentUser.email));
    } catch (error) {
        console.warn('No se pudo verificar permisos de caja:', error);
        return false;
    }
}

export async function loadCajaPage() {
    if (!userHasAccess()) {
        renderUnauthorizedCaja();
        return;
    }

    renderCajaUI();

    try {
        const { movimientos, resumen } = await fetchLatestMovimientos();
        updateCajaView(movimientos, resumen);
    } catch (error) {
        console.error('Error cargando datos iniciales de caja:', error);
    }
}
