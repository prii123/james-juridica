import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const asesores = await prisma.user.findMany({
      where: { 
        activo: true,
        role: {
          nombre: 'ASESOR'
        }
      },
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
      },
      orderBy: [
        { nombre: 'asc' },
        { apellido: 'asc' }
      ]
    })

    return NextResponse.json({ asesores, total: asesores.length })
  } catch (error) {
    console.error('Error al obtener asesores:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    )
  }
}