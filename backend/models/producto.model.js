const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Producto', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    categoria: { type: DataTypes.STRING(50), allowNull: false },
    descripcion: DataTypes.TEXT,
    codigo_producto: DataTypes.STRING(20),
    stock_actual: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    stock_minimo: { type: DataTypes.INTEGER, defaultValue: 10 },
    precio_unitario: DataTypes.DECIMAL(10, 2),
    unidad_medida: DataTypes.STRING(20),
    proveedor_id: DataTypes.INTEGER,
    vencimiento: DataTypes.DATEONLY,
    lote: DataTypes.STRING(50),
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
}, { tableName: 'productos', timestamps: false });
