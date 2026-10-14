const { Op } = require('sequelize');

module.exports = function registerGestionSequelizeRoutes(app, { models, ROLES_USUARIO }) {
    const { Persona, Usuario, Rol } = models;

    app.get('/api/usuarios/catalogo', async (req, res) => {
        try {
            const personas = await Persona.findAll({ include: [{ model: Usuario, as: 'usuarios', attributes: ['id'] }], order: [['apellido', 'ASC'], ['nombre', 'ASC']] });
            res.json({ success: true, roles: ROLES_USUARIO, personas: personas.map((p) => ({ id_persona: p.id, nombre: p.nombre, apellido: p.apellido, dni: p.dni, usuario_id: p.usuarios?.[0]?.id || null })) });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });

    app.get('/api/usuarios', async (req, res) => {
        try {
            const usuarios = await Usuario.findAll({ include: [{ model: Persona, as: 'persona', required: true, attributes: ['nombre', 'apellido', 'dni'] }], order: [['id', 'DESC']] });
            res.json(usuarios.map((u) => ({ id_usuario: u.id, id_persona: u.id_persona, usuario: u.usuario, rol: u.rol, activo: u.activo, nombre: u.persona?.nombre, apellido: u.persona?.apellido, dni: u.persona?.dni })));
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });

    app.post('/api/usuarios', async (req, res) => {
        const { id_persona, usuario, contraseña, rol, activo } = req.body;
        if (!id_persona || !usuario || !contraseña || !ROLES_USUARIO.includes(rol)) return res.status(400).json({ success: false, message: 'Datos de usuario inválidos' });
        try {
            if (await Usuario.findOne({ where: { id_persona } })) return res.status(409).json({ success: false, message: 'La persona ya tiene usuario' });
            const creado = await Usuario.create({ id_persona, usuario: usuario.trim(), contrasena: contraseña, rol, activo: activo !== false });
            res.json({ success: true, id_usuario: creado.id });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });

    app.put('/api/usuarios/:id', async (req, res) => {
        const { id_persona, usuario, contraseña, rol, activo } = req.body;
        if (!id_persona || !usuario || !ROLES_USUARIO.includes(rol)) return res.status(400).json({ success: false, message: 'Datos de usuario inválidos' });
        try {
            const payload = { id_persona, usuario: usuario.trim(), rol, activo: activo !== false };
            if (contraseña?.trim()) payload.contrasena = contraseña;
            const [cantidad] = await Usuario.update(payload, { where: { id: req.params.id } });
            if (!cantidad) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            res.json({ success: true, id_usuario: Number(req.params.id) });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });

    app.delete('/api/usuarios/:id', async (req, res) => {
        try { const cantidad = await Usuario.destroy({ where: { id: req.params.id } }); if (!cantidad) return res.status(404).json({ success: false, message: 'Usuario no encontrado' }); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });

    app.get('/api/personas', async (req, res) => {
        try { const personas = await Persona.findAll({ order: [['id', 'DESC']] }); res.json(personas.map((p) => ({ ...p.toJSON(), fecha_nac: p.fecha_nacimiento, discapacidad: p.tipo_discapacidad || 'Ninguna' }))); } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.post('/api/personas', async (req, res) => {
        try { const p = await Persona.create({ dni: req.body.dni, apellido: req.body.apellido, nombre: req.body.nombre, telefono: req.body.telefono, email: req.body.email, sexo: req.body.sexo, fecha_nacimiento: req.body.fecha_nac, estado_civil: req.body.estado_civil || 'No especifica', etnia: req.body.etnia, tiene_discapacidad: Boolean(req.body.discapacidad), tipo_discapacidad: req.body.discapacidad || null }); res.json({ success: true, id: p.id }); } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.put('/api/personas/:id', async (req, res) => {
        try { const [cantidad] = await Persona.update({ dni: req.body.dni, apellido: req.body.apellido, nombre: req.body.nombre, telefono: req.body.telefono, email: req.body.email, sexo: req.body.sexo, fecha_nacimiento: req.body.fecha_nac, estado_civil: req.body.estado_civil || 'No especifica', etnia: req.body.etnia, tiene_discapacidad: Boolean(req.body.discapacidad), tipo_discapacidad: req.body.discapacidad || null }, { where: { id: req.params.id } }); if (!cantidad) return res.status(404).json({ success: false, error: 'Persona no encontrada' }); res.json({ success: true, id: Number(req.params.id) }); } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.delete('/api/personas/:id', async (req, res) => {
        try { const cantidad = await Persona.destroy({ where: { id: req.params.id } }); if (!cantidad) return res.status(404).json({ success: false, error: 'Persona no encontrada' }); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.get('/api/roles', async (req, res) => { try { const roles = await Rol.findAll({ order: [['id', 'DESC']] }); res.json(roles.map((r) => ({ id: r.id, id_rol: r.id, nombre: r.nombre, descripcion: r.descripcion }))); } catch (err) { res.status(500).json({ error: err.message }); } });
    app.post('/api/roles', async (req, res) => { try { const r = await Rol.create({ nombre: req.body.nombre, descripcion: req.body.descripcion || null }); res.json({ success: true, id: r.id }); } catch (err) { res.status(500).json({ success: false, error: err.message }); } });
    app.put('/api/roles/:id', async (req, res) => { try { const [cantidad] = await Rol.update({ nombre: req.body.nombre, descripcion: req.body.descripcion || null }, { where: { id: req.params.id } }); if (!cantidad) return res.status(404).json({ success: false, error: 'Rol no encontrado' }); res.json({ success: true, id: Number(req.params.id) }); } catch (err) { res.status(500).json({ success: false, error: err.message }); } });
    app.delete('/api/roles/:id', async (req, res) => { try { const cantidad = await Rol.destroy({ where: { id: req.params.id } }); if (!cantidad) return res.status(404).json({ success: false, error: 'Rol no encontrado' }); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false, error: err.message }); } });
};
