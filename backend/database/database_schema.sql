-- Script SQL para Hospital Management System
-- Base de datos: PostgreSQL
-- Crear base de datos:
-- CREATE DATABASE hospital;

-- ============================================
-- TABLA: PAÍSES
-- ============================================
CREATE TABLE IF NOT EXISTS paises (
    id_pais SERIAL PRIMARY KEY,
    nombre_pais VARCHAR(100) NOT NULL UNIQUE,
    codigo_pais VARCHAR(3) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PROVINCIAS / DEPARTAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS provincias (
    id_provincia SERIAL PRIMARY KEY,
    id_pais INT NOT NULL REFERENCES paises(id_pais) ON DELETE CASCADE,
    nombre_provincia VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: LOCALIDADES / MUNICIPIOS
-- ============================================
CREATE TABLE IF NOT EXISTS localidades (
    id_localidad SERIAL PRIMARY KEY,
    id_provincia INT NOT NULL REFERENCES provincias(id_provincia) ON DELETE CASCADE,
    nombre_localidad VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DIRECCIONES
-- ============================================
CREATE TABLE IF NOT EXISTS direcciones (
    id_direccion SERIAL PRIMARY KEY,
    id_localidad INT REFERENCES localidades(id_localidad) ON DELETE SET NULL,
    id_provincia INT REFERENCES provincias(id_provincia) ON DELETE SET NULL,
    id_pais INT REFERENCES paises(id_pais) ON DELETE SET NULL,
    calle_pasaje VARCHAR(100) NOT NULL,
    numero_casa VARCHAR(20) NOT NULL,
    manzana VARCHAR(20),
    barrio_paraje VARCHAR(100),
    codigo_postal VARCHAR(10),
    piso_depto VARCHAR(10),
    referencia_adicional TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PERSONAS (Base de Registro Principal)
-- ============================================
CREATE TABLE IF NOT EXISTS personas (
    id_persona SERIAL PRIMARY KEY,
    dni INTEGER NOT NULL UNIQUE,
    apellido VARCHAR(40) NOT NULL,
    nombre VARCHAR(40) NOT NULL,
    telefono INTEGER,
    celular VARCHAR(20),
    sexo VARCHAR(15) NOT NULL CHECK (sexo IN ('Masculino', 'Femenino', 'Otro', 'No especifica')),
    fecha_nacimiento DATE NOT NULL,
    email VARCHAR(100),
    id_nacionalidad INT REFERENCES paises(id_pais) ON DELETE SET NULL,
    id_direccion INT REFERENCES direcciones(id_direccion) ON DELETE SET NULL,
    estado_civil VARCHAR(30) CHECK (estado_civil IN ('Soltero/a', 'Casado/a', 'Divorciado/a', 'Viudo/a', 'Unión de Hecho', 'No especifica')),
    etnia VARCHAR(100),
    tiene_discapacidad BOOLEAN DEFAULT FALSE,
    tipo_discapacidad VARCHAR(255),
    porcentaje_discapacidad INTEGER,
    numero_carnet_discapacidad VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: USUARIOS (Vinculada a Personas)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_persona INT NOT NULL REFERENCES personas(id_persona) ON DELETE CASCADE,
    usuario VARCHAR(50) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol VARCHAR(30) NOT NULL CHECK (rol IN ('admin', 'paciente', 'usuario', 'doctor', 'enfermero', 'cocinero', 'almacenero', 'visita', 'donacion')),
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: MÉDICOS
-- ============================================
CREATE TABLE IF NOT EXISTS medicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especialidad VARCHAR(50) NOT NULL,
    consultorio VARCHAR(10) NOT NULL,
    numero_colegio VARCHAR(20) UNIQUE,
    disponibilidad JSONB DEFAULT '["Lunes", "Miércoles", "Viernes"]'::jsonb,
    horario_inicio TIME DEFAULT '09:00',
    horario_fin TIME DEFAULT '17:00',
    email VARCHAR(100),
    telefono VARCHAR(20),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PACIENTES
-- ============================================
CREATE TABLE IF NOT EXISTS pacientes (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    documento VARCHAR(20) UNIQUE NOT NULL,
    fecha_nacimiento DATE,
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(50),
    obra_social VARCHAR(100),
    numero_afiliado VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: TURNOS / CITAS
-- ============================================
CREATE TABLE IF NOT EXISTS turnos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    paciente_id INT REFERENCES pacientes(id) ON DELETE SET NULL,
    medico_id INT REFERENCES medicos(id) ON DELETE SET NULL,
    especialidad VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'confirmado' CHECK (estado IN ('confirmado', 'completado', 'cancelado', 'pendiente')),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PATOLOGÍAS
-- ============================================
CREATE TABLE IF NOT EXISTS patologias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    codigo_icd10 VARCHAR(10),
    gravedad VARCHAR(20) CHECK (gravedad IN ('leve', 'moderada', 'grave')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: HISTORIALES MÉDICOS
-- ============================================
CREATE TABLE IF NOT EXISTS historiales_medicos (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    medico_id INT REFERENCES medicos(id) ON DELETE SET NULL,
    turno_id INT REFERENCES turnos(id) ON DELETE SET NULL,
    fecha DATE NOT NULL,
    diagnostico TEXT NOT NULL,
    tratamiento TEXT,
    patologia_id INT REFERENCES patologias(id) ON DELETE SET NULL,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PRODUCTOS / MEDICAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('medicamento', 'alimento', 'material', 'equipo')),
    descripcion TEXT,
    codigo_producto VARCHAR(20) UNIQUE,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT DEFAULT 10,
    precio_unitario DECIMAL(10, 2),
    unidad_medida VARCHAR(20), -- mg, ml, unidad, kg, etc.
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    vencimiento DATE,
    lote VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PROVEEDORES
-- ============================================
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    cuit VARCHAR(20) UNIQUE,
    razon_social VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(50),
    especialidad VARCHAR(100), -- medicamentos, alimentos, etc.
    contacto_principal VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: MOVIMIENTOS DE INVENTARIO
-- ============================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo_movimiento VARCHAR(20) CHECK (tipo_movimiento IN ('entrada', 'salida', 'ajuste')),
    cantidad INT NOT NULL,
    usuario_id INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    motivo TEXT,
    referencia VARCHAR(50), -- número de compra, orden, etc.
    precio_unitario DECIMAL(10, 2),
    gasto_total DECIMAL(10, 2),
    vencimiento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: INGRESOS A ALMACÉN
-- ============================================
CREATE TABLE IF NOT EXISTS ingresos_almacen (
    id SERIAL PRIMARY KEY,
    proveedor_id INT REFERENCES proveedores(id) ON DELETE SET NULL,
    numero_factura VARCHAR(20),
    fecha_ingreso DATE NOT NULL,
    usuario_id INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'recibido', 'rechazado')),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DETALLES DE INGRESOS
-- ============================================
CREATE TABLE IF NOT EXISTS ingresos_almacen_detalles (
    id SERIAL PRIMARY KEY,
    ingreso_id INT NOT NULL REFERENCES ingresos_almacen(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2),
    subtotal DECIMAL(10, 2)
);

-- ============================================
-- TABLA: MENÚS DIARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS menus (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    turno VARCHAR(20) CHECK (turno IN ('desayuno', 'almuerzo', 'merienda', 'cena')),
    plato_principal VARCHAR(100),
    guarnicion VARCHAR(100),
    postre VARCHAR(100),
    calorias INT,
    raciones_previstas INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DIETAS ESPECIALES
-- ============================================
CREATE TABLE IF NOT EXISTS dietas_pacientes (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    tipo_dieta VARCHAR(50), -- normal, blanda, vegetariana, etc.
    restricciones TEXT,
    alergias TEXT,
    medico_id INT REFERENCES medicos(id) ON DELETE SET NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: RECETAS MÉDICAS
-- ============================================
CREATE TABLE IF NOT EXISTS recetas (
    id SERIAL PRIMARY KEY,
    medico_id INT NOT NULL REFERENCES medicos(id) ON DELETE CASCADE,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    turno_id INT REFERENCES turnos(id) ON DELETE SET NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'vencida', 'cancelada')),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DETALLES DE RECETAS
-- ============================================
CREATE TABLE IF NOT EXISTS recetas_detalles (
    id SERIAL PRIMARY KEY,
    receta_id INT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
    medicamento_id INT REFERENCES productos(id) ON DELETE SET NULL,
    nombre_medicamento VARCHAR(100),
    dosis VARCHAR(50),
    frecuencia VARCHAR(50), -- cada 8 horas, una vez al día, etc.
    duracion VARCHAR(50), -- 7 días, 1 mes, etc.
    indicaciones TEXT
);

-- ============================================
-- TABLA: DONACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS donaciones (
    id SERIAL PRIMARY KEY,
    tipo_donacion VARCHAR(50) CHECK (tipo_donacion IN ('sangre', 'plasma', 'medula', 'organos', 'tejidos', 'economica')),
    usuario_id INT REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    nombre_donante VARCHAR(100),
    documento VARCHAR(20),
    fecha_donacion DATE NOT NULL,
    cantidad VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'procesado' CHECK (estado IN ('pendiente', 'procesado', 'rechazado')),
    grupo_sanguineo VARCHAR(5),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: VISITAS
-- ============================================
CREATE TABLE IF NOT EXISTS visitas (
    id SERIAL PRIMARY KEY,
    paciente_id INT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
    visitante_nombre VARCHAR(100),
    visitante_documento VARCHAR(20),
    fecha_visita DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    relacion VARCHAR(50),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: ROLES Y PERMISOS
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '[]'::jsonb
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);
CREATE INDEX idx_pacientes_usuario_id ON pacientes(usuario_id);
CREATE INDEX idx_turnos_usuario_id ON turnos(usuario_id);
CREATE INDEX idx_turnos_medico_id ON turnos(medico_id);
CREATE INDEX idx_turnos_fecha ON turnos(fecha);
CREATE INDEX idx_medicos_especialidad ON medicos(especialidad);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_stock ON productos(stock_actual);
CREATE INDEX idx_historiales_paciente_id ON historiales_medicos(paciente_id);
CREATE INDEX idx_dietas_paciente_id ON dietas_pacientes(paciente_id);
CREATE INDEX idx_recetas_paciente_id ON recetas(paciente_id);
CREATE INDEX idx_movimientos_producto_id ON movimientos_inventario(producto_id);

-- ============================================
-- INSERTS DE EJEMPLO (OPCIONAL - ELIMINAR DESPUÉS)
-- ============================================

-- Usuarios
INSERT INTO usuarios (usuario, contraseña, nombre, rol, email, telefono) VALUES
    ('admin', 'admin123', 'Administrador', 'admin', 'admin@hospital.com', '011-1234-5678'),
    ('paciente', '123', 'Paciente Demo', 'paciente', 'paciente@hospital.com', '011-2345-6789'),
    ('usuario', '123', 'Usuario Turnos', 'usuario', 'usuario@hospital.com', '011-3456-7890'),
    ('doctor', '123', 'Dr. Carlos López', 'doctor', 'doctor@hospital.com', '011-4567-8901'),
    ('cocinero', '123', 'Cocinero Demo', 'cocinero', 'cocinero@hospital.com', '011-5678-9012'),
    ('almacenero', '123', 'Almacenero Demo', 'almacenero', 'almacenero@hospital.com', '011-6789-0123')
ON CONFLICT DO NOTHING;

-- Médicos
INSERT INTO medicos (nombre, especialidad, consultorio, numero_colegio, disponibilidad) VALUES
    ('Dr. Carlos López', 'Cardiología', '301', 'MC-12345', '["Lunes", "Miércoles", "Viernes"]'::jsonb),
    ('Dra. María González', 'Cardiología', '302', 'MC-12346', '["Martes", "Jueves"]'::jsonb),
    ('Dr. Juan Rodríguez', 'Neurología', '401', 'MC-12347', '["Lunes", "Miércoles", "Viernes"]'::jsonb),
    ('Dra. Lucía Fernández', 'Dermatología', '501', 'MC-12348', '["Martes", "Jueves"]'::jsonb),
    ('Dr. Jorge Díaz', 'Gastroenterología', '601', 'MC-12349', '["Lunes", "Miércoles", "Viernes"]'::jsonb),
    ('Dr. Francisco García', 'Otorrinolaringología', '701', 'MC-12350', '["Lunes", "Miércoles", "Viernes"]'::jsonb),
    ('Dr. Manuel Castro', 'Oftalmología', '801', 'MC-12351', '["Martes", "Jueves"]'::jsonb),
    ('Dr. Ángel Vega', 'Traumatología', '901', 'MC-12352', '["Lunes", "Miércoles", "Viernes"]'::jsonb)
ON CONFLICT (numero_colegio) DO NOTHING;

-- Patologías
INSERT INTO patologias (nombre, descripcion, codigo_icd10, gravedad) VALUES
    ('Hipertensión Arterial', 'Presión arterial elevada', 'I10', 'moderada'),
    ('Diabetes Tipo 2', 'Enfermedad metabólica', 'E11', 'moderada'),
    ('Asma', 'Enfermedad de las vías respiratorias', 'J45', 'leve'),
    ('Migraña', 'Cefalea recurrente', 'G43', 'leve'),
    ('Infarto de Miocardio', 'Infarto cardíaco', 'I21', 'grave')
ON CONFLICT (nombre) DO NOTHING;

-- Productos
INSERT INTO productos (nombre, categoria, descripcion, codigo_producto, stock_actual, stock_minimo, precio_unitario, unidad_medida) VALUES
    ('Paracetamol 500mg', 'medicamento', 'Analgésico y antitérmico', 'PARA-500', 150, 50, 0.50, 'comprimido'),
    ('Ibuprofeno 400mg', 'medicamento', 'Antiinflamatorio', 'IBU-400', 200, 50, 0.60, 'comprimido'),
    ('Amoxicilina 500mg', 'medicamento', 'Antibiótico', 'AMOX-500', 100, 30, 1.20, 'comprimido'),
    ('Arroz Integral 1kg', 'alimento', 'Arroz para dietas', 'ARR-INT-1', 50, 20, 2.50, 'kg'),
    ('Pollo Congelado 1kg', 'alimento', 'Proteína animal', 'POL-CONG-1', 80, 30, 5.00, 'kg'),
    ('Vendas Elásticas 10cm', 'material', 'Material de curación', 'VEN-EL-10', 300, 100, 0.75, 'unidad')
ON CONFLICT (codigo_producto) DO NOTHING;

-- Proveedores
INSERT INTO proveedores (nombre, cuit, razon_social, telefono, email, especialidad) VALUES
    ('Farmacéutica ABC', '20-12345678-9', 'Farmacéutica ABC S.A.', '011-1111-1111', 'contacto@farmabC.com', 'medicamentos'),
    ('Distribuidora de Alimentos XYZ', '20-98765432-1', 'Distribuidora XYZ S.A.', '011-2222-2222', 'contacto@xyz.com', 'alimentos'),
    ('Suministros Médicos Plus', '20-55555555-5', 'Suministros Plus S.A.', '011-3333-3333', 'contacto@plus.com', 'material')
ON CONFLICT (cuit) DO NOTHING;

-- ============================================
-- PARA ELIMINAR DATOS DE EJEMPLO:
-- ============================================
-- DELETE FROM usuarios WHERE rol IN ('paciente', 'usuario', 'doctor', 'cocinero', 'almacenero');
-- DELETE FROM medicos;
-- DELETE FROM patologias;
-- DELETE FROM productos;
-- DELETE FROM proveedores;
