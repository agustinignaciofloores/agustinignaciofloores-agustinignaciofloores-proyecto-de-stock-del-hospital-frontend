# Guía para estudiar y defender el sistema de gestión hospitalaria

> Documento preparado a partir de los archivos que están actualmente en el
> repositorio. Describe lo implementado y separa las funcionalidades existentes
> de las mejoras posibles. No reemplaza una prueba en los servicios desplegados.

## 1. ¿Qué busca resolver el proyecto?

El proyecto propone un sistema web para centralizar operaciones de un hospital.
Su eje principal es el **stock del almacén**: registrar productos, consultar
existencias, ingresar mercadería, registrar salidas y consultar movimientos y
reportes. Alrededor de ese eje también incluye pantallas y datos para pacientes,
usuarios y personal, visitas, cocina y dietas, habitaciones, patologías,
turnos y donaciones.

La idea es que cada perfil use las pantallas relacionadas con su tarea y que el
frontend consulte una API para leer o modificar los datos almacenados en
PostgreSQL.

**Importante para la exposición:** es más preciso presentar esto como un
prototipo/sistema académico de gestión hospitalaria con un módulo central de
inventario. No afirmar que sustituye un sistema clínico real: todavía faltan
controles de seguridad, integridad operativa y funcionalidades de historia
clínica.

## 2. Tecnologías y lenguajes

| Área | Tecnología | Uso |
|---|---|---|
| Lenguaje de backend | JavaScript sobre Node.js | Ejecuta el servidor y las rutas de la API. |
| Servidor/API | Express 5 | Atiende solicitudes HTTP, usa middleware y organiza endpoints. |
| Acceso a datos | Sequelize 6 y `pg` | ORM/modelos para PostgreSQL y driver de PostgreSQL. |
| Base de datos | PostgreSQL | Guarda usuarios, productos, movimientos y demás entidades. |
| Interfaz | HTML, CSS y JavaScript | Formularios, tablas, navegación y llamadas `fetch` desde el navegador. |
| Formato de intercambio | JSON sobre HTTP | El frontend envía y recibe datos de la API. |
| Variables de entorno | `dotenv` en backend | Lee configuración del entorno local desde `backend/.env`. |
| Despliegue | Vercel y Render | Vercel publica el frontend estático y Render ejecuta la API Node. |
| Control de dependencias | npm | Declara dependencias en los `package.json` y las instala en `node_modules`. |

No se observa un framework de interfaz como React, Vue o Angular, ni un
transpilador/bundler: el frontend es multipágina, con HTML y scripts JavaScript
que el navegador carga directamente.

## 3. Arquitectura y flujo general actualizado

```text
Usuario
  │ abre una página HTML
  ▼
Vercel — publica los archivos estáticos del frontend
  │ JavaScript del navegador hace fetch() a /api/...
  ▼
Render — ejecuta backend/server.js (Express)
  │ router -> modelo Sequelize / consulta SQL puntual
  ▼
PostgreSQL — base configurada mediante DATABASE_URL o DB_*
  │ resultado
  ▼
Express responde JSON -> el navegador actualiza tabla, formulario o panel
```

### Flujo de una operación de inventario

1. El usuario abre la pantalla de inventario en el frontend.
2. El JavaScript de esa pantalla o `admin-datos.js` arma una URL mediante
   `buildApiUrl()` y envía una solicitud HTTP.
3. La solicitud llega al backend de Render en `/api/...`.
4. El router correspondiente valida algunos datos y ejecuta la operación con
   los modelos Sequelize.
5. El backend consulta o modifica PostgreSQL. En movimientos de inventario,
   producto, stock y movimiento se pueden actualizar dentro de una transacción.
6. La API devuelve JSON y el frontend actualiza la vista o muestra un mensaje.

### Qué publica cada plataforma

- **Vercel:** el frontend estático. El archivo [frontend/vercel.json](./frontend/vercel.json)
  redirige `/` a `/src/pages/index.html`. Para este diseño, el proyecto de
  Vercel debe tener como raíz de proyecto la carpeta `frontend`.
- **Render:** la API. [render.yaml del repositorio backend](https://github.com/agustinignaciofloores/proyecto-de-stock-del-hospital-backend/blob/main/render.yaml)
  define el servicio Node
  `hospital-backend`, `npm ci`, `npm start` y chequeo `/health`. Conectar Render
  directamente al repositorio de backend; el remoto del frontend no incluye
  ese directorio como archivos versionados.
- **PostgreSQL:** no está definido como servicio en el manifiesto de Render; el backend
  espera recibir la conexión por `DATABASE_URL` o por variables `DB_*`. La guía
  no presupone qué proveedor aloja esa base.

En el código actual, [frontend/src/api/config.js](./frontend/src/api/config.js)
define directamente el origen público de Render en `window.BACKEND_ORIGIN`.
Aunque el archivo [frontend/.env.example](./frontend/.env.example) propone
configurar `BACKEND_ORIGIN` en Vercel, un sitio HTML estático **no lee por sí solo**
las variables de entorno de Vercel: la aplicación debe inyectarlas durante un
build o cargar una configuración pública. En este repositorio el valor efectivo
visible para el navegador proviene del archivo `config.js`.

## 4. Backend

El backend está en [backend/](./backend). Es un servidor Express que expone la
API y coordina las operaciones con PostgreSQL.

### Archivos y módulos principales

- [backend/server.js](./backend/server.js): punto de entrada. Crea Express,
  habilita CORS y JSON (límite de 8 MB), define `GET /health`, inicializa los
  modelos, registra los routers y luego autentica/sincroniza la conexión antes
  de escuchar en `PORT` o en el puerto local `3001`.
- [backend/db.js](./backend/db.js): configura Sequelize/PostgreSQL, el pool de
  conexiones y SSL. También conserva `query()` para consultas SQL puntuales de
  compatibilidad. `DATABASE_URL` tiene prioridad sobre los parámetros `DB_*`.
- [backend/compat.js](./backend/compat.js): helpers de compatibilidad para
  detectar nombres alternativos de columnas/IDs en esquemas existentes y
  preparar ciertas estructuras. Existe para convivir con una base cuyo esquema
  puede diferir en nombres.
- [backend/models/](./backend/models): define las tablas y asociaciones
  Sequelize.
- [backend/routes/](./backend/routes): contiene los endpoints agrupados por
  función.
- [backend/database/database_schema.sql](./backend/database/database_schema.sql)
  y [backend/database/migracion_compatibilidad.sql](./backend/database/migracion_compatibilidad.sql):
  SQL de esquema/migración disponible en el repositorio. El segundo archivo
  crea, entre otras estructuras, habitaciones y movimientos.
- [backend/ARQUITECTURA_BACKEND.md](./backend/ARQUITECTURA_BACKEND.md): nota
  interna sobre la arquitectura y el arranque.
- [backend/package.json](./backend/package.json): dependencias y comandos
  `start`/`dev`, ambos ejecutan `node server.js`.

Los archivos `*-sequelize.router.js` son implementaciones con Sequelize. Los
archivos simples como `almacen.router.js`, `pacientes.router.js`,
`gestion.router.js` y `visitas.router.js` las reexportan. El servidor carga una
sola implementación para cada grupo; no son dos APIs paralelas.

### Módulos funcionales del backend

- **Autenticación y registro** — `auth.router.js`: alta de dirección, persona y
  usuario en una transacción; inicio de sesión.
- **Gestión** — `gestion.router.js`: usuarios, personas y roles.
- **Pacientes** — `pacientes.router.js`: listado, alta, edición, eliminación y
  búsqueda.
- **Visitas** — `visitas.router.js`: alta de visitas, consultas por paciente o
  documento del visitante y finalización de visita.
- **Almacén** — `almacen.router.js`: inventario, productos, proveedores,
  movimientos, ingresos y reportes.
- **Administración** — `admin.router.js`: personal, patologías, movimientos de
  pacientes, menús y habitaciones.
- **Doctor/turnos/donaciones** — `doctor.router.js`: consultas de médicos y
  perfil/resumen, pacientes relacionados, turnos y alta de donaciones.
- **Cocina** — `cocina.router.js`: resumen, consulta de menús y dietas y marcar
  una dieta como entregada.

### Modelos y relaciones

Cada modelo describe campos, tipos y tabla SQL. `models/index.js` crea los
modelos una vez y define asociaciones que permiten consultas relacionadas
(`include`) en Sequelize.

| Modelos | Función |
|---|---|
| `Producto`, `Proveedor` | Catálogo de artículos y sus proveedores. |
| `MovimientoInventario` | Historial de entradas, salidas y ajustes sobre productos. |
| `IngresoAlmacen`, `DetalleIngresoAlmacen` | Cabecera del ingreso de mercadería y sus líneas/productos, cantidades y subtotales. |
| `Usuario`, `Persona`, `Rol`, `Direccion` | Identidad, cuenta, rol y dirección asociada. |
| `Paciente`, `Patologia`, `Visita` | Información del paciente, patologías y visitas. |
| `Medico`, `Turno`, `HistorialMedico` | Profesionales, agenda/turnos e historia médica. |
| `Menu`, `DietaPaciente`, `Receta`, `DetalleReceta` | Alimentación, dietas y recetas con sus detalles. |
| `Donacion`, `Habitacion`, `MovimientoPaciente` | Donaciones, disponibilidad de habitaciones y movimientos/ubicación de pacientes. |
| `Pais`, `Provincia`, `Localidad` | Datos geográficos de dirección. |

Relaciones centrales: persona pertenece a dirección; usuario pertenece a
persona; paciente puede pertenecer a usuario; visita pertenece a paciente;
producto puede pertenecer a proveedor y tiene muchos movimientos; ingreso tiene
muchos detalles; turno vincula médico y paciente; historial, dieta y receta se
vinculan con paciente y médico; receta tiene detalles.

**Modelos más importantes para explicar el objetivo de stock:**

1. `Producto`: estado actual del artículo, nombre, categoría, unidad, stock
   actual y mínimo, precio, proveedor, lote y vencimiento.
2. `MovimientoInventario`: evento que explica el cambio de stock (tipo,
   cantidad, responsable, motivo y datos de costo).
3. `IngresoAlmacen` y `DetalleIngresoAlmacen`: representan una recepción
   documentada con uno o varios productos.
4. `Proveedor`: permite relacionar el catálogo y los ingresos con quien
   suministra los productos.

El stock actual en `Producto` permite consultar rápidamente la existencia; el
historial en `MovimientoInventario` permite conocer cómo cambió. Para que el
historial sea confiable, toda modificación de stock debería generar un
movimiento, con transacción y controles consistentes.

### API: rutas implementadas

Todas las rutas de negocio usan prefijo `/api`. Los parámetros entre `{}` son
valores dinámicos; los cuerpos de alta/edición se envían generalmente como
JSON.

| Grupo | Métodos y rutas | Para qué sirve |
|---|---|---|
| Salud | `GET /health` | Comprueba que el servidor está activo. |
| Sesión | `POST /api/registro`, `POST /api/login` | Registrar una cuenta e iniciar sesión. |
| Usuarios | `GET /api/usuarios`, `GET /api/usuarios/catalogo`, `POST /api/usuarios`, `PUT /api/usuarios/{id}`, `DELETE /api/usuarios/{id}` | Consultar catálogo y administrar cuentas. |
| Personas | `GET /api/personas`, `POST /api/personas`, `PUT /api/personas/{id}`, `DELETE /api/personas/{id}` | CRUD de personas. |
| Roles | `GET /api/roles`, `POST /api/roles`, `PUT /api/roles/{id}`, `DELETE /api/roles/{id}` | CRUD de roles. |
| Pacientes | `GET /api/pacientes`, `GET /api/pacientes/buscar?query=...` (también admite `dni`), `POST /api/pacientes`, `PUT /api/pacientes/{id}`, `DELETE /api/pacientes/{id}` | CRUD y búsqueda de pacientes. |
| Personal | `GET /api/personal`, `POST /api/personal`, `PUT /api/personal/{id}`, `DELETE /api/personal/{id}` | CRUD del personal. |
| Patologías | `GET /api/patologias`, `POST /api/patologias`, `PUT /api/patologias/{id}`, `DELETE /api/patologias/{id}` | CRUD de patologías. |
| Movimientos de pacientes | `GET /api/movimientos`, `POST /api/movimientos`, `PUT /api/movimientos/{id}`, `DELETE /api/movimientos/{id}` | CRUD de movimientos administrativos/ubicación. |
| Menús | `GET /api/menus`, `POST /api/menus`, `PUT /api/menus/{id}`, `DELETE /api/menus/{id}` | CRUD de menús. |
| Habitaciones | `GET /api/habitaciones`, `POST /api/habitaciones`, `PUT /api/habitaciones/{id}`, `DELETE /api/habitaciones/{id}` | CRUD de habitaciones. |
| Inventario | `GET /api/inventario`, `POST /api/inventario`, `PUT /api/inventario/{id}`, `DELETE /api/inventario/{id}` | Consultar y administrar registros/productos de inventario. |
| Movimientos de stock | `POST /api/inventario/movimiento`, `GET /api/almacen/movimientos` | Registrar una entrada/salida y consultar movimientos del almacén. |
| Reportes | `GET /api/reportes/almacen` | Consultar datos agregados/reportes del almacén. |
| Productos | `GET /api/productos`, `GET /api/productos/{id}`, `POST /api/productos`, `PUT /api/productos/{id}`, `DELETE /api/productos/{id}` | CRUD del catálogo de productos. |
| Proveedores | `GET /api/proveedores`, `POST /api/proveedores`, `PUT /api/proveedores/{id}`, `DELETE /api/proveedores/{id}` | CRUD de proveedores. |
| Ingresos | `GET /api/ingresos`, `POST /api/ingresos`, `PUT /api/ingresos/{id}`, `DELETE /api/ingresos/{id}` | CRUD de ingresos de almacén. |
| Cocina | `GET /api/cocina/resumen`, `GET /api/cocina/menus`, `GET /api/cocina/dietas`, `POST /api/cocina/dietas/{id}/entregada` | Resumen, consultas y confirmación de entrega de dieta. |
| Médicos/doctor | `GET /api/medicos`, `GET /api/medicos/{especialidad}`, `GET /api/doctor/perfil`, `GET /api/doctor/resumen`, `GET /api/doctor/mis-pacientes` | Consultas de profesionales y datos de la vista del doctor. |
| Turnos | `POST /api/turnos`, `GET /api/turnos/{usuario_id}`, `DELETE /api/turnos/{id}` | Crear, consultar y cancelar turnos. |
| Donaciones | `POST /api/donaciones` | Registrar una donación. |
| Visitas | `POST /api/visitas`, `GET /api/visitas/paciente/{paciente_id}`, `GET /api/visitas/visitante/{documento}`, `PUT /api/visitas/{id}/finalizar` | Registrar, consultar y finalizar visitas. |

`GET`, `POST`, `PUT` y `DELETE` corresponden normalmente a leer, crear,
reemplazar/editar y eliminar. En la práctica, el significado y los campos
aceptados dependen de cada endpoint: no todos los módulos ofrecen las cuatro
operaciones.

### CRUD aplicado al stock

- **Create:** `POST /api/productos` crea un producto; `POST /api/inventario`
  también puede dar de alta un artículo con stock inicial. `POST
  /api/inventario/movimiento` registra una entrada o salida.
- **Read:** `GET /api/productos`, `GET /api/inventario`,
  `GET /api/almacen/movimientos` y `GET /api/reportes/almacen` consultan
  catálogo, existencia, historial y agregados.
- **Update:** `PUT /api/productos/{id}` o `PUT /api/inventario/{id}` modifica
  datos del producto; la operación de movimiento ajusta el stock y registra el
  evento.
- **Delete:** `DELETE /api/productos/{id}` o `DELETE /api/inventario/{id}`
  elimina un registro si la base permite hacerlo.

En la ruta de movimiento, el backend valida cantidad positiva, exige responsable
y, para ingresos, precio unitario; impide salidas que dejen stock negativo.
Actualización y creación del movimiento ocurren dentro de una transacción
Sequelize. La API devuelve el stock resultante.

## 5. Frontend

El frontend está en [frontend/](./frontend/). Es una aplicación estática
multipágina: HTML define las pantallas; CSS define la presentación; JavaScript
maneja eventos, carga datos y llama a la API.

### Estructura de `frontend/src`

- `api/config.js`: configura el origen del backend en `window.BACKEND_ORIGIN`.
- `pages/`: páginas HTML y scripts de comportamiento.
- `services/`: funciones de acceso y configuración de datos compartidas.
- `utils/`: URL del backend, modales, alertas, navegación y sesión.
- `estilo.css`: hoja de estilos común que existe actualmente en `src`.

### Páginas y JavaScript

Los HTML contienen estructura, tablas, formularios, menús y elementos de cada
pantalla. Los scripts JavaScript asociados reaccionan a `DOMContentLoaded`,
leen campos, hacen peticiones, renderizan resultados y manejan altas, cambios y
bajas. Entre las páginas principales están:

- `index.html`: inicio/sesión y registro.
- `dashboard.html`: panel general.
- `almacenero.html` y `gestionar-inventario.html`: existencias y actividad de
  almacén.
- `gestionar-productos.html`, `gestionar-proveedores.html` e
  `gestionar-ingresos-almacen.html`: catálogo, proveedores e ingresos.
- `gestionar-movimientos.html`: movimientos administrativos.
- `cocinero.html`: vista de cocina, menús, dietas y entregas. También hay un
  archivo `cocinero.htm`, extensión alternativa que conviene revisar para
  evitar dos puntos de entrada ambiguos.
- `doctor.html`, `agendar-turno.html`, `paciente.html`, `visitas.html` y
  `donaciones.html`: pantallas asociadas a esos roles/funciones.
- `gestionar-personas.html`, `gestionar-usuarios.html`,
  `gestionar-personal.html`, `gestionar-roles.html`,
  `gestionar-pacientes.html`, `gestionar-patologias.html` y
  `gestionar-habitaciones.html`: pantallas administrativas.

Los scripts `inventario.js`, `ingresos.js`, `productos.js`, `proveedores.js`,
`movimientos.js`, `menus.js`, `habitaciones.js`, `pacientes.js`,
`personal.js`, `personas.js`, `patologias.js`, `usuarios.js` y `roles.js`
implementan comportamientos particulares de sus pantallas. Otros scripts
principales son `almacenero.js`, `cocinero.js`, `doctor.js`, `paciente.js`,
`dashboard.js` y `visitas.js`.

### `api-service.js`

[frontend/src/services/api-service.js](./frontend/src/services/api-service.js)
centraliza varias llamadas HTTP del frontend. Incluye login/registro y
operaciones de obtención, guardado y eliminación para personas, personal,
patologías, pacientes, movimientos, menús, inventario, ingresos y habitaciones.
Elige `POST` o `PUT` según si el objeto ya tiene identificador.

Es importante porque evita repetir URLs y lógica de `fetch` en cada formulario.
Parte del frontend utiliza este servicio; otras pantallas, como cocina,
almacenero o visitas, realizan sus propias peticiones. Conviene ir migrando a
una capa compartida para tener manejo de errores, cabeceras y respuestas
uniformes.

### `admin-datos.js`

[frontend/src/services/admin-datos.js](./frontend/src/services/admin-datos.js)
es un administrador CRUD configurable para varias tablas. Un objeto de
configuración declara endpoint, columnas, campos y formularios de personas,
personal, pacientes, proveedores, productos, patologías, menús, movimientos e
inventario. El script carga/renderiza tablas, crea formularios dinámicos,
envía alta/edición/baja y conserva caché de filas. También consulta reportes y
productos para mostrar avisos de stock bajo.

Es útil porque reutiliza la misma lógica en varias pantallas, aunque los
formularios dinámicos dependen de que los nombres y formatos de la API coincidan
con cada configuración.

### `utils.js`

[frontend/src/utils/utils.js](./frontend/src/utils/utils.js) agrupa helpers
generales:

- `getBackendOrigin()` decide el origen del backend usando
  `window.BACKEND_ORIGIN`, un valor guardado en `localStorage` o un valor
  predeterminado.
- `buildApiUrl()` arma URLs con el prefijo `/api`.
- `openModal()`, `closeModal()` y `showAlert()` manejan modales y avisos.
- `logout()` limpia datos de sesión local y vuelve a la página de inicio.
- `showSection()` y los listeners globales gestionan navegación de secciones,
  sidebar, registro y visualización del usuario.

### Estilos y enlaces HTML

Las páginas dentro de `frontend/src/pages/` enlazan `../estilo.css`, que
resuelve a `frontend/src/estilo.css`. Se verificó que esa hoja de estilos carga
en el navegador local. También se revisaron a 390 px las páginas de acceso y
almacén: no aparece desbordamiento horizontal de página; la tabla de inventario
se desplaza dentro de su contenedor y el modal de movimiento permite scroll
vertical. La revisión local no sustituye capturas y smoke tests en Vercel.

## 6. Configuración `.env`, Render y Vercel

### Backend

[backend/db.js](./backend/db.js) carga `backend/.env` con `dotenv`. Variables que
el código puede leer:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | URL completa de PostgreSQL; si existe, es la conexión prioritaria. |
| `DB_HOST`, `DB_PORT` | Host y puerto alternativos. El puerto predeterminado es `5432`. |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Base, usuario y contraseña cuando no se usa `DATABASE_URL`. |
| `DB_SSL` | Fuerza SSL con `true`, `1` o `yes`; si no se define, se activa por defecto para hosts que no sean localhost. |
| `DB_POOL_MAX` | Máximo de conexiones del pool; predeterminado `10`. |
| `PORT` | Puerto HTTP asignado por Render o, localmente, predeterminado `3001`. |
| `NODE_ENV` | Render lo define como `production` en [el manifiesto del backend](https://github.com/agustinignaciofloores/proyecto-de-stock-del-hospital-backend/blob/main/render.yaml). |

En producción, las variables se cargan en el panel de Render. En local, se
guardan en `backend/.env`. Ese archivo no debe subirse al repositorio: puede
contener credenciales y los `.gitignore` de backend/frontend excluyen `.env`.
Nunca se deben copiar secretos reales a documentación, capturas o PowerPoint.

### Frontend

Existe [frontend/.env.example](./frontend/.env.example), que documenta
`BACKEND_ORIGIN` como URL pública del backend. También hay un `.env` dentro de
`frontend/src`, pero el servidor estático de frontend no carga `dotenv` y el
navegador no lee archivos `.env`. Para el funcionamiento actual manda el valor
de `src/api/config.js`; el `.env.example` es una indicación de despliegue, no una
integración automática con el JavaScript del navegador.

No se debe poner `DATABASE_URL`, contraseñas ni secretos en el frontend. Todo
valor enviado al navegador puede ser visto por los usuarios. En Vercel solo se
debe exponer configuración pública como el origen de la API, y el código debe
consumirla de forma explícita.

## 7. Servidor frontend, manifiestos y carpetas `node_modules`

- [frontend/server.js](./frontend/server.js) es un servidor estático pequeño
  hecho con el módulo nativo `http` de Node; **no** es Express. Redirige `/` a
  `src/pages/index.html`, busca los archivos dentro de la carpeta frontend,
  asigna MIME types y devuelve `404` para rutas no encontradas. Su puerto es
  `PORT` o `3000`.
- [frontend/package.json](./frontend/package.json) declara el paquete del
  frontend, el script `start`/`dev` y `dotenv`. No hay paso real de compilación:
  el script `build` solo imprime que no hace falta build para el frontend
  estático.
- [frontend/vercel.json](./frontend/vercel.json) fija el sitio como estático,
  usa el directorio raíz de frontend como salida y redirige `/` a la página de
  inicio.
- [render.yaml del repositorio backend](https://github.com/agustinignaciofloores/proyecto-de-stock-del-hospital-backend/blob/main/render.yaml)
  configura el servicio backend en Render, no el sitio de Vercel. El archivo
  vive en el remoto independiente del backend.
- `backend/node_modules/` es una carpeta generada por `npm install` dentro de
  backend. Contiene dependencias descargadas que necesita el backend para
  ejecutarse; no es código propio y se puede regenerar con el manifiesto y el
  lockfile.
- También aparece `node_modules/` en la raíz del repositorio. Como no hay un
  `package.json` raíz en la estructura actual y el backend ya tiene su propio
  `node_modules`, esa carpeta raíz parece corresponder a una instalación
  ejecutada desde la raíz o a residuos de desarrollo. No hace falta para el
  despliegue descrito. Conviene ignorar las carpetas `node_modules` en el
  `.gitignore` raíz y no subirlas a Git.

Para desarrollo local, ejecutar cada aplicación desde su carpeta:

```powershell
cd backend
npm install
npm start
```

En otra terminal:

```powershell
cd frontend
npm install
npm start
```

El backend local escucha por defecto en `http://localhost:3001`; el frontend,
en `http://localhost:3000`.

## 8. Puntos fuertes

- Separación entre interfaz, API y persistencia: Vercel sirve la interfaz,
  Render ejecuta la API y PostgreSQL conserva los datos.
- El backend está organizado por módulos funcionales y utiliza Sequelize con
  modelos y asociaciones.
- El módulo de stock contempla catálogo, stock actual, proveedores, ingresos,
  movimientos, reportes y alertas visuales de stock bajo.
- La operación de movimiento de inventario aplica transacción y evita un stock
  negativo en una salida.
- Hay comprobación de salud `/health`, configuración de SSL y pool de conexiones
  para PostgreSQL.
- Las pantallas incluyen formularios y operaciones CRUD para varias áreas, y
  hay utilidades compartidas para URLs, alertas, navegación y renderizado de
  tablas.
- La solución usa tecnologías conocidas y fáciles de explicar: JavaScript,
  Node, Express, PostgreSQL, HTML y CSS.

## 9. Aspectos a mejorar y rutas/funcionalidades pendientes

Esta lista es una propuesta de evolución, no una afirmación de que el sistema ya
las tenga:

### Prioridad alta: seguridad y datos

1. El backend verifica JWT HS256 con expiración de una hora y aplica autorización
  por rol en `/api`. El frontend guarda el token tras login, lo envía como
  bearer y lo elimina al cerrar sesión. El alta pública crea solo pacientes.
  Render genera `JWT_SECRET` desde su manifiesto; en local se define en
  `backend/.env`.
2. Al registrar y validar usuarios todavía se usa la contraseña directamente,
  sin hash. Usar `bcrypt`/`argon2` y migrar credenciales existentes con cuidado
  es una tarea pendiente; no usar contraseñas reales en esta versión.
3. Limitar CORS al dominio de Vercel, no dejar una política abierta para
  cualquier origen en producción.
4. Completar validación de datos en servidor y límites de longitud/cantidad;
  la API ya normaliza los cuerpos de error y oculta el detalle de fallos 500.
5. Asegurar la consistencia del inventario: impedir borrar productos con
   movimientos relacionados o usar baja lógica; asegurar que cualquier cambio
   de stock quede auditado; registrar quién realiza cada operación.

### Rutas que completarían módulos existentes

- **Autenticación:** renovar sesión, cierre/revocación de token, cambio o
  recuperación de contraseña y perfil del usuario autenticado. `logout()` hoy
  limpia el navegador, pero no revoca una sesión en el backend.
- **Pacientes:** endpoint para historia clínica y patologías asociadas; verificar
  si corresponde baja lógica en vez de borrar pacientes.
- **Visitas:** `GET /api/visitas` con filtros/estado para administración y
  endpoint para editar datos o cancelar una visita, además de finalizarla.
- **Turnos:** `PUT/PATCH /api/turnos/{id}` para reprogramar, consulta de
  disponibilidad y validación de solapamientos. Hoy se puede crear, listar por
  usuario y cancelar, pero no editar.
- **Donaciones:** listar, ver detalle y administrar/corregir o anular registros;
  actualmente se observa solo el alta.
- **Cocina/dietas:** crear y actualizar dietas, asociarlas de forma controlada a
  pacientes y documentar su historial de entrega. Actualmente hay consulta y
  acción de marcar como entregada.
- **Recetas e historia clínica:** crear endpoints para `Receta`,
  `DetalleReceta` e `HistorialMedico`; los modelos existen, pero no se observan
  routers CRUD dedicados.
- **Direcciones/geografía:** endpoints de catálogo para `Pais`, `Provincia`,
  `Localidad` y `Direccion`, si las pantallas deben administrarlos.
- **Reportes:** filtros por período, categoría, proveedor y producto, además de
  exportación (por ejemplo CSV), paginación y límites de resultados.

### Mejoras de frontend/despliegue

- Corregir la discrepancia de la ruta de `estilo.css`.
- En `utils.js`, el origen local de respaldo figura como
  `http://localhost:3000`, que es el puerto del frontend; el backend local usa
  `3001`. Además, `src/api/config.js` asigna directamente el dominio de Render,
  por lo que durante desarrollo local puede terminar llamándose a producción.
  Separar configuración local y producción y evitar valores ambiguos.
- Decidir una sola estrategia para `BACKEND_ORIGIN`: configurar un valor
  público inyectado en build o mantener un archivo de configuración por
  entorno; ahora el `.env.example` no se consume automáticamente.
- Centralizar `fetch`, cabeceras y errores. Algunos métodos de
  `api-service.js` capturan excepciones y retornan valores vacíos/de éxito
  genérico, lo cual puede ocultar un fallo al usuario.
- Añadir pruebas para validación, operaciones CRUD, cambios de stock y
  asociaciones; documentar datos de prueba y configuración reproducible.
- Limpiar duplicados/ambigüedades como `cocinero.htm` y `cocinero.html` si no
  existe una razón para mantener ambos.

## 10. Guion corto para la defensa

> “Desarrollé un sistema web de gestión hospitalaria cuyo módulo principal es
> el inventario del almacén. La interfaz está hecha con HTML, CSS y JavaScript;
> el backend usa Node.js y Express para exponer una API REST, Sequelize para
> acceder a PostgreSQL y JSON para intercambiar datos. El frontend se publica
> en Vercel y la API en Render. Una operación, como registrar una salida,
> viaja desde el navegador al endpoint, valida la cantidad y el responsable,
> actualiza el stock dentro de una transacción y guarda un movimiento para
> mantener historial. También hay módulos de usuarios, personas, pacientes,
> cocina, visitas, turnos y administración. Como próximos pasos, priorizaría
> el hash de contraseñas, completar rutas de historia clínica/recetas y validar
> los flujos de escritura en un entorno de pruebas.”

### Preguntas que podrían hacerte

- **¿Por qué separar frontend y backend?** Para que la interfaz y la API se
  desplieguen por separado y se comuniquen por HTTP/JSON.
- **¿Qué guarda PostgreSQL?** Datos persistentes: productos, existencias,
  movimientos, usuarios y las otras entidades modeladas.
- **¿Para qué Sequelize?** Define modelos y relaciones y permite operaciones
  sobre PostgreSQL sin escribir SQL en cada endpoint; se conserva SQL puntual
  para compatibilidad del esquema.
- **¿Cómo se evita una salida mayor al stock?** La ruta de movimiento calcula
  el saldo, rechaza un resultado negativo y persiste el cambio junto al
  movimiento en una transacción.
- **¿Qué diferencia hay entre producto y movimiento?** Producto representa el
  artículo y su saldo actual; movimiento explica una entrada, salida o ajuste
  que modifica ese saldo.
- **¿Qué falta para producción real?** Hash de contraseñas, revocación de
  sesiones, validaciones completas, pruebas de integración, CORS restrictivo,
  mayor segregación de datos clínicos y políticas operativas de respaldo y auditoría.
