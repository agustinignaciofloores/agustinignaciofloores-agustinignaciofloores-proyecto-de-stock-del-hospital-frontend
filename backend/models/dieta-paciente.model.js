const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('DietaPaciente', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, 
    paciente_id: { type: DataTypes.INTEGER, allowNull: false }, 
    tipo_dieta: DataTypes.STRING(50),
     restricciones: DataTypes.TEXT, 
     alergias: DataTypes.TEXT, 
     medico_id: DataTypes.INTEGER, fecha_inicio: DataTypes.DATEONLY, 
     fecha_fin: DataTypes.DATEONLY, observaciones: DataTypes.TEXT, 
     created_at: DataTypes.DATE },
     { tableName: 'dietas_pacientes', timestamps: false });
