-- Crear tablas faltantes para los módulos que el frontend ya usa.

CREATE TABLE IF NOT EXISTS habitaciones (
    id_habitacion SERIAL PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    capacidad INT NOT NULL DEFAULT 1,
    estado VARCHAR(30) NOT NULL DEFAULT 'Disponible',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimientos (
    id_movimiento SERIAL PRIMARY KEY,
    paciente VARCHAR(50) NOT NULL,
    tipo VARCHAR(30) NOT NULL,
    cama VARCHAR(20),
    piso VARCHAR(20),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    personal VARCHAR(50)
);