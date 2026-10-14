// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA
const express = require('express'); // Importa el framework Express para crear el servidor web
const cors = require('cors'); // Importa el middleware CORS para permitir solicitudes desde diferentes dominios
const pool = require('./db'); // Importa la conexión a la base de datos PostgreSQL desde el archivo db.js

const app = express(); // Crea una instancia de la aplicación Express
app.use(cors()); // Middleware para permitir solicitudes desde cualquier origen (CORS)
app.use(express.json()); // Middleware para parsear JSON en las solicitudes

//  AUTENTICACIÓN Y REGISTRO

// Endpoint de Registro
app.post('/api/registro', async (req, res) => {
    const {
        usuario, contraseña, dni, apellido, nombre, telefono, sexo,
        fecha_nac, email, estado_civil, etnia, discapacidad,
        provincia, localidad, barrio, calle, manzana, n_casa, cp, pais, rol
    } = req.body;

    try {
        // 1. Insertar dirección
        const direccionResult = await pool.query(
            `INSERT INTO direcciones (calle_pasaje, numero_casa, manzana, barrio_paraje, codigo_postal)
             VALUES ($1, $2, $3, $4, $5) RETURNING id_direccion`,
            [calle, n_casa, manzana, barrio, cp]
        );
        const id_direccion = direccionResult.rows[0].id_direccion;

        // 2. Insertar persona
        const personaResult = await pool.query(
            `INSERT INTO personas (dni, apellido, nombre, telefono, sexo, fecha_nacimiento, email, estado_civil, etnia, tipo_discapacidad, id_direccion, id_nacionalidad)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING id_persona`,
            [dni, apellido, nombre, telefono, sexo, fecha_nac, email, estado_civil, etnia, discapacidad, id_direccion, pais || 1]
        );
        const id_persona = personaResult.rows[0].id_persona;

        // 3. Insertar usuario
        await pool.query(
            `INSERT INTO usuarios (id_persona, usuario, contraseña, rol)
             VALUES ($1, $2, $3, $4)`,
            [id_persona, usuario, contraseña, rol]
        );
        // Responder con éxito
        res.json({ success: true, message: "Usuario registrado correctamente" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error al registrar usuario" });
    }
});

// Endpoint de Login (Adaptado para retornar los datos que requiere utils.js)
app.post('/api/login', async (req, res) => {
    const { usuario, contraseña } = req.body;
    try {
        const result = await pool.query(
            `SELECT u.id_usuario, u.usuario, u.rol, p.nombre, p.apellido 
             FROM usuarios u
             JOIN personas p ON u.id_persona = p.id_persona
             WHERE u.usuario = $1 AND u.contraseña = $2`,
            [usuario, contraseña]
        );
        // Si se encuentra el usuario, retornar los datos requeridos
        if (result.rows.length > 0) {
            const userRow = result.rows[0];
            res.json({ 
                success: true, 
                rol: userRow.rol,
                token: "JWT_MOCK_TOKEN_SECRET", // Reemplazar por jwt.sign() si usás jsonwebtoken
                usuario: {
                    id: userRow.id_usuario,
                    usuario: userRow.usuario,
                    nombre: `${userRow.nombre} ${userRow.apellido}`,
                    rol: userRow.rol
                }
            });
        } else {
            res.json({ success: false, message: "Usuario o contraseña incorrectos" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error al intentar login" });
    }
});

//  MÓDULO PERSONAS (General)

app.get('/api/personas', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_persona AS id, dni, nombre, apellido, telefono, email, sexo, tipo_discapacidad AS discapacidad FROM personas ORDER BY id_persona DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
//  Endpoint para obtener una persona por ID
app.post('/api/personas', async (req, res) => {
    const { dni, nombre, apellido, telefono, email, sexo, discapacidad } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO personas (dni, nombre, apellido, telefono, email, sexo, tipo_discapacidad) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_persona AS id`,
            [dni, nombre, apellido, telefono, email, sexo, discapacidad]
        );
        res.json({ success: true, id: result.rows[0].id });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
//  Endpoint para eliminar una persona por ID
app.delete('/api/personas/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM personas WHERE id_persona = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO PERSONAL (Staff Médico/Técnico)

app.get('/api/personal', async (req, res) => {
    try {
        // Un join rápido de ejemplo para traer nombre y dni desde personas si corresponde, o de tu tabla personal
        const result = await pool.query('SELECT id_personal AS id, nombre, dni, rol, estado FROM personal ORDER BY id_personal DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
//  Endpoint para agregar un miembro del personal
app.post('/api/personal', async (req, res) => {
    const { nombre, dni, rol, estado } = req.body;
    try {
        await pool.query('INSERT INTO personal (nombre, dni, rol, estado) VALUES ($1, $2, $3, $4)', [nombre, dni, rol, estado]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
//  Endpoint para eliminar un miembro del personal por ID
app.delete('/api/personal/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM personal WHERE id_personal = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO PATOLOGÍAS

app.get('/api/patologias', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_patologia AS id, nombre, tipo, descripcion FROM patologias ORDER BY id_patologia DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

//  Endpoint para agregar una patología
app.post('/api/patologias', async (req, res) => {
    const { nombre, tipo, descripcion } = req.body;
    try {
        await pool.query('INSERT INTO patologias (nombre, tipo, descripcion) VALUES ($1, $2, $3)', [nombre, tipo, descripcion]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
//  Endpoint para eliminar una patología por ID
app.delete('/api/patologias/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM patologias WHERE id_patologia = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO PACIENTES

app.get('/api/pacientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_paciente AS id, historia_clinica, nombre, dni, patologia, estado FROM pacientes ORDER BY id_paciente DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
//  Endpoint para agregar un paciente
app.post('/api/pacientes', async (req, res) => {
    const { historia_clinica, nombre, dni, patologia, estado } = req.body;
    try {
        await pool.query('INSERT INTO pacientes (historia_clinica, nombre, dni, patologia, estado) VALUES ($1, $2, $3, $4, $5)', [historia_clinica, nombre, dni, patologia, estado]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});
//  Endpoint para eliminar un paciente por ID
app.delete('/api/pacientes/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM pacientes WHERE id_paciente = $1', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO MOVIMIENTOS

app.get('/api/movimientos', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_movimiento AS id, paciente, tipo, cama, piso, fecha, personal FROM movimientos ORDER BY id_movimiento DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
//  Endpoint para agregar un movimiento
app.post('/api/movimientos', async (req, res) => {
    const { paciente, tipo, cama, piso, fecha, personal } = req.body;
    try {
        await pool.query('INSERT INTO movimientos (paciente, tipo, cama, piso, fecha, personal) VALUES ($1, $2, $3, $4, $5, $6)', [paciente, tipo, cama, piso, fecha, personal]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO MENÚS

app.get('/api/menus', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_menu AS id, nombre, descripcion, restriccion FROM menus ORDER BY id_menu DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
//  Endpoint para agregar un menú
app.post('/api/menus', async (req, res) => {
    const { nombre, descripcion, restriccion } = req.body;
    try {
        await pool.query('INSERT INTO menus (nombre, descripcion, restriccion) VALUES ($1, $2, $3)', [nombre, descripcion, restriccion]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO INVENTARIO

app.get('/api/inventario', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_inventario AS id, producto, stock, fecha, personal FROM inventario ORDER BY id_inventario DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
//  Endpoint para agregar un registro de inventario
app.post('/api/inventario', async (req, res) => {
    const { producto, stock, fecha, personal } = req.body;
    try {
        await pool.query('INSERT INTO inventario (producto, stock, fecha, personal) VALUES ($1, $2, $3, $4)', [producto, stock, fecha, personal]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO INGRESOS ALMACÉN

app.get('/api/ingresos', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_ingreso AS id, producto, proveedor, cantidad, precio_unitario, moneda, vencimiento FROM ingresos ORDER BY id_ingreso DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ingresos', async (req, res) => {
    const { producto, proveedor, cantidad, precio_unitario, moneda, vencimiento } = req.body;
    try {
        await pool.query('INSERT INTO ingresos (producto, proveedor, cantidad, precio_unitario, moneda, vencimiento) VALUES ($1, $2, $3, $4, $5, $6)', [producto, proveedor, cantidad, precio_unitario, moneda, vencimiento]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO HABITACIONES

app.get('/api/habitaciones', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_habitacion AS id, numero, capacidad, estado FROM habitaciones ORDER BY id_habitacion DESC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/habitaciones', async (req, res) => {
    const { numero, capacidad, estado } = req.body;
    try {
        await pool.query('INSERT INTO habitaciones (numero, capacidad, estado) VALUES ($1, $2, $3)', [numero, capacidad, estado]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

//  MÓDULO TURNOS (Mantenidos de versión anterior)
app.post('/api/turnos', async (req, res) => {
    const { usuario_id, medico_id, especialidad, fecha, hora, motivo } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO turnos (usuario_id, medico_id, especialidad, fecha, hora, motivo) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [usuario_id, medico_id, especialidad, fecha, hora, motivo]
        );
        res.json({ success: true, turno: result.rows[0] });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
//  Endpoint para obtener turnos por usuario_id
app.get('/api/turnos/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const result = await pool.query(
            `SELECT t.*, p.nombre, p.apellido FROM turnos t 
             JOIN personal m ON t.medico_id = m.id_personal 
             WHERE t.usuario_id = $1`,
            [usuario_id]
        );
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});                                           

app.listen(3001, () => console.log('Backend de Gestión Hospitalaria corriendo en puerto 3001'));