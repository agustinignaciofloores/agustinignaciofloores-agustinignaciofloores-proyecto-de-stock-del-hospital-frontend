// Gestión de Cocina - Dashboard funcional
const API_URL = window.buildApiUrl('/api/cocina');
const INVENTARIO_API_URL = window.buildApiUrl('/api/inventario');

let menusData = [];
let dietasData = [];
let inventarioData = [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarCocina();

    const inputBusqueda = document.getElementById('buscar-dieta');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('input', buscarDieta);
    }
});

function notify(type, message) {
    if (typeof showAlert === 'function') {
        showAlert(type, message);
        return;
    }
    alert(message);
}

function safeValue(value, fallback = '-') {
    return value === null || value === undefined || value === '' ? fallback : value;
}

function formatDate(dateInput) {
    if (!dateInput) return '-';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleDateString('es-AR');
}

function formatDateTime(dateInput) {
    if (!dateInput) return '-';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return String(dateInput);
    return date.toLocaleString('es-AR');
}

function renderEmptyRow(tbodyId, colSpan, message) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center; opacity:0.75;">${message}</td></tr>`;
}

async function parseApiError(response, fallback) {
    try {
        const payload = await response.json();
        const detail = payload?.message || payload?.error;
        return detail ? `${fallback}: ${detail}` : fallback;
    } catch (_) {
        return fallback;
    }
}

async function fetchJson(url, fallbackError) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(await parseApiError(response, fallbackError));
    }
    return response.json();
}

async function inicializarCocina() {
    try {
        const [resumen, menus, dietas, inventario] = await Promise.all([
            fetchJson(`${API_URL}/resumen`, 'No se pudo cargar el resumen de cocina'),
            fetchJson(`${API_URL}/menus`, 'No se pudieron cargar los menús'),
            fetchJson(`${API_URL}/dietas`, 'No se pudieron cargar las dietas especiales'),
            fetchJson(INVENTARIO_API_URL, 'No se pudo cargar el inventario')
        ]);

        menusData = Array.isArray(menus) ? menus : [];
        dietasData = Array.isArray(dietas) ? dietas : [];
        inventarioData = Array.isArray(inventario) ? inventario : [];

        renderResumen(resumen || {});
        renderMenus();
        renderDietas(dietasData);
        renderInventario();
        renderPreparacion();
        renderEntregas();
    } catch (error) {
        console.error(error);
        const isNetworkError = String(error?.message || '').toLowerCase().includes('failed to fetch');
        if (isNetworkError) {
            const backendUrl = window.getBackendOrigin ? window.getBackendOrigin() : 'http://localhost:3001';
            notify('danger', `No hay conexión con el backend (${backendUrl}). Iniciá el servidor con: node backend/server.js`);
            renderEmptyRow('tablaMenus', 5, 'Sin conexión al backend');
            renderEmptyRow('tablaDietas', 7, 'Sin conexión al backend');
            renderEmptyRow('tablaInventario', 4, 'Sin conexión al backend');
            renderEmptyRow('tablaEntregas', 5, 'Sin conexión al backend');
            const preparacion = document.getElementById('gridPreparacion');
            if (preparacion) preparacion.innerHTML = '<p style="opacity:0.75;">Sin conexión al backend.</p>';
            return;
        }

        notify('danger', error.message || 'Error al cargar panel de cocina');
    }
}

function renderResumen(stats) {
    const statNodes = document.querySelectorAll('.stat-card .number');
    if (statNodes.length >= 4) {
        statNodes[0].textContent = safeValue(stats.menus_hoy, 0);
        statNodes[1].textContent = safeValue(stats.dietas_especiales, 0);
        statNodes[2].textContent = safeValue(stats.en_preparacion, 0);
        statNodes[3].textContent = safeValue(stats.entregas_realizadas, 0);
    }

    const personalDisponible = document.getElementById('personal-disponible');
    if (personalDisponible) {
        personalDisponible.textContent = safeValue(stats.personal_disponible, 0);
    }
}

function renderMenus() {
    const tbody = document.getElementById('tablaMenus');
    if (!tbody) return;

    if (!menusData.length) {
        renderEmptyRow('tablaMenus', 5, 'No hay menús cargados');
        return;
    }

    tbody.innerHTML = menusData
        .map((menu) => {
            const estado = safeValue(menu.estado, 'programado').toLowerCase();
            return `
                <tr>
                    <td>${formatDate(menu.fecha)}</td>
                    <td>${safeValue(menu.turno)}</td>
                    <td>${safeValue(menu.plato_principal)}</td>
                    <td>${safeValue(menu.raciones, 0)}</td>
                    <td><span class="badge ${estado}">${estado}</span></td>
                </tr>
            `;
        })
        .join('');
}

function isDietaEntregada(dieta) {
    const observaciones = String(dieta?.observaciones || '').toLowerCase();
    return observaciones.includes('entregada');
}

function renderDietas(rows) {
    const tbody = document.getElementById('tablaDietas');
    if (!tbody) return;

    if (!rows.length) {
        renderEmptyRow('tablaDietas', 7, 'No hay dietas especiales registradas');
        return;
    }

    tbody.innerHTML = rows
        .map((dieta) => {
            const entregada = isDietaEntregada(dieta);
            return `
                <tr>
                    <td>${safeValue(dieta.paciente)}</td>
                    <td>${safeValue(dieta.habitacion)}</td>
                    <td>${safeValue(dieta.tipo_dieta, 'Normal')}</td>
                    <td>${safeValue(dieta.restricciones)}</td>
                    <td>${safeValue(dieta.medico)}</td>
                    <td><span class="badge ${entregada ? 'completado' : 'activo'}">${entregada ? 'Entregada' : 'Pendiente'}</span></td>
                    <td>
                        <button class="btn btn-small" ${entregada ? 'disabled' : ''} onclick="confirmarEntrega(${dieta.id})">
                            ${entregada ? 'Entregada' : 'Marcar Entrega'}
                        </button>
                    </td>
                </tr>
            `;
        })
        .join('');
}

function renderInventario() {
    const tbody = document.getElementById('tablaInventario');
    if (!tbody) return;

    if (!inventarioData.length) {
        renderEmptyRow('tablaInventario', 4, 'No hay productos en inventario');
        return;
    }

    tbody.innerHTML = inventarioData
        .map((item) => {
            return `
                <tr>
                    <td>${safeValue(item.producto)}</td>
                    <td>${safeValue(item.stock, 0)}</td>
                    <td>${formatDateTime(item.fecha)}</td>
                    <td>${safeValue(item.personal, 'Sin asignar')}</td>
                </tr>
            `;
        })
        .join('');
}

function renderPreparacion() {
    const container = document.getElementById('gridPreparacion');
    if (!container) return;

    const hoy = new Date().toISOString().slice(0, 10);
    const enPreparacion = menusData.filter((menu) => String(menu.fecha).slice(0, 10) === hoy);

    if (!enPreparacion.length) {
        container.innerHTML = '<p style="opacity:0.75;">No hay platos en preparación para hoy.</p>';
        return;
    }

    container.innerHTML = enPreparacion
        .map((menu) => {
            const raciones = Number(menu.raciones) || 0;
            const progreso = raciones > 0 ? Math.min(100, Math.round((raciones * 0.6))) : 30;
            return `
                <div class="card" style="margin-bottom: 12px;">
                    <div class="card-body">
                        <h3 style="margin-bottom: 6px;">${safeValue(menu.plato_principal)}</h3>
                        <p><strong>Turno:</strong> ${safeValue(menu.turno)}</p>
                        <p><strong>Raciones:</strong> ${raciones}</p>
                        <div style="height: 8px; background:#e5e7eb; border-radius:4px; overflow:hidden; margin-top:8px;">
                            <div style="width:${progreso}%; height:100%; background:#16a34a;"></div>
                        </div>
                        <p style="margin-top:6px; opacity:.8;">Avance estimado: ${progreso}%</p>
                    </div>
                </div>
            `;
        })
        .join('');
}

function renderEntregas() {
    const tbody = document.getElementById('tablaEntregas');
    if (!tbody) return;

    if (!dietasData.length) {
        renderEmptyRow('tablaEntregas', 5, 'No hay entregas registradas');
        return;
    }

    tbody.innerHTML = dietasData
        .map((dieta) => {
            const entregada = isDietaEntregada(dieta);
            const ultimoEstado = entregada ? dieta.observaciones : dieta.fecha_inicio;

            return `
                <tr>
                    <td>${safeValue(dieta.paciente)}</td>
                    <td>${safeValue(dieta.tipo_dieta, 'Normal')}</td>
                    <td>${safeValue(dieta.habitacion)}</td>
                    <td><span class="badge ${entregada ? 'completado' : 'programado'}">${entregada ? 'Entregada' : 'Pendiente'}</span></td>
                    <td>${safeValue(entregada ? ultimoEstado : formatDate(ultimoEstado))}</td>
                </tr>
            `;
        })
        .join('');
}

function buscarDieta() {
    const query = String(document.getElementById('buscar-dieta')?.value || '').toLowerCase().trim();
    if (!query) {
        renderDietas(dietasData);
        return;
    }

    const filtradas = dietasData.filter((dieta) => {
        return [dieta.paciente, dieta.habitacion, dieta.tipo_dieta, dieta.restricciones, dieta.medico]
            .map((value) => String(value || '').toLowerCase())
            .some((text) => text.includes(query));
    });

    renderDietas(filtradas);
}

function nuevoMenu() {
    const crearAhora = confirm('La gestión de menús se realiza en el módulo de Menús. ¿Querés abrirlo ahora?');
    if (crearAhora) {
        window.location.href = 'gestionar-menus.html';
    }
}

async function confirmarEntrega(id) {
    const confirmar = confirm('¿Confirmar entrega de esta dieta especial?');
    if (!confirmar) return;

    try {
        const response = await fetch(`${API_URL}/dietas/${id}/entregada`, { method: 'POST' });
        if (!response.ok) {
            throw new Error(await parseApiError(response, 'No se pudo confirmar la entrega'));
        }

        notify('success', 'Entrega confirmada correctamente');
        await inicializarCocina();
    } catch (error) {
        console.error(error);
        notify('danger', error.message || 'Error al confirmar entrega');
    }
}