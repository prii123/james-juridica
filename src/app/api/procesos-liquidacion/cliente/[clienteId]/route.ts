import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { clienteId: string } }
) {
  try {
    const casos = await prisma.caso.findMany({
      where: { clienteId: params.clienteId },
      include: {
        procesosLiquidacion: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { fechaInicio: 'desc' }
    })

    return NextResponse.json(casos)
  } catch (error) {
    console.error('Error al obtener procesos por cliente:', error)
    return NextResponse.json(
      { error: 'Error al obtener procesos de liquidación del cliente' },
      { status: 500 }
    )
  }
}
