// Gestión de Proveedores (Conectado dinámicamente a la base de datos)
let proveedores = [];
const PROVEEDORES_API_URL = window.buildApiUrl('/api/proveedores');

// Función para obtener todos los proveedores de la base de datos
async function cargarProveedores() {
    try {
        const response = await fetch(PROVEEDORES_API_URL);
        if (!response.ok) throw new Error('Error al obtener los proveedores');
        proveedores = await response.json();
        actualizarTablaProveedores();
    } catch (error) {
        console.error(error);
        // Si no tenés implementada la función showAlert, usamos un alert común por las dudas
        if (typeof showAlert === 'function') {
            showAlert('error', 'No se pudieron cargar los proveedores desde la base de datos');
        } else {
            alert('No se pudieron cargar los proveedores desde la base de datos');
        }
    }
}

// Guardar o Actualizar un Proveedor en la base de datos
async function guardarProveedor(event) {
    event.preventDefault();
    
    const idProveedor = document.getElementById('id_proveedor')?.value; // Para identificar si es edición
    const nombreEmpresaInput = document.getElementById('nombre_empresa');
    const contactoProveedorInput = document.getElementById('contacto_proveedor');
    const telefonoProveedorInput = document.getElementById('telefono_proveedor');
    const emailProveedorInput = document.getElementById('email_proveedor');

    if (!nombreEmpresaInput || !contactoProveedorInput || !telefonoProveedorInput || !emailProveedorInput) {
        if (typeof showAlert === 'function') showAlert('danger', 'Faltan campos del formulario de proveedores en la vista actual');
        return;
    }

    const nombre_empresa = nombreEmpresaInput.value;
    const contacto_proveedor = contactoProveedorInput.value;
    const telefono_proveedor = telefonoProveedorInput.value;
    const email_proveedor = emailProveedorInput.value;
    
    if (!nombre_empresa) {
        if (typeof showAlert === 'function') showAlert('error', 'El nombre de la empresa es requerido');
        return;
    }
    
    // Objeto estructurado para enviar al backend
    const dataProveedor = {
        empresa: nombre_empresa,
        contacto: contacto_proveedor,
        telefono: telefono_proveedor,
        email: email_proveedor
    };
    
    try {
        let response;
        if (idProveedor) {
            // Modo Edición (PUT)
            response = await fetch(`${PROVEEDORES_API_URL}/${idProveedor}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataProveedor)
            });
        } else {
            // Modo Nuevo Registro (POST)
            response = await fetch(PROVEEDORES_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataProveedor)
            });
        }
        
        if (!response.ok) throw new Error('Error al guardar el proveedor');
        
        if (typeof showAlert === 'function') {
            showAlert('success', idProveedor ? 'Proveedor actualizado correctamente' : 'Proveedor guardado correctamente');
        } else {
            alert(idProveedor ? 'Proveedor actualizado correctamente' : 'Proveedor guardado correctamente');
        }
        
        // Cerramos el modal y limpiamos el formulario de forma segura
        closeModal('modalProveedor');
        limpiarFormularioProveedor();
        
        cargarProveedores(); // Recargar la tabla con los datos frescos
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') {
            showAlert('error', 'Hubo un problema al guardar el proveedor en el servidor');
        } else {
            alert('Hubo un problema al guardar el proveedor en el servidor');
        }
    }
}

// Preparar el modal para editar un Proveedor
function editProveedor(id) {
    // Buscamos que coincida el ID numérico o string de la base de datos
    const proveedor = proveedores.find(p => String(p.id) === String(id));
    if (proveedor) {
        if (document.getElementById('id_proveedor')) {
            document.getElementById('id_proveedor').value = proveedor.id;
        }
        document.getElementById('nombre_empresa').value = proveedor.empresa || '';
        document.getElementById('contacto_proveedor').value = proveedor.contacto || '';
        document.getElementById('telefono_proveedor').value = proveedor.telefono || '';
        document.getElementById('email_proveedor').value = proveedor.email || '';
        
        // Cambiamos el título del modal dinámicamente
        if (document.getElementById('tituloModalProveedor')) {
            document.getElementById('tituloModalProveedor').textContent = 'Editar Proveedor';
        }
        openModal('modalProveedor');
    }
}

// Eliminar un Proveedor de la base de datos
async function deleteProveedor(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
        try {
            const response = await fetch(`${PROVEEDORES_API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar el proveedor');
            
            if (typeof showAlert === 'function') {
                showAlert('success', 'Proveedor eliminado correctamente');
            } else {
                alert('Proveedor eliminado correctamente');
            }
            cargarProveedores(); // Recargar la lista desde la base de datos
        } catch (error) {
            console.error(error);
            if (typeof showAlert === 'function') {
                showAlert('error', 'No se pudo eliminar el proveedor en el servidor');
            } else {
                alert('No se pudo eliminar el proveedor en el servidor');
            }
        }
    }
}

// Renderizar las filas dinámicas en el elemento tbody
function actualizarTablaProveedores() {
    const tbody = document.getElementById('tablaProveedores');
    if (!tbody) return;
    tbody.innerHTML = '';

    const tieneFormularioProveedor = Boolean(document.getElementById('formProveedor'));
    
    if (proveedores.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #888;">No hay proveedores registrados en la base de datos.</td></tr>`;
        return;
    }
    
    proveedores.forEach(proveedor => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${proveedor.id}</td>
            <td><strong>${proveedor.empresa}</strong></td>
            <td>${proveedor.contacto || '-'}</td>
            <td>${proveedor.telefono || '-'}</td>
            <td>${proveedor.email || '-'}</td>
            <td class="table-actions">
                ${tieneFormularioProveedor
                    ? `<button class="btn btn-secondary btn-small" onclick="editProveedor(${proveedor.id})">Editar</button>
                       <button class="btn btn-danger btn-small" onclick="deleteProveedor(${proveedor.id})">Eliminar</button>`
                    : '<span style="color:#666;">Solo lectura</span>'}
            </td>
        `;
    });
}

// Función auxiliar para resetear el formulario y limpiar estados e IDs residuales
function limpiarFormularioProveedor() {
    const form = document.getElementById('formProveedor');
    if (form) form.reset();
    
    if (document.getElementById('id_proveedor')) {
        document.getElementById('id_proveedor').value = '';
    }
    if (document.getElementById('tituloModalProveedor')) {
        document.getElementById('tituloModalProveedor').textContent = 'Nuevo Proveedor';
    }
}

// Inicializar la carga al montar el DOM
document.addEventListener('DOMContentLoaded', cargarProveedores);
console.log('Módulo Proveedores conectado a la base de datos');