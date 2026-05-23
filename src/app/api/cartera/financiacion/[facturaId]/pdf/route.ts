import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateFinanciacionPDF } from '@/lib/pdf/financiacion-pdf'

interface CuotaCalculada {
  numeroCuota: number
  fechaVencimiento: Date
  valor: number
  capital: number
  interes: number
  saldo: number
}

function calcularCuotas(
  monto: number,
  numeroCuotas: number,
  tasaInteresMensual: number,
  fechaInicio: Date,
): CuotaCalculada[] {
  const tasaMensual = tasaInteresMensual / 100

  let valorCuota = 0
  if (tasaMensual > 0) {
    const factor = Math.pow(1 + tasaMensual, numeroCuotas)
    valorCuota = (monto * tasaMensual * factor) / (factor - 1)
  } else {
    valorCuota = monto / numeroCuotas
  }

  const tabla: CuotaCalculada[] = []
  let saldoPendiente = monto

  for (let i = 1; i <= numeroCuotas; i++) {
    const interes = saldoPendiente * tasaMensual
    const capital = valorCuota - interes
    saldoPendiente -= capital

    const fechaVencimiento = new Date(fechaInicio)
    fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i)

    tabla.push({
      numeroCuota: i,
      fechaVencimiento,
      valor: Math.round(valorCuota),
      capital: Math.round(capital),
      interes: Math.round(interes),
      saldo: Math.round(Math.max(0, saldoPendiente)),
    })
  }

  return tabla
}

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

    const pdfBytes = await generateFinanciacionPDF({
      numeroFactura: factura.numero,
      cliente: {
        nombre: factura.honorario?.caso?.cliente?.nombre ?? '',
        apellido: factura.honorario?.caso?.cliente?.apellido ?? '',
        documento: factura.honorario?.caso?.cliente?.documento ?? '',
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
