import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

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
