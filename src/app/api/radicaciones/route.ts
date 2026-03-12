import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

// Función auxiliar para generar número de radicación
async function generateRadicacionNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  const prefix = `RAD-${currentYear}`
  
  const lastRecord = await prisma.radicacion.findFirst({
    where: { numero: { startsWith: prefix } },
    orderBy: { numero: 'desc' }
  })

  let nextNumber = 1
  if (lastRecord) {
    const lastNumber = parseInt(lastRecord.numero.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.VIEW)

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

    const [radicaciones, total] = await Promise.all([
      prisma.radicacion.findMany({
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
      prisma.radicacion.count({ where })
    ])

    return NextResponse.json({
      radicaciones,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    })

  } catch (error: any) {
    console.error('Error al obtener radicaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.RADICACIONES.CREATE)

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

    // Generar número automáticamente si no se proporciona o es temporal
    let numero = body.numero
    if (!numero || numero.includes('TEMP')) {
      numero = await generateRadicacionNumber()
    } else {
      // Verificar que el número sea único solo si fue proporcionado por el usuario
      const existingRadicacion = await prisma.radicacion.findUnique({
        where: { numero }
      })

      if (existingRadicacion) {
        return NextResponse.json(
          { error: 'Ya existe una radicación con ese número' },
          { status: 400 }
        )
      }
    }

    // Crear la radicación
    const radicacion = await prisma.radicacion.create({
      data: {
        numero,
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

    return NextResponse.json(radicacion, { status: 201 })

  } catch (error: any) {
    console.error('Error al crear radicación:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear la radicación' },
      { status: 400 }
    )
  }
}