module.exports = function registerVisitasSequelizeRoutes(app, { models }) {
    const { Visita, Paciente } = models;

    const incluirPaciente = { model: Paciente, as: 'paciente', attributes: ['documento'] };
    const respuesta = (visita) => ({ ...visita.toJSON(), paciente_nombre: visita.paciente?.documento || 'Sin paciente', habitacion: 'Sin habitación' });

    app.post('/api/visitas', async (req, res) => {
        try { const visita = await Visita.create({ ...req.body, paciente_id: parseInt(req.body.paciente_id, 10) }); res.json({ success: true, id: visita.id, message: '¡Visita guardada con éxito en la base de datos!' }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
    app.get('/api/visitas/paciente/:paciente_id', async (req, res) => {
        try { const visitas = await Visita.findAll({ where: { paciente_id: parseInt(req.params.paciente_id, 10) }, include: [incluirPaciente], order: [['fecha_visita', 'DESC'], ['hora_entrada', 'DESC']] }); res.json({ success: true, data: visitas.map(respuesta) }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
    app.get('/api/visitas/visitante/:documento', async (req, res) => {
        try { const visitas = await Visita.findAll({ where: { visitante_documento: req.params.documento }, include: [incluirPaciente], order: [['fecha_visita', 'DESC'], ['hora_entrada', 'DESC']] }); res.json({ success: true, data: visitas.map(respuesta) }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
    app.put('/api/visitas/:id/finalizar', async (req, res) => {
        try { const visita = await Visita.findByPk(req.params.id); if (!visita) return res.status(404).json({ success: false, message: 'Visita no encontrada' }); if (!visita.hora_salida) { visita.hora_salida = new Date().toTimeString().slice(0, 8); await visita.save({ fields: ['hora_salida'] }); } res.json({ success: true, id: visita.id, hora_salida: visita.hora_salida }); } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    });
};
