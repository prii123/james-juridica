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
      modalidadPago: 'FINANCIADO' as const,
      // Una factura anulada no es cartera: no se cobra ni cuenta en los totales.
      estado: { not: 'ANULADA' } as any
    }

    if (search) {
      whereClause.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { caso: { numeroCaso: { contains: search, mode: 'insensitive' } } },
        { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
        { cliente: { apellido: { contains: search, mode: 'insensitive' } } },
        { clienteNombre: { contains: search, mode: 'insensitive' } }
      ]
    }

    // vista=historial lista las facturas ya pagadas; por defecto solo las que tienen saldo.
    // Los filtros VENCIDAS / PROXIMAS se aplican abajo, en memoria, porque dependen de las cuotas.
    const historial = searchParams.get('vista') === 'historial'

    const facturas = await prisma.factura.findMany({
      where: whereClause as any,
      include: {
        caso: { select: { id: true, numeroCaso: true } },
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        pagos: true,
        cuotasFactura: { select: { fechaVencimiento: true, estado: true } }
      },
      orderBy: {
        createdAt: 'desc'
      }
    } as any)

    // Calcular saldos pendientes y días vencidos
    const facturasCartera = facturas.map((factura: any) => {
      const totalPagos = factura.pagos.reduce((sum: number, pago: any) => sum + Number(pago.valor), 0)
      const saldoPendiente = Number(factura.total) - totalPagos
      const hoy = new Date()
      const msDia = 1000 * 60 * 60 * 24

      // Vencimiento = fecha de la última cuota pendiente; sin cuotas, el de la factura.
      // Los días vencidos se cuentan desde la cuota pendiente vencida más antigua (lo que
      // importa para el cobro), no desde esa última fecha.
      const cuotasPendientes = (factura.cuotasFactura || []).filter((c: any) => c.estado !== 'PAGADA')
      const fechasPendientes = cuotasPendientes.map((c: any) => new Date(c.fechaVencimiento).getTime())
      const fechaVencimiento = new Date(fechasPendientes.length ? Math.max(...fechasPendientes) : factura.fechaVencimiento)
      const masAntigua = new Date(fechasPendientes.length ? Math.min(...fechasPendientes) : factura.fechaVencimiento)
      const diasVencida = saldoPendiente > 0.01 && masAntigua < hoy ? Math.floor((hoy.getTime() - masAntigua.getTime()) / msDia) : 0
      const ultimoPago = factura.pagos.reduce((max: Date | null, p: any) => (!max || p.fecha > max ? p.fecha : max), null as Date | null)

      return {
        id: factura.id,
        numero: factura.numero,
        fecha: factura.fecha.toISOString().split('T')[0],
        fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        fechaUltimoPago: ultimoPago ? new Date(ultimoPago).toISOString().split('T')[0] : null,
        total: Number(factura.total),
        saldoPendiente,
        diasVencida,
        estado: factura.estado,
        modalidadPago: factura.modalidadPago,
        numeroCuotas: factura.numeroCuotas ?? 1,
        valorCuota: factura.valorCuota ? Number(factura.valorCuota) : Number(factura.total),
        cliente: factura.cliente ? {
          id: factura.cliente.id,
          nombre: factura.cliente.nombre,
          apellido: factura.cliente.apellido || '',
          email: factura.cliente.email
        } : {
          id: '',
          nombre: factura.clienteNombre || 'Sin cliente',
          apellido: '',
          email: ''
        },
        caso: factura.caso ? {
          id: factura.caso.id,
          numeroCaso: factura.caso.numeroCaso
        } : {
          id: '',
          numeroCaso: 'N/A'
        }
      }
    })

    const resultado = facturasCartera.filter((f: any) => {
      const pagada = f.estado === 'PAGADA' || f.saldoPendiente <= 0.01
      if (historial) return pagada
      if (pagada) return false
      if (estado === 'VENCIDAS') return f.diasVencida > 0
      if (estado === 'PROXIMAS') return f.diasVencida === 0
      return true
    })

    return NextResponse.json({ facturas: resultado })
  } catch (error: any) {
    console.error('Error al obtener carrtera:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}