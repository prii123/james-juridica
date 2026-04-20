# Módulo de Asesorías

Este módulo maneja la lógica de negocio relacionada con las asesorías jurídicas en el sistema. Sigue una arquitectura de 4 capas:

1. **Types** - Definiciones de tipos e interfaces
2. **Validators** - Esquemas de validación con Zod
3. **Repository** - Capa de acceso a datos (Prisma)
4. **Services** - Lógica de negocio

## Estructuras de Datos Principales

### AsesorData
```typescript
interface AsesorData {
  id: string
  nombre: string
  apellido: string
  email: string
}
```

### LeadData
```typescript
interface LeadData {
  id: string
  nombre: string
  email: string
  telefono: string
  estado: string
}
```

## Uso

### Importar el servicio
```typescript
import { AsesoriasService } from '@/modules/asesorias'

const asesoriasService = new AsesoriasService()
```

### Crear una asesoría
```typescript
const nuevaAsesoria = await asesoriasService.createAsesoria({
  tipo: 'CONSULTA',
  fecha: new Date('2024-02-15T10:00:00'),
  tema: 'Consulta sobre insolvencia',
  descripcion: 'Cliente requiere asesoría sobre proceso de insolvencia',
  duracion: 60,
  modalidad: 'VIRTUAL',
  leadId: 'lead-id-aqui',
  asesorId: 'asesor-id-aqui'
})
```

### Obtener asesorías con filtros
```typescript
const { asesorias, total, page, totalPages } = await asesoriasService.getAsesorias({
  estado: 'PROGRAMADA',
  asesorId: 'asesor-id',
  fechaDesde: new Date('2024-01-01'),
  fechaHasta: new Date('2024-12-31')
}, 1, 20)
```

### Obtener asesorías de un asesor
```typescript
const asesorias = await asesoriasService.getAsesoriasByAsesor('asesor-id')
// Retorna todas las asesorías con datos completos de lead y asesor
```

### Obtener asesorías de un lead
```typescript
const asesorias = await asesoriasService.getAsesoriasByLead('lead-id')
// Retorna todas las asesorías con datos completos de lead y asesor
```

### Completar una asesoría
```typescript
await asesoriasService.completarAsesoria(
  'asesoria-id',
  'EXITOSA',
  'Cliente satisfecho con la asesoría'
)
```

### Cancelar una asesoría
```typescript
await asesoriasService.cancelarAsesoria(
  'asesoria-id',
  'Cliente no pudo asistir'
)
```

### Reagendar una asesoría
```typescript
await asesoriasService.reagendarAsesoria(
  'asesoria-id',
  new Date('2024-02-20T14:00:00'),
  'Reagendado por solicitud del cliente'
)
```

### Obtener estadísticas
```typescript
const stats = await asesoriasService.getAsesoriasStats()
// Retorna: { total, porEstado: { PROGRAMADA, REALIZADA, CANCELADA, PENDIENTE } }
```

### Obtener carga de trabajo de un asesor
```typescript
const cargaTrabajo = await asesoriasService.getAsesorWorkload(
  'asesor-id',
  new Date('2024-01-01'),
  new Date('2024-01-31')
)
// Retorna: { totalAsesorias, totalMinutos, totalHoras, asesorias }
```

## Validaciones

El módulo incluye validaciones automáticas para:

- Fechas (no permite fechas inválidas)
- Duración (mínimo 15 minutos, máximo 480 minutos)
- Existencia de lead y asesor
- Estado del asesor (debe estar activo)
- Integridad de datos (no permite modificar asesorías canceladas o realizadas)

## Ejemplo de Uso en API Route

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AsesoriasService } from '@/modules/asesorias'

const service = new AsesoriasService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const asesorId = searchParams.get('asesorId') || undefined
    
    const result = await service.getAsesorias(
      { asesorId },
      page,
      limit
    )
    
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const asesoria = await service.createAsesoria(body)
    return NextResponse.json(asesoria, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}
```

## Tipos de Retorno

Todos los métodos que retornan asesorías incluyen los datos completos de **asesor** y **lead**:

```typescript
{
  id: string
  tipo: TipoAsesoria
  estado: EstadoAsesoria
  fecha: Date
  tema: string
  // ... otros campos
  lead: {
    id: string
    nombre: string
    email: string
    telefono: string
    estado: string
  }
  asesor: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
}
```
