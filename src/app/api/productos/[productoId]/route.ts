import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: { productoId: string } }) {
  try {
    await requirePermission(PERMISSIONS.FACTURACION.EDIT)
    const body = await request.json()
    const data: Record<string, any> = {}

    if (body.nombre !== undefined) {
      if (!String(body.nombre).trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
      data.nombre = String(body.nombre).trim()
    }
    if (body.tipo !== undefined) data.tipo = body.tipo === 'PRODUCTO' ? 'PRODUCTO' : 'SERVICIO'
    if (body.descripcion !== undefined) data.descripcion = body.descripcion?.trim() || null
    if (body.precio !== undefined) {
      const valor = Number(body.precio)
      if (!Number.isFinite(valor) || valor < 0) return NextResponse.json({ error: 'El precio no es válido' }, { status: 400 })
      data.precio = valor
    }
    if (body.activo !== undefined) data.activo = Boolean(body.activo)

    const producto = await prisma.producto.update({ where: { id: params.productoId }, data })
    return NextResponse.json(producto)
  } catch (error: any) {
    const status = error.code === 'P2025' ? 404 : 400
    return NextResponse.json({ error: status === 404 ? 'Producto no encontrado' : error.message }, { status })
  }
}
