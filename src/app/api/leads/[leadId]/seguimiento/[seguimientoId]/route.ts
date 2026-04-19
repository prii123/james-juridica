import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { SeguimientoService } from '@/modules/leads/seguimiento/services'
import { okResponse, noContentResponse } from '@/lib/api-response'
import {  handleAPIError } from '@/lib/api-errors'

const service = new SeguimientoService()

/**
 * GET /api/leads/[leadId]/seguimiento/[seguimientoId] - Obtener seguimiento
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string; seguimientoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.VIEW)

    const seguimiento = await service.obtenerSeguimiento(
      params.leadId,
      params.seguimientoId
    )
    return okResponse(seguimiento)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * PUT /api/leads/[leadId]/seguimiento/[seguimientoId] - Actualizar seguimiento
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { leadId: string; seguimientoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.EDIT)

    const body = await request.json()
    const seguimiento = await service.actualizarSeguimiento(
      params.leadId,
      params.seguimientoId,
      body
    )

    return okResponse(seguimiento)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/leads/[leadId]/seguimiento/[seguimientoId] - Eliminar seguimiento
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string; seguimientoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.DELETE)

    await service.eliminarSeguimiento(params.leadId, params.seguimientoId)
    return noContentResponse()
  } catch (error) {
    return handleAPIError(error)
  }
}