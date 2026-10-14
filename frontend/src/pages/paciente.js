// Dashboard Paciente: turnos (agendar + mis citas), médicos desde DB y visitas.

let medicosDisponibles = [];
let turnosPaciente = [];
let pacienteActual = null;

function getUsuarioLogueado() {
    try {
        const fromUsuarioLogueado = localStorage.getItem('usuarioLogueado');
        if (fromUsuarioLogueado) return JSON.parse(fromUsuarioLogueado);
    } catch (_) {}

    try {
        const fromCurrentUser = localStorage.getItem('currentUser');
        if (fromCurrentUser) {
            const parsed = JSON.parse(fromCurrentUser);
            if (parsed && typeof parsed === 'object') return parsed;
            return { usuario: String(parsed || '') };
        }
    } catch (_) {}

    return null;
}

function setTexto(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor;
}

function normalizarEspecialidad(valor) {
    return String(valor || '').trim();
}

function toInputDate(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatFecha(fecha) {
    if (!fecha) return '-';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return String(fecha);
    return d.toLocaleDateString('es-AR');
}

function formatHora(hora) {
    if (!hora) return '-';
    return String(hora).slice(0, 5);
}

function parseFechaHoraTurno(turno) {
    const fechaRaw = String(turno?.fecha || '').trim();
    const horaRaw = String(turno?.hora || '').trim();

    if (!fechaRaw) return new Date('invalid');

    if (fechaRaw.includes('T')) {
        const dt = new Date(fechaRaw);
        return Number.isNaN(dt.getTime()) ? new Date('invalid') : dt;
    }

    const horaBase = horaRaw ? horaRaw.slice(0, 5) : '00:00';
    const dt = new Date(`${fechaRaw}T${horaBase}`);
    return Number.isNaN(dt.getTime()) ? new Date('invalid') : dt;
}

async function cargarPacienteActual() {
    const usuario = getUsuarioLogueado();
    if (!usuario) return;

    const nombrePantalla = usuario.nombre || usuario.usuario || 'Paciente';
    setTexto('pacienteName', nombrePantalla);
    setTexto('info-nombre', nombrePantalla);

    if (!usuario.id || Number.isNaN(parseInt(usuario.id, 10))) {
        return;
    }

    try {
        const response = await fetch(window.buildApiUrl('/api/pacientes'));
        if (!response.ok) throw new Error('No se pudieron cargar los pacientes');
        const pacientes = await response.json();

        pacienteActual = pacientes.find((p) => String(p.usuario_id) === String(usuario.id)) || null;

        if (pacienteActual) {
            setTexto('paciente-doc', pacienteActual.documento || '-');
            setTexto('paciente-tel', pacienteActual.telefono || '-');
            setTexto('paciente-email', pacienteActual.email || '-');

            setTexto('info-doc', pacienteActual.documento || '-');
            setTexto('info-fecha', pacienteActual.fecha_nacimiento ? formatFecha(pacienteActual.fecha_nacimiento) : '-');
            setTexto('info-tel', pacienteActual.telefono || '-');
            setTexto('info-email', pacienteActual.email || '-');
            setTexto('info-dir', pacienteActual.direccion || '-');
            setTexto('info-obra', pacienteActual.obra_social || '-');

            const visitaPacienteId = document.getElementById('visita_paciente_id');
            if (visitaPacienteId) visitaPacienteId.value = pacienteActual.id;
        }
    } catch (error) {
        console.error(error);
    }
}

async function cargarEspecialidadesYMedicos() {
    const selectEspecialidad = document.getElementById('turno_especialidad');
    const selectMedico = document.getElementById('turno_medico');

    if (!selectEspecialidad || !selectMedico) return;

    try {
        const response = await fetch(window.buildApiUrl('/api/medicos'));
        if (!response.ok) throw new Error('No se pudieron cargar médicos');

        medicosDisponibles = await response.json();

        const especialidades = [...new Set(medicosDisponibles.map((m) => normalizarEspecialidad(m.especialidad)).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'es'));

        selectEspecialidad.innerHTML = '<option value="">Seleccionar especialidad...</option>';
        especialidades.forEach((especialidad) => {
            const option = document.createElement('option');
            option.value = especialidad;
            option.textContent = especialidad;
            selectEspecialidad.appendChild(option);
        });

        selectMedico.innerHTML = '<option value="">Seleccionar médico...</option>';
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('danger', 'No se pudieron cargar los médicos desde la base');
    }
}

function cargarMedicosPorEspecialidad() {
    const selectEspecialidad = document.getElementById('turno_especialidad');
    const selectMedico = document.getElementById('turno_medico');

    if (!selectEspecialidad || !selectMedico) return;

    const especialidad = normalizarEspecialidad(selectEspecialidad.value);
    selectMedico.innerHTML = '<option value="">Seleccionar médico...</option>';

    const medicosFiltrados = medicosDisponibles.filter((m) => normalizarEspecialidad(m.especialidad).toLowerCase() === especialidad.toLowerCase());

    medicosFiltrados.forEach((medico) => {
        const option = document.createElement('option');
        option.value = medico.id;
        option.textContent = `${medico.nombre} (${medico.consultorio || 'S/C'})`;
        option.dataset.especialidad = medico.especialidad;
        selectMedico.appendChild(option);
    });
}

async function cargarMisCitas() {
    const usuario = getUsuarioLogueado();
    const tbody = document.getElementById('tablaCitasBody');
    if (!tbody) return;

    if (!usuario?.id) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No se pudo identificar al usuario.</td></tr>';
        return;
    }

    try {
        const response = await fetch(window.buildApiUrl(`/api/turnos/${usuario.id}`));
        if (!response.ok) throw new Error('No se pudieron cargar las citas');

        turnosPaciente = await response.json();

        if (!Array.isArray(turnosPaciente) || turnosPaciente.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No hay citas programadas</td></tr>';
            actualizarProximaCita();
            return;
        }

        tbody.innerHTML = '';
        turnosPaciente
            .sort((a, b) => parseFechaHoraTurno(a) - parseFechaHoraTurno(b))
            .forEach((turno) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatFecha(turno.fecha)}</td>
                    <td>${formatHora(turno.hora)}</td>
                    <td>${turno.medico_nombre || 'Sin médico'}</td>
                    <td>${turno.especialidad || '-'}</td>
                    <td><span class="badge">${turno.estado || 'confirmado'}</span></td>
                `;
                tbody.appendChild(tr);
            });

        actualizarProximaCita();
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Error al cargar citas</td></tr>';
    }
}

function actualizarProximaCita() {
    const contenedor = document.querySelector('#dashboard-section .stat-card .info');
    if (!contenedor) return;

    if (!Array.isArray(turnosPaciente) || turnosPaciente.length === 0) {
        contenedor.textContent = 'Sin citas programadas';
        return;
    }

    const ahora = new Date();
    const proximos = turnosPaciente
        .map((t) => ({ ...t, fechaObj: parseFechaHoraTurno(t) }))
        .filter((t) => !Number.isNaN(t.fechaObj.getTime()) && t.fechaObj >= ahora)
        .sort((a, b) => a.fechaObj - b.fechaObj);

    const proxima = proximos[0] || turnosPaciente[0];
    contenedor.textContent = `${formatFecha(proxima.fecha)} ${formatHora(proxima.hora)} - ${proxima.medico_nombre || 'Sin médico'}`;
}

async function guardarTurno(event) {
    event.preventDefault();

    const usuario = getUsuarioLogueado();
    if (!usuario?.id) {
        if (typeof showAlert === 'function') showAlert('danger', 'No se pudo identificar al usuario para guardar el turno.');
        return;
    }

    const especialidad = document.getElementById('turno_especialidad')?.value;
    const medicoId = document.getElementById('turno_medico')?.value;
    const fecha = document.getElementById('turno_fecha')?.value;
    const hora = document.getElementById('turno_hora')?.value;
    const motivo = document.getElementById('turno_motivo')?.value?.trim() || 'Consulta general';

    if (!especialidad || !medicoId || !fecha || !hora) {
        if (typeof showAlert === 'function') showAlert('danger', 'Completá especialidad, médico, fecha y hora.');
        return;
    }

    try {
        const payload = {
            usuario_id: parseInt(usuario.id, 10),
            medico_id: parseInt(medicoId, 10),
            especialidad,
            fecha,
            hora,
            motivo
        };

        const response = await fetch(window.buildApiUrl('/api/turnos'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'No se pudo confirmar el turno');
        }

        if (typeof showAlert === 'function') showAlert('success', 'Turno confirmado correctamente.');

        const form = document.getElementById('turnoForm');
        if (form) form.reset();

        await cargarMisCitas();
        showSection('citas');
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('danger', error.message || 'Error al guardar el turno');
    }
}

async function guardarVisita(event) {
    event.preventDefault();

    const pacienteId = document.getElementById('visita_paciente_id')?.value;
    if (!pacienteId) {
        if (typeof showAlert === 'function') showAlert('danger', 'No se encontró el paciente para registrar la visita.');
        return;
    }

    const payload = {
        paciente_id: parseInt(pacienteId, 10),
        visitante_nombre: document.getElementById('visitante_nombre')?.value?.trim(),
        visitante_documento: document.getElementById('visitante_documento')?.value?.trim(),
        fecha_visita: document.getElementById('fecha_visita')?.value,
        hora_entrada: document.getElementById('hora_entrada')?.value,
        hora_salida: document.getElementById('hora_salida')?.value,
        relacion: document.getElementById('relacion')?.value?.trim(),
        observaciones: document.getElementById('observaciones')?.value?.trim() || null
    };

    try {
        const response = await fetch(window.buildApiUrl('/api/visitas'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudo registrar la visita');
        }

        if (typeof showAlert === 'function') showAlert('success', 'Visita registrada correctamente.');

        const form = document.getElementById('visitaForm');
        if (form) form.reset();

        await cargarVisitas();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('danger', error.message || 'Error al registrar visita');
    }
}

async function cargarVisitas() {
    const tbody = document.querySelector('#tablaVisitas tbody');
    if (!tbody) return;

    const pacienteId = document.getElementById('visita_paciente_id')?.value;
    if (!pacienteId) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">No se encontró paciente</td></tr>';
        return;
    }

    try {
        const response = await fetch(window.buildApiUrl(`/api/visitas/paciente/${pacienteId}`));
        if (!response.ok) throw new Error('No se pudieron cargar visitas');

        const result = await response.json();
        const visitas = Array.isArray(result.data) ? result.data : [];

        if (visitas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Sin visitas registradas</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        visitas.forEach((v) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatFecha(v.fecha_visita)}</td>
                <td>${v.visitante_nombre || '-'}</td>
                <td>${v.visitante_documento || '-'}</td>
                <td>${formatHora(v.hora_entrada)} - ${formatHora(v.hora_salida)}</td>
                <td>${v.relacion || '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error(error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Error al cargar visitas</td></tr>';
    }
}

function actualizarFechaMinimaTurno() {
    const fechaInput = document.getElementById('turno_fecha');
    if (!fechaInput) return;

    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    fechaInput.min = toInputDate(manana);
}

function actualizarTituloSeccion(sectionId) {
    const titulos = {
        dashboard: 'Mi Dashboard',
        'agendar-turno': 'Agendar Turno',
        'mi-info': 'Mi Información',
        citas: 'Mis Citas',
        'registrar-visita': 'Registrar Visita',
        historial: 'Historial Médico',
        mensajes: 'Mensajes',
        recetas: 'Mis Recetas'
    };

    const h1 = document.getElementById('section-title');
    if (h1) h1.textContent = titulos[sectionId] || 'Mi Dashboard';
}

async function onSectionShown(sectionId) {
    if (sectionId === 'citas' || sectionId === 'dashboard') {
        await cargarMisCitas();
    }

    if (sectionId === 'registrar-visita') {
        await cargarVisitas();
    }
}

function showSection(sectionId) {
    const dashboard = document.getElementById('dashboard-section');
    const sections = document.querySelectorAll('.section-content');

    sections.forEach((el) => {
        el.style.display = 'none';
    });

    if (dashboard) {
        dashboard.style.display = sectionId === 'dashboard' ? 'block' : 'none';
    }

    if (sectionId !== 'dashboard') {
        const sec = document.getElementById(sectionId);
        if (sec) sec.style.display = 'block';
    }

    document.querySelectorAll('.sidebar-menu a').forEach((a) => a.classList.remove('active'));
    const activeLink = document.querySelector(`.sidebar-menu a[onclick*="${sectionId}"]`);
    if (activeLink) activeLink.classList.add('active');

    actualizarTituloSeccion(sectionId);
    onSectionShown(sectionId);
}

function editarInfo() {
    const infoView = document.getElementById('info-view');
    const infoEdit = document.getElementById('info-edit');

    if (!infoView || !infoEdit) return;

    // Mostrar el formulario de edición
    infoView.style.display = 'none';
    infoEdit.style.display = 'block';

    // Cargar los datos actuales en los campos del formulario
    if (pacienteActual) {
        document.getElementById('edit-nombre').value = pacienteActual.nombre || '';
        document.getElementById('edit-doc').value = pacienteActual.documento || '';
        document.getElementById('edit-fecha').value = pacienteActual.fecha_nacimiento ? pacienteActual.fecha_nacimiento.split('T')[0] : '';
        document.getElementById('edit-tel').value = pacienteActual.telefono || '';
        document.getElementById('edit-email').value = pacienteActual.email || '';
        document.getElementById('edit-dir').value = pacienteActual.direccion || '';
        document.getElementById('edit-obra').value = pacienteActual.obra_social || '';
    }
}

function cancelarEdicion() {
    const infoView = document.getElementById('info-view');
    const infoEdit = document.getElementById('info-edit');

    if (!infoView || !infoEdit) return;

    infoView.style.display = 'block';
    infoEdit.style.display = 'none';
}

async function guardarInfoPaciente(event) {
    event.preventDefault();

    if (!pacienteActual || !pacienteActual.id) {
        if (typeof showAlert === 'function') showAlert('danger', 'No se encontró el paciente para actualizar.');
        return;
    }

    const datosActualizados = {
        nombre: document.getElementById('edit-nombre')?.value?.trim() || '',
        documento: document.getElementById('edit-doc')?.value?.trim() || '',
        fecha_nacimiento: document.getElementById('edit-fecha')?.value || null,
        telefono: document.getElementById('edit-tel')?.value?.trim() || '',
        email: document.getElementById('edit-email')?.value?.trim() || '',
        direccion: document.getElementById('edit-dir')?.value?.trim() || '',
        obra_social: document.getElementById('edit-obra')?.value?.trim() || ''
    };

    try {
        const response = await fetch(window.buildApiUrl(`/api/pacientes/${pacienteActual.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || result.message || 'No se pudieron guardar los cambios');
        }

        // Actualizar la información en la interfaz
        pacienteActual = { ...pacienteActual, ...datosActualizados };
        
        setTexto('info-nombre', pacienteActual.nombre || '-');
        setTexto('info-doc', pacienteActual.documento || '-');
        setTexto('info-fecha', pacienteActual.fecha_nacimiento ? formatFecha(pacienteActual.fecha_nacimiento) : '-');
        setTexto('info-tel', pacienteActual.telefono || '-');
        setTexto('info-email', pacienteActual.email || '-');
        setTexto('info-dir', pacienteActual.direccion || '-');
        setTexto('info-obra', pacienteActual.obra_social || '-');

        if (typeof showAlert === 'function') showAlert('success', 'Datos actualizados correctamente.');
        
        cancelarEdicion();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('danger', error.message || 'Error al guardar los cambios');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await cargarPacienteActual();
    await cargarEspecialidadesYMedicos();
    actualizarFechaMinimaTurno();

    const especialidadSelect = document.getElementById('turno_especialidad');
    if (especialidadSelect) {
        especialidadSelect.addEventListener('change', cargarMedicosPorEspecialidad);
    }

    const turnoForm = document.getElementById('turnoForm');
    if (turnoForm) {
        turnoForm.addEventListener('submit', guardarTurno);
    }

    const visitaForm = document.getElementById('visitaForm');
    if (visitaForm) {
        visitaForm.addEventListener('submit', guardarVisita);
    }

    const editarInfoForm = document.getElementById('editarInfoForm');
    if (editarInfoForm) {
        editarInfoForm.addEventListener('submit', guardarInfoPaciente);
    }

    await cargarMisCitas();
});

window.showSection = showSection;
window.editarInfo = editarInfo;
window.cancelarEdicion = cancelarEdicion;
