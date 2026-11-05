# DER del sistema

Diagrama resumido de las relaciones persistidas principales del esquema SQL.
No representa todas las columnas ni sustituye el script de base de datos.

```mermaid
erDiagram
    PAIS ||--o{ PROVINCIA : contiene
    PROVINCIA ||--o{ LOCALIDAD : contiene
    PAIS o|--o{ DIRECCION : nacionalidad
    PROVINCIA o|--o{ DIRECCION : jurisdiccion
    LOCALIDAD o|--o{ DIRECCION : ubicacion
    DIRECCION o|--o{ PERSONA : domicilio
    PERSONA ||--o{ USUARIO : identifica
    USUARIO o|--o{ PACIENTE : perfil
    USUARIO o|--o{ MOVIMIENTO_INVENTARIO : registra
    USUARIO o|--o{ INGRESO_ALMACEN : registra
    USUARIO o|--o{ DONACION : realiza
    PACIENTE ||--o{ VISITA : recibe
    PACIENTE o|--o{ TURNO : agenda
    MEDICO o|--o{ TURNO : atiende
    PACIENTE ||--o{ HISTORIAL_MEDICO : tiene
    MEDICO o|--o{ HISTORIAL_MEDICO : registra
    PATOLOGIA o|--o{ HISTORIAL_MEDICO : clasifica
    PACIENTE ||--o{ DIETA_PACIENTE : recibe
    MEDICO o|--o{ DIETA_PACIENTE : prescribe
    PACIENTE ||--o{ RECETA : recibe
    MEDICO ||--o{ RECETA : emite
    RECETA ||--o{ DETALLE_RECETA : contiene
    PRODUCTO o|--o{ DETALLE_RECETA : medicamento
    PROVEEDOR o|--o{ PRODUCTO : suministra
    PROVEEDOR o|--o{ MOVIMIENTO_INVENTARIO : origen
    PRODUCTO ||--o{ MOVIMIENTO_INVENTARIO : modifica_stock
    PROVEEDOR o|--o{ INGRESO_ALMACEN : entrega
    INGRESO_ALMACEN ||--o{ DETALLE_INGRESO : contiene
    PRODUCTO ||--o{ DETALLE_INGRESO : recibido
    TURNO o|--o{ RECETA : origina

    PAIS {
        int id_pais PK
        string nombre_pais
        string codigo_pais
    }
    PERSONA {
        int id_persona PK
        int dni UK
        int id_direccion FK
    }
    USUARIO {
        int id_usuario PK
        int id_persona FK
        string usuario UK
        string rol
    }
    PACIENTE {
        int id PK
        int usuario_id FK
        string documento UK
    }
    PRODUCTO {
        int id PK
        int proveedor_id FK
        string nombre
        int stock_actual
    }
    PROVEEDOR {
        int id PK
        string cuit UK
        string nombre
    }
    MOVIMIENTO_INVENTARIO {
        int id PK
        int producto_id FK
        int usuario_id FK
        string tipo_movimiento
        int cantidad
    }
    INGRESO_ALMACEN {
        int id PK
        int proveedor_id FK
        int usuario_id FK
    }
    DETALLE_INGRESO {
        int id PK
        int ingreso_id FK
        int producto_id FK
        int cantidad
    }
```

En el SQL, el rol del usuario se guarda como texto restringido, no como clave
foránea a `roles`. El catálogo `menus`, las habitaciones y los movimientos de
pacientes no aparecen en este resumen. Confirmar las cardinalidades y nombres
contra la versión final del esquema antes de entregar.