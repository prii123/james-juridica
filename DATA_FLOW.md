# 📊 Flujo de Datos en la Arquitectura

## 1. Flujo Completo de una Petición HTTP

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT (Frontend/Postman)                                │
│    POST /api/casos { nombre: "...", tipo: "..." }          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. RUTA API (src/app/api/casos/route.ts)                   │
│                                                              │
│   export async function POST(req: Request) {                │
│     try {                                                    │
│       const body = await req.json()                         │
│       ✓ Validar autenticación                              │
│       ✓ Validar permisos                                    │
│       const datos = crearCasoValidator.parse(body)         │
│       const resultado = await crearCasoService(datos)       │
│       return createdResponse(resultado)                     │
│     } catch (error) {                                       │
│       return handleAPIError(error)                          │
│     }                                                        │
│   }                                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
        ✓ Datos validados ✓ Usuario autenticado
        ✓ Permisos verificados
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. VALIDADOR (Zod)                                          │
│    src/modules/casos/validators.ts                          │
│                                                              │
│    const crearCasoValidator = z.object({                    │
│      tipoInsolvencia: z.nativeEnum(TipoInsolvencia),       │
│      clienteId: z.string().cuid(),                          │
│      responsableId: z.string().cuid(),                      │
│      prioridad: z.nativeEnum(Prioridad).optional(),        │
│      observaciones: z.string().max(2000).optional(),       │
│    })                                                        │
│                                                              │
│    ✓ Validación de tipos                                    │
│    ✓ Validación de formato                                  │
│    ✓ Transformación de entrada                              │
│    ✓ Errores claros si falla                                │
└────────────────────────┬────────────────────────────────────┘
                         │
        ✓ Datos tipados correctamente
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. SERVICIO (src/modules/casos/services.ts)                │
│                                                              │
│    export class CasosService {                              │
│      async createCaso(data: CreateCasoData) {               │
│        // Validar datos de entrada                          │
│        const validated = createCasoSchema.parse(data)       │
│                                                              │
│        // Calcular prioridad automática                     │
│        if (!validated.prioridad) {                          │
│          validated.prioridad = calculateCasePriority(...)   │
│        }                                                     │
│                                                              │
│        // TODO: Validar reglas de negocio                   │
│        // - El cliente existe                               │
│        // - El responsable existe                           │
│        // - No hay caso activo duplicado                    │
│                                                              │
│        // Llamar repositorio                                │
│        const caso = await this.repository.create(validated) │
│                                                              │
│        // Mapear a DTO                                      │
│        return mapearCasoParaRespuesta(caso)                │
│      }                                                       │
│    }                                                         │
│                                                              │
│    Responsabilidades:                                       │
│    ✓ Orquestar operaciones                                  │
│    ✓ Validar reglas de negocio                             │
│    ✓ Manejar transacciones                                  │
│    ✓ Llamar otros servicios si necesario                    │
│    ✓ Retornar DTOs (no entidades)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
        ✓ Lógica de negocio ejecutada
        ✓ Datos preparados para persistencia
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. MODELO (src/modules/casos/models.ts)                    │
│                                                              │
│    // DTOs (Data Transfer Objects)                          │
│    export interface CasoResponseDTO {                       │
│      id: string                                             │
│      numeroCaso: string                                     │
│      estado: EstadoCaso                                     │
│      // ... campos públicos                                 │
│      // NO campos sensibles                                 │
│    }                                                         │
│                                                              │
│    // Mapeo seguro                                          │
│    export function mapearCasoParaRespuesta(                 │
│      caso: CasoWithRelations                                │
│    ): CasoResponseDTO {                                     │
│      return {                                                │
│        id: caso.id,                                          │
│        // Excluir campos internos                           │
│      }                                                       │
│    }                                                         │
│                                                              │
│    // Validaciones complejas                                │
│    export function validarPuedeEliminarCaso(                │
│      caso: CasoWithRelations                                │
│    ): string[] {                                            │
│      const relacionesPresentes: string[] = []               │
│      if (caso._count?.documentos > 0) {                     │
│        relacionesPresentes.push('documentos')               │
│      }                                                       │
│      return relacionesPresentes                             │
│    }                                                         │
│                                                              │
│    Responsabilidades:                                       │
│    ✓ Validaciones de dominio                                │
│    ✓ Transformaciones de datos                              │
│    ✓ DTOs para respuestas                                   │
│    ✓ Errores específicos del negocio                        │
└────────────────────────┬────────────────────────────────────┘
                         │
        ✓ Datos transformados a DTO
        ✓ Campos sensibles excluidos
        ✓ Validaciones complejas completadas
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. REPOSITORIO (src/modules/casos/repository.ts)           │
│                                                              │
│    export class CasosRepository {                           │
│      async create(data: CreateCasoData) {                   │
│        return await prisma.caso.create({                    │
│          data: {                                             │
│            ...data,                                          │
│            numeroCaso: await this.generateCasoNumber(),     │
│          },                                                  │
│          include: {                                          │
│            cliente: { select: { id, nombre, ... } },        │
│            responsable: { select: { id, nombre, ... } },    │
│            _count: { select: { documentos, ... } },         │
│          }                                                   │
│        })                                                    │
│      }                                                       │
│    }                                                         │
│                                                              │
│    Responsabilidades:                                       │
│    ✓ Queries con Prisma                                     │
│    ✓ Joins/includes                                         │
│    ✓ Transacciones                                          │
│    ✓ Manejo de constraints                                  │
│    ✓ Mapeo de entidades                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
        ✓ Query preparado
        ✓ Datos incluidos
        ✓ Counts calculados
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. BASE DE DATOS (PostgreSQL + Prisma)                     │
│                                                              │
│    INSERT INTO casos (                                       │
│      numeroCaso, tipoInsolvencia, estado,                   │
│      clienteId, responsableId, creadoPorId                  │
│    ) VALUES (...)                                            │
│                                                              │
│    RETURNING *                                              │
│    LEFT JOIN cliente ON casos.clienteId = cliente.id        │
│    LEFT JOIN usuarios ON casos.responsableId = usuarios.id  │
│                                                              │
│    ✓ Validación de constraints                              │
│    ✓ Transacción atómica                                    │
│    ✓ Integridad referencial                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
        ✓ Caso creado en BD
        ✓ Datos asociados incluidos
        ✓ Transacción completada
                         │
                         ▼
                   (RUTA INVERSA)
┌─────────────────────────────────────────────────────────────┐
│ 8. ENTIDAD RETORNA AL REPOSITORIO                           │
│                                                              │
│    {                                                         │
│      id: "cm123...",                                         │
│      numeroCaso: "CASO-2024-001",                            │
│      estado: "ACTIVO",                                       │
│      tipoInsolvencia: "REORGANIZACION",                      │
│      cliente: { id: "...", nombre: "..." },                  │
│      responsable: { id: "...", nombre: "..." },              │
│      _count: { documentos: 0, actuaciones: 0 }               │
│    }                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. MODELO MAPEA A DTO                                       │
│                                                              │
│    mapearCasoParaRespuesta(caso) retorna:                   │
│    {                                                         │
│      id: "cm123...",                                         │
│      numeroCaso: "CASO-2024-001",                            │
│      estado: "ACTIVO",                                       │
│      tipoInsolvencia: "REORGANIZACION",                      │
│      cliente: { id: "...", nombre: "..." },                  │
│      conteos: { documentos: 0, actuaciones: 0 }              │
│      // Campos sensibles eliminados                         │
│    }                                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. SERVICIO RETORNA A LA RUTA                             │
│                                                              │
│     {                                                        │
│       id: "cm123...",                                        │
│       numeroCaso: "CASO-2024-001",                           │
│       estado: "ACTIVO",                                      │
│       tipoInsolvencia: "REORGANIZACION",                     │
│       cliente: { id: "...", nombre: "..." },                 │
│       conteos: { documentos: 0, actuaciones: 0 }             │
│     }                                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. RUTA CREA RESPUESTA HTTP                                │
│                                                              │
│    createdResponse(resultado) retorna:                       │
│    {                                                         │
│      success: true,                                          │
│      data: {                                                 │
│        id: "cm123...",                                       │
│        numeroCaso: "CASO-2024-001",                          │
│        estado: "ACTIVO",                                     │
│        tipoInsolvencia: "REORGANIZACION",                    │
│        cliente: { id: "...", nombre: "..." },                │
│        conteos: { documentos: 0, actuaciones: 0 }             │
│      },                                                      │
│      timestamp: "2024-04-18T10:30:45.123Z"                   │
│    }                                                         │
│                                                              │
│    Status Code: 201 (Created)                                │
│    Content-Type: application/json                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 12. CLIENTE RECIBE RESPUESTA                                 │
│                                                              │
│    HTTP/1.1 201 Created                                      │
│    Content-Type: application/json                            │
│                                                              │
│    {                                                         │
│      "success": true,                                        │
│      "data": {                                               │
│        "id": "cm123...",                                     │
│        "numeroCaso": "CASO-2024-001",                        │
│        "estado": "ACTIVO",                                   │
│        "tipoInsolvencia": "REORGANIZACION",                  │
│        "cliente": { "id": "...", "nombre": "..." },          │
│        "conteos": { "documentos": 0, "actuaciones": 0 }      │
│      },                                                      │
│      "timestamp": "2024-04-18T10:30:45.123Z"                 │
│    }                                                         │
│                                                              │
│    ✓ Caso creado exitosamente                                │
│    ✓ Datos consistentes                                      │
│    ✓ Timestamps correctos                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Manejo de Errores en el Flujo

```
┌────────────────────────────────┐
│ VALIDACIÓN FALLA (Zod)         │
│ ej: clienteId inválido         │
└────────────┬───────────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │ ValidationError            │
    │ status: 400                │
    │ code: VALIDATION_ERROR     │
    └────────────┬───────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│ RESPUESTA HTTP                             │
│                                            │
│ HTTP/1.1 400 Bad Request                   │
│                                            │
│ {                                          │
│   "success": false,                        │
│   "error": "Validación fallida",          │
│   "code": "VALIDATION_ERROR",              │
│   "details": {                             │
│     "clienteId": "ID de cliente inválido" │
│   },                                       │
│   "timestamp": "2024-04-18T10:31:00Z"      │
│ }                                          │
└────────────────────────────────────────────┘
```

---

## 3. Flujo de Búsqueda (GET con Filtros)

```
REQUEST:
GET /api/casos?estado=ACTIVO&page=1&limit=10

    ↓

RUTA:
- Extraer parámetros de query
- Validar valores (enum, números)
- Llamar servicio con filtros

    ↓

SERVICIO:
- Preparar filtros
- Llamar repositorio con filtros + paginación
- Mapear todos los resultados a DTOs

    ↓

REPOSITORIO:
- Construir where clause
- Ejecutar findMany con filtros
- Count total de registros
- Retornar ambos

    ↓

BASE DE DATOS:
SELECT * FROM casos WHERE estado = 'ACTIVO'
  LIMIT 10 OFFSET 0
COUNT(*) FROM casos WHERE estado = 'ACTIVO'

    ↓

RESPUESTA PAGINADA:
{
  "success": true,
  "data": [...10 casos...],
  "timestamp": "...",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "hasMore": true
  }
}
```

---

## 4. Flujo de Actualización

```
REQUEST:
PUT /api/casos/cm123 { estado: "CERRADO" }

    ↓

RUTA:
- Validar que usuario está autenticado
- Validar permisos (actualizar:casos)
- Validar datos con Zod

    ↓

SERVICIO:
- Obtener caso actual
- Si no existe → CasoNoEncontradoError (404)
- Validar que pueda cambiar a estado CERRADO
- Si no puede → BusinessError (422)
- Llamar repositorio para actualizar
- Mapear resultado a DTO

    ↓

MODELO:
- validarPuedeCerrarCaso(caso)
  - Verificar estado actual
  - Verificar no tiene relaciones críticas
  - Retornar error si no puede

    ↓

REPOSITORIO:
- UPDATE casos SET estado='CERRADO', fechaCierre=NOW()
  WHERE id='cm123'

    ↓

RESPUESTA:
{
  "success": true,
  "data": {
    "id": "cm123",
    "estado": "CERRADO",
    "fechaCierre": "2024-04-18T10:32:00Z",
    ...
  },
  "timestamp": "..."
}
```

---

## 5. Flujo de Eliminación

```
REQUEST:
DELETE /api/casos/cm123

    ↓

RUTA:
- Verificar autenticación
- Verificar permiso (eliminar:casos)

    ↓

SERVICIO:
- Obtener caso
- Si no existe → NoEncontradoError (404)
- Validar si puede eliminarse
- Si tiene relaciones → CasoConRelacionesError (422)
- Llamar repositorio para eliminar

    ↓

MODELO:
- validarPuedeEliminarCaso(caso)
  - Verificar _count de relaciones
  - Retornar lista de relaciones si existen

    ↓

REPOSITORIO:
- DELETE FROM casos WHERE id='cm123'

    ↓

RESPUESTA:
HTTP/1.1 204 No Content
(Sin body)
```

---

## 6. Comparación: Antes vs Después

### ❌ ANTES (Sin Arquitectura)
```
Request → Ruta → BD directamente
         ↓
    Mezcla de:
    - Validación HTTP
    - Lógica de negocio
    - SQL queries
    - Errores genéricos
    - Datos sin mapeo

Problemas:
- Código repetido
- Difícil de testear
- Fácil de romper
- Sin errores específicos
- Seguridad débil
```

### ✅ DESPUÉS (Con Arquitectura de Capas)
```
Request → Ruta → Validador
              ↓
           Servicio → Modelo → Repositorio → BD
              ↓
    Cada capa con responsabilidad clara:
    - Ruta: HTTP y autenticación
    - Validador: Tipos y formato
    - Servicio: Lógica de negocio
    - Modelo: Dominio y DTOs
    - Repositorio: Acceso a datos

Beneficios:
✓ Código reutilizable
✓ Fácil de testear
✓ Cambios seguros
✓ Errores específicos
✓ Seguridad fuerte
✓ DTOs seguros
```

---

## 7. Mapeo de Errores a HTTP Status

```
Nivel: Validador (Zod)
Error → ValidationError → HTTP 400

Nivel: Servicio
Error → NoEncontradoError → HTTP 404
Error → BusinessError → HTTP 422
Error → AuthorizationError → HTTP 403

Nivel: Repositorio
Error: violación unique → ConflictError → HTTP 409
Error: conexión → ServiceUnavailableError → HTTP 503

Nivel: No manejado
Error → HTTP 500 (Internal Server Error)
```

---

**Este flujo asegura que:**
1. ✅ Cada solicitud se valida en múltiples niveles
2. ✅ Errores se manejan consistentemente
3. ✅ DTOs protegen datos sensibles
4. ✅ Respuestas son consistentes
5. ✅ Código es reutilizable y testeable

