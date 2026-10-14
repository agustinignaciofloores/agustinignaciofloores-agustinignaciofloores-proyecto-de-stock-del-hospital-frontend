// Gestión de Productos (Se cargará dinámicamente desde la base de datos)
let productos = [];
const API_URL = window.buildApiUrl('/api/productos');

// Función para obtener todos los productos de la base de datos
async function cargarProductos() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Error al obtener los productos');
        productos = await response.json();
        actualizarTablaProductos();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') {
            showAlert('error', 'No se pudieron cargar los productos desde la base de datos');
        } else {
            alert('No se pudieron cargar los productos desde la base de datos');
        }
    }
}

// Guardar o Actualizar un Producto en la base de datos
async function guardarProducto(event) {
    event.preventDefault();
    
    const idProducto = document.getElementById('id_producto')?.value; // Para identificar si es edición
    const nombre_producto = document.getElementById('nombre_producto').value;
    const categoria_producto = document.getElementById('categoria_producto').value;
    const unidad_medida = document.getElementById('unidad_medida').value;
    const stock_minimo = parseFloat(document.getElementById('stock_minimo').value) || 0;
    const stock_actual = parseFloat(document.getElementById('stock_actual').value) || 0;
    
    if (!nombre_producto || !unidad_medida) {
        if (typeof showAlert === 'function') {
            showAlert('error', 'Por favor completa los campos requeridos');
        } else {
            alert('Por favor completa los campos requeridos');
        }
        return;
    }
    
    // Objeto estructurado para enviar al backend (Mapea con tu base de datos)
    const dataProducto = {
        nombre: nombre_producto,
        categoria: categoria_producto,
        unidad: unidad_medida,
        stock_minimo,
        stock_actual
    };
    
    try {
        let response;
        if (idProducto) {
            // Modo Edición (PUT)
            response = await fetch(`${API_URL}/${idProducto}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataProducto)
            });
        } else {
            // Modo Nuevo Registro (POST)
            response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataProducto)
            });
        }
        
        if (!response.ok) throw new Error('Error al guardar el producto');
        
        if (typeof showAlert === 'function') {
            showAlert('success', idProducto ? 'Producto actualizado correctamente' : 'Producto guardado correctamente');
        } else {
            alert(idProducto ? 'Producto actualizado correctamente' : 'Producto guardado correctamente');
        }
        
        closeModal('modalProducto');
        limpiarFormularioProducto(); // ⚡ RECOMENDACIÓN APLICADA: Limpieza segura y reseteo de estados
        
        cargarProductos(); // Recargar datos frescos desde la base de datos
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') {
            showAlert('error', 'Hubo un problema al guardar el producto en el servidor');
        } else {
            alert('Hubo un problema al guardar el producto en el servidor');
        }
    }
}

// Preparar el modal para editar un Producto
function editProducto(id) {
    // Buscamos coincidencia exacta transformando a String por si los IDs de la BD vienen numéricos
    const producto = productos.find(p => String(p.id) === String(id));
    if (producto) {
        if (document.getElementById('id_producto')) {
            document.getElementById('id_producto').value = producto.id;
        }
        document.getElementById('nombre_producto').value = producto.nombre || '';
        document.getElementById('categoria_producto').value = producto.categoria || '';
        document.getElementById('unidad_medida').value = producto.unidad || '';
        document.getElementById('stock_minimo').value = producto.stock_minimo ?? 0;
        document.getElementById('stock_actual').value = producto.stock_actual ?? 0;
        
        if (document.getElementById('tituloModalProducto')) {
            document.getElementById('tituloModalProducto').textContent = 'Editar Producto';
        }
        openModal('modalProducto');
    }
}

// Eliminar un Producto de la base de datos
async function deleteProducto(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Error al eliminar el producto');
            
            if (typeof showAlert === 'function') {
                showAlert('success', 'Producto eliminado correctamente');
            } else {
                alert('Producto eliminado correctamente');
            }
            cargarProductos(); // Recargar la lista desde la base de datos
        } catch (error) {
            console.error(error);
            if (typeof showAlert === 'function') {
                showAlert('error', 'No se pudo eliminar el producto en el servidor');
            } else {
                alert('No se pudo eliminar el producto en el servidor');
            }
        }
    }
}

// Renderizar las filas dinámicas en el elemento tbody
function actualizarTablaProductos() {
    const tbody = document.getElementById('tablaProductos');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Control por si la base de datos está vacía
    if (productos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #888;">No hay productos registrados en la base de datos.</td></tr>`;
        return;
    }
    
    productos.forEach(producto => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${producto.id}</td>
            <td><strong>${producto.nombre}</strong></td>
            <td>${producto.categoria || '-'}</td>
            <td><span class="badge-unidad">${producto.unidad}</span></td>
            <td>${producto.stock_minimo}</td>
            <td>${producto.stock_actual}</td>
            <td class="table-actions">
                <button class="btn btn-secondary btn-small" onclick="editProducto(${producto.id})">Editar</button>
                <button class="btn btn-danger btn-small" onclick="deleteProducto(${producto.id})">Eliminar</button>
            </td>
        `;
    });
}

// ⚡ RECOMENDACIÓN APLICADA: Función auxiliar para limpiar el formulario por completo
function limpiarFormularioProducto() {
    const form = document.getElementById('formProducto');
    if (form) form.reset();
    
    // Limpiamos explícitamente el ID oculto para que no se arrastre a un nuevo registro
    if (document.getElementById('id_producto')) {
        document.getElementById('id_producto').value = '';
    }
    // Devolvemos el título original al modal
    if (document.getElementById('tituloModalProducto')) {
        document.getElementById('tituloModalProducto').textContent = 'Nuevo Producto';
    }
}

// Inicializar la carga al montar el DOM
document.addEventListener('DOMContentLoaded', cargarProductos);
console.log('Módulo Productos conectado a la base de datos');