import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

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
