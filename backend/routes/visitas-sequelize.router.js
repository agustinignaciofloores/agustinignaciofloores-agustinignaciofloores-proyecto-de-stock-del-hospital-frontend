module.exports = function registerVisitasSequelizeRoutes(app, { models }) {
    const { Visita, Paciente, Usuario, Persona, MovimientoPaciente, Habitacion } = models;

    const incluirPaciente = {
        model: Paciente,
        as: 'paciente',
        attributes: ['id', 'documento'],
        include: [{
            model: Usuario,
            as: 'usuario',
            attributes: ['id'],
            include: [{ model: Persona, as: 'persona', attributes: ['nombre', 'apellido'] }],
        }],
    };
    const respuesta = async (visita) => {
        const datos = visita.toJSON();
        const paciente = visita.paciente;
        const persona = paciente?.usuario?.persona;
        const movimiento = paciente
            ? await MovimientoPaciente.findOne({
                where: { paciente: String(paciente.id) },
                attributes: ['cama'],
                order: [['fecha', 'DESC']],
            })
            : null;
        const habitacion = movimiento?.cama
            ? await Habitacion.findOne({ where: { numero: movimiento.cama }, attributes: ['numero'] })
            : null;
        delete datos.paciente;
        return {
            ...datos,
            paciente_nombre: persona
                ? `${persona.nombre} ${persona.apellido}`.trim()
                : paciente?.documento || 'Sin paciente',
            habitacion: habitacion?.numero || 'Sin habitación',
        };
    };

    app.post('/api/visitas', async (req, res) => {
        try { const visita = await Visita.create({ ...req.body, paciente_id: parseInt(req.body.paciente_id, 10) }); res.json({ success: true, id: visita.id, message: '¡Visita guardada con éxito en la base de datos!' }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
    app.get('/api/visitas/paciente/:paciente_id', async (req, res) => {
        const pacienteId = Number.parseInt(req.params.paciente_id, 10);
        if (!Number.isInteger(pacienteId)) return res.json({ success: true, data: [] });
        try { const visitas = await Visita.findAll({ where: { paciente_id: pacienteId }, include: [incluirPaciente], order: [['fecha_visita', 'DESC'], ['hora_entrada', 'DESC']] }); res.json({ success: true, data: await Promise.all(visitas.map(respuesta)) }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
    app.get('/api/visitas/visitante/:documento', async (req, res) => {
        const documento = String(req.params.documento || '').trim();
        if (!documento) return res.json({ success: true, data: [] });
        try { const visitas = await Visita.findAll({ where: { visitante_documento: documento }, include: [incluirPaciente], order: [['fecha_visita', 'DESC'], ['hora_entrada', 'DESC']] }); res.json({ success: true, data: await Promise.all(visitas.map(respuesta)) }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
    app.put('/api/visitas/:id/finalizar', async (req, res) => {
        const visitaId = Number.parseInt(req.params.id, 10);
        if (!Number.isInteger(visitaId)) return res.status(400).json({ success: false, message: 'ID de visita inválido' });
        try { const visita = await Visita.findByPk(visitaId); if (!visita) return res.status(404).json({ success: false, message: 'Visita no encontrada' }); if (!visita.hora_salida) { visita.hora_salida = new Date().toTimeString().slice(0, 8); await visita.save({ fields: ['hora_salida'] }); } res.json({ success: true, id: visita.id, hora_salida: visita.hora_salida }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
};
