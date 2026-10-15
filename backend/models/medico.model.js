const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Medico', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
     nombre: { type: DataTypes.STRING(100), allowNull: false }, 
     especialidad: { type: DataTypes.STRING(50), allowNull: false }, 
     consultorio: { type: DataTypes.STRING(10), allowNull: false }, 
     numero_colegio: DataTypes.STRING(20), disponibilidad: DataTypes.JSONB, horario_inicio: DataTypes.TIME, horario_fin: DataTypes.TIME, email: DataTypes.STRING(100),
     telefono: DataTypes.STRING(20), activo: DataTypes.BOOLEAN, created_at: DataTypes.DATE, updated_at: DataTypes.DATE }, 
     { tableName: 'medicos', timestamps: false });
