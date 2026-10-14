// Gestión de Roles (Se cargará dinámicamente desde la base de datos)
let roles = [];
const API_URL = window.buildApiUrl('/api/roles'); 
// Función para obtener todos los roles de la base de datos
async function cargarRoles() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener los roles');
        roles = await response.json();
        actualizarTablaRoles();
    } catch (error) {
        console.error(error);
        showAlert('error', 'No se pudieron cargar los roles desde la base de datos');
    }
}

// Guardar o Actualizar un Rol en la base de datos
async function guardarRol(event) {
    event.preventDefault();
    
    const idRol = document.getElementById('id_rol')?.value; // Opcional: para identificar si es edición
    const nombre_rol = document.getElementById('nombre_rol').value;
    const descripcion_rol = document.getElementById('descripcion_rol').value;
    
    if (!nombre_rol) {
        showAlert('error', 'El nombre del rol es requerido');
        return;
    }
    
    const dataRol = {
        nombre: nombre_rol,
        descripcion: descripcion_rol
    };
    
    try {
        let response;
        if (idRol) {
            // Modo Edición (PUT)
            response = await fetch(`${API_URL}/${idRol}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataRol)
            });
        } else {
            // Modo Nuevo Registro (POST)
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataRol)
            });
        }
        
        if (!response.ok) throw new Error('Error al guardar el rol');
        
        showAlert('success', idRol ? 'Rol actualizado correctamente' : 'Rol guardado correctamente');
        closeModal('modalRol');
        document.getElementById('formRol').reset();
        if (document.getElementById('id_rol')) document.getElementById('id_rol').value = ''; // Limpiar ID si existe
        
        cargarRoles(); // Recargar datos frescos
    } catch (error) {
        console.error(error);
        showAlert('error', 'Hubo un problema al guardar el rol en el servidor');
    }
}

// Preparar el modal para editar un Rol
function editRol(id) {
    const rol = roles.find(r => r.id === id);
    if (rol) {
        // Si no tienes un input hidden para el ID en tu HTML, considera agregarlo: <input type="hidden" id="id_rol">
        if (document.getElementById('id_rol')) {
            document.getElementById('id_rol').value = rol.id;
        }
        document.getElementById('nombre_rol').value = rol.nombre;
        document.getElementById('descripcion_rol').value = rol.descripcion;
        document.getElementById('tituloModalRol').textContent = 'Editar Rol';
        openModal('modalRol');
    }
}

// Eliminar un Rol de la base de datos
async function deleteRol(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este rol?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar el rol');
            
            showAlert('success', 'Rol eliminado correctamente');
            cargarRoles(); // Recargar la lista actualizada
        } catch (error) {
            console.error(error);
            showAlert('error', 'No se pudo eliminar el rol en el servidor');
        }
    }
}

// Renderizar las filas en el elemento tbody
function actualizarTablaRoles() {
    const tbody = document.getElementById('tablaRoles');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    roles.forEach(rol => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${rol.id}</td>
            <td>${rol.nombre}</td>
            <td>${rol.descripcion}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editRol(${rol.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteRol(${rol.id})">Eliminar</button>
            </td>
        `;
    });
}

// Inicializar la carga de datos al cargar el DOM
document.addEventListener('DOMContentLoaded', cargarRoles);
console.log('Módulo Roles conectado a la base de datos');