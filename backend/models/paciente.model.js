const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Paciente', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id',
    },
    usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    documento: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    fecha_nacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    ciudad: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    obra_social: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    numero_afiliado: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
}, {
    tableName: 'pacientes',
    timestamps: false,
});
