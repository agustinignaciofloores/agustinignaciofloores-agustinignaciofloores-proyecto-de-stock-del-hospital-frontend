// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA

const express = require ('express'); // Framework web para crear el servidor y manejar rutas HTTP
const cors = require('cors'); // Permite solicitudes CORS desde el frontend (localhost:3000) para desarrollo local.
const pool = require('./db'); // Conexión a tu base de datos pgAdmin 4
const authRouter = require('./routes/auth.router'); // Rutas de autenticación y registro
const pacientesRouter = require('./routes/pacientes.router');// Rutas de pacientes
const visitasRouter = require('./routes/visitas.router');// Rutas de visitas
const visitasSequelizeRouter = require('./routes/visitas-sequelize.router');
const cocinaRouter = require('./routes/cocina.router');// Rutas de cocina
const almacenRouter = require('./routes/almacen.router');// Rutas de almacen/inventario
const almacenSequelizeRouter = require('./routes/almacen-sequelize.router');
const gestionRouter = require('./routes/gestion.router');// Rutas de gestion (usuarios/personas/roles)
const gestionSequelizeRouter = require('./routes/gestion-sequelize.router');
const pacientesSequelizeRouter = require('./routes/pacientes-sequelize.router');
const adminRouter = require('./routes/admin.router');// Rutas administrativas restantes
const doctorRouter = require('./routes/doctor.router');// Rutas de doctor y turnos
const createCompatHelpers = require('./compat');
const { initModels } = require('./models');

// Configuración del servidor Express
const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' }));
const models = initModels(pool.sequelize);
// Autenticación y registro extraídos a rutas dedicadas (backend/routes/auth.router.js).

// Catalogo centralizado de roles validos en el sistema.
const ROLES_USUARIO = ['admin', 'paciente', 'usuario', 'doctor', 'enfermero', 'cocinero', 'almacenero', 'visita', 'donacion'];

const {
    getRolesIdColumn,
    getPatologiasIdColumn,
    getPacientesIdColumn,
    getProductosIdColumn,
    getProveedoresIdColumn,
    getIngresosIdColumn,
    getMedicosIdColumn,
    getTurnosIdColumn,
    getMovimientosInventarioIdColumn,
    getDietasPacientesIdColumn,
    getVisitasIdColumn,
    syncVisitasPrimaryKeySequence,
    asegurarCompatibilidadSchema,
    asegurarMedicosDesdeUsuarios,
} = createCompatHelpers(pool);

authRouter(app, { pool, models });
gestionSequelizeRouter(app, { models, ROLES_USUARIO });
pacientesSequelizeRouter(app, { models });
visitasSequelizeRouter(app, { models });
pacientesRouter(app, {
    pool,
    models,
    getPacientesIdColumn,
    getPatologiasIdColumn
});
visitasRouter(app, {
    pool,
    models,
    getVisitasIdColumn,
    getPacientesIdColumn,
    syncVisitasPrimaryKeySequence
});
cocinaRouter(app, {
    pool,
    models,
    getPacientesIdColumn,
    getMedicosIdColumn,
    getDietasPacientesIdColumn
});
almacenSequelizeRouter(app, { models });
almacenRouter(app, {
    pool,
    models,
    getProductosIdColumn,
    getProveedoresIdColumn,
    getIngresosIdColumn,
    getMovimientosInventarioIdColumn,
});
gestionRouter(app, {
    pool,
    models,
    ROLES_USUARIO,
    getRolesIdColumn,
});

adminRouter(app, {
    pool,
    getRolesIdColumn,
    getPatologiasIdColumn,
});

doctorRouter(app, {
    models,
});

asegurarCompatibilidadSchema().finally(() => {
    app.listen(3001, () => console.log('Backend en puerto 3001 listo'));
});