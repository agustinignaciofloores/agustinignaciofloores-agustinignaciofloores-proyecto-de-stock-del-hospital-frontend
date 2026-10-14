// js/visitas.js
const PACIENTES_BUSCAR_API = window.buildApiUrl('/api/pacientes/buscar');
const VISITAS_API = window.buildApiUrl('/api/visitas');

let pacienteSeleccionado = null;
// Función para mostrar notificaciones de error o éxito
function notify(type, message) {
    if (typeof showAlert === 'function') {
        showAlert(type, message);
        return;
    }
    alert(message);
}
// Función para formatear fechas en formato legible
function formatearFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return String(fecha);
    return d.toLocaleDateString('es-AR');
}
// Función para formatear horas en formato legible
function formatHora(value) {
    if (!value) return '-';
    const [hh, mm] = String(value).split(':');
    return `${hh || '00'}:${mm || '00'}`;
}
// Función para actualizar el dashboard con estadísticas de visitas
function actualizarDashboard(visitas) {
    const cards = document.querySelectorAll('.stat-card .number');
    if (cards.length < 4) return;

    const hoy = new Date().toISOString().slice(0, 10);
    const visitasHoy = visitas.filter((v) => String(v.fecha_visita).slice(0, 10) === hoy);
    const enHospital = visitas.filter((v) => v.hora_entrada && !v.hora_salida);

    cards[0].textContent = visitasHoy.length;
    cards[1].textContent = enHospital.length;
    cards[2].textContent = visitas.length;
    cards[3].textContent = pacienteSeleccionado ? 1 : 0;
}
// Función para mostrar una sección específica y ocultar las demás
function renderResultadosBusqueda(rows) {
    const contenedor = document.getElementById('resultado-busqueda');
    if (!contenedor) return;

    if (!rows.length) {
        contenedor.innerHTML = '<p style="opacity:0.8;">No se encontraron pacientes para ese DNI o nombre.</p>';
        return;
    }

    contenedor.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Paciente</th>
                    <th>DNI</th>
                    <th>Obra Social</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody>
                ${rows
                    .map(
                        (p) => `
                    <tr>
                        <td>${p.id}</td>
                        <td>${p.nombre || '-'}</td>
                        <td>${p.documento || '-'}</td>
                        <td>${p.obra_social || '-'}</td>
                        <td>
                            <button class="btn btn-small" onclick="seleccionarPacienteVisita(${p.id}, '${String(p.nombre || '').replace(/'/g, "\\'")}', '${String(p.documento || '').replace(/'/g, "\\'")}')">
                                Seleccionar
                            </button>
                        </td>
                    </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
    `;
}
// Función para mostrar una sección específica y ocultar las demás
async function buscarPaciente() {
    const input = document.getElementById('buscar-pac-input');
    const query = String(input?.value || '').trim();

    if (!query) {
        notify('danger', 'Ingresá un DNI o nombre para buscar paciente.');
        return;
    }

    try {
        const response = await fetch(`${PACIENTES_BUSCAR_API}?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('No se pudo buscar pacientes');
        const rows = await response.json();
        renderResultadosBusqueda(Array.isArray(rows) ? rows : []);
    } catch (error) {
        console.error(error);
        notify('danger', error.message || 'Error al buscar paciente');
    }
}
// Función para mostrar una sección específica y ocultar las demás
function seleccionarPacienteVisita(id, nombre, documento) {
    pacienteSeleccionado = { id, nombre, documento };

    const inputPaciente = document.getElementById('paciente-visita');
    const hiddenId = document.getElementById('paciente-id-visita');

    if (inputPaciente) {
        inputPaciente.value = `${nombre || 'Paciente'} (DNI: ${documento || '-'})`;
    }

    if (hiddenId) {
        hiddenId.value = String(id);
    }

    showSection('registro-visita');
    notify('success', 'Paciente seleccionado para la visita.');
}
// Función para mostrar una sección específica y ocultar las demás
async function registrarVisita(event) {
    event.preventDefault();

    const pacienteId = document.getElementById('paciente-id-visita')?.value;
    const visitanteNombre = document.getElementById('nombre-visitante')?.value.trim();
    const visitanteDocumento = document.getElementById('documento-visitante')?.value.trim();

    if (!pacienteId) {
        notify('danger', 'Primero buscá y seleccioná un paciente por DNI en la sección Buscar Paciente.');
        return;
    }

    const payload = {
        paciente_id: parseInt(pacienteId),
        visitante_nombre: visitanteNombre,
        visitante_documento: visitanteDocumento,
        fecha_visita: new Date().toISOString().slice(0, 10),
        hora_entrada: document.getElementById('hora-visita')?.value,
        hora_salida: null,
        relacion: document.getElementById('relacion')?.value,
        observaciones: document.getElementById('observaciones')?.value.trim() || null
    };

    if (!payload.visitante_nombre || !payload.visitante_documento || !payload.hora_entrada || !payload.relacion) {
        notify('danger', 'Completá los campos obligatorios del formulario.');
        return;
    }

    try {
        const response = await fetch(VISITAS_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'No se pudo registrar la visita');
        }

        localStorage.setItem('visitas_documento_visitante', visitanteDocumento);
        notify('success', 'Visita registrada correctamente.');
        document.getElementById('formVisita')?.reset();

        await cargarMisVisitas();
        showSection('mis-visitas');
    } catch (error) {
        console.error(error);
        notify('danger', error.message || 'Error al registrar visita');
    }
}
// Función para mostrar una sección específica y ocultar las demás
function renderMisVisitas(rows) {
    const tbody = document.getElementById('tabla-mis-visitas');
    if (!tbody) return;

    if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No tienes visitas registradas</td></tr>';
        actualizarDashboard([]);
        return;
    }

    tbody.innerHTML = rows
        .map((v) => {
            const estado = v.hora_salida ? 'Finalizada' : 'En curso';
            return `
                <tr>
                    <td>${formatearFecha(v.fecha_visita)}</td>
                    <td>${v.paciente_nombre || '-'}</td>
                    <td>${v.habitacion || 'Sin habitación'}</td>
                    <td>${formatHora(v.hora_entrada)}</td>
                    <td>${formatHora(v.hora_salida)}</td>
                    <td><span class="badge ${v.hora_salida ? 'completado' : 'activo'}">${estado}</span></td>
                    <td>
                        ${v.hora_salida
                            ? '<span style="opacity:0.7;">-</span>'
                            : `<button class="btn btn-small" onclick="finalizarVisita(${v.id})">Finalizar</button>`}
                    </td>
                </tr>
            `;
        })
        .join('');

    actualizarDashboard(rows);
}
// Función para mostrar una sección específica y ocultar las demás
async function finalizarVisita(id) {
    const confirmar = confirm('¿Deseas registrar la hora de salida y finalizar esta visita?');
    if (!confirmar) return;

    try {
        const response = await fetch(`${VISITAS_API}/${id}/finalizar`, { method: 'PUT' });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'No se pudo finalizar la visita');
        }

        notify('success', 'Visita finalizada correctamente.');
        await cargarMisVisitas();
    } catch (error) {
        console.error(error);
        notify('danger', error.message || 'Error al finalizar visita');
    }
}
// Función para mostrar una sección específica y ocultar las demás
async function cargarMisVisitas() {
    const documento = localStorage.getItem('visitas_documento_visitante') || document.getElementById('documento-visitante')?.value.trim();

    if (!documento) {
        renderMisVisitas([]);
        return;
    }

    try {
        const response = await fetch(`${VISITAS_API}/visitante/${encodeURIComponent(documento)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'No se pudieron cargar tus visitas');
        }

        renderMisVisitas(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
        console.error(error);
        notify('danger', error.message || 'Error al cargar mis visitas');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogueado') || 'null');
    if (usuario?.nombre) {
        const nombreVisitante = document.getElementById('nombre-visitante');
        if (nombreVisitante && !nombreVisitante.value) {
            nombreVisitante.value = usuario.nombre;
        }
    }

    document.getElementById('formVisita')?.addEventListener('submit', registrarVisita);
    document.getElementById('buscar-pac-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarPaciente();
        }
    });

    document.getElementById('documento-visitante')?.addEventListener('change', () => {
        const documento = document.getElementById('documento-visitante')?.value.trim();
        if (documento) {
            localStorage.setItem('visitas_documento_visitante', documento);
            cargarMisVisitas();
        }
    });

    cargarMisVisitas();
});

window.buscarPaciente = buscarPaciente;
window.seleccionarPacienteVisita = seleccionarPacienteVisita;
window.finalizarVisita = finalizarVisita;
