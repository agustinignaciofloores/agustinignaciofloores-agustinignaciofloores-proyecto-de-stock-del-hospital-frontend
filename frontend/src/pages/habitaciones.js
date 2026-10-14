// Gestión de Habitaciones - Conectado a Base de Datos
let habitaciones = [];
const API_URL = window.buildApiUrl('/api/habitaciones');

// 1. Cargar Habitaciones desde el Backend
async function cargarHabitaciones() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener habitaciones');
        habitaciones = await response.json();
        actualizarTablaHabitaciones();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('error', 'No se pudieron cargar las habitaciones');
    }
}

// 2. Guardar o Actualizar
async function guardarHabitacion(event) {
    event.preventDefault();
    
    const idHabitacion = document.getElementById('id_habitacion')?.value;
    const data = {
        numero: document.getElementById('numero_habitacion').value,
        capacidad: parseInt(document.getElementById('capacidad_habitacion').value, 10),
        estado: document.getElementById('estado_habitacion').value
    };
    
    if (!data.numero || !data.capacidad) {
        showAlert('error', 'Por favor completa los campos requeridos');
        return;
    }
    
    try {
        const method = idHabitacion ? 'PUT' : 'POST';
        const url = idHabitacion ? `${API_URL}/${idHabitacion}` : API_URL;
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Error al guardar');
        
        showAlert('success', idHabitacion ? 'Habitación actualizada' : 'Habitación guardada');
        closeModal('modalHabitacion');
        limpiarFormularioHabitacion();
        cargarHabitaciones();
    } catch (error) {
        showAlert('error', 'Error al guardar en el servidor');
    }
}

// 3. Preparar edición
function editHabitacion(id) {
    const h = habitaciones.find(hab => String(hab.id) === String(id));
    if (h) {
        document.getElementById('id_habitacion').value = h.id;
        document.getElementById('numero_habitacion').value = h.numero;
        document.getElementById('capacidad_habitacion').value = h.capacidad;
        document.getElementById('estado_habitacion').value = h.estado;
        
        document.getElementById('tituloModalHabitacion').textContent = 'Editar Habitación';
        openModal('modalHabitacion');
    }
}

// 4. Eliminar
async function deleteHabitacion(id) {
    if (confirm('¿Estás seguro de eliminar esta habitación?')) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            showAlert('success', 'Habitación eliminada');
            cargarHabitaciones();
        } catch (error) {
            showAlert('error', 'No se pudo eliminar');
        }
    }
}

// 5. Actualizar tabla
function actualizarTablaHabitaciones() {
    const tbody = document.getElementById('tablaHabitaciones');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    habitaciones.forEach(h => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${h.id}</td>
            <td>${h.numero}</td>
            <td>${h.capacidad}</td>
            <td>${h.estado}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editHabitacion(${h.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteHabitacion(${h.id})">Eliminar</button>
            </td>
        `;
    });
}

// 6. Limpieza
function limpiarFormularioHabitacion() {
    const form = document.getElementById('formHabitacion');
    if (form) form.reset();
    document.getElementById('id_habitacion').value = '';
    document.getElementById('tituloModalHabitacion').textContent = 'Nueva Habitación';
}

document.addEventListener('DOMContentLoaded', cargarHabitaciones);