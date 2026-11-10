// Gestión de Cocina - Dashboard funcional
const API_URL = window.buildApiUrl('/api/cocina');
const STOCK_COCINA_API_URL = window.buildApiUrl('/api/requisiciones/stock-cocina');
const REQUISICIONES_API_URL = window.buildApiUrl('/api/requisiciones');
const MENUS_API_URL = window.buildApiUrl('/api/menus');

let menusData = [];
let dietasData = [];
let inventarioData = [];
let requisicionesData = [];
let planificacionesData = [];
let apiWorkflowUnavailable = false;
let inventarioLegacyMode = false;

document.addEventListener('DOMContentLoaded', () => {
    inicializarCocina();
    window.setInterval(() => {
        if (!apiWorkflowUnavailable) {
            actualizarStockYRequisiciones().catch((error) => {
                console.error(error);
                if (error.status === 404) apiWorkflowUnavailable = true;
            });
        }
    }, 15000);

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
        const error = new Error(await parseApiError(response, fallbackError));
        error.status = response.status;
        throw error;
    }
    return response.json();
}

async function fetchStockCocina() {
    try {
        const stock = await fetchJson(STOCK_COCINA_API_URL, 'No se pudo cargar el inventario de cocina');
        inventarioLegacyMode = false;
        return stock;
    } catch (error) {
        if (error.status !== 404) throw error;
        inventarioLegacyMode = true;
        const legacyStock = await fetchJson(window.buildApiUrl('/api/inventario'), 'No se pudo cargar el inventario');
        return legacyStock.map((item) => ({
            id: item.id,
            nombre: item.producto,
            categoria: item.categoria,
            unidad_medida: item.unidad,
            stock_almacen: item.stock,
            stock_cocina: 0,
            actualizado_at: item.fecha || null,
        }));
    }
}

async function inicializarCocina() {
    try {
        const resultados = await Promise.allSettled([
            fetchJson(`${API_URL}/resumen`, 'No se pudo cargar el resumen de cocina'),
            fetchJson(`${API_URL}/menus`, 'No se pudieron cargar los menús'),
            fetchJson(`${API_URL}/dietas`, 'No se pudieron cargar las dietas especiales'),
            fetchJson(`${API_URL}/planificacion`, 'No se pudo cargar la planilla de cocina'),
            fetchStockCocina(),
            fetchJson(REQUISICIONES_API_URL, 'No se pudieron cargar las solicitudes')
        ]);
        const errores = [];
        const [resumen, menus, dietas, planificaciones, inventario, requisiciones] = resultados;

        if (resumen.status === 'fulfilled') {
            renderResumen(resumen.value || {});
        } else {
            errores.push(resumen.reason);
        }

        if (menus.status === 'fulfilled' && Array.isArray(menus.value)) {
            menusData = menus.value;
            renderMenus();
        } else {
            menusData = [];
            renderEmptyRow('tablaMenus', 5, 'No se pudieron cargar los menús');
            errores.push(menus.status === 'rejected' ? menus.reason : new Error('La respuesta de menús no es válida'));
        }

        if (dietas.status === 'fulfilled' && Array.isArray(dietas.value)) {
            dietasData = dietas.value;
            renderDietas(dietasData);
        } else {
            dietasData = [];
            renderEmptyRow('tablaDietas', 7, 'No se pudieron cargar las dietas especiales');
            errores.push(dietas.status === 'rejected' ? dietas.reason : new Error('La respuesta de dietas no es válida'));
        }

        if (planificaciones.status === 'fulfilled' && Array.isArray(planificaciones.value)) {
            planificacionesData = planificaciones.value;
            renderPlanCocina();
        } else {
            planificacionesData = [];
            renderEmptyRow('tablaPlanCocina', 4, 'No se pudo cargar la planilla de cocina');
            errores.push(planificaciones.status === 'rejected' ? planificaciones.reason : new Error('La respuesta de planificación no es válida'));
        }

        if (inventario.status === 'fulfilled' && Array.isArray(inventario.value)) {
            inventarioData = inventario.value;
            renderInventario();
            renderProductosRequisicion();
        } else {
            inventarioData = [];
            renderEmptyRow('tablaInventario', 3, 'No se pudo cargar el inventario');
            errores.push(inventario.status === 'rejected' ? inventario.reason : new Error('La respuesta del inventario no es válida'));
        }

        if (requisiciones.status === 'fulfilled' && Array.isArray(requisiciones.value)) {
            requisicionesData = requisiciones.value;
            renderRequisicionesCocina();
        } else {
            requisicionesData = [];
            renderEmptyRow('tablaRequisicionesCocina', 5, 'No se pudieron cargar las solicitudes');
            errores.push(requisiciones.status === 'rejected' ? requisiciones.reason : new Error('La respuesta de solicitudes no es válida'));
        }
        apiWorkflowUnavailable = [planificaciones, requisiciones].some((result) =>
            result.status === 'rejected' && result.reason?.status === 404);
        const aviso = document.getElementById('avisoInventarioCocina');
        if (aviso) aviso.hidden = !inventarioLegacyMode;
        if (apiWorkflowUnavailable) {
            notify('danger', 'El backend desplegado aún no tiene las rutas de reposiciones y planificación. El administrador debe desplegar la última versión del repositorio backend.');
        }

        renderPreparacion();
        renderEntregas();
        if (errores.length) {
            errores.forEach((error) => console.error(error));
            const isNetworkError = errores.some((error) => String(error?.message || '').toLowerCase().includes('failed to fetch'));
            if (isNetworkError) {
                const backendUrl = window.getBackendOrigin ? window.getBackendOrigin() : 'BACKEND_ORIGIN no configurado';
                notify('danger', `No hay conexión con el backend (${backendUrl}). Iniciá el servidor con: node backend/server.js`);
            } else {
                notify('danger', errores.map((error) => error.message || 'Error al cargar los datos de cocina').join('\n'));
            }
        }
    } catch (error) {
        console.error(error);
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
        renderEmptyRow('tablaInventario', 3, 'No hay productos en inventario');
        return;
    }

    tbody.innerHTML = inventarioData
        .map((item) => {
            return `
                <tr>
                    <td>${escapeHtml(item.nombre)}${item.id ? ` (#${item.id})` : ''}</td>
                    <td>${escapeHtml(item.stock_cocina ?? 0)} ${escapeHtml(item.unidad_medida || '')}</td>
                    <td>${escapeHtml(item.stock_almacen ?? 0)} ${escapeHtml(item.unidad_medida || '')}</td>
                </tr>
            `;
        })
        .join('');
}

function renderProductosRequisicion() {
    const list = document.getElementById('productosRequisicion');
    if (!list) return;
    list.replaceChildren();
    inventarioData.forEach((item) => {
        const option = document.createElement('option');
        option.value = `${item.nombre} (#${item.id})`;
        option.label = `${item.stock_almacen} ${item.unidad_medida || ''} disponibles en almacén`;
        list.append(option);
    });
}

function renderRequisicionesCocina() {
    const tbody = document.getElementById('tablaRequisicionesCocina');
    if (!tbody) return;
    if (!requisicionesData.length) {
        renderEmptyRow('tablaRequisicionesCocina', 5, 'Todavía no hay solicitudes');
        return;
    }
    tbody.innerHTML = requisicionesData.map((item) => `
        <tr>
            <td>${escapeHtml(formatDateTime(item.created_at))}</td>
            <td>${escapeHtml(item.producto?.nombre || 'Producto')}</td>
            <td>${escapeHtml(item.cantidad)}</td>
            <td>${escapeHtml(item.estado)}</td>
            <td>${escapeHtml(item.motivo || '-')}</td>
        </tr>
    `).join('');
}

function renderPlanCocina() {
    const tbody = document.getElementById('tablaPlanCocina');
    if (!tbody) return;
    if (!planificacionesData.length) {
        renderEmptyRow('tablaPlanCocina', 4, 'No hay menús asignados para hoy');
        return;
    }
    tbody.innerHTML = planificacionesData.map((plan) => {
        const menu = plan.menu || {};
        const recipes = (menu.recetasAsignadas || []).map((assignment) => {
            const recipe = assignment.receta || {};
            const ingredients = (recipe.detalles || []).map((detail) =>
                `${detail.producto?.nombre || 'Ingrediente'}: ${detail.cantidad} ${detail.unidad_medida}`).join(', ');
            return `${escapeHtml(recipe.nombre || 'Receta')} (${escapeHtml(assignment.porciones)} porciones)${ingredients ? ` — ${escapeHtml(ingredients)}` : ''}`;
        }).join('<br>');
        return `<tr>
            <td>${escapeHtml(plan.paciente?.documento || `Paciente ${plan.paciente_id}`)}</td>
            <td>${escapeHtml(menu.turno || '-')} — ${escapeHtml(menu.plato_principal || '-')}</td>
            <td>${recipes || 'Sin recetas asignadas'}</td>
            <td>${escapeHtml([plan.condicion_clinica, plan.observaciones].filter(Boolean).join(' — ') || '-')}</td>
        </tr>`;
    }).join('');
}

async function actualizarStockYRequisiciones() {
    const [stock, requisiciones, planificaciones] = await Promise.all([
        fetchStockCocina(),
        fetchJson(REQUISICIONES_API_URL, 'No se pudieron actualizar las solicitudes'),
        fetchJson(`${API_URL}/planificacion`, 'No se pudo actualizar la planilla de cocina'),
    ]);
    inventarioData = stock;
    requisicionesData = requisiciones;
    planificacionesData = planificaciones;
    renderInventario();
    renderProductosRequisicion();
    renderRequisicionesCocina();
    renderPlanCocina();
}

async function crearRequisicionCocina(event) {
    event.preventDefault();
    const productoIngresado = document.getElementById('productoRequisicion').value.trim();
    const productoSeleccionado = inventarioData.find((item) =>
        productoIngresado === `${item.nombre} (#${item.id})`
        || (productoIngresado.toLowerCase() === String(item.nombre).toLowerCase()
            && inventarioData.filter((candidate) => String(candidate.nombre).toLowerCase() === productoIngresado.toLowerCase()).length === 1));
    const productoId = Number(productoSeleccionado?.id);
    const cantidad = Number(document.getElementById('cantidadRequisicion').value);
    const motivo = document.getElementById('motivoRequisicion').value.trim();
    if (!productoSeleccionado) {
        notify('danger', 'Escribe el nombre exacto de un producto registrado o selecciónalo de la lista.');
        return;
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
        notify('danger', 'La cantidad solicitada debe ser un entero mayor a cero.');
        return;
    }
    try {
        const response = await fetch(REQUISICIONES_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ producto_id: productoId, cantidad, motivo }),
        });
        if (!response.ok) {
            if (response.status === 404) {
                apiWorkflowUnavailable = true;
                throw new Error('El backend desplegado todavía no tiene activa la función de reposiciones. Debe desplegarse la última versión del repositorio backend.');
            }
            throw new Error(await parseApiError(response, 'No se pudo enviar la solicitud'));
        }
        apiWorkflowUnavailable = false;
        document.getElementById('formRequisicionCocina').reset();
        notify('success', 'Solicitud enviada al almacén');
        await actualizarStockYRequisiciones();
    } catch (error) {
        notify('danger', error.message || 'No se pudo enviar la solicitud');
    }
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

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
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
    openModal('modalNuevoMenuCocina');
}

async function guardarMenuCocina(event) {
    event.preventDefault();

    const data = {
        nombre: document.getElementById('nombreMenuCocina').value.trim(),
        descripcion: document.getElementById('descripcionMenuCocina').value.trim(),
        restriccion: document.getElementById('restriccionMenuCocina').value.trim() || null,
    };

    if (!data.nombre) {
        notify('danger', 'El nombre del menú es obligatorio.');
        return;
    }

    try {
        const response = await fetch(MENUS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(await parseApiError(response, 'No se pudo guardar el menú'));
        }

        closeModal('modalNuevoMenuCocina');
        notify('success', 'Menú guardado correctamente');
        await inicializarCocina();
    } catch (error) {
        console.error(error);
        notify('danger', error.message || 'No se pudo guardar el menú');
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