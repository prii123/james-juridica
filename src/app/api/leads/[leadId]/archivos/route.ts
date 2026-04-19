import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { ArchivoLeadService } from '@/modules/leads/archivo-lead/services'
import { okResponse, createdResponse, handleAPIError } from '@/lib/api-response'

const service = new ArchivoLeadService()

/**
 * GET /api/leads/[leadId]/archivos - Obtener archivos del lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.LEADS.VIEW)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tipo = searchParams.get('tipo') || ''

    const resultado = await service.listarArchivos(params.leadId, {
      search: search || undefined,
      tipo: tipo || undefined
    })

    return okResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * POST /api/leads/[leadId]/archivos - Subir archivo
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return okResponse(null, { status: 401 })

    await requirePermission(PERMISSIONS.LEADS.EDIT)

    const formData = await request.formData()
    const file = formData.get('file') as File

    const resultado = await service.subirArchivo(
      params.leadId,
      session.user.id,
      file
    )

    return createdResponse(resultado)
  } catch (error) {
    return handleAPIError(error)
  }
}