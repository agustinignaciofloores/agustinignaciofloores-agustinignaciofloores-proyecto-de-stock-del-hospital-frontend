// Gestión de Movimientos - Conectado a Base de Datos
let movimientos = [];
const API_URL = window.buildApiUrl('/api/movimientos');

function notifyError(message) {
    if (typeof showAlert === 'function') showAlert('danger', message);
    else alert(message);
}

async function parseApiError(response, fallback) {
    let detail = '';
    try { const p = await response.json(); detail = p?.message || p?.error || ''; } catch (_) {}
    return detail ? `${fallback}: ${detail}` : fallback;
}

function actualizarSugerenciasMovimientos() {
    const listaPacientes = document.getElementById('listaPacientesMovimiento');
    if (listaPacientes) {
        const nombres = [...new Set(movimientos.map(m => m.paciente_nombre).filter(Boolean))];
        listaPacientes.innerHTML = nombres.map(n => `<option value="${n}"></option>`).join('');
    }
    const listaPersonal = document.getElementById('listaPersonalMovimiento');
    if (listaPersonal) {
        const nombres = [...new Set(movimientos.map(m => m.personal_nombre).filter(n => n && n !== 'No asignado'))];
        listaPersonal.innerHTML = nombres.map(n => `<option value="${n}"></option>`).join('');
    }
}

// Inicialización
async function inicializarMovimientos() {
    await cargarMovimientos();
}

// 2. Obtener Movimientos desde el Backend
async function cargarMovimientos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const msg = await parseApiError(response, 'Error al obtener movimientos');
            throw new Error(msg);
        }
        movimientos = await response.json();
        actualizarSugerenciasMovimientos();
        actualizarTablaMovimientos();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudieron cargar los movimientos');
    }
}

// 3. Guardar/Actualizar
async function guardarMovimiento(event) {
    event.preventDefault();
    
    const idMovimiento = document.getElementById('id_movimiento')?.value;
    const data = {
        id_paciente: document.getElementById('paciente_movimiento').value.trim(),
        tipo: document.getElementById('tipo_movimiento').value,
        nro_cama: document.getElementById('nro_cama').value.trim() || null,
        piso: document.getElementById('piso_movimiento').value.trim() || null,
        id_personal: document.getElementById('personal_medico_movimiento').value.trim() || null
    };

    if (!data.id_paciente || !data.tipo) {
        notifyError('Completá el paciente y el tipo de movimiento.');
        return;
    }
    
    try {
        const method = idMovimiento ? 'PUT' : 'POST';
        const url = idMovimiento ? `${API_URL}/${idMovimiento}` : API_URL;
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const msg = await parseApiError(response, 'Error al guardar el movimiento');
            throw new Error(msg);
        }
        
        showAlert('success', 'Movimiento registrado correctamente');
        closeModal('modalMovimiento');
        limpiarFormularioMovimiento();
        cargarMovimientos();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'Problema al guardar en el servidor');
    }
}

// 4. Edición
function editMovimiento(id) {
    const m = movimientos.find(mov => String(mov.id) === String(id));
    if (m) {
        document.getElementById('id_movimiento').value = m.id;
        document.getElementById('paciente_movimiento').value = m.id_paciente;
        document.getElementById('tipo_movimiento').value = m.tipo;
        document.getElementById('nro_cama').value = m.nro_cama || '';
        document.getElementById('piso_movimiento').value = m.piso || '';
        document.getElementById('personal_medico_movimiento').value = m.id_personal || '';
        
        document.getElementById('tituloModalMovimiento').textContent = 'Editar Movimiento';
        openModal('modalMovimiento');
    }
}

// 5. Eliminar
async function deleteMovimiento(id) {
    if (!confirm('¿Eliminar registro de movimiento?')) return;
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const msg = await parseApiError(response, 'No se pudo eliminar el movimiento');
            throw new Error(msg);
        }
        showAlert('success', 'Movimiento eliminado correctamente');
        cargarMovimientos();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudo eliminar el movimiento');
    }
}

// 6. Tabla
function actualizarTablaMovimientos() {
    const tbody = document.getElementById('tablaMovimientos');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    movimientos.forEach(m => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${m.id}</td>
            <td>${m.paciente_nombre || 'N/A'}</td>
            <td>${m.tipo}</td>
            <td>${m.nro_cama || '-'}</td>
            <td>${m.piso || '-'}</td>
            <td>${new Date(m.fecha).toLocaleString()}</td>
            <td>${m.personal_nombre || 'No asignado'}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editMovimiento(${m.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteMovimiento(${m.id})">Eliminar</button>
            </td>
        `;
    });
}

function limpiarFormularioMovimiento() {
    document.getElementById('formMovimiento').reset();
    document.getElementById('id_movimiento').value = '';
    document.getElementById('tituloModalMovimiento').textContent = 'Nuevo Movimiento';
}

document.addEventListener('DOMContentLoaded', inicializarMovimientos);