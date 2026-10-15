const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Donacion', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, 
    tipo_donacion: DataTypes.STRING(50), 
    usuario_id: DataTypes.INTEGER, nombre_donante: DataTypes.STRING(100), 
    documento: DataTypes.STRING(20),
    fecha_donacion: { type: DataTypes.DATEONLY, allowNull: false }, 
    cantidad: DataTypes.STRING(50),
     estado: DataTypes.STRING(20), 
     grupo_sanguineo: DataTypes.STRING(5), 
     observaciones: DataTypes.TEXT, created_at: DataTypes.DATE },
      { tableName: 'donaciones', timestamps: false });
