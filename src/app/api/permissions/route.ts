import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.USUARIOS.VIEW)

    const permissions = await prisma.permission.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        modulo: true,
        _count: {
          select: {
            roles: true
          }
        }
      },
      orderBy: [
        { modulo: 'asc' },
        { nombre: 'asc' }
      ]
    })

    return NextResponse.json(permissions)
  } catch (error: any) {
    console.error('Error al obtener permisos:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.USUARIOS.CREATE)

    const body = await request.json()
    const { nombre, descripcion, modulo } = body

    // Validaciones básicas
    if (!nombre || !modulo) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (nombre, módulo)' },
        { status: 400 }
      )
    }

    // Verificar que el nombre no existe
    const existingPermission = await prisma.permission.findUnique({
      where: { nombre }
    })

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Ya existe un permiso con este nombre' },
        { status: 400 }
      )
    }

    // Crear permiso
    const permission = await prisma.permission.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        modulo
      },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        modulo: true,
        createdAt: true
      }
    })

    return NextResponse.json(permission)

  } catch (error: any) {
    console.error('Error al crear permiso:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}