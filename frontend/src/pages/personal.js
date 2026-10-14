// personal.js
// Gestión de Personal - Conectado dinámicamente a la base de datos

let personalList = [];
let personasCatalogo = [];
const API_URL = window.buildApiUrl('/api');

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
        // Ignora errores de parseo JSON para conservar el fallback.
    }

    return detail ? `${fallbackMessage}: ${detail}` : fallbackMessage;
}

// Función para inicializar todo al cargar la página
async function inicializarPersonal() {
    await cargarSelects();   // Rellena los catálogos de Personas y Roles
    await cargarPersonal();  // Trae la lista de empleados
}

function formatearPersonaLabel(persona) {
    return `${persona.apellido}, ${persona.nombre} (DNI: ${persona.dni})`;
}

function normalizarTexto(valor) {
    return String(valor || '').trim().toLowerCase();
}

function buscarPersonaEnCatalogo(valor) {
    const texto = normalizarTexto(valor);
    if (!texto) return null;

    const coincidenciasExactas = personasCatalogo.filter((persona) => {
        const label = normalizarTexto(formatearPersonaLabel(persona));
        const dni = normalizarTexto(persona.dni);
        const nombreCompleto = normalizarTexto(`${persona.nombre} ${persona.apellido}`);
        return label === texto || dni === texto || nombreCompleto === texto;
    });

    if (coincidenciasExactas.length === 1) {
        return coincidenciasExactas[0];
    }

    const coincidenciasParciales = personasCatalogo.filter((persona) => {
        const label = normalizarTexto(formatearPersonaLabel(persona));
        const dni = normalizarTexto(persona.dni);
        const nombreCompleto = normalizarTexto(`${persona.nombre} ${persona.apellido}`);
        return label.includes(texto) || dni.includes(texto) || nombreCompleto.includes(texto);
    });

    return coincidenciasParciales.length === 1 ? coincidenciasParciales[0] : null;
}

function actualizarPersonaSeleccionadaPersonal() {
    const inputPersona = document.getElementById('persona_personal');
    const hiddenPersona = document.getElementById('persona_personal_id');
    if (!inputPersona || !hiddenPersona) return;

    const persona = buscarPersonaEnCatalogo(inputPersona.value);
    hiddenPersona.value = persona ? persona.id : '';
}

// Cargar dinámicamente los elementos del formulario
async function cargarSelects() {
    try {
        const resPersonas = await fetch(`${API_URL}/personas`);
        if (!resPersonas.ok) {
            const message = await parseApiError(resPersonas, 'No se pudieron cargar las personas');
            throw new Error(message);
        }

        personasCatalogo = await resPersonas.json();
        const listaPersonas = document.getElementById('listaPersonasPersonal');
        if (listaPersonas) {
            listaPersonas.innerHTML = '';
            personasCatalogo.forEach((persona) => {
                const option = document.createElement('option');
                option.value = formatearPersonaLabel(persona);
                listaPersonas.appendChild(option);
            });
        }

        // 2. Cargar Roles
        const resRoles = await fetch(`${API_URL}/roles`);
        if (!resRoles.ok) {
            const message = await parseApiError(resRoles, 'No se pudieron cargar los roles');
            throw new Error(message);
        }

        const roles = await resRoles.json();
        const selectRol = document.getElementById('role_personal');
        if (selectRol) {
            selectRol.innerHTML = '<option value="">Seleccionar rol</option>';
            roles.forEach(r => {
                selectRol.innerHTML += `<option value="${r.id ?? r.id_rol}">${r.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error('Error al cargar datos de referencia:', error);
        notifyError(error.message || 'Error al cargar datos de referencia');
    }
}

// Obtener todo el personal de la base de datos
async function cargarPersonal() {
    try {
        const response = await fetch(`${API_URL}/personal`);
        if (!response.ok) {
            const message = await parseApiError(response, 'Error al obtener el personal');
            throw new Error(message);
        }
        personalList = await response.json();
        actualizarTablaPersonal();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudo cargar el personal desde la base de datos');
    }
}

function editPersonal(id) {
    const persona = personalList.find((item) => String(item.id) === String(id));
    if (!persona) {
        return;
    }

    document.getElementById('id_personal').value = persona.id;
    const inputPersona = document.getElementById('persona_personal');
    const hiddenPersona = document.getElementById('persona_personal_id');
    if (inputPersona) {
        inputPersona.value = persona.nombre_completo ? `${persona.nombre_completo} (DNI: ${persona.dni})` : '';
    }
    if (hiddenPersona) {
        hiddenPersona.value = persona.id_persona || '';
    }
    document.getElementById('role_personal').value = persona.id_rol || persona.rol_id || '';
    document.getElementById('estado_activo').value = String(Boolean(persona.activo));
    document.getElementById('tituloModalPersonal').textContent = 'Editar Personal';
    openModal('modalPersonal');
}

async function deletePersonal(id) {
    if (!confirm('¿Querés eliminar este registro de personal?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/personal/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const message = await parseApiError(response, 'No se pudo eliminar el personal');
            throw new Error(message);
        }
        alert('Personal eliminado correctamente');
        cargarPersonal();
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'No se pudo eliminar el personal');
    }
}

// Guardar o Actualizar Personal en la base de datos
async function guardarPersonal(event) {
    event.preventDefault();
    
    const idPersonal = document.getElementById('id_personal')?.value;
    const inputPersona = document.getElementById('persona_personal');
    const hiddenPersona = document.getElementById('persona_personal_id');
    const personaSeleccionada = buscarPersonaEnCatalogo(inputPersona?.value || '');
    const persona_id = hiddenPersona?.value || personaSeleccionada?.id || '';
    const rol_id = document.getElementById('role_personal').value;
    const estado_activo = document.getElementById('estado_activo').value;
    
    if (!persona_id || !rol_id) {
        notifyError('Escribí una persona válida de la lista o creala primero desde Personas');
        return;
    }
    
    const dataPersonal = {
        id_persona: parseInt(persona_id),
        id_rol: parseInt(rol_id),
        activo: estado_activo === 'true'
    };
    
    try {
        let response;
        if (idPersonal) {
            response = await fetch(`${API_URL}/personal/${idPersonal}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPersonal)
            });
        } else {
            response = await fetch(`${API_URL}/personal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPersonal)
            });
        }
        
        if (!response.ok) {
            const message = await parseApiError(response, 'Error al guardar el personal');
            throw new Error(message);
        }
        
        alert('Guardado correctamente');
        closeModal('modalPersonal');
        limpiarFormularioPersonal();
        cargarPersonal(); 
    } catch (error) {
        console.error(error);
        notifyError(error.message || 'Hubo un problema al guardar en el servidor');
    }
}

// Renderizar las filas dinámicas
function actualizarTablaPersonal() {
    const tbody = document.getElementById('tablaPersonal');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (personalList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay personal registrado.</td></tr>`;
        return;
    }
    
    personalList.forEach(p => {
        const row = tbody.insertRow();
        const estadoTexto = p.activo ? 'Activo' : 'Inactivo';
        const estadoEstilo = p.activo ? 'color: green;' : 'color: red;';

        row.innerHTML = `
            <td>${p.id}</td>
            <td><strong>${p.nombre_completo || (p.apellido + ', ' + p.nombre)}</strong></td>
            <td>${p.dni}</td>
            <td>${p.rol_nombre}</td>
            <td><span style="${estadoEstilo}">${estadoTexto}</span></td>
            <td>
                <button onclick="editPersonal(${p.id})">Editar</button>
                <button onclick="deletePersonal(${p.id})">Eliminar</button>
            </td>
        `;
    });
}

function limpiarFormularioPersonal() {
    document.getElementById('formPersonal')?.reset();
    if (document.getElementById('id_personal')) document.getElementById('id_personal').value = '';
    if (document.getElementById('persona_personal_id')) document.getElementById('persona_personal_id').value = '';
    if (document.getElementById('tituloModalPersonal')) document.getElementById('tituloModalPersonal').textContent = 'Nuevo Personal';
}

document.getElementById('persona_personal')?.addEventListener('input', actualizarPersonaSeleccionadaPersonal);

document.addEventListener('DOMContentLoaded', inicializarPersonal);