import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim()

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: {
          leads: [],
          clientes: [],
          casos: [],
          facturas: [],
          conciliaciones: []
        }
      })
    }

    const searchTerm = `%${query}%`
    const limit = 5 // Límite por categoría

    // Búsqueda en paralelo
    const [leads, clientes, casos, facturas, conciliaciones] = await Promise.all([
      // Buscar Leads
      prisma.lead.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { telefono: { contains: query, mode: 'insensitive' } },
            { empresa: { contains: query, mode: 'insensitive' } },
            { documento: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          nombre: true,
          email: true,
          telefono: true,
          empresa: true,
          estado: true,
          createdAt: true,
          _count: {
            select: {
              asesorias: true,
              seguimientos: true
            }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),

      // Buscar Clientes  
      prisma.cliente.findMany({
        where: {
          OR: [
            { nombre: { contains: query, mode: 'insensitive' } },
            { apellido: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { documento: { contains: query, mode: 'insensitive' } },
            { empresa: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          email: true,
          documento: true,
          empresa: true,
          activo: true,
          _count: {
            select: {
              casos: true
            }
          }
        },
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),

      // Buscar Casos
      prisma.caso.findMany({
        where: {
          OR: [
            { numeroCaso: { contains: query, mode: 'insensitive' } },
            { 
              cliente: {
                OR: [
                  { nombre: { contains: query, mode: 'insensitive' } },
                  { apellido: { contains: query, mode: 'insensitive' } },
                  { documento: { contains: query, mode: 'insensitive' } }
                ]
              }
            }
          ]
        },
        select: {
          id: true,
          numeroCaso: true,
          tipoInsolvencia: true,
          estado: true,
          valorDeuda: true,
          fechaInicio: true,
          cliente: {
            select: {
              nombre: true,
              apellido: true,
              documento: true
            }
          }
        },
        take: limit,
        orderBy: { fechaInicio: 'desc' }
      }),

      // Buscar Facturas
      prisma.factura.findMany({
        where: {
          OR: [
            { numero: { contains: query, mode: 'insensitive' } },
            {
              honorario: {
                caso: {
                  cliente: {
                    OR: [
                      { nombre: { contains: query, mode: 'insensitive' } },
                      { apellido: { contains: query, mode: 'insensitive' } },
                      { documento: { contains: query, mode: 'insensitive' } }
                    ]
                  }
                }
              }
            }
          ]
        },
        select: {
          id: true,
          numero: true,
          total: true,
          estado: true,
          fecha: true,
          modalidadPago: true,
          honorario: {
            select: {
              caso: {
                select: {
                  numeroCaso: true,
                  cliente: {
                    select: {
                      nombre: true,
                      apellido: true
                    }
                  }
                }
              }
            }
          }
        },
        take: limit,
        orderBy: { fecha: 'desc' }
      }),

      // Buscar Conciliaciones
      prisma.conciliacion.findMany({
        where: {
          OR: [
            { numero: { contains: query, mode: 'insensitive' } },
            { demandante: { contains: query, mode: 'insensitive' } },
            { demandado: { contains: query, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          numero: true,
          demandante: true,
          demandado: true,
          estado: true,
          valor: true,
          fechaSolicitud: true
        },
        take: limit,
        orderBy: { fechaSolicitud: 'desc' }
      })
    ])

    // Formatear resultados
    const results = {
      leads: leads.map(lead => ({
        id: lead.id,
        tipo: 'lead',
        titulo: lead.nombre,
        subtitulo: lead.empresa || lead.email,
        estado: lead.estado,
        detalles: `${lead._count.asesorias} asesorías • ${lead._count.seguimientos} seguimientos`,
        url: `/leads/${lead.id}`
      })),

      clientes: clientes.map(cliente => ({
        id: cliente.id,
        tipo: 'cliente',
        titulo: `${cliente.nombre} ${cliente.apellido || ''}`.trim(),
        subtitulo: cliente.documento,
        estado: cliente.activo ? 'ACTIVO' : 'INACTIVO',
        detalles: `${cliente._count.casos} casos • ${cliente.empresa || 'Sin empresa'}`,
        url: `/casos?cliente=${cliente.id}`
      })),

      casos: casos.map(caso => ({
        id: caso.id,
        tipo: 'caso',
        titulo: caso.numeroCaso,
        subtitulo: `${caso.cliente.nombre} ${caso.cliente.apellido || ''}`.trim(),
        estado: caso.estado,
        detalles: `${caso.tipoInsolvencia} • $${Number(caso.valorDeuda).toLocaleString()}`,
        url: `/casos/${caso.id}`
      })),

      facturas: facturas.map(factura => ({
        id: factura.id,
        tipo: 'factura',
        titulo: factura.numero,
        subtitulo: `${factura.honorario.caso.cliente.nombre} ${factura.honorario.caso.cliente.apellido || ''}`.trim(),
        estado: factura.estado,
        detalles: `$${Number(factura.total).toLocaleString()} • ${factura.modalidadPago}`,
        url: `/facturacion/${factura.id}`
      })),

      conciliaciones: conciliaciones.map(conciliacion => ({
        id: conciliacion.id,
        tipo: 'conciliacion',
        titulo: conciliacion.numero,
        subtitulo: `${conciliacion.demandante} vs ${conciliacion.demandado}`,
        estado: conciliacion.estado,
        detalles: `$${Number(conciliacion.valor).toLocaleString()}`,
        url: `/conciliaciones/${conciliacion.id}`
      }))
    }

    // Contar total de resultados
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0)

    return NextResponse.json({
      results,
      totalResults,
      query
    })

  } catch (error) {
    console.error('Error en búsqueda global:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}