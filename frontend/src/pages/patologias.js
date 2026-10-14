// Gestión de Patologías - Conectado a la base de datos
let patologias = [];
const API_URL = window.buildApiUrl('/api/patologias');

// 1. Cargar Patologías desde la BD
async function cargarPatologias() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener las patologías');
        patologias = await response.json();
        actualizarTablaPatologias();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('error', 'No se pudieron cargar las patologías');
    }
}

// 2. Guardar o Actualizar una Patología
async function guardarPatologia(event) {
    event.preventDefault();
    
    const idPatologia = document.getElementById('id_patologia')?.value;
    const nombre = document.getElementById('nombre_patologia').value;
    const descripcion = document.getElementById('descripcion_patologia').value;
    const es_discapacidad = document.getElementById('es_discapacidad').checked;
    
    if (!nombre) {
        showAlert('error', 'El nombre es requerido');
        return;
    }
    
    const dataPatologia = {
        nombre: nombre,
        descripcion: descripcion,
        es_discapacidad: es_discapacidad // Enviamos booleano puro
    };
    
    try {
        let response;
        if (idPatologia) {
            response = await fetch(`${API_URL}/${idPatologia}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPatologia)
            });
        } else {
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataPatologia)
            });
        }
        
        if (!response.ok) throw new Error('Error al guardar');
        
        showAlert('success', idPatologia ? 'Patología actualizada' : 'Patología guardada');
        closeModal('modalPatologia');
        limpiarFormularioPatologia();
        cargarPatologias();
    } catch (error) {
        console.error(error);
        showAlert('error', 'Error al guardar en el servidor');
    }
}

// 3. Preparar edición
function editPatologia(id) {
    const patologia = patologias.find(p => String(p.id) === String(id));
    if (patologia) {
        if (document.getElementById('id_patologia')) document.getElementById('id_patologia').value = patologia.id;
        document.getElementById('nombre_patologia').value = patologia.nombre;
        document.getElementById('descripcion_patologia').value = patologia.descripcion || '';
        document.getElementById('es_discapacidad').checked = !!patologia.es_discapacidad;
        
        document.getElementById('tituloModalPatologia').textContent = 'Editar Patología';
        openModal('modalPatologia');
    }
}

// 4. Eliminar
async function deletePatologia(id) {
    if (confirm('¿Estás seguro?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Error al eliminar');
            
            showAlert('success', 'Patología eliminada');
            cargarPatologias();
        } catch (error) {
            console.error(error);
            showAlert('error', 'No se pudo eliminar');
        }
    }
}

// 5. Actualizar Tabla
function actualizarTablaPatologias() {
    const tbody = document.getElementById('tablaPatologias');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    patologias.forEach(p => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.es_discapacidad ? 'Discapacidad' : 'Patología'}</td>
            <td>${p.descripcion || '-'}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editPatologia(${p.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deletePatologia(${p.id})">Eliminar</button>
            </td>
        `;
    });
}

// 6. Limpiar Formulario (Auxiliar)
function limpiarFormularioPatologia() {
    const form = document.getElementById('formPatologia');
    if (form) form.reset();
    if (document.getElementById('id_patologia')) document.getElementById('id_patologia').value = '';
    if (document.getElementById('tituloModalPatologia')) document.getElementById('tituloModalPatologia').textContent = 'Nueva Patología';
}

document.addEventListener('DOMContentLoaded', cargarPatologias);