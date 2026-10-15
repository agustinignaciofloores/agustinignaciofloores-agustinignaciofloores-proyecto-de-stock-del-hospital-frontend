const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Menu', 
    { id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }, 
    fecha: { type: DataTypes.DATEONLY, allowNull: false }, 
    turno: DataTypes.STRING(20), plato_principal: DataTypes.STRING(100), 
    guarnicion: DataTypes.STRING(100), postre: DataTypes.STRING(100), calorias: DataTypes.INTEGER, raciones_previstas: DataTypes.INTEGER, created_at: DataTypes.DATE }, 
    { tableName: 'menus', timestamps: false });
