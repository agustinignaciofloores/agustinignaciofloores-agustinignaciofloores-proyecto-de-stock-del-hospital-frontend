const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('HistorialMedico', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    paciente_id: { type: DataTypes.INTEGER, allowNull: false },
    medico_id: DataTypes.INTEGER, turno_id: DataTypes.INTEGER,
    fecha: { type: DataTypes.DATEONLY, allowNull: false }, 
    diagnostico: { type: DataTypes.TEXT, allowNull: false }, 
    tratamiento: DataTypes.TEXT, patologia_id: DataTypes.INTEGER, 
    observaciones: DataTypes.TEXT, created_at: DataTypes.DATE }, 
    { tableName: 'historiales_medicos', timestamps: false });
