const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('IngresoAlmacen', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    proveedor_id: DataTypes.INTEGER,
    numero_factura: DataTypes.STRING(20),
    fecha_ingreso: { type: DataTypes.DATEONLY, allowNull: false },
    usuario_id: DataTypes.INTEGER,
    estado: { type: DataTypes.STRING(20), defaultValue: 'pendiente' },
    observaciones: DataTypes.TEXT,
    created_at: DataTypes.DATE,
}, { tableName: 'ingresos_almacen', timestamps: false });
