import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateFinanciacionPDF } from '@/lib/pdf/financiacion-pdf'
import { calcularCuotas } from '@/lib/cartera/calcular-cuotas'

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
        pagos: {
          select: { valor: true },
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
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            documento: true,
          },
        },
      },
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    const totalPagos = factura.pagos.reduce((sum, p) => sum + Number(p.valor), 0)
    const saldoPendiente = Math.max(0, Number(factura.total) - totalPagos)
    const numeroCuotas = factura.numeroCuotas ?? 1
    const tasaInteresMensual = factura.tasaInteres ? Number(factura.tasaInteres) : 0

    let cuotas = factura.cuotasFactura.map((c) => ({
      numeroCuota: c.numeroCuota,
      fechaVencimiento: c.fechaVencimiento,
      valor: Number(c.valor),
      capital: Number(c.capital),
      interes: Number(c.interes),
      saldo: Number(c.saldo),
    }))

    if (cuotas.length === 0 && numeroCuotas > 1) {
      cuotas = calcularCuotas(saldoPendiente, numeroCuotas, tasaInteresMensual, new Date())
    }

    const clienteData = factura.honorario?.caso?.cliente || factura.cliente

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
      cuotas,
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
