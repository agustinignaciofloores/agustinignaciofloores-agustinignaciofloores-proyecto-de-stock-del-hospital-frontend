const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Habitacion', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_habitacion' }, 
    numero: { type: DataTypes.STRING(20), allowNull: false }, 
    capacidad: { type: DataTypes.INTEGER, defaultValue: 1 }, 
    estado: { type: DataTypes.STRING(30), defaultValue: 'Disponible' }, 
    created_at: DataTypes.DATE, updated_at: DataTypes.DATE }, 
    { tableName: 'habitaciones', timestamps: false });
