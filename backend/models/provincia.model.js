const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Provincia', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_provincia' }, 
    id_pais: DataTypes.INTEGER, 
    nombre_provincia: { type: DataTypes.STRING(100), allowNull: false }, created_at: DataTypes.DATE }, 
    { tableName: 'provincias', timestamps: false });
