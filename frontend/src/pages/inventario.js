// Gestión de Inventario - Conectado a Base de Datos
let inventario = [];
const INVENTARIO_API_URL = window.buildApiUrl('/api/inventario');
const ORDEN_CATEGORIAS_INVENTARIO = ['verduras', 'frutas', 'carnes', 'pollo', 'aguas'];

// Inicialización
async function inicializarInventario() {
    await cargarInventario();
}

function actualizarSugerenciasInventario() {
    const listaProductos = document.getElementById('listaProductosInventario');
    if (listaProductos) {
        listaProductos.innerHTML = inventario
            .map((item) => `<option value="${item.producto}"></option>`)
            .join('');
    }

    const listaResponsables = document.getElementById('listaResponsablesInventario');
    if (listaResponsables) {
        const responsables = [...new Set(inventario.map((item) => item.personal).filter(Boolean).filter((nombre) => nombre !== 'Sin asignar'))];
        listaResponsables.innerHTML = responsables
            .map((nombre) => `<option value="${nombre}"></option>`)
            .join('');
    }
}

// 2. Obtener Inventario
async function cargarInventario() {
    try {
        const response = await fetch(INVENTARIO_API_URL);
        if (!response.ok) throw new Error('Error al obtener inventario');
        inventario = await response.json();
        actualizarSugerenciasInventario();
        actualizarTablaInventario();
        actualizarAlertas();
    } catch (error) {
        console.error(error);
    }
}

// 3. Procesar MOVIMIENTO (Ingreso/Salida)
async function guardarInventario(event) {
    event.preventDefault();

    const productoIngresado = document.getElementById('producto_inventario').value.trim();
    const categoriaIngresada = document.getElementById('categoria_inventario').value;
    const unidadIngresada = document.getElementById('unidad_inventario').value;
    const loteIngresado = document.getElementById('lote_inventario').value.trim();
    const tipoMovimiento = document.getElementById('tipo_movimiento').value;
    const precioTexto = document.getElementById('precio_inventario').value.trim();
    const precioIngresado = precioTexto === '' ? null : parseFloat(precioTexto);
    const productoExistente = inventario.find((item) =>
        String(item.producto || '').toLowerCase() === productoIngresado.toLowerCase() &&
        String(item.categoria || '').toLowerCase() === String(categoriaIngresada || '').toLowerCase() &&
        String(item.unidad || '').toLowerCase() === String(unidadIngresada || '').toLowerCase() &&
        String(item.lote || '').toLowerCase() === loteIngresado.toLowerCase()
    );
    
    const data = {
        id_inventario: productoExistente ? productoExistente.id : null,
        producto: productoIngresado,
        cantidad: parseFloat(document.getElementById('stock_inventario').value),
        tipo: tipoMovimiento,
        personal_nombre: document.getElementById('personal_inventario').value.trim(),
        personal: document.getElementById('personal_inventario').value,
        id_proveedor: document.getElementById('proveedor_inventario').value || null,
        vencimiento: document.getElementById('vencimiento_inventario').value || null,
        categoria: categoriaIngresada,
        unidad: unidadIngresada,
        lote: loteIngresado,
        precio_unitario: precioIngresado
    };
    
    if (!data.producto || isNaN(data.cantidad) || data.cantidad <= 0) {
        alert('Por favor, completa producto y cantidad correctamente.');
        return;
    }

    if (tipoMovimiento === 'INGRESO') {
        if (data.precio_unitario === null || Number.isNaN(data.precio_unitario) || data.precio_unitario < 0) {
            alert('Por favor, completa un costo unitario válido para el ingreso.');
            return;
        }
    } else if (data.precio_unitario !== null && (Number.isNaN(data.precio_unitario) || data.precio_unitario < 0)) {
        alert('Por favor, completa un costo unitario válido o deja el campo vacío para la salida.');
        return;
    }
    
    try {
        const response = await fetch(window.buildApiUrl('/api/inventario/movimiento'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.message || 'Error al procesar movimiento');
        
        // Uso de tu función showAlert global
        if (typeof showAlert === 'function') {
            const detalleLote = result.lote ? ` | Lote: ${result.lote}` : '';
            const detalleUnidad = result.unidad ? ` ${result.unidad}` : '';
            const detalleGasto = Number(result.gasto_total || 0) > 0
                ? ` | Gasto: $ ${Number(result.gasto_total).toFixed(2)}`
                : '';
            showAlert('success', `Movimiento procesado correctamente. Nuevo stock: ${result.nuevoStock}${detalleUnidad}${detalleLote}${detalleGasto}`);
        } else {
            alert('Movimiento procesado correctamente');
        }
        
        closeModal('modalInventario');
        limpiarFormularioInventario();
        cargarInventario();
    } catch (error) {
        if (typeof showAlert === 'function') {
            showAlert('error', error.message);
        } else {
            alert('Error: ' + error.message);
        }
    }
}

//4 
async function eliminarInventario(id) {
    if (!confirm('¿Estás seguro de eliminar este registro de inventario?')) {
        return;
    }

    await fetch(window.buildApiUrl(`/api/inventario/${id}`), { method: 'DELETE' });
    cargarInventario();
}

async function editarInventario(id) {
    const item = inventario.find((registro) => Number(registro.id) === Number(id));
    if (!item) {
        alert('No se encontró el registro a editar.');
        return;
    }

    const producto = prompt('Producto:', item.producto || '');
    if (producto === null) return;

    const categoria = prompt('Categoría (verduras, frutas, carnes, pollo, aguas):', item.categoria || 'verduras');
    if (categoria === null) return;

    const unidad = prompt('Unidad (kilogramos, litros, docenas, unidad):', item.unidad || 'unidad');
    if (unidad === null) return;

    const lote = prompt('Lote:', item.lote === '-' ? '' : (item.lote || ''));
    if (lote === null) return;

    const stockTexto = prompt('Stock actual:', String(item.stock ?? 0));
    if (stockTexto === null) return;
    const stock = parseInt(stockTexto, 10);
    if (Number.isNaN(stock) || stock < 0) {
        alert('Stock inválido.');
        return;
    }

    const precioTexto = prompt('Precio unitario ($):', String(item.precio_unitario ?? 0));
    if (precioTexto === null) return;
    const precio_unitario = parseFloat(precioTexto);
    if (Number.isNaN(precio_unitario) || precio_unitario < 0) {
        alert('Precio unitario inválido.');
        return;
    }

    const proveedor_id = prompt('ID del proveedor (opcional):', String(item.proveedor_id ?? ''));
    if (proveedor_id === null) return;
    const vencimiento = prompt('Vencimiento (AAAA-MM-DD):', item.vencimiento || '');
    if (vencimiento === null) return;

    try {
        const response = await fetch(window.buildApiUrl(`/api/inventario/${id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                producto: producto.trim(),
                categoria: String(categoria).trim().toLowerCase(),
                unidad: String(unidad).trim().toLowerCase(),
                lote: String(lote).trim(),
                stock,
                precio_unitario,
                proveedor_id: proveedor_id.trim() || null,
                vencimiento: vencimiento.trim() || null,
            }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || result.error || 'No se pudo editar el inventario');
        }

        if (typeof showAlert === 'function') {
            showAlert('success', 'Inventario actualizado correctamente.');
        }
        await cargarInventario();
    } catch (error) {
        if (typeof showAlert === 'function') {
            showAlert('error', error.message || 'Error al editar inventario');
        } else {
            alert(error.message || 'Error al editar inventario');
        }
    }
}

// 5. Actualizar Tabla
function actualizarTablaInventario() {
    const tbody = document.getElementById('tablaInventario');
    if (!tbody) return;
    tbody.innerHTML = '';

    const inventarioOrdenado = [...inventario].sort((a, b) => {
        const indiceA = ORDEN_CATEGORIAS_INVENTARIO.indexOf(String(a.categoria || '').toLowerCase());
        const indiceB = ORDEN_CATEGORIAS_INVENTARIO.indexOf(String(b.categoria || '').toLowerCase());
        const ordenA = indiceA === -1 ? ORDEN_CATEGORIAS_INVENTARIO.length : indiceA;
        const ordenB = indiceB === -1 ? ORDEN_CATEGORIAS_INVENTARIO.length : indiceB;
        if (ordenA !== ordenB) return ordenA - ordenB;
        return String(a.producto || '').localeCompare(String(b.producto || ''), 'es', { sensitivity: 'base' });
    });

    let categoriaActual = null;
    inventarioOrdenado.forEach(item => {
        const categoriaItem = String(item.categoria || 'sin categoria').toLowerCase();

        if (categoriaActual !== categoriaItem) {
            categoriaActual = categoriaItem;
            const categoriaRow = tbody.insertRow();
            categoriaRow.innerHTML = `<td colspan="12" style="background:#edf2f7;font-weight:700;text-transform:capitalize;">${categoriaItem}</td>`;
        }

        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.producto}</td>
            <td style="text-transform:capitalize;">${item.categoria || '-'}</td>
            <td style="text-transform:capitalize;">${item.unidad || 'unidad'}</td>
            <td>${item.lote || '-'}</td>
            <td>${item.stock}</td>
            <td>$ ${Number(item.precio_unitario || 0).toFixed(2)}</td>
            <td>$ ${Number(item.gasto_total || (Number(item.stock || 0) * Number(item.precio_unitario || 0))).toFixed(2)}</td>
            <td>${item.proveedor || '-'}</td>
            <td>${item.vencimiento || '-'}</td>
            <td>${item.personal}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="openModal('modalInventario'); document.getElementById('producto_inventario').value='${item.producto.replace(/'/g, "&#39;")}'; document.getElementById('categoria_inventario').value='${String(item.categoria || 'verduras').replace(/'/g, "&#39;")}'; document.getElementById('unidad_inventario').value='${String(item.unidad || 'unidad').replace(/'/g, "&#39;")}'; document.getElementById('lote_inventario').value='${String(item.lote || '').replace(/'/g, "&#39;")}'; document.getElementById('precio_inventario').value='${Number(item.precio_unitario || 0).toFixed(2)}';">Movimiento</button>
                <button class="btn btn-primary btn-small" onclick="editarInventario(${item.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="eliminarInventario(${item.id})">Eliminar</button>
            </td>
        `;
    });
}


// 6. Alertas
function actualizarAlertas() {
    const contenedor = document.getElementById('contenedorAlertas');
    if (!contenedor) return;
    contenedor.innerHTML = '';
    
    const criticos = inventario.filter(i => i.stock < 10);
    if (criticos.length === 0) {
        contenedor.innerHTML = '<p style="color:green;">✅ Todo el inventario está en niveles óptimos.</p>';
        return;
    }
    
    criticos.forEach(c => {
        contenedor.innerHTML += `
            <div style="background: #fed7d7; color: #742a2a; padding: 10px; margin-bottom: 5px; border-radius: 5px;">
                ⚠️ ¡Stock bajo en <strong>${c.producto}</strong> (${c.categoria || '-'} / lote ${c.lote || '-'})! (Quedan: ${c.stock} ${c.unidad || 'unidad'})
            </div>
        `;
    });
}

function limpiarFormularioInventario() {
    document.getElementById('formInventario').reset();
}

document.addEventListener('DOMContentLoaded', inicializarInventario);