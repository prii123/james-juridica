import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'
import { prisma } from '@/lib/db'

// GET /api/facturacion - Obtener todas las facturas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.VIEW)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const estado = searchParams.get('estado') || ''

    // Construir filtros
    let whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { honorario: { caso: { numeroCaso: { contains: search, mode: 'insensitive' } } } },
        { honorario: { caso: { cliente: { nombre: { contains: search, mode: 'insensitive' } } } } },
        { honorario: { caso: { cliente: { apellido: { contains: search, mode: 'insensitive' } } } } }
      ]
    }

    if (estado) {
      whereClause.estado = estado
    }

    const facturas = await prisma.factura.findMany({
      where: whereClause,
      include: {
        honorario: {
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
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ facturas })
  } catch (error: any) {
    console.error('Error al obtener facturas:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/facturacion - Crear nueva factura
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await requirePermission(PERMISSIONS.FACTURACION.CREATE)

    const body = await request.json()
    const { honorarioId, fechaVencimiento, observaciones, items } = body

    // Validar datos requeridos
    if (!honorarioId || !fechaVencimiento || !items || items.length === 0) {
      return NextResponse.json({ 
        error: 'Datos incompletos' 
      }, { status: 400 })
    }

    // Verificar que el honorario existe y está pendiente
    const honorario = await prisma.honorario.findUnique({
      where: { id: honorarioId },
      include: {
        caso: {
          include: {
            cliente: true
          }
        },
        facturas: true
      }
    })

    if (!honorario) {
      return NextResponse.json({ 
        error: 'Honorario no encontrado' 
      }, { status: 404 })
    }

    if (honorario.facturas && honorario.facturas.length > 0) {
      return NextResponse.json({ 
        error: 'Este honorario ya tiene facturas asociadas' 
      }, { status: 400 })
    }

    // Generar número de factura único
    const year = new Date().getFullYear()
    const count = await prisma.factura.count({
      where: {
        numero: {
          startsWith: `FACT-${year}-`
        }
      }
    })
    const numeroFactura = `FACT-${year}-${(count + 1).toString().padStart(4, '0')}`

    // Calcular totales
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.cantidad * item.valorUnitario), 0
    )
    const impuestos = subtotal * 0.19 // IVA 19%
    const total = subtotal + impuestos

    // Crear la factura
    const factura = await prisma.factura.create({
      data: {
        numero: numeroFactura,
        fecha: new Date(),
        fechaVencimiento: new Date(fechaVencimiento),
        subtotal: subtotal,
        impuestos: impuestos,
        total: total,
        estado: 'GENERADA',
        observaciones: observaciones || '',
        honorarioId: honorarioId,
        creadoPorId: session.user.id,
        items: {
          create: items.map((item: any) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            valorUnitario: item.valorUnitario,
            valorTotal: item.cantidad * item.valorUnitario
          }))
        }
      },
      include: {
        items: true,
        honorario: {
          include: {
            caso: {
              include: {
                cliente: true
              }
            }
          }
        },
        creadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })

    return NextResponse.json({ factura }, { status: 201 })

  } catch (error: any) {
    console.error('Error al crear factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}