# Guía de Implementación de Módulos

## 📚 Módulos Completamente Implementados

### ✅ ASESORÍAS
El módulo de asesorías está completamente implementado con:
- ✓ `src/modules/asesorias/types.ts`
- ✓ `src/modules/asesorias/validators.ts`
- ✓ `src/modules/asesorias/models.ts`
- ✓ `src/modules/asesorias/repository.ts`
- ✓ `src/modules/asesorias/services.ts`

**Falta:** Crear las rutas API en `src/app/api/asesorias/`

---

## 🔄 Módulos en Progreso

### ⚠️ CASOS y LEADS
- Parcialmente reorganizados
- Requieren actualización de rutas API
- Necesitan usar nuevo sistema de errores

---

## 🏗️ Cómo Implementar un Nuevo Módulo

### Paso 1: Crear Tipos (`types.ts`)

```typescript
// src/modules/[modulo]/types.ts

/**
 * Input para crear
 */
export interface Crear[Modulo]Input {
  // Campos requeridos
  campo1: string
  campo2: string
}

/**
 * Input para actualizar
 */
export interface Actualizar[Modulo]Input {
  // Campos opcionales
  campo1?: string
  campo2?: string
}

/**
 * Filtros de búsqueda
 */
export interface Filtros[Modulo] {
  campo1?: string
  // ... otros filtros
}

/**
 * DTO de respuesta
 */
export interface [Modulo]Response {
  // Todos los campos que se retornan
}
```

### Paso 2: Crear Validadores (`validators.ts`)

```typescript
// src/modules/[modulo]/validators.ts

import { z } from 'zod'

/**
 * Validador para crear
 */
export const crear[Modulo]Validator = z.object({
  campo1: z.string().min(1, 'Campo1 requerido'),
  campo2: z.string().min(1, 'Campo2 requerido'),
  // ... más validaciones
}).refine((data) => {
  // Validaciones complejas
  return true
}, {
  message: 'Mensaje de error',
  path: ['campo'],
})

export type Crear[Modulo]Input = z.infer<typeof crear[Modulo]Validator>

/**
 * Validador para actualizar
 */
export const actualizar[Modulo]Validator = z.object({
  campo1: z.string().optional(),
  // ... más campos opcionales
})

export type Actualizar[Modulo]Input = z.infer<typeof actualizar[Modulo]Validator>
```

### Paso 3: Crear Modelos (`models.ts`)

```typescript
// src/modules/[modulo]/models.ts

import { NotFoundError, BusinessError } from '@/lib/api-errors'

/**
 * Error específico del módulo
 */
export class [Modulo]NoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`[Modulo] ${id}`)
  }
}

/**
 * Mapea entidad a DTO
 */
export function mapear[Modulo]ParaRespuesta(entidad: any): [Modulo]Response {
  return {
    // Mapeo de campos
  }
}

/**
 * Validaciones complejas
 */
export function validarRegla[Modulo](entidad: any): boolean {
  // Lógica de validación
  return true
}

/**
 * Utilidades de dominio
 */
export function calcular[Algo](entidad: any): number {
  // Cálculos del dominio
  return 0
}
```

### Paso 4: Crear Repositorio (`repository.ts`)

```typescript
// src/modules/[modulo]/repository.ts

import { prisma } from '@/lib/db'

export class [Modulo]Repository {
  /**
   * Crea un nuevo registro
   */
  async crear(datos: Crear[Modulo]Input) {
    return await prisma.[modelo].create({
      data: {
        // Mapeo de datos
      },
      include: {
        // Relaciones necesarias
      },
    })
  }

  /**
   * Obtiene por ID
   */
  async obtenerPorId(id: string) {
    return await prisma.[modelo].findUnique({
      where: { id },
      include: {
        // Relaciones
      },
    })
  }

  /**
   * Actualiza
   */
  async actualizar(id: string, datos: Actualizar[Modulo]Input) {
    return await prisma.[modelo].update({
      where: { id },
      data: {
        // Mapeo de datos
        updatedAt: new Date(),
      },
      include: {
        // Relaciones
      },
    })
  }

  /**
   * Obtiene con filtros
   */
  async obtenerPorFiltros(filtros: Filtros[Modulo] = {}, pagina = 1, limite = 10) {
    const skip = (pagina - 1) * limite
    const where: any = {}

    if (filtros.campo1) where.campo1 = filtros.campo1
    // ... más filtros

    const [registros, total] = await Promise.all([
      prisma.[modelo].findMany({
        where,
        skip,
        take: limite,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.[modelo].count({ where }),
    ])

    return {
      registros,
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    }
  }

  /**
   * Elimina
   */
  async eliminar(id: string) {
    return await prisma.[modelo].delete({
      where: { id },
    })
  }
}
```

### Paso 5: Crear Servicios (`services.ts`)

```typescript
// src/modules/[modulo]/services.ts

import { [Modulo]Repository } from './repository'
import { Crear[Modulo]Input, Actualizar[Modulo]Input } from './types'
import { crear[Modulo]Validator, actualizar[Modulo]Validator } from './validators'
import {
  [Modulo]NoEncontradoError,
  mapear[Modulo]ParaRespuesta,
  validarRegla[Modulo],
} from './models'

export class [Modulo]Service {
  private repository: [Modulo]Repository

  constructor() {
    this.repository = new [Modulo]Repository()
  }

  /**
   * Crea un nuevo registro
   */
  async crear(datos: Crear[Modulo]Input) {
    const datosValidados = crear[Modulo]Validator.parse(datos)
    
    // Validar reglas de negocio
    validarRegla[Modulo](datosValidados)

    const resultado = await this.repository.crear(datosValidados)
    return mapear[Modulo]ParaRespuesta(resultado)
  }

  /**
   * Obtiene por ID
   */
  async obtener(id: string) {
    const registro = await this.repository.obtenerPorId(id)
    if (!registro) {
      throw new [Modulo]NoEncontradoError(id)
    }
    return mapear[Modulo]ParaRespuesta(registro)
  }

  /**
   * Actualiza
   */
  async actualizar(id: string, datos: Actualizar[Modulo]Input) {
    const existente = await this.repository.obtenerPorId(id)
    if (!existente) {
      throw new [Modulo]NoEncontradoError(id)
    }

    const datosValidados = actualizar[Modulo]Validator.parse(datos)
    const resultado = await this.repository.actualizar(id, datosValidados)
    return mapear[Modulo]ParaRespuesta(resultado)
  }

  /**
   * Lista con filtros
   */
  async listar(filtros: any = {}, pagina = 1, limite = 10) {
    const resultado = await this.repository.obtenerPorFiltros(filtros, pagina, limite)
    return {
      registros: resultado.registros.map(mapear[Modulo]ParaRespuesta),
      total: resultado.total,
      pagina: resultado.pagina,
      limite: resultado.limite,
      totalPaginas: resultado.totalPaginas,
    }
  }

  /**
   * Elimina
   */
  async eliminar(id: string) {
    const existente = await this.repository.obtenerPorId(id)
    if (!existente) {
      throw new [Modulo]NoEncontradoError(id)
    }

    // Validar que puede eliminarse
    // validarPuedeEliminar(existente)

    await this.repository.eliminar(id)
  }
}
```

### Paso 6: Crear Rutas API

```typescript
// src/app/api/[modulo]/route.ts

import { [Modulo]Service } from '@/modules/[modulo]/services'
import { crear[Modulo]Validator } from '@/modules/[modulo]/validators'
import { createdResponse, okResponse, handleAPIError } from '@/lib/api-response'
import { getServerSession } from 'next-auth'

const service = new [Modulo]Service()

/**
 * GET /api/[modulo] - Listar registros
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const pagina = parseInt(searchParams.get('pagina') || '1')
    const limite = parseInt(searchParams.get('limite') || '10')

    const resultado = await service.listar({}, pagina, limite)
    return okResponse(resultado.registros, {
      page: resultado.pagina,
      limit: resultado.limite,
      total: resultado.total,
      hasMore: resultado.pagina < resultado.totalPaginas,
    })
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/[modulo] - Crear registro
 */
export async function POST(req: Request) {
  try {
    const sesion = await getServerSession()
    if (!sesion) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
    }

    const body = await req.json()
    const datos = crear[Modulo]Validator.parse(body)

    // TODO: Verificar permisos
    // if (!tienePermiso(sesion, 'crear:[modulo]')) { ... }

    const resultado = await service.crear(datos)
    return createdResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}

// src/app/api/[modulo]/[id]/route.ts

/**
 * GET /api/[modulo]/[id] - Obtener por ID
 */
export async function GET(req: Request, { params }) {
  try {
    const resultado = await service.obtener(params.id)
    return okResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * PUT /api/[modulo]/[id] - Actualizar
 */
export async function PUT(req: Request, { params }) {
  try {
    const body = await req.json()
    const datos = actualizar[Modulo]Validator.parse(body)

    const resultado = await service.actualizar(params.id, datos)
    return okResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/[modulo]/[id] - Eliminar
 */
export async function DELETE(req: Request, { params }) {
  try {
    await service.eliminar(params.id)
    return noContentResponse()
  } catch (error) {
    return handleAPIError(error)
  }
}
```

---

## 📋 Checklist de Implementación

Para cada módulo, verificar:

- [ ] Crear `types.ts` con tipos e interfaces
- [ ] Crear `validators.ts` con esquemas Zod
- [ ] Crear `models.ts` con lógica de dominio
- [ ] Crear `repository.ts` con acceso a datos
- [ ] Crear `services.ts` con lógica de negocio
- [ ] Crear rutas API en `src/app/api/[modulo]/route.ts`
- [ ] Crear rutas dinámicas `src/app/api/[modulo]/[id]/route.ts`
- [ ] Agregar middleware de autenticación
- [ ] Agregar validaciones de permisos
- [ ] Logear operaciones importantes
- [ ] Manejar errores apropiadamente
- [ ] Retornar DTOs (no entidades)
- [ ] Documentar endpoints con JSDoc
- [ ] Ejecutar `npm run build` sin errores
- [ ] Probar endpoints con Postman/curl
- [ ] Agregar tests si es posible

---

## 🎯 Módulos Pendientes

### 1. FACTURACIÓN
**Responsables de:**
- Crear facturas
- Aplicar pagos
- Generar reportes

**Tabla Prisma:** `Factura`, `ItemFactura`, `Pago`, `CuotaFactura`

**Funcionalidades Clave:**
- CRUD de facturas
- Aplicar pagos a cuotas
- Obtener facturas pendientes
- Generar reportes de facturación

---

### 2. CARTERA
**Responsables de:**
- Gestión de cuentas por cobrar
- Seguimiento de pagos
- Acuerdos de pago

**Tabla Prisma:** `Cartera`, `GestionCobro`, `AcuerdoPago`

**Funcionalidades Clave:**
- Listar cartera activa
- Crear acuerdos de pago
- Registrar gestiones de cobro
- Aplicar pagos

---

### 3. USUARIOS Y ROLES
**Responsables de:**
- CRUD de usuarios
- CRUD de roles
- Gestión de permisos

**Tabla Prisma:** `User`, `Role`, `Permission`, `RolePermission`

**Funcionalidades Clave:**
- Crear/editar/eliminar usuarios
- Crear/editar/eliminar roles
- Asignar permisos a roles
- Cambiar roles de usuarios

---

### 4. HONORARIOS
**Responsables de:**
- Crear honorarios
- Crear cuotas de honorarios
- Registrar pagos

**Tabla Prisma:** `Honorario`, `CuotaHonorario`

**Funcionalidades Clave:**
- CRUD de honorarios
- Gestionar cuotas
- Aplicar pagos

---

### 5. ACTUACIONES
**Responsables de:**
- Crear actuaciones procesales
- Actualizar estado

**Tabla Prisma:** `Actuacion`

**Funcionalidades Clave:**
- CRUD de actuaciones
- Búsqueda por caso

---

### 6. AUDIENCIAS
**Responsables de:**
- CRUD de audiencias
- Gestionar asistencia

**Tabla Prisma:** `Audiencia`

**Funcionalidades Clave:**
- CRUD de audiencias
- Notificaciones
- Reportes

---

### 7. RADICACIONES
**Responsables de:**
- CRUD de radicaciones
- Registrar resultados

**Tabla Prisma:** `Radicacion`

**Funcionalidades Clave:**
- CRUD de radicaciones
- Registrar acuerdos

---

## 🚀 Flujo de Trabajo Recomendado

1. **Semana 1:** Implementar FACTURACIÓN + CARTERA
2. **Semana 2:** Implementar USUARIOS + ROLES + PERMISOS
3. **Semana 3:** Implementar HONORARIOS + AUDIENCIAS
4. **Semana 4:** Implementar ACTUACIONES + RADICACIONES
5. **Semana 5:** Testing, revisión y ajustes

---

## ✅ Validación Final

Después de implementar cada módulo:

```bash
# 1. Ejecutar build
npm run build

# 2. Iniciar en desarrollo
npm run dev

# 3. Probar endpoints manualmente
curl http://localhost:3000/api/[modulo]

# 4. Ejecutar migraciones si es necesario
npm run db:push

# 5. Verificar no hay errores en consola
```

---

## 📚 Referencias

- `ARCHITECTURE.md` - Arquitectura completa
- `src/modules/asesorias/` - Ejemplo completo implementado
- `src/lib/api-errors.ts` - Sistema de errores
- `src/lib/api-response.ts` - Respuestas HTTP

---

**¡Listos para escalar! 🚀**
