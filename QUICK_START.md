# ⚡ Quick Start - Usar la Nueva Arquitectura

## 🚀 En 2 Minutos

### Leer Esto Primero
```
1. Este archivo (2 min)
2. DATA_FLOW.md (3 min)
3. ARCHITECTURE.md - Secciones de Patrones (10 min)
```

### Ver Ejemplo Completo
```
Ir a: src/modules/asesorias/
Este módulo está completamente implementado
```

---

## 📋 Creando un Nuevo Endpoint CRUD

### Paso 1: Crear archivo `types.ts`
```bash
touch src/modules/[nuevo]/types.ts
```

**Template:**
```typescript
export interface Crear[Nuevo]Input {
  campo1: string
  campo2: string
}

export interface [Nuevo]Response {
  id: string
  campo1: string
  campo2: string
  createdAt: Date
  updatedAt: Date
}
```

### Paso 2: Crear archivo `validators.ts`
```bash
touch src/modules/[nuevo]/validators.ts
```

**Template:**
```typescript
import { z } from 'zod'

export const crear[Nuevo]Validator = z.object({
  campo1: z.string().min(1),
  campo2: z.string().min(1),
})

export type Crear[Nuevo]Input = z.infer<typeof crear[Nuevo]Validator>
```

### Paso 3: Crear archivo `models.ts`
```bash
touch src/modules/[nuevo]/models.ts
```

**Template:**
```typescript
import { NotFoundError } from '@/lib/api-errors'

export class [Nuevo]NoEncontradoError extends NotFoundError {
  constructor(id: string) {
    super(`[Nuevo] ${id}`)
  }
}

export function mapear[Nuevo]ParaRespuesta(entidad: any): [Nuevo]Response {
  return {
    id: entidad.id,
    campo1: entidad.campo1,
    // ... más campos
    createdAt: entidad.createdAt,
    updatedAt: entidad.updatedAt,
  }
}
```

### Paso 4: Crear archivo `repository.ts`
```bash
touch src/modules/[nuevo]/repository.ts
```

**Template:**
```typescript
import { prisma } from '@/lib/db'

export class [Nuevo]Repository {
  async crear(datos: Crear[Nuevo]Input) {
    return await prisma.[modelo].create({ data: datos })
  }

  async obtenerPorId(id: string) {
    return await prisma.[modelo].findUnique({ where: { id } })
  }

  async actualizar(id: string, datos: any) {
    return await prisma.[modelo].update({
      where: { id },
      data: { ...datos, updatedAt: new Date() }
    })
  }

  async eliminar(id: string) {
    return await prisma.[modelo].delete({ where: { id } })
  }
}
```

### Paso 5: Crear archivo `services.ts`
```bash
touch src/modules/[nuevo]/services.ts
```

**Template:**
```typescript
import { [Nuevo]Repository } from './repository'
import { [Nuevo]NoEncontradoError, mapear[Nuevo]ParaRespuesta } from './models'
import { crear[Nuevo]Validator } from './validators'

export class [Nuevo]Service {
  private repository: [Nuevo]Repository

  constructor() {
    this.repository = new [Nuevo]Repository()
  }

  async crear(datos: any) {
    const validados = crear[Nuevo]Validator.parse(datos)
    const resultado = await this.repository.crear(validados)
    return mapear[Nuevo]ParaRespuesta(resultado)
  }

  async obtener(id: string) {
    const resultado = await this.repository.obtenerPorId(id)
    if (!resultado) throw new [Nuevo]NoEncontradoError(id)
    return mapear[Nuevo]ParaRespuesta(resultado)
  }
}
```

### Paso 6: Crear rutas API
```bash
mkdir -p src/app/api/[nuevo]
touch src/app/api/[nuevo]/route.ts
touch "src/app/api/[nuevo]/[id]/route.ts"
```

**Template: `src/app/api/[nuevo]/route.ts`**
```typescript
import { [Nuevo]Service } from '@/modules/[nuevo]/services'
import { crear[Nuevo]Validator } from '@/modules/[nuevo]/validators'
import { okResponse, createdResponse, handleAPIError } from '@/lib/api-response'

const service = new [Nuevo]Service()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (id) {
      const resultado = await service.obtener(id)
      return okResponse(resultado)
    }
    
    return okResponse([])
  } catch (error) {
    return handleAPIError(error)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const datos = crear[Nuevo]Validator.parse(body)
    const resultado = await service.crear(datos)
    return createdResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}
```

**Template: `src/app/api/[nuevo]/[id]/route.ts`**
```typescript
import { [Nuevo]Service } from '@/modules/[nuevo]/services'
import { okResponse, noContentResponse, handleAPIError } from '@/lib/api-response'

const service = new [Nuevo]Service()

export async function GET(req: Request, { params }) {
  try {
    const resultado = await service.obtener(params.id)
    return okResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}

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

## ✅ Verificar que Funciona

```bash
# 1. Build
npm run build

# 2. Dev
npm run dev

# 3. Test endpoint
curl http://localhost:3000/api/[nuevo]

# 4. Debería retornar
{
  "success": true,
  "data": [...],
  "timestamp": "..."
}
```

---

## 📁 Estructura Final

```
src/modules/[nuevo]/
├── types.ts           ✓
├── validators.ts      ✓
├── models.ts          ✓
├── repository.ts      ✓
└── services.ts        ✓

src/app/api/[nuevo]/
├── route.ts           ✓
└── [id]/
    └── route.ts       ✓
```

---

## 🎯 Pasos Siguientes

1. [ ] Copiar estructura de `src/modules/asesorias/`
2. [ ] Reemplazar `[nuevo]` con nombre del módulo
3. [ ] Verificar schema Prisma para tabla correcta
4. [ ] Ajustar tipos según tabla
5. [ ] Agregar validaciones específicas
6. [ ] Probar con `npm run build && npm run dev`
7. [ ] Testear endpoints con Postman/curl

---

## 🔗 Documentación Completa

- `ARCHITECTURE.md` - Conceptos y patrones
- `IMPLEMENTATION_GUIDE.md` - Guía detallada paso a paso
- `DATA_FLOW.md` - Flujos visuales
- `FINAL_SUMMARY.md` - Resumen ejecutivo

---

## 💡 Recordar

1. **Siempre validar** con Zod en validadores
2. **Siempre mapear a DTO** antes de retornar
3. **Siempre usar errores específicos** de `api-errors.ts`
4. **Siempre retornar** con `okResponse`, `createdResponse`, etc.
5. **Siempre manejar errores** con `handleAPIError`

---

## ❓ Preguntas Frecuentes

**P: ¿Dónde va la lógica compleja?**  
R: En `services.ts` y `models.ts`, nunca en rutas

**P: ¿Dónde van las validaciones?**  
R: En `validators.ts` (simples) y `models.ts` (complejas)

**P: ¿Debo acceder a BD desde la ruta?**  
R: NO, siempre desde el repositorio

**P: ¿Cómo hago un GET con filtros?**  
R: Usar `searchParams` en la ruta y pasar al servicio

**P: ¿Cómo manejo relaciones?**  
R: En el repositorio con `include` de Prisma

---

**¿Necesitas ayuda?**  
→ Mira `src/modules/asesorias/` como ejemplo completo

