import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { EstadoAsesoria, TipoAsesoria, ModalidadAsesoria } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const asesoria = await prisma.asesoria.findUnique({
      where: { id: params.id },
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        conciliaciones: {
          select: {
            id: true,
            fechaAudiencia: true,
            fechaSolicitud: true,
            estado: true
          },
          orderBy: {
            fechaSolicitud: 'desc'
          }
        },

      }
    })

    if (!asesoria) {
      return NextResponse.json(
        { error: 'Asesoría no encontrada' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(asesoria)

  } catch (error) {
    console.error('Error al obtener asesoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      estado,
      tipo,
      fecha,
      duracion,  
      modalidad,
      tema,
      descripcion,
      valor,
      asesorId,
      notas
    } = body

    // Verificar que la asesoría existe
    const existingAsesoria = await prisma.asesoria.findUnique({
      where: { id: params.id }
    })

    if (!existingAsesoria) {
      return NextResponse.json(
        { error: 'Asesoría no encontrada' }, 
        { status: 404 }
      )
    }

    // Construir datos de actualización
    const updateData: any = {}

    if (estado !== undefined) updateData.estado = estado as EstadoAsesoria
    if (tipo !== undefined) updateData.tipo = tipo as TipoAsesoria
    if (fecha !== undefined) updateData.fecha = new Date(fecha)
    if (duracion !== undefined) updateData.duracion = parseInt(duracion)
    if (modalidad !== undefined) updateData.modalidad = modalidad as ModalidadAsesoria
    if (tema !== undefined) updateData.tema = tema
    if (descripcion !== undefined) updateData.descripcion = descripcion
    if (valor !== undefined) updateData.valor = valor ? parseFloat(valor) : null
    if (asesorId !== undefined) updateData.asesorId = asesorId
    if (notas !== undefined) updateData.notas = notas

    const updatedAsesoria = await prisma.asesoria.update({
      where: { id: params.id },
      data: updateData,
      include: {
        lead: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            estado: true
          }
        },
        asesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        conciliaciones: {
          select: {
            id: true,
            fechaAudiencia: true,
            fechaSolicitud: true,
            estado: true
          }
        }
      }
    })

    return NextResponse.json(updatedAsesoria)

  } catch (error) {
    console.error('Error al actualizar asesoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que la asesoría existe
    const existingAsesoria = await prisma.asesoria.findUnique({
      where: { id: params.id },
      include: {
        conciliaciones: true
      }
    })

    if (!existingAsesoria) {
      return NextResponse.json(
        { error: 'Asesoría no encontrada' }, 
        { status: 404 }
      )
    }

    // Verificar si tiene elementos relacionados
    if (existingAsesoria.conciliaciones.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una asesoría que tiene conciliaciones asociadas' },
        { status: 400 }
      )
    }

    await prisma.asesoria.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Asesoría eliminada exitosamente' })

  } catch (error) {
    console.error('Error al eliminar asesoría:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}