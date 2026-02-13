import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { conciliacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.CONCILIACIONES.VIEW)

    const conciliacion = await prisma.conciliacion.findUnique({
      where: { id: params.conciliacionId },
      include: {
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

    if (!conciliacion) {
      return NextResponse.json(
        { error: 'Conciliación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(conciliacion)

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
  { params }: { params: { conciliacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.CONCILIACIONES.EDIT)

    const body = await request.json()
    
    // Verificar que la conciliación existe
    const existingConciliacion = await prisma.conciliacion.findUnique({
      where: { id: params.conciliacionId },
      include: {
        asesoria: {
          include: {
            lead: true
          }
        }
      }
    })

    if (!existingConciliacion) {
      return NextResponse.json(
        { error: 'Conciliación no encontrada' },
        { status: 404 }
      )
    }

    // Construir datos de actualización
    const updateData: any = {}

    if (body.estado !== undefined) updateData.estado = body.estado
    if (body.resultado !== undefined) updateData.resultado = body.resultado
    if (body.demandante !== undefined) updateData.demandante = body.demandante
    if (body.demandado !== undefined) updateData.demandado = body.demandado
    if (body.valor !== undefined) updateData.valor = parseFloat(body.valor)
    if (body.fechaSolicitud !== undefined) updateData.fechaSolicitud = new Date(body.fechaSolicitud)
    if (body.fechaAudiencia !== undefined) {
      updateData.fechaAudiencia = body.fechaAudiencia ? new Date(body.fechaAudiencia) : null
    }
    if (body.observaciones !== undefined) updateData.observaciones = body.observaciones

    // Variables para el resultado
    let casoCreado = null
    
    // Si se está aceptando la conciliación (estado REALIZADA) y se solicita crear caso  
    if (body.createCase && body.estado === 'REALIZADA' && existingConciliacion.estado !== 'REALIZADA') {
      // Generar número de caso
      const year = new Date().getFullYear()
      const randomNum = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
      const numeroCaso = `CASO-${year}-${randomNum}`

      // Verificar si ya existe un cliente para este lead
      let clienteId = null
      const leadData = existingConciliacion.asesoria.lead
      
      // Buscar cliente existente por email
      let cliente = await prisma.cliente.findUnique({
        where: { email: leadData.email }
      })

      if (!cliente) {
        // Crear cliente si no existe
        cliente = await prisma.cliente.create({
          data: {
            nombre: leadData.nombre,
            email: leadData.email,
            telefono: leadData.telefono || '',
            documento: leadData.documento || `TEMP-${Date.now()}`, // Generar documento temporal si no existe
            tipoPersona: 'NATURAL'
          }
        })
      }

      // Crear el caso automáticamente
      casoCreado = await prisma.caso.create({
        data: {
          numeroCaso: numeroCaso,
          tipoInsolvencia: 'LIQUIDACION_JUDICIAL', // Valor por defecto
          estado: 'ACTIVO',
          prioridad: 'MEDIA',
          valorDeuda: existingConciliacion.valor,
          fechaInicio: new Date(),
          observaciones: `Caso creado automáticamente al aceptar conciliación ${existingConciliacion.numero}. Demandante: ${existingConciliacion.demandante} vs ${existingConciliacion.demandado}`,
          clienteId: cliente.id,
          responsableId: existingConciliacion.asesoria.asesorId,
          creadoPorId: existingConciliacion.asesoria.asesorId
        }
      })
    }

    const updatedConciliacion = await prisma.conciliacion.update({
      where: { id: params.conciliacionId },
      data: updateData,
      include: {
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
      conciliacion: updatedConciliacion
    }

    if (casoCreado) {
      response.casoCreado = casoCreado
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
  { params }: { params: { conciliacionId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.CONCILIACIONES.DELETE)

    // Verificar que la conciliación existe
    const existingConciliacion = await prisma.conciliacion.findUnique({
      where: { id: params.conciliacionId }
    })

    if (!existingConciliacion) {
      return NextResponse.json(
        { error: 'Conciliación no encontrada' },
        { status: 404 }
      )
    }

    await prisma.conciliacion.delete({
      where: { id: params.conciliacionId }
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