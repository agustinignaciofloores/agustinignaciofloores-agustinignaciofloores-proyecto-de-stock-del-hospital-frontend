module.exports = function registerPacientesRoutes(app, { pool, models, getPacientesIdColumn, getPatologiasIdColumn }) {
    const { Paciente, Persona, Usuario, Patologia } = models;

    // LISTAR: devuelve pacientes con nombre completo y estado de ingreso.
    app.get('/api/pacientes', async (req, res) => {
        try {
            const pacientesIdColumn = await getPacientesIdColumn();
            const result = await pool.query(`
                SELECT
                    p.${pacientesIdColumn} AS id,
                    p.usuario_id,
                    u.id_persona,
                    p.documento,
                    p.fecha_nacimiento,
                    p.telefono,
                    p.email,
                    p.direccion,
                    p.ciudad,
                    p.obra_social,
                    COALESCE(NULLIF(TRIM(CONCAT(pe.nombre, ' ', pe.apellido)), ''), p.documento::text) AS nombre_completo,
                    p.documento AS historia_clinica,
                    COALESCE(p.obra_social, 'Sin obra social') AS patologia,
                    CASE WHEN COALESCE(u.activo, TRUE) THEN 'Ingresado' ELSE 'Alta' END AS estado
                FROM pacientes p
                LEFT JOIN usuarios u ON u.id_usuario = p.usuario_id
                LEFT JOIN personas pe ON pe.id_persona = u.id_persona
                ORDER BY p.${pacientesIdColumn} DESC
            `);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // CREAR: inserta paciente y enlaza con persona/usuario cuando corresponde.
    app.post('/api/pacientes', async (req, res) => {
        const {
            usuario_id, documento, fecha_nacimiento, telefono, email, direccion, ciudad,
            obra_social, numero_afiliado, id_persona, historia_clinica, id_patologia, estado_ingreso
        } = req.body;

        try {
            const pacientesIdColumn = await getPacientesIdColumn();
            const patologiasIdColumn = await getPatologiasIdColumn();
            let usuarioIdFinal = usuario_id ? parseInt(usuario_id) : null;
            let documentoFinal = documento || null;
            let obraSocialFinal = obra_social || null;

            if (id_persona) {
                const persona = await Persona.findByPk(parseInt(id_persona), {
                    attributes: ['dni'],
                });
                if (!persona) {
                    return res.status(404).json({ success: false, error: 'Persona no encontrada' });
                }

                documentoFinal = String(persona.dni);

                const usuarioPersona = await Usuario.findOne({
                    where: { id_persona: parseInt(id_persona) },
                    attributes: ['id'],
                });
                if (usuarioPersona) {
                    usuarioIdFinal = usuarioPersona.id;
                    if (estado_ingreso !== undefined) {
                        await usuarioPersona.update({
                            activo: estado_ingreso === true || estado_ingreso === 'true',
                        });
                    }
                }
            }

            if (id_patologia) {
                if (patologiasIdColumn === 'id') {
                    const patologia = await Patologia.findByPk(parseInt(id_patologia), { attributes: ['nombre'] });
                    obraSocialFinal = patologia?.nombre || obraSocialFinal;
                } else {
                    const patologiaResult = await pool.query(
                        `SELECT nombre FROM patologias WHERE ${patologiasIdColumn} = $1`,
                        [parseInt(id_patologia)]
                    );
                    obraSocialFinal = patologiaResult.rows[0]?.nombre || obraSocialFinal;
                }
            }

            if (pacientesIdColumn === 'id') {
                const paciente = await Paciente.create({
                    usuario_id: usuarioIdFinal,
                    documento: documentoFinal || historia_clinica || null,
                    fecha_nacimiento: fecha_nacimiento || null,
                    telefono: telefono || null,
                    email: email || null,
                    direccion: direccion || null,
                    ciudad: ciudad || null,
                    obra_social: obraSocialFinal,
                    numero_afiliado: numero_afiliado || null,
                });
                return res.json({ success: true, id: paciente.id });
            }

            const result = await pool.query(
                `INSERT INTO pacientes (usuario_id, documento, fecha_nacimiento, telefono, email, direccion, ciudad, obra_social)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING ${pacientesIdColumn} AS id`,
                [
                    usuarioIdFinal,
                    documentoFinal || historia_clinica || null,
                    fecha_nacimiento || null,
                    telefono || null,
                    email || null,
                    direccion || null,
                    ciudad || null,
                    obraSocialFinal
                ]
            );
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ACTUALIZAR: modifica datos clínico-administrativos del paciente.
    app.put('/api/pacientes/:id', async (req, res) => {
        const {
            usuario_id, documento, fecha_nacimiento, telefono, email, direccion, ciudad,
            obra_social, numero_afiliado, id_persona, historia_clinica, id_patologia, estado_ingreso
        } = req.body;

        try {
            const pacientesIdColumn = await getPacientesIdColumn();
            const patologiasIdColumn = await getPatologiasIdColumn();
            let usuarioIdFinal = usuario_id ? parseInt(usuario_id) : null;
            let documentoFinal = documento || null;
            let obraSocialFinal = obra_social || null;

            if (id_persona) {
                const persona = await Persona.findByPk(parseInt(id_persona), {
                    attributes: ['dni'],
                });
                if (!persona) {
                    return res.status(404).json({ success: false, error: 'Persona no encontrada' });
                }

                documentoFinal = String(persona.dni);

                const usuarioPersona = await Usuario.findOne({
                    where: { id_persona: parseInt(id_persona) },
                    attributes: ['id'],
                });
                if (usuarioPersona) {
                    usuarioIdFinal = usuarioPersona.id;
                    if (estado_ingreso !== undefined) {
                        await usuarioPersona.update({
                            activo: estado_ingreso === true || estado_ingreso === 'true',
                        });
                    }
                }
            }

            if (id_patologia) {
                if (patologiasIdColumn === 'id') {
                    const patologia = await Patologia.findByPk(parseInt(id_patologia), { attributes: ['nombre'] });
                    obraSocialFinal = patologia?.nombre || obraSocialFinal;
                } else {
                    const patologiaResult = await pool.query(
                        `SELECT nombre FROM patologias WHERE ${patologiasIdColumn} = $1`,
                        [parseInt(id_patologia)]
                    );
                    obraSocialFinal = patologiaResult.rows[0]?.nombre || obraSocialFinal;
                }
            }

            if (pacientesIdColumn === 'id') {
                const [updatedCount] = await Paciente.update(
                    {
                        usuario_id: usuarioIdFinal,
                        documento: documentoFinal || historia_clinica || null,
                        fecha_nacimiento: fecha_nacimiento || null,
                        telefono: telefono || null,
                        email: email || null,
                        direccion: direccion || null,
                        ciudad: ciudad || null,
                        obra_social: obraSocialFinal || null,
                        numero_afiliado: numero_afiliado || null,
                    },
                    { where: { id: parseInt(req.params.id) } }
                );

                if (updatedCount === 0) {
                    return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
                }

                return res.json({ success: true, id: parseInt(req.params.id) });
            }

            const result = await pool.query(
                `UPDATE pacientes
                 SET usuario_id = $1,
                     documento = $2,
                     fecha_nacimiento = $3,
                     telefono = $4,
                     email = $5,
                     direccion = $6,
                     ciudad = $7,
                     obra_social = $8
                 WHERE ${pacientesIdColumn} = $9
                 RETURNING ${pacientesIdColumn} AS id`,
                [
                    usuarioIdFinal,
                    documentoFinal || historia_clinica || null,
                    fecha_nacimiento || null,
                    telefono || null,
                    email || null,
                    direccion || null,
                    ciudad || null,
                    obraSocialFinal || null,
                    parseInt(req.params.id)
                ]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
            }
            res.json({ success: true, id: result.rows[0].id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // ELIMINAR: borra un paciente por ID (compatible con esquemas legacy).
    app.delete('/api/pacientes/:id', async (req, res) => {
        try {
            const pacientesIdColumn = await getPacientesIdColumn();

            if (pacientesIdColumn === 'id') {
                const deletedCount = await Paciente.destroy({ where: { id: parseInt(req.params.id) } });
                if (deletedCount === 0) {
                    return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
                }
                return res.json({ success: true });
            }

            const result = await pool.query(
                `DELETE FROM pacientes WHERE ${pacientesIdColumn} = $1 RETURNING ${pacientesIdColumn} AS id`,
                [parseInt(req.params.id)]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Paciente no encontrado' });
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });

    // BUSCAR: usado por visitas y UI para encontrar por DNI o nombre.
    app.get('/api/pacientes/buscar', async (req, res) => {
        const textoBusqueda = String(req.query.query || req.query.dni || '').trim();
        try {
            if (!textoBusqueda) {
                return res.json([]);
            }

            const pacientesIdColumn = await getPacientesIdColumn();
            const result = await pool.query(
                `SELECT
                    p.${pacientesIdColumn} AS id,
                    p.documento,
                    p.obra_social,
                    COALESCE(NULLIF(TRIM(CONCAT(pe.nombre, ' ', pe.apellido)), ''), p.documento::text) AS nombre
                 FROM pacientes p
                 LEFT JOIN usuarios u ON u.id_usuario = p.usuario_id
                 LEFT JOIN personas pe ON pe.id_persona = u.id_persona
                 WHERE p.documento::text ILIKE $1
                    OR CONCAT(COALESCE(pe.nombre, ''), ' ', COALESCE(pe.apellido, '')) ILIKE $1
                 ORDER BY p.${pacientesIdColumn} DESC
                 LIMIT 20`,
                [`%${textoBusqueda}%`]
            );
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
};
