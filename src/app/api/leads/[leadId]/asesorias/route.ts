import { NextRequest } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { AsesoriaLeadService } from '@/modules/leads/asesoria-lead/services'
import { okResponse, createdResponse, handleAPIError } from '@/lib/api-response'

const service = new AsesoriaLeadService()

/**
 * GET /api/leads/[leadId]/asesorias - Obtener asesorías del lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const resultado = await service.obtenerAsesoriasLead(params.leadId)
    return okResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/leads/[leadId]/asesorias - Crear asesoría
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.ASESORIAS.CREATE)

    const body = await request.json()
    const asesoria = await service.crearAsesoriaLead(params.leadId, body)

    return createdResponse(asesoria)
  } catch (error) {
    return handleAPIError(error)
  }
}