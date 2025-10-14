import { db } from '../../services/firebase.js';

const COLLECTION = 'movimientos_caja';
let movimientosCache = [];
let resumenCache = createEmptyResumen();
let cacheInitialized = false;

function createEmptyResumen() {
    return {
        totalEntradas: 0,
        totalSalidas: 0,
        saldoActual: 0
    };
}

function cloneResumen(resumen) {
    return {
        totalEntradas: Number(resumen.totalEntradas || 0),
        totalSalidas: Number(resumen.totalSalidas || 0),
        saldoActual: Number(resumen.saldoActual || 0)
    };
}

function getServerTimestamp() {
    if (typeof window !== 'undefined') {
        if (typeof window.serverTimestamp === 'function') {
            return window.serverTimestamp();
        }
        const fallback = window.firebase?.firestore?.FieldValue?.serverTimestamp;
        if (typeof fallback === 'function') {
            return fallback();
        }
    }
    throw new Error('serverTimestamp no disponible en el contexto actual');
}

function getFechaISOActual() {
    return new Date().toISOString().split('T')[0];
}

function getUsuarioActual() {
    if (typeof window !== 'undefined' && window.currentUser?.email) {
        return window.currentUser.email;
    }
    return 'Sistema';
}

function buildMovimientoPayload({
    tipo,
    monto,
    categoria,
    descripcion,
    saldoAnterior,
    relatedTo = null,
    relatedId = null
}) {
    const montoNumber = Number(monto || 0);
    const saldoPrevio = Number(saldoAnterior || 0);
    const saldoNuevo = tipo === 'entrada'
        ? saldoPrevio + montoNumber
        : saldoPrevio - montoNumber;

    return {
        tipo,
        monto: montoNumber,
        categoria: categoria || 'sin_categoria',
        descripcion: descripcion || '',
        fecha: getFechaISOActual(),
        timestamp: getServerTimestamp(),
        usuario: getUsuarioActual(),
        saldoAnterior: saldoPrevio,
        saldoNuevo,
        relatedTo,
        relatedId
    };
}

function calcularResumen(movimientos) {
    return movimientos.reduce((acumulado, movimiento) => {
        if (!movimiento || movimiento.tipo === 'apertura_caja') {
            return acumulado;
        }
        const monto = Number(movimiento.monto || 0);
        if (movimiento.tipo === 'entrada') {
            acumulado.totalEntradas += monto;
            acumulado.saldoActual += monto;
        } else if (movimiento.tipo === 'salida' || movimiento.tipo === 'egreso') {
            acumulado.totalSalidas += monto;
            acumulado.saldoActual -= monto;
        }
        return acumulado;
    }, createEmptyResumen());
}

function actualizarCacheLocal(nuevosMovimientos) {
    movimientosCache = Array.isArray(nuevosMovimientos)
        ? [...nuevosMovimientos]
        : [];
    resumenCache = calcularResumen(movimientosCache);
    cacheInitialized = true;
    return {
        movimientos: getMovimientosCache(),
        resumen: getResumenCaja()
    };
}

async function ensureCacheInicializada() {
    if (cacheInitialized) {
        return;
    }
    await fetchLatestMovimientos();
}

async function integrarMovimiento(docRef) {
    const snapshot = await docRef.get();
    if (!snapshot.exists) {
        return {
            movimientos: getMovimientosCache(),
            resumen: getResumenCaja()
        };
    }
    const movimiento = { id: snapshot.id, ...snapshot.data() };
    movimientosCache = [movimiento, ...movimientosCache];
    resumenCache = calcularResumen(movimientosCache);
    return {
        movimiento,
        movimientos: getMovimientosCache(),
        resumen: getResumenCaja()
    };
}

export function getMovimientosCache() {
    return movimientosCache.map(movimiento => ({ ...movimiento }));
}

export function getResumenCaja() {
    return cloneResumen(resumenCache);
}

export function getSaldoActual() {
    return Number(resumenCache.saldoActual || 0);
}

export async function fetchLatestMovimientos() {
    const query = db
        .collection(COLLECTION)
        .orderBy('timestamp', 'desc');

    const snapshot = await query.get();
    const movimientos = [];
    snapshot.forEach(doc => {
        movimientos.push({ id: doc.id, ...doc.data() });
    });

    return actualizarCacheLocal(movimientos);
}

export async function addEntrada({ monto, categoria, descripcion }) {
    await ensureCacheInicializada();
    const payload = buildMovimientoPayload({
        tipo: 'entrada',
        monto,
        categoria,
        descripcion,
        saldoAnterior: getSaldoActual()
    });

    const docRef = await db.collection(COLLECTION).add(payload);
    const { movimientos, resumen } = await integrarMovimiento(docRef);
    return { movimientos, resumen };
}

export async function addSalida({ monto, categoria, descripcion }) {
    await ensureCacheInicializada();
    const payload = buildMovimientoPayload({
        tipo: 'salida',
        monto,
        categoria,
        descripcion,
        saldoAnterior: getSaldoActual()
    });

    const docRef = await db.collection(COLLECTION).add(payload);
    const { movimientos, resumen } = await integrarMovimiento(docRef);
    return { movimientos, resumen };
}

export async function registrarMovimientoCaja(
    tipo,
    monto,
    categoria,
    descripcion,
    relatedTo = null,
    relatedId = null,
    opciones = {}
) {
    const tipoNormalizado = tipo === 'egreso' ? 'salida' : tipo;
    await ensureCacheInicializada();

    const payload = buildMovimientoPayload({
        tipo: tipoNormalizado,
        monto,
        categoria,
        descripcion,
        saldoAnterior: Number(opciones.saldoAnterior ?? getSaldoActual()),
        relatedTo,
        relatedId
    });

    const docRef = await db.collection(COLLECTION).add(payload);
    await integrarMovimiento(docRef);
    return true;
}

export async function deleteMovimiento(id) {
    await db.collection(COLLECTION).doc(id).delete();
    movimientosCache = movimientosCache.filter(movimiento => movimiento.id !== id);
    resumenCache = calcularResumen(movimientosCache);
    return {
        movimientos: getMovimientosCache(),
        resumen: getResumenCaja()
    };
}

export async function getMovimientoById(id) {
    const cachedMovimiento = movimientosCache.find(movimiento => movimiento.id === id);
    if (cachedMovimiento) {
        return { ...cachedMovimiento };
    }

    const snapshot = await db.collection(COLLECTION).doc(id).get();
    if (!snapshot.exists) {
        return null;
    }
    return { id: snapshot.id, ...snapshot.data() };
}

export async function updateMovimiento(id, updates) {
    const changes = {
        ...updates,
        updatedAt: getServerTimestamp(),
        updatedBy: getUsuarioActual()
    };

    await db.collection(COLLECTION).doc(id).update(changes);
    const snapshot = await db.collection(COLLECTION).doc(id).get();

    if (!snapshot.exists) {
        return {
            movimientos: getMovimientosCache(),
            resumen: getResumenCaja()
        };
    }

    const movimientoActualizado = { id: snapshot.id, ...snapshot.data() };
    movimientosCache = movimientosCache.map(movimiento =>
        movimiento.id === id ? movimientoActualizado : movimiento
    );
    resumenCache = calcularResumen(movimientosCache);

    return {
        movimiento: movimientoActualizado,
        movimientos: getMovimientosCache(),
        resumen: getResumenCaja()
    };
}

if (typeof window !== 'undefined') {
    window.registrarMovimientoCaja = registrarMovimientoCaja;
}
