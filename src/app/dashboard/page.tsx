import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import CasosRecientes from '@/components/CasosRecientes'
import TimelineLiquidacion from '@/components/TimelineLiquidacion'
import { Card, CardBody } from '@/components/ui'
import {
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  Briefcase,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from 'lucide-react'

// Función para obtener estadísticas directamente desde la base de datos
async function getDashboardStats() {
  type GrowthDirection = 'up' | 'down'
  
  try {
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

    const leadsGrowthDirection: GrowthDirection = leadsGrowth >= 0 ? 'up' : 'down'
    const casosGrowthDirection: GrowthDirection = casosGrowth >= 0 ? 'up' : 'down'
    const carteraGrowthDirection: GrowthDirection = 'down'

    return {
      leads: {
        total: totalLeadsNuevos,
        thisWeek: leadsThisWeek,
        growth: Math.round(leadsGrowth * 10) / 10,
        growthDirection: leadsGrowthDirection
      },
      casos: {
        activos: casosActivos,
        thisMonth: casosThisMonth,
        growth: Math.round(casosGrowth * 10) / 10,
        growthDirection: casosGrowthDirection
      },
      audiencias: {
        proximas: audienciasProximas,
        hoy: audienciasHoy,
        thisWeekLabel: 'Esta semana'
      },
      cartera: {
        totalPendiente: Number(totalPorCobrar),
        totalVencido: Number(totalVencido),
        facturasPendientes: facturasPendientes,
        growth: -12,
        growthDirection: carteraGrowthDirection
      }
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    // Retornar valores por defecto en caso de error
    return {
      leads: { total: 0, thisWeek: 0, growth: 0, growthDirection: 'up' as GrowthDirection },
      casos: { activos: 0, thisMonth: 0, growth: 0, growthDirection: 'up' as GrowthDirection },
      audiencias: { proximas: 0, hoy: 0, thisWeekLabel: 'Esta semana' },
      cartera: { totalPendiente: 0, totalVencido: 0, facturasPendientes: 0, growth: 0, growthDirection: 'down' as GrowthDirection }
    }
  }
}

// Función para obtener casos recientes
async function getRecentCases() {
  try {
    const casos = await prisma.caso.findMany({
      where: {
        estado: { in: ['ACTIVO', 'SUSPENDIDO'] }
      },
      select: {
        id: true,
        numeroCaso: true,
        tipoInsolvencia: true,
        estado: true,
        updatedAt: true,
        cliente: {
          select: {
            nombre: true,
            apellido: true,
            empresa: true,
            tipoPersona: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
    
    // Serializar los datos para el componente cliente
    return casos.map(caso => ({
      id: caso.id,
      numeroCaso: caso.numeroCaso,
      tipoInsolvencia: caso.tipoInsolvencia as string, // Convertir enum a string
      // valorDeuda: caso.valorDeuda.toString(), // Convertir Decimal a string
      estado: caso.estado as string, // Convertir enum a string
      updatedAt: caso.updatedAt.toISOString(), // Convertir Date a string
      cliente: caso.cliente ? {
        nombre: caso.cliente.nombre,
        apellido: caso.cliente.apellido,
        empresa: caso.cliente.empresa,
        tipoPersona: caso.cliente.tipoPersona as string // Convertir enum a string
      } : null
    }))
  } catch (error) {
    console.error('Error al obtener casos recientes:', error)
    return []
  }
}

export default async function DashboardPage() {
  // Obtener estadísticas del dashboard y casos recientes
  const [stats, casosRecientes] = await Promise.all([
    getDashboardStats(),
    getRecentCases()
  ])

  // Helper para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <>
      <div className="page-header-spacing">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Resumen ejecutivo de tu firma jurídica</p>
      </div>

      {/* Métricas Principales */}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Casos Activos */}
        <Card className="h-full border-l-4 border-l-blue-800">
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-blue-50 p-2">
                <Briefcase className="text-blue-800" />
              </div>
              <div className={`flex items-center text-sm font-medium ${stats.casos.growthDirection === 'up' ? 'text-teal-700' : 'text-red-600'}`}>
                {stats.casos.growthDirection === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                {stats.casos.growthDirection === 'up' ? '+' : ''}{stats.casos.growth}%
              </div>
            </div>
            <h6 className="mb-1 text-xs font-semibold uppercase text-slate-500">Casos Activos</h6>
            <h2 className="mb-1 text-3xl font-bold text-blue-800">{stats.casos.activos}</h2>
            <p className="text-sm text-slate-500">+{stats.casos.thisMonth} este mes</p>
          </CardBody>
        </Card>

        {/* Leads Nuevos */}
        <Card className="h-full border-l-4 border-l-teal-700">
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-teal-50 p-2">
                <Users className="text-teal-700" />
              </div>
              <div className={`flex items-center text-sm font-medium ${stats.leads.growthDirection === 'up' ? 'text-teal-700' : 'text-red-600'}`}>
                {stats.leads.growthDirection === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                {stats.leads.growthDirection === 'up' ? '+' : ''}{stats.leads.growth}%
              </div>
            </div>
            <h6 className="mb-1 text-xs font-semibold uppercase text-slate-500">Leads Nuevos</h6>
            <h2 className="mb-1 text-3xl font-bold text-teal-700">{stats.leads.total}</h2>
            <p className="text-sm text-slate-500">+{stats.leads.thisWeek} esta semana</p>
          </CardBody>
        </Card>

        {/* Audiencias Próximas */}
        <Card className="h-full border-l-4 border-l-sky-700">
          <CardBody>
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-lg bg-sky-50 p-2">
                <Calendar className="text-sky-700" />
              </div>
              <div className="flex items-center text-sm font-medium text-slate-500">
                <Clock size={16} className="mr-1" />
                {stats.audiencias.thisWeekLabel}
              </div>
            </div>
            <h6 className="mb-1 text-xs font-semibold uppercase text-slate-500">Audiencias Próximas</h6>
            <h2 className="mb-1 text-3xl font-bold text-sky-700">{stats.audiencias.proximas}</h2>
            <p className="text-sm text-slate-500">{stats.audiencias.hoy} programadas hoy</p>
          </CardBody>
        </Card>
      </div>

      {/* Secciones Principales */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Casos Recientes */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3">
            <div className="flex items-center">
              <div className="mr-3 rounded-lg bg-blue-50 p-2">
                <Briefcase className="text-blue-800" />
              </div>
              <div>
                <h5 className="m-0 font-semibold text-slate-800">Casos Recientes</h5>
                <p className="m-0 text-sm text-slate-500">Últimos casos actualizados</p>
              </div>
            </div>
            <button className="flex items-center text-sm text-blue-800 hover:underline">
              <span>Ver todos</span>
              <Eye size={16} className="ml-1" />
            </button>
          </div>
          <CasosRecientes casosIniciales={casosRecientes} />
        </Card>

        {/* Proceso de Liquidación */}
        <TimelineLiquidacion />
      </div>
    </>
  )
}