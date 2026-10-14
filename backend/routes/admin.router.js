// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA - RUTAS DE ADMINISTRACIÓN
module.exports = function registerAdminRoutes(app, { pool, getRolesIdColumn, getPatologiasIdColumn }) {
    //  MÓDULO PERSONAL (JOIN CON PERSONAS Y ROLES)
    app.get('/api/personal', async (req, res) => {
        try {
            const rolesIdColumn = await getRolesIdColumn();
            const result = await pool.query(`
                SELECT 
                    u.id_usuario AS id, 
                    u.id_persona,
                    pe.nombre, 
                    pe.apellido, 
                    pe.dni, 
                    r.${rolesIdColumn} AS id_rol,
                    COALESCE(r.nombre, u.rol) AS rol_nombre, 
                    CONCAT(pe.nombre, ' ', pe.apellido) AS nombre_completo,
                    u.activo 
                FROM usuarios u
                JOIN personas pe ON u.id_persona = pe.id_persona
                LEFT JOIN roles r ON LOWER(TRIM(u.rol)) = LOWER(TRIM(r.nombre))
                ORDER BY u.id_usuario DESC;
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/personal', async (req, res) => {
        const { id_persona, id_rol, activo } = req.body;
        try {
            const rolesIdColumn = await getRolesIdColumn();
            const rolResult = await pool.query(`SELECT nombre FROM roles WHERE ${rolesIdColumn} = $1`, [parseInt(id_rol)]);
            if (rolResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            }

            const usuarioResult = await pool.query(
                'SELECT id_usuario FROM usuarios WHERE id_persona = $1',
                [parseInt(id_persona)]
            );

            if (usuarioResult.rows.length === 0) {
                return res.status(400).json({ success: false, error: 'La persona seleccionada no tiene usuario asociado. Creala desde Gestión de Usuarios.' });
            }

            const result = await pool.query(
                `UPDATE usuarios
                 SET rol = $1,
                     activo = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_usuario = $3
                 RETURNING id_usuario AS id`,
                [rolResult.rows[0].nombre, activo !== false, usuarioResult.rows[0].id_usuario]
            );

            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/personal/:id', async (req, res) => {
        const { id_rol, activo } = req.body;
        try {
            const rolesIdColumn = await getRolesIdColumn();
            const rolResult = await pool.query(`SELECT nombre FROM roles WHERE ${rolesIdColumn} = $1`, [parseInt(id_rol)]);
            if (rolResult.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Rol no encontrado' });
            }

            const result = await pool.query(
                `UPDATE usuarios
                 SET rol = $1,
                     activo = $2,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id_usuario = $3
                 RETURNING id_usuario AS id`,
                [rolResult.rows[0].nombre, activo !== false, parseInt(req.params.id)]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Personal no encontrado' });
            }

            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/personal/:id', async (req, res) => {
        try {
            const result = await pool.query(
                'DELETE FROM usuarios WHERE id_usuario = $1 RETURNING id_usuario AS id',
                [parseInt(req.params.id)]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Personal no encontrado' });
            }

            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    //  MÓDULO PATOLOGÍAS
    app.get('/api/patologias', async (req, res) => {
        try {
            const patologiasIdColumn = await getPatologiasIdColumn();
            const result = await pool.query(`
                SELECT ${patologiasIdColumn} AS id, nombre, descripcion, false AS es_discapacidad
                FROM patologias
                ORDER BY ${patologiasIdColumn} DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/patologias', async (req, res) => {
        const { nombre, descripcion } = req.body;
        try {
            const patologiasIdColumn = await getPatologiasIdColumn();
            const result = await pool.query(
                `INSERT INTO patologias (nombre, descripcion) VALUES ($1, $2) RETURNING ${patologiasIdColumn} AS id`,
                [nombre, descripcion || null]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.put('/api/patologias/:id', async (req, res) => {
        const { nombre, descripcion } = req.body;
        try {
            const patologiasIdColumn = await getPatologiasIdColumn();
            const result = await pool.query(
                `UPDATE patologias
                 SET nombre = $1, descripcion = $2
                 WHERE ${patologiasIdColumn} = $3
                 RETURNING ${patologiasIdColumn} AS id`,
                [nombre, descripcion || null, parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Patología no encontrada' });
            }
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    app.delete('/api/patologias/:id', async (req, res) => {
        try {
            const patologiasIdColumn = await getPatologiasIdColumn();
            const result = await pool.query(
                `DELETE FROM patologias WHERE ${patologiasIdColumn} = $1 RETURNING ${patologiasIdColumn} AS id`,
                [parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Patología no encontrada' });
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    //  MÓDULO MOVIMIENTOS
    app.get('/api/movimientos', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT
                    m.id_movimiento AS id,
                    m.paciente AS id_paciente,
                    m.tipo,
                    m.cama AS nro_cama,
                    m.piso,
                    m.fecha,
                    m.personal AS id_personal,
                    COALESCE(NULLIF(TRIM(CONCAT(pp.nombre, ' ', pp.apellido)), ''), m.paciente) AS paciente_nombre,
                    COALESCE(NULLIF(TRIM(CONCAT(pe.nombre, ' ', pe.apellido)), ''), m.personal) AS personal_nombre
                FROM movimientos m
                LEFT JOIN pacientes p ON p.id_pacientes::text = m.paciente
                LEFT JOIN usuarios up ON up.id_usuario = p.usuario_id
                LEFT JOIN personas pp ON pp.id_persona = up.id_persona
                LEFT JOIN usuarios u ON u.id_usuario::text = m.personal
                LEFT JOIN personas pe ON pe.id_persona = u.id_persona
                ORDER BY m.id_movimiento DESC
            `);
            res.json(result.rows);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/movimientos', async (req, res) => {
        const { id_paciente, tipo, nro_cama, piso, id_personal } = req.body;
        try {
            await pool.query(
                `INSERT INTO movimientos (paciente, tipo, cama, piso, fecha, personal) 
                 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`, 
                [String(id_paciente), tipo, nro_cama || null, piso || null, id_personal ? String(id_personal) : null]
            );
            res.json({ success: true });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.put('/api/movimientos/:id', async (req, res) => {
        const { id_paciente, tipo, nro_cama, piso, id_personal } = req.body;
        try {
            const result = await pool.query(
                `UPDATE movimientos
                 SET paciente = $1,
                     tipo = $2,
                     cama = $3,
                     piso = $4,
                     personal = $5,
                     fecha = CURRENT_TIMESTAMP
                 WHERE id_movimiento = $6
                 RETURNING id_movimiento AS id`,
                [String(id_paciente), tipo, nro_cama || null, piso || null, id_personal ? String(id_personal) : null, parseInt(req.params.id)]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
            }

            res.json({ success: true, id: result.rows[0].id });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.delete('/api/movimientos/:id', async (req, res) => {
        try {
            const result = await pool.query(
                'DELETE FROM movimientos WHERE id_movimiento = $1 RETURNING id_movimiento AS id',
                [parseInt(req.params.id)]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
            }

            res.json({ success: true });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    //  MÓDULO MENÚS
    app.get('/api/menus', async (req, res) => {
        try {
            const patologiasIdColumn = await getPatologiasIdColumn();
            const result = await pool.query(`
                SELECT
                    m.id_menus AS id,
                    m.plato_principal AS nombre,
                    m.guarnicion AS descripcion,
                    CASE WHEN COALESCE(m.postre, '') ~ '^\\d+$' THEN m.postre::int ELSE NULL END AS id_patologia,
                    CASE
                        WHEN COALESCE(m.postre, '') ~ '^\\d+$'
                        THEN (SELECT nombre FROM patologias WHERE ${patologiasIdColumn} = m.postre::int)
                        ELSE m.postre
                    END AS patologia_nombre
                FROM menus m
                ORDER BY m.id_menus DESC
            `);
            res.json(result.rows);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/menus', async (req, res) => {
        const { nombre, descripcion, id_patologia, restriccion } = req.body;
        try {
            const nextDateResult = await pool.query(`
                SELECT COALESCE(MAX(fecha), CURRENT_DATE - INTERVAL '1 day') + INTERVAL '1 day' AS next_fecha
                FROM menus
            `);
            const postreVal = id_patologia ? String(id_patologia) : (restriccion || null);
            const result = await pool.query(
                `INSERT INTO menus (fecha, turno, plato_principal, guarnicion, postre)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id_menus AS id`,
                [nextDateResult.rows[0].next_fecha, 'almuerzo', nombre, descripcion || null, postreVal]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.put('/api/menus/:id', async (req, res) => {
        const { nombre, descripcion, id_patologia, restriccion } = req.body;
        try {
            const postreVal = id_patologia ? String(id_patologia) : (restriccion || null);
            const result = await pool.query(
                'UPDATE menus SET plato_principal = $1, guarnicion = $2, postre = $3 WHERE id_menus = $4 RETURNING id_menus AS id',
                [nombre, descripcion || null, postreVal, parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Menú no encontrado' });
            }
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.delete('/api/menus/:id', async (req, res) => {
        try {
            const result = await pool.query('DELETE FROM menus WHERE id_menus = $1 RETURNING id_menus AS id', [parseInt(req.params.id)]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Menú no encontrado' });
            }
            res.json({ success: true });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    //  MÓDULO HABITACIONES
    app.get('/api/habitaciones', async (req, res) => {
        try {
            const result = await pool.query('SELECT id_habitacion AS id, numero, capacidad, estado FROM habitaciones ORDER BY id_habitacion DESC');
            res.json(result.rows);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/habitaciones', async (req, res) => {
        const { numero, capacidad, estado } = req.body;
        try {
            const result = await pool.query(
                'INSERT INTO habitaciones (numero, capacidad, estado) VALUES ($1, $2, $3) RETURNING id_habitacion AS id',
                [numero, parseInt(capacidad), estado]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.put('/api/habitaciones/:id', async (req, res) => {
        const { numero, capacidad, estado } = req.body;
        try {
            const result = await pool.query(
                'UPDATE habitaciones SET numero = $1, capacidad = $2, estado = $3 WHERE id_habitacion = $4 RETURNING id_habitacion AS id',
                [numero, parseInt(capacidad), estado, parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Habitación no encontrada' });
            }
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.delete('/api/habitaciones/:id', async (req, res) => {
        try {
            const result = await pool.query('DELETE FROM habitaciones WHERE id_habitacion = $1 RETURNING id_habitacion AS id', [parseInt(req.params.id)]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Habitación no encontrada' });
            }
            res.json({ success: true });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });
};
