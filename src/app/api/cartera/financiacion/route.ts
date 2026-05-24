import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcularCuotas } from '@/lib/cartera/calcular-cuotas'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { facturaId, numeroCuotas, tasaInteres, fechaInicio } = body

    if (!facturaId || !numeroCuotas || numeroCuotas < 2) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        cuotasFactura: { select: { id: true } },
        pagos: { select: { valor: true } },
      },
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const totalPagos = factura.pagos.reduce((sum, p) => sum + Number(p.valor), 0)
    const saldoPendiente = Math.max(0, Number(factura.total) - totalPagos)
    const tasa = tasaInteres ? Number(tasaInteres) : 0

    await prisma.factura.update({
      where: { id: facturaId },
      data: {
        numeroCuotas,
        tasaInteres: tasa,
        valorCuota: saldoPendiente > 0 && numeroCuotas > 0
          ? Math.round(saldoPendiente / numeroCuotas)
          : 0,
        modalidadPago: 'FINANCIADO',
      },
    })

    if (factura.cuotasFactura.length === 0) {
      const cuotas = calcularCuotas(
        saldoPendiente,
        numeroCuotas,
        tasa,
        fechaInicio ? new Date(fechaInicio) : new Date(),
      )

      await prisma.cuotaFactura.createMany({
        data: cuotas.map((c) => ({
          facturaId,
          numeroCuota: c.numeroCuota,
          fechaVencimiento: c.fechaVencimiento,
          valor: c.valor,
          capital: c.capital,
          interes: c.interes,
          saldo: c.saldo,
          valorPagado: 0,
          saldoCuota: c.valor,
        })),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error al guardar financiación:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
