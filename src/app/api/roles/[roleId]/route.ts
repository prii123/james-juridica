import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const roleUpdateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).optional()
})

// GET - Obtener rol por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { roleId } = params

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                modulo: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    // Transformar respuesta
    const transformedRole = {
      ...role,
      permissions: role.permissions.map(rp => rp.permission),
      _count: {
        usuarios: role._count.users
      }
    }

    return NextResponse.json(transformedRole)
  } catch (error) {
    console.error('Error al obtener rol:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT - Actualizar rol
export async function PUT(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { roleId } = params
    const body = await request.json()

    // Validar datos
    const result = roleUpdateSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.errors.reduce((acc, error) => {
        acc[error.path[0]] = error.message
        return acc
      }, {} as Record<string, string>)
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { nombre, descripcion, permissionIds } = result.data

    // Verificar que el rol existe
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId }
    })

    if (!existingRole) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    // Verificar que el nombre no esté en uso por otro rol (si se cambió)
    if (nombre !== existingRole.nombre) {
      const nameExists = await prisma.role.findFirst({
        where: { 
          nombre,
          id: { not: roleId }
        }
      })

      if (nameExists) {
        return NextResponse.json({ 
          errors: { nombre: 'Ya existe un rol con este nombre' } 
        }, { status: 400 })
      }
    }

    // Verificar que los permisos existen si se proporcionaron
    if (permissionIds && permissionIds.length > 0) {
      const existingPermissions = await prisma.permission.findMany({
        where: { id: { in: permissionIds } }
      })

      if (existingPermissions.length !== permissionIds.length) {
        return NextResponse.json({ 
          error: 'Algunos permisos no existen' 
        }, { status: 400 })
      }
    }

    // Actualizar el rol
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        nombre,
        descripcion,
        ...(permissionIds !== undefined && {
          permissions: {
            deleteMany: {},  // Primero elimina las relaciones existentes
            create: permissionIds.map(id => ({ permissionId: id }))
          }
        })
      },
      include: {
        permissions: {
          select: {
            permission: {
              select: {
                id: true,
                nombre: true,
                descripcion: true,
                modulo: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    // Transformar respuesta
    const transformedRole = {
      ...updatedRole,
      permissions: updatedRole.permissions.map(rp => rp.permission),
      _count: {
        usuarios: updatedRole._count.users
      }
    }

    return NextResponse.json(transformedRole)
  } catch (error) {
    console.error('Error al actualizar rol:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE - Eliminar rol
export async function DELETE(
  request: NextRequest,
  { params }: { params: { roleId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { roleId } = params

    // Verificar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: true
      }
    })

    if (!role) {
      return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })
    }

    // Verificar que no sea un rol del sistema
    const systemRoles = ['ADMIN', 'ASESOR', 'ABOGADO', 'ASISTENTE']
    if (systemRoles.includes(role.nombre)) {
      return NextResponse.json({ 
        error: 'No se pueden eliminar los roles del sistema' 
      }, { status: 400 })
    }

    // Si hay usuarios asignados, no permitir eliminar el rol
    if (role.users.length > 0) {
      return NextResponse.json({ 
        error: `No se puede eliminar el rol porque tiene ${role.users.length} usuario(s) asignado(s). Reasigne los usuarios a otro rol antes de eliminar este rol.` 
      }, { status: 400 })
    }

    // Eliminar el rol
    await prisma.role.delete({
      where: { id: roleId }
    })

    return NextResponse.json({ 
      message: 'Rol eliminado correctamente'
    })
  } catch (error) {
    console.error('Error al eliminar rol:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}