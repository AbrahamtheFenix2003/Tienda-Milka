import {
  loadAllData,
  updateStats,
  comprasState,
} from './data.js';
import { renderComprasUI } from './ui.js';

let proveedoresListenerRegistered = false;

function resetLocalState() {
  comprasState.productosCompraActual = [];
  comprasState.productosEditandoActual = [];
  comprasState.productosOriginalEditando = [];
  comprasState.compraEditandoId = null;
  comprasState.editandoCompra = false;
}

function ensureProveedoresListener() {
  if (proveedoresListenerRegistered || typeof window === 'undefined') {
    return;
  }

  const handler = () => {
    if (!comprasState.initialized) {
      return;
    }

    setTimeout(() => {
      updateStats().catch((error) => {
        console.error('Error actualizando estadísticas de compras tras proveedoresLoaded:', error);
      });
    }, 100);
  };

  window.addEventListener('proveedoresLoaded', handler);
  proveedoresListenerRegistered = true;
}

export async function loadComprasPage() {
  resetLocalState();
  renderComprasUI();
  ensureProveedoresListener();

  try {
    await loadAllData();
    comprasState.initialized = true;
  } catch (error) {
    console.error('Error cargando la sección de compras:', error);
    throw error;
  }
}

