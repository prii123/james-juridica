import { NextRequest } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { RadicacionService } from '@/modules/radicaciones/services'
import { actualizarRadicacionValidator } from '@/modules/radicaciones/validators'
import { okResponse } from '@/lib/api-response'
import {  handleAPIError } from '@/lib/api-errors'

const radicacionService = new RadicacionService()

export async function GET(
  request: NextRequest,
  { params }: { params: { radicacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.VIEW)

    const radicacion = await radicacionService.obtenerRadicacionPorId(params.radicacionId)

    return okResponse(radicacion)
  } catch (error: any) {
    return await handleAPIError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { radicacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.EDIT)

    const body = await request.json()

    // Validar input
    const datosValidados = actualizarRadicacionValidator.parse(body)

    // Actualizar radicación (con creación de caso si es necesario)
    const resultado = await radicacionService.actualizarRadicacionConCaso(
      params.radicacionId,
      {
        estado: datosValidados.estado,
        resultado: datosValidados.resultado,
        demandante: datosValidados.demandante,
        demandado: datosValidados.demandado,
        valor: datosValidados.valor,
        fechaSolicitud: datosValidados.fechaSolicitud,
        fechaAudiencia: datosValidados.fechaAudiencia ?? undefined,
        observaciones: datosValidados.observaciones,
      },
      datosValidados.createCase || false
    )

    // Construir respuesta
    const response: any = {
      radicacion: resultado.radicacion,
    }

    if (resultado.casoCreado) {
      response.casoCreado = resultado.casoCreado
      response.honorarioCreado = resultado.honorarioCreado
      response.facturaCreada = resultado.facturaCreada
      response.message = `¡Radicación aceptada exitosamente! Se creó automáticamente:
        - Caso: ${resultado.casoCreado.numeroCaso}
        - Honorario por representación: $${Number(resultado.honorarioCreado?.valor).toLocaleString('es-CO')}
        - Factura pendiente: ${resultado.facturaCreada?.numero} (Total: $${Number(resultado.facturaCreada?.total).toLocaleString('es-CO')})`
    }

    return okResponse(response)
  } catch (error: any) {
    return await handleAPIError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { radicacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.DELETE)

    await radicacionService.eliminarRadicacion(params.radicacionId)

    return okResponse({ message: 'Radicación eliminada exitosamente' })
  } catch (error: any) {
    return await handleAPIError(error)
  }
}