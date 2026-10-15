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

    app.post('/api/inventario', async (req, res) => {
        const { producto, stock, personal, categoria, unidad, lote, precio_unitario } = req.body;
        const stockInicial = Number.parseInt(stock, 10) || 0;
        const precioIngresado = Number.parseFloat(precio_unitario);
        const precio = Number.isFinite(precioIngresado) && precioIngresado >= 0 ? precioIngresado : 0;
        const cantidad = Math.max(stockInicial, 0);
        const nombre = String(producto || '').trim();

        if (!nombre) return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio' });
        if (!Number.isInteger(stockInicial) || stockInicial < 0) return res.status(400).json({ success: false, message: 'El stock debe ser un entero mayor o igual a cero' });

        try {
            const creado = await Producto.sequelize.transaction(async (transaction) => {
                const registro = await Producto.create({
                    nombre,
                    categoria: categoria || 'alimento',
                    descripcion: categoria || null,
                    unidad_medida: unidad || 'unidad',
                    lote: String(lote || '').trim() || null,
                    precio_unitario: precio,
                    stock_minimo: 0,
                    stock_actual: cantidad,
                }, { transaction });

                if (personal) {
                    await MovimientoInventario.create({
                        producto_id: registro.id,
                        tipo_movimiento: 'entrada',
                        cantidad,
                        usuario_id: Number.parseInt(personal, 10),
                        motivo: registro.lote ? `Alta inicial de inventario - Lote ${registro.lote}` : 'Alta inicial de inventario',
                        referencia: `GASTO:${(cantidad * precio).toFixed(2)}`,
                        precio_unitario: precio,
                        gasto_total: Number((cantidad * precio).toFixed(2)),
                    }, { transaction });
                }
                return registro;
            });
            res.json({ success: true, id: creado.id, gasto_total: Number((cantidad * precio).toFixed(2)) });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
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
                let registro = await Producto.findOne({ where: { nombre: { [Op.iLike]: String(producto).trim() }, lote: String(lote || '').trim() || null }, transaction });
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

    app.put('/api/inventario/:id', async (req, res) => {
        const { producto, categoria, unidad, lote, stock, precio_unitario, proveedor_id, vencimiento } = req.body;
        const nombre = String(producto || '').trim();
        const cantidad = Number.parseInt(stock, 10);
        const precioIngresado = Number.parseFloat(precio_unitario);
        const precio = Number.isFinite(precioIngresado) && precioIngresado >= 0 ? precioIngresado : 0;
        if (!nombre) return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio' });
        if (!Number.isInteger(cantidad) || cantidad < 0) return res.status(400).json({ success: false, message: 'El stock debe ser un entero mayor o igual a cero' });

        try {
            const [actualizados] = await Producto.update({
                nombre,
                categoria: categoria || null,
                descripcion: categoria || null,
                unidad_medida: unidad || 'unidad',
                lote: String(lote || '').trim() || null,
                stock_actual: cantidad,
                precio_unitario: precio,
                proveedor_id: Number.parseInt(proveedor_id, 10) || null,
                vencimiento: vencimiento || null,
                updated_at: new Date(),
            }, { where: { id: req.params.id } });
            if (!actualizados) return res.status(404).json({ success: false, message: 'Producto no encontrado' });
            res.json({ success: true, id: Number(req.params.id) });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.delete('/api/inventario/:id', async (req, res) => {
        try {
            const eliminados = await Producto.destroy({ where: { id: req.params.id } });
            if (!eliminados) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            res.json({ success: true, message: 'Registro eliminado' });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
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

    app.get('/api/reportes/almacen', async (req, res) => {
        try {
            const ahora = new Date();
            const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
            const inicioManana = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1);
            const [productos, movimientos] = await Promise.all([
                Producto.findAll({ attributes: ['nombre', 'stock_actual', 'stock_minimo', 'precio_unitario'] }),
                MovimientoInventario.findAll({
                    where: { created_at: { [Op.gte]: inicioMes, [Op.lt]: inicioManana } },
                    attributes: ['tipo_movimiento', 'created_at', 'referencia'],
                }),
            ]);
            const gastoMovimiento = (movimiento) => {
                if (movimiento.tipo_movimiento !== 'entrada' || !String(movimiento.referencia || '').startsWith('GASTO:')) return 0;
                const valor = Number.parseFloat(movimiento.referencia.slice(6));
                return Number.isFinite(valor) ? valor : 0;
            };
            const hoy = ahora.toISOString().slice(0, 10);
            const mesMovimientos = movimientos.filter((m) => m.created_at);
            const gastoDiario = new Map();
            for (const movimiento of mesMovimientos) {
                const fecha = new Date(movimiento.created_at).toISOString().slice(0, 10);
                gastoDiario.set(fecha, (gastoDiario.get(fecha) || 0) + gastoMovimiento(movimiento));
            }
            const dias = [];
            for (let fecha = new Date(inicioMes); fecha < new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1); fecha.setDate(fecha.getDate() + 1)) {
                const clave = new Date(fecha).toISOString().slice(0, 10);
                dias.push({ fecha: clave, gasto: Number((gastoDiario.get(clave) || 0).toFixed(2)) });
            }
            const deHoy = mesMovimientos.filter((m) => new Date(m.created_at).toISOString().slice(0, 10) === hoy);
            const bajoMinimo = productos.filter((p) => Number(p.stock_actual || 0) <= Number(p.stock_minimo || 0));
            res.json({
                totalProductos: productos.length,
                stockTotal: productos.reduce((total, p) => total + Number(p.stock_actual || 0), 0),
                bajoMinimo: bajoMinimo.length,
                valorStock: Number(productos.reduce((total, p) => total + Number(p.stock_actual || 0) * Number(p.precio_unitario || 0), 0).toFixed(2)),
                ingresosHoy: deHoy.filter((m) => m.tipo_movimiento === 'entrada').length,
                salidasHoy: deHoy.filter((m) => m.tipo_movimiento === 'salida').length,
                movimientosMes: mesMovimientos.length,
                gastoHoy: Number(deHoy.reduce((total, m) => total + gastoMovimiento(m), 0).toFixed(2)),
                gastoMes: Number(mesMovimientos.reduce((total, m) => total + gastoMovimiento(m), 0).toFixed(2)),
                gastoDiario: dias,
                topProductos: bajoMinimo.sort((a, b) => Number(a.stock_actual || 0) - Number(b.stock_actual || 0)).slice(0, 10).map((p) => ({
                    producto: p.nombre,
                    stock: p.stock_actual,
                    stock_minimo: p.stock_minimo || 0,
                })),
            });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    const salidaProducto = (producto) => ({
        id: producto.id,
        id_producto: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        unidad: producto.unidad_medida,
        stock_minimo: producto.stock_minimo,
        stock_actual: producto.stock_actual,
    });

    app.get('/api/productos/:id', async (req, res) => {
        try {
            const producto = await Producto.findByPk(req.params.id);
            if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
            res.json(salidaProducto(producto));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.get('/api/productos', async (req, res) => {
        try {
            const productos = await Producto.findAll({ order: [['id', 'DESC']] });
            res.json(productos.map(salidaProducto));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/productos', async (req, res) => {
        const { nombre, categoria, unidad, stock_minimo, stock_actual, precio_unitario, proveedor_id, vencimiento } = req.body;
        try {
            const producto = await Producto.create({
                nombre,
                categoria: categoria || null,
                unidad_medida: unidad || null,
                stock_minimo: Number.parseInt(stock_minimo, 10) || 0,
                stock_actual: Number.parseInt(stock_actual, 10) || 0,
                precio_unitario: Number.parseFloat(precio_unitario) || 0,
                proveedor_id: Number.parseInt(proveedor_id, 10) || null,
                vencimiento: vencimiento || null,
            });
            res.json({ success: true, id: producto.id });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.put('/api/productos/:id', async (req, res) => {
        const { nombre, categoria, unidad, stock_minimo, stock_actual, precio_unitario, proveedor_id, vencimiento } = req.body;
        try {
            const [actualizados] = await Producto.update({
                nombre,
                categoria: categoria || null,
                unidad_medida: unidad || null,
                stock_minimo: Number.parseInt(stock_minimo, 10) || 0,
                stock_actual: Number.parseInt(stock_actual, 10) || 0,
                precio_unitario: Number.parseFloat(precio_unitario) || 0,
                proveedor_id: Number.parseInt(proveedor_id, 10) || null,
                vencimiento: vencimiento || null,
                updated_at: new Date(),
            }, { where: { id: req.params.id } });
            if (!actualizados) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            res.json({ success: true, id: Number(req.params.id) });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.delete('/api/productos/:id', async (req, res) => {
        try {
            const eliminados = await Producto.destroy({ where: { id: req.params.id } });
            if (!eliminados) return res.status(404).json({ success: false, error: 'Producto no encontrado' });
            res.json({ success: true });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.get('/api/proveedores', async (req, res) => {
        try {
            const proveedores = await Proveedor.findAll({ where: { activo: { [Op.ne]: false } }, order: [['id', 'DESC']] });
            res.json(proveedores.map((proveedor) => ({
                id: proveedor.id,
                nombre: proveedor.nombre,
                empresa: proveedor.nombre,
                contacto: proveedor.contacto_principal,
                telefono: proveedor.telefono,
                email: proveedor.email,
            })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/proveedores', async (req, res) => {
        const { empresa, contacto, telefono, email } = req.body;
        try {
            const proveedor = await Proveedor.create({ nombre: empresa, contacto_principal: contacto || null, telefono: telefono || null, email: email || null });
            res.json({ success: true, id: proveedor.id });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.put('/api/proveedores/:id', async (req, res) => {
        const { empresa, contacto, telefono, email } = req.body;
        try {
            const [actualizados] = await Proveedor.update({ nombre: empresa, contacto_principal: contacto || null, telefono: telefono || null, email: email || null }, { where: { id: req.params.id } });
            if (!actualizados) return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
            res.json({ success: true, id: Number(req.params.id) });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.delete('/api/proveedores/:id', async (req, res) => {
        try {
            const [actualizados] = await Proveedor.update({ activo: false, updated_at: new Date() }, { where: { id: req.params.id } });
            if (!actualizados) return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
            res.json({ success: true });
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
                await Producto.increment({ stock_actual: cantidadFinal }, { where: { id: id_producto }, transaction });
                await Producto.update({ precio_unitario: precioFinal, proveedor_id: id_proveedor, vencimiento: fecha_vencimiento || null }, { where: { id: id_producto }, transaction });
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
