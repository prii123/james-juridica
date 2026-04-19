import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { ArchivoLeadService } from '@/modules/leads/archivo-lead/services'
import { okResponse, noContentResponse } from '@/lib/api-response'
import {  handleAPIError } from '@/lib/api-errors'

const service = new ArchivoLeadService()

/**
 * GET /api/leads/[leadId]/archivos/[archivoId] - Obtener archivo con URL firmada
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string; archivoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const archivo = await service.obtenerArchivo(params.leadId, params.archivoId)
    return okResponse(archivo)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/leads/[leadId]/archivos/[archivoId] - Eliminar archivo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string; archivoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.LEADS.EDIT)

    await service.eliminarArchivo(params.leadId, params.archivoId)
    return noContentResponse()
  } catch (error) {
    return handleAPIError(error)
  }
}