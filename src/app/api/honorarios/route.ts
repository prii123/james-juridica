import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.HONORARIOS.VIEW)

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')

    const where: any = {}
    if (estado) where.estado = estado

    const honorarios = await prisma.honorario.findMany({
      where,
      include: {
        caso: {
          select: {
            id: true,
            numeroCaso: true,
            cliente: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
        facturas: {
          select: { id: true, numero: true, total: true, estado: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ honorarios })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.HONORARIOS.CREATE)

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const honorario = await prisma.honorario.create({
      data: {
        tipo: body.tipo,
        modalidadPago: body.modalidadPago || 'CONTADO',
        valor: body.valor,
        estado: body.estado || 'PENDIENTE',
        fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
        observaciones: body.observaciones,
        numeroCuotas: body.numeroCuotas,
        valorCuota: body.valorCuota,
        ...(body.casoId ? { casoId: body.casoId } : {}),
      } as any,
      include: {
        caso: {
          select: {
            id: true,
            numeroCaso: true,
            cliente: {
              select: { id: true, nombre: true, apellido: true },
            },
          },
        },
      },
    })

    return NextResponse.json(honorario, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
