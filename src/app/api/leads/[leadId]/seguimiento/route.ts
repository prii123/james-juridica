import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'

// Crear una nueva instancia del cliente para asegurar tipos actualizados
const prismaClient = new PrismaClient()

// GET /api/leads/[leadId]/seguimiento - Obtener seguimientos del lead
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.VIEW)

    const seguimientos = await prismaClient.seguimiento.findMany({
      where: {
        leadId: params.leadId
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fecha: 'desc'
      }
    })

    return NextResponse.json(seguimientos)
  } catch (error) {
    console.error('Error al obtener seguimientos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/leads/[leadId]/seguimiento - Crear nuevo seguimiento
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.CREATE)

    const body = await request.json()
    const { tipo, descripcion, duracion, resultado, proximoSeguimiento } = body

    // Validaciones básicas
    if (!tipo || !descripcion) {
      return NextResponse.json(
        { error: 'Tipo y descripción son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el lead existe
    const lead = await prismaClient.lead.findUnique({
      where: { id: params.leadId }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario existe
    const usuario = await prismaClient.user.findUnique({
      where: { id: session.user.id }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no válido' },
        { status: 400 }
      )
    }

    const seguimiento = await prismaClient.seguimiento.create({
      data: {
        tipo,
        descripcion,
        duracion: duracion ? parseInt(duracion) : null,
        resultado: resultado || null,
        proximoSeguimiento: proximoSeguimiento ? new Date(proximoSeguimiento) : null,
        leadId: params.leadId,
        usuarioId: session.user.id
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })

    // Actualizar fecha de seguimiento del lead
    await prismaClient.lead.update({
      where: { id: params.leadId },
      data: { fechaSeguimiento: new Date() }
    })

    return NextResponse.json(seguimiento, { status: 201 })
  } catch (error) {
    console.error('Error al crear seguimiento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}