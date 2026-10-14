const { Op, literal } = require('sequelize');

module.exports = function registerPacientesSequelizeRoutes(app, { models }) {
    const { Paciente, Persona, Usuario, Patologia } = models;
    const datosPaciente = (body, usuarioId, documento, obraSocial) => ({ usuario_id: usuarioId, documento: documento || body.historia_clinica, fecha_nacimiento: body.fecha_nacimiento || null, telefono: body.telefono || null, email: body.email || null, direccion: body.direccion || null, ciudad: body.ciudad || null, obra_social: obraSocial || body.obra_social || null, numero_afiliado: body.numero_afiliado || null });

    app.get('/api/pacientes', async (req, res) => {
        try { const pacientes = await Paciente.findAll({ include: [{ model: Usuario, as: 'usuario', include: [{ model: Persona, as: 'persona' }] }], order: [['id', 'DESC']] }); res.json(pacientes.map((p) => ({ ...p.toJSON(), nombre_completo: p.usuario?.persona ? `${p.usuario.persona.nombre} ${p.usuario.persona.apellido}`.trim() : p.documento, historia_clinica: p.documento, patologia: p.obra_social || 'Sin obra social', estado: p.usuario?.activo === false ? 'Alta' : 'Ingresado', id_persona: p.usuario?.id_persona || null }))); } catch (err) { res.status(500).json({ error: err.message }); }
    });

    app.post('/api/pacientes', async (req, res) => {
        try { let usuarioId = req.body.usuario_id || null; let documento = req.body.documento; let obraSocial = req.body.obra_social; if (req.body.id_persona) { const persona = await Persona.findByPk(req.body.id_persona); if (!persona) return res.status(404).json({ success: false, error: 'Persona no encontrada' }); documento = persona.dni; const usuario = await Usuario.findOne({ where: { id_persona: req.body.id_persona } }); usuarioId = usuario?.id || usuarioId; if (usuario && req.body.estado_ingreso !== undefined) await usuario.update({ activo: req.body.estado_ingreso === true || req.body.estado_ingreso === 'true' }); } if (req.body.id_patologia) { const patologia = await Patologia.findByPk(req.body.id_patologia); obraSocial = patologia?.nombre || obraSocial; } const paciente = await Paciente.create(datosPaciente(req.body, usuarioId, documento, obraSocial)); res.json({ success: true, id: paciente.id }); } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });

    app.put('/api/pacientes/:id', async (req, res) => {
        try { const [cantidad] = await Paciente.update(datosPaciente(req.body, req.body.usuario_id || null, req.body.documento, req.body.obra_social), { where: { id: req.params.id } }); if (!cantidad) return res.status(404).json({ success: false, error: 'Paciente no encontrado' }); res.json({ success: true, id: Number(req.params.id) }); } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    });
    app.delete('/api/pacientes/:id', async (req, res) => { try { const cantidad = await Paciente.destroy({ where: { id: req.params.id } }); if (!cantidad) return res.status(404).json({ success: false, error: 'Paciente no encontrado' }); res.json({ success: true }); } catch (err) { res.status(500).json({ success: false, error: err.message }); } });
    app.get('/api/pacientes/buscar', async (req, res) => { const texto = String(req.query.query || req.query.dni || '').trim(); if (!texto) return res.json([]); try { const pacientes = await Paciente.findAll({ where: { [Op.or]: [{ documento: { [Op.iLike]: `%${texto}%` } }, { '$usuario.persona.nombre$': { [Op.iLike]: `%${texto}%` } }, { '$usuario.persona.apellido$': { [Op.iLike]: `%${texto}%` } }] }, include: [{ model: Usuario, as: 'usuario', include: [{ model: Persona, as: 'persona' }] }], limit: 20, order: [['id', 'DESC']] }); res.json(pacientes.map((p) => ({ id: p.id, documento: p.documento, obra_social: p.obra_social, nombre: p.usuario?.persona ? `${p.usuario.persona.nombre} ${p.usuario.persona.apellido}`.trim() : p.documento }))); } catch (err) { res.status(500).json({ error: err.message }); } });
};
