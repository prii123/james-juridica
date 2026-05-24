import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calcularCuotas } from '@/lib/cartera/calcular-cuotas'
import { generateSeguimientoCuotasPDF } from '@/lib/pdf/seguimiento-cuotas-pdf'

async function ensureCuotasGeneradas(facturaId: string) {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: {
      cuotasFactura: { select: { id: true } },
      pagos: { select: { valor: true } },
    },
  })
  if (!factura) return null
  if (factura.cuotasFactura.length === 0 && factura.numeroCuotas && factura.numeroCuotas > 1) {
    const totalPagos = factura.pagos.reduce((sum, p) => sum + Number(p.valor), 0)
    const saldoPendiente = Math.max(0, Number(factura.total) - totalPagos)
    const tasaInteres = factura.tasaInteres ? Number(factura.tasaInteres) : 0
    const cuotas = calcularCuotas(saldoPendiente, factura.numeroCuotas, tasaInteres, new Date())
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
  return factura
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { facturaId: string } }
) {
  try {
    const { facturaId } = params

    await ensureCuotasGeneradas(facturaId)

    const factura = await prisma.factura.findUnique({
      where: { id: facturaId },
      include: {
        honorario: {
          include: {
            caso: {
              include: { cliente: true }
            }
          }
        },
        cliente: {
          select: { nombre: true, apellido: true }
        },
        cuotasFactura: {
          include: {
            abonosPagos: {
              include: { pago: true }
            }
          },
          orderBy: { numeroCuota: 'asc' }
        },
        pagos: {
          include: {
            aplicadoCuotas: {
              include: { cuota: true }
            }
          },
          orderBy: { fecha: 'desc' }
        }
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const cuotasConSeguimiento = factura.cuotasFactura.map(cuota => {
      const totalPagado = cuota.abonosPagos.reduce((sum, abono) => sum + Number(abono.valorAplicado), 0)
      const saldoCuota = Number(cuota.valor) - totalPagado
      let estado = cuota.estado
      if (totalPagado >= Number(cuota.valor)) estado = 'PAGADA'
      else if (totalPagado > 0) estado = 'PARCIAL'
      else if (new Date(cuota.fechaVencimiento) < new Date() && estado !== 'PAGADA') estado = 'VENCIDA'

      return {
        numeroCuota: cuota.numeroCuota,
        valor: Number(cuota.valor),
        capital: Number(cuota.capital),
        interes: Number(cuota.interes),
        saldo: Number(cuota.saldo),
        fechaVencimiento: cuota.fechaVencimiento.toISOString(),
        fechaPago: cuota.fechaPago?.toISOString(),
        estado,
        valorPagado: totalPagado,
        saldoCuota: Math.max(0, saldoCuota),
        diasVencido: estado === 'VENCIDA'
          ? Math.ceil((new Date().getTime() - new Date(cuota.fechaVencimiento).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
        pagosAplicados: cuota.abonosPagos.map(abono => ({
          valorAplicado: Number(abono.valorAplicado),
          fechaAplicacion: abono.fechaAplicacion.toISOString(),
          pago: {
            id: abono.pago.id,
            valor: Number(abono.pago.valor),
            fecha: abono.pago.fecha.toISOString(),
            metodoPago: abono.pago.metodoPago,
            referencia: abono.pago.referencia,
            observaciones: abono.pago.observaciones
          }
        }))
      }
    })

    const totalFactura = Number(factura.total)
    const totalPagado = factura.pagos.reduce((sum, pago) => sum + Number(pago.valor), 0)
    const saldoPendiente = Math.max(0, totalFactura - totalPagado)
    const cuotasPagadas = cuotasConSeguimiento.filter(c => c.estado === 'PAGADA').length
    const cuotasVencidas = cuotasConSeguimiento.filter(c => c.estado === 'VENCIDA').length
    const cuotasParciales = cuotasConSeguimiento.filter(c => c.estado === 'PARCIAL').length
    const cuotasPendientes = cuotasConSeguimiento.length - cuotasPagadas - cuotasVencidas - cuotasParciales

    const clienteData = factura.honorario?.caso?.cliente || factura.cliente

    const pdfData = {
      factura: {
        numero: factura.numero,
        fecha: factura.fecha.toISOString(),
        total: totalFactura,
        modalidadPago: factura.modalidadPago,
        numeroCuotas: factura.numeroCuotas ?? undefined,
        valorCuota: factura.valorCuota ? Number(factura.valorCuota) : undefined,
        tasaInteres: factura.tasaInteres ? Number(factura.tasaInteres) : undefined,
        cliente: {
          nombre: clienteData?.nombre ?? factura.clienteNombre ?? '',
          apellido: clienteData?.apellido ?? ''
        },
        caso: {
          numeroCaso: factura.honorario?.caso?.numeroCaso ?? 'N/A'
        }
      },
      resumen: {
        totalPagado,
        saldoPendiente,
        cuotasPagadas,
        cuotasVencidas,
        cuotasParciales,
        cuotasPendientes,
        progresoPago: totalFactura > 0 ? (totalPagado / totalFactura) * 100 : 0
      },
      cuotas: cuotasConSeguimiento,
      historialPagos: factura.pagos.map(pago => ({
        id: pago.id,
        valor: Number(pago.valor),
        fecha: pago.fecha.toISOString(),
        metodoPago: pago.metodoPago,
        referencia: pago.referencia,
        observaciones: pago.observaciones,
        distribucion: pago.aplicadoCuotas.map(aplicacion => ({
          cuotaNumero: aplicacion.cuota.numeroCuota,
          valorAplicado: Number(aplicacion.valorAplicado),
          fechaAplicacion: aplicacion.fechaAplicacion.toISOString()
        }))
      }))
    }

    const pdfBytes = await generateSeguimientoCuotasPDF(pdfData)

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="seguimiento-cuotas-${factura.numero}.pdf"`,
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (error: any) {
    console.error('Error al generar PDF de seguimiento:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
