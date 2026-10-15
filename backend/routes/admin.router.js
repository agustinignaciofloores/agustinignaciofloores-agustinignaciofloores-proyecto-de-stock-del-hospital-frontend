module.exports = function registerAdminRoutes(app, { models }) {
    const { Usuario, Persona, Rol, Patologia, MovimientoPaciente, Paciente, Menu, Habitacion } = models;

    app.get('/api/personal', async (req, res) => {
        try {
            const usuarios = await Usuario.findAll({
                include: [{ model: Persona, as: 'persona', required: true }],
                order: [['id', 'DESC']],
            });
            const roles = await Rol.findAll();
            const rolesPorNombre = new Map(roles.map((rol) => [rol.nombre.trim().toLowerCase(), rol.id]));
            res.json(usuarios.map((usuario) => ({
                id: usuario.id,
                id_persona: usuario.id_persona,
                nombre: usuario.persona.nombre,
                apellido: usuario.persona.apellido,
                dni: usuario.persona.dni,
                id_rol: rolesPorNombre.get(String(usuario.rol || '').trim().toLowerCase()) || null,
                rol_nombre: usuario.rol,
                nombre_completo: `${usuario.persona.nombre} ${usuario.persona.apellido}`.trim(),
                activo: usuario.activo,
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    const actualizarPersonal = async (req, res, usuarioId) => {
        const { id_rol, activo } = req.body;
        try {
            const rol = await Rol.findByPk(id_rol);
            if (!rol) return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            const [actualizados] = await Usuario.update(
                { rol: rol.nombre, activo: activo !== false },
                { where: { id: usuarioId } }
            );
            if (!actualizados) return res.status(404).json({ success: false, error: 'Personal no encontrado' });
            res.json({ success: true, id: Number(usuarioId) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    };

    app.post('/api/personal', async (req, res) => {
        const { id_persona, id_rol } = req.body;
        try {
            const rol = await Rol.findByPk(id_rol);
            if (!rol) return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            const usuario = await Usuario.findOne({ where: { id_persona } });
            if (!usuario) {
                return res.status(400).json({ success: false, error: 'La persona seleccionada no tiene usuario asociado. Creala desde Gestión de Usuarios.' });
            }
            await usuario.update({ rol: rol.nombre, activo: req.body.activo !== false });
            res.json({ success: true, id: usuario.id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/personal/:id', async (req, res) => actualizarPersonal(req, res, req.params.id));

    app.delete('/api/personal/:id', async (req, res) => {
        try {
            const eliminados = await Usuario.destroy({ where: { id: req.params.id } });
            if (!eliminados) return res.status(404).json({ success: false, error: 'Personal no encontrado' });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/patologias', async (req, res) => {
        try {
            const patologias = await Patologia.findAll({ order: [['id', 'DESC']] });
            res.json(patologias.map((patologia) => ({
                id: patologia.id,
                nombre: patologia.nombre,
                descripcion: patologia.descripcion,
                es_discapacidad: false,
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/patologias', async (req, res) => {
        try {
            const patologia = await Patologia.create({ nombre: req.body.nombre, descripcion: req.body.descripcion || null });
            res.json({ success: true, id: patologia.id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/patologias/:id', async (req, res) => {
        try {
            const [actualizadas] = await Patologia.update(
                { nombre: req.body.nombre, descripcion: req.body.descripcion || null },
                { where: { id: req.params.id } }
            );
            if (!actualizadas) return res.status(404).json({ success: false, error: 'Patología no encontrada' });
            res.json({ success: true, id: Number(req.params.id) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/patologias/:id', async (req, res) => {
        try {
            const eliminadas = await Patologia.destroy({ where: { id: req.params.id } });
            if (!eliminadas) return res.status(404).json({ success: false, error: 'Patología no encontrada' });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    const idsPacientes = async (movimientos) => {
        const ids = [...new Set(movimientos.map((movimiento) => Number(movimiento.paciente)).filter(Number.isInteger))];
        const pacientes = ids.length ? await Paciente.findAll({ where: { id: ids } }) : [];
        const usuarios = pacientes.length
            ? await Usuario.findAll({ where: { id: pacientes.map((paciente) => paciente.usuario_id).filter(Boolean) }, include: [{ model: Persona, as: 'persona' }] })
            : [];
        const personasPorUsuario = new Map(usuarios.map((usuario) => [String(usuario.id), usuario.persona]));
        return new Map(pacientes.map((paciente) => {
            const persona = personasPorUsuario.get(String(paciente.usuario_id));
            return [String(paciente.id), persona ? `${persona.nombre} ${persona.apellido}`.trim() : paciente.documento];
        }));
    };

    app.get('/api/movimientos', async (req, res) => {
        try {
            const movimientos = await MovimientoPaciente.findAll({ order: [['id', 'DESC']] });
            const nombres = await idsPacientes(movimientos);
            const personalIds = [...new Set(movimientos.map((m) => m.personal).filter(Boolean))];
            const usuarios = personalIds.length
                ? await Usuario.findAll({ where: { id: personalIds }, include: [{ model: Persona, as: 'persona' }] })
                : [];
            const nombresPersonal = new Map(usuarios.map((usuario) => [
                String(usuario.id),
                usuario.persona ? `${usuario.persona.nombre} ${usuario.persona.apellido}`.trim() : String(usuario.id),
            ]));
            res.json(movimientos.map((movimiento) => ({
                id: movimiento.id,
                id_paciente: movimiento.paciente,
                tipo: movimiento.tipo,
                nro_cama: movimiento.cama,
                piso: movimiento.piso,
                fecha: movimiento.fecha,
                id_personal: movimiento.personal,
                paciente_nombre: nombres.get(String(movimiento.paciente)) || movimiento.paciente,
                personal_nombre: nombresPersonal.get(String(movimiento.personal)) || movimiento.personal,
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/movimientos', async (req, res) => {
        const { id_paciente, tipo, nro_cama, piso, id_personal } = req.body;
        try {
            await MovimientoPaciente.create({
                paciente: String(id_paciente),
                tipo,
                cama: nro_cama || null,
                piso: piso || null,
                fecha: new Date(),
                personal: id_personal ? String(id_personal) : null,
            });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/movimientos/:id', async (req, res) => {
        const { id_paciente, tipo, nro_cama, piso, id_personal } = req.body;
        try {
            const [actualizados] = await MovimientoPaciente.update({
                paciente: String(id_paciente),
                tipo,
                cama: nro_cama || null,
                piso: piso || null,
                personal: id_personal ? String(id_personal) : null,
                fecha: new Date(),
            }, { where: { id: req.params.id } });
            if (!actualizados) return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
            res.json({ success: true, id: Number(req.params.id) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/movimientos/:id', async (req, res) => {
        try {
            const eliminados = await MovimientoPaciente.destroy({ where: { id: req.params.id } });
            if (!eliminados) return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get('/api/menus', async (req, res) => {
        try {
            const menus = await Menu.findAll({ order: [['id', 'DESC']] });
            const idPatologias = [...new Set(menus.map((menu) => menu.postre).filter((postre) => /^\d+$/.test(String(postre || ''))).map(Number))];
            const patologias = idPatologias.length ? await Patologia.findAll({ where: { id: idPatologias } }) : [];
            const patologiasPorId = new Map(patologias.map((patologia) => [String(patologia.id), patologia.nombre]));
            res.json(menus.map((menu) => {
                const idPatologia = /^\d+$/.test(String(menu.postre || '')) ? Number(menu.postre) : null;
                return {
                    id: menu.id,
                    nombre: menu.plato_principal,
                    descripcion: menu.guarnicion,
                    id_patologia: idPatologia,
                    patologia_nombre: idPatologia ? patologiasPorId.get(String(idPatologia)) || null : menu.postre,
                };
            }));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/menus', async (req, res) => {
        const { nombre, descripcion, id_patologia, restriccion } = req.body;
        try {
            const ultimaFecha = await Menu.max('fecha');
            const siguienteFecha = ultimaFecha
                ? new Date(new Date(ultimaFecha).getTime() + 86400000).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10);
            const menu = await Menu.create({
                fecha: siguienteFecha,
                turno: 'almuerzo',
                plato_principal: nombre,
                guarnicion: descripcion || null,
                postre: id_patologia ? String(id_patologia) : restriccion || null,
            });
            res.json({ success: true, id: menu.id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/menus/:id', async (req, res) => {
        const { nombre, descripcion, id_patologia, restriccion } = req.body;
        try {
            const [actualizados] = await Menu.update({
                plato_principal: nombre,
                guarnicion: descripcion || null,
                postre: id_patologia ? String(id_patologia) : restriccion || null,
            }, { where: { id: req.params.id } });
            if (!actualizados) return res.status(404).json({ success: false, error: 'Menú no encontrado' });
            res.json({ success: true, id: Number(req.params.id) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/menus/:id', async (req, res) => {
        try {
            const eliminados = await Menu.destroy({ where: { id: req.params.id } });
            if (!eliminados) return res.status(404).json({ success: false, error: 'Menú no encontrado' });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.get('/api/habitaciones', async (req, res) => {
        try {
            const habitaciones = await Habitacion.findAll({ order: [['id', 'DESC']] });
            res.json(habitaciones.map((habitacion) => ({
                id: habitacion.id,
                numero: habitacion.numero,
                capacidad: habitacion.capacidad,
                estado: habitacion.estado,
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/habitaciones', async (req, res) => {
        const { numero, capacidad, estado } = req.body;
        try {
            const habitacion = await Habitacion.create({ numero, capacidad: Number.parseInt(capacidad, 10), estado });
            res.json({ success: true, id: habitacion.id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/habitaciones/:id', async (req, res) => {
        const { numero, capacidad, estado } = req.body;
        try {
            const [actualizadas] = await Habitacion.update(
                { numero, capacidad: Number.parseInt(capacidad, 10), estado },
                { where: { id: req.params.id } }
            );
            if (!actualizadas) return res.status(404).json({ success: false, error: 'Habitación no encontrada' });
            res.json({ success: true, id: Number(req.params.id) });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/habitaciones/:id', async (req, res) => {
        try {
            const eliminadas = await Habitacion.destroy({ where: { id: req.params.id } });
            if (!eliminadas) return res.status(404).json({ success: false, error: 'Habitación no encontrada' });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
};
