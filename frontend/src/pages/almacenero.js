// Funcionalidad específica de la vista de almacenero: movimientos, salidas y reportes.

const ALMACEN_MOVIMIENTOS_API_URL = window.buildApiUrl('/api/almacen/movimientos');
const ALMACEN_REPORTES_API_URL = window.buildApiUrl('/api/reportes/almacen');

async function cargarCatalogosMovimiento() {
    const [personalResponse, proveedoresResponse] = await Promise.all([
        fetch(window.buildApiUrl('/api/personal')),
        fetch(window.buildApiUrl('/api/proveedores')),
    ]);
    const personal = await personalResponse.json();
    const proveedores = await proveedoresResponse.json();
    const personalSelect = document.getElementById('personal_inventario');
    const proveedorSelect = document.getElementById('proveedor_inventario');
    if (personalSelect) {
        personalSelect.innerHTML = '<option value="">Seleccionar personal</option>';
        personal.filter(item => item.activo !== false).forEach(item => {
            personalSelect.innerHTML += `<option value="${item.id}">${item.nombre_completo || `${item.nombre || ''} ${item.apellido || ''}`.trim()}</option>`;
        });
    }
    if (proveedorSelect) {
        proveedorSelect.innerHTML = '<option value="">Seleccionar proveedor</option>';
        proveedores.filter(item => item.activo !== false).forEach(item => {
            proveedorSelect.innerHTML += `<option value="${item.id}">${item.empresa || item.nombre}</option>`;
        });
    }
}
// Función para formatear fechas en formato local
function formatearFecha(valor) {
    if (!valor) return '-';
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return '-';
    return fecha.toLocaleString();
}
// Función para formatear valores monetarios
function formatearMoneda(valor) {
    const numero = Number(valor);
    if (Number.isNaN(numero)) return '0.00';
    return numero.toFixed(2);
}
// Función para actualizar la tabla de movimientos de almacén
function actualizarTablaMovimientosAlmacen(movimientos) {
    const tbody = document.getElementById('tablaMovimientos');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!Array.isArray(movimientos) || movimientos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:#666;">No hay movimientos registrados.</td></tr>';
        return;
    }

    movimientos.forEach((mov) => {
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>${mov.id}</td>
            <td>${mov.producto || '-'}</td>
            <td>${mov.tipo || '-'}</td>
            <td>${mov.cantidad ?? 0}</td>
            <td>${mov.proveedor || '-'}</td>
            <td>${mov.precio_unitario != null ? `$ ${formatearMoneda(mov.precio_unitario)}` : '-'}</td>
            <td>${(mov.gasto_total ?? mov.gasto) != null ? `$ ${formatearMoneda(mov.gasto_total ?? mov.gasto)}` : '-'}</td>
            <td>${mov.vencimiento || '-'}</td>
            <td>${formatearFecha(mov.fecha)}</td>
            <td>${mov.usuario || 'Sin asignar'}</td>
            <td>${mov.motivo || '-'}</td>
        `;
    });
}
// Función para actualizar la tabla de salidas de almacén
function actualizarTablaSalidas(salidas) {
    const tbody = document.getElementById('tablaSalidas');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!Array.isArray(salidas) || salidas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#666;">No hay salidas registradas.</td></tr>';
        return;
    }

    salidas.forEach((salida) => {
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>${salida.id}</td>
            <td>${salida.producto || '-'}</td>
            <td>${salida.cantidad ?? 0}</td>
            <td>${formatearFecha(salida.fecha)}</td>
            <td>${salida.usuario || 'Sin asignar'}</td>
            <td>${salida.motivo || '-'}</td>
        `;
    });
}

// Función para actualizar la tabla de ingresos desde movimientos
function actualizarTablaIngresosDesdeMovimientos(ingresos) {
    const tbody = document.getElementById('tablaIngresos');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!Array.isArray(ingresos) || ingresos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666;">No hay ingresos registrados.</td></tr>';
        return;
    }

    ingresos.forEach((ingreso) => {
        const fila = tbody.insertRow();
        fila.innerHTML = `
            <td>${ingreso.id}</td>
            <td>${ingreso.producto || '-'}</td>
            <td>${ingreso.proveedor || '-'}</td>
            <td>${ingreso.cantidad ?? 0}</td>
            <td>${ingreso.precio_unitario != null ? `$ ${formatearMoneda(ingreso.precio_unitario)}` : '-'}</td>
            <td>${(ingreso.gasto_total ?? ingreso.gasto) != null ? `$ ${formatearMoneda(ingreso.gasto_total ?? ingreso.gasto)}` : '-'}</td>
            <td>${ingreso.vencimiento || '-'}</td>
            <td><span style="color:#666;">Desde movimientos</span></td>
        `;
    });
}

// Función para actualizar el dashboard del almacén
function actualizarDashboardAlmacen(reporte) {
    const cards = document.querySelectorAll('#dashboard-section .stat-card .number');
    if (cards.length < 4) return;

    cards[0].textContent = reporte.totalProductos ?? 0;
    cards[1].textContent = reporte.bajoMinimo ?? 0;
    cards[2].textContent = reporte.movimientosMes ?? 0;
    cards[3].textContent = `$ ${formatearMoneda(reporte.gastoHoy ?? 0)}`;
}
// Función para renderizar la sección de reportes en el dashboard
function renderGridReportes(reporte) {
    const grid = document.getElementById('gridReportes');
    if (!grid) return;

    const topProductos = Array.isArray(reporte.topProductos) ? reporte.topProductos : [];
    const topProductosRows = topProductos.length > 0
        ? topProductos
            .map((item) => `
                <tr>
                    <td>${item.producto || '-'}</td>
                    <td>${item.stock ?? 0}</td>
                    <td>${item.stock_minimo ?? 0}</td>
                </tr>
            `)
            .join('')
        : '<tr><td colspan="3" style="text-align:center;color:#666;">Sin datos de stock crítico.</td></tr>';

    const gastoDiario = Array.isArray(reporte.gastoDiario) ? reporte.gastoDiario : [];
    const maxGasto = gastoDiario.reduce((max, item) => Math.max(max, Number(item.gasto) || 0), 0);
    const barrasGasto = gastoDiario.length > 0
        ? gastoDiario.map((item) => {
            const valor = Number(item.gasto) || 0;
            const altura = maxGasto > 0 ? Math.max(6, Math.round((valor / maxGasto) * 100)) : 6;
            const fecha = new Date(item.fecha);
            const etiqueta = Number.isNaN(fecha.getTime())
                ? String(item.fecha)
                : `${fecha.getDate()}/${fecha.getMonth() + 1}`;
            return `
                <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:28px;">
                    <div title="${etiqueta}: $ ${formatearMoneda(valor)}" style="width:18px;height:${altura}px;background:linear-gradient(180deg,#38b2ac,#2b6cb0);border-radius:4px 4px 0 0;"></div>
                    <span style="font-size:11px;color:#4a5568;">${etiqueta}</span>
                </div>
            `;
        }).join('')
        : '<p style="color:#666;">Sin movimientos de gasto en el período.</p>';

    grid.innerHTML = `
        <div class="dashboard-grid" style="margin-bottom: 16px;">
            <div class="stat-card"><h3>Total Productos</h3><div class="number">${reporte.totalProductos ?? 0}</div></div>
            <div class="stat-card"><h3>Stock Total</h3><div class="number">${reporte.stockTotal ?? 0}</div></div>
            <div class="stat-card"><h3>Ingresos Hoy</h3><div class="number">${reporte.ingresosHoy ?? 0}</div></div>
            <div class="stat-card"><h3>Salidas Hoy</h3><div class="number">${reporte.salidasHoy ?? 0}</div></div>
            <div class="stat-card"><h3>Movimientos Mes</h3><div class="number">${reporte.movimientosMes ?? 0}</div></div>
            <div class="stat-card"><h3>Gasto Hoy</h3><div class="number">$ ${formatearMoneda(reporte.gastoHoy ?? 0)}</div></div>
            <div class="stat-card"><h3>Gasto Mes</h3><div class="number">$ ${formatearMoneda(reporte.gastoMes ?? 0)}</div></div>
            <div class="stat-card"><h3>Valor Stock</h3><div class="number">$ ${formatearMoneda(reporte.valorStock)}</div></div>
        </div>
        <div class="card">
            <div class="card-header"><h3>Productos con stock crítico</h3></div>
            <div class="card-body">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Stock actual</th>
                            <th>Stock mínimo</th>
                        </tr>
                    </thead>
                    <tbody>${topProductosRows}</tbody>
                </table>
            </div>
        </div>
        <div class="card" style="margin-top:16px;">
            <div class="card-header"><h3>Tendencia de gasto diario (mes actual)</h3></div>
            <div class="card-body" style="overflow-x:auto;">
                <div style="display:flex;align-items:flex-end;gap:8px;min-height:140px;padding:8px 0;">
                    ${barrasGasto}
                </div>
            </div>
        </div>
    `;
}
// Función para cargar movimientos y salidas desde la API
async function cargarMovimientosYSalidas() {
    try {
        const response = await fetch(ALMACEN_MOVIMIENTOS_API_URL);
        if (!response.ok) throw new Error('No se pudieron cargar los movimientos de almacén');

        const payload = await response.json();
        const movimientos = Array.isArray(payload.movimientos) ? payload.movimientos : [];
        const ingresos = movimientos.filter((item) => String(item.tipo || '').toUpperCase() === 'INGRESO');
        const salidas = movimientos.filter((item) => String(item.tipo || '').toUpperCase() === 'SALIDA');

        actualizarTablaMovimientosAlmacen(movimientos);
        actualizarTablaIngresosDesdeMovimientos(ingresos);
        actualizarTablaSalidas(salidas);
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') {
            showAlert('danger', error.message || 'Error cargando movimientos y salidas');
        }
    }
}
// Función para cargar reportes de almacén desde la API
async function cargarReportesAlmacen() {
    try {
        const response = await fetch(ALMACEN_REPORTES_API_URL);
        if (!response.ok) throw new Error('No se pudieron cargar los reportes de almacén');

        const reporte = await response.json();
        actualizarDashboardAlmacen(reporte);
        renderGridReportes(reporte);
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') {
            showAlert('danger', error.message || 'Error cargando reportes');
        }
    }
}
// Función para inicializar la vista del almacenero
async function inicializarVistaAlmacenero() {
    await Promise.all([
        cargarCatalogosMovimiento(),
        cargarMovimientosYSalidas(),
        cargarReportesAlmacen()
    ]);
}

document.addEventListener('DOMContentLoaded', inicializarVistaAlmacenero);
