// Gestión de Ingresos de Almacén - Conectado a Base de Datos
let ingresos = [];
const INGRESOS_API_URL = window.buildApiUrl('/api/ingresos');

// Inicialización: Carga selects y luego la tabla
async function inicializarIngresos() {
    await Promise.all([cargarSelects(), cargarIngresos()]);
}

// 1. Cargar Productos y Proveedores para los <select>
async function cargarSelects() {
    try {
        const [resProductos, resProveedores] = await Promise.all([
            fetch(window.buildApiUrl('/api/productos')),
            fetch(window.buildApiUrl('/api/proveedores'))
        ]);
        
        const productos = await resProductos.json();
        const proveedores = await resProveedores.json();
        
        const selProducto = document.getElementById('producto_ingreso');
        const selProveedor = document.getElementById('proveedor_ingreso');

        if (!selProducto || !selProveedor) {
            return;
        }
        
        selProducto.innerHTML = '<option value="">Seleccionar producto</option>';
        productos.forEach(p => selProducto.innerHTML += `<option value="${p.id}">${p.nombre}</option>`);
        
        selProveedor.innerHTML = '<option value="">Seleccionar proveedor</option>';
        proveedores.forEach(prov => selProveedor.innerHTML += `<option value="${prov.id}">${prov.nombre}</option>`);
    } catch (error) {
        console.error('Error cargando catálogos:', error);
    }
}

// 2. Obtener Ingresos desde el Backend
async function cargarIngresos() {
    try {
        const response = await fetch(INGRESOS_API_URL);
        if (!response.ok) throw new Error('Error al cargar ingresos');
        ingresos = await response.json();
        actualizarTablaIngresos();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') showAlert('error', 'No se pudieron cargar los ingresos');
    }
}

// 3. Guardar/Actualizar Ingreso
async function guardarIngreso(event) {
    event.preventDefault();

    const productoIngreso = document.getElementById('producto_ingreso');
    const proveedorIngreso = document.getElementById('proveedor_ingreso');
    const cantidadIngreso = document.getElementById('cantidad_ingreso');
    const precioUnitarioIngreso = document.getElementById('precio_unitario_ingreso');
    const monedaIngreso = document.getElementById('moneda_ingreso');
    const comprobanteIngreso = document.getElementById('comprobante_ingreso');

    if (!productoIngreso || !proveedorIngreso || !cantidadIngreso || !precioUnitarioIngreso || !monedaIngreso) {
        if (typeof showAlert === 'function') showAlert('danger', 'Faltan campos del formulario de ingresos en la vista actual');
        return;
    }
    
    const idIngreso = document.getElementById('id_ingreso')?.value;
    const archivo = comprobanteIngreso?.files?.[0];
    if (archivo && archivo.size > 5 * 1024 * 1024) {
        showAlert('error', 'El comprobante no puede superar los 5 MB');
        return;
    }
    const ingresoActual = ingresos.find(ingreso => String(ingreso.id) === String(idIngreso));
    const comprobante = archivo ? await leerComprobante(archivo) : (ingresoActual?.comprobante || null);
    const data = {
        id_producto: productoIngreso.value,
        id_proveedor: proveedorIngreso.value,
        cantidad: parseFloat(cantidadIngreso.value),
        precio_unitario: parseFloat(precioUnitarioIngreso.value),
        moneda: monedaIngreso.value,
        fecha_vencimiento: document.getElementById('fecha_vencimiento_ingreso').value || null,
        comprobante
    };
    
    try {
        const method = idIngreso ? 'PUT' : 'POST';
        const url = idIngreso ? `${INGRESOS_API_URL}/${idIngreso}` : INGRESOS_API_URL;
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Error al guardar');
        
        showAlert('success', 'Ingreso registrado correctamente');
        closeModal('modalIngreso');
        limpiarFormularioIngreso();
        cargarIngresos();
    } catch (error) {
        showAlert('error', 'Error al procesar el ingreso');
    }
}

function leerComprobante(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve({ nombre: archivo.name, tipo: archivo.type, datos: lector.result });
        lector.onerror = reject;
        lector.readAsDataURL(archivo);
    });
}

// 4. Editar (Rellena el formulario)
function editIngreso(id) {
    const i = ingresos.find(ing => String(ing.id) === String(id));
    if (i) {
        document.getElementById('id_ingreso').value = i.id;
        document.getElementById('producto_ingreso').value = i.id_producto;
        document.getElementById('proveedor_ingreso').value = i.id_proveedor;
        document.getElementById('cantidad_ingreso').value = i.cantidad;
        document.getElementById('precio_unitario_ingreso').value = i.precio_unitario;
        document.getElementById('moneda_ingreso').value = i.moneda;
        document.getElementById('fecha_vencimiento_ingreso').value = i.fecha_vencimiento || '';
        actualizarTotalIngreso();
        
        document.getElementById('tituloModalIngreso').textContent = 'Editar Ingreso';
        openModal('modalIngreso');
    }
}

// 5. Eliminar
async function deleteIngreso(id) {
    if (confirm('¿Eliminar este registro de ingreso?')) {
        await fetch(`${INGRESOS_API_URL}/${id}`, { method: 'DELETE' });
        cargarIngresos();
    }
}

// 6. Actualizar Tabla
function actualizarTablaIngresos() {
    const tbody = document.getElementById('tablaIngresos');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    ingresos.forEach(i => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${i.id}</td>
            <td>${i.producto_nombre}</td>
            <td>${i.proveedor_nombre}</td>
            <td>${i.cantidad}</td>
            <td>${Number(i.precio_unitario).toFixed(2)}</td>
            <td>${Number(i.subtotal || (i.cantidad * i.precio_unitario)).toFixed(2)}</td>
            <td>${i.moneda}</td>
            <td>${i.fecha_vencimiento || '-'}</td>
            <td>${i.comprobante ? `<a class="btn btn-secondary btn-small" href="${i.comprobante.datos}" download="${i.comprobante.nombre}">Ver</a>` : '-'}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editIngreso(${i.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteIngreso(${i.id})">Eliminar</button>
            </td>
        `;
    });
}

function limpiarFormularioIngreso() {
    const form = document.getElementById('formIngreso');
    const idIngreso = document.getElementById('id_ingreso');
    const titulo = document.getElementById('tituloModalIngreso');
    const total = document.getElementById('total_ingreso');

    if (form) form.reset();
    if (idIngreso) idIngreso.value = '';
    if (titulo) titulo.textContent = 'Nuevo Ingreso';
    if (total) total.value = '$ 0,00';
}

function actualizarTotalIngreso() {
    const cantidad = Number(document.getElementById('cantidad_ingreso')?.value || 0);
    const precio = Number(document.getElementById('precio_unitario_ingreso')?.value || 0);
    const total = document.getElementById('total_ingreso');
    if (total) total.value = `$ ${(cantidad * precio).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

document.getElementById('cantidad_ingreso')?.addEventListener('input', actualizarTotalIngreso);
document.getElementById('precio_unitario_ingreso')?.addEventListener('input', actualizarTotalIngreso);

document.addEventListener('DOMContentLoaded', inicializarIngresos);