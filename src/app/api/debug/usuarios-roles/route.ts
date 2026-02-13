import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Obtener todos los roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    })

    // Obtener todos los usuarios activos con sus roles
    const usuarios = await prisma.user.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        role: {
          select: {
            nombre: true
          }
        }
      }
    })

    return NextResponse.json({ 
      roles, 
      usuarios,
      estadisticas: {
        totalRoles: roles.length,
        totalUsuarios: usuarios.length,
        usuariosPorRol: usuarios.reduce((acc: any, user) => {
          const roleName = user.role?.nombre || 'SIN_ROL'
          acc[roleName] = (acc[roleName] || 0) + 1
          return acc
        }, {})
      }
    })
  } catch (error) {
    console.error('Error al obtener datos de debug:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    )
  }
}