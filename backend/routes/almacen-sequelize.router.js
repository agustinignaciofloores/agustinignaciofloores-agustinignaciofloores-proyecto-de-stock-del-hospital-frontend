const { Op } = require('sequelize');

module.exports = function registerAlmacenSequelizeRoutes(app, { models }) {
    const { Producto, Proveedor, MovimientoInventario, IngresoAlmacen, DetalleIngresoAlmacen, Usuario, Persona } = models;

    const productoInclude = { model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] };
    const parseObservaciones = (value) => { try { return value ? JSON.parse(value) : {}; } catch (_) { return {}; } };

    app.get('/api/inventario', async (req, res) => {
        try {
            const productos = await Producto.findAll({
                include: [productoInclude],
                order: [['id', 'DESC']],
            });
            const movimientos = await MovimientoInventario.findAll({
                include: [{ model: Usuario, as: 'usuario', include: [{ model: Persona, as: 'persona' }] }],
                order: [['created_at', 'DESC']],
            });
            const ultimoMovimiento = new Map();
            movimientos.forEach((movimiento) => {
                if (!ultimoMovimiento.has(movimiento.producto_id)) ultimoMovimiento.set(movimiento.producto_id, movimiento);
            });
            res.json(productos.map((producto) => {
                const movimiento = ultimoMovimiento.get(producto.id);
                const persona = movimiento?.usuario?.persona;
                return {
                    id: producto.id,
                    producto: producto.nombre,
                    categoria: producto.descripcion || producto.categoria || 'verdura',
                    unidad: producto.unidad_medida || 'unidad',
                    lote: producto.lote || '-',
                    stock: producto.stock_actual,
                    precio_unitario: producto.precio_unitario || 0,
                    gasto_total: Number(producto.stock_actual || 0) * Number(producto.precio_unitario || 0),
                    proveedor_id: producto.proveedor_id,
                    proveedor: producto.proveedor?.nombre || null,
                    vencimiento: producto.vencimiento,
                    fecha: movimiento?.created_at || producto.updated_at || producto.created_at,
                    personal: persona ? `${persona.nombre} ${persona.apellido}`.trim() : 'Sin asignar',
                };
            }));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/inventario/movimiento', async (req, res) => {
        const { producto, cantidad, tipo, personal, personal_nombre, categoria, unidad, lote, precio_unitario, id_proveedor, vencimiento } = req.body;
        const cantidadFinal = Number.parseInt(cantidad, 10);
        const esIngreso = String(tipo).toUpperCase() === 'INGRESO';
        const precio = precio_unitario === null || precio_unitario === '' ? null : Number.parseFloat(precio_unitario);
        if (!Number.isInteger(cantidadFinal) || cantidadFinal <= 0) return res.status(400).json({ success: false, message: 'La cantidad debe ser un entero mayor a cero' });
        if (esIngreso && (!Number.isFinite(precio) || precio < 0)) return res.status(400).json({ success: false, message: 'El precio unitario es obligatorio para un ingreso' });
        if (!personal) return res.status(400).json({ success: false, message: 'Seleccioná el personal que realiza el movimiento' });

        try {
            const resultado = await Producto.sequelize.transaction(async (transaction) => {
                let registro = await Producto.findOne({ where: { nombre: { [Op.iLike]: String(producto).trim() }, lote: String(lote || '').trim() || null } }, { transaction });
                if (!registro && esIngreso) {
                    registro = await Producto.create({ nombre: String(producto).trim(), categoria: categoria || 'alimento', descripcion: categoria || null, unidad_medida: unidad || 'unidad', lote: String(lote || '').trim() || null, stock_actual: 0, precio_unitario: precio || 0 }, { transaction });
                }
                if (!registro) throw new Error('Producto no encontrado para registrar la salida');
                const nuevoStock = Number(registro.stock_actual || 0) + (esIngreso ? cantidadFinal : -cantidadFinal);
                if (nuevoStock < 0) throw new Error('No hay stock suficiente para la salida solicitada');
                await registro.update({ stock_actual: nuevoStock, ...(esIngreso ? { precio_unitario: precio, proveedor_id: id_proveedor || null, vencimiento: vencimiento || null } : {}) }, { transaction });
                const gastoTotal = esIngreso ? Number((cantidadFinal * precio).toFixed(2)) : 0;
                const movimiento = await MovimientoInventario.create({ producto_id: registro.id, tipo_movimiento: esIngreso ? 'entrada' : 'salida', cantidad: cantidadFinal, usuario_id: personal, proveedor_id: id_proveedor || null, motivo: personal_nombre || `Movimiento ${tipo}`, referencia: gastoTotal ? `GASTO:${gastoTotal.toFixed(2)}` : null, precio_unitario: precio, gasto_total: gastoTotal, vencimiento: vencimiento || null }, { transaction });
                return { registro, movimiento, gastoTotal };
            });
            res.json({ success: true, nuevoStock: resultado.registro.stock_actual, lote: resultado.registro.lote, unidad: resultado.registro.unidad_medida, gasto_total: resultado.gastoTotal, precio_unitario: resultado.movimiento.precio_unitario });
        } catch (err) { res.status(400).json({ success: false, message: err.message }); }
    });

    app.get('/api/almacen/movimientos', async (req, res) => {
        try {
            const movimientos = await MovimientoInventario.findAll({
                include: [
                    { model: Producto, as: 'producto', attributes: ['nombre'] },
                    { model: Proveedor, as: 'proveedor', attributes: ['nombre'] },
                    { model: Usuario, as: 'usuario', include: [{ model: Persona, as: 'persona', attributes: ['nombre', 'apellido'] }] },
                ],
                order: [['created_at', 'DESC'], ['id', 'DESC']],
            });
            res.json({ success: true, movimientos: movimientos.map((movimiento) => ({
                id: movimiento.id,
                producto: movimiento.producto?.nombre,
                tipo: movimiento.tipo_movimiento === 'entrada' ? 'INGRESO' : movimiento.tipo_movimiento.toUpperCase(),
                cantidad: movimiento.cantidad,
                proveedor: movimiento.proveedor?.nombre,
                precio_unitario: movimiento.precio_unitario,
                gasto_total: movimiento.gasto_total,
                vencimiento: movimiento.vencimiento,
                fecha: movimiento.created_at,
                usuario: movimiento.usuario?.persona ? `${movimiento.usuario.persona.nombre} ${movimiento.usuario.persona.apellido}`.trim() : 'Sin asignar',
                motivo: movimiento.motivo || '-',
            })) });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.get('/api/ingresos', async (req, res) => {
        try {
            const ingresos = await IngresoAlmacen.findAll({ include: [{ model: Proveedor, as: 'proveedor' }, { model: DetalleIngresoAlmacen, as: 'detalles', include: [{ model: Producto, as: 'producto' }] }], order: [['id', 'DESC']] });
            res.json(ingresos.flatMap((ingreso) => { const extra = parseObservaciones(ingreso.observaciones); return ingreso.detalles.map((detalle) => ({ id: ingreso.id, id_producto: detalle.producto_id, id_proveedor: ingreso.proveedor_id, producto_nombre: detalle.producto?.nombre, proveedor_nombre: ingreso.proveedor?.nombre, cantidad: detalle.cantidad, precio_unitario: detalle.precio_unitario, subtotal: detalle.subtotal, moneda: extra.moneda || 'ARS', fecha_vencimiento: extra.fecha_vencimiento || detalle.producto?.vencimiento, comprobante: extra.comprobante || null })); }));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/ingresos', async (req, res) => {
        const { id_producto, id_proveedor, cantidad, precio_unitario, fecha_vencimiento, moneda, comprobante } = req.body;
        try {
            const cantidadFinal = Number.parseInt(cantidad, 10);
            const precioFinal = Number.parseFloat(precio_unitario);
            const subtotal = Number((cantidadFinal * precioFinal).toFixed(2));
            const ingreso = await IngresoAlmacen.sequelize.transaction(async (transaction) => {
                const nuevo = await IngresoAlmacen.create({ proveedor_id: id_proveedor, fecha_ingreso: new Date(), estado: 'recibido', observaciones: JSON.stringify({ moneda: moneda || 'ARS', fecha_vencimiento: fecha_vencimiento || null, comprobante: comprobante || null }) }, { transaction });
                await DetalleIngresoAlmacen.create({ ingreso_id: nuevo.id, producto_id: id_producto, cantidad: cantidadFinal, precio_unitario: precioFinal, subtotal }, { transaction });
                await Producto.increment({ stock_actual: cantidadFinal }, { where: { id: id_producto }, transaction });
                await Producto.update({ precio_unitario: precioFinal, proveedor_id: id_proveedor, vencimiento: fecha_vencimiento || null }, { where: { id: id_producto }, transaction });
                return nuevo;
            });
            res.json({ success: true, id: ingreso.id, subtotal });
        } catch (err) { res.status(400).json({ success: false, error: err.message }); }
    });

    app.put('/api/ingresos/:id', async (req, res) => {
        const { id_producto, id_proveedor, cantidad, precio_unitario, fecha_vencimiento, moneda, comprobante } = req.body;
        try {
            const cantidadFinal = Number.parseInt(cantidad, 10);
            const precioFinal = Number.parseFloat(precio_unitario);
            if (!Number.isInteger(cantidadFinal) || cantidadFinal <= 0 || !Number.isFinite(precioFinal) || precioFinal < 0) {
                return res.status(400).json({ success: false, error: 'Cantidad o precio unitario inválido' });
            }
            const subtotal = Number((cantidadFinal * precioFinal).toFixed(2));
            await IngresoAlmacen.sequelize.transaction(async (transaction) => {
                const ingreso = await IngresoAlmacen.findByPk(parseInt(req.params.id, 10), { include: [{ model: DetalleIngresoAlmacen, as: 'detalles' }], transaction });
                if (!ingreso || !ingreso.detalles[0]) throw new Error('Ingreso no encontrado');
                const anterior = ingreso.detalles[0];
                await Producto.increment({ stock_actual: -anterior.cantidad }, { where: { id: anterior.producto_id }, transaction });
                await ingreso.update({ proveedor_id: id_proveedor, observaciones: JSON.stringify({ moneda: moneda || 'ARS', fecha_vencimiento: fecha_vencimiento || null, comprobante: comprobante || null }) }, { transaction });
                await anterior.update({ producto_id: id_producto, cantidad: cantidadFinal, precio_unitario: precioFinal, subtotal }, { transaction });
                await Producto.update({ stock_actual: literal(`stock_actual + ${cantidadFinal}`), precio_unitario: precioFinal, proveedor_id: id_proveedor, vencimiento: fecha_vencimiento || null }, { where: { id: id_producto }, transaction });
            });
            res.json({ success: true, id: parseInt(req.params.id, 10), subtotal });
        } catch (err) { res.status(400).json({ success: false, error: err.message }); }
    });

    app.delete('/api/ingresos/:id', async (req, res) => {
        try {
            await IngresoAlmacen.sequelize.transaction(async (transaction) => {
                const ingreso = await IngresoAlmacen.findByPk(parseInt(req.params.id, 10), { include: [{ model: DetalleIngresoAlmacen, as: 'detalles' }], transaction });
                if (!ingreso || !ingreso.detalles[0]) throw new Error('Ingreso no encontrado');
                await Producto.increment({ stock_actual: -ingreso.detalles[0].cantidad }, { where: { id: ingreso.detalles[0].producto_id }, transaction });
                await ingreso.destroy({ transaction });
            });
            res.json({ success: true });
        } catch (err) { res.status(400).json({ success: false, error: err.message }); }
    });
};
