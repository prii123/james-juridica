import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, getCurrentUser, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { radicacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.VIEW)

    const radicacion = await prisma.radicacion.findUnique({
      where: { id: params.radicacionId },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            documento: true
          }
        },
        asesoria: {
          include: {
            lead: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true
              }
            },
            asesor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!radicacion) {
      return NextResponse.json(
        { error: 'Conciliación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(radicacion)

  } catch (error: any) {
    console.error('Error al obtener conciliación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { radicacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.EDIT)

    const body = await request.json()
    
    // Verificar que la conciliación existe
    const existingRadicacion = await prisma.radicacion.findUnique({
      where: { id: params.radicacionId },
      include: { cliente: true }
    })

    if (!existingRadicacion) {
      return NextResponse.json(
        { error: 'Conciliación no encontrada' },
        { status: 404 }
      )
    }

    // Construir datos de actualización
    const updateData: any = {}

    if (body.estado !== undefined) updateData.estado = body.estado
    if (body.resultado !== undefined) updateData.resultado = body.resultado
    if (body.clienteId !== undefined) updateData.clienteId = body.clienteId
    if (body.fechaSolicitud !== undefined) updateData.fechaSolicitud = new Date(body.fechaSolicitud)
    if (body.fechaAudiencia !== undefined) {
      updateData.fechaAudiencia = body.fechaAudiencia ? new Date(body.fechaAudiencia) : null
    }
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones

    // Variables para el resultado
    let casoCreado = null
    let casoExistente = null

    // Si se está aceptando la conciliación (estado REALIZADA) y se solicita crear caso
    if (body.createCase && body.estado === 'REALIZADA' && existingRadicacion.estado !== 'REALIZADA') {
      const clienteId = body.clienteId || existingRadicacion.clienteId
      if (!clienteId) {
        return NextResponse.json(
          { error: 'La conciliación no tiene un cliente asignado' },
          { status: 400 }
        )
      }

      // Quién queda como responsable/creador del caso: el usuario que acepta la conciliación
      // (antes se tomaba el asesor de la asesoría, que ahora es opcional).
      const usuario = await getCurrentUser()
      if (!usuario) {
        return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
      }

      // Generar número de caso
      const year = new Date().getFullYear()
      const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
      const numeroCaso = `CASO-${year}-${randomNum}`

      // Verificar si ya existe un caso activo para este cliente
      casoExistente = await prisma.caso.findFirst({
        where: {
          clienteId,
          tipoInsolvencia: 'LIQUIDACION_JUDICIAL',
          estado: 'ACTIVO'
        }
      })

      if (casoExistente) {
        // Usar el caso existente y actualizarlo
        casoCreado = await prisma.caso.update({
          where: { id: casoExistente.id },
          data: {
            observaciones: `${casoExistente.observaciones}\n\nConciliación adicional aceptada: ${existingRadicacion.numero}`,
            updatedAt: new Date()
          }
        })
      } else {
        // Crear el caso automáticamente solo si no existe
        casoCreado = await prisma.caso.create({
          data: {
            numeroCaso: numeroCaso,
            tipoInsolvencia: 'LIQUIDACION_JUDICIAL',
            estado: 'ACTIVO',
            prioridad: 'MEDIA',
            fechaInicio: new Date(),
            observaciones: `Caso creado automáticamente al aceptar conciliación ${existingRadicacion.numero}.`,
            clienteId,
            responsableId: usuario.id,
            creadoPorId: usuario.id
          }
        })
      }

      // Ya no se genera honorario/factura automáticos aquí: dependían del valor de la
      // conciliación (15%), campo que se quitó del modelo. El honorario se crea a mano desde
      // el caso, con el valor real que se acuerde.
    }

    const updatedRadicacion = await prisma.radicacion.update({
      where: { id: params.radicacionId },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            documento: true
          }
        },
        asesoria: {
          include: {
            lead: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true
              }
            },
            asesor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    })

    // Incluir información del caso creado en la respuesta
    const response: any = {
      radicacion: updatedRadicacion
    }

    if (casoCreado) {
      response.casoCreado = casoCreado
      const casoAction = casoExistente ? 'actualizado' : 'creado'
      response.message = `¡Conciliación aceptada exitosamente! Se ${casoAction} automáticamente el caso ${casoCreado.numeroCaso}${casoExistente ? ' (actualizado con esta nueva conciliación)' : ''}. Recuerda registrar el honorario correspondiente desde el caso.`
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error al actualizar conciliación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { radicacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.DELETE)

    // Verificar que la conciliación existe
    const existingRadicacion = await prisma.radicacion.findUnique({
      where: { id: params.radicacionId }
    })

    if (!existingRadicacion) {
      return NextResponse.json(
        { error: 'Conciliación no encontrada' },
        { status: 404 }
      )
    }

    await prisma.radicacion.delete({
      where: { id: params.radicacionId }
    })

    return NextResponse.json({ message: 'Conciliación eliminada exitosamente' })

  } catch (error: any) {
    console.error('Error al eliminar conciliación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}