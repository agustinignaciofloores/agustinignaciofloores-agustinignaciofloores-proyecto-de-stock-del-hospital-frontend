const { Op, fn, col, literal, where } = require('sequelize');

module.exports = function registerDoctorRoutes(app, { models }) {
    const { Medico, Paciente, Usuario, Persona, Turno, Receta, HistorialMedico, Donacion } = models;

    app.get('/api/medicos', async (req, res) => {
        try {
            const filtro = String(req.query.especialidad || '').trim();
            const medicos = await Medico.findAll({
                where: { activo: true, ...(filtro ? { especialidad: { [Op.iLike]: filtro } } : {}) },
                attributes: ['id', 'nombre', 'especialidad', 'consultorio', 'disponibilidad', 'horario_inicio', 'horario_fin'],
                order: filtro ? [['nombre', 'ASC']] : [['especialidad', 'ASC'], ['nombre', 'ASC']],
                raw: true,
            });
            res.json(medicos);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.get('/api/medicos/:especialidad', async (req, res) => {
        try {
            const medicos = await Medico.findAll({
                where: { activo: true, especialidad: { [Op.iLike]: req.params.especialidad } },
                attributes: ['id', 'nombre', 'especialidad', 'consultorio', 'disponibilidad', 'horario_inicio', 'horario_fin'],
                order: [['nombre', 'ASC']], raw: true,
            });
            res.json(medicos);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.get('/api/doctor/perfil', async (req, res) => {
        try {
            const doctor = await Medico.findOne({ where: { activo: true }, order: [['id', 'ASC']] });
            if (!doctor) return res.json({ nombre: 'Doctor', especialidad: 'Sin especialidad', nro_colegio: '-', consultorio: '-', horario: '-' });
            res.json({ id: doctor.id, nombre: doctor.nombre, especialidad: doctor.especialidad, nro_colegio: doctor.numero_colegio || '-', consultorio: doctor.consultorio || '-', horario: `${String(doctor.horario_inicio || '').slice(0, 5)} - ${String(doctor.horario_fin || '').slice(0, 5)}` });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.get('/api/doctor/resumen', async (req, res) => {
        try {
            const [pacientes, citas, recetas, historiales] = await Promise.all([
                Paciente.count(),
                Turno.count({ where: { fecha: literal('CURRENT_DATE') } }),
                Receta.count({ where: { estado: 'activa' } }),
                HistorialMedico.count(),
            ]);
            res.json({ total_pacientes: pacientes, citas_hoy: citas, recetas_pendientes: recetas, historiales_pendientes: historiales });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.get('/api/doctor/mis-pacientes', async (req, res) => {
        try {
            const pacientes = await Paciente.findAll({
                attributes: ['id', 'documento', 'fecha_nacimiento', [literal("EXTRACT(YEAR FROM AGE(COALESCE(\"Paciente\".fecha_nacimiento, CURRENT_DATE)))::int"), 'edad'], [literal("CASE WHEN COALESCE(\"usuario\".activo, TRUE) THEN 'Activo' ELSE 'Alta' END"), 'estado']],
                include: [{ model: Usuario, as: 'usuario', attributes: [], include: [{ model: Persona, as: 'persona', attributes: ['nombre', 'apellido'] }] }],
                order: [['id', 'DESC']], raw: true,
            });
            res.json(pacientes.map((p) => ({ ...p, nombre: p['usuario.persona.nombre'] ? `${p['usuario.persona.nombre']} ${p['usuario.persona.apellido']}` : p.documento })));
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/turnos', async (req, res) => {
        try {
            const turno = await Turno.create({ ...req.body, usuario_id: parseInt(req.body.usuario_id, 10), medico_id: parseInt(req.body.medico_id, 10) });
            res.json({ success: true, turno: turno.toJSON() });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.delete('/api/turnos/:id', async (req, res) => {
        try {
            const deleted = await Turno.destroy({ where: { id: parseInt(req.params.id, 10) } });
            if (!deleted) return res.status(404).json({ success: false, error: 'Turno no encontrado' });
            res.json({ success: true, id: parseInt(req.params.id, 10) });
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.get('/api/turnos/:usuario_id', async (req, res) => {
        const usuarioId = parseInt(req.params.usuario_id, 10);
        if (!Number.isInteger(usuarioId)) return res.json([]);
        try {
            const turnos = await Turno.findAll({ where: { usuario_id: usuarioId }, include: [{ model: Medico, as: 'medico', attributes: [['nombre', 'medico_nombre']] }], order: [['fecha', 'ASC'], ['hora', 'ASC']], raw: true, nest: true });
            res.json(turnos);
        } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/donaciones', async (req, res) => {
        try {
            const donacion = await Donacion.create({ tipo_donacion: req.body.tipo_donacion || 'sangre', nombre_donante: req.body.nombre_donante, documento: req.body.documento, fecha_donacion: literal('CURRENT_DATE'), grupo_sanguineo: req.body.grupo_sanguineo || null, estado: 'pendiente' });
            res.json({ success: true, id: donacion.id, fecha_nacimiento: req.body.fecha_nacimiento });
        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });
};
