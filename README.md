# Sistema de gestión hospitalaria

Aplicación académica web para gestionar operaciones hospitalarias. El módulo
principal demostrable es inventario: productos, proveedores, ingresos/salidas,
stock y movimientos. También hay pantallas para usuarios, pacientes, visitas,
cocina, turnos y administración.

## Estructura y repositorios

- `frontend/` contiene la interfaz multipágina HTML/CSS/JavaScript. Vercel debe
  usar esta carpeta como raíz del proyecto.
- `backend/` es un repositorio Git independiente y contiene la API Node/Express,
  Sequelize y PostgreSQL. Su remoto configurado es
  [proyecto-de-stock-del-hospital-backend](https://github.com/agustinignaciofloores/proyecto-de-stock-del-hospital-backend).
- El repositorio raíz de este workspace tiene un remoto de frontend. Los
  manifiestos de Render y archivos del backend deben publicarse desde el remoto
  independiente de `backend/`.

## Requisitos

- Node.js 20 o superior y npm.
- PostgreSQL para ejecutar la aplicación completa.
- Una base dedicada de pruebas PostgreSQL para correr la prueba de esquema.

## Ejecución local

En una terminal, desde `backend/`:

```bash
npm ci
npm test
npm start
```

Configura `DATABASE_URL` o las variables `DB_HOST`, `DB_PORT`, `DB_NAME`,
`DB_USER` y `DB_PASSWORD` en `backend/.env`. No publiques ese archivo. La API
escucha por defecto en `http://localhost:3001` y expone `GET /health`.

En otra terminal, desde `frontend/`:

```bash
npm ci
npm start
```

La interfaz local queda en `http://localhost:3000`. Su origen API se define en
`frontend/src/api/config.js`; para desarrollo local debe apuntar al backend de
`localhost:3001`.

El backend es un repositorio independiente. Para reproducir esta estructura,
clónalo como directorio hermano del proyecto frontend:

```bash
git clone https://github.com/agustinignaciofloores/proyecto-de-stock-del-hospital-backend.git backend
```

## Base de datos

`backend/database/database_schema.sql` documenta el esquema SQL y datos de
demostración no sensibles. Ejecutarlo solo en una base vacía dedicada. La API
también inicializa sus modelos con Sequelize al arrancar; no uses la base de
producción como destino de pruebas.

La prueba de integración SQL requiere `TEST_DATABASE_URL` apuntando a una base
cuyo nombre contenga `test`. Crea las tablas en un esquema aislado dentro de una
transacción y hace rollback. Sin esa variable, la prueba se omite; los tests del
router de inventario se ejecutan sin base de datos.

## Documentación y estado de validación

- [DER](DER.md)
- [Requisitos y MVP propuesto](REQUISITOS_MVP.md)
- [Seguimiento y evidencia del equipo](EVIDENCIA_EQUIPO.md)
- [Guía técnica y de defensa](GUIA_PROYECTO.md)

El alcance MVP de `REQUISITOS_MVP.md` se infiere del código y debe cotejarse con
la propuesta aprobada por la cátedra. La integración con PostgreSQL y el
despliegue publicado requieren credenciales/servicios externos y todavía deben
validarse con la lista de pasos allí indicada.