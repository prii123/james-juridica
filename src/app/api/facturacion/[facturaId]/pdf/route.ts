import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { generateFacturaPDF } from '@/lib/pdf/factura-pdf'

export async function GET(
  _request: NextRequest,
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
                    nombre: true,
                    apellido: true,
                    documento: true,
                    email: true,
                    telefono: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

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
      honorario: {
        tipo: factura.honorario.tipo,
        caso: {
          numeroCaso: factura.honorario.caso.numeroCaso,
          cliente: factura.honorario.caso.cliente,
        },
      },
      items: factura.items.map((item) => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        valorUnitario: Number(item.valorUnitario),
        valorTotal: Number(item.valorTotal),
      })),
    })

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="factura-${factura.numero}.pdf"`,
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (error: any) {
    console.error('Error al generar PDF de factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
