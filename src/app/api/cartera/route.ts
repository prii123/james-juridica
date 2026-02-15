import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

// GET /api/cartera - Obtener facturas a crédito para gestión de cartera
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

    // Construir filtros - solo facturas financiadas (a crédito)
    let whereClause: any = {
      modalidadPago: 'FINANCIADO' as const
    }

    if (search) {
      whereClause.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { honorario: { caso: { numeroCaso: { contains: search, mode: 'insensitive' } } } },
        { honorario: { caso: { cliente: { nombre: { contains: search, mode: 'insensitive' } } } } },
        { honorario: { caso: { cliente: { apellido: { contains: search, mode: 'insensitive' } } } } }
      ]
    }

    if (estado && estado !== 'TODAS') {
      if (estado === 'VENCIDAS') {
        whereClause.fechaVencimiento = { lt: new Date() }
        whereClause.estado = { not: 'PAGADA' }
      } else if (estado === 'PROXIMAS') {
        whereClause.fechaVencimiento = { gte: new Date() }
        whereClause.estado = { not: 'PAGADA' }
      } else if (estado === 'PAGADAS') {
        whereClause.estado = 'PAGADA'
      }
    }

    const facturas = await prisma.factura.findMany({
      where: whereClause as any,
      include: {
        honorario: {
          include: {
            caso: {
              include: {
                cliente: true
              }
            }
          }
        },
        pagos: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    } as any)

    // Calcular saldos pendientes y días vencidos
    const facturasCartera = facturas.map((factura: any) => {
      const totalPagos = factura.pagos.reduce((sum: number, pago: any) => sum + Number(pago.valor), 0)
      const saldoPendiente = Number(factura.total) - totalPagos
      const fechaVencimiento = new Date(factura.fechaVencimiento)
      const hoy = new Date()
      const diasVencida = fechaVencimiento < hoy ? Math.floor((hoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)) : 0

      return {
        id: factura.id,
        numero: factura.numero,
        fecha: factura.fecha.toISOString().split('T')[0],
        fechaVencimiento: factura.fechaVencimiento.toISOString().split('T')[0],
        total: Number(factura.total),
        saldoPendiente,
        diasVencida,
        estado: factura.estado,
        modalidadPago: factura.modalidadPago,
        numeroCuotas: factura.numeroCuotas ?? 1,
        valorCuota: factura.valorCuota ? Number(factura.valorCuota) : Number(factura.total),
        cliente: {
          id: factura.honorario.caso.cliente.id,
          nombre: factura.honorario.caso.cliente.nombre,
          apellido: factura.honorario.caso.cliente.apellido || '',
          email: factura.honorario.caso.cliente.email
        },
        caso: {
          id: factura.honorario.caso.id,
          numeroCaso: factura.honorario.caso.numeroCaso
        }
      }
    })

    return NextResponse.json({ facturas: facturasCartera })
  } catch (error: any) {
    console.error('Error al obtener carrtera:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}