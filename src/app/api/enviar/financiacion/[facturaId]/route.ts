import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, sendWhatsApp, formatPhoneForWhatsApp } from '@/lib/notificaciones'
import { financiacionEmailHTML } from '@/lib/email-templates'
import { generateFinanciacionPDF } from '@/lib/pdf/financiacion-pdf'
import { calcularCuotas } from '@/lib/cartera/calcular-cuotas'

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

    const factura = await prisma.factura.findUnique({
      where: { id: params.facturaId },
      include: {
        cuotasFactura: { orderBy: { numeroCuota: 'asc' } },
        pagos: { select: { valor: true } },
        honorario: { include: { caso: { include: { cliente: true } } } },
        cliente: { select: { id: true, nombre: true, apellido: true, email: true, telefono: true, documento: true } }
      }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const clienteData = factura.honorario?.caso?.cliente || factura.cliente
    const clienteNombre = clienteData
      ? `${clienteData.nombre} ${clienteData.apellido || ''}`.trim()
      : factura.clienteNombre || 'Sin cliente'

    const totalPagos = factura.pagos.reduce((sum, p) => sum + Number(p.valor), 0)
    const saldoPendiente = Math.max(0, Number(factura.total) - totalPagos)
    const numeroCuotas = factura.numeroCuotas ?? 1
    const tasaInteresMensual = factura.tasaInteres ? Number(factura.tasaInteres) : 0

    let cuotas = factura.cuotasFactura.map((c) => ({
      numero: c.numeroCuota,
      fechaVencimiento: c.fechaVencimiento.toISOString(),
      valorCuota: Number(c.valor),
      capital: Number(c.capital),
      interes: Number(c.interes),
      saldo: Number(c.saldo),
    }))

    if (cuotas.length === 0 && numeroCuotas > 1) {
      const calculadas = calcularCuotas(saldoPendiente, numeroCuotas, tasaInteresMensual, new Date())
      cuotas = calculadas.map(c => ({
        numero: c.numeroCuota,
        fechaVencimiento: c.fechaVencimiento.toISOString(),
        valorCuota: c.valor,
        capital: c.capital,
        interes: c.interes,
        saldo: c.saldo,
      }))
    }

    if (metodo === 'EMAIL') {
      const emailTo = body.destinatario || clienteData?.email
      if (!emailTo) {
        return NextResponse.json({ error: 'No se encontro email del cliente' }, { status: 400 })
      }

      const html = financiacionEmailHTML({
        numeroFactura: factura.numero,
        clienteNombre,
        totalFinanciado: saldoPendiente,
        numeroCuotas,
        tasaInteresMensual,
        cuotas,
      })

      const pdfBytes = await generateFinanciacionPDF({
        numeroFactura: factura.numero,
        cliente: {
          nombre: clienteData?.nombre ?? factura.clienteNombre ?? '',
          apellido: clienteData?.apellido ?? '',
          documento: clienteData?.documento ?? '',
        },
        caso: { numeroCaso: factura.honorario?.caso?.numeroCaso ?? '' },
        totalFinanciado: saldoPendiente,
        numeroCuotas,
        tasaInteresMensual,
        cuotas: cuotas.map((c) => ({
          numeroCuota: c.numero,
          fechaVencimiento: new Date(c.fechaVencimiento),
          valor: c.valorCuota,
          capital: c.capital,
          interes: c.interes,
          saldo: c.saldo,
        })),
      })

      const result = await sendEmail({
        to: emailTo,
        subject: `Plan de Financiacion - Factura ${factura.numero}`,
        html,
        attachments: [{
          filename: `financiacion-${factura.numero}.pdf`,
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
        templateName: 'plan_financiacion',
        variables: [
          clienteNombre,
          factura.numero,
          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(saldoPendiente),
          String(numeroCuotas),
          `${tasaInteresMensual}%`,
        ],
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, messageId: result.messageId, destinatario: phone })
    }

    return NextResponse.json({ error: 'Metodo no soportado' }, { status: 400 })

  } catch (error: any) {
    console.error('Error al enviar financiacion:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
