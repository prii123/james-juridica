import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { AudienciasService } from '@/modules/audiencias/services'
import { AudienciaFilters } from '@/modules/audiencias/types'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CASOS.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Parsear filtros opcionales
    const filters: AudienciaFilters = {
      casoId: searchParams.get('casoId') || undefined,
      tipo: (searchParams.get('tipo') as any) || undefined,
      estado: (searchParams.get('estado') as any) || undefined,
      modalidad: (searchParams.get('modalidad') as any) || undefined,
      responsableId: searchParams.get('responsableId') || undefined
    }

    const audienciasService = new AudienciasService()
    const result = await audienciasService.getAudiencias(filters, page, limit)

    return NextResponse.json({
      data: result.data,
      pagination: result.pagination
    })

  } catch (error: any) {
    console.error('Error al obtener audiencias:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
