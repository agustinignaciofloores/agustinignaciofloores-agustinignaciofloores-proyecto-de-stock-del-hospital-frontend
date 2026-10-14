const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Visita', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id',
    },
    paciente_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    visitante_nombre: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    visitante_documento: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    fecha_visita: {
        type: DataTypes.DATEONLY,
        allowNull: false,
    },
    hora_entrada: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    hora_salida: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    relacion: {
        type: DataTypes.STRING(50),
        allowNull: true,
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
}, {
    tableName: 'visitas',
    timestamps: false,
});
