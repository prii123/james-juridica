import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { SeguimientoService } from '@/modules/leads/seguimiento/services'
import { okResponse, createdResponse } from '@/lib/api-response'
import {  handleAPIError } from '@/lib/api-errors'

const service = new SeguimientoService()

/**
 * GET /api/leads/[leadId]/seguimiento - Obtener seguimientos del lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.VIEW)

    const seguimientos = await service.listarSeguimientos(params.leadId)
    return okResponse(seguimientos)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/leads/[leadId]/seguimiento - Crear nuevo seguimiento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.CREATE)

    const body = await request.json()
    const seguimiento = await service.crearSeguimiento(
      params.leadId,
      session.user.id,
      body
    )

    return createdResponse(seguimiento)
  } catch (error) {
    return handleAPIError(error)
  }
}