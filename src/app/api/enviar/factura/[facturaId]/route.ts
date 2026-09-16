import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { sendEmail, sendWhatsApp, formatPhoneForWhatsApp } from '@/lib/notificaciones'
import { facturaEmailHTML } from '@/lib/email-templates'
import { generateFacturaPDF } from '@/lib/pdf/factura-pdf'

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
        items: true,
        honorario: {
          include: { caso: { include: { cliente: true } } }
        },
        cliente: {
          select: { id: true, nombre: true, apellido: true, email: true, telefono: true, documento: true }
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

    if (metodo === 'EMAIL') {
      const emailTo = body.destinatario || clienteData?.email
      if (!emailTo) {
        return NextResponse.json({ error: 'No se encontro email del cliente' }, { status: 400 })
      }

      const html = facturaEmailHTML({
        numeroFactura: factura.numero,
        clienteNombre,
        fecha: factura.fecha.toISOString(),
        fechaVencimiento: factura.fechaVencimiento.toISOString(),
        estado: factura.estado,
        total: Number(factura.total),
        subtotal: Number(factura.subtotal),
        impuestos: Number(factura.impuestos),
        ivaActivado: factura.ivaActivado,
        casoNumero: factura.honorario?.caso?.numeroCaso || undefined,
        observaciones: factura.observaciones,
        items: factura.items.map((item) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          valorUnitario: Number(item.valorUnitario),
          valorTotal: Number(item.valorTotal),
        })),
      })

      const pdfBytes = await generateFacturaPDF({
        id: factura.id,
        numero: factura.numero,
        fecha: factura.fecha,
        fechaVencimiento: factura.fechaVencimiento,
        subtotal: Number(factura.subtotal),
        impuestos: Number(factura.impuestos),
        total: Number(factura.total),
        estado: factura.estado,
        ivaActivado: factura.ivaActivado,
        observaciones: factura.observaciones,
        clienteNombre: factura.clienteNombre,
        honorario: factura.honorario ? {
          tipo: factura.honorario.tipo,
          caso: {
            numeroCaso: factura.honorario.caso!.numeroCaso,
            cliente: factura.honorario.caso!.cliente,
          }
        } : null,
        cliente: factura.cliente ? {
          nombre: factura.cliente.nombre,
          apellido: factura.cliente.apellido,
          documento: factura.cliente.documento,
          email: factura.cliente.email,
          telefono: factura.cliente.telefono,
        } : null,
        items: factura.items.map((item) => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          valorUnitario: Number(item.valorUnitario),
          valorTotal: Number(item.valorTotal),
        })),
      })

      const result = await sendEmail({
        to: emailTo,
        subject: `Factura ${factura.numero} - Sistema Juridico`,
        html,
        attachments: [{
          filename: `factura-${factura.numero}.pdf`,
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
        templateName: 'factura_generada',
        variables: [
          clienteNombre,
          factura.numero,
          new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(Number(factura.total)),
          new Date(factura.fechaVencimiento).toLocaleDateString('es-CO'),
        ],
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      return NextResponse.json({ success: true, messageId: result.messageId, destinatario: phone })
    }

    return NextResponse.json({ error: 'Metodo no soportado' }, { status: 400 })

  } catch (error: any) {
    console.error('Error al enviar factura:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
