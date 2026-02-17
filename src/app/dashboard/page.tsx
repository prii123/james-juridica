import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import CasosRecientes from '@/components/CasosRecientes'
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
        valorDeuda: true,
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
      {/* Ya no necesitamos espaciador aquí, se maneja globalmente en AppLayout */}
      <div className="page-header-spacing">
        <h1 className="h2 fw-bold text-dark">Dashboard</h1>
        <p className="text-muted">Resumen ejecutivo de tu firma jurídica</p>
      </div>



      {/* Métricas Principales */}
      <div className="row g-4 mb-4">
        {/* Casos Activos */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100" style={{borderLeft: '4px solid #1e40af'}}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="p-2 rounded" style={{backgroundColor: '#eff6ff'}}>
                  <Briefcase style={{color: '#1e40af'}} />
                </div>
                <div className="d-flex align-items-center fw-medium small" style={{color: stats.casos.growthDirection === 'up' ? '#0f766e' : '#dc2626'}}>
                  {stats.casos.growthDirection === 'up' ? <ArrowUpRight className="me-1" /> : <ArrowDownRight className="me-1" />}
                  {stats.casos.growthDirection === 'up' ? '+' : ''}{stats.casos.growth}%
                </div>
              </div>
              <h6 className="card-title text-muted text-uppercase small mb-1">Casos Activos</h6>
              <h2 className="card-text fw-bold mb-1" style={{color: '#1e40af'}}>{stats.casos.activos}</h2>
              <p className="card-text text-muted small">+{stats.casos.thisMonth} este mes</p>
            </div>
          </div>
        </div>

        {/* Leads Nuevos */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100" style={{borderLeft: '4px solid #0f766e'}}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="p-2 rounded" style={{backgroundColor: '#f0fdfa'}}>
                  <Users style={{color: '#0f766e'}} />
                </div>
                <div className="d-flex align-items-center fw-medium small" style={{color: stats.leads.growthDirection === 'up' ? '#0f766e' : '#dc2626'}}>
                  {stats.leads.growthDirection === 'up' ? <ArrowUpRight className="me-1" /> : <ArrowDownRight className="me-1" />}
                  {stats.leads.growthDirection === 'up' ? '+' : ''}{stats.leads.growth}%
                </div>
              </div>
              <h6 className="card-title text-muted text-uppercase small mb-1">Leads Nuevos</h6>
              <h2 className="card-text fw-bold mb-1" style={{color: '#0f766e'}}>{stats.leads.total}</h2>
              <p className="card-text text-muted small">+{stats.leads.thisWeek} esta semana</p>
            </div>
          </div>
        </div>

        {/* Audiencias Próximas */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100" style={{borderLeft: '4px solid #0369a1'}}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="p-2 rounded" style={{backgroundColor: '#f0f9ff'}}>
                  <Calendar style={{color: '#0369a1'}} />
                </div>
                <div className="d-flex align-items-center fw-medium small" style={{color: '#64748b'}}>
                  <Clock className="me-1" />
                  {stats.audiencias.thisWeekLabel}
                </div>
              </div>
              <h6 className="card-title text-muted text-uppercase small mb-1">Audiencias Próximas</h6>
              <h2 className="card-text fw-bold mb-1" style={{color: '#0369a1'}}>{stats.audiencias.proximas}</h2>
              <p className="card-text text-muted small">{stats.audiencias.hoy} programadas hoy</p>
            </div>
          </div>
        </div>

        {/* Por Cobrar */}
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card h-100" style={{borderLeft: '4px solid #64748b'}}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="p-2 rounded" style={{backgroundColor: '#f8fafc'}}>
                  <CreditCard style={{color: '#64748b'}} />
                </div>
                <div className="d-flex align-items-center fw-medium small" style={{color: '#dc2626'}}>
                  {stats.cartera.growthDirection === 'up' ? <ArrowUpRight className="me-1" /> : <ArrowDownRight className="me-1" />}
                  {stats.cartera.growth}%
                </div>
              </div>
              <h6 className="card-title text-muted text-uppercase small mb-1">Por Cobrar</h6>
              <h2 className="card-text fw-bold mb-1" style={{color: '#64748b'}}>{formatCurrency(stats.cartera.totalPendiente)}</h2>
              <p className="card-text fw-medium small" style={{color: '#dc2626'}}>{formatCurrency(stats.cartera.totalVencido)} vencido</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones Principales */}
      <div className="row g-4">
        {/* Casos Recientes */}
        <div className="col-12 col-xl-8">
          <div className="card">
            <div className="card-header" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0'}}>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <div className="p-2 rounded me-3" style={{backgroundColor: '#eff6ff'}}>
                    <Briefcase style={{color: '#1e40af'}} />
                  </div>
                  <div>
                    <h5 className="card-title mb-0" style={{color: '#1e293b'}}>Casos Recientes</h5>
                    <p className="card-subtitle text-muted small mb-0">Últimos casos actualizados</p>
                  </div>
                </div>
                <button className="btn btn-link p-0" style={{color: '#1e40af', textDecoration: 'none'}}>
                  <span>Ver todos</span>
                  <Eye className="ms-1" />
                </button>
              </div>
            </div>
            <div className="list-group list-group-flush">
              <CasosRecientes casosIniciales={casosRecientes} />
            </div>
          </div>
        </div>

        {/* Tareas Pendientes y Estadísticas */}
        <div className="col-12 col-xl-4">
          {/* Tareas Pendientes */}
          <div className="card mb-4">
            <div className="card-header" style={{background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '1px solid #e2e8f0'}}>
              <div className="d-flex align-items-center">
                <div className="p-2 rounded me-3" style={{backgroundColor: '#f0f9ff'}}>
                  <Clock style={{color: '#0369a1'}} />
                </div>
                <div>
                  <h5 className="card-title mb-0" style={{color: '#1e293b'}}>Tareas Pendientes</h5>
                  <p className="card-subtitle text-muted small mb-0">Próximas a vencer</p>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {[
                { task: "Derecho de Petición", date: "15/02/2026", priority: "high", color: "#dc2626", bgColor: "#fef2f2" },
                { task: "Respuesta Juzgado", date: "18/02/2026", priority: "medium", color: "#0369a1", bgColor: "#f0f9ff" },
                { task: "Audiencia Preliminar", date: "22/02/2026", priority: "high", color: "#dc2626", bgColor: "#fef2f2" },
                { task: "Presentar Recurso", date: "25/02/2026", priority: "low", color: "#0f766e", bgColor: "#f0fdfa" },
                { task: "Revisión Contrato", date: "28/02/2026", priority: "medium", color: "#0369a1", bgColor: "#f0f9ff" }
              ].map((item, i) => (
                <div key={i} className="d-flex justify-content-between align-items-center p-3 border-bottom">
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle me-3" style={{width: '12px', height: '12px', backgroundColor: item.color}}></div>
                    <div>
                      <p className="fw-medium mb-0" style={{color: '#1e293b'}}>
                        {item.task}
                      </p>
                      <p className="small text-muted mb-0">Vence: {item.date}</p>
                    </div>
                  </div>
                  <span className="badge" style={{
                    backgroundColor: item.bgColor, 
                    color: item.color, 
                    border: `1px solid ${item.color}20`
                  }}>
                    {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              ))}
            </div>
        </div>

          {/* Estadísticas Rápidas */}
          {/* <div className="card">
            <div className="card-body">
              <h5 className="card-title" style={{color: '#1e293b'}}>Resumen del Mes</h5>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Eficiencia Casos</span>
                  <span className="small fw-semibold" style={{color: '#0f766e'}}>85%</span>
                </div>
                <div className="progress" style={{height: '8px', backgroundColor: '#f1f5f9'}}>
                  <div className="progress-bar" style={{width: '85%', backgroundColor: '#0f766e'}}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Tareas Completadas</span>
                  <span className="small fw-semibold" style={{color: '#1e40af'}}>73%</span>
                </div>
                <div className="progress" style={{height: '8px', backgroundColor: '#f1f5f9'}}>
                  <div className="progress-bar" style={{width: '73%', backgroundColor: '#1e40af'}}></div>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted">Satisfacción Cliente</span>
                  <span className="small fw-semibold" style={{color: '#0369a1'}}>92%</span>
                </div>
                <div className="progress" style={{height: '8px', backgroundColor: '#f1f5f9'}}>
                  <div className="progress-bar" style={{width: '92%', backgroundColor: '#0369a1'}}></div>
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </>
  )
}