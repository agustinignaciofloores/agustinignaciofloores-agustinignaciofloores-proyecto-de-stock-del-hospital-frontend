const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('MovimientoPaciente', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_movimiento' }, 
    paciente: { type: DataTypes.STRING(50), allowNull: false }, 
    tipo: { type: DataTypes.STRING(30), allowNull: false }, 
    cama: DataTypes.STRING(20), piso: DataTypes.STRING(20), fecha: DataTypes.DATE, personal: DataTypes.STRING(50) }, 
    { tableName: 'movimientos', timestamps: false });
