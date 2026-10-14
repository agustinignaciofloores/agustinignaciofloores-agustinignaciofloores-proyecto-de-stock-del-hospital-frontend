// BACKEND DEL SISTEMA DE GESTION HOSPITALARIA - RUTAS DE AUTENTICACIÓN Y REGISTRO

const { Op, fn, col, where } = require('sequelize');

module.exports = function registerAuthRoutes(app, { models }) {
    const { Direccion, Persona, Usuario } = models;

    // REGISTRO: crea direccion + persona + usuario en una sola operación.
    app.post('/api/registro', async (req, res) => {
        const {
            usuario, contraseña, dni, apellido, nombre, telefono, sexo,
            fecha_nac, email, estado_civil, etnia, discapacidad,
            provincia, localidad, barrio, calle, manzana, n_casa, cp, pais, rol
        } = req.body;

        try {
            console.log('--- NUEVO INTENTO DE REGISTRO ---');

            const numeroCasa = String(n_casa || '0');

            let idNacionalidadValido = parseInt(pais);
            if (isNaN(idNacionalidadValido)) {
                idNacionalidadValido = 1;
            }

            const dniInt = parseInt(dni);

            let sexoValido = 'No especifica';
            if (sexo && typeof sexo === 'string') {
                const limpioSexo = sexo.trim().toLowerCase();
                if (limpioSexo === 'm' || limpioSexo.includes('masculino')) {
                    sexoValido = 'Masculino';
                } else if (limpioSexo === 'f' || limpioSexo.includes('femenino')) {
                    sexoValido = 'Femenino';
                } else if (limpioSexo.includes('otro')) {
                    sexoValido = 'Otro';
                }
            } else if (sexo == 1) {
                sexoValido = 'Masculino';
            } else if (sexo == 2) {
                sexoValido = 'Femenino';
            }

            let estadoCivilValido = 'No especifica';
            if (estado_civil && typeof estado_civil === 'string') {
                const limpio = estado_civil.trim().toLowerCase();
                if (limpio.includes('soltero') || limpio === 's') {
                    estadoCivilValido = 'Soltero/a';
                } else if (limpio.includes('casado') || limpio === 'c') {
                    estadoCivilValido = 'Casado/a';
                } else if (limpio.includes('divorciado') || limpio === 'd') {
                    estadoCivilValido = 'Divorciado/a';
                } else if (limpio.includes('viudo') || limpio === 'v') {
                    estadoCivilValido = 'Viudo/a';
                } else if (limpio.includes('union') || limpio.includes('hecho')) {
                    estadoCivilValido = 'Unión de Hecho';
                }
            }

            await Direccion.sequelize.transaction(async (transaction) => {
                const direccion = await Direccion.create({
                    calle_pasaje: calle || 'No especificada',
                    numero_casa: numeroCasa,
                    manzana: manzana || '',
                    barrio_paraje: barrio || '',
                    codigo_postal: cp || '',
                }, { transaction });

                const persona = await Persona.create({
                    dni: dniInt,
                    apellido,
                    nombre,
                    telefono: telefono || null,
                    sexo: sexoValido,
                    fecha_nacimiento: fecha_nac,
                    email: email || null,
                    estado_civil: estadoCivilValido,
                    etnia: etnia || null,
                    tipo_discapacidad: discapacidad || null,
                    tiene_discapacidad: Boolean(discapacidad),
                    id_direccion: direccion.id,
                    id_nacionalidad: idNacionalidadValido,
                }, { transaction });

                await Usuario.create({
                    id_persona: persona.id,
                    usuario,
                    contrasena: String(contraseña),
                    rol: rol || 'paciente',
                }, { transaction });
            });

            res.json({ success: true, message: 'Usuario registrado correctamente' });
        } catch (err) {
            console.error('ERROR CRÍTICO EN LA INSERCIÓN:', err.message);
            res.status(500).json({ success: false, message: 'Error al registrar en la BD: ' + err.message });
        }
    });

    // LOGIN: valida credenciales y devuelve perfil de sesión (rol + datos básicos).
    app.post('/api/login', async (req, res) => {
        const { usuario, contraseña } = req.body;
        try {
            console.log('--- INTENTO DE LOGIN ---');
            const usuarioLimpio = String(usuario || '').trim();

            if (!usuarioLimpio || !contraseña) {
                return res.status(400).json({ success: false, message: 'Ingresá usuario y contraseña' });
            }

            const userRow = await Usuario.findOne({
                where: {
                    [Op.and]: [
                        where(fn('LOWER', fn('TRIM', col('Usuario.usuario'))), usuarioLimpio.toLowerCase()),
                        { contrasena: String(contraseña) },
                    ],
                },
                attributes: ['id', 'usuario', 'rol', 'activo'],
                include: [{
                    model: Persona,
                    as: 'persona',
                    attributes: ['nombre', 'apellido'],
                    required: false,
                }],
            });

            if (userRow) {
                const persona = userRow.persona || {};

                if (userRow.activo === false) {
                    return res.status(403).json({ success: false, message: 'El usuario está inactivo' });
                }

                console.log('Login correcto. Rol obtenido:', userRow.rol);
                const nombreCompleto = `${persona.nombre || ''} ${persona.apellido || ''}`.trim() || userRow.usuario;

                res.json({
                    success: true,
                    message: 'Login correcto',
                    rol: userRow.rol,
                    token: 'JWT_MOCK_TOKEN_SECRET',
                    usuario: {
                        id: userRow.id,
                        usuario: userRow.usuario,
                        nombre: nombreCompleto,
                        rol: userRow.rol
                    }
                });
            } else {
                res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
            }
        } catch (err) {
            console.error('ERROR EN LOGIN:', err.message);
            res.status(500).json({ success: false, message: 'Error en el servidor al intentar loguearse' });
        }
    });
};
