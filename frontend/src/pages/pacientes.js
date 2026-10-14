let pacientes = [];
let personasCatalogo = [];
const API_URL = window.buildApiUrl('/api/pacientes');

async function inicializarPacientes() {
    await Promise.all([cargarSelectsPacientes(), cargarPacientes()]);
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

function actualizarPersonaSeleccionadaPaciente() {
    const inputPersona = document.getElementById('persona_paciente');
    const hiddenPersona = document.getElementById('persona_paciente_id');
    if (!inputPersona || !hiddenPersona) return;

    const persona = buscarPersonaEnCatalogo(inputPersona.value);
    hiddenPersona.value = persona ? persona.id : '';
}

async function cargarSelectsPacientes() {
    try {
        const [resPersonas, resPatologias] = await Promise.all([
            fetch(window.buildApiUrl('/api/personas')),
            fetch(window.buildApiUrl('/api/patologias'))
        ]);

        personasCatalogo = await resPersonas.json();
        const patologias = await resPatologias.json();

        const listaPersonas = document.getElementById('listaPersonasPaciente');
        const selectPatologia = document.getElementById('patologia_paciente');

        if (listaPersonas) {
            listaPersonas.innerHTML = '';
            personasCatalogo.forEach((persona) => {
                const option = document.createElement('option');
                option.value = formatearPersonaLabel(persona);
                listaPersonas.appendChild(option);
            });
        }

        if (selectPatologia) {
            selectPatologia.innerHTML = '<option value="">Seleccionar patología</option>';
            patologias.forEach((patologia) => {
                selectPatologia.innerHTML += `<option value="${patologia.id}">${patologia.nombre}</option>`;
            });
        }
    } catch (error) {
        console.error(error);
        showAlert('error', 'No se pudieron cargar los catálogos de pacientes');
    }
}

async function cargarPacientes() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener pacientes');
        pacientes = await response.json();
        actualizarTablaPacientes();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('error', 'No se pudieron cargar los pacientes');
    }
}

async function guardarPaciente(event) {
    event.preventDefault();

    const idPaciente = document.getElementById('id_paciente').value;
    const inputPersona = document.getElementById('persona_paciente');
    const hiddenPersona = document.getElementById('persona_paciente_id');
    const personaSeleccionada = buscarPersonaEnCatalogo(inputPersona?.value || '');
    const data = {
        historia_clinica: document.getElementById('historia_clinica').value.trim(),
        id_persona: hiddenPersona?.value || personaSeleccionada?.id || '',
        id_patologia: document.getElementById('patologia_paciente').value || null,
        estado_ingreso: document.getElementById('estado_ingreso').value
    };

    if (!data.historia_clinica || !data.id_persona) {
        showAlert('error', 'Escribí una persona válida de la lista o creala primero desde Personas');
        return;
    }

    try {
        const response = await fetch(idPaciente ? `${API_URL}/${idPaciente}` : API_URL, {
            method: idPaciente ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Error al guardar paciente');
        }

        showAlert('success', idPaciente ? 'Paciente actualizado correctamente' : 'Paciente guardado correctamente');
        closeModal('modalPaciente');
        limpiarFormularioPaciente();
        await Promise.all([cargarSelectsPacientes(), cargarPacientes()]);
    } catch (error) {
        console.error(error);
        showAlert('error', error.message || 'Problema al guardar en el servidor');
    }
}

function editPaciente(id) {
    const paciente = pacientes.find((item) => String(item.id) === String(id));
    if (!paciente) {
        return;
    }

    document.getElementById('id_paciente').value = paciente.id;
    document.getElementById('historia_clinica').value = paciente.historia_clinica || paciente.numero_afiliado || '';
    const inputPersona = document.getElementById('persona_paciente');
    const hiddenPersona = document.getElementById('persona_paciente_id');
    if (inputPersona) {
        inputPersona.value = paciente.nombre_completo ? `${paciente.nombre_completo} (DNI: ${paciente.documento || ''})` : '';
    }
    if (hiddenPersona) {
        hiddenPersona.value = paciente.id_persona || '';
    }
    document.getElementById('estado_ingreso').value = paciente.estado === 'Ingresado' ? 'true' : 'false';
    document.getElementById('tituloModalPaciente').textContent = 'Editar Paciente';
    openModal('modalPaciente');
}

async function deletePaciente(id) {
    if (!confirm('¿Eliminar este paciente?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('No se pudo eliminar el paciente');
        showAlert('success', 'Paciente eliminado correctamente');
        cargarPacientes();
    } catch (error) {
        console.error(error);
        showAlert('error', 'No se pudo eliminar el paciente');
    }
}

function actualizarTablaPacientes() {
    const tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (pacientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay pacientes registrados.</td></tr>';
        return;
    }

    pacientes.forEach((p) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${p.id}</td>
            <td>${p.historia_clinica || p.numero_afiliado || '-'}</td>
            <td>${p.nombre_completo || '-'}</td>
            <td>${p.documento || '-'}</td>
            <td>${p.patologia || 'N/A'}</td>
            <td>${p.estado || 'N/A'}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editPaciente(${p.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deletePaciente(${p.id})">Eliminar</button>
            </td>
        `;
    });
}

function limpiarFormularioPaciente() {
    document.getElementById('formPaciente').reset();
    document.getElementById('id_paciente').value = '';
    document.getElementById('persona_paciente_id').value = '';
    document.getElementById('tituloModalPaciente').textContent = 'Nuevo Paciente';
}

document.getElementById('persona_paciente')?.addEventListener('input', actualizarPersonaSeleccionadaPaciente);

document.addEventListener('DOMContentLoaded', inicializarPacientes);