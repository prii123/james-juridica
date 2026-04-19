# Resumen de Reorganización - Arquitectura de Capas

## 📋 Descripción General

Se ha reorganizado el proyecto **juridica-insolvencia** para implementar una **arquitectura de capas escalable, segura y mantenible**. El objetivo es separar claramente la lógica de negocio de las vistas y crear un patrón consistente en toda la aplicación.

---

## ✅ Cambios Realizados

### 1. **Documentación de Arquitectura** ✓
- **Archivo:** `ARCHITECTURE.md`
- **Contenido:**
  - Diagrama de capas (Cliente → Rutas → Servicios → Modelos → Repositorio → BD)
  - Definición de responsabilidades de cada capa
  - Patrones de implementación para CRUD
  - Convenciones de código
  - Checklist para nuevos módulos

### 2. **Sistema Centralizado de Errores** ✓
- **Archivo:** `src/lib/api-errors.ts`
- **Clases de Error:**
  - `AppError` - Error base
  - `ValidationError` - Errores de validación (400)
  - `AuthenticationError` - No autenticado (401)
  - `AuthorizationError` - No autorizado (403)
  - `NotFoundError` - Recurso no encontrado (404)
  - `ConflictError` - Conflictos de datos (409)
  - `BusinessError` - Errores de negocio (422)
  - `ServiceUnavailableError` - Servicios externos (503)
- **Manejo de Errores:**
  - Funciones para manejar errores de Prisma
  - Funciones para manejar errores de Zod
  - Wrapper centralizado para respuestas HTTP
  - Sistema de logging con contexto

### 3. **Utilidades para Respuestas HTTP** ✓
- **Archivo:** `src/lib/api-response.ts`
- **Funciones:**
  - `successResponse<T>()` - Crea respuesta exitosa
  - `okResponse<T>()` - Retorna 200
  - `createdResponse<T>()` - Retorna 201
  - `noContentResponse()` - Retorna 204
  - `errorResponse()` - Retorna error estructurado
  - `paginatedResponse<T>()` - Respuesta paginada
- **Patrón Consistente:**
  ```json
  {
    "success": true,
    "data": {...},
    "timestamp": "2024-04-18T...",
    "meta": { "page": 1, "limit": 10, "total": 50, "hasMore": true }
  }
  ```

### 4. **Reorganización Módulo CASOS** ✓
- **Archivos Modificados:**
  - `src/modules/casos/models.ts` - **NUEVO**
  - `src/modules/casos/services.ts` - Actualizado con nuevo sistema de errores
  - `src/modules/casos/types.ts` - Existente
  - `src/modules/casos/validators.ts` - Existente
  - `src/modules/casos/repository.ts` - Existente

- **Nuevas Funcionalidades en Models:**
  - Errores específicos de casos (`CasoError`, `CasoNoEncontradoError`, etc.)
  - DTO de respuesta (`CasoResponseDTO`)
  - Función `mapearCasoParaRespuesta()` para transformar datos
  - Validaciones complejas (`validarPuedeEliminarCaso`, `validarPuedeCerrarCaso`, etc.)
  - Utilidades de dominio (`calcularTiempoTranscurrido`, `estaCasoProximoAVencer`, etc.)

- **Mejoras en Servicios:**
  - Uso de errores personalizados en lugar de `Error` genérico
  - Mapeo automático a DTO en todas las operaciones
  - Documentación JSDoc para cada método
  - Mejores mensajes de error con contexto

---

## 🏗️ Estructura de Capas Implementada

### Patrón Ruta → Servicio → Modelo → Repositorio

```
REQUEST HTTP
    ↓
┌─────────────────────────────────────────┐
│  CAPA DE RUTA (Route)                   │
│  src/app/api/[module]/route.ts          │
│  - Valida con Zod                       │
│  - Verifica autenticación                │
│  - Verifica autorización                │
│  - Llama al servicio                     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  CAPA DE SERVICIOS (Service)            │
│  src/modules/[module]/services.ts       │
│  - Orquesta operaciones                  │
│  - Valida reglas de negocio             │
│  - Maneja errores                        │
│  - Retorna DTOs                          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  CAPA DE MODELOS (Models)               │
│  src/modules/[module]/models.ts         │
│  - Validaciones complejas               │
│  - Transformaciones de datos            │
│  - DTOs                                  │
│  - Errores específicos                   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  CAPA DE REPOSITORIO (Repository)       │
│  src/modules/[module]/repository.ts     │
│  - Acceso a datos con Prisma            │
│  - Queries reutilizables                 │
│  - Transacciones                         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  BASE DE DATOS (PostgreSQL)             │
└─────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos por Módulo

Cada módulo debe tener:

```
src/modules/[nombre]/
├── types.ts           # Interfaces TypeScript
├── validators.ts      # Esquemas Zod
├── models.ts          # Lógica de dominio, DTOs, errores
├── repository.ts      # Acceso a datos (Prisma)
├── services.ts        # Lógica de negocio
└── errors.ts          # (Opcional) Errores específicos
```

---

## 🔐 Características de Seguridad

### 1. **Validación en Múltiples Niveles**
- **Nivel 1:** Zod en la ruta (tipo y formato)
- **Nivel 2:** Validaciones complejas en servicios (reglas de negocio)
- **Nivel 3:** Validaciones en repositorio (constraints de BD)

### 2. **Errores Seguros**
- Los errores nunca revelan detalles internos
- Stack traces solo en logs del servidor
- Mensajes claros para el cliente

### 3. **DTOs (Data Transfer Objects)**
- Las respuestas nunca retornan entidades completas
- Se mapean a DTOs antes de enviar
- Campos sensibles se excluyen automáticamente

### 4. **Separación de Responsabilidades**
- Las rutas no acceden directamente a la BD
- Los servicios no saben de HTTP
- Los modelos son independientes de persistencia

---

## 🚀 Cómo Usar la Arquitectura

### Crear un Nuevo Endpoint CRUD

**1. Crear validador** (`src/modules/[modulo]/validators.ts`)
```typescript
export const crearXValidator = z.object({
  nombre: z.string().min(1),
  // ...
});
```

**2. Crear servicio** (`src/modules/[modulo]/services.ts`)
```typescript
export async function crearXService(datos: CrearXInput) {
  // Validar reglas de negocio
  // Llamar repositorio
  // Retornar DTO
  return mapearXParaRespuesta(resultado);
}
```

**3. Crear ruta** (`src/app/api/[modulo]/route.ts`)
```typescript
export async function POST(req: Request) {
  try {
    const datos = crearXValidator.parse(await req.json());
    const resultado = await crearXService(datos);
    return createdResponse(resultado);
  } catch (error) {
    return handleAPIError(error);
  }
}
```

---

## 📊 Estado de Implementación

### Módulos Completamente Implementados
- ✅ **CASOS** - Reorganizado con nueva arquitectura
- ⚠️ **LEADS** - Requiere reorganización similar

### Módulos Vacíos (Listos para Implementar)
- 🔳 ASESORÍAS
- 🔳 FACTURACIÓN
- 🔳 CARTERA
- 🔳 USUARIOS Y ROLES
- 🔳 AUDIENCIAS
- 🔳 RADICACIONES
- 🔳 HONORARIOS
- 🔳 ACTUACIONES

---

## 📝 Próximos Pasos

### Fase 1: Completar Reorganización
1. Reorganizar módulo LEADS siguiendo patrón de CASOS
2. Aplicar nuevo sistema de errores a todas las rutas

### Fase 2: Implementar Módulos Vacíos
1. ASESORÍAS
2. FACTURACIÓN
3. CARTERA
4. USUARIOS Y ROLES

### Fase 3: Mejoras
1. Agregar logging estructurado
2. Agregar métricas de performance
3. Agregar tests unitarios
4. Agregar integración con eventos

---

## 🛠️ Herramientas de Desarrollo

### Linting y Validación
```bash
npm run lint
```

### Base de Datos
```bash
npm run db:generate    # Generar Prisma Client
npm run db:migrate     # Migrar base de datos
npm run db:studio      # Abrir Prisma Studio
```

### Desarrollo
```bash
npm run dev    # Iniciar servidor de desarrollo
npm run build  # Build para producción
npm run start  # Iniciar en producción
```

---

## 📚 Referencias

### Documentos Principales
- `ARCHITECTURE.md` - Documentación completa de la arquitectura
- `IMPLEMENTATION_SUMMARY.md` - Este archivo

### Archivos Clave Creados
- `src/lib/api-errors.ts` - Sistema de errores
- `src/lib/api-response.ts` - Utilidades de respuesta
- `src/modules/casos/models.ts` - Modelo de casos (ejemplo)

### Modelos Implementados
- **CASOS** - Referencia para otros módulos

---

## ⚠️ Notas Importantes

1. **API Endpoints Existentes:** Todos los endpoints existentes siguen funcionando. Esta reorganización es interna.

2. **Compatibilidad:** La nueva arquitectura es totalmente compatible con NextAuth, Prisma y todas las dependencias existentes.

3. **Migración Gradual:** Se puede migrar módulo por módulo sin romper la aplicación.

4. **Testing:** Después de implementar cada módulo, ejecutar:
   ```bash
   npm run build
   npm run dev
   ```

---

## 👥 Autores

Reorganización realizada por: **OpenCode Architecture Refactor**
Fecha: **2024-04-18**

---

## 📞 Soporte

Para dudas sobre la implementación:
1. Revisar `ARCHITECTURE.md`
2. Revisar el módulo CASOS como referencia
3. Usar los patrones documentados

---

**¡La arquitectura está lista para escalar! 🚀**
