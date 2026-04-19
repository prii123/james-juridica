import { NextRequest } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { AsesoriaService } from '@/modules/asesorias/services'
import { okResponse, createdResponse } from '@/lib/api-response'
import {  handleAPIError } from '@/lib/api-errors'

const service = new AsesoriaService()

/**
 * GET /api/asesorias - Listar asesorías con filtros
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASESORIAS.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const filtros: any = {}
    if (searchParams.get('estado')) filtros.estado = searchParams.get('estado')
    if (searchParams.get('tipoAsesoria')) filtros.tipoAsesoria = searchParams.get('tipoAsesoria')
    if (searchParams.get('resultado')) filtros.resultado = searchParams.get('resultado')
    if (searchParams.get('abogadoId')) filtros.abogadoId = searchParams.get('abogadoId')
    if (searchParams.get('leadId')) filtros.leadId = searchParams.get('leadId')

    const resultado = await service.obtenerAsesorias(filtros, page, limit)
    return okResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/asesorias - Crear asesoría
 */
export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASESORIAS.CREATE)

    const body = await request.json()
    const asesorias = await service.crearAsesoria(body)

    return createdResponse(asesorias)
  } catch (error) {
    return handleAPIError(error)
  }
}