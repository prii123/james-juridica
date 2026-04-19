import { NextRequest } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { RadicacionService } from '@/modules/radicaciones/services'
import { crearRadicacionValidator } from '@/modules/radicaciones/validators'
import { createdResponse, paginatedResponseHTTP } from '@/lib/api-response'
import { handleAPIError } from '@/lib/api-errors'
import type { EstadoRadicacion } from '@prisma/client'

const radicacionService = new RadicacionService()

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const estadoParam = searchParams.get('estado')
    const search = searchParams.get('search')

    const resultado = await radicacionService.obtenerRadicacionesPaginadas(
      { 
        estado: estadoParam ? (estadoParam as EstadoRadicacion) : undefined, 
        search: search || undefined 
      },
      page,
      limit
    )

    return paginatedResponseHTTP(
      resultado.radicaciones,
      resultado.pagination.currentPage,
      resultado.pagination.limit,
      resultado.pagination.total
    )
  } catch (error: any) {
    return await handleAPIError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.CREATE)

    const body = await request.json()

    // Validar input
    const datosValidados = crearRadicacionValidator.parse(body)

    // Crear radicación
    const radicacion = await radicacionService.crearRadicacion(datosValidados)

    return createdResponse(radicacion)
  } catch (error: any) {
    return await handleAPIError(error)
  }
}