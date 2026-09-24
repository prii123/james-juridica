import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ClientesService } from '@/modules/clientes/services'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = searchParams.get('page')

    // Con "page" en la URL se usa el listado paginado del directorio de clientes (/clientes).
    // Sin "page", se mantiene el buscador liviano que ya usan otros formularios (radicaciones,
    // facturación, casos) para elegir un cliente mientras se escribe: cualquier usuario con
    // sesión puede usarlo, igual que antes de este cambio.
    if (page) {
      const clientesService = new ClientesService()
      const estado = searchParams.get('estado') as 'activos' | 'inactivos' | 'todos' | null
      const result = await clientesService.listar(
        { search: search || undefined, estado: estado || undefined },
        parseInt(page) || 1,
        parseInt(searchParams.get('limit') || '20') || 20
      )
      return NextResponse.json(result)
    }

    const clientes = await prisma.cliente.findMany({
      where: search ? {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { documento: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {},
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        documento: true
      },
      take: 20,
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({ clientes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, apellido, email, telefono, documento } = body

    if (!nombre || !email || !telefono || !documento) {
      return NextResponse.json({ error: 'Nombre, email, teléfono y documento son requeridos' }, { status: 400 })
    }

    const cliente = await prisma.cliente.upsert({
      where: { documento },
      update: { nombre, apellido, email, telefono },
      create: { nombre, apellido, email, telefono, documento },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
