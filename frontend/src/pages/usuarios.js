// js/usuarios.js
const API_URL = window.buildApiUrl('/api/usuarios');

let usuariosCache = [];
let personasCatalogo = [];
let rolesCatalogo = [];

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
        // Si no hay JSON válido, usamos el fallback.
    }

    return detail ? `${fallbackMessage}: ${detail}` : fallbackMessage;
}

function estadoTexto(activo) {
    return activo ? 'Activo' : 'Inactivo';
}

function optionLabel(persona) {
    return `${persona.apellido}, ${persona.nombre} - DNI ${persona.dni}`;
}

function renderUsuarios(usuarios) {
    const tabla = document.getElementById('tablaUsuarios');
    if (!tabla) {
        return;
    }

    if (!usuarios.length) {
        tabla.innerHTML = '<tr><td colspan="6">No hay usuarios cargados.</td></tr>';
        return;
    }

    tabla.innerHTML = usuarios.map((usuario) => `
        <tr>
            <td>${usuario.id_usuario}</td>
            <td>${usuario.usuario}</td>
            <td>${usuario.apellido}, ${usuario.nombre}</td>
            <td>${usuario.rol}</td>
            <td>${estadoTexto(usuario.activo)}</td>
            <td>
                <button type="button" class="btn btn-secondary" onclick="editarUsuario(${usuario.id_usuario})">Editar</button>
                <button type="button" class="btn btn-danger" onclick="eliminarUsuario(${usuario.id_usuario})">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

function cargarSelectRoles() {
    const select = document.getElementById('rol_usuario');
    if (!select) {
        return;
    }

    select.innerHTML = '<option value="">Seleccionar rol</option>' + rolesCatalogo
        .map((rol) => `<option value="${rol}">${rol}</option>`)
        .join('');
}

function cargarSelectPersonas(usuarioActualIdPersona = null) {
    const select = document.getElementById('id_persona');
    if (!select) {
        return;
    }

    const personasDisponibles = personasCatalogo.filter((persona) => !persona.usuario_id || persona.id_persona === usuarioActualIdPersona);

    select.innerHTML = '<option value="">Seleccionar persona</option>' + personasDisponibles
        .map((persona) => `<option value="${persona.id_persona}">${optionLabel(persona)}</option>`)
        .join('');
}

function resetFormularioUsuario() {
    const form = document.getElementById('formUsuario');
    if (form) {
        form.reset();
    }

    document.getElementById('usuario_id').value = '';
    document.getElementById('tituloModalUsuario').textContent = 'Nuevo Usuario';
    const passwordInput = document.getElementById('password');
    passwordInput.required = true;
    cargarSelectPersonas();
}

function abrirModalNuevoUsuario() {
    resetFormularioUsuario();
    openModal('modalUsuario');
}

function cerrarModalUsuario() {
    closeModal('modalUsuario');
    resetFormularioUsuario();
}

async function cargarCatalogoUsuarios() {
    const response = await fetch(`${API_URL}/catalogo`);
    if (!response.ok) {
        const message = await parseApiError(response, 'No se pudo cargar el catálogo de usuarios');
        throw new Error(message);
    }

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || 'No se pudo cargar el catálogo de usuarios');
    }

    personasCatalogo = data.personas;
    rolesCatalogo = data.roles;
    cargarSelectRoles();
    cargarSelectPersonas();
}

async function cargarUsuarios() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        const message = await parseApiError(response, 'No se pudieron obtener los usuarios');
        throw new Error(message);
    }

    const data = await response.json();
    usuariosCache = data;

    renderUsuarios(usuariosCache);
}

async function recargarVistaUsuarios() {
    await Promise.all([cargarCatalogoUsuarios(), cargarUsuarios()]);
}

async function guardarUsuario(event) {
    event.preventDefault();

    const usuarioId = document.getElementById('usuario_id').value;
    const passwordInput = document.getElementById('password');
    const payload = {
        id_persona: parseInt(document.getElementById('id_persona').value, 10),
        usuario: document.getElementById('username').value.trim(),
        contraseña: passwordInput.value,
        rol: document.getElementById('rol_usuario').value,
        activo: document.getElementById('estado_usuario').value === 'true'
    };

    if (!payload.id_persona || !payload.usuario || !payload.rol) {
        showAlert('danger', 'Completá persona, usuario y rol antes de guardar.');
        return;
    }

    if (!usuarioId && !payload.contraseña) {
        showAlert('danger', 'La contraseña es obligatoria para crear un usuario.');
        return;
    }

    if (usuarioId && !payload.contraseña) {
        delete payload.contraseña;
    }

    const method = usuarioId ? 'PUT' : 'POST';
    const url = usuarioId ? `${API_URL}/${usuarioId}` : API_URL;

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const message = await parseApiError(response, 'No se pudo guardar el usuario');
            throw new Error(message);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'No se pudo guardar el usuario');
        }

        showAlert('success', usuarioId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
        cerrarModalUsuario();
        await recargarVistaUsuarios();
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        notifyError(error.message || 'No se pudo guardar el usuario.');
    }
}

function editarUsuario(idUsuario) {
    const usuario = usuariosCache.find((item) => item.id_usuario === idUsuario);
    if (!usuario) {
        notifyError('No se encontró el usuario seleccionado.');
        return;
    }

    document.getElementById('usuario_id').value = usuario.id_usuario;
    document.getElementById('tituloModalUsuario').textContent = 'Editar Usuario';
    cargarSelectPersonas(usuario.id_persona);
    document.getElementById('id_persona').value = usuario.id_persona;
    document.getElementById('username').value = usuario.usuario;
    document.getElementById('password').value = '';
    document.getElementById('password').required = false;
    document.getElementById('rol_usuario').value = usuario.rol;
    document.getElementById('estado_usuario').value = String(usuario.activo);
    openModal('modalUsuario');
}

function showSectionUsuarios(sectionId) {
    document.querySelectorAll('.section-content').forEach((section) => {
        section.style.display = 'none';
    });

    document.querySelectorAll('.sidebar-menu a').forEach((link) => {
        link.classList.remove('active');
    });

    const titleMap = {
        usuarios: 'Gestionar Usuarios',
        personas: 'Gestionar Personas',
        personal: 'Gestionar Personal',
        roles: 'Gestionar Roles',
        pacientes: 'Gestionar Pacientes'
    };

    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }

    const sectionTitle = document.getElementById('section-title');
    if (sectionTitle && titleMap[sectionId]) {
        sectionTitle.textContent = titleMap[sectionId];
    }

    const currentLink = document.querySelector(`.sidebar-menu a[onclick="showSectionUsuarios('${sectionId}')"]`);
    if (currentLink) {
        currentLink.classList.add('active');
    }
}

async function eliminarUsuario(idUsuario) {
    if (!confirm('¿Querés eliminar este usuario?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${idUsuario}`, { method: 'DELETE' });

        if (!response.ok) {
            const message = await parseApiError(response, 'No se pudo eliminar el usuario');
            throw new Error(message);
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'No se pudo eliminar el usuario');
        }

        showAlert('success', 'Usuario eliminado correctamente.');
        await recargarVistaUsuarios();
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        notifyError(error.message || 'No se pudo eliminar el usuario.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await recargarVistaUsuarios();
    } catch (error) {
        console.error('Error al cargar módulo de usuarios:', error);
        notifyError(error.message || 'No se pudo cargar la gestión de usuarios.');
    }
});

const modalUsuario = document.getElementById('modalUsuario');
if (modalUsuario) {
    modalUsuario.addEventListener('click', (event) => {
        if (event.target === modalUsuario) {
            cerrarModalUsuario();
        }
    });
}

window.abrirModalNuevoUsuario = abrirModalNuevoUsuario;
window.cerrarModalUsuario = cerrarModalUsuario;
window.guardarUsuario = guardarUsuario;
window.editarUsuario = editarUsuario;
window.eliminarUsuario = eliminarUsuario;
window.showSectionUsuarios = showSectionUsuarios;