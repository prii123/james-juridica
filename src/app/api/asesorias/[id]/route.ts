import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { AsesoriaService } from '@/modules/asesorias/services'
import { okResponse, noContentResponse, handleAPIError } from '@/lib/api-response'

const service = new AsesoriaService()

/**
 * GET /api/asesorias/[id] - Obtener asesoría
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return okResponse(null, { status: 401 })

    const asesoria = await service.obtenerAsesoria(params.id)
    return okResponse(asesoria)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * PATCH /api/asesorias/[id] - Actualizar asesoría
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return okResponse(null, { status: 401 })

    const body = await request.json()
    const asesoria = await service.actualizarAsesoria(params.id, body)

    return okResponse(asesoria)
  } catch (error) {
    return handleAPIError(error)
  }
}

/**
 * DELETE /api/asesorias/[id] - Eliminar asesoría
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return okResponse(null, { status: 401 })

    await service.eliminarAsesoria(params.id)
    return noContentResponse()
  } catch (error) {
    return handleAPIError(error)
  }
}