const NUTRICION_API = window.buildApiUrl('/api/nutricionista');
let recetasNutricion = [];
let menusNutricion = [];
let pacientesNutricion = [];

function escaparHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character]);
}

async function nutricionRequest(path, options = {}) {
    const response = await fetch(`${NUTRICION_API}${path}`, options);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'No se pudo completar la operación');
    return payload;
}

function mostrarErrorNutricion(error) {
    console.error(error);
    if (typeof showAlert === 'function') showAlert('danger', error.message || 'Error en el módulo de nutrición');
    else alert(error.message || 'Error en el módulo de nutrición');
}

function renderSelect(id, rows, label) {
    const select = document.getElementById(id);
    if (!select) return;
    select.replaceChildren(new Option(`Seleccionar ${label}`, ''));
    rows.forEach((item) => select.add(new Option(item.nombre || `${item.fecha} — ${item.plato_principal || 'Menú'}`, item.id)));
}

function renderRecetasNutricion() {
    const tbody = document.getElementById('tablaRecetasNutricion');
    tbody.innerHTML = recetasNutricion.length ? recetasNutricion.map((receta) => {
        const ingredientes = receta.detalles?.map((detalle) =>
            `<div>${escaparHTML(detalle.producto?.nombre || `Producto ${detalle.producto_id}`)} — ${escaparHTML(detalle.cantidad)} ${escaparHTML(detalle.unidad_medida)}
                <button class="btn btn-small" data-edit-detail="${detalle.id}" data-recipe-id="${receta.id}">Editar</button>
                <button class="btn btn-small btn-secondary" data-delete-detail="${detalle.id}" data-recipe-id="${receta.id}">Quitar</button>
            </div>`).join('') || 'Sin ingredientes';
        return `<tr>
            <td>${escaparHTML(receta.nombre)}</td>
            <td>${escaparHTML(receta.porciones)}</td>
            <td>${ingredientes}</td>
            <td><button class="btn btn-small" data-edit-recipe="${receta.id}">Editar</button> <button class="btn btn-small btn-secondary" data-delete-recipe="${receta.id}">Eliminar</button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="4">No hay recetas creadas.</td></tr>';

    tbody.querySelectorAll('[data-edit-recipe]').forEach((button) => button.addEventListener('click', () => {
        const receta = recetasNutricion.find((item) => item.id === Number(button.dataset.editRecipe));
        if (!receta) return;
        document.getElementById('recetaId').value = receta.id;
        document.getElementById('recetaNombre').value = receta.nombre;
        document.getElementById('recetaPorciones').value = receta.porciones;
        document.getElementById('recetaDescripcion').value = receta.descripcion || '';
        document.getElementById('recetaInstrucciones').value = receta.instrucciones || '';
        document.getElementById('guardarReceta').textContent = 'Actualizar receta';
        document.getElementById('cancelarEdicionReceta').hidden = false;
        document.getElementById('recetas').scrollIntoView({ behavior: 'smooth' });
    }));
    tbody.querySelectorAll('[data-delete-recipe]').forEach((button) => button.addEventListener('click', async () => {
        if (!confirm('¿Desactivar esta receta?')) return;
        try {
            await nutricionRequest(`/recetas/${button.dataset.deleteRecipe}`, { method: 'DELETE' });
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    }));
    tbody.querySelectorAll('[data-edit-detail]').forEach((button) => button.addEventListener('click', async () => {
        const recipeId = button.dataset.recipeId;
        const detailId = button.dataset.editDetail;
        const receta = recetasNutricion.find((item) => item.id === Number(recipeId));
        const detalle = receta?.detalles?.find((item) => item.id === Number(detailId));
        if (!detalle) return;
        const cantidad = prompt('Cantidad del ingrediente:', detalle.cantidad);
        if (cantidad === null) return;
        const unidad = prompt('Unidad de medida:', detalle.unidad_medida);
        if (unidad === null) return;
        try {
            await nutricionRequest(`/recetas/${recipeId}/detalles/${detailId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cantidad: Number(cantidad), unidad_medida: unidad }),
            });
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    }));
    tbody.querySelectorAll('[data-delete-detail]').forEach((button) => button.addEventListener('click', async () => {
        if (!confirm('¿Quitar este ingrediente?')) return;
        try {
            await nutricionRequest(`/recetas/${button.dataset.recipeId}/detalles/${button.dataset.deleteDetail}`, { method: 'DELETE' });
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    }));
}

function renderMenusNutricion() {
    const tbody = document.getElementById('tablaMenusNutricion');
    tbody.innerHTML = menusNutricion.length ? menusNutricion.map((menu) => {
        const recetas = menu.recetasAsignadas?.map((item) => item.receta?.nombre).filter(Boolean).join(', ') || 'Sin recetas';
        return `<tr>
            <td>${escaparHTML(menu.fecha)}</td><td>${escaparHTML(menu.turno || '-')}</td>
            <td>${escaparHTML(menu.plato_principal || '-')}</td><td>${escaparHTML(recetas)}</td>
            <td><button class="btn btn-small" data-edit-menu="${menu.id}">Editar</button> <button class="btn btn-small btn-secondary" data-delete-menu="${menu.id}">Eliminar</button></td>
        </tr>`;
    }).join('') : '<tr><td colspan="5">No hay menús creados.</td></tr>';

    tbody.querySelectorAll('[data-edit-menu]').forEach((button) => button.addEventListener('click', () => {
        const menu = menusNutricion.find((item) => item.id === Number(button.dataset.editMenu));
        if (!menu) return;
        document.getElementById('menuId').value = menu.id;
        for (const [field, value] of Object.entries({
            menuFecha: menu.fecha,
            menuTurno: menu.turno || '',
            menuPlato: menu.plato_principal || '',
            menuGuarnicion: menu.guarnicion || '',
            menuPostre: menu.postre || '',
            menuRaciones: menu.raciones_previstas ?? '',
        })) document.getElementById(field).value = value;
        document.getElementById('guardarMenu').textContent = 'Actualizar menú';
        document.getElementById('cancelarEdicionMenu').hidden = false;
        document.getElementById('menus').scrollIntoView({ behavior: 'smooth' });
    }));
    tbody.querySelectorAll('[data-delete-menu]').forEach((button) => button.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este menú?')) return;
        try {
            await nutricionRequest(`/menus/${button.dataset.deleteMenu}`, { method: 'DELETE' });
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    }));
}

async function cargarDatosNutricion() {
    try {
        const [recetas, menus, pacientes, productos, planes] = await Promise.all([
            nutricionRequest('/recetas'),
            nutricionRequest('/menus'),
            nutricionRequest('/pacientes'),
            nutricionRequest('/productos'),
            nutricionRequest('/planificaciones'),
        ]);
        recetasNutricion = recetas;
        menusNutricion = menus;
        pacientesNutricion = pacientes;
        renderRecetasNutricion();
        renderMenusNutricion();
        renderSelect('detalleRecetaId', recetasNutricion, 'receta');
        renderSelect('asignarRecetaId', recetasNutricion, 'receta');
        renderSelect('asignarMenuId', menusNutricion, 'menú');
        renderSelect('planMenuId', menusNutricion, 'menú');
        renderSelect('planPacienteId', pacientesNutricion.map((p) => ({ ...p, nombre: `${p.nombre || p.documento} (#${p.id})` })), 'paciente');
        renderSelect('historiaPacienteId', pacientesNutricion.map((p) => ({ ...p, nombre: `${p.nombre || p.documento} (#${p.id})` })), 'paciente');
        renderSelect('detalleProductoId', productos, 'producto');
        renderPlanesNutricion(planes);
    } catch (error) { mostrarErrorNutricion(error); }
}

function renderPlanesNutricion(planes) {
    const tbody = document.getElementById('tablaPlanesNutricion');
    tbody.innerHTML = planes.length ? planes.map((plan) => `
        <tr><td>${escaparHTML(plan.fecha)}</td>
        <td>${escaparHTML(plan.paciente?.documento || plan.paciente_id)}</td>
        <td>${escaparHTML(plan.menu?.plato_principal || plan.menu?.turno || `Menú ${plan.menu_id}`)}</td>
        <td>${escaparHTML([plan.condicion_clinica, plan.observaciones].filter(Boolean).join(' — ') || '-')}</td></tr>
    `).join('') : '<tr><td colspan="4">No hay planificaciones asignadas.</td></tr>';
}

function limpiarFormularioReceta() {
    document.getElementById('formRecetaNutricion').reset();
    document.getElementById('recetaId').value = '';
    document.getElementById('recetaPorciones').value = 1;
    document.getElementById('guardarReceta').textContent = 'Guardar receta';
    document.getElementById('cancelarEdicionReceta').hidden = true;
}

function limpiarFormularioMenu() {
    document.getElementById('formMenuNutricion').reset();
    document.getElementById('menuId').value = '';
    document.getElementById('guardarMenu').textContent = 'Guardar menú';
    document.getElementById('cancelarEdicionMenu').hidden = true;
}

document.addEventListener('DOMContentLoaded', () => {
    let session = {};
    try { session = JSON.parse(localStorage.getItem('usuarioLogueado') || '{}'); } catch (_) {}
    document.getElementById('nutritionistName').textContent = session.nombre || session.usuario || 'Nutricionista';
    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('menuFecha').value = today;
    document.getElementById('planFecha').value = today;
    document.getElementById('formRecetaNutricion').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('recetaId').value;
        const data = {
            nombre: document.getElementById('recetaNombre').value.trim(),
            porciones: Number(document.getElementById('recetaPorciones').value),
            descripcion: document.getElementById('recetaDescripcion').value.trim(),
            instrucciones: document.getElementById('recetaInstrucciones').value.trim(),
        };
        try {
            await nutricionRequest(id ? `/recetas/${id}` : '/recetas', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            limpiarFormularioReceta();
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    });
    document.getElementById('cancelarEdicionReceta').addEventListener('click', limpiarFormularioReceta);
    document.getElementById('formDetalleReceta').addEventListener('submit', async (event) => {
        event.preventDefault();
        const recetaId = document.getElementById('detalleRecetaId').value;
        try {
            await nutricionRequest(`/recetas/${recetaId}/detalles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    producto_id: Number(document.getElementById('detalleProductoId').value),
                    cantidad: Number(document.getElementById('detalleCantidad').value),
                    unidad_medida: document.getElementById('detalleUnidad').value.trim(),
                    indicaciones: document.getElementById('detalleIndicaciones').value.trim(),
                }),
            });
            event.target.reset();
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    });
    document.getElementById('formMenuNutricion').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('menuId').value;
        const data = {
            fecha: document.getElementById('menuFecha').value,
            turno: document.getElementById('menuTurno').value || null,
            plato_principal: document.getElementById('menuPlato').value.trim(),
            guarnicion: document.getElementById('menuGuarnicion').value.trim(),
            postre: document.getElementById('menuPostre').value.trim(),
            raciones_previstas: document.getElementById('menuRaciones').value === '' ? null : Number(document.getElementById('menuRaciones').value),
        };
        try {
            await nutricionRequest(id ? `/menus/${id}` : '/menus', {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            limpiarFormularioMenu();
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    });
    document.getElementById('cancelarEdicionMenu').addEventListener('click', limpiarFormularioMenu);
    document.getElementById('formAsignarReceta').addEventListener('submit', async (event) => {
        event.preventDefault();
        const menuId = document.getElementById('asignarMenuId').value;
        try {
            await nutricionRequest(`/menus/${menuId}/recetas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receta_id: Number(document.getElementById('asignarRecetaId').value),
                    porciones: Number(document.getElementById('asignarPorciones').value),
                    momento: document.getElementById('asignarMomento').value.trim(),
                }),
            });
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    });
    document.getElementById('formPlanDieta').addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            await nutricionRequest('/planificaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paciente_id: Number(document.getElementById('planPacienteId').value),
                    menu_id: Number(document.getElementById('planMenuId').value),
                    fecha: document.getElementById('planFecha').value,
                    condicion_clinica: document.getElementById('planCondicion').value.trim(),
                    observaciones: document.getElementById('planObservaciones').value.trim(),
                }),
            });
            event.target.reset();
            document.getElementById('planFecha').value = today;
            await cargarDatosNutricion();
        } catch (error) { mostrarErrorNutricion(error); }
    });
    document.getElementById('consultarHistoria').addEventListener('click', async () => {
        const pacienteId = document.getElementById('historiaPacienteId').value;
        const result = document.getElementById('historiaClinicaResultado');
        if (!pacienteId) return;
        try {
            const data = await nutricionRequest(`/pacientes/${pacienteId}/historia-clinica`);
            result.replaceChildren();
            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(data, null, 2);
            result.append(pre);
        } catch (error) { mostrarErrorNutricion(error); }
    });
    cargarDatosNutricion();
});
