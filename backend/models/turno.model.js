const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Turno', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, 
    usuario_id: DataTypes.INTEGER, paciente_id: DataTypes.INTEGER, medico_id: DataTypes.INTEGER, 
    especialidad: { type: DataTypes.STRING(50), allowNull: false }, 
    fecha: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.TIME, allowNull: false }, 
    motivo: { type: DataTypes.TEXT, allowNull: false }, 
    estado: DataTypes.STRING(20), observaciones: DataTypes.TEXT, created_at: DataTypes.DATE, updated_at: DataTypes.DATE }, 
    { tableName: 'turnos', timestamps: false });
