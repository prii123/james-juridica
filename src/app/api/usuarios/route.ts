import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { UsuariosService } from '@/modules/usuarios/services'

const usuariosService = new UsuariosService()

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

    // Construir filtros
    const filters: any = {}
    if (role) filters.role = role
    if (roleId) filters.roleId = roleId

    const usuarios = await usuariosService.getAllUsuarios(filters)

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

    const usuario = await usuariosService.createUsuario(body)

    return NextResponse.json(usuario)

  } catch (error: any) {
    console.error('Error al crear usuario:', error)

    // Manejo de errores específicos de validación
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}