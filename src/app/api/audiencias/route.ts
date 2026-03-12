import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CASOS.VIEW)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const casoId = searchParams.get('casoId')
    const estado = searchParams.get('estado')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (casoId) {
      where.casoId = casoId
    }

    if (estado) {
      where.estado = estado
    }

    const [audiencias, total] = await Promise.all([
      prisma.audiencia.findMany({
        where,
        include: {
          caso: {
            select: {
              id: true,
              numeroCaso: true,
              tipoInsolvencia: true,
              cliente: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  empresa: true
                }
              }
            }
          },
          responsable: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          }
        },
        orderBy: { fechaHora: 'asc' },
        skip: limit === 1000 ? undefined : skip,
        take: limit === 1000 ? undefined : limit
      }),
      prisma.audiencia.count({ where })
    ])

    return NextResponse.json({
      audiencias,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    })

  } catch (error: any) {
    console.error('Error al obtener audiencias:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
