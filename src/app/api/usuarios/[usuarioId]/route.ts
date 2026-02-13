import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { usuarioId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.USUARIOS.VIEW)

    const usuario = await prisma.user.findUnique({
      where: { id: params.usuarioId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        documento: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' }, 
        { status: 404 }
      )
    }

    return NextResponse.json(usuario)

  } catch (error: any) {
    console.error('Error al obtener usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { usuarioId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.USUARIOS.EDIT)

    const body = await request.json()
    const {
      nombre,
      apellido,
      email,
      telefono,
      documento,
      roleId,
      activo,
      password
    } = body

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.usuarioId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' }, 
        { status: 404 }
      )
    }

    // Verificar email único (si se está cambiando)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
    }

    // Verificar documento único (si se está cambiando)
    if (documento && documento !== existingUser.documento) {
      const documentExists = await prisma.user.findUnique({
        where: { documento }
      })

      if (documentExists) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este documento' },
          { status: 400 }
        )
      }
    }

    // Construir datos de actualización
    const updateData: any = {}

    if (nombre !== undefined) updateData.nombre = nombre
    if (apellido !== undefined) updateData.apellido = apellido
    if (email !== undefined) updateData.email = email
    if (telefono !== undefined) updateData.telefono = telefono || null
    if (documento !== undefined) updateData.documento = documento || null
    if (roleId !== undefined) updateData.roleId = roleId
    if (activo !== undefined) updateData.activo = activo

    // Hash de nueva contraseña si se proporciona
    if (password) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.usuarioId },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        documento: true,
        activo: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        }
      }
    })

    return NextResponse.json(updatedUser)

  } catch (error: any) {
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { usuarioId: string } }
) {
  try {
    await requirePermission(PERMISSIONS.USUARIOS.DELETE)

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { id: params.usuarioId },
      include: {
        leads: true,
        asesorias: true,
        casosAsignados: true,
        casosCreados: true
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' }, 
        { status: 404 }
      )
    }

    // Verificar si tiene datos asociados
    const hasRelatedData = 
      existingUser.leads.length > 0 ||
      existingUser.asesorias.length > 0 ||
      existingUser.casosAsignados.length > 0 ||
      existingUser.casosCreados.length > 0

    if (hasRelatedData) {
      // En lugar de eliminar, desactivar el usuario
      const deactivatedUser = await prisma.user.update({
        where: { id: params.usuarioId },
        data: { activo: false }
      })

      return NextResponse.json({ 
        message: 'Usuario desactivado debido a datos asociados',
        user: deactivatedUser
      })
    }

    // Si no tiene datos asociados, eliminar completamente
    await prisma.user.delete({
      where: { id: params.usuarioId }
    })

    return NextResponse.json({ message: 'Usuario eliminado exitosamente' })

  } catch (error: any) {
    console.error('Error al eliminar usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}