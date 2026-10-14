module.exports = function registerAlmacenRoutes(
    app,
    {
        pool,
        models,
        getProductosIdColumn,
        getProveedoresIdColumn,
        getIngresosIdColumn,
        getMovimientosInventarioIdColumn,
    }
) {
    const { Producto, Proveedor, IngresoAlmacen, DetalleIngresoAlmacen } = models;
    function buildIngresoObservaciones(moneda, fechaVencimiento, comprobante) {
        return JSON.stringify({
            moneda: moneda || 'ARS',
            fecha_vencimiento: fechaVencimiento || null,
            comprobante: comprobante || null,
        });
    }

    function parseIngresoObservaciones(observaciones) {
        if (!observaciones) {
            return { moneda: 'ARS', fecha_vencimiento: null, comprobante: null };
        }

        try {
            const parsed = JSON.parse(observaciones);
            return {
                moneda: parsed.moneda || 'ARS',
                fecha_vencimiento: parsed.fecha_vencimiento || null,
                comprobante: parsed.comprobante || null,
            };
        } catch (err) {
            return { moneda: 'ARS', fecha_vencimiento: null, comprobante: null };
        }
    }

    function normalizarCategoriaInventario(categoria) {
        const valor = String(categoria || '').trim().toLowerCase();

        if (['verdura', 'verduras'].includes(valor)) return 'verdura';
        if (['fruta', 'frutas'].includes(valor)) return 'fruta';

        if (['lacteos', 'lácteos', 'carne', 'carnes', 'pollo', 'agua', 'aguas'].includes(valor)) return 'lacteos';

        return 'verdura';
    }

    function normalizarCategoriaVisualInventario(categoria) {
        const valor = String(categoria || '').trim().toLowerCase();
        const permitidas = ['verduras', 'frutas', 'carnes', 'pollo', 'aguas'];
        return permitidas.includes(valor) ? valor : 'verduras';
    }

    function categoriaInventarioParaVista(categoria) {
        const valor = String(categoria || '').trim().toLowerCase();
        if (valor === 'verdura') return 'verduras';
        if (valor === 'fruta') return 'frutas';
        if (valor === 'lacteos') return 'carnes';
        return valor || 'verduras';
    }

    //  MÓDULO INVENTARIO (CRUD COMPLETO + MOVIMIENTOS)
    app.get('/api/inventario', async (req, res) => {
        try {
            const productosIdColumn = await getProductosIdColumn();
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const result = await pool.query(`
                SELECT
                    p.${productosIdColumn} AS id,
                    p.nombre AS producto,
                    COALESCE(p.categoria, 'verdura') AS categoria,
                    COALESCE(NULLIF(TRIM(p.descripcion), ''), p.categoria, 'verdura') AS categoria_visual,
                    COALESCE(p.unidad_medida, 'unidad') AS unidad,
                    COALESCE(p.lote, '-') AS lote,
                    COALESCE(p.precio_unitario, 0)::numeric(12,2) AS precio_unitario,
                    p.proveedor_id,
                    p.vencimiento,
                    pr.nombre AS proveedor,
                    mov.precio_unitario AS movimiento_precio_unitario,
                    mov.gasto_total,
                    p.stock_actual AS stock,
                    COALESCE(mov.created_at, p.updated_at, p.created_at) AS fecha,
                    COALESCE(NULLIF(TRIM(CONCAT(pe.nombre, ' ', pe.apellido)), ''), 'Sin asignar') AS personal
                FROM productos p
                LEFT JOIN LATERAL (
                    SELECT usuario_id, created_at, precio_unitario, gasto_total
                    FROM movimientos_inventario
                    WHERE producto_id = p.${productosIdColumn}
                    ORDER BY created_at DESC
                    LIMIT 1
                ) mov ON TRUE
                LEFT JOIN usuarios u ON u.id_usuario = mov.usuario_id
                LEFT JOIN personas pe ON pe.id_persona = u.id_persona
                LEFT JOIN proveedores pr ON pr.${proveedoresIdColumn} = p.proveedor_id
                ORDER BY p.${productosIdColumn} DESC
            `);
            res.json(result.rows.map((item) => ({
                ...item,
                categoria: normalizarCategoriaVisualInventario(
                    item.categoria_visual || categoriaInventarioParaVista(item.categoria)
                ),
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/inventario', async (req, res) => {
        const { producto, stock, personal, categoria, unidad, lote, precio_unitario } = req.body;
        try {
            const productosIdColumn = await getProductosIdColumn();
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const categoriaVisualFinal = normalizarCategoriaVisualInventario(categoria);
            const categoriaFinal = normalizarCategoriaInventario(categoria);
            const precioUnitario = Number.parseFloat(precio_unitario);
            const precioUnitarioFinal = Number.isFinite(precioUnitario) && precioUnitario >= 0 ? precioUnitario : 0;
            const stockInicial = parseInt(stock) || 0;
            const gastoTotal = Number((stockInicial * precioUnitarioFinal).toFixed(2));
            const unidadesPermitidas = ['kilogramos', 'litros', 'docenas', 'unidad'];
            const unidadNormalizada = String(unidad || '').trim().toLowerCase();
            const unidadFinal = unidadesPermitidas.includes(unidadNormalizada)
                ? unidadNormalizada
                : 'unidad';
            const loteFinal = String(lote || '').trim() || null;

            const result = await pool.query(
                `INSERT INTO productos (nombre, categoria, descripcion, unidad_medida, lote, precio_unitario, stock_minimo, stock_actual)
                 VALUES ($1, $2, $3, $4, $5, $6, 0, $7)
                 RETURNING ${productosIdColumn} AS id`,
                [producto, categoriaFinal, categoriaVisualFinal, unidadFinal, loteFinal, precioUnitarioFinal, stockInicial]
            );

            if (personal) {
                await pool.query(
                    `INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad, usuario_id, motivo, referencia)
                     VALUES ($1, 'entrada', $2, $3, $4, $5)`,
                    [
                        result.rows[0].id,
                        stockInicial,
                        parseInt(personal),
                        loteFinal
                            ? `Alta inicial de inventario - Lote ${loteFinal}`
                            : 'Alta inicial de inventario',
                        `GASTO:${gastoTotal.toFixed(2)}`,
                    ]
                );
            }

            res.json({ success: true, id: result.rows[0].id, gasto_total: gastoTotal });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.post('/api/inventario/movimiento', async (req, res) => {
        const { id_inventario, producto, cantidad, tipo, personal, personal_nombre, categoria, unidad, lote, precio_unitario, id_proveedor, vencimiento } = req.body;
        try {
            const productosIdColumn = await getProductosIdColumn();
            const cantidadInt = parseInt(cantidad);
            const esIngreso = String(tipo).toUpperCase() === 'INGRESO';
            const precioUnitario = Number.parseFloat(precio_unitario);
            const precioUnitarioFinal = Number.isFinite(precioUnitario) && precioUnitario >= 0 ? precioUnitario : null;
            const gastoTotal = esIngreso && precioUnitarioFinal !== null
                ? Number((cantidadInt * precioUnitarioFinal).toFixed(2))
                : 0;
            const productoNombre = String(producto || '').trim();
            const categoriaFinal = normalizarCategoriaInventario(categoria);
            const categoriaVisualFinal = normalizarCategoriaVisualInventario(categoria);
            const unidadesPermitidas = ['kilogramos', 'litros', 'docenas', 'unidad'];
            const unidadFinal = unidadesPermitidas.includes(String(unidad || '').trim().toLowerCase())
                ? String(unidad).trim().toLowerCase()
                : 'unidad';
            const loteFinal = String(lote || '').trim() || null;
            const proveedorId = Number.parseInt(id_proveedor, 10) || null;
            let productoId = Number.isInteger(parseInt(id_inventario)) ? parseInt(id_inventario) : null;

            if (!cantidadInt || cantidadInt <= 0) {
                return res.status(400).json({ success: false, message: 'La cantidad debe ser mayor a cero' });
            }

            if (!productoId && !productoNombre) {
                return res.status(400).json({ success: false, message: 'Ingresá un producto para registrar el movimiento' });
            }

            if (!productoId && productoNombre) {
                let productoResult;

                if (loteFinal) {
                    productoResult = await pool.query(
                        `SELECT ${productosIdColumn} AS id, stock_actual
                         FROM productos
                         WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
                           AND LOWER(TRIM(COALESCE(NULLIF(descripcion, ''), categoria, ''))) = LOWER(TRIM($2))
                           AND LOWER(TRIM(COALESCE(unidad_medida, ''))) = LOWER(TRIM($3))
                           AND LOWER(TRIM(COALESCE(lote, ''))) = LOWER(TRIM($4))
                         LIMIT 1`,
                        [productoNombre, categoriaVisualFinal, unidadFinal, loteFinal]
                    );
                } else {
                    productoResult = await pool.query(
                        `SELECT ${productosIdColumn} AS id, stock_actual
                         FROM productos
                         WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1))
                           AND LOWER(TRIM(COALESCE(NULLIF(descripcion, ''), categoria, ''))) = LOWER(TRIM($2))
                           AND LOWER(TRIM(COALESCE(unidad_medida, ''))) = LOWER(TRIM($3))
                         ORDER BY COALESCE(updated_at, created_at) DESC
                         LIMIT 1`,
                        [productoNombre, categoriaVisualFinal, unidadFinal]
                    );
                }

                if (productoResult.rows.length > 0) {
                    productoId = productoResult.rows[0].id;
                } else if (esIngreso) {
                    const nuevoProducto = await pool.query(
                        `INSERT INTO productos (nombre, categoria, descripcion, unidad_medida, lote, precio_unitario, stock_minimo, stock_actual)
                         VALUES ($1, $2, $3, $4, $5, $6, 0, 0)
                         RETURNING ${productosIdColumn} AS id`,
                        [productoNombre, categoriaFinal, categoriaVisualFinal, unidadFinal, loteFinal, precioUnitarioFinal || 0]
                    );
                    productoId = nuevoProducto.rows[0].id;
                } else {
                    return res.status(404).json({ success: false, message: 'Producto no encontrado para registrar la salida' });
                }
            }

            const stockResult = await pool.query(
                `SELECT nombre, categoria, descripcion, unidad_medida, lote, stock_actual
                 FROM productos
                 WHERE ${productosIdColumn} = $1`,
                [productoId]
            );

            if (stockResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            const stockActual = parseInt(stockResult.rows[0].stock_actual) || 0;
            const nuevoStock = esIngreso ? stockActual + cantidadInt : stockActual - cantidadInt;

            if (nuevoStock < 0) {
                return res.status(400).json({ success: false, message: 'No hay stock suficiente para la salida solicitada' });
            }

            const result = await pool.query(
                `UPDATE productos
                 SET stock_actual = $1,
                     precio_unitario = COALESCE($2, precio_unitario),
                     proveedor_id = COALESCE($3, proveedor_id),
                     vencimiento = COALESCE($4, vencimiento),
                     updated_at = CURRENT_TIMESTAMP
                 WHERE ${productosIdColumn} = $5
                 RETURNING stock_actual AS stock`,
                [nuevoStock, esIngreso ? precioUnitarioFinal : null, proveedorId, vencimiento || null, productoId]
            );

            const referenciaMovimiento = gastoTotal > 0 ? `GASTO:${gastoTotal.toFixed(2)}` : null;

            await pool.query(
                `INSERT INTO movimientos_inventario (producto_id, tipo_movimiento, cantidad, usuario_id, proveedor_id, motivo, referencia, precio_unitario, gasto_total, vencimiento)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    productoId,
                    esIngreso ? 'entrada' : 'salida',
                    cantidadInt,
                    personal ? parseInt(personal) : null,
                    proveedorId,
                    personal_nombre
                        ? `Movimiento desde inventario (${tipo}) - Responsable: ${personal_nombre}${loteFinal ? ` - Lote ${loteFinal}` : ''}`
                        : `Movimiento desde inventario (${tipo})${loteFinal ? ` - Lote ${loteFinal}` : ''}`,
                    referenciaMovimiento,
                    precioUnitarioFinal,
                    gastoTotal,
                    vencimiento || null,
                ]
            );

            if (result.rows.length > 0) {
                res.json({
                    success: true,
                    nuevoStock: result.rows[0].stock,
                    lote: stockResult.rows[0]?.lote || loteFinal,
                    categoria: normalizarCategoriaVisualInventario(
                        stockResult.rows[0]?.descripcion || categoriaInventarioParaVista(stockResult.rows[0]?.categoria || categoriaFinal)
                    ),
                    unidad: stockResult.rows[0]?.unidad_medida || unidadFinal,
                    gasto_total: gastoTotal,
                    precio_unitario: precioUnitarioFinal,
                });
            } else {
                res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/inventario/:id', async (req, res) => {
        try {
            const productosIdColumn = await getProductosIdColumn();
            const result = await pool.query(
                `DELETE FROM productos WHERE ${productosIdColumn} = $1 RETURNING ${productosIdColumn} AS id`,
                [parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            res.json({ success: true, message: 'Registro eliminado' });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/inventario/:id', async (req, res) => {
        const { producto, categoria, unidad, lote, stock, precio_unitario, proveedor_id, vencimiento } = req.body;

        try {
            const productosIdColumn = await getProductosIdColumn();
            const categoriaFinal = normalizarCategoriaInventario(categoria);
            const categoriaVisualFinal = normalizarCategoriaVisualInventario(categoria);
            const unidadesPermitidas = ['kilogramos', 'litros', 'docenas', 'unidad'];
            const unidadNormalizada = String(unidad || '').trim().toLowerCase();
            const unidadFinal = unidadesPermitidas.includes(unidadNormalizada) ? unidadNormalizada : 'unidad';
            const loteFinal = String(lote || '').trim() || null;
            const stockFinal = parseInt(stock);
            const precioUnitario = Number.parseFloat(precio_unitario);
            const precioUnitarioFinal = Number.isFinite(precioUnitario) && precioUnitario >= 0 ? precioUnitario : 0;

            if (!String(producto || '').trim()) {
                return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio' });
            }

            if (!Number.isInteger(stockFinal) || stockFinal < 0) {
                return res.status(400).json({ success: false, message: 'El stock debe ser un entero mayor o igual a cero' });
            }

            const result = await pool.query(
                `UPDATE productos
                 SET nombre = $1,
                     categoria = $2,
                     descripcion = $3,
                     unidad_medida = $4,
                     lote = $5,
                     stock_actual = $6,
                     precio_unitario = $7,
                     proveedor_id = $8,
                     vencimiento = $9,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE ${productosIdColumn} = $10
                 RETURNING ${productosIdColumn} AS id`,
                [
                    String(producto).trim(),
                    categoriaFinal,
                    categoriaVisualFinal,
                    unidadFinal,
                    loteFinal,
                    stockFinal,
                    precioUnitarioFinal,
                    Number.parseInt(proveedor_id) || null,
                    vencimiento || null,
                    parseInt(req.params.id),
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            }

            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get('/api/almacen/movimientos', async (req, res) => {
        try {
            const productosIdColumn = await getProductosIdColumn();
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const movimientosInventarioIdColumn = await getMovimientosInventarioIdColumn();
            const result = await pool.query(`
                SELECT
                    m.${movimientosInventarioIdColumn} AS id,
                    p.nombre AS producto,
                    UPPER(
                        CASE
                            WHEN m.tipo_movimiento = 'entrada' THEN 'INGRESO'
                            WHEN m.tipo_movimiento = 'salida' THEN 'SALIDA'
                            ELSE COALESCE(m.tipo_movimiento, 'AJUSTE')
                        END
                    ) AS tipo,
                    m.cantidad,
                    m.proveedor_id,
                    pr.nombre AS proveedor,
                    m.precio_unitario,
                    m.gasto_total,
                    m.vencimiento,
                    m.created_at AS fecha,
                    COALESCE(NULLIF(TRIM(CONCAT(pe.nombre, ' ', pe.apellido)), ''), 'Sin asignar') AS usuario,
                    COALESCE(m.motivo, '-') AS motivo,
                    CASE
                        WHEN COALESCE(m.referencia, '') LIKE 'GASTO:%'
                        THEN NULLIF(REPLACE(m.referencia, 'GASTO:', ''), '')::numeric(12,2)
                        ELSE NULL
                    END AS gasto
                FROM movimientos_inventario m
                LEFT JOIN productos p ON p.${productosIdColumn} = m.producto_id
                LEFT JOIN proveedores pr ON pr.${proveedoresIdColumn} = m.proveedor_id
                LEFT JOIN usuarios u ON u.id_usuario = m.usuario_id
                LEFT JOIN personas pe ON pe.id_persona = u.id_persona
                ORDER BY m.created_at DESC, m.${movimientosInventarioIdColumn} DESC
            `);

            res.json({ success: true, movimientos: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get('/api/reportes/almacen', async (req, res) => {
        try {
            const resumenResult = await pool.query(`
                SELECT
                    COUNT(*)::int AS total_productos,
                    COALESCE(SUM(stock_actual), 0)::int AS stock_total,
                    COUNT(*) FILTER (WHERE stock_actual <= COALESCE(stock_minimo, 0))::int AS bajo_minimo,
                    COALESCE(SUM(stock_actual * COALESCE(precio_unitario, 0)), 0)::numeric(12,2) AS valor_stock
                FROM productos
            `);

            const movimientosResult = await pool.query(`
                SELECT
                    COUNT(*) FILTER (WHERE tipo_movimiento = 'entrada' AND created_at::date = CURRENT_DATE)::int AS ingresos_hoy,
                    COUNT(*) FILTER (WHERE tipo_movimiento = 'salida' AND created_at::date = CURRENT_DATE)::int AS salidas_hoy,
                    COUNT(*) FILTER (
                        WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
                    )::int AS movimientos_mes,
                    COALESCE(SUM(
                        CASE
                            WHEN tipo_movimiento = 'entrada'
                             AND created_at::date = CURRENT_DATE
                             AND COALESCE(referencia, '') LIKE 'GASTO:%'
                            THEN NULLIF(REPLACE(referencia, 'GASTO:', ''), '')::numeric
                            ELSE 0
                        END
                    ), 0)::numeric(12,2) AS gasto_hoy,
                    COALESCE(SUM(
                        CASE
                            WHEN tipo_movimiento = 'entrada'
                             AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
                             AND COALESCE(referencia, '') LIKE 'GASTO:%'
                            THEN NULLIF(REPLACE(referencia, 'GASTO:', ''), '')::numeric
                            ELSE 0
                        END
                    ), 0)::numeric(12,2) AS gasto_mes
                FROM movimientos_inventario
            `);

            const topProductosResult = await pool.query(`
                SELECT
                    nombre AS producto,
                    stock_actual::int AS stock,
                    COALESCE(stock_minimo, 0)::int AS stock_minimo
                FROM productos
                WHERE stock_actual <= COALESCE(stock_minimo, 0)
                ORDER BY stock_actual ASC, nombre ASC
                LIMIT 10
            `);

            const gastoDiarioResult = await pool.query(`
                WITH dias AS (
                    SELECT generate_series(
                        date_trunc('month', CURRENT_DATE)::date,
                        CURRENT_DATE,
                        INTERVAL '1 day'
                    )::date AS fecha
                )
                SELECT
                    d.fecha,
                    COALESCE(SUM(
                        CASE
                            WHEN m.tipo_movimiento = 'entrada'
                             AND COALESCE(m.referencia, '') LIKE 'GASTO:%'
                            THEN NULLIF(REPLACE(m.referencia, 'GASTO:', ''), '')::numeric
                            ELSE 0
                        END
                    ), 0)::numeric(12,2) AS gasto
                FROM dias d
                LEFT JOIN movimientos_inventario m
                    ON m.created_at::date = d.fecha
                GROUP BY d.fecha
                ORDER BY d.fecha ASC
            `);

            const resumen = resumenResult.rows[0] || {};
            const movimientos = movimientosResult.rows[0] || {};

            res.json({
                totalProductos: resumen.total_productos || 0,
                stockTotal: resumen.stock_total || 0,
                bajoMinimo: resumen.bajo_minimo || 0,
                valorStock: resumen.valor_stock || 0,
                ingresosHoy: movimientos.ingresos_hoy || 0,
                salidasHoy: movimientos.salidas_hoy || 0,
                movimientosMes: movimientos.movimientos_mes || 0,
                gastoHoy: movimientos.gasto_hoy || 0,
                gastoMes: movimientos.gasto_mes || 0,
                gastoDiario: (gastoDiarioResult.rows || []).map((row) => ({
                    fecha: row.fecha,
                    gasto: Number(row.gasto || 0),
                })),
                topProductos: topProductosResult.rows || [],
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    //ruta para obtener un producto
    app.get('/api/productos/:id', async (req, res) => {
        try {
            const productosIdColumn = await getProductosIdColumn();
            const result = await pool.query(
                `SELECT
                    ${productosIdColumn} AS id,
                    ${productosIdColumn} AS id_producto,
                    nombre,
                    categoria,
                    unidad_medida AS unidad,
                    stock_minimo,
                    stock_actual
                 FROM productos
                 WHERE ${productosIdColumn} = $1`,
                [parseInt(req.params.id)]
            );
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ error: 'Producto no encontrado' });
            }
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    //ruta productos (para los selects del modal)
    app.get('/api/productos', async (req, res) => {
        try {
            const productosIdColumn = await getProductosIdColumn();
            const result = await pool.query(`
                SELECT
                    ${productosIdColumn} AS id,
                    ${productosIdColumn} AS id_producto,
                    nombre,
                    categoria,
                    unidad_medida AS unidad,
                    stock_minimo,
                    stock_actual
                FROM productos
                ORDER BY ${productosIdColumn} DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/productos', async (req, res) => {
        const { nombre, categoria, unidad, stock_minimo, stock_actual, precio_unitario, proveedor_id, vencimiento } = req.body;
        try {
            const productosIdColumn = await getProductosIdColumn();
            const result = await pool.query(
                `INSERT INTO productos (nombre, categoria, unidad_medida, stock_minimo, stock_actual)
                 VALUES ($1, $2, $3, $4, $5) RETURNING ${productosIdColumn} AS id`,
                [nombre, categoria || null, unidad, parseInt(stock_minimo) || 0, parseInt(stock_actual) || 0]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/productos/:id', async (req, res) => {
        const { nombre, categoria, unidad, stock_minimo, stock_actual } = req.body;
        try {
            const productosIdColumn = await getProductosIdColumn();
            const result = await pool.query(
                `UPDATE productos
                 SET nombre = $1,
                     categoria = $2,
                     unidad_medida = $3,
                     stock_minimo = $4,
                     stock_actual = $5,
                     precio_unitario = $6,
                     proveedor_id = $7,
                     vencimiento = $8,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE ${productosIdColumn} = $6
                 RETURNING ${productosIdColumn} AS id`,
                [nombre, categoria || null, unidad, parseInt(stock_minimo) || 0, parseInt(stock_actual) || 0, Number.parseFloat(precio_unitario) || 0, Number.parseInt(proveedor_id) || null, vencimiento || null, parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/productos/:id', async (req, res) => {
        try {
            const productosIdColumn = await getProductosIdColumn();
            const result = await pool.query(
                `DELETE FROM productos WHERE ${productosIdColumn} = $1 RETURNING ${productosIdColumn} AS id`,
                [parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    //  MÓDULO PROVEEDORES
    app.get('/api/proveedores', async (req, res) => {
        try {
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const result = await pool.query(
                `SELECT
                    ${proveedoresIdColumn} AS id,
                    nombre,
                    nombre AS empresa,
                    contacto_principal AS contacto,
                    telefono,
                    email
                 FROM proveedores
                 WHERE COALESCE(activo, TRUE) = TRUE
                 ORDER BY ${proveedoresIdColumn} DESC`
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/proveedores', async (req, res) => {
        const { empresa, contacto, telefono, email } = req.body;
        try {
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const result = await pool.query(
                `INSERT INTO proveedores (nombre, contacto_principal, telefono, email)
                 VALUES ($1, $2, $3, $4) RETURNING ${proveedoresIdColumn} AS id`,
                [empresa, contacto || null, telefono || null, email || null]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/proveedores/:id', async (req, res) => {
        const { empresa, contacto, telefono, email } = req.body;
        try {
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const result = await pool.query(
                `UPDATE proveedores
                 SET nombre = $1,
                     contacto_principal = $2,
                     telefono = $3,
                     email = $4
                 WHERE ${proveedoresIdColumn} = $5
                 RETURNING ${proveedoresIdColumn} AS id`,
                [empresa, contacto || null, telefono || null, email || null, parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
            }
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/proveedores/:id', async (req, res) => {
        try {
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const result = await pool.query(
                `UPDATE proveedores
                 SET activo = FALSE,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE ${proveedoresIdColumn} = $1
                 RETURNING ${proveedoresIdColumn} AS id`,
                [parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    //  MÓDULO INGRESOS ALMACÉN
    app.get('/api/ingresos', async (req, res) => {
        try {
            const ingresosIdColumn = await getIngresosIdColumn();
            const proveedoresIdColumn = await getProveedoresIdColumn();
            const productosIdColumn = await getProductosIdColumn();
            const result = await pool.query(`
                SELECT
                    i.${ingresosIdColumn} AS id,
                    d.producto_id AS id_producto,
                    i.proveedor_id AS id_proveedor,
                    p.nombre AS producto_nombre,
                    pr.nombre AS proveedor_nombre,
                    d.cantidad,
                    d.precio_unitario,
                    d.subtotal,
                    i.observaciones
                FROM ingresos_almacen i
                JOIN ingresos_almacen_detalles d ON d.ingreso_id = i.${ingresosIdColumn}
                LEFT JOIN productos p ON p.${productosIdColumn} = d.producto_id
                LEFT JOIN proveedores pr ON pr.${proveedoresIdColumn} = i.proveedor_id
                ORDER BY i.${ingresosIdColumn} DESC
            `);
            res.json(result.rows.map((row) => {
                const extra = parseIngresoObservaciones(row.observaciones);
                return {
                    id: row.id,
                    id_producto: row.id_producto,
                    id_proveedor: row.id_proveedor,
                    producto_nombre: row.producto_nombre,
                    proveedor_nombre: row.proveedor_nombre,
                    cantidad: row.cantidad,
                    precio_unitario: row.precio_unitario,
                    subtotal: row.subtotal,
                    moneda: extra.moneda,
                    fecha_vencimiento: extra.fecha_vencimiento,
                    comprobante: extra.comprobante,
                };
            }));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/ingresos', async (req, res) => {
        const { id_producto, id_proveedor, cantidad, precio_unitario, moneda, fecha_vencimiento, comprobante } = req.body;
        try {
            const ingresosIdColumn = await getIngresosIdColumn();
            const productosIdColumn = await getProductosIdColumn();
            const cantidadFinal = Number.parseInt(cantidad, 10);
            const precioUnitarioFinal = Number.parseFloat(precio_unitario);
            if (!Number.isInteger(cantidadFinal) || cantidadFinal <= 0 || !Number.isFinite(precioUnitarioFinal) || precioUnitarioFinal < 0) {
                return res.status(400).json({ success: false, error: 'Cantidad o precio unitario inválido' });
            }
            const subtotal = Number((cantidadFinal * precioUnitarioFinal).toFixed(2));
            await pool.query('BEGIN');

            const ingresoResult = await pool.query(
                `INSERT INTO ingresos_almacen (proveedor_id, fecha_ingreso, estado, observaciones)
                 VALUES ($1, CURRENT_DATE, 'recibido', $2)
                 RETURNING ${ingresosIdColumn} AS id`,
                [parseInt(id_proveedor), buildIngresoObservaciones(moneda, fecha_vencimiento, comprobante)]
            );

            await pool.query(
                `INSERT INTO ingresos_almacen_detalles (ingreso_id, producto_id, cantidad, precio_unitario, subtotal)
                 VALUES ($1, $2, $3, $4, $5)`,
                [ingresoResult.rows[0].id, parseInt(id_producto), cantidadFinal, precioUnitarioFinal, subtotal]
            );

            await pool.query(
                `UPDATE productos
                 SET stock_actual = stock_actual + $1,
                     precio_unitario = $2,
                     proveedor_id = $3,
                     vencimiento = $4,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE ${productosIdColumn} = $5`,
                [cantidadFinal, precioUnitarioFinal, parseInt(id_proveedor), fecha_vencimiento || null, parseInt(id_producto)]
            );

            await pool.query('COMMIT');
            res.json({ success: true, subtotal });
        } catch (err) {
            await pool.query('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/ingresos/:id', async (req, res) => {
        const { id_producto, id_proveedor, cantidad, precio_unitario, moneda, fecha_vencimiento, comprobante } = req.body;
        try {
            const ingresosIdColumn = await getIngresosIdColumn();
            const productosIdColumn = await getProductosIdColumn();
            const cantidadFinal = Number.parseInt(cantidad, 10);
            const precioUnitarioFinal = Number.parseFloat(precio_unitario);
            if (!Number.isInteger(cantidadFinal) || cantidadFinal <= 0 || !Number.isFinite(precioUnitarioFinal) || precioUnitarioFinal < 0) {
                return res.status(400).json({ success: false, error: 'Cantidad o precio unitario inválido' });
            }
            const subtotal = Number((cantidadFinal * precioUnitarioFinal).toFixed(2));
            await pool.query('BEGIN');

            const detallePrevio = await pool.query(
                'SELECT producto_id, cantidad FROM ingresos_almacen_detalles WHERE ingreso_id = $1',
                [parseInt(req.params.id)]
            );

            if (detallePrevio.rows.length === 0) {
                await pool.query('ROLLBACK');
                return res.status(404).json({ success: false, error: 'Ingreso no encontrado' });
            }

            await pool.query(
                `UPDATE productos SET stock_actual = stock_actual - $1 WHERE ${productosIdColumn} = $2`,
                [parseInt(detallePrevio.rows[0].cantidad), parseInt(detallePrevio.rows[0].producto_id)]
            );

            const result = await pool.query(
                `UPDATE ingresos_almacen
                 SET proveedor_id = $1,
                     observaciones = $2
                 WHERE ${ingresosIdColumn} = $3
                 RETURNING ${ingresosIdColumn} AS id`,
                [parseInt(id_proveedor), buildIngresoObservaciones(moneda, fecha_vencimiento, comprobante), parseInt(req.params.id)]
            );

            await pool.query(
                `UPDATE ingresos_almacen_detalles
                 SET producto_id = $1,
                     cantidad = $2,
                     precio_unitario = $3,
                     subtotal = $4
                 WHERE ingreso_id = $5`,
                [parseInt(id_producto), cantidadFinal, precioUnitarioFinal, subtotal, parseInt(req.params.id)]
            );

            await pool.query(
                `UPDATE productos
                 SET stock_actual = stock_actual + $1,
                     precio_unitario = $2,
                     proveedor_id = $3,
                     vencimiento = $4,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE ${productosIdColumn} = $5`,
                [cantidadFinal, precioUnitarioFinal, parseInt(id_proveedor), fecha_vencimiento || null, parseInt(id_producto)]
            );

            await pool.query('COMMIT');
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Ingreso no encontrado' });
            }
            res.json({ success: true, id: result.rows[0].id, subtotal });
        } catch (err) {
            await pool.query('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/ingresos/:id', async (req, res) => {
        try {
            const ingresosIdColumn = await getIngresosIdColumn();
            const productosIdColumn = await getProductosIdColumn();
            await pool.query('BEGIN');

            const detallePrevio = await pool.query(
                'SELECT producto_id, cantidad FROM ingresos_almacen_detalles WHERE ingreso_id = $1',
                [parseInt(req.params.id)]
            );

            if (detallePrevio.rows.length > 0) {
                await pool.query(
                    `UPDATE productos SET stock_actual = stock_actual - $1 WHERE ${productosIdColumn} = $2`,
                    [parseInt(detallePrevio.rows[0].cantidad), parseInt(detallePrevio.rows[0].producto_id)]
                );
            }

            const result = await pool.query(
                `DELETE FROM ingresos_almacen WHERE ${ingresosIdColumn} = $1 RETURNING ${ingresosIdColumn} AS id`,
                [parseInt(req.params.id)]
            );

            await pool.query('COMMIT');
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Ingreso no encontrado' });
            }
            res.json({ success: true });
        } catch (err) {
            await pool.query('ROLLBACK');
            res.status(500).json({ success: false, error: err.message });
        }
    });
};
