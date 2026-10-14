// backend/db.js
const { Sequelize } = require('sequelize');
const path = require('path');

// Carga siempre el .env del backend aunque el servidor se ejecute desde otra carpeta.
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Configuración de Sequelize para conectarse a la base de datos PostgreSQL
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        dialect: 'postgres',
        logging: false,
        define: {
            freezeTableName: true,
            timestamps: false,
        },
    }
);

// Adaptador de compatibilidad para seguir usando pool.query(sql, params)
// mientras se migra gradualmente el resto del backend a modelos Sequelize.
async function query(sql, params = []) {
    const [results, metadata] = await sequelize.query(sql, {
        bind: params,
        raw: true,
    });

    const rows = Array.isArray(results) ? results : [];
    const rowCount = typeof metadata?.rowCount === 'number' ? metadata.rowCount : rows.length;

    return {
        rows,
        rowCount,
        command: metadata?.command,
        metadata,
    };
}

module.exports = {
    sequelize,
    query,
    end: () => sequelize.close(),
};