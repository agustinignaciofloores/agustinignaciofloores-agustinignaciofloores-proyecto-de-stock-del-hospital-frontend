const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_usuario',
    },
    id_persona: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
    },
    contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'contraseña',
    },
    rol: {
        type: DataTypes.STRING(30),
        allowNull: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
}, {
    tableName: 'usuarios',
});
