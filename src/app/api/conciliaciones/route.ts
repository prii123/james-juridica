import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONCILIACIONES.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const estado = searchParams.get('estado')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (estado) {
      where.estado = estado
    }

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { demandante: { contains: search, mode: 'insensitive' } },
        { demandado: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [conciliaciones, total] = await Promise.all([
      prisma.conciliacion.findMany({
        where,
        include: {
          asesoria: {
            include: {
              lead: {
                select: {
                  id: true,
                  nombre: true,
                  email: true
                }
              },
              asesor: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.conciliacion.count({ where })
    ])

    return NextResponse.json({
      conciliaciones,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    })

  } catch (error: any) {
    console.error('Error al obtener conciliaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONCILIACIONES.CREATE)

    const body = await request.json()
    
    // Validar que la asesoría existe
    const asesoria = await prisma.asesoria.findUnique({
      where: { id: body.asesoriaId }
    })

    if (!asesoria) {
      return NextResponse.json(
        { error: 'Asesoría no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el número sea único
    const existingConciliacion = await prisma.conciliacion.findUnique({
      where: { numero: body.numero }
    })

    if (existingConciliacion) {
      return NextResponse.json(
        { error: 'Ya existe una conciliación con ese número' },
        { status: 400 }
      )
    }

    // Crear la conciliación
    const conciliacion = await prisma.conciliacion.create({
      data: {
        numero: body.numero,
        demandante: body.demandante,
        demandado: body.demandado,
        valor: body.valor,
        estado: body.estado || 'SOLICITADA',
        fechaSolicitud: body.fechaSolicitud || new Date(),
        fechaAudiencia: body.fechaAudiencia ? new Date(body.fechaAudiencia) : null,
        observaciones: body.observaciones,
        asesoriaId: body.asesoriaId
      },
      include: {
        asesoria: {
          include: {
            lead: {
              select: {
                id: true,
                nombre: true,
                email: true,
                telefono: true
              }
            },
            asesor: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(conciliacion, { status: 201 })

  } catch (error: any) {
    console.error('Error al crear conciliación:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la conciliación' },
      { status: 400 }
    )
  }
}