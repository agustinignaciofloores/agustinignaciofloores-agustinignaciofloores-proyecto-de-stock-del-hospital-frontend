// js/personas.js
let personas = [];
const API_URL = window.buildApiUrl('/api/personas');

function notifyError(message) {
    if (typeof showAlert === 'function') {
        showAlert('danger', message);
    } else {
        alert(message);
    }
}

async function parseApiError(response, fallbackMessage) {
    let detail = '';
    try {
        const payload = await response.json();
        detail = payload?.message || payload?.error || '';
    } catch (_) {
        // Si la respuesta no es JSON, mantenemos el mensaje por defecto.
    }

    return detail ? `${fallbackMessage}: ${detail}` : fallbackMessage;
}

async function cargarPersonas() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            const message = await parseApiError(response, 'No se pudieron obtener las personas');
            throw new Error(message);
        }
        personas = await response.json();
        actualizarTablaPersonas();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudieron cargar las personas desde la base de datos');
    }
}

async function guardarPersona(event) {
    event.preventDefault();

    const idPersona = document.getElementById('id_persona').value;
    const data = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        dni: document.getElementById('dni').value.trim(),
        sexo: document.getElementById('sexo').value,
        discapacidad: document.getElementById('discapacidad').value || null,
        fecha_nac: document.getElementById('fecha_nac').value,
        telefono: document.getElementById('telefono').value.trim(),
        email: document.getElementById('email').value.trim(),
        estado_civil: document.getElementById('estado_civil').value,
        etnia: document.getElementById('etnia').value.trim()
    };

    if (!data.nombre || !data.apellido || !data.dni || !data.sexo || !data.fecha_nac) {
        notifyError('Completá los campos obligatorios de la persona');
        return;
    }

    try {
        const response = await fetch(idPersona ? `${API_URL}/${idPersona}` : API_URL, {
            method: idPersona ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const message = await parseApiError(response, 'No se pudo guardar la persona');
            throw new Error(message);
        }

        showAlert('success', idPersona ? 'Persona actualizada correctamente' : 'Persona creada correctamente');
        closeModal('modalPersona');
        limpiarFormularioPersona();
        cargarPersonas();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'Hubo un problema al guardar la persona');
    }
}

function editPersona(id) {
    const persona = personas.find((item) => String(item.id) === String(id));
    if (!persona) {
        return;
    }

    document.getElementById('id_persona').value = persona.id;
    document.getElementById('nombre').value = persona.nombre || '';
    document.getElementById('apellido').value = persona.apellido || '';
    document.getElementById('dni').value = persona.dni || '';
    document.getElementById('sexo').value = persona.sexo || '';
    document.getElementById('discapacidad').value = persona.discapacidad === 'Ninguna' ? '' : (persona.discapacidad || '');
    document.getElementById('fecha_nac').value = persona.fecha_nac ? String(persona.fecha_nac).split('T')[0] : '';
    document.getElementById('telefono').value = persona.telefono || '';
    document.getElementById('email').value = persona.email || '';
    document.getElementById('estado_civil').value = persona.estado_civil || '';
    document.getElementById('etnia').value = persona.etnia || '';
    document.getElementById('tituloModalPersona').textContent = 'Editar Persona';
    openModal('modalPersona');
}

async function deletePersona(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta persona?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const message = await parseApiError(response, 'No se pudo eliminar la persona');
            throw new Error(message);
        }
        showAlert('success', 'Persona eliminada correctamente');
        cargarPersonas();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudo eliminar la persona');
    }
}

function actualizarTablaPersonas() {
    const tbody = document.getElementById('tablaPersonas');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (personas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No hay personas registradas.</td></tr>';
        return;
    }

    personas.forEach((persona) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${persona.id}</td>
            <td>${persona.dni}</td>
            <td>${persona.nombre}</td>
            <td>${persona.apellido}</td>
            <td>${persona.telefono || '-'}</td>
            <td>${persona.email || '-'}</td>
            <td>${persona.sexo}</td>
            <td>${persona.discapacidad || 'Ninguna'}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editPersona(${persona.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deletePersona(${persona.id})">Eliminar</button>
            </td>
        `;
    });
}

function limpiarFormularioPersona() {
    document.getElementById('formPersona').reset();
    document.getElementById('id_persona').value = '';
    document.getElementById('tituloModalPersona').textContent = 'Nueva Persona';
}

document.addEventListener('DOMContentLoaded', cargarPersonas);