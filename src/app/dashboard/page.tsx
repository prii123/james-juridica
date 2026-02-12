import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <>
      {/* Header Section */}
      <div className="mb-8">
        <div className="bg-green-500 text-white p-4 rounded-lg shadow-lg mb-4 text-center font-bold text-lg animate-bounce">
          ✅ Testing Tailwind CSS! 🎉
        </div>
        <div className="bg-red-500 text-white p-2 rounded mb-2">Fondo Rojo</div>
        <div className="bg-blue-500 text-white p-2 rounded mb-2">Fondo Azul</div>
        <div className="bg-yellow-500 text-black p-2 rounded mb-4 font-bold">Fondo Amarillo</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <div className="flex items-center space-x-2 text-slate-600">
              <p>Bienvenido, <span className="font-semibold text-slate-700">{session?.user?.name}</span></p>
              <span className="text-slate-400">•</span>
              <p className="text-sm">{new Date().toLocaleDateString('es-CO', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all duration-200 transform hover:scale-105">
              Nuevo Caso
            </button>
            <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-2.5 rounded-lg shadow-sm font-medium transition-all duration-200">
              Ver Reportes
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Casos Activos */}
        <div className="group bg-gradient-to-br from-blue-50 to-white border border-blue-100 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-300">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +8.5%
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">Casos Activos</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">24</p>
            <p className="text-sm text-slate-500">+2 este mes</p>
          </div>
        </div>

        {/* Leads Nuevos */}
        <div className="group bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors duration-300">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex items-center text-green-600 text-sm font-medium">
              <ArrowUpRight className="h-4 w-4 mr-1" />
              +33.3%
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">Leads Nuevos</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">12</p>
            <p className="text-sm text-slate-500">+4 esta semana</p>
          </div>
        </div>

        {/* Audiencias Próximas */}
        <div className="group bg-gradient-to-br from-amber-50 to-white border border-amber-100 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors duration-300">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex items-center text-amber-600 text-sm font-medium">
              <Clock className="h-4 w-4 mr-1" />
              Esta semana
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">Audiencias Próximas</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">8</p>
            <p className="text-sm text-slate-500">3 programadas hoy</p>
          </div>
        </div>

        {/* Por Cobrar */}
        <div className="group bg-gradient-to-br from-red-50 to-white border border-red-100 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 hover:border-red-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors duration-300">
              <CreditCard className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex items-center text-red-600 text-sm font-medium">
              <ArrowDownRight className="h-4 w-4 mr-1" />
              -12%
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-1">Por Cobrar</h3>
            <p className="text-3xl font-bold text-slate-900 mb-1">$45M</p>
            <p className="text-sm text-red-500 font-medium">$12M vencido</p>
          </div>
        </div>
      </div>

      {/* Secciones Principales */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Casos Recientes */}
        <div className="xl:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Casos Recientes</h3>
                    <p className="text-sm text-slate-500">Últimos casos actualizados</p>
                  </div>
                </div>
                <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors duration-200">
                  <span>Ver todos</span>
                  <Eye className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
            
            <div className="divide-y divide-slate-100">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-6 py-4 hover:bg-slate-50 transition-colors duration-200 group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                          CASO-2026-{1000 + i}
                        </p>
                        <div className="flex items-center space-x-3 mt-1">
                          <p className="text-sm text-slate-600">Reorganización Empresarial</p>
                          <span className="text-slate-300">•</span>
                          <p className="text-xs text-slate-500">Actualizado hace 2h</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                        Activo
                      </span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">$2.5M</p>
                        <p className="text-xs text-slate-500">Valor del caso</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tareas Pendientes y Estadísticas */}
        <div className="space-y-6">
          {/* Tareas Pendientes */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Tareas Pendientes</h3>
                  <p className="text-sm text-slate-500">Próximas a vencer</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {[
                { task: "Derecho de Petición", date: "15/02/2026", priority: "high", color: "red" },
                { task: "Respuesta Juzgado", date: "18/02/2026", priority: "medium", color: "amber" },
                { task: "Audiencia Preliminar", date: "22/02/2026", priority: "high", color: "red" },
                { task: "Presentar Recurso", date: "25/02/2026", priority: "low", color: "green" },
                { task: "Revisión Contrato", date: "28/02/2026", priority: "medium", color: "amber" }
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors duration-200 group">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.color === 'red' ? 'bg-red-400' : 
                      item.color === 'amber' ? 'bg-amber-400' : 
                      'bg-green-400'
                    }`}></div>
                    <div>
                      <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                        {item.task}
                      </p>
                      <p className="text-sm text-slate-500">Vence: {item.date}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                    item.color === 'red' ? 'bg-red-100 text-red-800 border border-red-200' :
                    item.color === 'amber' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-green-100 text-green-800 border border-green-200'
                  }`}>
                    {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Media' : 'Baja'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas Rápidas */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen del Mes</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Eficiencia Casos</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-gradient-to-r from-green-400 to-green-500"></div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Tareas Completadas</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-gradient-to-r from-blue-400 to-blue-500"></div>
                  </div>
                  <span className="text-sm font-semibold text-blue-600">73%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Satisfacción Cliente</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="w-11/12 h-full bg-gradient-to-r from-purple-400 to-purple-500"></div>
                  </div>
                  <span className="text-sm font-semibold text-purple-600">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}