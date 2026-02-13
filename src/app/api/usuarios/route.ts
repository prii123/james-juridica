import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    // Solo requerir permisos si no es una consulta específica de roles
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const roleId = searchParams.get('roleId')

    // Si no es una consulta específica de rol, requerir permisos
    if (!role && !roleId) {
      await requirePermission(PERMISSIONS.USUARIOS.VIEW)
    }

    let whereClause: any = { activo: true }

    // Filtro por rol usando el nombre del rol
    if (role === 'ASESOR') {
      whereClause.role = {
        nombre: 'ASESOR'
      }
    }

    // Filtro por roleId
    if (roleId) {
      whereClause.roleId = roleId
    }

    const usuarios = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        activo: true,
        role: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' }
      ]
    })

    return NextResponse.json({ usuarios })
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error)
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
    const { 
      nombre, 
      apellido, 
      email, 
      password, 
      telefono, 
      documento, 
      roleId, 
      activo 
    } = body

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !roleId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      )
    }

    // Verificar que el email no existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Verificar que el documento no existe (si se proporciona)
    if (documento) {
      const existingDocument = await prisma.user.findUnique({
        where: { documento }
      })

      if (existingDocument) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este documento' },
          { status: 400 }
        )
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario
    const usuario = await prisma.user.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        telefono: telefono || null,
        documento: documento || null,
        roleId,
        activo: activo ?? true
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        documento: true,
        activo: true,
        role: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        createdAt: true
      }
    })

    return NextResponse.json(usuario)

  } catch (error: any) {
    console.error('Error al crear usuario:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}