# Requisitos funcionales y MVP

## Alcance propuesto

No se encontró una especificación original aprobada en el workspace. Este MVP se
infiere del código y de `GUIA_PROYECTO.md`; el equipo debe cotejarlo con lo que
presentó al profesor y ajustar el alcance si difiere.

### MVP: inventario de almacén

| ID | Requisito verificable | Evidencia actual | Estado de validación |
|---|---|---|---|
| INV-01 | Consultar productos con stock, unidad, proveedor y datos de lote. | `GET /api/inventario` en [almacen-sequelize.router.js](https://github.com/agustinignaciofloores/proyecto-de-stock-del-hospital-backend/blob/main/routes/almacen-sequelize.router.js). | Código presente; falta smoke test contra PostgreSQL. |
| INV-02 | Crear un producto con nombre y stock inicial entero no negativo. | `POST /api/inventario`. | Código presente; falta prueba de integración. |
| INV-03 | Registrar ingreso con cantidad positiva y precio unitario no negativo. | `POST /api/inventario/movimiento`. | Validación de ruta presente; probar en DB. |
| INV-04 | Registrar salida con cantidad positiva, responsable y stock suficiente. | `POST /api/inventario/movimiento`. | Tests unitarios simulados presentes; probar en DB. |
| INV-05 | Actualizar stock y guardar el movimiento en una transacción. | Transacción Sequelize y bloqueo de fila en la ruta de movimiento. | Tests unitarios simulados presentes; verificar rollback/aislamiento en PostgreSQL. |
| INV-06 | Consultar historial y resumen del almacén. | `GET /api/almacen/movimientos` y `GET /api/reportes/almacen`. | Código presente; falta prueba de extremo a extremo. |
| INV-07 | Mostrar formulario, errores y resultados en escritorio y móvil. | HTML y CSS responsive en `frontend/src/estilo.css`. | Acceso, almacén, tabla y modal revisados localmente a 390 px; falta guardar capturas y probar en Vercel. |

### Requisitos transversales

- REQ-01: no permitir operaciones inválidas ni stock negativo; validar en backend aunque exista validación HTML.
- REQ-02: informar errores con forma JSON uniforme y no exponer detalles internos en respuestas 500. Implementado en middleware API; completar validación de todos los campos de negocio.
- REQ-03: persistir en PostgreSQL y conservar el movimiento que justifica cada cambio de stock.
- REQ-04: documentar instalación, variables de entorno, prueba, despliegue y usuario/datos de demostración no sensibles.
- REQ-05: login con JWT HS256 verificable, expiración de una hora, autorización por rol y restricciones de propiedad para turnos, ficha y visitas. Implementado; el secreto se define en `JWT_SECRET` (Render lo genera desde `render.yaml`). Las contraseñas siguen en texto plano por decisión explícita de postergar el hash; no usar credenciales reales.

## Criterios para cerrar la demo

1. Partir de una base dedicada de pruebas creada con `database_schema.sql`.
2. Iniciar API y frontend, comprobar `GET /health` y acceder al rol de almacén.
3. Registrar un ingreso y comprobar producto, saldo y movimiento persistidos.
4. Registrar una salida válida y comprobar saldo e historial.
5. Intentar una salida mayor al stock y confirmar que devuelve error y no altera los datos.
6. Repetir los pasos principales con viewport móvil y registrar capturas.
7. Repetir el smoke test en las URLs publicadas y guardar fecha, URL, resultado y evidencia.

No ejecutar los pasos con la base productiva. Guardar credenciales de demostración
fuera de este documento y de Git.