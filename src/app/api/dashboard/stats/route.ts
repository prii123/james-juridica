import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission, PERMISSIONS } from '@/lib/permissions'

export async function GET() {
  try {
    await requirePermission(PERMISSIONS.DASHBOARD.VIEW)
    
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Domingo de esta semana
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const [
      // Leads stats
      totalLeadsNuevos,
      leadsThisWeek,
      leadsLastWeek,
      
      // Casos stats  
      casosActivos,
      casosThisMonth,
      casosLastMonth,

      // Audiencias stats
      audienciasProximas,
      audienciasHoy,

      // Cartera stats
      facturasPendientes,
      totalPorCobrar,
      totalVencido
    ] = await Promise.all([
      // Leads nuevos
      prisma.lead.count({ 
        where: { estado: 'NUEVO' } 
      }),
      prisma.lead.count({ 
        where: { 
          estado: 'NUEVO', 
          createdAt: { gte: startOfWeek } 
        } 
      }),
      prisma.lead.count({ 
        where: { 
          estado: 'NUEVO',
          createdAt: { 
            gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: startOfWeek
          } 
        } 
      }),

      // Casos activos
      prisma.caso.count({ 
        where: { 
          estado: { in: ['ACTIVO', 'SUSPENDIDO'] } 
        } 
      }),
      prisma.caso.count({ 
        where: { 
          estado: { in: ['ACTIVO', 'SUSPENDIDO'] },
          createdAt: { gte: startOfMonth } 
        } 
      }),
      prisma.caso.count({ 
        where: { 
          estado: { in: ['ACTIVO', 'SUSPENDIDO'] },
          createdAt: { 
            gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            lt: startOfMonth 
          } 
        } 
      }),

      // Audiencias próximas
      prisma.audiencia.count({ 
        where: { 
          fechaHora: { 
            gte: now,
            lte: endOfWeek 
          },
          estado: { in: ['PROGRAMADA', 'APLAZADA'] }
        } 
      }),
      prisma.audiencia.count({ 
        where: { 
          fechaHora: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          },
          estado: { in: ['PROGRAMADA', 'APLAZADA'] }
        } 
      }),

      // Cartera - facturas pendientes de pago
      prisma.factura.count({ 
        where: { 
          estado: { in: ['GENERADA', 'ENVIADA', 'VENCIDA'] } 
        } 
      }),
      prisma.factura.aggregate({ 
        where: { 
          estado: { in: ['GENERADA', 'ENVIADA', 'VENCIDA'] } 
        },
        _sum: { total: true }
      }).then(result => result._sum.total || 0),
      prisma.factura.aggregate({ 
        where: { 
          estado: 'VENCIDA'
        },
        _sum: { total: true }
      }).then(result => result._sum.total || 0)
    ])

    // Calcular porcentajes de cambio
    const leadsGrowth = leadsLastWeek > 0 
      ? ((leadsThisWeek - leadsLastWeek) / leadsLastWeek * 100) 
      : leadsThisWeek > 0 ? 100 : 0

    const casosGrowth = casosLastMonth > 0 
      ? ((casosThisMonth - casosLastMonth) / casosLastMonth * 100) 
      : casosThisMonth > 0 ? 100 : 0

    return NextResponse.json({
      leads: {
        total: totalLeadsNuevos,
        thisWeek: leadsThisWeek,
        growth: Math.round(leadsGrowth * 10) / 10, // Redondear a 1 decimal
        growthDirection: leadsGrowth >= 0 ? 'up' : 'down'
      },
      casos: {
        activos: casosActivos,
        thisMonth: casosThisMonth,
        growth: Math.round(casosGrowth * 10) / 10,
        growthDirection: casosGrowth >= 0 ? 'up' : 'down'
      },
      audiencias: {
        proximas: audienciasProximas,
        hoy: audienciasHoy,
        thisWeekLabel: 'Esta semana'
      },
      cartera: {
        totalPendiente: Number(totalPorCobrar), // Convertir Decimal a number
        totalVencido: Number(totalVencido), // Convertir Decimal a number
        facturasPendientes: facturasPendientes,
        growth: -12, // Mock value, podría calcularse comparando con mes anterior
        growthDirection: 'down'
      },
      timestamp: now.toISOString()
    })

  } catch (error: any) {
    console.error('Error al obtener estadísticas del dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}