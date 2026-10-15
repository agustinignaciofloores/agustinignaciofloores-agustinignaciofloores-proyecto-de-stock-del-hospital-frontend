const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Pais', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_pais' }, 
    nombre_pais: { 
        type: DataTypes.STRING(100), 
        allowNull: false }, 
    codigo_pais: { 
        type: DataTypes.STRING(3), 
        allowNull: false }, 
        created_at: DataTypes.DATE }, 
    { tableName: 'paises', timestamps: false });
