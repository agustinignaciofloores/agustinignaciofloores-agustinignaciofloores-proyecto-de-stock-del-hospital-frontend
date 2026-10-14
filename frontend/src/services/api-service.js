//  SERVICIO DE API

const API_URL = window.buildApiUrl('/api');

// Helper común para configurar headers con autenticación JWT de forma limpia
function getHeaders(contentType = true) {
    const headers = {};
    if (contentType) headers['Content-Type'] = 'application/json';
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

//  AUTENTICACIÓN

async function loginAPI(usuario, contraseña) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, contraseña })
        });
        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token); // Token JWT
            localStorage.setItem('usuarioLogueado', JSON.stringify(data.usuario));
        }
        return data;
    } catch (err) {
        console.error('Error en login:', err);
        return { success: false, message: err.message };
    }
}
// Función para registrar un nuevo usuario en la API
async function registerAPI(datosUsuario) {
    try {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosUsuario)
        });
        return await response.json();
    } catch (err) {
        console.error('Error en registro:', err);
        return { success: false, message: err.message };
    }
}

//  PERSONAS (Módulo General)

async function apiObtenerPersonas() {
    try {
        const response = await fetch(`${API_URL}/personas`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener personas:', err); return []; }
}
// Función para guardar o actualizar una persona en la API
async function apiGuardarPersona(persona) {
    try {
        const method = persona.id ? 'PUT' : 'POST';
        const url = persona.id ? `${API_URL}/personas/${persona.id}` : `${API_URL}/personas`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(persona)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar persona:', err); return { success: false }; }
}
// Función para eliminar una persona de la API
async function apiEliminarPersona(id) {
    try {
        const response = await fetch(`${API_URL}/personas/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar persona:', err); return { success: false }; }
}

//  PERSONAL (Médicos, Nutricionistas, etc.)

async function apiObtenerPersonal() {
    try {
        const response = await fetch(`${API_URL}/personal`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener personal:', err); return []; }
}
// Función para guardar o actualizar un miembro del personal en la API
async function apiGuardarPersonal(miembro) {
    try {
        const method = miembro.id ? 'PUT' : 'POST';
        const url = miembro.id ? `${API_URL}/personal/${miembro.id}` : `${API_URL}/personal`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(miembro)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar personal:', err); return { success: false }; }
}
// Función para eliminar un miembro del personal de la API
async function apiEliminarPersonal(id) {
    try {
        const response = await fetch(`${API_URL}/personal/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar personal:', err); return { success: false }; }
}

//  PATOLOGÍAS Y DISCAPACIDADES

async function apiObtenerPatologias() {
    try {
        const response = await fetch(`${API_URL}/patologias`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener patologías:', err); return []; }
}
// Función para guardar o actualizar una patología en la API
async function apiGuardarPatologia(patologia) {
    try {
        const method = patologia.id ? 'PUT' : 'POST';
        const url = patologia.id ? `${API_URL}/patologias/${patologia.id}` : `${API_URL}/patologias`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(patologia)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar patología:', err); return { success: false }; }
}
// Función para eliminar una patología de la API
async function apiEliminarPatologia(id) {
    try {
        const response = await fetch(`${API_URL}/patologias/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar patología:', err); return { success: false }; }
}

//  PACIENTES Y HISTORIAS CLÍNICAS

async function apiObtenerPacientes() {
    try {
        const response = await fetch(`${API_URL}/pacientes`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener pacientes:', err); return []; }
}
// Función para guardar o actualizar un paciente en la API
async function apiGuardarPaciente(paciente) {
    try {
        const method = paciente.id ? 'PUT' : 'POST';
        const url = paciente.id ? `${API_URL}/pacientes/${paciente.id}` : `${API_URL}/pacientes`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(paciente)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar paciente:', err); return { success: false }; }
}
// Función para eliminar un paciente de la API
async function apiEliminarPaciente(id) {
    try {
        const response = await fetch(`${API_URL}/pacientes/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar paciente:', err); return { success: false }; }
}

//  MOVIMIENTOS (Ingresos, Traslados, Altas)

async function apiObtenerMovimientos() {
    try {
        const response = await fetch(`${API_URL}/movimientos`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener movimientos:', err); return []; }
}
// Función para guardar o actualizar un movimiento de almacén en la API
async function apiGuardarMovimiento(movimiento) {
    try {
        const method = movimiento.id ? 'PUT' : 'POST';
        const url = movimiento.id ? `${API_URL}/movimientos/${movimiento.id}` : `${API_URL}/movimientos`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(movimiento)
        });
        return await response.json();
    } catch (err) { console.error('Error al registrar movimiento:', err); return { success: false }; }
}
// Función para eliminar un movimiento de almacén de la API
async function apiEliminarMovimiento(id) {
    try {
        const response = await fetch(`${API_URL}/movimientos/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar movimiento:', err); return { success: false }; }
}

//  MENÚS

async function apiObtenerMenus() {
    try {
        const response = await fetch(`${API_URL}/menus`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener menús:', err); return []; }
}
// Función para guardar o actualizar un menú en la API
async function apiGuardarMenu(menu) {
    try {
        const method = menu.id ? 'PUT' : 'POST';
        const url = menu.id ? `${API_URL}/menus/${menu.id}` : `${API_URL}/menus`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(menu)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar menú:', err); return { success: false }; }
}

async function apiEliminarMenu(id) {
    try {
        const response = await fetch(`${API_URL}/menus/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar menú:', err); return { success: false }; }
}

//  INVENTARIO Y ALMACÉN

async function apiObtenerInventario() {
    try {
        const response = await fetch(`${API_URL}/inventario`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener inventario:', err); return []; }
}
// Función para guardar o actualizar un item de inventario en la API
async function apiGuardarInventario(item) {
    try {
        const method = item.id ? 'PUT' : 'POST';
        const url = item.id ? `${API_URL}/inventario/${item.id}` : `${API_URL}/inventario`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(item)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar inventario:', err); return { success: false }; }
}
// Función para eliminar un item de inventario de la API
async function apiEliminarInventario(id) {
    try {
        const response = await fetch(`${API_URL}/inventario/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar item de inventario:', err); return { success: false }; }
}

//  INGRESOS DE ALMACÉN (PROVEEDORES)

async function apiObtenerIngresos() {
    try {
        const response = await fetch(`${API_URL}/ingresos`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener ingresos:', err); return []; }
}
// Función para guardar o actualizar un ingreso de almacén en la API
async function apiGuardarIngreso(ingreso) {
    try {
        const method = ingreso.id ? 'PUT' : 'POST';
        const url = ingreso.id ? `${API_URL}/ingresos/${ingreso.id}` : `${API_URL}/ingresos`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(ingreso)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar ingreso de almacén:', err); return { success: false }; }
}
// Función para eliminar un ingreso de almacén de la API
async function apiEliminarIngreso(id) {
    try {
        const response = await fetch(`${API_URL}/ingresos/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar ingreso:', err); return { success: false }; }
}

//  HABITACIONES

async function apiObtenerHabitaciones() {
    try {
        const response = await fetch(`${API_URL}/habitaciones`, { headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al obtener habitaciones:', err); return []; }
}
// Función para guardar o actualizar una habitación en la API
async function apiGuardarHabitacion(habitacion) {
    try {
        const method = habitacion.id ? 'PUT' : 'POST';
        const url = habitacion.id ? `${API_URL}/habitaciones/${habitacion.id}` : `${API_URL}/habitaciones`;
        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(habitacion)
        });
        return await response.json();
    } catch (err) { console.error('Error al guardar habitación:', err); return { success: false }; }
}
// Función para eliminar una habitación de la API
async function apiEliminarHabitacion(id) {
    try {
        const response = await fetch(`${API_URL}/habitaciones/${id}`, { method: 'DELETE', headers: getHeaders(false) });
        return await response.json();
    } catch (err) { console.error('Error al eliminar habitación:', err); return { success: false }; }
}

//  UTILIDADES GLOBALES

function cerrarSesionAPI() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuarioLogueado');
    window.location.replace('index.html');
}

// Exportación compatible para Node/CommonJS o Vanilla JS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loginAPI, registerAPI,
        apiObtenerPersonas, apiGuardarPersona, apiEliminarPersona,
        apiObtenerPersonal, apiGuardarPersonal, apiEliminarPersonal,
        apiObtenerPatologias, apiGuardarPatologia, apiEliminarPatologia,
        apiObtenerPacientes, apiGuardarPaciente, apiEliminarPaciente,
        apiObtenerMovimientos, apiGuardarMovimiento, apiEliminarMovimiento,
        apiObtenerMenus, apiGuardarMenu, apiEliminarMenu,
        apiObtenerInventario, apiGuardarInventario, apiEliminarInventario,
        apiObtenerIngresos, apiGuardarIngreso, apiEliminarIngreso,
        apiObtenerHabitaciones, apiGuardarHabitacion, apiEliminarHabitacion,
        cerrarSesionAPI
    };
}