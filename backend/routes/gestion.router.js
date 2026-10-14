// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA

const { Op } = require('sequelize');

module.exports = function registerGestionRoutes(
    app,
    { pool, models, ROLES_USUARIO, getRolesIdColumn }
) {
    const { Persona, Usuario, Rol } = models;

    // GESTIÓN DE USUARIOS
    app.get('/api/usuarios/catalogo', async (req, res) => {
        try {
            const personas = await Persona.findAll({
                attributes: ['id', 'nombre', 'apellido', 'dni'],
                include: [{
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['id'],
                    required: false,
                }],
                order: [['apellido', 'ASC'], ['nombre', 'ASC']],
            });

            const personasResult = personas.map((persona) => ({
                id_persona: persona.id,
                nombre: persona.nombre,
                apellido: persona.apellido,
                dni: persona.dni,
                usuario_id: persona.usuarios?.[0]?.id || null,
            }));

            res.json({
                success: true,
                roles: ROLES_USUARIO,
                personas: personasResult,
            });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    app.get('/api/usuarios', async (req, res) => {
        try {
            const usuarios = await Usuario.findAll({
                attributes: ['id', 'id_persona', 'usuario', 'rol', 'activo'],
                include: [{
                    model: Persona,
                    as: 'persona',
                    attributes: ['nombre', 'apellido', 'dni'],
                    required: true,
                }],
                order: [['id', 'DESC']],
            });

            res.json(usuarios.map((u) => ({
                id_usuario: u.id,
                id_persona: u.id_persona,
                usuario: u.usuario,
                rol: u.rol,
                activo: u.activo,
                nombre: u.persona?.nombre,
                apellido: u.persona?.apellido,
                dni: u.persona?.dni,
            })));
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    app.post('/api/usuarios', async (req, res) => {
        const { id_persona, usuario, contraseña, rol, activo } = req.body;

        if (!id_persona || !usuario || !contraseña || !rol) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios para crear el usuario' });
        }

        if (!ROLES_USUARIO.includes(rol)) {
            return res.status(400).json({ success: false, message: 'Rol de usuario inválido' });
        }

        try {
            const personaEnUso = await Usuario.findOne({
                where: { id_persona: parseInt(id_persona) },
                attributes: ['id'],
            });

            if (personaEnUso) {
                return res.status(409).json({ success: false, message: 'La persona seleccionada ya tiene un usuario asignado' });
            }

            const created = await Usuario.create({
                id_persona: parseInt(id_persona),
                usuario: usuario.trim(),
                contrasena: contraseña,
                rol,
                activo: activo !== false,
            });

            res.json({ success: true, id_usuario: created.id });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    app.put('/api/usuarios/:id', async (req, res) => {
        const { id } = req.params;
        const { id_persona, usuario, contraseña, rol, activo } = req.body;

        if (!id_persona || !usuario || !rol) {
            return res.status(400).json({ success: false, message: 'Faltan datos obligatorios para actualizar el usuario' });
        }

        if (!ROLES_USUARIO.includes(rol)) {
            return res.status(400).json({ success: false, message: 'Rol de usuario inválido' });
        }

        try {
            const personaEnUso = await Usuario.findOne({
                where: {
                    id_persona: parseInt(id_persona),
                    id: { [Op.ne]: parseInt(id) },
                },
                attributes: ['id'],
            });

            if (personaEnUso) {
                return res.status(409).json({ success: false, message: 'La persona seleccionada ya tiene otro usuario asignado' });
            }

            const payload = {
                id_persona: parseInt(id_persona),
                usuario: usuario.trim(),
                rol,
                activo: activo !== false,
            };

            if (contraseña && contraseña.trim()) {
                payload.contrasena = contraseña;
            }

            const [updatedCount] = await Usuario.update(payload, {
                where: { id: parseInt(id) },
            });

            if (updatedCount === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            res.json({ success: true, id_usuario: parseInt(id) });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    app.delete('/api/usuarios/:id', async (req, res) => {
        try {
            const deletedCount = await Usuario.destroy({ where: { id: parseInt(req.params.id) } });

            if (deletedCount === 0) {
                return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
            }

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    //  MÓDULO PERSONAS
    app.get('/api/personas', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    id_persona AS id,
                    dni,
                    apellido,
                    nombre,
                    telefono,
                    email,
                    sexo,
                    fecha_nacimiento AS fecha_nac,
                    estado_civil,
                    etnia,
                    COALESCE(NULLIF(tipo_discapacidad, ''), 'Ninguna') AS discapacidad,
                    activo
                FROM personas
                ORDER BY id_persona DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.post('/api/personas', async (req, res) => {
        const { dni, apellido, nombre, telefono, email, sexo, fecha_nac, estado_civil, etnia, discapacidad } = req.body;
        try {
            const result = await pool.query(
                `INSERT INTO personas (
                    dni, apellido, nombre, telefono, email, sexo, fecha_nacimiento,
                    estado_civil, etnia, tiene_discapacidad, tipo_discapacidad
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING id_persona AS id`,
                [
                    parseInt(dni),
                    apellido,
                    nombre,
                    telefono ? parseInt(telefono) : null,
                    email || null,
                    sexo,
                    fecha_nac,
                    estado_civil || 'No especifica',
                    etnia || null,
                    Boolean(discapacidad),
                    discapacidad || null,
                ]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/personas/:id', async (req, res) => {
        const { dni, apellido, nombre, telefono, email, sexo, fecha_nac, estado_civil, etnia, discapacidad } = req.body;
        try {
            const result = await pool.query(
                `UPDATE personas
                 SET dni = $1,
                     apellido = $2,
                     nombre = $3,
                     telefono = $4,
                     email = $5,
                     sexo = $6,
                     fecha_nacimiento = $7,
                     estado_civil = $8,
                     etnia = $9,
                     tiene_discapacidad = $10,
                     tipo_discapacidad = $11,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_persona = $12
                 RETURNING id_persona AS id`,
                [
                    parseInt(dni),
                    apellido,
                    nombre,
                    telefono ? parseInt(telefono) : null,
                    email || null,
                    sexo,
                    fecha_nac,
                    estado_civil || 'No especifica',
                    etnia || null,
                    Boolean(discapacidad),
                    discapacidad || null,
                    parseInt(req.params.id),
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Persona no encontrada' });
            }

            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/personas/:id', async (req, res) => {
        try {
            const result = await pool.query('DELETE FROM personas WHERE id_persona = $1 RETURNING id_persona AS id', [parseInt(req.params.id)]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Persona no encontrada' });
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    //  MÓDULO ROLES
    app.get('/api/roles', async (req, res) => {
        try {
            const rolesIdColumn = await getRolesIdColumn();

            if (rolesIdColumn === 'id') {
                const roles = await Rol.findAll({
                    attributes: ['id', 'nombre', 'descripcion'],
                    order: [['id', 'DESC']],
                });

                return res.json(roles.map((rol) => ({
                    id: rol.id,
                    id_rol: rol.id,
                    nombre: rol.nombre,
                    descripcion: rol.descripcion,
                })));
            }

            const result = await pool.query(`
                SELECT ${rolesIdColumn} AS id, ${rolesIdColumn} AS id_rol, nombre, descripcion
                FROM roles
                ORDER BY ${rolesIdColumn} DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/roles', async (req, res) => {
        const { nombre, descripcion } = req.body;
        try {
            const rolesIdColumn = await getRolesIdColumn();

            if (rolesIdColumn === 'id') {
                const created = await Rol.create({
                    nombre,
                    descripcion: descripcion || null,
                });
                return res.json({ success: true, id: created.id });
            }

            const result = await pool.query(
                `INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING ${rolesIdColumn} AS id`,
                [nombre, descripcion || null]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/roles/:id', async (req, res) => {
        const { nombre, descripcion } = req.body;
        try {
            const rolesIdColumn = await getRolesIdColumn();

            if (rolesIdColumn === 'id') {
                const [updatedCount] = await Rol.update(
                    { nombre, descripcion: descripcion || null },
                    { where: { id: parseInt(req.params.id) } }
                );

                if (updatedCount === 0) {
                    return res.status(404).json({ success: false, error: 'Rol no encontrado' });
                }

                return res.json({ success: true, id: parseInt(req.params.id) });
            }

            const result = await pool.query(
                `UPDATE roles SET nombre = $1, descripcion = $2 WHERE ${rolesIdColumn} = $3 RETURNING ${rolesIdColumn} AS id`,
                [nombre, descripcion || null, parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            }
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/roles/:id', async (req, res) => {
        try {
            const rolesIdColumn = await getRolesIdColumn();

            if (rolesIdColumn === 'id') {
                const deletedCount = await Rol.destroy({ where: { id: parseInt(req.params.id) } });
                if (deletedCount === 0) {
                    return res.status(404).json({ success: false, error: 'Rol no encontrado' });
                }
                return res.json({ success: true });
            }

            const result = await pool.query(`DELETE FROM roles WHERE ${rolesIdColumn} = $1 RETURNING ${rolesIdColumn} AS id`, [parseInt(req.params.id)]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
};
