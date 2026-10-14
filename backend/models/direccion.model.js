const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Direccion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_direccion',
    },
    calle_pasaje: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    numero_casa: {
        type: DataTypes.STRING(20),
        allowNull: false,
    },
    manzana: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    barrio_paraje: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    codigo_postal: {
        type: DataTypes.STRING(10),
        allowNull: true,
    },
}, {
    tableName: 'direcciones',
});
