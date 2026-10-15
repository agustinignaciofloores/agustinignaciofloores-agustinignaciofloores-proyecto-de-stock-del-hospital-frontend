// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA

const express = require ('express'); // Framework web para crear el servidor y manejar rutas HTTP
const cors = require('cors'); // Permite solicitudes CORS desde el frontend (localhost:3000) para desarrollo local.
const pool = require('./db'); // Conexión a tu base de datos pgAdmin 4
const authRouter = require('./routes/auth.router'); // Rutas de autenticación y registro
const pacientesRouter = require('./routes/pacientes.router');// Rutas de pacientes
const visitasRouter = require('./routes/visitas.router');// Rutas de visitas
const cocinaRouter = require('./routes/cocina.router');// Rutas de cocina
const almacenRouter = require('./routes/almacen.router');// Rutas de almacen/inventario
const gestionRouter = require('./routes/gestion.router');// Rutas de gestion (usuarios/personas/roles)
const adminRouter = require('./routes/admin.router');// Rutas administrativas restantes
const doctorRouter = require('./routes/doctor.router');// Rutas de doctor y turnos
const createCompatHelpers = require('./compat');
const { initModels } = require('./models');

// Configuración del servidor Express
const app = express();
// Permite solicitudes CORS desde el frontend (localhost:3000) para desarrollo local.
app.use(cors());
// Permite recibir datos JSON en las solicitudes HTTP con un límite de tamaño de 8 MB.
app.use(express.json({ limit: '8mb' }));
// Inicializa los modelos Sequelize y los asocia con la conexión a la base de datos.
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
gestionRouter(app, { models, ROLES_USUARIO });
pacientesRouter(app, { models });
visitasRouter(app, { models });
cocinaRouter(app, {
    pool,
    models,
    getPacientesIdColumn,
    getMedicosIdColumn,
    getDietasPacientesIdColumn
});
almacenRouter(app, { models });

adminRouter(app, { models });

doctorRouter(app, {
    models,
});

asegurarCompatibilidadSchema().finally(() => {
    app.listen(3001, () => console.log('Backend en puerto 3001 listo'));
});