import { NextRequest, NextResponse } from 'next/server'
import { CasosService } from '@/modules/casos/services'
import { getCurrentUser, requirePermission, PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CASOS.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const estado = searchParams.get('estado')
    const tipoInsolvencia = searchParams.get('tipoInsolvencia')
    const prioridad = searchParams.get('prioridad')
    const responsableId = searchParams.get('responsableId')
    const search = searchParams.get('search')

    const filters: any = {}
    // "estado=ACTIVO,SUSPENDIDO" agrupa varios estados en una sola pantalla (vista "Activos").
    if (estado) filters.estado = estado.includes(',') ? estado.split(',') : estado
    if (tipoInsolvencia) filters.tipoInsolvencia = tipoInsolvencia
    if (prioridad) filters.prioridad = prioridad
    if (responsableId) filters.responsableId = responsableId
    if (search) filters.search = search

    const casosService = new CasosService()
    const result = await casosService.getCasos(filters, page, limit)

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CASOS.CREATE)

    const body = await request.json()
    const user = await getCurrentUser()
    
    // Asignar al usuario actual como creador
    body.creadoPorId = user?.id

    // Si no se especifica responsable, asignar al usuario actual
    if (!body.responsableId) {
      body.responsableId = user?.id
    }

    const casosService = new CasosService()
    const caso = await casosService.createCaso(body)

    return NextResponse.json(caso, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}