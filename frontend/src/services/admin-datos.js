// Configuración de las secciones de datos de administración, incluyendo endpoints, columnas y campos del formulario
const ADMIN_DATA_CONFIG = {
    personas: {
        endpoint: '/api/personas',
        tbodyId: 'tablaPersonasAdmin',
        idField: 'id',
        columns: ['id', 'dni', 'apellido', 'nombre', 'telefono', 'email', 'activo'],
        fields: [
            { key: 'dni', label: 'DNI', type: 'number', required: true },
            { key: 'apellido', label: 'Apellido', required: true },
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'telefono', label: 'Teléfono' },
            { key: 'email', label: 'Email', type: 'email' },
            {
                key: 'sexo',
                label: 'Sexo',
                type: 'select',
                defaultValue: 'No especifica',
                options: ['Masculino', 'Femenino', 'Otro', 'No especifica']
            },
            { key: 'fecha_nac', label: 'Fecha Nac.', type: 'date' },
            {
                key: 'estado_civil',
                label: 'Estado Civil',
                type: 'select',
                defaultValue: 'No especifica',
                options: ['Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión de Hecho', 'No especifica']
            },
            { key: 'etnia', label: 'Etnia' },
            { key: 'discapacidad', label: 'Discapacidad' }
        ]
    },
    personal: {
        endpoint: '/api/personal',
        tbodyId: 'tablaPersonalAdmin',
        idField: 'id',
        columns: ['id', 'dni', 'apellido', 'nombre', 'rol_nombre', 'activo'],
        fields: [
            { key: 'id_persona', label: 'ID Persona', type: 'number', requiredOnCreate: true },
            { key: 'id_rol', label: 'ID Rol', type: 'number', required: true },
            { key: 'activo', label: 'Activo', type: 'checkbox', defaultValue: true }
        ]
    },
    pacientes: {
        endpoint: '/api/pacientes',
        tbodyId: 'tablaPacientesAdmin',
        idField: 'id',
        columns: ['id', 'documento', 'nombre_completo', 'fecha_nacimiento', 'telefono', 'email', 'obra_social'],
        fields: [
            { key: 'id_persona', label: 'ID Persona', type: 'number' },
            { key: 'documento', label: 'Documento' },
            { key: 'fecha_nacimiento', label: 'Fecha Nac.', type: 'date' },
            { key: 'telefono', label: 'Teléfono' },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'direccion', label: 'Dirección' },
            { key: 'ciudad', label: 'Ciudad' },
            { key: 'obra_social', label: 'Obra Social' },
            { key: 'id_patologia', label: 'ID Patología', type: 'number' },
            { key: 'estado_ingreso', label: 'Ingresado', type: 'checkbox', defaultValue: true }
        ]
    },
    proveedores: {
        endpoint: '/api/proveedores',
        tbodyId: 'tablaProveedoresAdmin',
        idField: 'id',
        columns: ['id', 'nombre', 'empresa', 'contacto', 'telefono', 'email'],
        fields: [
            { key: 'empresa', label: 'Empresa', required: true },
            { key: 'contacto', label: 'Contacto' },
            { key: 'telefono', label: 'Teléfono' },
            { key: 'email', label: 'Email', type: 'email' }
        ]
    },
    productos: {
        endpoint: '/api/productos',
        tbodyId: 'tablaProductosAdmin',
        idField: 'id',
        columns: ['id', 'nombre', 'categoria', 'unidad', 'stock_minimo', 'stock_actual'],
        fields: [
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'categoria', label: 'Categoría', defaultValue: 'verdura' },
            { key: 'unidad', label: 'Unidad', defaultValue: 'unidad', required: true },
            { key: 'stock_minimo', label: 'Stock Mínimo', type: 'number', defaultValue: 0 },
            { key: 'stock_actual', label: 'Stock Actual', type: 'number', defaultValue: 0 }
        ]
    },
    patologias: {
        endpoint: '/api/patologias',
        tbodyId: 'tablaPatologiasAdmin',
        idField: 'id',
        columns: ['id', 'nombre', 'descripcion', 'es_discapacidad'],
        fields: [
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'descripcion', label: 'Descripción' }
        ]
    },
    menus: {
        endpoint: '/api/menus',
        tbodyId: 'tablaMenusAdmin',
        idField: 'id',
        columns: ['id', 'nombre', 'descripcion', 'patologia_nombre'],
        fields: [
            { key: 'nombre', label: 'Nombre', required: true },
            { key: 'descripcion', label: 'Descripción' },
            { key: 'id_patologia', label: 'ID Patología', type: 'number' },
            { key: 'restriccion', label: 'Restricción (texto)' }
        ]
    },
    movimientos: {
        endpoint: '/api/movimientos',
        tbodyId: 'tablaMovimientosAdmin',
        idField: 'id',
        columns: ['id', 'paciente_nombre', 'tipo', 'nro_cama', 'piso', 'personal_nombre', 'fecha'],
        fields: [
            { key: 'id_paciente', label: 'ID Paciente', required: true },
            { key: 'tipo', label: 'Tipo', required: true, defaultValue: 'Ingreso' },
            { key: 'nro_cama', label: 'Nro Cama' },
            { key: 'piso', label: 'Piso' },
            { key: 'id_personal', label: 'ID Personal (id_usuario)' }
        ]
    },
    inventario: {
        endpoint: '/api/inventario',
        tbodyId: 'tablaInventarioAdmin',
        idField: 'id',
        columns: ['id', 'producto', 'stock', 'personal', 'fecha'],
        fields: [
            { key: 'producto', label: 'Producto', required: true },
            { key: 'stock', label: 'Stock Inicial', type: 'number', required: true },
            { key: 'personal', label: 'ID Personal (id_usuario)', type: 'number' },
            { key: 'categoria', label: 'Categoría', defaultValue: 'verdura' }
        ],
        updateFields: [
            {
                key: 'tipo',
                label: 'Tipo Ajuste',
                type: 'select',
                required: true,
                defaultValue: 'INGRESO',
                options: [
                    { value: 'INGRESO', label: 'INGRESO' },
                    { value: 'SALIDA', label: 'SALIDA' }
                ]
            },
            { key: 'cantidad', label: 'Cantidad', type: 'number', required: true },
            { key: 'personal', label: 'ID Personal (id_usuario)', type: 'number' },
            { key: 'personal_nombre', label: 'Nombre Responsable' }
        ]
    }
};

const adminDataLoaded = new Set();
const adminRowsCache = new Map();

let crudState = {
    sectionId: null,
    mode: 'create',
    itemId: null
};
// Variable para almacenar el último valor de bajoMinimo alertado
let ultimoBajoMinimoAlertado = null;
const UMBRAL_STOCK_CRITICO = 5;
// Función para escapar caracteres especiales en HTML y prevenir inyecciones
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
// Función para formatear valores de celdas según su tipo
function formatCellValue(key, value) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    if (typeof value === 'boolean') {
        return value ? 'Sí' : 'No';
    }

    if (typeof value === 'string' && key.toLowerCase().includes('fecha')) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString('es-AR');
        }
    }

    return String(value);
}
// Función para normalizar la respuesta de la API y obtener un array de filas
function normalizePayload(payload) {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.data)) {
        return payload.data;
    }

    if (payload && Array.isArray(payload.rows)) {
        return payload.rows;
    }

    return [];
}
// Función para renderizar alertas de inventario en el panel correspondiente
function renderAlertasInventario(reporte, productosCriticos = []) {
    const panel = document.getElementById('alertasInventarioAdmin');
    if (!panel) {
        return;
    }

    const bajoMinimo = Number(reporte?.bajoMinimo || 0);
    const topProductos = Array.isArray(reporte?.topProductos) ? reporte.topProductos : [];
    const productosAlertados = topProductos.length ? topProductos : productosCriticos;
    const totalAlertas = topProductos.length ? bajoMinimo : productosCriticos.length;

    if (totalAlertas <= 0) {
        panel.style.display = 'none';
        panel.innerHTML = '';
        return;
    }

    const filas = productosAlertados.map((producto) => `
        <tr>
            <td>${escapeHtml(producto.producto || '-')}</td>
            <td>${escapeHtml(producto.stock ?? '-')}</td>
            <td>${escapeHtml(producto.stock_minimo ?? '-')}</td>
        </tr>
    `).join('');

    panel.style.display = 'block';
    panel.innerHTML = `
        <div class="card-header"><h2 style="color:#b45309;">Alertas de Stock Bajo</h2></div>
        <div class="card-body">
            <p>Hay <strong>${totalAlertas}</strong> producto(s) en nivel de alerta.</p>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Stock Actual</th>
                            <th>Stock Mínimo</th>
                        </tr>
                    </thead>
                    <tbody>${filas || '<tr><td colspan="3">Sin detalle</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}
// Función para verificar alertas de stock bajo y mostrar notificaciones si es necesario
async function verificarAlertasStockBajo() {
    try {
        const [responseReporte, responseProductos] = await Promise.all([
            fetch(window.buildApiUrl('/api/reportes/almacen')),
            fetch(window.buildApiUrl('/api/productos'))
        ]);

        if (!responseReporte.ok || !responseProductos.ok) {
            return;
        }

        const reporte = await responseReporte.json();
        const productos = await responseProductos.json();
        const bajoMinimo = Number(reporte?.bajoMinimo || 0);
        const productosCriticos = Array.isArray(productos)
            ? productos
                .map((p) => ({
                    producto: p.nombre,
                    stock: Number(p.stock_actual ?? 0),
                    stock_minimo: Number(p.stock_minimo ?? 0)
                }))
                .filter((p) => p.stock_minimo > 0 ? p.stock <= p.stock_minimo : p.stock <= UMBRAL_STOCK_CRITICO)
            : [];

        const totalAlertas = bajoMinimo > 0 ? bajoMinimo : productosCriticos.length;

        renderAlertasInventario(reporte, productosCriticos);

        if (totalAlertas > 0 && totalAlertas !== ultimoBajoMinimoAlertado && typeof showAlert === 'function') {
            showAlert('warning', `Alerta de inventario: ${totalAlertas} producto(s) en nivel crítico.`);
        }

        ultimoBajoMinimoAlertado = totalAlertas;
    } catch (error) {
        console.error('No se pudieron cargar alertas de stock bajo:', error);
    }
}
// Función para obtener una fila específica por su ID desde la caché
function getRowById(sectionId, id) {
    const rows = adminRowsCache.get(sectionId) || [];
    return rows.find((row) => String(row.id) === String(id));
}
// Función para renderizar las filas de la tabla según la sección y los datos obtenidos
function renderTableRows(sectionId, rows) {
    const config = ADMIN_DATA_CONFIG[sectionId];
    const tbody = document.getElementById(config.tbodyId);
    if (!tbody) {
        return;
    }

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}">No hay datos cargados.</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map((row) => {
        const cells = config.columns
            .map((column) => `<td>${escapeHtml(formatCellValue(column, row[column]))}</td>`)
            .join('');

        const idValue = row[config.idField] ?? row.id;
        const actions = `
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" type="button" onclick="abrirCrudAdmin('${sectionId}', ${idValue})">Editar</button>
                <button class="btn btn-danger btn-small" type="button" onclick="eliminarCrudAdmin('${sectionId}', ${idValue})">Eliminar</button>
            </td>
        `;

        return `<tr>${cells}${actions}</tr>`;
    }).join('');
}
// Función para cargar los datos de una sección específica desde la API y renderizarlos en la tabla correspondiente
async function loadAdminSection(sectionId, force = false) {
    const config = ADMIN_DATA_CONFIG[sectionId];
    if (!config) {
        return;
    }

    if (adminDataLoaded.has(sectionId) && !force) {
        return;
    }

    const tbody = document.getElementById(config.tbodyId);
    if (!tbody) {
        return;
    }

    try {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}">Cargando...</td></tr>`;
        const response = await fetch(window.buildApiUrl(config.endpoint));

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();
        const rows = normalizePayload(payload);

        adminRowsCache.set(sectionId, rows);
        renderTableRows(sectionId, rows);
        adminDataLoaded.add(sectionId);

        if (sectionId === 'inventario') {
            await verificarAlertasStockBajo();
        }
    } catch (error) {
        console.error(`Error al cargar ${sectionId}:`, error);
        tbody.innerHTML = `<tr><td colspan="${config.columns.length + 1}">No se pudo cargar esta sección.</td></tr>`;
    }
}
//  Función para crear un campo de entrada (input) en el formulario según la configuración del campo
function createFieldInput(field, value) {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const label = document.createElement('label');
    label.setAttribute('for', `crud_${field.key}`);
    label.textContent = field.label;
    formGroup.appendChild(label);

    const inputType = field.type || 'text';
    let input;

    if (inputType === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(value ?? field.defaultValue);
    } else if (inputType === 'select') {
        input = document.createElement('select');
        const options = Array.isArray(field.options) ? field.options : [];
        const selectedValue = String(value ?? field.defaultValue ?? '');
        input.innerHTML = options.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            const selected = String(optionValue) === selectedValue ? ' selected' : '';
            return `<option value="${escapeHtml(optionValue)}"${selected}>${escapeHtml(optionLabel)}</option>`;
        }).join('');
    } else {
        input = document.createElement('input');
        input.type = inputType;
        input.value = value ?? field.defaultValue ?? '';
    }

    input.id = `crud_${field.key}`;
    input.name = field.key;
    if (field.required) {
        input.required = true;
    }

    formGroup.appendChild(input);
    return formGroup;
}
// Función para obtener los campos de una sección según el modo (crear o editar)
function getSectionFields(sectionId, mode) {
    const config = ADMIN_DATA_CONFIG[sectionId];
    if (sectionId === 'inventario' && mode === 'edit') {
        return config.updateFields || [];
    }

    const fields = config.fields || [];
    if (mode === 'create') {
        return fields.map((field) => ({
            ...field,
            required: field.required || field.requiredOnCreate || false
        }));
    }

    return fields.filter((field) => field.key !== 'id_persona' || sectionId !== 'personal').map((field) => ({
        ...field,
        required: field.required || false
    }));
}
// Función para construir el formulario de CRUD según la sección, el modo y los datos de la fila (si es editar)
function buildCrudForm(sectionId, mode, row) {
    const container = document.getElementById('crudAdminCampos');
    if (!container) {
        return;
    }

    container.innerHTML = '';
    const fields = getSectionFields(sectionId, mode);
    fields.forEach((field) => {
        let value = row ? row[field.key] : undefined;
        if (field.key === 'fecha_nacimiento' && row && row.fecha_nacimiento) {
            value = String(row.fecha_nacimiento).slice(0, 10);
        }
        if (field.key === 'fecha_nac' && row && row.fecha_nac) {
            value = String(row.fecha_nac).slice(0, 10);
        }
        container.appendChild(createFieldInput(field, value));
    });
}
// Función para recopilar los valores del formulario y construir el payload para la solicitud de CRUD
function collectCrudPayload(sectionId, mode) {
    const fields = getSectionFields(sectionId, mode);
    const payload = {};

    fields.forEach((field) => {
        const input = document.getElementById(`crud_${field.key}`);
        if (!input) {
            return;
        }

        let value;
        if (field.type === 'checkbox') {
            value = input.checked;
        } else if (field.type === 'number') {
            value = input.value === '' ? null : parseInt(input.value, 10);
        } else {
            value = input.value.trim();
        }

        payload[field.key] = value;
    });

    return payload;
}
// Función para enviar la solicitud de CRUD a la API según la sección, el modo, el ID y el payload
async function submitCrud(sectionId, mode, id, payload) {
    if (sectionId === 'inventario' && mode === 'edit') {
        return fetch(window.buildApiUrl('/api/inventario/movimiento'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_inventario: id,
                tipo: payload.tipo,
                cantidad: payload.cantidad,
                personal: payload.personal,
                personal_nombre: payload.personal_nombre
            })
        });
    }

    const config = ADMIN_DATA_CONFIG[sectionId];
    const method = mode === 'edit' ? 'PUT' : 'POST';
    const url = mode === 'edit'
        ? window.buildApiUrl(`${config.endpoint}/${id}`)
        : window.buildApiUrl(config.endpoint);

    return fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}
// Función para manejar el envío del formulario de CRUD, enviar la solicitud y actualizar la tabla
async function handleCrudSubmit(event) {
    event.preventDefault();

    const { sectionId, mode, itemId } = crudState;
    if (!sectionId) {
        return;
    }

    const payload = collectCrudPayload(sectionId, mode);

    try {
        const response = await submitCrud(sectionId, mode, itemId, payload);
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(result.message || result.error || `HTTP ${response.status}`);
        }

        if (typeof showAlert === 'function') {
            showAlert('success', 'Operación realizada correctamente.');
        }

        cerrarCrudAdmin();
        await loadAdminSection(sectionId, true);
    } catch (error) {
        console.error('Error en CRUD admin:', error);
        if (typeof showAlert === 'function') {
            showAlert('danger', `No se pudo guardar: ${error.message}`);
        }
    }
}

window.abrirCrudAdmin = function abrirCrudAdmin(sectionId, id = null) {
    const config = ADMIN_DATA_CONFIG[sectionId];
    if (!config) {
        return;
    }

    const mode = id ? 'edit' : 'create';
    const row = id ? getRowById(sectionId, id) : null;

    crudState = {
        sectionId,
        mode,
        itemId: id
    };

    const title = document.getElementById('crudAdminTitulo');
    if (title) {
        const actionLabel = mode === 'edit' ? 'Editar' : 'Nuevo';
        title.textContent = `${actionLabel} ${sectionId.slice(0, 1).toUpperCase()}${sectionId.slice(1)}`;
    }

    buildCrudForm(sectionId, mode, row);
    openModal('modalCrudAdmin');
};

window.cerrarCrudAdmin = function cerrarCrudAdmin() {
    closeModal('modalCrudAdmin');
    crudState = { sectionId: null, mode: 'create', itemId: null };
};

window.eliminarCrudAdmin = async function eliminarCrudAdmin(sectionId, id) {
    const config = ADMIN_DATA_CONFIG[sectionId];
    if (!config) {
        return;
    }

    if (!confirm('¿Seguro que querés eliminar este registro?')) {
        return;
    }

    try {
        const response = await fetch(window.buildApiUrl(`${config.endpoint}/${id}`), {
            method: 'DELETE'
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(result.message || result.error || `HTTP ${response.status}`);
        }

        if (typeof showAlert === 'function') {
            showAlert('success', 'Registro eliminado.');
        }

        await loadAdminSection(sectionId, true);
    } catch (error) {
        console.error('Error al eliminar:', error);
        if (typeof showAlert === 'function') {
            showAlert('danger', `No se pudo eliminar: ${error.message}`);
        }
    }
};
// Función para cargar todas las secciones de datos de administración al cargar la página
function loadAllAdminData() {
    Object.keys(ADMIN_DATA_CONFIG).forEach((sectionId) => {
        loadAdminSection(sectionId);
    });

    const form = document.getElementById('formCrudAdmin');
    if (form) {
        form.addEventListener('submit', handleCrudSubmit);
    }
}

window.recargarSeccionAdminData = function recargarSeccionAdminData(sectionId) {
    loadAdminSection(sectionId, true);
};

document.addEventListener('DOMContentLoaded', loadAllAdminData);
