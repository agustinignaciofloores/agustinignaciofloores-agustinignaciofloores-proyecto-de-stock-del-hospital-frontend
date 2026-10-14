const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('DetalleIngresoAlmacen', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ingreso_id: { type: DataTypes.INTEGER, allowNull: false },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    precio_unitario: DataTypes.DECIMAL(10, 2),
    subtotal: DataTypes.DECIMAL(10, 2),
}, { tableName: 'ingresos_almacen_detalles', timestamps: false });
