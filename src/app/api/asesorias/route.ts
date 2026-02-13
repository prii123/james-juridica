import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASESORIAS.VIEW)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Filtros
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')
    const modalidad = searchParams.get('modalidad')
    const asesorId = searchParams.get('asesorId')
    const search = searchParams.get('search')
    const fechaInicio = searchParams.get('fechaInicio')
    const fechaFin = searchParams.get('fechaFin')

    // Construir filtros para la consulta
    const where: any = {}

    if (estado) where.estado = estado
    if (tipo) where.tipo = tipo
    if (modalidad) where.modalidad = modalidad
    if (asesorId) where.asesorId = asesorId
    
    if (search) {
      where.OR = [
        { tema: { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
        { lead: { nombre: { contains: search, mode: 'insensitive' } } },
        { asesor: { nombre: { contains: search, mode: 'insensitive' } } },
        { asesor: { apellido: { contains: search, mode: 'insensitive' } } }
      ]
    }

    if (fechaInicio || fechaFin) {
      where.fecha = {}
      if (fechaInicio) where.fecha.gte = new Date(fechaInicio)
      if (fechaFin) where.fecha.lte = new Date(fechaFin)
    }

    // Ejecutar consulta
    const [asesorias, total] = await Promise.all([
      prisma.asesoria.findMany({
        where,
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
              apellido: true
            }
          }
        },
        orderBy: {
          fecha: 'desc'
        },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.asesoria.count({ where })
    ])

    return NextResponse.json({
      asesorias,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    })

  } catch (error: any) {
    console.error('Error al obtener asesorías:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.ASESORIAS.CREATE)

    const body = await request.json()
    
    // Validar datos requeridos
    const requiredFields = ['tipo', 'fecha', 'tema', 'leadId', 'asesorId']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400 }
        )
      }
    }

    // Verificar que el lead existe
    const lead = await prisma.lead.findUnique({
      where: { id: body.leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el asesor existe
    const asesor = await prisma.user.findUnique({
      where: { id: body.asesorId }
    })

    if (!asesor) {
      return NextResponse.json(
        { error: 'Asesor no encontrado' },
        { status: 404 }
      )
    }

    // Crear la asesoría
    const asesoria = await prisma.asesoria.create({
      data: {
        tipo: body.tipo,
        estado: body.estado || 'PROGRAMADA',
        fecha: new Date(body.fecha),
        duracion: body.duracion ? parseInt(body.duracion) : null,
        modalidad: body.modalidad || 'PRESENCIAL',
        tema: body.tema,
        descripcion: body.descripcion || null,
        valor: body.valor ? parseFloat(body.valor) : null,
        leadId: body.leadId,
        asesorId: body.asesorId,
        notas: body.notas || null
      },
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
            apellido: true
          }
        }
      }
    })

    return NextResponse.json(asesoria, { status: 201 })

  } catch (error: any) {
    console.error('Error al crear asesoría:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}