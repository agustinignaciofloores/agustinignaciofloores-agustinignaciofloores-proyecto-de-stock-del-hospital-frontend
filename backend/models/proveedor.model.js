const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Proveedor', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    cuit: DataTypes.STRING(20),
    razon_social: DataTypes.STRING(100),
    telefono: DataTypes.STRING(20),
    email: DataTypes.STRING(100),
    direccion: DataTypes.TEXT,
    ciudad: DataTypes.STRING(50),
    especialidad: DataTypes.STRING(100),
    contacto_principal: DataTypes.STRING(100),
    activo: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
}, { tableName: 'proveedores', timestamps: false });
