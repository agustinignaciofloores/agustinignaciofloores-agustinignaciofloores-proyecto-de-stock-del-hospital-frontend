// Gestión del Doctor - Lógica del Dashboard
const API_URL = window.buildApiUrl('/api/doctor');

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfilDoctor();
    cargarEstadisticas();
    cargarPacientes();
    cargarAgenda();
});

// 1. Cargar info básica del doctor
async function cargarPerfilDoctor() {
    try {
        const res = await fetch(`${API_URL}/perfil`);
        const d = await res.json();
        document.getElementById('doctorName').textContent = d.nombre;
        document.getElementById('doctor-especialidad').textContent = d.especialidad;
        document.getElementById('doctor-colegio').textContent = d.nro_colegio;
        document.getElementById('doctor-consultorio').textContent = d.consultorio;
        document.getElementById('doctor-horario').textContent = d.horario;
    } catch (e) { console.error("Error al cargar perfil:", e); }
}

// 2. Cargar números del Dashboard
async function cargarEstadisticas() {
    try {
        const res = await fetch(`${API_URL}/resumen`);
        const s = await res.json();
        document.getElementById('stat-pacientes').textContent = s.total_pacientes;
        document.getElementById('stat-citas').textContent = s.citas_hoy;
        document.getElementById('stat-recetas').textContent = s.recetas_pendientes;
        document.getElementById('stat-historiales').textContent = s.historiales_pendientes;
    } catch (e) { console.error("Error al cargar estadísticas:", e); }
}

// 3. Cargar tabla de Pacientes asignados
async function cargarPacientes() {
    try {
        const res = await fetch(`${API_URL}/mis-pacientes`);
        const pacientes = await res.json();
        const tbody = document.querySelector('#tablaPacientes tbody');
        
        tbody.innerHTML = '';
        pacientes.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.nombre}</td>
                    <td>${p.documento}</td>
                    <td>${p.edad}</td>
                    <td><span class="badge">${p.estado}</span></td>
                    <td><button class="btn btn-small" onclick="verHistorial(${p.id})">Historial</button></td>
                </tr>
            `;
        });
    } catch (e) { console.error("Error al cargar pacientes:", e); }
}

// 4. Cargar Agenda
async function cargarAgenda() {
    // Similar a pacientes, pero conectando a /api/doctor/citas
}

// 5. Acción de búsqueda
function buscarPaciente() {
    const input = document.getElementById('buscar-paciente').value.toLowerCase();
    // Aquí puedes filtrar la tabla que ya cargaste o hacer un nuevo fetch
    console.log("Filtrando por:", input);
}

// 6. Navegación a historial
function verHistorial(idPaciente) {
    window.location.href = `gestionar-historiales.html?id=${idPaciente}`;
}