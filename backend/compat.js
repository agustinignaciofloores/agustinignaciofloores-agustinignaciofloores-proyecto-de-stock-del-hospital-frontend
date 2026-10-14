// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA - FUNCIONES DE COMPATIBILIDAD

module.exports = function createCompatHelpers(pool) {
    let rolesIdColumnCache = null;
    let patologiasIdColumnCache = null;
    let pacientesIdColumnCache = null;
    let productosIdColumnCache = null;
    let proveedoresIdColumnCache = null;
    let ingresosIdColumnCache = null;
    let medicosIdColumnCache = null;
    let turnosIdColumnCache = null;
    let movimientosInventarioIdColumnCache = null;
    let dietasPacientesIdColumnCache = null;
    let visitasIdColumnCache = null;

    async function getRolesIdColumn() {
        if (rolesIdColumnCache) {
            return rolesIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'roles'
              AND column_name IN ('id_rol', 'id_roles', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_rol' THEN 1
                WHEN column_name = 'id_roles' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        rolesIdColumnCache = result.rows[0]?.column_name || 'id_rol';
        return rolesIdColumnCache;
    }

    async function getPatologiasIdColumn() {
        if (patologiasIdColumnCache) {
            return patologiasIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'patologias'
              AND column_name IN ('id_patologias', 'id_patologia', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_patologias' THEN 1
                WHEN column_name = 'id_patologia' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        patologiasIdColumnCache = result.rows[0]?.column_name || 'id_patologias';
        return patologiasIdColumnCache;
    }

    async function getPacientesIdColumn() {
        if (pacientesIdColumnCache) {
            return pacientesIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'pacientes'
              AND column_name IN ('id_pacientes', 'id_paciente', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_pacientes' THEN 1
                WHEN column_name = 'id_paciente' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        pacientesIdColumnCache = result.rows[0]?.column_name || 'id_pacientes';
        return pacientesIdColumnCache;
    }

    async function getProductosIdColumn() {
        if (productosIdColumnCache) {
            return productosIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'productos'
              AND column_name IN ('id_productos', 'id_producto', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_productos' THEN 1
                WHEN column_name = 'id_producto' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        productosIdColumnCache = result.rows[0]?.column_name || 'id_productos';
        return productosIdColumnCache;
    }

    async function getProveedoresIdColumn() {
        if (proveedoresIdColumnCache) {
            return proveedoresIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'proveedores'
              AND column_name IN ('id_proveedores', 'id_proveedor', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_proveedores' THEN 1
                WHEN column_name = 'id_proveedor' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        proveedoresIdColumnCache = result.rows[0]?.column_name || 'id_proveedores';
        return proveedoresIdColumnCache;
    }

    async function getIngresosIdColumn() {
        if (ingresosIdColumnCache) {
            return ingresosIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'ingresos_almacen'
              AND column_name IN ('id_ingresos_almacen', 'id_ingreso', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_ingresos_almacen' THEN 1
                WHEN column_name = 'id_ingreso' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        ingresosIdColumnCache = result.rows[0]?.column_name || 'id_ingresos_almacen';
        return ingresosIdColumnCache;
    }

    async function getMedicosIdColumn() {
        if (medicosIdColumnCache) {
            return medicosIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'medicos'
              AND column_name IN ('id', 'id_medico', 'id_medicos')
            ORDER BY CASE
                WHEN column_name = 'id' THEN 1
                WHEN column_name = 'id_medico' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        medicosIdColumnCache = result.rows[0]?.column_name || 'id';
        return medicosIdColumnCache;
    }

    async function getTurnosIdColumn() {
        if (turnosIdColumnCache) {
            return turnosIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'turnos'
              AND column_name IN ('id', 'id_turno', 'id_turnos')
            ORDER BY CASE
                WHEN column_name = 'id' THEN 1
                WHEN column_name = 'id_turno' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        turnosIdColumnCache = result.rows[0]?.column_name || 'id';
        return turnosIdColumnCache;
    }

    async function getMovimientosInventarioIdColumn() {
        if (movimientosInventarioIdColumnCache) {
            return movimientosInventarioIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'movimientos_inventario'
              AND column_name IN ('id', 'id_movimiento', 'id_movimientos_inventario')
            ORDER BY CASE
                WHEN column_name = 'id' THEN 1
                WHEN column_name = 'id_movimiento' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        movimientosInventarioIdColumnCache = result.rows[0]?.column_name || 'id';
        return movimientosInventarioIdColumnCache;
    }

    async function getDietasPacientesIdColumn() {
        if (dietasPacientesIdColumnCache) {
            return dietasPacientesIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'dietas_pacientes'
              AND column_name IN ('id_dietasespeciales', 'id_dieta', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_dietasespeciales' THEN 1
                WHEN column_name = 'id_dieta' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        dietasPacientesIdColumnCache = result.rows[0]?.column_name || 'id';
        return dietasPacientesIdColumnCache;
    }

    async function getVisitasIdColumn() {
        if (visitasIdColumnCache) {
            return visitasIdColumnCache;
        }

        const result = await pool.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'visitas'
              AND column_name IN ('id_visita', 'id_visitas', 'id')
            ORDER BY CASE
                WHEN column_name = 'id_visita' THEN 1
                WHEN column_name = 'id_visitas' THEN 2
                ELSE 3
            END
            LIMIT 1
        `);

        visitasIdColumnCache = result.rows[0]?.column_name || 'id';
        return visitasIdColumnCache;
    }

    async function syncVisitasPrimaryKeySequence() {
        const visitasIdColumn = await getVisitasIdColumn();
        const seqResult = await pool.query(
            `SELECT pg_get_serial_sequence('visitas', $1) AS seq`,
            [visitasIdColumn]
        );

        const sequenceName = seqResult.rows[0]?.seq;
        if (!sequenceName) {
            return;
        }

        await pool.query(`
            SELECT setval(
                $1::regclass,
                COALESCE((SELECT MAX(${visitasIdColumn}) FROM visitas), 0) + 1,
                false
            )
        `, [sequenceName]);
    }

    async function asegurarCompatibilidadSchema() {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS habitaciones (
                    id_habitacion SERIAL PRIMARY KEY,
                    numero VARCHAR(20) NOT NULL UNIQUE,
                    capacidad INT NOT NULL DEFAULT 1,
                    estado VARCHAR(30) NOT NULL DEFAULT 'Disponible',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await pool.query(`
                CREATE TABLE IF NOT EXISTS movimientos (
                    id_movimiento SERIAL PRIMARY KEY,
                    paciente VARCHAR(50) NOT NULL,
                    tipo VARCHAR(30) NOT NULL,
                    cama VARCHAR(20),
                    piso VARCHAR(20),
                    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    personal VARCHAR(50)
                )
            `);

            await pool.query(`
                ALTER TABLE movimientos_inventario
                    ADD COLUMN IF NOT EXISTS proveedor_id INT,
                    ADD COLUMN IF NOT EXISTS precio_unitario DECIMAL(10, 2),
                    ADD COLUMN IF NOT EXISTS gasto_total DECIMAL(10, 2),
                    ADD COLUMN IF NOT EXISTS vencimiento DATE
            `);
        } catch (err) {
            console.error('No se pudo asegurar el esquema de compatibilidad:', err.message);
        }
    }

    async function asegurarMedicosDesdeUsuarios() {
        const totalMedicos = await pool.query('SELECT COUNT(*)::int AS total FROM medicos');
        if ((totalMedicos.rows[0]?.total || 0) > 0) {
            return;
        }

        await pool.query(`
            INSERT INTO medicos (nombre, especialidad, consultorio, email, telefono, activo)
            SELECT
                COALESCE(NULLIF(TRIM(CONCAT(p.nombre, ' ', p.apellido)), ''), u.usuario) AS nombre,
                'Clínica Médica' AS especialidad,
                CONCAT('C-', LPAD(ROW_NUMBER() OVER (ORDER BY u.id_usuario)::text, 3, '0')) AS consultorio,
                p.email,
                p.telefono,
                TRUE
            FROM usuarios u
            LEFT JOIN personas p ON p.id_persona = u.id_persona
            WHERE LOWER(TRIM(u.rol)) IN ('doctor', 'medico', 'médico')
        `);
    }

    return {
        getRolesIdColumn,
        getPatologiasIdColumn,
        getPacientesIdColumn,
        getProductosIdColumn,
        getProveedoresIdColumn,
        getIngresosIdColumn,
        getMedicosIdColumn,
        getTurnosIdColumn,
        getMovimientosInventarioIdColumn,
        getDietasPacientesIdColumn,
        getVisitasIdColumn,
        syncVisitasPrimaryKeySequence,
        asegurarCompatibilidadSchema,
        asegurarMedicosDesdeUsuarios,
    };
};
