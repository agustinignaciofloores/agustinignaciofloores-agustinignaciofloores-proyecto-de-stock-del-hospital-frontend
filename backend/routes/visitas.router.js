module.exports = function registerVisitasRoutes(
    app,
    { pool, models, getVisitasIdColumn, getPacientesIdColumn, syncVisitasPrimaryKeySequence }
) {
    const { Visita } = models;

    // CREAR VISITA: registra entrada y controla secuencia de PK para evitar duplicados.
    app.post('/api/visitas', async (req, res) => {
        const {
            paciente_id, visitante_nombre, visitante_documento,
            fecha_visita, hora_entrada, hora_salida, relacion, observaciones
        } = req.body;

        try {
            console.log('--- REGISTRANDO NUEVA VISITA ---');
            const visitasIdColumn = await getVisitasIdColumn();

            if (visitasIdColumn === 'id') {
                const nuevaVisita = await Visita.create({
                    paciente_id: parseInt(paciente_id),
                    visitante_nombre,
                    visitante_documento,
                    fecha_visita,
                    hora_entrada,
                    hora_salida,
                    relacion,
                    observaciones: observaciones || null,
                });

                return res.json({
                    success: true,
                    id: nuevaVisita.id,
                    message: '¡Visita guardada con éxito en la base de datos!',
                });
            }

            await syncVisitasPrimaryKeySequence();

            const query = `
                INSERT INTO visitas (paciente_id, visitante_nombre, visitante_documento, fecha_visita, hora_entrada, hora_salida, relacion, observaciones)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING ${visitasIdColumn} AS id;
            `;

            const values = [
                parseInt(paciente_id), visitante_nombre, visitante_documento,
                fecha_visita, hora_entrada, hora_salida, relacion, observaciones || null
            ];

            let result;
            try {
                result = await pool.query(query, values);
            } catch (insertError) {
                const isDuplicatePk = insertError?.code === '23505' && String(insertError?.constraint || '').includes('visitas_pkey');
                if (!isDuplicatePk) {
                    throw insertError;
                }

                await syncVisitasPrimaryKeySequence();
                result = await pool.query(query, values);
            }

            res.json({ success: true, id: result.rows[0]?.id, message: '¡Visita guardada con éxito en la base de datos!' });
        } catch (err) {
            console.error('ERROR AL GUARDAR VISITA:', err.message);
            res.status(500).json({ success: false, message: 'Error de inserción en pgAdmin: ' + err.message });
        }
    });

    // LISTAR POR PACIENTE: muestra visitas vinculadas a un paciente específico.
    app.get('/api/visitas/paciente/:paciente_id', async (req, res) => {
        const { paciente_id } = req.params;
        if (!paciente_id || paciente_id === 'undefined' || isNaN(parseInt(paciente_id))) {
            return res.json({ success: true, data: [] });
        }

        try {
            const visitasIdColumn = await getVisitasIdColumn();
            const pacientesIdColumn = await getPacientesIdColumn();
            const query = `
                SELECT
                    v.${visitasIdColumn} AS id,
                    v.paciente_id,
                    v.visitante_nombre,
                    v.visitante_documento,
                    v.fecha_visita,
                    v.hora_entrada,
                    v.hora_salida,
                    v.relacion,
                    v.observaciones,
                    COALESCE(NULLIF(TRIM(CONCAT(pe.nombre, ' ', pe.apellido)), ''), p.documento::text) AS paciente_nombre,
                    COALESCE(h.numero, 'Sin habitación') AS habitacion
                FROM visitas v
                LEFT JOIN pacientes p ON p.${pacientesIdColumn} = v.paciente_id
                LEFT JOIN usuarios u ON u.id_usuario = p.usuario_id
                LEFT JOIN personas pe ON pe.id_persona = u.id_persona
                LEFT JOIN LATERAL (
                    SELECT cama
                    FROM movimientos
                    WHERE paciente = p.${pacientesIdColumn}::text
                    ORDER BY fecha DESC
                    LIMIT 1
                ) mov ON TRUE
                LEFT JOIN habitaciones h ON h.numero = mov.cama
                WHERE v.paciente_id = $1
                ORDER BY v.fecha_visita DESC, v.hora_entrada DESC;
            `;
            const result = await pool.query(query, [parseInt(paciente_id)]);
            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error al consultar las visitas: ' + err.message });
        }
    });

    // LISTAR POR VISITANTE: alimenta la sección "Mis Visitas" del frontend.
    app.get('/api/visitas/visitante/:documento', async (req, res) => {
        const documento = String(req.params.documento || '').trim();
        if (!documento) {
            return res.json({ success: true, data: [] });
        }

        try {
            const visitasIdColumn = await getVisitasIdColumn();
            const pacientesIdColumn = await getPacientesIdColumn();
            const result = await pool.query(
                `SELECT
                    v.${visitasIdColumn} AS id,
                    v.paciente_id,
                    v.visitante_nombre,
                    v.visitante_documento,
                    v.fecha_visita,
                    v.hora_entrada,
                    v.hora_salida,
                    v.relacion,
                    v.observaciones,
                    COALESCE(NULLIF(TRIM(CONCAT(pe.nombre, ' ', pe.apellido)), ''), p.documento::text) AS paciente_nombre,
                    COALESCE(h.numero, 'Sin habitación') AS habitacion
                 FROM visitas v
                 LEFT JOIN pacientes p ON p.${pacientesIdColumn} = v.paciente_id
                 LEFT JOIN usuarios u ON u.id_usuario = p.usuario_id
                 LEFT JOIN personas pe ON pe.id_persona = u.id_persona
                 LEFT JOIN LATERAL (
                     SELECT cama
                     FROM movimientos
                     WHERE paciente = p.${pacientesIdColumn}::text
                     ORDER BY fecha DESC
                     LIMIT 1
                 ) mov ON TRUE
                 LEFT JOIN habitaciones h ON h.numero = mov.cama
                 WHERE v.visitante_documento::text = $1
                 ORDER BY v.fecha_visita DESC, v.hora_entrada DESC`,
                [documento]
            );

            res.json({ success: true, data: result.rows });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error al consultar visitas del visitante: ' + err.message });
        }
    });

    // FINALIZAR VISITA: fija hora_salida si aún no estaba registrada.
    app.put('/api/visitas/:id/finalizar', async (req, res) => {
        const visitaId = parseInt(req.params.id);
        if (Number.isNaN(visitaId)) {
            return res.status(400).json({ success: false, message: 'ID de visita inválido' });
        }

        try {
            const visitasIdColumn = await getVisitasIdColumn();
            const result = await pool.query(
                `UPDATE visitas
                 SET hora_salida = COALESCE(hora_salida, CURRENT_TIME)
                 WHERE ${visitasIdColumn} = $1
                 RETURNING ${visitasIdColumn} AS id, hora_salida`,
                [visitaId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Visita no encontrada' });
            }

            res.json({ success: true, id: result.rows[0].id, hora_salida: result.rows[0].hora_salida });
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error al finalizar visita: ' + err.message });
        }
    });
};
