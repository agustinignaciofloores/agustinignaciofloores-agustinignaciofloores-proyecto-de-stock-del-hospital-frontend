// Gestión de Menús - Conectado a Base de Datos
let menus = [];
const API_URL = window.buildApiUrl('/api/menus');

function notifyError(message) {
    if (typeof showAlert === 'function') showAlert('danger', message);
    else alert(message);
}

async function parseApiError(response, fallback) {
    let detail = '';
    try { const p = await response.json(); detail = p?.message || p?.error || ''; } catch (_) {}
    return detail ? `${fallback}: ${detail}` : fallback;
}

function actualizarSugerenciasMenus() {
    const lista = document.getElementById('listaRestriccionesMenu');
    if (lista) {
        const restricciones = [...new Set(menus.map(m => m.patologia_nombre).filter(Boolean))];
        lista.innerHTML = restricciones.map(r => `<option value="${r}"></option>`).join('');
    }
}

// Inicialización
async function inicializarMenus() {
    await cargarMenus();
}

// 2. Obtener Menús desde el Backend
async function cargarMenus() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const msg = await parseApiError(response, 'Error al obtener menús');
            throw new Error(msg);
        }
        menus = await response.json();
        actualizarSugerenciasMenus();
        actualizarTablaMenus();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudieron cargar los menús');
    }
}

// 3. Guardar/Actualizar Menú
async function guardarMenu(event) {
    event.preventDefault();
    
    const idMenu = document.getElementById('id_menu')?.value;
    const data = {
        nombre: document.getElementById('nombre_menu').value.trim(),
        descripcion: document.getElementById('descripcion_menu').value.trim(),
        restriccion: document.getElementById('restriccion_menu').value.trim() || null
    };

    if (!data.nombre) {
        notifyError('El nombre del menú es obligatorio.');
        return;
    }
    
    try {
        const method = idMenu ? 'PUT' : 'POST';
        const url = idMenu ? `${API_URL}/${idMenu}` : API_URL;
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const msg = await parseApiError(response, 'Error al guardar el menú');
            throw new Error(msg);
        }
        
        showAlert('success', idMenu ? 'Menú actualizado' : 'Menú guardado correctamente');
        closeModal('modalMenu');
        limpiarFormularioMenu();
        cargarMenus();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'Error al guardar en el servidor');
    }
}

// 4. Editar (Rellena el modal)
function editMenu(id) {
    const m = menus.find(menu => String(menu.id) === String(id));
    if (m) {
        document.getElementById('id_menu').value = m.id;
        document.getElementById('nombre_menu').value = m.nombre;
        document.getElementById('descripcion_menu').value = m.descripcion || '';
        document.getElementById('restriccion_menu').value = m.patologia_nombre || '';
        
        document.getElementById('tituloModalMenu').textContent = 'Editar Menú';
        openModal('modalMenu');
    }
}

// 5. Eliminar
async function deleteMenu(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este menú?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const msg = await parseApiError(response, 'No se pudo eliminar el menú');
            throw new Error(msg);
        }
        showAlert('success', 'Menú eliminado correctamente');
        cargarMenus();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudo eliminar');
    }
}

// 6. Actualizar Tabla
function actualizarTablaMenus() {
    const tbody = document.getElementById('tablaMenus');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    menus.forEach(m => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${m.id}</td>
            <td>${m.nombre}</td>
            <td>${m.descripcion || '-'}</td>
            <td>${m.patologia_nombre || 'Ninguna'}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editMenu(${m.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteMenu(${m.id})">Eliminar</button>
            </td>
        `;
    });
}

function limpiarFormularioMenu() {
    document.getElementById('formMenu').reset();
    document.getElementById('id_menu').value = '';
    document.getElementById('tituloModalMenu').textContent = 'Nuevo Menú';
}

document.addEventListener('DOMContentLoaded', inicializarMenus);