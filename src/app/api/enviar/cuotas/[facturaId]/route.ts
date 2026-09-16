import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, sendWhatsApp, formatPhoneForWhatsApp } from '@/lib/notificaciones'
import { seguimientoCuotasEmailHTML } from '@/lib/email-templates'
import { generateSeguimientoCuotasPDF } from '@/lib/pdf/seguimiento-cuotas-pdf'
import { calcularCuotas } from '@/lib/cartera/calcular-cuotas'

async function ensureCuotasGeneradas(facturaId: string) {
  const factura = await prisma.factura.findUnique({
    where: { id: facturaId },
    include: { cuotasFactura: { select: { id: true } }, pagos: { select: { valor: true } } },
  })
  if (!factura) return null
  if (factura.cuotasFactura.length === 0 && factura.numeroCuotas && factura.numeroCuotas > 1) {
    const totalPagos = factura.pagos.reduce((sum, p) => sum + Number(p.valor), 0)
    const saldo = Math.max(0, Number(factura.total) - totalPagos)
    const tasa = factura.tasaInteres ? Number(factura.tasaInteres) : 0
    const cuotas = calcularCuotas(saldo, factura.numeroCuotas, tasa, new Date())
    await prisma.cuotaFactura.createMany({
      data: cuotas.map((c) => ({
        facturaId, numeroCuota: c.numeroCuota, fechaVencimiento: c.fechaVencimiento,
        valor: c.valor, capital: c.capital, interes: c.interes, saldo: c.saldo,
        valorPagado: 0, saldoCuota: c.valor,
      })),
    })
  }
  return factura
}

export async function POST(
  request: NextRequest,
  { params }: { params: { facturaId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { metodo } = body

    if (!metodo || !['EMAIL', 'WHATSAPP'].includes(metodo)) {
      return NextResponse.json({ error: 'Metodo invalido. Use EMAIL o WHATSAPP' }, { status: 400 })
    }

    await ensureCuotasGeneradas(params.facturaId)

    const factura = await prisma.factura.findUnique({
      where: { id: params.facturaId },
      include: {
        honorario: { include: { caso: { include: { cliente: true } } } },
        cliente: { select: { id: true, nombre: true, apellido: true, email: true, telefono: true } },
        cuotasFactura: {
          include: { abonosPagos: { include: { pago: true } } },
          orderBy: { numeroCuota: 'asc' }
        },
        pagos: {
          include: { aplicadoCuotas: { include: { cuota: true } } },
          orderBy: { fecha: 'desc' }
        }
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const clienteData = factura.honorario?.caso?.cliente || factura.cliente
    const clienteNombre = clienteData
      ? `${clienteData.nombre} ${clienteData.apellido || ''}`.trim()
      : factura.clienteNombre || 'Sin cliente'

    const cuotasConSeguimiento = factura.cuotasFactura.map(cuota => {
      const totalPagado = cuota.abonosPagos.reduce((sum, abono) => sum + Number(abono.valorAplicado), 0)
      const saldoCuota = Number(cuota.valor) - totalPagado
      let estado = cuota.estado
      if (totalPagado >= Number(cuota.valor)) estado = 'PAGADA'
      else if (totalPagado > 0) estado = 'PARCIAL'
      else if (new Date(cuota.fechaVencimiento) < new Date()) estado = 'VENCIDA'

      return {
        numeroCuota: cuota.numeroCuota,
        valor: Number(cuota.valor),
        capital: Number(cuota.capital),
        interes: Number(cuota.interes),
        saldo: Number(cuota.saldo),
        fechaVencimiento: cuota.fechaVencimiento.toISOString(),
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
            id: abono.pago.id, valor: Number(abono.pago.valor),
            fecha: abono.pago.fecha.toISOString(), metodoPago: abono.pago.metodoPago,
            referencia: abono.pago.referencia, observaciones: abono.pago.observaciones
          }
        }))
      }
    })

    const totalFactura = Number(factura.total)
    const totalPagado = factura.pagos.reduce((sum, p) => sum + Number(p.valor), 0)
    const saldoPendiente = Math.max(0, totalFactura - totalPagado)
    const progresoPago = totalFactura > 0 ? (totalPagado / totalFactura) * 100 : 0

    if (metodo === 'EMAIL') {
      const emailTo = body.destinatario || clienteData?.email
      if (!emailTo) {
        return NextResponse.json({ error: 'No se encontro email del cliente' }, { status: 400 })
      }

      const html = seguimientoCuotasEmailHTML({
        numeroFactura: factura.numero,
        clienteNombre,
        total: totalFactura,
        numeroCuotas: factura.numeroCuotas || factura.cuotasFactura.length,
        progresoPago,
        totalPagado,
        saldoPendiente,
        cuotas: cuotasConSeguimiento,
      })

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
          caso: { numeroCaso: factura.honorario?.caso?.numeroCaso ?? 'N/A' }
        },
        resumen: {
          totalPagado, saldoPendiente,
          cuotasPagadas: cuotasConSeguimiento.filter(c => c.estado === 'PAGADA').length,
          cuotasVencidas: cuotasConSeguimiento.filter(c => c.estado === 'VENCIDA').length,
          cuotasParciales: cuotasConSeguimiento.filter(c => c.estado === 'PARCIAL').length,
          cuotasPendientes: cuotasConSeguimiento.filter(c => c.estado === 'PENDIENTE').length,
          progresoPago,
        },
        cuotas: cuotasConSeguimiento,
        historialPagos: factura.pagos.map(p => ({
          id: p.id, valor: Number(p.valor),
          fecha: p.fecha.toISOString(), metodoPago: p.metodoPago,
          referencia: p.referencia, observaciones: p.observaciones,
          distribucion: p.aplicadoCuotas.map(a => ({
            cuotaNumero: a.cuota.numeroCuota,
            valorAplicado: Number(a.valorAplicado),
            fechaAplicacion: a.fechaAplicacion.toISOString()
          }))
        })),
      }

      const pdfBytes = await generateSeguimientoCuotasPDF(pdfData)

      const result = await sendEmail({
        to: emailTo,
        subject: `Estado de Cuenta - Factura ${factura.numero}`,
        html,
        attachments: [{
          filename: `estado-cuenta-${factura.numero}.pdf`,
          content: Buffer.from(pdfBytes),
        }],
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, messageId: result.messageId, destinatario: emailTo })
    }

    if (metodo === 'WHATSAPP') {
      const phoneRaw = body.destinatario || clienteData?.telefono
      if (!phoneRaw) {
        return NextResponse.json({ error: 'No se encontro telefono del cliente' }, { status: 400 })
      }

      const phone = formatPhoneForWhatsApp(phoneRaw)

      const result = await sendWhatsApp({
        to: phone,
        templateName: 'estado_cuenta',
        variables: [
          clienteNombre,
          factura.numero,
          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalFactura),
          `${progresoPago.toFixed(0)}%`,
          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(saldoPendiente),
        ],
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, messageId: result.messageId, destinatario: phone })
    }

    return NextResponse.json({ error: 'Metodo no soportado' }, { status: 400 })

  } catch (error: any) {
    console.error('Error al enviar seguimiento cuotas:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
