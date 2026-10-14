// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA - MODELOS DE BASE DE DATOS
const makeDireccion = require('./direccion.model');
const makePersona = require('./persona.model');
const makeUsuario = require('./usuario.model');
const makePaciente = require('./paciente.model');
const makePatologia = require('./patologia.model');
const makeVisita = require('./visita.model');
const makeRol = require('./rol.model');
const makeProducto = require('./producto.model');
const makeProveedor = require('./proveedor.model');
const makeMovimientoInventario = require('./movimiento-inventario.model');
const makeIngresoAlmacen = require('./ingreso-almacen.model');
const makeDetalleIngresoAlmacen = require('./detalle-ingreso-almacen.model');
const makePais = require('./pais.model');
const makeProvincia = require('./provincia.model');
const makeLocalidad = require('./localidad.model');
const makeMedico = require('./medico.model');
const makeTurno = require('./turno.model');
const makeHistorialMedico = require('./historial-medico.model');
const makeMenu = require('./menu.model');
const makeDietaPaciente = require('./dieta-paciente.model');
const makeReceta = require('./receta.model');
const makeDetalleReceta = require('./detalle-receta.model');
const makeDonacion = require('./donacion.model');
const makeHabitacion = require('./habitacion.model');
const makeMovimientoPaciente = require('./movimiento-paciente.model');

let cached = null;

function initModels(sequelize) {
    if (cached) {
        return cached;
    }

    const Direccion = makeDireccion(sequelize);
    const Persona = makePersona(sequelize);
    const Usuario = makeUsuario(sequelize);
    const Paciente = makePaciente(sequelize);
    const Patologia = makePatologia(sequelize);
    const Visita = makeVisita(sequelize);
    const Rol = makeRol(sequelize);
    const Producto = makeProducto(sequelize);
    const Proveedor = makeProveedor(sequelize);
    const MovimientoInventario = makeMovimientoInventario(sequelize);
    const IngresoAlmacen = makeIngresoAlmacen(sequelize);
    const DetalleIngresoAlmacen = makeDetalleIngresoAlmacen(sequelize);
    const Pais = makePais(sequelize);
    const Provincia = makeProvincia(sequelize);
    const Localidad = makeLocalidad(sequelize);
    const Medico = makeMedico(sequelize);
    const Turno = makeTurno(sequelize);
    const HistorialMedico = makeHistorialMedico(sequelize);
    const Menu = makeMenu(sequelize);
    const DietaPaciente = makeDietaPaciente(sequelize);
    const Receta = makeReceta(sequelize);
    const DetalleReceta = makeDetalleReceta(sequelize);
    const Donacion = makeDonacion(sequelize);
    const Habitacion = makeHabitacion(sequelize);
    const MovimientoPaciente = makeMovimientoPaciente(sequelize);

    Persona.belongsTo(Direccion, { foreignKey: 'id_direccion', as: 'direccion' });
    Direccion.hasMany(Persona, { foreignKey: 'id_direccion', as: 'personas' });

    Usuario.belongsTo(Persona, { foreignKey: 'id_persona', as: 'persona' });
    Persona.hasMany(Usuario, { foreignKey: 'id_persona', as: 'usuarios' });

    Paciente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    Usuario.hasMany(Paciente, { foreignKey: 'usuario_id', as: 'pacientes' });

    Visita.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Paciente.hasMany(Visita, { foreignKey: 'paciente_id', as: 'visitas' });

    Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id', as: 'productos' });
    Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
    Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id', as: 'movimientos' });
    MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
    MovimientoInventario.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
    MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    IngresoAlmacen.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });
    IngresoAlmacen.hasMany(DetalleIngresoAlmacen, { foreignKey: 'ingreso_id', as: 'detalles' });
    DetalleIngresoAlmacen.belongsTo(IngresoAlmacen, { foreignKey: 'ingreso_id', as: 'ingreso' });
    DetalleIngresoAlmacen.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });
    Pais.hasMany(Provincia, { foreignKey: 'id_pais', as: 'provincias' });
    Provincia.belongsTo(Pais, { foreignKey: 'id_pais', as: 'pais' });
    Provincia.hasMany(Localidad, { foreignKey: 'id_provincia', as: 'localidades' });
    Localidad.belongsTo(Provincia, { foreignKey: 'id_provincia', as: 'provincia' });
    Medico.hasMany(Turno, { foreignKey: 'medico_id', as: 'turnos' });
    Turno.belongsTo(Medico, { foreignKey: 'medico_id', as: 'medico' });
    Turno.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Paciente.hasMany(Turno, { foreignKey: 'paciente_id', as: 'turnos' });
    HistorialMedico.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    HistorialMedico.belongsTo(Medico, { foreignKey: 'medico_id', as: 'medico' });
    DietaPaciente.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    DietaPaciente.belongsTo(Medico, { foreignKey: 'medico_id', as: 'medico' });
    Receta.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
    Receta.belongsTo(Medico, { foreignKey: 'medico_id', as: 'medico' });
    Receta.hasMany(DetalleReceta, { foreignKey: 'receta_id', as: 'detalles' });
    DetalleReceta.belongsTo(Receta, { foreignKey: 'receta_id', as: 'receta' });
    DetalleReceta.belongsTo(Producto, { foreignKey: 'medicamento_id', as: 'medicamento' });
    Donacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

    cached = {
        Direccion,
        Persona,
        Usuario,
        Paciente,
        Patologia,
        Visita,
        Rol,
        Producto,
        Proveedor,
        MovimientoInventario,
        IngresoAlmacen,
        DetalleIngresoAlmacen,
        Pais,
        Provincia,
        Localidad,
        Medico,
        Turno,
        HistorialMedico,
        Menu,
        DietaPaciente,
        Receta,
        DetalleReceta,
        Donacion,
        Habitacion,
        MovimientoPaciente,
    };

    return cached;
}

module.exports = { initModels };
