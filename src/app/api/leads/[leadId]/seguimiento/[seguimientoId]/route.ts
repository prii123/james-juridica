import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'

// Crear una nueva instancia del cliente para asegurar tipos actualizados
const prismaClient = new PrismaClient()

// GET /api/leads/[leadId]/seguimiento/[seguimientoId] - Obtener seguimiento específico
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string; seguimientoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.VIEW)

    const seguimiento = await prismaClient.seguimiento.findFirst({
      where: {
        id: params.seguimientoId,
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
      }
    })

    if (!seguimiento) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(seguimiento)
  } catch (error) {
    console.error('Error al obtener seguimiento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/leads/[leadId]/seguimiento/[seguimientoId] - Actualizar seguimiento
export async function PUT(
  request: NextRequest,
  { params }: { params: { leadId: string; seguimientoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.EDIT)

    const body = await request.json()
    const { tipo, descripcion, duracion, resultado, proximoSeguimiento } = body

    // Validaciones básicas
    if (!tipo || !descripcion) {
      return NextResponse.json(
        { error: 'Tipo y descripción son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el seguimiento existe y pertenece al lead
    const seguimientoExistente = await prismaClient.seguimiento.findFirst({
      where: {
        id: params.seguimientoId,
        leadId: params.leadId
      }
    })

    if (!seguimientoExistente) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      )
    }

    const seguimiento = await prismaClient.seguimiento.update({
      where: { id: params.seguimientoId },
      data: {
        tipo,
        descripcion,
        duracion: duracion ? parseInt(duracion) : null,
        resultado: resultado || null,
        proximoSeguimiento: proximoSeguimiento ? new Date(proximoSeguimiento) : null,
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

    return NextResponse.json(seguimiento)
  } catch (error) {
    console.error('Error al actualizar seguimiento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/leads/[leadId]/seguimiento/[seguimientoId] - Eliminar seguimiento
export async function DELETE(
  request: NextRequest,
  { params }: { params: { leadId: string; seguimientoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.SEGUIMIENTOS.DELETE)

    // Verificar que el seguimiento existe y pertenece al lead
    const seguimiento = await prismaClient.seguimiento.findFirst({
      where: {
        id: params.seguimientoId,
        leadId: params.leadId
      }
    })

    if (!seguimiento) {
      return NextResponse.json(
        { error: 'Seguimiento no encontrado' },
        { status: 404 }
      )
    }

    await prismaClient.seguimiento.delete({
      where: { id: params.seguimientoId }
    })

    return NextResponse.json({ message: 'Seguimiento eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar seguimiento:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}