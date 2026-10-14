const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('MovimientoInventario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    producto_id: { type: DataTypes.INTEGER, allowNull: false },
    tipo_movimiento: { type: DataTypes.STRING(20), validate: { isIn: [['entrada', 'salida', 'ajuste']] } },
    cantidad: { type: DataTypes.INTEGER, allowNull: false },
    usuario_id: DataTypes.INTEGER,
    proveedor_id: DataTypes.INTEGER,
    motivo: DataTypes.TEXT,
    referencia: DataTypes.STRING(50),
    precio_unitario: DataTypes.DECIMAL(10, 2),
    gasto_total: DataTypes.DECIMAL(10, 2),
    vencimiento: DataTypes.DATEONLY,
    created_at: DataTypes.DATE,
}, { tableName: 'movimientos_inventario', timestamps: false });
