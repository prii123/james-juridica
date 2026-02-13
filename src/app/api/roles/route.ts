import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const roleCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().nullable().optional(),
  permissionIds: z.array(z.string()).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includePermissions = searchParams.get('includePermissions') === 'true'

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        createdAt: true,
        _count: {
          select: {
            users: true
          }
        },
        ...(includePermissions && {
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
          }
        })
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    // Transformar datos para incluir permissions directamente si se solicita  
    const transformedRoles = includePermissions 
      ? roles.map(role => {
          const rolePermissions = role.permissions as any[]
          return {
            ...role,
            permissions: rolePermissions?.map((rp: any) => rp.permission) || []
          }
        })
      : roles

    return NextResponse.json(transformedRoles)
  } catch (error: any) {
    console.error('Error al obtener roles:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar datos
    const result = roleCreateSchema.safeParse(body)
    if (!result.success) {
      const errors = result.error.errors.reduce((acc, error) => {
        acc[error.path[0]] = error.message
        return acc
      }, {} as Record<string, string>)
      return NextResponse.json({ errors }, { status: 400 })
    }

    const { nombre, descripcion, permissionIds } = result.data

    // Verificar que el nombre no existe
    const existingRole = await prisma.role.findUnique({
      where: { nombre }
    })

    if (existingRole) {
      return NextResponse.json({ 
        errors: { nombre: 'Ya existe un rol con este nombre' } 
      }, { status: 400 })
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

    // Crear rol con permisos
    const role = await prisma.role.create({
      data: {
        nombre,
        descripcion,
        ...(permissionIds && permissionIds.length > 0 && {
          permissions: {
            create: permissionIds.map((permissionId: string) => ({
              permissionId
            }))
          }
        })
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        createdAt: true,
        _count: {
          select: {
            users: true
          }
        },
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
        }
      }
    })

    // Transformar respuesta
    const transformedRole = {
      ...role,
      permissions: role.permissions.map(rp => rp.permission)
    }

    return NextResponse.json(transformedRole)
  } catch (error: any) {
    console.error('Error al crear rol:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}