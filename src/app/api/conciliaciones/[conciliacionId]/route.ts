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
    let honorarioCreado = null
    let facturaCreada = null
    let casoExistente = null
    
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

      // Verificar si ya existe un caso activo para este cliente
      casoExistente = await prisma.caso.findFirst({
        where: {
          clienteId: cliente.id,
          tipoInsolvencia: 'LIQUIDACION_JUDICIAL',
          estado: 'ACTIVO'
        }
      })

      if (casoExistente) {
        // Usar el caso existente y actualizarlo
        casoCreado = await prisma.caso.update({
          where: { id: casoExistente.id },
          data: {
            valorDeuda: { 
              increment: Number(existingConciliacion.valor) // Sumar el valor de esta conciliación
            },
            observaciones: `${casoExistente.observaciones}\n\nConciliación adicional aceptada: ${existingConciliacion.numero} - ${existingConciliacion.demandante} vs ${existingConciliacion.demandado} por ${existingConciliacion.valor}`,
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
            valorDeuda: existingConciliacion.valor,
            fechaInicio: new Date(),
            observaciones: `Caso creado automáticamente al aceptar conciliación ${existingConciliacion.numero}. Demandante: ${existingConciliacion.demandante} vs ${existingConciliacion.demandado}`,
            clienteId: cliente.id,
            responsableId: existingConciliacion.asesoria.asesorId,
            creadoPorId: existingConciliacion.asesoria.asesorId
          }
        })
      }

      // Crear honorario automáticamente (valor base de la conciliación como honorario)
      const valorHonorario = Number(existingConciliacion.valor) * 0.15 // 15% del valor de la conciliación como honorario
      
      honorarioCreado = await prisma.honorario.create({
        data: {
          tipo: 'REPRESENTACION',
          modalidadPago: 'CONTADO',
          valor: valorHonorario,
          estado: 'PENDIENTE',
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días para pagar
          observaciones: `Honorario generado automáticamente por aceptación de conciliación ${existingConciliacion.numero}`,
          casoId: casoCreado.id
        }
      })

      // Crear factura automática pendiente por facturar
      const numeroFactura = `FACT-${year}-${randomNum}`
      const subtotal = valorHonorario
      const impuestos = subtotal * 0.19 // IVA del 19%
      const total = subtotal + impuestos

      facturaCreada = await prisma.factura.create({
        data: {
          numero: numeroFactura,
          fecha: new Date(),
          fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
          subtotal: subtotal,
          impuestos: impuestos,
          total: total,
          estado: 'GENERADA', // Factura generada, pendiente de envío
          observaciones: `Factura generada automáticamente por caso ${numeroCaso} - Conciliación aceptada`,
          ivaActivado: true, // IVA activado por defecto en facturas automáticas
          honorarioId: honorarioCreado.id,
          creadoPorId: existingConciliacion.asesoria.asesorId,
          items: {
            create: [
              {
                descripcion: `Honorarios profesionales - Representación en proceso de insolvencia - Caso ${numeroCaso}`,
                cantidad: 1,
                valorUnitario: subtotal,
                valorTotal: subtotal
              }
            ]
          }
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
      
      if (honorarioCreado) {
        response.honorarioCreado = honorarioCreado
      }
      
      if (facturaCreada) {
        response.facturaCreada = facturaCreada
        const casoAction = casoExistente ? 'actualizado' : 'creado'
        response.message = `¡Conciliación aceptada exitosamente! Se ${casoAction} automáticamente:
        - Caso: ${casoCreado.numeroCaso} ${casoExistente ? '(actualizado con nueva deuda)' : '(nuevo)'}
        - Honorario por representación: $${Number(honorarioCreado?.valor).toLocaleString('es-CO')}
        - Factura pendiente: ${facturaCreada.numero} (Total: $${Number(facturaCreada.total).toLocaleString('es-CO')})`
      }
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