import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

// GET /api/facturacion/honorarios-disponibles - Obtener honorarios sin facturas asociadas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.VIEW)

    // Obtener honorarios pendientes que no tengan facturas asociadas
    const honorarios = await prisma.honorario.findMany({
      where: {
        estado: 'PENDIENTE',
        facturas: {
          none: {} // No tiene facturas asociadas
        }
      },
      include: {
        caso: {
          include: {
            cliente: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ honorarios })

  } catch (error: any) {
    console.error('Error al obtener honorarios disponibles:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}