import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// Listado para el catálogo (/facturacion/productos) y para el selector de la factura.
// Por defecto solo activos; ?estado=todos incluye los inactivos.
export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.FACTURACION.VIEW)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado')
    const tipo = searchParams.get('tipo')

    const productos = await prisma.producto.findMany({
      where: {
        ...(estado === 'todos' ? {} : { activo: true }),
        ...(tipo === 'PRODUCTO' || tipo === 'SERVICIO' ? { tipo } : {}),
        ...(search ? { nombre: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json({ productos })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.FACTURACION.CREATE)
    const { nombre, tipo, descripcion, precio } = await request.json()

    if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    const valor = Number(precio)
    if (!Number.isFinite(valor) || valor < 0) {
      return NextResponse.json({ error: 'El precio no es válido' }, { status: 400 })
    }

    const producto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(),
        tipo: tipo === 'PRODUCTO' ? 'PRODUCTO' : 'SERVICIO',
        descripcion: descripcion?.trim() || null,
        precio: valor,
      },
    })
    return NextResponse.json(producto, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
