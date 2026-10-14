const { Op, fn, col, literal, where } = require('sequelize');

module.exports = function registerCocinaRoutes(app, { models }) {
    const { Menu, DietaPaciente, Usuario, Paciente, Medico } = models;

    app.get('/api/cocina/resumen', async (req, res) => {
        try {
            const hoy = literal('CURRENT_DATE');
            const [menus, dietas, preparacion, entregas, personal] = await Promise.all([
                Menu.count({ where: where(col('fecha'), '=', hoy) }),
                DietaPaciente.count({ where: where(fn('COALESCE', col('fecha_fin'), hoy), '>=', hoy) }),
                Menu.count({ where: { fecha: hoy, turno: { [Op.ne]: null } } }),
                DietaPaciente.count({ where: where(fn('COALESCE', col('fecha_inicio'), hoy), '<=', hoy) }),
                Usuario.count({ where: { rol: 'cocinero', activo: true } }),
            ]);
            res.json({ menus_hoy: menus, dietas_especiales: dietas, en_preparacion: preparacion, entregas_realizadas: entregas, personal_disponible: personal });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/cocina/menus', async (req, res) => {
        try {
            const menus = await Menu.findAll({
                attributes: ['fecha', 'turno', 'plato_principal', [fn('COALESCE', col('raciones_previstas'), 0), 'raciones'], [literal("CASE WHEN fecha = CURRENT_DATE THEN 'activo' ELSE 'programado' END"), 'estado']],
                order: [['fecha', 'DESC'], ['turno', 'ASC']],
                raw: true,
            });
            res.json(menus);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.get('/api/cocina/dietas', async (req, res) => {
        try {
            const dietas = await DietaPaciente.findAll({
                attributes: ['id', 'tipo_dieta', 'restricciones', 'fecha_inicio', 'observaciones'],
                include: [
                    { model: Paciente, as: 'paciente', attributes: ['documento'] },
                    { model: Medico, as: 'medico', attributes: ['nombre'] },
                ],
                order: [['id', 'DESC']],
            });
            res.json(dietas.map((dieta) => ({
                id: dieta.id,
                paciente: dieta.paciente?.documento || 'Sin paciente',
                habitacion: 'Sin habitación',
                tipo_dieta: dieta.tipo_dieta || 'Normal',
                restricciones: dieta.restricciones || '-',
                medico: dieta.medico?.nombre || 'Sin médico',
                fecha_inicio: dieta.fecha_inicio,
                observaciones: dieta.observaciones,
            })));
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    app.post('/api/cocina/dietas/:id/entregada', async (req, res) => {
        try {
            const dieta = await DietaPaciente.findByPk(parseInt(req.params.id, 10));
            if (!dieta) return res.status(404).json({ success: false, error: 'Dieta no encontrada' });
            const marca = `Entregada ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
            dieta.observaciones = dieta.observaciones ? `${dieta.observaciones} | ${marca}` : marca;
            await dieta.save({ fields: ['observaciones'] });
            res.json({ success: true, id: dieta.id });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    });
};
