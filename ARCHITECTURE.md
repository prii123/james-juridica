# Arquitectura de Capas - Juridica Insolvencia

## Visión General

Este proyecto implementa una **arquitectura de capas** clara y escalable para separar la lógica de negocios de la presentación. El propósito es mantener el código:
- **Mantenible:** Cada capa tiene responsabilidades claras
- **Escalable:** Fácil de agregar nuevas funcionalidades
- **Seguro:** Validaciones en múltiples niveles
- **Testeable:** Cada capa puede ser probada independientemente
- **Reutilizable:** La lógica de negocios es independiente de HTTP

---

## Estructura de Capas

```
┌─────────────────────────────────────────────┐
│         CAPA CLIENTE (Frontend)             │  React/Next.js
├─────────────────────────────────────────────┤
│    CAPA DE RUTAS (Routes / API Endpoints)   │  src/app/api/[module]
│  - Validación de peticiones (Zod)           │
│  - Autenticación y Autorización             │
│  - Parseo de parámetros                     │
├─────────────────────────────────────────────┤
│      CAPA DE SERVICIOS (Services)           │  src/modules/[module]/services.ts
│  - Lógica de negocios                       │
│  - Orquestación de operaciones              │
│  - Manejo de eventos                        │
│  - Llamadas a otros servicios               │
├─────────────────────────────────────────────┤
│       CAPA DE MODELOS (Models)              │  src/modules/[module]/models.ts
│  - Validaciones complejas                   │
│  - Transformaciones de datos                │
│  - Reglas de negocio                        │
│  - DTOs (Data Transfer Objects)             │
├─────────────────────────────────────────────┤
│     CAPA DE REPOSITORIO (Repository)        │  src/modules/[module]/repository.ts
│  - Acceso a datos con Prisma                │
│  - Queries reutilizables                    │
│  - Transacciones                            │
│  - Mapeo de entidades                       │
├─────────────────────────────────────────────┤
│        CAPA DE DATOS (Database)             │  Prisma / PostgreSQL
└─────────────────────────────────────────────┘
```

---

## Componentes de Cada Módulo

### Estructura de archivo de un módulo completo:

```
src/modules/[module]/
├── types.ts              # Interfaces y tipos TypeScript
├── validators.ts         # Esquemas de validación (Zod)
├── models.ts            # Lógica de transformación y validaciones complejas
├── repository.ts        # Acceso a datos (Prisma)
├── services.ts          # Lógica de negocio
└── errors.ts            # Errores específicos del módulo (opcional)
```

---

## Flujo de una Petición HTTP

```
1. REQUEST ENTRA A LA RUTA
   ↓
2. RUTA VALIDA LA PETICIÓN (Zod Validator)
   ├─ Extrae parámetros (query, body, params)
   ├─ Verifica autenticación
   ├─ Verifica autorización (permisos)
   ↓
3. RUTA LLAMA AL SERVICIO
   ├─ Pasa datos validados
   ↓
4. SERVICIO EJECUTA LÓGICA DE NEGOCIO
   ├─ Llama a modelos para validaciones complejas
   ├─ Llama a repositorio para acceso a datos
   ├─ Llama a otros servicios si es necesario
   ├─ Maneja errores de negocio
   ↓
5. REPOSITORIO ACCEDE A BASE DE DATOS
   ├─ Ejecuta queries con Prisma
   ├─ Maneja transacciones
   ├─ Retorna datos mapeados
   ↓
6. SERVICIO PROCESA RESPUESTA
   ├─ Transforma datos si es necesario
   ├─ Retorna resultado
   ↓
7. RUTA RETORNA RESPUESTA HTTP
   ├─ Status code apropiado
   ├─ Headers necesarios
   ├─ Body serializado
```

---

## Definiciones por Capa

### 1. CAPA DE RUTAS (Routes)

**Responsabilidades:**
- Recibir y validar peticiones HTTP
- Autenticación y autorización
- Parseo de parámetros (query, body, params)
- Llamar al servicio correspondiente
- Retornar respuesta HTTP

**NO DEBE:**
- Contener lógica de negocio
- Acceder directamente a la base de datos
- Hacer cálculos complejos
- Tener logica duplicada

**Ubicación:** `src/app/api/[module]/route.ts`

**Ejemplo:**
```typescript
// src/app/api/leads/route.ts
import { crearLeadService } from '@/modules/leads/services';
import { crearLeadValidator } from '@/modules/leads/validators';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validar
    const datosValidados = crearLeadValidator.parse(body);
    
    // Verificar permisos
    if (!tienePermiso(sesion, 'crear:leads')) {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }
    
    // Llamar servicio
    const lead = await crearLeadService(datosValidados);
    
    // Retornar
    return Response.json(lead, { status: 201 });
  } catch (error) {
    return manejarError(error);
  }
}
```

---

### 2. CAPA DE SERVICIOS (Services)

**Responsabilidades:**
- Implementar lógica de negocio
- Orquestar operaciones (coordinar múltiples repositorios)
- Validaciones de reglas de negocio
- Manejo de eventos y notificaciones
- Llamadas a otros servicios

**NO DEBE:**
- Saber nada de HTTP
- Validar campos (eso está en validators)
- Acceder directamente a requests/responses

**Ubicación:** `src/modules/[module]/services.ts`

**Ejemplo:**
```typescript
// src/modules/leads/services.ts
import { crearLeadRepository } from './repository';
import { validarReglasDeNegocioLead } from './models';

export async function crearLeadService(datos: CrearLeadInput) {
  // Validar reglas de negocio
  await validarReglasDeNegocioLead(datos);
  
  // Crear lead en BD
  const lead = await crearLeadRepository(datos);
  
  // Notificar (enviar email, webhook, etc)
  await notificarLeadCreado(lead);
  
  // Retornar
  return lead;
}
```

---

### 3. CAPA DE MODELOS (Models)

**Responsabilidades:**
- Validaciones complejas de reglas de negocio
- Transformación y mapeo de datos
- DTOs (Data Transfer Objects)
- Lógica de cálculos específicos del dominio
- Composición de valores complejos

**NO DEBE:**
- Acceder a la base de datos
- Saber de HTTP
- Conocer detalles de persistencia

**Ubicación:** `src/modules/[module]/models.ts`

**Ejemplo:**
```typescript
// src/modules/leads/models.ts
import { z } from 'zod';

export async function validarReglasDeNegocioLead(datos: CrearLeadInput) {
  // Validación: No puede existir lead con mismo email y estado
  if (datos.email) {
    const existente = await buscarLeadPorEmail(datos.email);
    if (existente && existente.estado === 'NUEVO') {
      throw new LeadYaExisteError('Ya existe un lead con este email');
    }
  }
  
  // Validación: Si es tipo juridica, necesita NIT
  if (datos.tipoPersona === 'JURIDICA' && !datos.nit) {
    throw new ValidacionLeadError('NIT requerido para personas jurídicas');
  }
}

// DTO para retornar
export function mapearLeadParaRespuesta(lead: Lead) {
  return {
    id: lead.id,
    nombre: lead.nombre,
    email: lead.email,
    estado: lead.estado,
    // Omitir campos sensibles
  };
}
```

---

### 4. CAPA DE REPOSITORIO (Repository)

**Responsabilidades:**
- Acceso a datos con Prisma
- Queries reutilizables
- Manejo de transacciones
- Mapeo de entidades
- Caché si es necesario

**NO DEBE:**
- Contener lógica de negocio
- Hacer validaciones complejas
- Conocer detalles de rutas HTTP

**Ubicación:** `src/modules/[module]/repository.ts`

**Ejemplo:**
```typescript
// src/modules/leads/repository.ts
import { prisma } from '@/lib/db';

export async function crearLeadRepository(datos: CrearLeadInput) {
  return prisma.lead.create({
    data: {
      nombre: datos.nombre,
      email: datos.email,
      tipoPersona: datos.tipoPersona,
      estado: 'NUEVO',
      createdAt: new Date(),
    },
  });
}

export async function buscarLeadPorEmail(email: string) {
  return prisma.lead.findUnique({
    where: { email },
  });
}

export async function actualizarLeadRepository(id: string, datos: Partial<Lead>) {
  return prisma.lead.update({
    where: { id },
    data: {
      ...datos,
      updatedAt: new Date(),
    },
  });
}
```

---

### 5. CAPA DE TIPOS (Types)

**Responsabilidades:**
- Definir interfaces TypeScript
- Input/Output types
- Enums del módulo

**Ubicación:** `src/modules/[module]/types.ts`

**Ejemplo:**
```typescript
// src/modules/leads/types.ts
export type CrearLeadInput = {
  nombre: string;
  email?: string;
  telefono?: string;
  tipoPersona: 'NATURAL' | 'JURIDICA';
  nit?: string;
};

export type Lead = {
  id: string;
  nombre: string;
  email?: string;
  estado: EstadoLead;
  createdAt: Date;
  updatedAt: Date;
};

export enum EstadoLead {
  NUEVO = 'NUEVO',
  CONTACTADO = 'CONTACTADO',
  CALIFICADO = 'CALIFICADO',
  CONVERTIDO = 'CONVERTIDO',
  PERDIDO = 'PERDIDO',
}
```

---

### 6. VALIDADORES (Validators)

**Responsabilidades:**
- Esquemas de validación con Zod
- Validación de tipos
- Transformación de entrada

**Ubicación:** `src/modules/[module]/validators.ts`

**Ejemplo:**
```typescript
// src/modules/leads/validators.ts
import { z } from 'zod';

export const crearLeadValidator = z.object({
  nombre: z.string().min(1, 'Nombre requerido').max(255),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  tipoPersona: z.enum(['NATURAL', 'JURIDICA']),
  nit: z.string().optional(),
}).refine((data) => {
  if (data.tipoPersona === 'JURIDICA' && !data.nit) {
    return false;
  }
  return true;
}, {
  message: 'NIT requerido para personas jurídicas',
  path: ['nit'],
});

export type CrearLeadInput = z.infer<typeof crearLeadValidator>;
```

---

## Patrones de Implementación

### Patrón 1: Crear Recurso

```typescript
// RUTA
export async function POST(req: Request) {
  const datos = validarConZod(crearXValidator, await req.json());
  const resultado = await crearXService(datos);
  return Response.json(resultado, { status: 201 });
}

// SERVICIO
export async function crearXService(datos: CrearXInput) {
  await validarReglasDeNegocio(datos);
  const entidad = await crearXRepository(datos);
  await notificar('x.creado', entidad);
  return mapearParaRespuesta(entidad);
}

// REPOSITORIO
export async function crearXRepository(datos: CrearXInput) {
  return prisma.x.create({ data });
}
```

### Patrón 2: Obtener Recurso

```typescript
// RUTA
export async function GET(req: Request, { params }) {
  const { id } = params;
  const resultado = await obtenerXService(id);
  if (!resultado) return Response.json({ error: 'No encontrado' }, { status: 404 });
  return Response.json(resultado);
}

// SERVICIO
export async function obtenerXService(id: string) {
  const entidad = await obtenerXRepository(id);
  return mapearParaRespuesta(entidad);
}

// REPOSITORIO
export async function obtenerXRepository(id: string) {
  return prisma.x.findUnique({ where: { id } });
}
```

### Patrón 3: Actualizar Recurso

```typescript
// RUTA
export async function PUT(req: Request, { params }) {
  const datos = validarConZod(actualizarXValidator, await req.json());
  const resultado = await actualizarXService(params.id, datos);
  return Response.json(resultado);
}

// SERVICIO
export async function actualizarXService(id: string, datos: ActualizarXInput) {
  const entidad = await obtenerXRepository(id);
  if (!entidad) throw new NoEncontradoError('X no encontrado');
  
  await validarReglasDeNegocio(datos);
  const actualizado = await actualizarXRepository(id, datos);
  await notificar('x.actualizado', actualizado);
  return mapearParaRespuesta(actualizado);
}

// REPOSITORIO
export async function actualizarXRepository(id: string, datos: Partial<X>) {
  return prisma.x.update({
    where: { id },
    data: { ...datos, updatedAt: new Date() },
  });
}
```

### Patrón 4: Eliminar Recurso

```typescript
// RUTA
export async function DELETE(req: Request, { params }) {
  await eliminarXService(params.id);
  return new Response(null, { status: 204 });
}

// SERVICIO
export async function eliminarXService(id: string) {
  const entidad = await obtenerXRepository(id);
  if (!entidad) throw new NoEncontradoError('X no encontrado');
  
  await validarPuedeEliminar(entidad);
  await eliminarXRepository(id);
  await notificar('x.eliminado', entidad);
}

// REPOSITORIO
export async function eliminarXRepository(id: string) {
  return prisma.x.delete({ where: { id } });
}
```

---

## Manejo de Errores

### Estrategia de Errores por Capa

**RUTA:**
- Errores HTTP (400, 401, 403, 404, 500)
- Errores de validación Zod

**SERVICIO:**
- Errores de lógica de negocio
- Errores de persistencia
- Errores de terceros

**REPOSITORIO:**
- Errores de Prisma
- Errores de conexión

**TODOS:**
- Logear errores
- Propagar con contexto

### Clases de Error Personalizadas

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidacionError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDACION_ERROR');
  }
}

export class NoAutorizadoError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 403, 'NO_AUTORIZADO');
  }
}

export class NoEncontradoError extends AppError {
  constructor(message: string = 'Recurso no encontrado') {
    super(message, 404, 'NO_ENCONTRADO');
  }
}

export class ErrorDeNegocio extends AppError {
  constructor(message: string, code: string) {
    super(message, 422, code);
  }
}
```

### Manejo de Errores en Rutas

```typescript
// src/lib/api-utils.ts
export async function manejarErrorAPI(error: unknown) {
  console.error('[API Error]', error);
  
  if (error instanceof ZodError) {
    return Response.json({
      error: 'Validacion fallida',
      details: error.errors,
    }, { status: 400 });
  }
  
  if (error instanceof AppError) {
    return Response.json({
      error: error.message,
      code: error.code,
    }, { status: error.statusCode });
  }
  
  return Response.json({
    error: 'Error interno del servidor',
  }, { status: 500 });
}
```

---

## Requisitos por Módulo Implementado

Cada módulo debe tener:

1. ✅ **types.ts** - Tipos e interfaces
2. ✅ **validators.ts** - Esquemas Zod para validación
3. ✅ **models.ts** - Lógica de transformación y validaciones complejas
4. ✅ **repository.ts** - Acceso a datos
5. ✅ **services.ts** - Lógica de negocio
6. ✅ **API Routes** - En `src/app/api/[module]/`
7. ✅ **Tests** - Para servicios y repositorios (si aplica)

---

## Módulos Implementados

### ✅ CASOS
- [x] types.ts
- [x] validators.ts
- [x] models.ts
- [x] repository.ts
- [x] services.ts
- [x] API Routes

### ✅ LEADS
- [x] types.ts
- [x] validators.ts
- [x] models.ts
- [x] repository.ts
- [x] services.ts
- [x] API Routes

### ⚠️ EN PROGRESO

Siguientes módulos a implementar:
- ASESORÍAS
- FACTURACIÓN
- CARTERA
- USUARIOS Y ROLES
- AUDIENCIAS
- RADICACIONES
- HONORARIOS
- ACTUACIONES

---

## Checklist para Nuevo Módulo

Cuando implementes un nuevo módulo, asegúrate de:

- [ ] Crear carpeta `src/modules/[nombre]/`
- [ ] Crear `types.ts` con tipos e interfaces
- [ ] Crear `validators.ts` con esquemas Zod
- [ ] Crear `models.ts` con lógica compleja y mapeos
- [ ] Crear `repository.ts` con queries Prisma
- [ ] Crear `services.ts` con lógica de negocio
- [ ] Crear rutas en `src/app/api/[nombre]/route.ts`
- [ ] Crear rutas dinámicas `src/app/api/[nombre]/[id]/route.ts` si aplica
- [ ] Agregar middleware de autenticación
- [ ] Agregar validaciones de permisos
- [ ] Logear operaciones importantes
- [ ] Manejar errores apropiadamente
- [ ] Retornar DTOs (no entidades completas)
- [ ] Documentar endpoints en JSDoc
- [ ] Crear tests si es posible

---

## Convenciones de Código

### Nombres de funciones
- `crearXService`, `obtenerXService`, `actualizarXService`, `eliminarXService`
- `crearXRepository`, `obtenerXRepository`, etc.
- `validarX`, `mapearX`, `transformarX`

### Nombres de archivos
- snake_case para archivos
- Ejemplo: `crear-lead-route.ts`, `lead-service.ts`

### Estructura de tipos
```typescript
// Input (lo que recibe)
export type CrearXInput = { ... };

// Output (lo que retorna)
export type XResponse = { ... };

// Modelo interno
export type X = { ... };
```

### Patrón de respuesta exitosa
```typescript
{
  success: true,
  data: { ... },
  timestamp: "2024-04-18T..."
}
```

### Patrón de respuesta de error
```typescript
{
  success: false,
  error: "Descripción del error",
  code: "ERROR_CODE",
  timestamp: "2024-04-18T...",
  details?: { ... } // para errores de validación
}
```

---

## Seguimiento de Implementación

Ver `TODO_MODULES.md` para el estado de cada módulo.

---

## Contacto

Para preguntas sobre la arquitectura, revisa este documento o contacta al equipo de desarrollo.
