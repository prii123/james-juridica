import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateFinanciacionPDF } from '@/lib/pdf/financiacion-pdf'

export async function GET(
  _request: NextRequest,
  { params }: { params: { facturaId: string } },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const factura = await prisma.factura.findUnique({
      where: { id: params.facturaId },
      include: {
        cuotasFactura: {
          orderBy: { numeroCuota: 'asc' },
        },
        honorario: {
          include: {
            caso: {
              include: {
                cliente: {
                  select: {
                    nombre: true,
                    apellido: true,
                    documento: true,
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

    const pdfBytes = await generateFinanciacionPDF({
      numeroFactura: factura.numero,
      cliente: {
        nombre: factura.honorario.caso.cliente.nombre,
        apellido: factura.honorario.caso.cliente.apellido,
        documento: factura.honorario.caso.cliente.documento,
      },
      caso: { numeroCaso: factura.honorario.caso.numeroCaso },
      totalFinanciado: Number(factura.total),
      numeroCuotas: factura.numeroCuotas ?? factura.cuotasFactura.length,
      tasaInteresMensual: factura.tasaInteres ? Number(factura.tasaInteres) : 0,
      cuotas: factura.cuotasFactura.map((c) => ({
        numeroCuota: c.numeroCuota,
        fechaVencimiento: c.fechaVencimiento,
        valor: Number(c.valor),
        capital: Number(c.capital),
        interes: Number(c.interes),
        saldo: Number(c.saldo),
      })),
    })

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="financiacion-${factura.numero}.pdf"`,
        'Content-Length': String(pdfBytes.length),
      },
    })
  } catch (error: any) {
    console.error('Error al generar PDF de financiación:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 },
    )
  }
}
