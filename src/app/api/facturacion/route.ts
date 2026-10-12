import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { registrarPagoInicialYCuotas } from '@/lib/facturacion-credito'

// GET /api/facturacion - Obtener todas las facturas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.VIEW)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''

    // Construir filtros
    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { caso: { numeroCaso: { contains: search, mode: 'insensitive' } } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: search, mode: 'insensitive' } } },
        { clienteNombre: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (estado) {
      whereClause.estado = estado
    }

    const facturas = await prisma.factura.findMany({
      where: whereClause,
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        caso: {
          select: {
            id: true,
            numeroCaso: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ facturas })
  } catch (error: any) {
    console.error('Error al obtener facturas:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/facturacion - Crear nueva factura
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.CREATE)

    const body = await request.json()
    const { clienteId, clienteNombre, casoId, fechaVencimiento, observaciones, items, modalidadPago, numeroCuotas, tasaInteres, ivaActivado, valorPagado, metodoPago } = body

    // Validar datos requeridos
    if (!fechaVencimiento || !items || items.length === 0) {
      return NextResponse.json({ 
        error: 'Datos incompletos' 
      }, { status: 400 })
    }

    // Si se proporciona clienteId, verificar que existe
    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
      })
      if (!cliente) {
        return NextResponse.json({
          error: 'Cliente no encontrado'
        }, { status: 404 })
      }
    }

    // Si se proporciona casoId (facturación directa de un caso), verificar que existe
    if (casoId) {
      const caso = await prisma.caso.findUnique({ where: { id: casoId } })
      if (!caso) {
        return NextResponse.json({ error: 'Caso no encontrado' }, { status: 404 })
      }
    }

    // Generar número de factura único
    const year = new Date().getFullYear()
    const count = await prisma.factura.count({
      where: {
        numero: {
          startsWith: `FACT-${year}-`
        }
      }
    })
    const numeroFactura = `FACT-${year}-${(count + 1).toString().padStart(4, '0')}`

    // Calcular totales
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.cantidad * item.valorUnitario), 0
    )
    // IVA opcional: por defecto no se cobra (0) salvo que se active explícitamente.
    const aplicaIva = ivaActivado === true
    const impuestos = aplicaIva ? subtotal * 0.19 : 0
    const total = subtotal + impuestos

    if (Number(valorPagado) > total + 0.01) {
      return NextResponse.json({ error: 'El valor pagado no puede ser mayor al total de la factura' }, { status: 400 })
    }

    // Determinar modalidad de pago
    const pagoEsCredito = modalidadPago === 'CREDITO'

    // Crear la factura
    const factura = await prisma.factura.create({
      data: {
        numero: numeroFactura,
        fecha: new Date(),
        fechaVencimiento: new Date(fechaVencimiento),
        subtotal: subtotal,
        impuestos: impuestos,
        total: total,
        estado: 'GENERADA',
        modalidadPago: pagoEsCredito ? 'FINANCIADO' : 'CONTADO',
        ...(pagoEsCredito && {
          numeroCuotas: numeroCuotas || 1,
          tasaInteres: tasaInteres || 0,
        }),
        observaciones: observaciones || '',
        ivaActivado: aplicaIva,
        ...(clienteId ? { clienteId } : {}),
        ...(clienteNombre ? { clienteNombre } : {}),
        ...(casoId ? { casoId } : {}),
        creadoPorId: session.user.id,
        items: {
          create: items.map((item: any) => ({
            descripcion: item.descripcion,
            ...(item.productoId ? { productoId: item.productoId } : {}),
            cantidad: item.cantidad,
            valorUnitario: item.valorUnitario,
            valorTotal: item.cantidad * item.valorUnitario
          }))
        }
      },
      include: {
        items: true,
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
        caso: {
          select: {
            id: true,
            numeroCaso: true,
            tipoInsolvencia: true
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })

    // Pago inicial (valor ya pagado) y, si es a crédito, cuotas sobre el saldo restante.
    if (pagoEsCredito || Number(valorPagado) > 0) {
      await registrarPagoInicialYCuotas(
        prisma,
        { id: factura.id, total },
        {
          financiado: pagoEsCredito,
          numeroCuotas,
          tasaInteres,
          valorPagado: Number(valorPagado) || 0,
          metodoPago,
        },
      )
    }

    // Facturación de un caso: se marca como facturado para que ya no
    // aparezca al elegir cliente en una próxima factura.
    if (casoId) {
      await prisma.caso.update({ where: { id: casoId }, data: { facturado: 1 } })
    }

    return NextResponse.json({ factura }, { status: 201 })

  } catch (error: any) {
    console.error('Error al crear factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}