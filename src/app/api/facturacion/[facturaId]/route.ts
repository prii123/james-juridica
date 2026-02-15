import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

// GET /api/facturacion/[facturaId] - Obtener factura específica
export async function GET(
  request: NextRequest,
  { params }: { params: { facturaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.VIEW)

    const factura = await prisma.factura.findUnique({
      where: { id: params.facturaId },
      include: {
        items: true,
        honorario: {
          include: {
            caso: {
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
                }
              }
            }
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        pagos: {
          orderBy: {
            fecha: 'desc'
          }
        }
      }
    })

    if (!factura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(factura)

  } catch (error: any) {
    console.error('Error al obtener factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PATCH /api/facturacion/[facturaId] - Actualizar estado de factura
export async function PATCH(
  request: NextRequest,
  { params }: { params: { facturaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.EDIT)

    const body = await request.json()
    
    // Verificar que la factura existe
    const existingFactura = await prisma.factura.findUnique({
      where: { id: params.facturaId },
      include: {
        honorario: true
      }
    })

    if (!existingFactura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Validar transiciones de estado
    const estadosValidos: Record<string, string[]> = {
      'GENERADA': ['ENVIADA', 'ANULADA'],
      'ENVIADA': ['PAGADA', 'VENCIDA', 'ANULADA'],
      'PAGADA': [], // No se puede cambiar desde pagada
      'VENCIDA': ['PAGADA', 'ANULADA'],
      'ANULADA': [] // No se puede cambiar desde anulada
    }

    if (body.estado && estadosValidos[existingFactura.estado] && !estadosValidos[existingFactura.estado].includes(body.estado)) {
      return NextResponse.json(
        { error: `No se puede cambiar de ${existingFactura.estado} a ${body.estado}` },
        { status: 400 }
      )
    }

    // Construir datos de actualización
    const updateData: any = {}

    if (body.estado !== undefined) {
      updateData.estado = body.estado
      
      // Si se marca como pagada, actualizar el honorario también
      if (body.estado === 'PAGADA' && existingFactura.honorario) {
        await prisma.honorario.update({
          where: { id: existingFactura.honorario.id },
          data: {
            estado: 'PAGADO',
            fechaPago: new Date()
          }
        })
      }
    }

    if (body.observaciones !== undefined) {
      updateData.observaciones = body.observaciones
    }

    if (body.fechaVencimiento !== undefined) {
      updateData.fechaVencimiento = new Date(body.fechaVencimiento)
    }

    if (body.ivaActivado !== undefined) {
      updateData.ivaActivado = body.ivaActivado
    }

    // Manejar modalidad de pago y financiación
    if (body.modalidadPago !== undefined) {
      // Convertir CREDITO del frontend a FINANCIADO del backend
      updateData.modalidadPago = body.modalidadPago === 'CREDITO' ? 'FINANCIADO' : 'CONTADO'
      
      if (body.modalidadPago === 'CREDITO') {
        // Actualizar campos de financiación
        updateData.numeroCuotas = body.numeroCuotas || 1
        updateData.tasaInteres = body.tasaInteres || 0
        
        // Calcular valor de cuota usando sistema francés
        const calcularCuota = (monto: number, cuotas: number, tasaMensual: number) => {
          if (tasaMensual === 0) {
            return monto / cuotas
          }
          const factor = Math.pow(1 + tasaMensual/100, cuotas)
          return (monto * (tasaMensual/100) * factor) / (factor - 1)
        }
        
        // Usar el total actual o el que se está calculando
        const montoTotal = updateData.total || Number(existingFactura.total)
        updateData.valorCuota = calcularCuota(
          montoTotal, 
          updateData.numeroCuotas, 
          updateData.tasaInteres
        )
      } else {
        // Si cambio a contado, limpiar campos de financiación
        updateData.numeroCuotas = null
        updateData.valorCuota = null
        updateData.tasaInteres = null
      }
    }

    // Si se están actualizando los items (solo permitido para facturas GENERADA)
    if (body.items && existingFactura.estado === 'GENERADA') {
      // Calcular nuevos totales
      const subtotal = body.items.reduce((sum: number, item: any) => 
        sum + (item.cantidad * item.valorUnitario), 0
      )
      // Aplicar IVA solo si está activado
      const ivaActivado = body.ivaActivado !== undefined ? body.ivaActivado : existingFactura.ivaActivado
      const impuestos = ivaActivado ? subtotal * 0.19 : 0 // IVA 19% solo si está activado
      const total = subtotal + impuestos

      updateData.subtotal = subtotal
      updateData.impuestos = impuestos
      updateData.total = total
      
      // Actualizar el estado del IVA si se proporcionó
      if (body.ivaActivado !== undefined) {
        updateData.ivaActivado = ivaActivado
      }

      // Si la factura es financiada, recalcular el valor de la cuota
      const modalidadFinal = updateData.modalidadPago || existingFactura.modalidadPago
      if (modalidadFinal === 'FINANCIADO') {
        const numeroCuotas = updateData.numeroCuotas || existingFactura.numeroCuotas || 1
        const tasaInteres = updateData.tasaInteres !== undefined ? updateData.tasaInteres : (existingFactura.tasaInteres || 0)
        
        // Función para calcular cuota con sistema francés
        const calcularCuota = (monto: number, cuotas: number, tasaMensual: number) => {
          if (tasaMensual === 0) {
            return monto / cuotas
          }
          const factor = Math.pow(1 + tasaMensual/100, cuotas)
          return (monto * (tasaMensual/100) * factor) / (factor - 1)
        }
        
        updateData.valorCuota = calcularCuota(total, numeroCuotas, Number(tasaInteres))
      }

      // Eliminar items existentes y crear los nuevos
      await prisma.itemFactura.deleteMany({
        where: { facturaId: params.facturaId }
      })
    }

    const updatedFactura = await prisma.factura.update({
      where: { id: params.facturaId },
      data: {
        ...updateData,
        ...(body.items && existingFactura.estado === 'GENERADA' ? {
          items: {
            create: body.items.map((item: any) => ({
              descripcion: item.descripcion,
              cantidad: item.cantidad,
              valorUnitario: item.valorUnitario,
              valorTotal: item.cantidad * item.valorUnitario
            }))
          }
        } : {})
      },
      include: {
        items: true,
        honorario: {
          include: {
            caso: {
              include: {
                cliente: true
              }
            }
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        pagos: true
      }
    })

    return NextResponse.json(updatedFactura)

  } catch (error: any) {
    console.error('Error al actualizar factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/facturacion/[facturaId] - Eliminar factura (solo si está en estado GENERADA)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { facturaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.DELETE)

    // Verificar que la factura existe y se puede eliminar
    const existingFactura = await prisma.factura.findUnique({
      where: { id: params.facturaId }
    })

    if (!existingFactura) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (existingFactura.estado !== 'GENERADA') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar facturas en estado GENERADA' },
        { status: 400 }
      )
    }

    await prisma.factura.delete({
      where: { id: params.facturaId }
    })

    return NextResponse.json({ message: 'Factura eliminada exitosamente' })

  } catch (error: any) {
    console.error('Error al eliminar factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}