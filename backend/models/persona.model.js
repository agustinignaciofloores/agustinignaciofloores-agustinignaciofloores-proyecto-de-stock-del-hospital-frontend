// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA - MODELO DE LA ENTIDAD PERSONA
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Persona', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_persona',
    },
    dni: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    apellido: {
        type: DataTypes.STRING(40),
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING(40),
        allowNull: false,
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    sexo: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    estado_civil: {
        type: DataTypes.STRING(30),
        allowNull: true,
    },
    etnia: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    tipo_discapacidad: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    id_direccion: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    id_nacionalidad: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    tiene_discapacidad: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
}, {
    tableName: 'personas',
});
